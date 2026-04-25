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
    const { scenario, culpritId, npcPrompts } = await this.llm.generateSessionScenario();
    this.logger.log(`Scenario generated. Culprit is: ${culpritId}`);

    // 2. Yeni Session Oluştur
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        scenario,
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
    return session;
  }
}
