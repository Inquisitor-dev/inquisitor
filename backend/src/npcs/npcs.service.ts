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
        session: true, // Senaryoya ulaşmak için
      },
    });

    // Durum yoksa ve NPC varsa, state oluştur (ilk etkileşim - ama artık session oluşurken yapılıyor, yinede fallback olarak kalsın)
    if (!state) {
      const npc = await this.prisma.npc.findUnique({ where: { id: npcId } });
      const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
      if (!npc || !session) throw new NotFoundException('NPC veya Session bulunamadı.');
      
      state = await this.prisma.sessionNpcState.create({
        data: {
          sessionId,
          npcId,
          currentFear: npc.baseFear,
          lieTendency: npc.baseLie,
          dynamicPrompt: "You are a villager. You know nothing.",
        },
        include: { npc: true, session: true },
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

    const isGreetingSignal = userMessage === '__NEW_DAY_GREETING__';

    // 3. User mesajını DB'ye kaydet (selamlama sinyali hariç)
    if (!isGreetingSignal) {
      await this.prisma.dialogueHistory.create({
        data: {
          sessionId,
          npcId,
          speaker: 'PLAYER',
          message: userMessage,
          dayNumber: state.session.currentDay,
        },
      });
    }

    // 4. LLM API'ye sor
    const currentState = state!;
    let combinedPrompt = `${currentState.npc.basePrompt}\n\nINCIDENT SCENARIO:\n${currentState.session.scenario}\n\nYOUR PERSONAL SECRET/ROLE IN THIS:\n${currentState.dynamicPrompt}`;

    if (currentState.npc.id === 'church') {
      const warrantInfo = currentState.session.issuedWarrant 
        ? '\n\nSYSTEM: You have already granted a search warrant in this session. Do NOT grant another.' 
        : '\n\nSYSTEM: You have NOT granted any search warrant yet. You can grant one if the player asks convincingly.';
      combinedPrompt += warrantInfo;
    }

    // Yeni gün mü kontrol et
    const todayHistory = historyData.filter((h) => h.dayNumber === state.session.currentDay);
    const isNewDay = isGreetingSignal || (historyData.length > 0 && todayHistory.length === 0);

    // Selamlama sinyaliyse LLM'e geçirilen mesajı değiştir
    const effectiveMessage = isGreetingSignal
      ? '[Engizisyoncu içeri giriyor. Sen onları daha önce gördün. Yeni güne uygun bir şekilde selamla.]'
      : userMessage;

    const llmResponse = await this.llm.generateNpcResponse(
      currentState.npc.name,
      combinedPrompt,
      chatHistory,
      effectiveMessage,
      isNewDay,
    );

    let finalReply = llmResponse.reply;
    let grantedWarrant = null;
    
    // Check for warrant tag
    const warrantMatch = finalReply.match(/\[GRANT_WARRANT:\s*([a-zA-Z0-9_]+)\]/i);
    if (warrantMatch) {
      grantedWarrant = warrantMatch[1];
      finalReply = finalReply.replace(warrantMatch[0], '').trim();
      
      // Update session if not already granted
      if (!currentState.session.issuedWarrant) {
        await this.prisma.gameSession.update({
          where: { id: sessionId },
          data: { issuedWarrant: grantedWarrant, isWarrantUsed: false }
        });
      } else {
        // Zaten izin vermiş, bu tagi yoksay
        grantedWarrant = null;
      }
    }

    // 5. NPC'nin cevabını DB'ye kaydet (selamlama da kaydedilsin ki geçmişte görünsün)
    await this.prisma.dialogueHistory.create({
      data: {
        sessionId,
        npcId,
        speaker: 'NPC',
        message: finalReply,
        dayNumber: state.session.currentDay,
      },
    });

    return {
      reply: finalReply,
      grantedWarrant,
    };
  }

  async getNpcHistory(sessionId: string, npcId: string) {
    const state = await this.prisma.sessionNpcState.findUnique({
      where: {
        sessionId_npcId: { sessionId, npcId },
      },
      include: {
        npc: true,
        session: true,
      },
    });

    const currentDay = state?.session?.currentDay || 1;

    // Sadece bugüne ait diyalog geçmişini getir
    const historyData = await this.prisma.dialogueHistory.findMany({
      where: { sessionId, npcId, dayNumber: currentDay },
      orderBy: { createdAt: 'asc' },
    });

    // Sadece bugüne ait oyuncu mesajı sayısını hesapla
    const totalDialoguesUsed = await this.prisma.dialogueHistory.count({
      where: { sessionId, speaker: 'PLAYER', dayNumber: currentDay }
    });

    return {
      history: historyData.map((h) => ({
        role: h.speaker === 'PLAYER' ? 'player' : 'npc',
        text: h.message,
        timestamp: h.createdAt,
      })),
      dialoguesUsed: totalDialoguesUsed,
      currentDay: currentDay
    };
  }
}
