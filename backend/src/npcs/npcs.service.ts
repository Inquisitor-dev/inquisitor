import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class NpcsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async interact(sessionId: string, npcId: string, userMessage: string) {
    // 1. NPC'yi ve Session Npc State'ini bul
    let state = await this.prisma.sessionNpcState.findUnique({
      where: {
        sessionId_npcId: { sessionId, npcId },
      },
      include: {
        npc: true,
      },
    });

    // Durum yoksa ve NPC varsa, state oluştur (ilk etkileşim)
    if (!state) {
      const npc = await this.prisma.npc.findUnique({ where: { id: npcId } });
      if (!npc) throw new NotFoundException('NPC bulunamadı.');
      
      state = await this.prisma.sessionNpcState.create({
        data: {
          sessionId,
          npcId,
          currentFear: npc.baseFear,
          lieTendency: npc.baseLie,
        },
        include: { npc: true },
      });
    }

    // 2. Geçmiş diyalogları getir (Sadece bu NPC ile)
    const historyData = await this.prisma.dialogueHistory.findMany({
      where: { sessionId, npcId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Sadece son 10 konuşmayı hatırlasın (Performans ve token sınırı için)
    });

    const chatHistory = historyData.map((h) => ({
      role: h.speaker === 'PLAYER' ? 'user' : 'assistant',
      content: h.message,
    })) as { role: 'user' | 'assistant'; content: string }[];

    // 3. User mesajını DB'ye kaydet
    await this.prisma.dialogueHistory.create({
      data: {
        sessionId,
        npcId,
        speaker: 'PLAYER',
        message: userMessage,
      },
    });

    // 4. LLM API'ye sor
    const llmResponse = await this.llm.generateNpcResponse(
      state.npc.name,
      state.npc.basePrompt,
      state.currentFear,
      state.lieTendency,
      chatHistory,
      userMessage,
    );

    // 5. NPC'nin cevabını DB'ye kaydet
    await this.prisma.dialogueHistory.create({
      data: {
        sessionId,
        npcId,
        speaker: 'NPC',
        message: llmResponse.reply,
      },
    });

    // 6. NPC State'ini güncelle
    let newFear = state.currentFear + llmResponse.fearChange;
    let newLie = state.lieTendency + llmResponse.lieTendencyChange;

    // Sınırlandırmalar: 0 ile 10 arasında tutuyoruz
    newFear = Math.max(0, Math.min(10, newFear));
    newLie = Math.max(0, Math.min(10, newLie));

    await this.prisma.sessionNpcState.update({
      where: { id: state.id },
      data: {
        currentFear: newFear,
        lieTendency: newLie,
      },
    });

    return {
      reply: llmResponse.reply,
      newState: {
        fear: newFear,
        lie: newLie,
      },
    };
  }

  async getNpcHistory(sessionId: string, npcId: string) {
    const state = await this.prisma.sessionNpcState.findUnique({
      where: {
        sessionId_npcId: { sessionId, npcId },
      },
      include: {
        npc: true,
      },
    });

    const historyData = await this.prisma.dialogueHistory.findMany({
      where: { sessionId, npcId },
      orderBy: { createdAt: 'asc' },
    });

    // Toplam oturum boyunca kullanıcının gönderdiği mesaj sayısını hesapla
    const totalDialoguesUsed = await this.prisma.dialogueHistory.count({
      where: { sessionId, speaker: 'PLAYER' }
    });

    return {
      state: state
        ? { fear: state.currentFear, lie: state.lieTendency }
        : null,
      history: historyData.map((h) => ({
        role: h.speaker === 'PLAYER' ? 'player' : 'npc',
        text: h.message,
        timestamp: h.createdAt,
      })),
      baseNpc: state ? { baseFear: state.npc.baseFear, baseLie: state.npc.baseLie } : null,
      dialoguesUsed: totalDialoguesUsed
    };
  }
}
