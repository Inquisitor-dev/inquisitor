import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts } from '../scenarios/case-setup';
import { findOwnedSession } from '../game-sessions/session-access';
import {
  applyVerdicts,
  BoardCard,
  BoardEvidence,
  BoardState,
  describeJudged,
  EMPTY_BOARD_THOUGHT,
  judgeBoard,
  judgePending,
  NOTHING_NEW_THOUGHT,
  waitingThought,
  parseStoredBoard,
  sanitizeBoard,
  templateThought,
} from './board';

const EMPTY_BOARD: BoardState = { cards: [], strings: [] };
// Yapay zekâya giden kanıt alıntısının uzunluğu
const EXCERPT_LENGTH = 90;

import { parseAbilityState } from '../abilities/abilities';
import {
  canThinkAgain,
  thoughtLimit,
  thoughtsToday,
} from '../abilities/ability-effects';

type OwnedSession = Awaited<ReturnType<typeof findOwnedSession>>;

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  // Düşün günde bir kez (Derin Tefekkür'lü Ak Turna günde iki kez); gece de olsa
  private canThink(session: OwnedSession) {
    return (
      session.status === 'ACTIVE' &&
      canThinkAgain(
        session.characterId,
        parseAbilityState(session.abilityState),
        session.boardThoughtDay,
        session.currentDay,
      )
    );
  }

  private suspectIds(session: OwnedSession) {
    return getScenarioConfig(
      session.scenarioType,
      session.difficulty,
    ).npcDefinitions.map((npc) => npc.id);
  }

  private loadEvidence(sessionId: string): Promise<BoardEvidence[]> {
    return this.prisma.evidence.findMany({
      where: { sessionId },
      select: {
        id: true,
        kind: true,
        category: true,
        sourceId: true,
        text: true,
      },
    });
  }

  async getBoard(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    return {
      board: parseStoredBoard(session.boardState) ?? EMPTY_BOARD,
      // Vakadaki şüpheliler (zorluğa göre sayıları değişir); panonun çekmecesinde görünür
      suspects: this.suspectIds(session),
      thought: session.boardThought,
      canThink: this.canThink(session),
    };
  }

  async saveBoard(sessionId: string, userId: string, input: unknown) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const evidence = await this.loadEvidence(sessionId);
    const board = sanitizeBoard(input, {
      suspectIds: this.suspectIds(session),
      evidenceIds: evidence.map((e) => e.id),
      previous: parseStoredBoard(session.boardState),
    });
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { boardState: board as unknown as Prisma.InputJsonValue },
    });
    return { board };
  }

  // Veri Sızdırma (Kızıl Devre): tek bir ipin kararını verir. Diğer iplerin önceki kararları
  // korunur. Panoyu yazmaz; kaydı ve günün "Düşün" hakkını AbilitiesService işler.
  async leakString(session: OwnedSession, stringId: string, input?: unknown) {
    const facts = session.caseFacts as unknown as CaseFacts | null;
    if (!facts) {
      throw new BadRequestException('Bu vakada pano değerlendirilemiyor.');
    }
    const evidence = await this.loadEvidence(session.id);
    const previous = parseStoredBoard(session.boardState);
    const board =
      input === undefined
        ? (previous ?? EMPTY_BOARD)
        : sanitizeBoard(input, {
            suspectIds: this.suspectIds(session),
            evidenceIds: evidence.map((e) => e.id),
            previous,
          });

    const target = board.strings.find((s) => s.id === stringId);
    if (!target) throw new BadRequestException('Panoda böyle bir ip yok.');
    const [judged] = judgeBoard(
      { cards: board.cards, strings: [target] },
      facts,
      evidence,
    );
    if (!judged) {
      throw new BadRequestException(
        'Bu ip değerlendirilemez; bir şüpheliyle bir kanıtı ya da iki kanıtı anlamlı bir bağla birleştirmelisin.',
      );
    }

    const leaked: BoardState = {
      cards: board.cards,
      strings: board.strings.map((s) =>
        s.id === stringId ? { ...s, verdict: judged.verdict } : s,
      ),
    };
    return { board: leaked, verdict: judged.verdict };
  }

  // İpleri vaka gerçeklerine göre değerlendirir ve dedektifin iç sesini döndürür
  async think(sessionId: string, userId: string, input?: unknown) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }
    if (!this.canThink(session)) {
      throw new BadRequestException(
        'Bugün panoya yeterince baktın. Yarın yeniden düşünebilirsin.',
      );
    }
    const facts = session.caseFacts as unknown as CaseFacts | null;
    if (!facts) {
      throw new BadRequestException('Bu vakada pano değerlendirilemiyor.');
    }

    const evidence = await this.loadEvidence(sessionId);
    const previous = parseStoredBoard(session.boardState);
    // İstemci son hâlini gönderdiyse onunla düşünülür (kaydedilmemiş son değişiklik kaybolmasın)
    const board =
      input === undefined
        ? (previous ?? EMPTY_BOARD)
        : sanitizeBoard(input, {
            suspectIds: this.suspectIds(session),
            evidenceIds: evidence.map((e) => e.id),
            previous,
          });

    // Yalnızca henüz karar almamış ipler, en fazla MAX_STRINGS_PER_THOUGHT tanesi değerlendirilir
    const { judged, waiting } = judgePending(board, facts, evidence);
    // Değerlendirilecek yeni bağ yoksa günün düşünme hakkı harcanmaz
    if (judged.length === 0) {
      const hasSealed = board.strings.some((s) => s.verdict);
      return {
        board,
        thought: hasSealed ? NOTHING_NEW_THOUGHT : EMPTY_BOARD_THOUGHT,
        canThink: true,
        waiting: 0,
      };
    }

    const scenarioType = session.scenarioType;
    const config = getScenarioConfig(scenarioType, session.difficulty);
    const nameOf = (id: string) =>
      config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
    const evidenceById = new Map(evidence.map((e) => [e.id, e]));
    const labelOf = (card: BoardCard, withExcerpt: boolean) => {
      if (card.kind === 'suspect') return nameOf(card.refId ?? '');
      const e = card.refId ? evidenceById.get(card.refId) : undefined;
      if (!e) return 'Not';
      const base =
        e.kind === 'CONFESSION'
          ? `İtiraf: ${nameOf(e.sourceId)}`
          : e.category === 'STATEMENT'
            ? `Tanıklık: ${nameOf(e.sourceId)}`
            : e.sourceId === 'crime_scene'
              ? 'Olay yeri izi'
              : `Kanıt (${getLocalizedLocationLabel(scenarioType, e.sourceId)})`;
      if (!withExcerpt) return base;
      const excerpt =
        e.text.length > EXCERPT_LENGTH
          ? `${e.text.slice(0, EXCERPT_LENGTH)}…`
          : e.text;
      return `${base} – ${excerpt}`;
    };

    const shortLines = describeJudged(judged, (card) => labelOf(card, false));
    let thought: string;
    if (session.isTestMode) {
      thought = `[Test Düşüncesi] ${templateThought(shortLines)}`;
    } else {
      const llmText = await this.llm.generateBoardThought(
        describeJudged(judged, (card) => labelOf(card, true)),
        scenarioType,
        session.id,
      );
      thought = llmText ?? templateThought(shortLines);
    }
    if (waiting > 0) thought = `${thought} ${waitingThought(waiting)}`;

    const judgedBoard = applyVerdicts(board, judged);
    const abilityState = parseAbilityState(session.abilityState);
    const thinkCount =
      thoughtsToday(abilityState, session.boardThoughtDay, session.currentDay) +
      1;
    const nextState = {
      ...abilityState,
      thoughts: { day: session.currentDay, count: thinkCount },
    };
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        boardState: judgedBoard as unknown as Prisma.InputJsonValue,
        boardThought: thought,
        boardThoughtDay: session.currentDay,
        abilityState: nextState as unknown as Prisma.InputJsonValue,
      },
    });
    this.logger.log(
      `Board thought for ${sessionId}: ${judged.filter((j) => j.verdict === 'CORRECT').length}/${judged.length} correct`,
    );

    return {
      board: judgedBoard,
      thought,
      canThink: thinkCount < thoughtLimit(session.characterId),
      // Sırada bekleyen, bu düşünüşte değerlendirilmeyen ipler
      waiting,
    };
  }
}
