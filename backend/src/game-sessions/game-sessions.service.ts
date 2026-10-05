import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { CaseFacts, CasePlan, planCase } from '../scenarios/case-setup';
import { ScenarioDraft } from '../llm/llm.service';
import { findOwnedSession, toPublicSession } from './session-access';

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async createSession(
    userId: string = 'demo-user-001',
    difficulty: string = 'easy',
    scenarioType: string = 'medieval',
    testMode = false,
  ) {
    this.logger.log(
      `Creating new ${testMode ? 'TEST (no AI)' : 'dynamic'} session for user: ${userId} (difficulty: ${difficulty}, scenario: ${scenarioType})`,
    );

    const scenarioConfig = getScenarioConfig(scenarioType, difficulty);
    const allowedNpcIds = scenarioConfig.npcDefinitions.map((npc) => npc.id);

    // Suçlu, cinayet tarzı, olay yerinin görünüşü, ipucu ve doğrulayan kanıt kodla belirlenir
    const plan = planCase(scenarioConfig, difficulty);
    const { culpritId } = plan;

    this.logger.log(
      `Case planned. Culprit: ${culpritId}, style: ${plan.murderStyle}, scene: ${plan.sceneState}, ` +
        `clue: ${plan.crimeSceneClue.authentic ? `genuine (${plan.crimeSceneClue.poolClueId})` : `planted -> ${plan.crimeSceneClue.implicatedNpcIds.join(',')}`}, ` +
        `verification: ${plan.verification.kind}/${plan.verification.placement.type}`,
    );

    const draft: ScenarioDraft = testMode
      ? this.buildTestScenario(scenarioConfig, plan)
      : await this.llm.generateSessionScenario(difficulty, scenarioType, plan);
    const { scenario, truthReveal, npcPrompts, locationClues } = draft;
    const caseFacts = this.buildCaseFacts(plan, draft);

    this.logger.log(`Scenario generated. Culprit is confirmed: ${culpritId}`);

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
        userId,
        difficulty,
        scenarioType,
        scenario,
        truthReveal,
        locationClues,
        culpritId,
        caseFacts: caseFacts as unknown as Prisma.InputJsonValue,
        status: 'ACTIVE',
        isTestMode: testMode,
      },
    });

    const npcs = await this.prisma.npc.findMany();

    for (const npc of npcs) {
      const isMainNpc = allowedNpcIds.includes(npc.id);
      const isNarrator =
        npc.id.startsWith('narrator_') &&
        scenarioConfig.locationDefinitions.some((location) => npc.id === `narrator_${location.id}`);

      if (!isMainNpc && !isNarrator) continue;

      const dynamicPrompt = npcPrompts[npc.id] || 'No dynamic prompt generated.';

      await this.prisma.sessionNpcState.create({
        data: {
          sessionId: session.id,
          npcId: npc.id,
          currentFear: npc.baseFear,
          lieTendency: npc.baseLie,
          dynamicPrompt,
        },
      });
    }

    this.logger.log(`Session ${session.id} fully created and populated (difficulty: ${difficulty}).`);
    return toPublicSession(session);
  }

  // Vaka gerçekleri: kodun planı + yapay zekânın yazdığı ayrıntılar. Kanıt Defteri ve
  // Hüküm Dosyası bu kayda göre çalışacak; aktif oturumda oyuncuya gönderilmez.
  private buildCaseFacts(plan: CasePlan, draft: ScenarioDraft): CaseFacts {
    return {
      ...plan,
      version: 1,
      crimeSceneClueText: draft.locationClues?.crime_scene ?? plan.crimeSceneClue.poolClueText ?? '',
      verificationText: draft.verificationText ?? '',
      victim: draft.victim ?? { name: '', profession: '' },
      alibis: Object.fromEntries(plan.innocentIds.map((id) => [id, draft.alibis?.[id] ?? ''])),
    };
  }

  // Test modu: yapay zekâ çağrılmadan, plana uyan yer tutucu bir vaka kurar
  private buildTestScenario(
    scenarioConfig: ReturnType<typeof getScenarioConfig>,
    plan: CasePlan,
  ): ScenarioDraft {
    const name = (id: string) =>
      scenarioConfig.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
    const sceneText = plan.sceneState === 'MESSY' ? 'Olay yeri dağınık.' : 'Olay yeri düzenli.';
    const clueText = plan.crimeSceneClue.authentic
      ? plan.crimeSceneClue.poolClueText
      : `${plan.crimeSceneClue.implicatedNpcIds.map(name).join(' ve ')} ile bağlantılı bir eşya (tuzak).`;
    const { placement } = plan.verification;
    const verificationText = `[TEST MODU] ${plan.verification.kind === 'CORROBORATION' ? 'İzi doğrulayan' : 'Tuzağı ele veren'} kanıt: ${
      placement.type === 'LOCATION' ? `${placement.locationId} mekânında` : `${name(placement.npcId)} tanıklığında`
    }.`;

    const locationClues: Record<string, string> = {};
    for (const location of scenarioConfig.locationDefinitions) {
      locationClues[location.id] =
        location.id === 'crime_scene'
          ? `[TEST MODU] ${sceneText} ${clueText}`
          : placement.type === 'LOCATION' && placement.locationId === location.id
            ? verificationText
            : `[TEST MODU] ${location.id} için yer tutucu ipucu.`;
    }

    return {
      scenario: '[TEST MODU] Bu oturum yapay zekâ kullanılmadan oluşturuldu; hikâye üretilmedi.',
      truthReveal: `[TEST MODU] Katil ${name(plan.culpritId)}. ${verificationText}`,
      culpritId: plan.culpritId,
      npcPrompts: {},
      locationClues,
      victim: { name: 'Test Kurbanı', profession: 'Yer tutucu' },
      verificationText,
      alibis: Object.fromEntries(
        plan.innocentIds.map((id) => [id, `[TEST MODU] ${name(id)} cinayet saatinde başka yerdeydi.`]),
      ),
    };
  }

  async endDay(sessionId: string, userId: string) {
    this.logger.log(`Ending day for session: ${sessionId}`);

    await findOwnedSession(this.prisma, sessionId, userId);
    const session = await this.prisma.gameSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { npcStates: true },
    });

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentDay: session.currentDay + 1,
        timeOfDay: 0,
      },
    });

    for (const state of session.npcStates) {
      const newFear = Math.max(0, state.currentFear - 1);
      await this.prisma.sessionNpcState.update({
        where: { id: state.id },
        data: { currentFear: newFear },
      });
    }

    return toPublicSession(updatedSession);
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

  async condemnNpc(sessionId: string, userId: string, npcId: string) {
    this.logger.log(`Condemning NPC: ${npcId} for session: ${sessionId}`);

    const session = await findOwnedSession(this.prisma, sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma zaten sona erdi.');
    }

    const won = session.culpritId === npcId;
    const newStatus = won ? 'WON' : 'LOST';

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: newStatus },
    });

    return {
      success: true,
      won,
      culpritId: session.culpritId,
      message: won ? 'Doğru kişiyi buldun! Adalet yerini buldu.' : 'Masum birini mahkûm ettin.',
      session: updatedSession,
    };
  }

  async consumeWarrant(sessionId: string, userId: string, location: string) {
    this.logger.log(`Consuming warrant for ${location} in session: ${sessionId}`);

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
