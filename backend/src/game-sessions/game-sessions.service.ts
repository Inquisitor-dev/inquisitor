import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async createSession(userId: string = 'demo-user-001') {
    this.logger.log(`Creating new dynamic session for user: ${userId}`);

    // 1. LLM'den Senaryo Üret
    const { scenario, truthReveal, culpritId, npcPrompts, locationClues } = await this.llm.generateSessionScenario();
    this.logger.log(`Scenario generated. Culprit is: ${culpritId}`);

    // 2. Yeni Session Oluştur
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        scenario,
        truthReveal,
        locationClues,
        culpritId,
        status: 'ACTIVE',
      },
    });

    // 3. NPC'lerin başlangıç state'lerini (fear, lie) ve dynamic prompt'larını kaydet
    const npcs = await this.prisma.npc.findMany();
    
    for (const npc of npcs) {
      const dynamicPrompt = npcPrompts[npc.id] || "No dynamic prompt generated.";
      
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

    this.logger.log(`Session ${session.id} fully created and populated.`);
    const { truthReveal: _, ...safeSession } = session;
    return safeSession;
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

    // Günü 1 artır, timeOfDay'i sıfırla
    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { 
        currentDay: session.currentDay + 1,
        timeOfDay: 0 
      },
    });

    // Her NPC'nin korkusunu 1 azalt (0'ın altına düşmesin)
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
    if (newTime > 4) newTime = 4; // Gece'yi geçmesin

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
      message: won ? 'Doğru kişiyi buldunuz! Adalet yerini buldu.' : 'Masum birini mahkum ettiniz.',
      session: updatedSession,
    };
  }

  async consumeWarrant(sessionId: string) {
    this.logger.log(`Consuming warrant for session: ${sessionId}`);
    
    return await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { isWarrantUsed: true },
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
      message: 'Zamanınız doldu.',
      session: updatedSession,
    };
  }
}
