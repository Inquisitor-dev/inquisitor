import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { SCENARIO_CLUES } from '../scenarios/clues-config';
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

    const culpritId = allowedNpcIds[Math.floor(Math.random() * allowedNpcIds.length)];
    const isHurried = Math.random() < 0.6;
    const murderStyle = isHurried ? 'HURRIED' : 'PLANNED';

    const allClues = SCENARIO_CLUES[scenarioConfig.scenarioType];

    const validClues = allClues.filter(c => 
      isHurried ? c.associatedNpcIds.includes(culpritId) : !c.associatedNpcIds.includes(culpritId)
    );

    const selectedClue = validClues.length > 0 
      ? validClues[Math.floor(Math.random() * validClues.length)]
      : allClues[0];

    this.logger.log(`Deterministically selected Culprit: ${culpritId}, Style: ${murderStyle}, Clue: ${selectedClue.id}`);

    const { scenario, truthReveal, npcPrompts, locationClues } = testMode
      ? this.buildTestScenario(scenarioConfig, culpritId, selectedClue.clueText)
      : await this.llm.generateSessionScenario(difficulty, scenarioType, culpritId, murderStyle, selectedClue.clueText);

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

  // Test modu: yapay zeka çağrılmadan, senaryo ayarlarından basit bir yer tutucu hikaye kurar
  private buildTestScenario(
    scenarioConfig: ReturnType<typeof getScenarioConfig>,
    culpritId: string,
    crimeSceneClueText: string,
  ) {
    const culprit = scenarioConfig.npcDefinitions.find((npc) => npc.id === culpritId);
    const locationClues: Record<string, string> = {};
    for (const location of scenarioConfig.locationDefinitions) {
      if (location.id === 'crime_scene') continue;
      locationClues[location.id] = `[TEST MODU] ${location.id} icin yer tutucu ipucu.`;
    }

    return {
      scenario: `[TEST MODU] Bu oturum yapay zeka kullanmadan olusturuldu. Hikaye uretilmedi. Olay yeri izi: ${crimeSceneClueText}`,
      truthReveal: `[TEST MODU] Sucluyu rastgele secilen ${culprit?.name ?? culpritId} oldugu varsayildi.`,
      npcPrompts: {} as Record<string, string>,
      locationClues,
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
      throw new BadRequestException('Bu sorusturma zaten sona erdi.');
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
      message: won ? 'Doğru kişiyi buldunuz! Adalet yerini buldu.' : 'Masum birini mahkum ettiniz.',
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
      message: 'Zamanınız doldu.',
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
