import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  findOwnedSession,
  toPublicSession,
} from '../game-sessions/session-access';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts } from '../scenarios/case-setup';
import { fearBand, fearThresholdOf } from '../npcs/fear';

const caseFactsOf = (session: { caseFacts: unknown }) =>
  session.caseFacts as Partial<CaseFacts> | null;
import { appendToNotes, recordEvidence } from '../npcs/evidence-recorder';
import { EVIDENCE_TAG, evidenceFromTags } from '../npcs/evidence';
import { warrantLimitOf } from '../scenarios/wildcards';
import {
  AbilityDef,
  AbilityState,
  abilitiesFor,
  availability,
  findAbility,
  parseAbilityState,
  recordUse,
} from './abilities';
import {
  hasUntoldStatement,
  informantLocation,
  pulseReport,
  quotesAbout,
  threatenedFear,
} from './ability-effects';
import { UseAbilityDto } from './dto/use-ability.dto';
import { LlmService } from '../llm/llm.service';
import { BoardService } from '../board/board.service';
import type { BoardState, BoardVerdict } from '../board/board';
import type { Contradiction } from '../llm/prompts/contradiction-prompt.builder';

type OwnedSession = Awaited<ReturnType<typeof findOwnedSession>>;

// Yeteneğin oyuncuya dönen sonucu
export interface AbilityResult {
  message: string;
  notes?: string;
  fear?: { npcId: string; level: number; band: string };
  pulse?: { npcId: string; name: string; level: number; toThreshold: number }[];
  locationId?: string;
  // Keskin Göz: bulunup deftere geçen ipucu
  clue?: string;
  board?: BoardState;
  verdict?: BoardVerdict;
}

// Çelişki Taraması'nın baktığı en fazla cevap sayısı
const SCAN_REPLIES = 12;

// Test modunda yapay zekâ çağrılmaz: ilk ve son cevaptan yer tutucu bir madde
function testContradictions(replies: string[]): Contradiction[] {
  const head = (text: string) => text.slice(0, 40);
  return [
    {
      a: 1,
      b: replies.length,
      quoteA: head(replies[0]),
      quoteB: head(replies[replies.length - 1]),
      note: '[TEST MODU] Yer tutucu çelişki.',
    },
  ];
}

interface Applied {
  result: AbilityResult;
  state: AbilityState;
  data?: Prisma.GameSessionUpdateInput;
}

@Injectable()
export class AbilitiesService {
  private readonly logger = new Logger(AbilitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly board: BoardService,
  ) {}

  // Vakadaki karakterin yetenekleri ve şu an kullanılıp kullanılamayacakları
  async list(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    return {
      characterId: session.characterId,
      abilityState: parseAbilityState(session.abilityState),
      abilities: abilitiesFor(session.characterId).map((ability) => {
        const check = availability(session, ability);
        return {
          id: ability.id,
          name: ability.name,
          limit: ability.limit,
          target: ability.target,
          available: check.available,
          reason: check.available ? null : check.reason,
        };
      }),
    };
  }

  async use(sessionId: string, userId: string, dto: UseAbilityDto) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const ability = findAbility(dto.abilityId);
    if (!ability) throw new BadRequestException('Geçersiz yetenek.');
    const check = availability(session, ability);
    if (!check.available) throw new BadRequestException(check.reason);

    const applied = await this.apply(session, ability, dto);
    const state = recordUse(applied.state, ability.id, session.currentDay);
    const updated = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        ...applied.data,
        abilityState: state as unknown as Prisma.InputJsonValue,
      },
    });
    this.logger.log(
      `Ability ${ability.id} used in ${sessionId} (day ${session.currentDay})`,
    );

    return { session: toPublicSession(updated), result: applied.result };
  }

  private async apply(
    session: OwnedSession,
    ability: AbilityDef,
    dto: UseAbilityDto,
  ): Promise<Applied> {
    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    const state = parseAbilityState(session.abilityState);
    const day = session.currentDay;
    const nameOf = (id: string) =>
      config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
    const labelOf = (id: string) =>
      getLocalizedLocationLabel(session.scenarioType, id);

    const suspect = () => {
      const npcId = dto.npcId ?? '';
      if (!config.npcDefinitions.some((npc) => npc.id === npcId)) {
        throw new BadRequestException('Bu vakadaki şüphelilerden birini seç.');
      }
      return npcId;
    };
    const location = () => {
      const locationId = dto.locationId ?? '';
      if (
        locationId === 'crime_scene' ||
        !config.locationDefinitions.some((l) => l.id === locationId)
      ) {
        throw new BadRequestException('Bu vakadaki mekânlardan birini seç.');
      }
      return locationId;
    };

    switch (ability.id) {
      case 'threat': {
        const npcId = suspect();
        const npcState = await this.npcState(session.id, npcId);
        const threshold = fearThresholdOf(caseFactsOf(session), npcId);
        const level = threatenedFear(npcState.currentFear, threshold);
        if (level === npcState.currentFear) {
          throw new BadRequestException(
            `${nameOf(npcId)} zaten tehditle varılabilecek en yüksek korkuda. Bir kanıt göstermen gerek.`,
          );
        }
        await this.prisma.sessionNpcState.update({
          where: { id: npcState.id },
          data: { currentFear: level },
        });
        return {
          state,
          result: {
            message: `${nameOf(npcId)} tehdidini duydu; gözlerini kaçırıyor.`,
            fear: { npcId, level, band: fearBand(level, threshold) },
          },
        };
      }

      case 'pulse': {
        const fears = await this.prisma.sessionNpcState.findMany({
          where: { sessionId: session.id },
          select: { npcId: true, currentFear: true },
        });
        const suspectIds = config.npcDefinitions.map((npc) => npc.id);
        return {
          state,
          result: {
            message: 'Vizör tüm şüphelilerin nabzını ölçtü.',
            pulse: pulseReport(
              suspectIds,
              fears,
              Object.fromEntries(
                suspectIds.map((id) => [
                  id,
                  fearThresholdOf(caseFactsOf(session), id),
                ]),
              ),
            ).map((row) => ({
              ...row,
              name: nameOf(row.npcId),
            })),
          },
        };
      }

      case 'visor_lock': {
        const npcId = suspect();
        return {
          state: { ...state, visorLockNpcId: npcId },
          result: {
            message: `Vizör ${nameOf(npcId)} üzerine kilitlendi; korkusu geceleri azalmayacak.`,
          },
        };
      }

      case 'quiet_room': {
        const npcId = suspect();
        return {
          state: { ...state, quietRoom: { npcId, day } },
          result: {
            message: `${nameOf(npcId)} bugün seninle daha açık konuşacak.`,
          },
        };
      }

      case 'tracking': {
        const locationId = location();
        if (
          session.activeWarrants.includes(locationId) ||
          session.usedWarrants.includes(locationId)
        ) {
          throw new BadRequestException(
            'Bu mekân için zaten bir arama iznin var ya da orayı aradın.',
          );
        }
        // Yetenek ikna konuşmasını atlatır ama izin sınırını aşmaz: çözücü vakayı
        // 2 izinle çözülebilir kurar (scenarios/case-graph.ts); Hevesli Kadı'da sınır 3
        const warrantLimit = warrantLimitOf(session.caseFacts);
        if (session.warrantsIssued >= warrantLimit) {
          throw new BadRequestException(
            `Bu vakadaki ${warrantLimit} arama iznini de kullandın; iz sürmek yeni izin getirmez.`,
          );
        }
        return {
          state,
          data: {
            activeWarrants: [...session.activeWarrants, locationId],
            warrantsIssued: { increment: 1 },
          },
          result: {
            message: `${labelOf(locationId)} için iz buldun; orayı arayabilirsin.`,
            locationId,
          },
        };
      }

      case 'backstage': {
        const locationId = location();
        return {
          state,
          result: {
            message: `Kestirme yoldan ${labelOf(locationId)} mekânına girdin; zaman geçmedi.`,
            locationId,
          },
        };
      }

      case 'rooftop': {
        const locationId = location();
        return {
          state: {
            ...state,
            rooftop: { locationId, day },
            lostMorningDay: day + 1,
          },
          result: {
            message: `Çatılardan ${labelOf(locationId)} mekânına süzüldün. Yarın sabahı uykuda kaybedeceksin.`,
            locationId,
          },
        };
      }

      case 'archive_summary': {
        // Hakkında Söylenenler: seçilen kişi hakkında öteki şüphelilerin sana söyledikleri
        const npcId = suspect();
        const replies = await this.prisma.dialogueHistory.findMany({
          where: {
            sessionId: session.id,
            speaker: 'NPC',
            npcId: { not: npcId },
            NOT: { npcId: { startsWith: 'narrator_' } },
          },
          orderBy: { createdAt: 'asc' },
          select: { npcId: true, message: true },
        });
        const quotes = quotesAbout(replies, nameOf(npcId));
        if (quotes.length === 0)
          throw new BadRequestException(
            `Kimse sana henüz ${nameOf(npcId)} hakkında bir şey söylemedi.`,
          );
        const notes = await appendToNotes(this.prisma, session.id, [
          `[${day}. gün · Hakkında Söylenenler · ${nameOf(npcId)}]\n${quotes
            .map((q) => `${nameOf(q.npcId)}: “${q.quote}”`)
            .join('\n')}`,
        ]);
        return {
          state,
          result: {
            message: `${nameOf(npcId)} hakkında söylenenler defterine geçti.`,
            notes,
          },
        };
      }

      case 'informant': {
        const evidence = await this.prisma.evidence.findMany({
          where: { sessionId: session.id },
          select: { kind: true, sourceId: true },
        });
        const searched = new Set([
          ...session.usedWarrants,
          ...evidence.filter((e) => e.kind === 'CLUE').map((e) => e.sourceId),
        ]);
        const locationId = informantLocation({
          locationIds: config.locationDefinitions.map((l) => l.id),
          searched,
        });
        if (!locationId)
          throw new BadRequestException(
            'Aramadığın mekân kalmadı; muhbirin söyleyecek bir şeyi yok.',
          );
        const notes = await appendToNotes(this.prisma, session.id, [
          `[${day}. gün · Muhbir] ${labelOf(locationId)} mekânında işine yarayacak bir şey olduğu fısıldanıyor.`,
        ]);
        return {
          state,
          result: {
            message: `Muhbirin fısıldadı: ${labelOf(locationId)}.`,
            notes,
            locationId,
          },
        };
      }

      case 'contradiction_scan': {
        const npcId = suspect();
        const rows = await this.prisma.dialogueHistory.findMany({
          where: { sessionId: session.id, npcId, speaker: 'NPC' },
          orderBy: { createdAt: 'desc' },
          take: SCAN_REPLIES,
          select: { message: true },
        });
        const replies = rows.reverse().map((r) => r.message);
        if (replies.length < 2) {
          throw new BadRequestException(
            `${nameOf(npcId)} ile en az iki cevap alacak kadar konuşmalısın.`,
          );
        }
        const found = session.isTestMode
          ? testContradictions(replies)
          : await this.llm.findContradictions(
              nameOf(npcId),
              replies,
              session.scenarioType,
              session.id,
            );
        // Tarama yapılamadıysa hak harcanmaz
        if (!found) {
          throw new BadRequestException(
            'Cevapları şu an tarayamadın. Biraz sonra yeniden dene.',
          );
        }
        const body =
          found.length === 0
            ? 'Belirgin bir çelişki bulamadın.'
            : found
                .map((c) => `— “${c.quoteA}” / “${c.quoteB}”: ${c.note}`)
                .join('\n');
        const notes = await appendToNotes(this.prisma, session.id, [
          `[${day}. gün · Çelişki Taraması · ${nameOf(npcId)}]\n${body}`,
        ]);
        return {
          state,
          result: {
            message:
              found.length === 0
                ? `${nameOf(npcId)} kendi sözleriyle çelişmiyor gibi.`
                : `${nameOf(npcId)} için ${found.length} çelişki defterine geçti.`,
            notes,
          },
        };
      }

      case 'data_leak': {
        const leak = await this.board.leakString(
          session,
          dto.stringId ?? '',
          dto.board,
        );
        return {
          state,
          // O günün "Düşün" hakkı bu yeteneğin bedelidir
          data: {
            boardState: leak.board as unknown as Prisma.InputJsonValue,
            boardThoughtDay: day,
          },
          result: {
            message:
              leak.verdict === 'CORRECT'
                ? 'Sızan kayıtlar bu bağı doğruluyor.'
                : 'Sızan kayıtlar bu bağı doğrulamıyor.',
            board: leak.board,
            verdict: leak.verdict,
          },
        };
      }

      case 'dream_reading': {
        const evidence = await this.prisma.evidence.findMany({
          where: { sessionId: session.id },
          select: { kind: true, category: true, sourceId: true },
        });
        // Anlatılabilecek her ifade zaten defterdeyse rüya yeni bir şey vermez; hak harcanmaz
        if (
          !hasUntoldStatement(
            caseFactsOf(session),
            config.npcDefinitions.map((npc) => npc.id),
            evidence,
          )
        ) {
          throw new BadRequestException(
            'Rüyanın gösterebileceği her şey zaten defterinde.',
          );
        }
        // Sonuç tanık olsa da olmasa da aynıdır; kimse adlandırılmaz
        return {
          state: { ...state, dreamDay: day },
          result: {
            message:
              'Rüyanda gölgeler kıpırdadı. Bugün konuşacağın birini dikkatle dinle; sormasan da anlatabilir.',
          },
        };
      }

      case 'keen_eye': {
        const locationId = location();
        if (!session.activeWarrants.includes(locationId)) {
          throw new BadRequestException(
            `${labelOf(locationId)} için arama iznin yok.`,
          );
        }
        const existing = await this.prisma.evidence.findMany({
          where: { sessionId: session.id },
          select: { kind: true, sourceId: true },
        });
        const created = await recordEvidence(
          this.prisma,
          session.id,
          day,
          existing,
          evidenceFromTags({
            tags: new Set([EVIDENCE_TAG.clue]),
            npcId: null,
            locationId,
            culpritId: session.culpritId,
            caseFacts: (session.caseFacts ??
              null) as unknown as CaseFacts | null,
            locationClues: (session.locationClues ?? {}) as Record<
              string,
              string
            >,
          }),
        );
        if (created.length === 0) {
          throw new BadRequestException(
            `${labelOf(locationId)} mekânında aradığın ipucu zaten defterinde ya da bulunacak bir şey yok.`,
          );
        }
        return {
          state,
          // Arama yapılmış sayılır: izin harcanır
          data: {
            activeWarrants: session.activeWarrants.filter(
              (w) => w !== locationId,
            ),
            usedWarrants: [...session.usedWarrants, locationId],
          },
          result: {
            message: `Keskin gözün ${labelOf(locationId)} mekânında yerinden oynamış bir şey buldu.`,
            clue: created[0].text,
            locationId,
          },
        };
      }

      case 'verify_quote':
        throw new BadRequestException(
          'Teyit, sorgu ekranından bir şüphelinin sözüyle kullanılır.',
        );

      default:
        throw new BadRequestException('Bu yetenek henüz kullanılamıyor.');
    }
  }

  private async npcState(sessionId: string, npcId: string) {
    const npcState = await this.prisma.sessionNpcState.findUnique({
      where: { sessionId_npcId: { sessionId, npcId } },
    });
    if (!npcState) throw new BadRequestException('Bu şüpheli bu vakada yok.');
    return npcState;
  }
}
