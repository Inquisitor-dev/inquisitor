import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import {
  getScenarioConfig,
  normalizeScenarioType,
} from '../scenarios/scenario-config';
import { CaseFacts, CasePlan, planCase } from '../scenarios/case-setup';
import { ScenarioDraft } from '../llm/llm.service';
import { findOwnedSession, toPublicSession } from './session-access';
import { buildCaseFacts } from './case-facts';
import { startingFear } from '../npcs/fear';
import {
  CASE_DAYS,
  DEFAULT_CHARACTER_ID,
  lastDayOf,
  parseAbilityState,
} from '../abilities/abilities';
import { fearAfterNight, morningTimeOfDay } from '../abilities/ability-effects';

import { MarketService } from '../market/market.service';
import {
  INVOLVEMENT_LABELS,
  InvolvementKind,
  MOTIVE_LABELS,
  MOTIVES,
  TIME_OF_DEATH_LABELS,
  TIMES_OF_DEATH,
  WEAPONS,
} from '../scenarios/case-catalog';
import {
  MAX_NARRATIVE_LENGTH,
  MAX_REPORT_EVIDENCE,
  rewardMultiplier,
  ScoredVerdict,
  scoreVerdict,
  templateJudgement,
  VerdictReport,
  verdictFactLines,
} from './verdict/verdict-report';

import { StoryPoolService } from '../stories/story-pool.service';
import {
  StoryCriteria,
  StoryPackage,
  parseStoryPackage,
} from '../stories/story-package';

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly marketService?: MarketService,
    private readonly storyPoolService?: StoryPoolService,
  ) {}

  /**
   * Bir vakanın planını (CasePlan), gerçeklerini (CaseFacts) ve metinlerini (ScenarioDraft)
   * içeren bağımsız StoryPackage nesnesi üretir. Veritabanına yazmaz.
   * Ahmet'in toplu üretim komutu (stories:generate) ve canlı vaka kurulumu bu fonksiyonu çağırır.
   */
  async generateStoryPackage(
    scenarioType: string = 'medieval',
    difficulty: string = 'easy',
    options?: {
      testMode?: boolean;
      sessionId?: string;
      plan?: CasePlan;
    },
  ): Promise<StoryPackage> {
    const scenarioConfig = getScenarioConfig(scenarioType, difficulty);
    const plan = options?.plan ?? planCase(scenarioConfig, difficulty);
    const { culpritId } = plan;

    this.logger.log(
      `Case planned. Culprit: ${culpritId}, style: ${plan.murderStyle}, scene: ${plan.sceneState}, ` +
        `clue: ${plan.crimeSceneClue.authentic ? `genuine (${plan.crimeSceneClue.poolClueId})` : `planted -> ${plan.crimeSceneClue.implicatedNpcIds.join(',')}`}, ` +
        `verification: ${plan.verification.kind}/${plan.verification.placement.type}`,
    );

    const sessionId = options?.sessionId ?? randomUUID();
    const draft: ScenarioDraft = options?.testMode
      ? this.buildTestScenario(scenarioConfig, plan)
      : await this.llm.generateSessionScenario(
          difficulty,
          scenarioType,
          plan,
          sessionId,
        );

    const facts = buildCaseFacts(plan, draft);
    this.logger.log(`Scenario generated. Culprit is confirmed: ${culpritId}`);

    return {
      scenarioType,
      difficulty,
      wildcardCount: 0,
      gameMode: 'standard',
      plan,
      facts,
      draft,
    };
  }

  /**
   * Verilen StoryPackage nesnesinden oyundaki oturumu kurar (GameSession, SessionNpcState).
   * Hem canlı üretilen paketler hem de havuzdan seçilen paketler bu fonksiyonla başlatılır.
   */
  async setupSessionFromPackage(
    userId: string,
    pkg: StoryPackage,
    options?: {
      isTestMode?: boolean;
      characterId?: string;
      storyId?: string;
      sessionId?: string;
    },
  ) {
    const sessionId = options?.sessionId ?? randomUUID();
    const characterId = options?.characterId ?? DEFAULT_CHARACTER_ID;
    const isTestMode = Boolean(options?.isTestMode);
    const scenarioConfig = getScenarioConfig(pkg.scenarioType, pkg.difficulty);
    const allowedNpcIds = scenarioConfig.npcDefinitions.map((npc) => npc.id);

    await this.prisma.gameSession.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'LOST',
      },
    });

    const session = await this.prisma.gameSession.create({
      data: {
        id: sessionId,
        userId,
        difficulty: pkg.difficulty,
        scenarioType: pkg.scenarioType,
        scenario: pkg.draft.scenario,
        truthReveal: pkg.draft.truthReveal,
        locationClues: pkg.draft.locationClues,
        culpritId: pkg.plan.culpritId,
        caseFacts: pkg.facts as unknown as Prisma.InputJsonValue,
        status: 'ACTIVE',
        isTestMode,
        characterId,
        storyId: options?.storyId ?? null,
      },
    });

    const npcs = await this.prisma.npc.findMany();

    for (const npc of npcs) {
      const isMainNpc = allowedNpcIds.includes(npc.id);
      const isNarrator =
        npc.id.startsWith('narrator_') &&
        scenarioConfig.locationDefinitions.some(
          (location) => npc.id === `narrator_${location.id}`,
        );

      if (!isMainNpc && !isNarrator) continue;

      const dynamicPrompt =
        pkg.draft.npcPrompts?.[npc.id] || 'No dynamic prompt generated.';

      await this.prisma.sessionNpcState.create({
        data: {
          sessionId: session.id,
          npcId: npc.id,
          currentFear: startingFear(npc.baseFear),
          lieTendency: npc.baseLie,
          dynamicPrompt,
        },
      });
    }

    this.logger.log(
      `Session ${session.id} fully created and populated (difficulty: ${pkg.difficulty}, storyId: ${options?.storyId ?? 'live'}).`,
    );
    return toPublicSession(session);
  }

  async createSession(
    userId: string = 'demo-user-001',
    difficulty: string = 'easy',
    scenarioType: string = 'medieval',
    testMode = false,
    characterId: string = DEFAULT_CHARACTER_ID,
  ) {
    this.logger.log(
      `Creating new ${testMode ? 'TEST (no AI)' : 'dynamic'} session for user: ${userId} (difficulty: ${difficulty}, scenario: ${scenarioType}, character: ${characterId})`,
    );

    // 1. Havuz açıksa ve test modu değilse havuzdan hazır onaylı hikâye ara
    if (!testMode && this.isPoolEnabled()) {
      const pooled = await this.findAvailableStoryFromPool(userId, {
        universe: scenarioType,
        difficulty,
      });

      if (pooled) {
        this.logger.log(
          `[StoryPool] Using pooled story ${pooled.id} for user ${userId} (${scenarioType}/${difficulty}). SCENARIO call eliminated.`,
        );
        return this.setupSessionFromPackage(userId, pooled.package, {
          isTestMode: false,
          characterId,
          storyId: pooled.id,
        });
      }

      this.logger.warn(
        `[StoryPool] No unplayed approved story in pool for ${scenarioType}/${difficulty}. Falling back to live generation.`,
      );
    }

    // 2. Canlı üretim (veya test modu)
    const sessionId = randomUUID();
    const pkg = await this.generateStoryPackage(scenarioType, difficulty, {
      testMode,
      sessionId,
    });

    return this.setupSessionFromPackage(userId, pkg, {
      isTestMode: testMode,
      characterId,
      sessionId,
    });
  }

  private isPoolEnabled(): boolean {
    if (this.storyPoolService) {
      return this.storyPoolService.isPoolEnabled();
    }
    return process.env.STORY_POOL_ENABLED === 'true';
  }

  private async findAvailableStoryFromPool(
    userId: string,
    criteria: StoryCriteria,
  ): Promise<{ id: string; package: StoryPackage } | null> {
    if (this.storyPoolService) {
      return this.storyPoolService.findAvailableStory(userId, criteria);
    }
    if (!this.prisma.story) return null;

    const candidates = await this.prisma.story.findMany({
      where: {
        universe: criteria.universe,
        difficulty: criteria.difficulty,
        status: 'APPROVED',
        NOT: {
          sessions: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (candidates.length === 0) return null;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const story = await this.prisma.story.findUnique({
      where: { id: chosen.id },
    });
    if (!story) return null;
    try {
      return { id: story.id, package: parseStoryPackage(story.content) };
    } catch {
      return null;
    }
  }

  // Test modu: yapay zekâ çağrılmadan, plana uyan yer tutucu bir vaka kurar
  private buildTestScenario(
    scenarioConfig: ReturnType<typeof getScenarioConfig>,
    plan: CasePlan,
  ): ScenarioDraft {
    const name = (id: string) =>
      scenarioConfig.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
    const sceneLabel =
      getScenarioConfig(
        scenarioConfig.scenarioType,
        undefined,
        plan.crimeSceneId,
      ).crimeScene?.label ?? 'Olay yeri';
    const sceneText = `${sceneLabel} ${plan.sceneState === 'MESSY' ? 'dağınık' : 'düzenli'}.`;
    const clueText = plan.crimeSceneClue.authentic
      ? plan.crimeSceneClue.poolClueText
      : `${plan.crimeSceneClue.implicatedNpcIds.map(name).join(' ve ')} ile bağlantılı bir eşya (tuzak).`;
    const { placement } = plan.verification;
    const verificationText = `[TEST MODU] ${plan.verification.kind === 'CORROBORATION' ? 'İzi doğrulayan' : 'Tuzağı ele veren'} kanıt: ${
      placement.type === 'LOCATION'
        ? `${placement.locationId} mekânında`
        : `${name(placement.npcId)} tanıklığında`
    }.`;

    const locationClues: Record<string, string> = {};
    for (const location of scenarioConfig.locationDefinitions) {
      locationClues[location.id] =
        location.id === 'crime_scene'
          ? `[TEST MODU] ${sceneText} ${clueText}`
          : placement.type === 'LOCATION' &&
              placement.locationId === location.id
            ? verificationText
            : `[TEST MODU] ${location.id} için yer tutucu ipucu.`;
    }

    return {
      scenario: `[TEST MODU] Bu oturum yapay zekâ kullanılmadan oluşturuldu; hikâye üretilmedi. Ceset ${sceneLabel} mekânında bulundu.`,
      truthReveal: `[TEST MODU] Katil ${name(plan.culpritId)}. ${verificationText}`,
      culpritId: plan.culpritId,
      npcPrompts: {},
      locationClues,
      victim: { name: 'Test Kurbanı', profession: 'Yer tutucu' },
      verificationText,
      alibis: Object.fromEntries(
        plan.innocentIds.map((id) => [
          id,
          `[TEST MODU] ${name(id)} cinayet saatinde başka yerdeydi.`,
        ]),
      ),
      // Yanılabilen tanıklık: tarifin uyduğu şüpheliler test modunda açıkça yazılır
      witnessDescription: plan.verification.witnessDescriptionFits
        ? `[TEST MODU] eşkâl: ${plan.verification.witnessDescriptionFits.map(name).join(' ya da ')}`
        : undefined,
    };
  }

  async endDay(sessionId: string, userId: string) {
    this.logger.log(`Ending day for session: ${sessionId}`);

    await findOwnedSession(this.prisma, sessionId, userId);
    const session = await this.prisma.gameSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { npcStates: true },
    });
    // Son günden sonra gün yoktur: hüküm verilir (vaka uzunluğu sunucuda, İkinci Nefes uzatabilir)
    if (session.currentDay >= lastDayOf(session.abilityState)) {
      throw new BadRequestException(
        'Soruşturmanın son günündesin; hükmünü ver.',
      );
    }
    return toPublicSession(await this.advanceDay(session));
  }

  // Günü kapatır: ertesi günün sabahı başlar, korku gece azalır (Vizör Kilidi hariç)
  private async advanceDay(
    session: Prisma.GameSessionGetPayload<{ include: { npcStates: true } }>,
  ) {
    const abilityState = parseAbilityState(session.abilityState);
    const nextDay = session.currentDay + 1;
    const updatedSession = await this.prisma.gameSession.update({
      where: { id: session.id },
      data: {
        currentDay: nextDay,
        // Çatı Geçişi kullanıldıysa ertesi günün sabahı kaybedilir
        timeOfDay: morningTimeOfDay(abilityState, nextDay),
      },
    });

    for (const state of session.npcStates) {
      // Vizör Kilidi'ndeki şüphelinin korkusu gece azalmaz
      const newFear = fearAfterNight(
        state.npcId,
        state.currentFear,
        abilityState,
      );
      await this.prisma.sessionNpcState.update({
        where: { id: state.id },
        data: { currentFear: newFear },
      });
    }
    return updatedSession;
  }

  async advanceTime(sessionId: string, userId: string) {
    this.logger.log(`Advancing time for session: ${sessionId}`);

    const session = await findOwnedSession(this.prisma, sessionId, userId);

    let newTime = session.timeOfDay + 1;
    if (newTime > 4) newTime = 4;

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { timeOfDay: newTime },
    });

    return toPublicSession(updatedSession);
  }

  async getSession(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    return toPublicSession(session);
  }

  async updateNotes(sessionId: string, userId: string, notes: string) {
    await findOwnedSession(this.prisma, sessionId, userId);
    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { notes },
    });
    return toPublicSession(updatedSession);
  }

  async condemnNpc(
    sessionId: string,
    userId: string,
    npcId: string,
    report?: VerdictReport,
  ) {
    this.logger.log(`Condemning NPC: ${npcId} for session: ${sessionId}`);

    const session = await findOwnedSession(this.prisma, sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma zaten sona erdi.');
    }

    const abilityState = parseAbilityState(session.abilityState);
    if (abilityState.secondBreath?.clearedNpcId === npcId) {
      throw new BadRequestException(
        'Bu kişinin masum olduğu zaten ortaya çıktı.',
      );
    }

    const won = session.culpritId === npcId;

    // İkinci Nefes (Yeşim Hekim): vakadaki ilk yanlış hüküm vakayı bitirmez. Mahkûm edilen kişi
    // aklanır ve gün kapanır; son günde verildiyse vaka bir gün uzar. Cevapta suçlu yoktur.
    if (
      !won &&
      session.characterId === 'yesim_hekim' &&
      !abilityState.secondBreath
    ) {
      const full = await this.prisma.gameSession.findUniqueOrThrow({
        where: { id: sessionId },
        include: { npcStates: true },
      });
      const extended = session.currentDay >= CASE_DAYS;
      await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          abilityState: {
            ...abilityState,
            secondBreath: { clearedNpcId: npcId, extended },
          },
        },
      });
      const advanced = await this.advanceDay(full);
      const next = await this.prisma.gameSession.findUniqueOrThrow({
        where: { id: advanced.id },
      });
      return {
        success: true,
        won: false,
        spared: true,
        clearedNpcId: npcId,
        message: extended
          ? 'Yanılmışsın: bu kişi masum. İkinci Nefes sana bir gün daha tanıdı.'
          : 'Yanılmışsın: bu kişi masum. İkinci Nefes ile soruşturma sürüyor.',
        session: toPublicSession(next),
        reward: null,
      };
    }

    const newStatus = won ? 'WON' : 'LOST';

    // Hüküm Dosyası: rapor gelmişse puanlanır (eski istemciler yalnızca katili gönderir)
    const verdict = report
      ? await this.scoreVerdictReport(session, report)
      : null;

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        ...(verdict
          ? {
              verdictReport: {
                condemnedNpcId: npcId,
                report,
                verdict,
              } as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    let reward: Record<string, unknown> | null = null;
    if (won && this.marketService) {
      try {
        reward = (await this.marketService.awardCaseReward(
          userId,
          session.id,
          session.currentDay,
          {
            halved: !!abilityState.secondBreath,
            multiplier: verdict ? rewardMultiplier(verdict.total) : 1,
          },
        )) as Record<string, unknown>;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error awarding case reward: ${msg}`);
      }
    }

    return {
      success: true,
      won,
      culpritId: session.culpritId,
      message: won
        ? 'Doğru kişiyi buldun! Adalet yerini buldu.'
        : 'Masum birini mahkûm ettin.',
      session: updatedSession,
      reward,
      verdict,
    };
  }

  // Raporu vaka gerçekleriyle puanlar; olay anlatımını yapay zekâ hakem değerlendirir.
  // Gerçekleri olmayan çok eski vakalarda null döner.
  private async scoreVerdictReport(
    session: {
      id: string;
      scenarioType: string;
      difficulty: string;
      caseFacts: Prisma.JsonValue;
      truthReveal: string | null;
      isTestMode: boolean;
    },
    report: VerdictReport,
  ): Promise<ScoredVerdict | null> {
    const facts = session.caseFacts as unknown as CaseFacts | null;
    if (!facts?.culpritId) return null;

    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    const nameOf = (id: string) =>
      config.npcDefinitions.find((n) => n.id === id)?.name ?? id;
    const evidence = await this.prisma.evidence.findMany({
      where: { sessionId: session.id },
      select: {
        id: true,
        kind: true,
        category: true,
        sourceId: true,
        text: true,
      },
    });

    const narrative = report.narrative?.trim() ?? '';
    let judgement: { score: number; comment: string } | null = null;
    if (narrative) {
      judgement = session.isTestMode
        ? templateJudgement(facts, session.scenarioType, nameOf, narrative)
        : await this.llm.judgeVerdictNarrative(
            {
              scenarioType: session.scenarioType,
              truthReveal: session.truthReveal ?? '',
              factLines: verdictFactLines(facts, session.scenarioType, nameOf),
            },
            narrative,
            session.id,
          );
    }

    return scoreVerdict({
      facts,
      scenarioType: session.scenarioType,
      report,
      evidence,
      nameOf,
      narrativeScore: judgement?.score ?? null,
      judgeComment: judgement?.comment || undefined,
    });
  }

  async consumeWarrant(sessionId: string, userId: string, location: string) {
    this.logger.log(
      `Consuming warrant for ${location} in session: ${sessionId}`,
    );

    const session = await findOwnedSession(this.prisma, sessionId, userId);

    const newActive = session.activeWarrants.filter((w) => w !== location);
    const newUsed = [...session.usedWarrants];
    if (!newUsed.includes(location)) newUsed.push(location);

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        activeWarrants: newActive,
        usedWarrants: newUsed,
      },
    });
    return toPublicSession(updatedSession);
  }

  async timeoutSession(sessionId: string, userId: string) {
    this.logger.log(`Session timed out: ${sessionId}`);

    const session = await findOwnedSession(this.prisma, sessionId, userId);
    // Bitmiş bir oturumun sonucu (ör. kazanılmış vaka) sonradan kayba çevrilemez
    const updatedSession =
      session.status === 'ACTIVE'
        ? await this.prisma.gameSession.update({
            where: { id: sessionId },
            data: { status: 'LOST' },
          })
        : session;

    return {
      success: true,
      won: updatedSession.status === 'WON',
      message: 'Süren doldu.',
      session: updatedSession,
    };
  }

  // Kanıt Defteri: oyuncunun bu vakada bulduğu kanıtlar (sadece oturumun sahibine)
  // Hüküm Dosyası formunun seçenekleri. Hiçbiri vakanın cevabını söylemez: silahlar evrenin bütün
  // listesidir, alanların varlığı yalnızca vakanın v2 olup olmadığını gösterir.
  async getVerdictOptions(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const facts = session.caseFacts as unknown as Partial<CaseFacts> | null;
    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    return {
      suspects: config.npcDefinitions.map((n) => ({
        id: n.id,
        name: n.name,
        role: n.role,
      })),
      weapons: facts?.weaponId
        ? WEAPONS[normalizeScenarioType(session.scenarioType)].map((w) => ({
            id: w.id,
            label: w.label,
          }))
        : [],
      motives: facts?.motive
        ? MOTIVES.map((id) => ({ id, label: MOTIVE_LABELS[id] }))
        : [],
      timesOfDeath: facts?.timeOfDeath
        ? TIMES_OF_DEATH.map((id) => ({ id, label: TIME_OF_DEATH_LABELS[id] }))
        : [],
      involvementKinds: facts?.involvements?.length
        ? (Object.keys(INVOLVEMENT_LABELS) as InvolvementKind[]).map((id) => ({
            id,
            label: INVOLVEMENT_LABELS[id],
          }))
        : [],
      limits: {
        evidence: MAX_REPORT_EVIDENCE,
        narrative: MAX_NARRATIVE_LENGTH,
      },
    };
  }

  async getEvidence(sessionId: string, userId: string) {
    await findOwnedSession(this.prisma, sessionId, userId);
    return this.prisma.evidence.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        kind: true,
        category: true,
        sourceId: true,
        text: true,
        dayNumber: true,
        createdAt: true,
      },
    });
  }

  async findActiveSession(userId: string) {
    this.logger.log(`Looking for active session for user: ${userId}`);

    const session = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) return null;

    return toPublicSession(session);
  }
}
