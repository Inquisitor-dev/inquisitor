import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class NpcsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) { }

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
    let combinedPrompt = `${currentState.npc.basePrompt}\n\nINCIDENT SCENARIO:\n${currentState.session.scenario}\n\n`;

    if (currentState.npc.id.startsWith('narrator_')) {
      combinedPrompt += `THE ABSOLUTE TRUTH OF WHAT HAPPENED:
${currentState.session.truthReveal}

INVESTIGATION RULES FOR NARRATOR:
1. The player is searching the environment.
2. If the player makes a GENERAL search ("I look around", "What is here?", "I investigate the tavern"), describe ONLY the general atmosphere and surface-level objects. DO NOT reveal any hidden clues or secrets.
3. If the player searches a SPECIFIC object or specific area ("I check under the rug", "I inspect the bookshelf", "I examine the body's hands"), and if a clue would logically be hidden there based on the TRUTH, THEN describe a SUBTLE physical clue (e.g. a torn piece of cloth, a faint footprint, a missing ring).
4. Do NOT make it easy. Do NOT reveal clues unless the player explicitly investigates the exact spot where evidence would be left. If they search the wrong spot, say there is nothing unusual.
5. NEVER state the killer's name directly as a fact of the environment. You only describe physical evidence. Leave the deduction to the player.
6. DO NOT use cliché or obvious professional clues (like flour for a miller). Make the clues highly subtle and cryptic.
7. NEVER state the victim's name. Refer to them as 'the victim' or 'the body' to maintain mystery.`;
    } else {
      combinedPrompt += `YOUR PERSONAL SECRET/ROLE IN THIS:\n${currentState.dynamicPrompt}`;
    }

    if (currentState.npc.id === 'church') {
      const issuedCount = currentState.session.warrantsIssued;
      const activeCount = currentState.session.activeWarrants.length;
      const remaining = 2 - issuedCount;
      
      let warrantInfo = `\n\n[SYSTEM - SEARCH WARRANT STATUS]:
- Total Warrants Issued in Session: ${issuedCount}/2
- Currently Active Warrants: ${activeCount > 0 ? currentState.session.activeWarrants.join(', ') : 'None'}
- Remaining Warrants You Can Grant: ${remaining}`;

      if (remaining > 0) {
        warrantInfo += `\n\nIMPORTANT: You ARE ALLOWED to grant up to ${remaining} more search warrant(s) now. You can grant one or even two at once if the player asks for multiple locations convincingly. To grant, use [GRANT_WARRANT: location] tags. You can use multiple tags like [GRANT_WARRANT: tavern] [GRANT_WARRANT: mill].`;
      } else {
        warrantInfo += `\n\nIMPORTANT: You have reached the limit of 2 warrants. Do NOT grant any more.`;
      }
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

    // Check for warrant tags
    const warrantMatches = Array.from(finalReply.matchAll(/\[GRANT_WARRANT:\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\]/gi));
    let newlyGranted: string[] = [];

    if (warrantMatches.length > 0) {
      let issuedCount = currentState.session.warrantsIssued;
      
      for (const match of warrantMatches) {
        if (issuedCount < 2) {
          const loc = match[1];
          // Zaten aktif olan veya kullanılmış olan bir yer için tekrar verme
          if (!currentState.session.activeWarrants.includes(loc) && !currentState.session.usedWarrants.includes(loc)) {
            newlyGranted.push(loc);
            issuedCount++;
          }
        }
        finalReply = finalReply.replace(match[0], '').trim();
      }

      if (newlyGranted.length > 0) {
        await this.prisma.gameSession.update({
          where: { id: sessionId },
          data: {
            activeWarrants: [...currentState.session.activeWarrants, ...newlyGranted],
            warrantsIssued: { increment: newlyGranted.length }
          }
        });
      }
    }

    // Geriye dönük uyumluluk ve UI için grantedWarrant (ilkini dönelim)
    let grantedWarrant = newlyGranted.length > 0 ? newlyGranted[0] : null;

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
