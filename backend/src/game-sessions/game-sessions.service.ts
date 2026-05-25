import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { SCENARIO_CLUES } from '../scenarios/clues-config';

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async createSession(userId: string = 'demo-user-001', difficulty: string = 'easy', scenarioType: string = 'medieval') {
    this.logger.log(`Creating new dynamic session for user: ${userId} (difficulty: ${difficulty}, scenario: ${scenarioType})`);

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

    const { scenario, truthReveal, npcPrompts, locationClues } =
      await this.llm.generateSessionScenario(difficulty, scenarioType, culpritId, murderStyle, selectedClue.clueText);

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
    return session;
  }

  async endDay(sessionId: string) {
    this.logger.log(`Ending day for session: ${sessionId}`);

    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { npcStates: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

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

    return updatedSession;
  }

  async advanceTime(sessionId: string) {
    this.logger.log(`Advancing time for session: ${sessionId}`);

    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    let newTime = session.timeOfDay + 1;
    if (newTime > 4) newTime = 4;

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { timeOfDay: newTime },
    });

    return updatedSession;
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new Error('Session not found');

    if (session.status === 'ACTIVE') {
      const { truthReveal, locationClues, ...safeSession } = session;
      return safeSession;
    }
    return session;
  }

  async updateNotes(sessionId: string, notes: string) {
    return await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { notes },
    });
  }

  async condemnNpc(sessionId: string, npcId: string) {
    this.logger.log(`Condemning NPC: ${npcId} for session: ${sessionId}`);

    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error('Session not found');
    if (session.status !== 'ACTIVE') throw new Error('Session is already finished');

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
      message: won ? 'DoÄŸru kiÅŸiyi buldunuz! Adalet yerini buldu.' : 'Masum birini mahkum ettiniz.',
      session: updatedSession,
    };
  }

  async consumeWarrant(sessionId: string, location: string) {
    this.logger.log(`Consuming warrant for ${location} in session: ${sessionId}`);

    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    const newActive = session.activeWarrants.filter((w) => w !== location);
    const newUsed = [...session.usedWarrants];
    if (!newUsed.includes(location)) newUsed.push(location);

    return await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        activeWarrants: newActive,
        usedWarrants: newUsed,
      },
    });
  }

  async timeoutSession(sessionId: string) {
    this.logger.log(`Session timed out: ${sessionId}`);

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: 'LOST' },
    });

    return {
      success: true,
      won: false,
      message: 'ZamanÄ±nÄ±z doldu.',
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

    const { truthReveal, locationClues, ...safeSession } = session;
    return safeSession;
  }
}
