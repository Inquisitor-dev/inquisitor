import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getScenarioConfig } from '../scenarios/scenario-config';

@Injectable()
export class NpcsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async interact(sessionId: string, npcId: string, userMessage: string) {
    let state = await this.prisma.sessionNpcState.findUnique({
      where: {
        sessionId_npcId: { sessionId, npcId },
      },
      include: {
        npc: true,
        session: true,
      },
    });

    if (!state) {
      const npc = await this.prisma.npc.findUnique({ where: { id: npcId } });
      const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
      if (!npc || !session) throw new NotFoundException('NPC veya Session bulunamadÄ±.');

      state = await this.prisma.sessionNpcState.create({
        data: {
          sessionId,
          npcId,
          currentFear: npc.baseFear,
          lieTendency: npc.baseLie,
          dynamicPrompt: 'You are a villager. You know nothing.',
        },
        include: { npc: true, session: true },
      });
    }

    const historyData = await this.prisma.dialogueHistory.findMany({
      where: { sessionId, npcId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const chatHistory = historyData.map((h) => ({
      role: h.speaker === 'PLAYER' ? 'user' : 'assistant',
      content: h.message,
    })) as { role: 'user' | 'assistant'; content: string }[];

    const isGreetingSignal = userMessage === '__NEW_DAY_GREETING__';

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

    const currentState = state;
    const scenarioConfig = getScenarioConfig(currentState.session.scenarioType, currentState.session.difficulty);
    const canonicalNpc = scenarioConfig.npcDefinitions.find((npc) => npc.id === currentState.npc.id);
    const canonicalLocations = scenarioConfig.locationDefinitions;
    const canonicalLocationIds = canonicalLocations
      .filter((location) => location.id !== 'crime_scene')
      .map((location) => location.id);
    const locationListText = canonicalLocations
      .map((location) => `- ${location.id}: ${location.name} (${location.description})`)
      .join('\n');
    const rosterText = scenarioConfig.npcDefinitions
      .map((npc) => `- ${npc.id}: ${npc.name} (${npc.role})`)
      .join('\n');

    let combinedPrompt = `SETTING: ${scenarioConfig.settingLabel}

CANONICAL LOCATIONS:
${locationListText}

CANONICAL CAST:
${rosterText}

INCIDENT SCENARIO:
${currentState.session.scenario}

STRICT CANON RULES:
1. You must stay faithful to the canonical cast and canonical locations above.
2. Do NOT invent new named jobs, workplaces, businesses, districts, or landmarks.
3. Do NOT claim to have a different profession, workplace, or identity than the one assigned to you.
4. If you mention a place, prefer the canonical location names above.
`;

    const isNarrator = currentState.npc.id.startsWith('narrator_');

    if (isNarrator) {
      const narratedLocationId = currentState.npc.id.replace('narrator_', '');
      const narratedLocation = canonicalLocations.find((location) => location.id === narratedLocationId);

      combinedPrompt += `
NARRATOR ROLE:
You are the objective environment narrator for ${narratedLocation?.name ?? narratedLocationId}.

THE ABSOLUTE TRUTH OF WHAT HAPPENED:
${currentState.session.truthReveal}

INVESTIGATION RULES FOR NARRATOR:
1. The player is searching the environment.
2. If the player makes a GENERAL search, describe ONLY the general atmosphere and surface-level objects. DO NOT reveal hidden clues or secrets.
3. If the player searches a SPECIFIC object or area, and if a clue would logically be hidden there based on the TRUTH, THEN describe a subtle physical clue.
4. Do NOT make it easy. If they search the wrong spot, say there is nothing unusual.
5. NEVER state the killer's name directly as a fact of the environment. You only describe physical evidence.
6. Do NOT use clichÃ© or obvious professional clues. Make the clues subtle and cryptic.
7. NEVER state the victim's name. Refer to them as 'the victim' or 'the body' to maintain mystery.`;
    } else {
      combinedPrompt += `
PUBLIC IDENTITY:
You are ${canonicalNpc?.name ?? currentState.npc.name}.
Your public role is ${canonicalNpc?.role ?? currentState.npc.description}.
${canonicalNpc?.personaPrompt ?? currentState.npc.basePrompt}

YOUR PERSONAL SECRET/ROLE IN THIS:
${currentState.dynamicPrompt}`;
    }

    const isWarrantIssuer =
      (currentState.session.scenarioType === 'medieval' && currentState.npc.id === 'church') ||
      ((currentState.session.scenarioType === 'modern' || currentState.session.scenarioType === 'cyberpunk') &&
        currentState.npc.id === 'tavern');

    if (isWarrantIssuer) {
      const issuedCount = currentState.session.warrantsIssued;
      const activeCount = currentState.session.activeWarrants.length;
      const remaining = 2 - issuedCount;

      let warrantInfo = `\n\n[SYSTEM - SEARCH WARRANT STATUS]:
- Total Warrants Issued in Session: ${issuedCount}/2
- Currently Active Warrants: ${activeCount > 0 ? currentState.session.activeWarrants.join(', ') : 'None'}
- Remaining Warrants You Can Grant: ${remaining}
- Canonical Searchable Location IDs: ${canonicalLocationIds.join(', ')}`;

      if (remaining > 0) {
        warrantInfo += `\n\nIMPORTANT: You ARE ALLOWED to grant up to ${remaining} more search warrant(s) now. Only grant warrants for canonical location IDs from this list: ${canonicalLocationIds.join(', ')}. To grant, use [GRANT_WARRANT: location_id] tags.`;
      } else {
        warrantInfo += `\n\nIMPORTANT: You have reached the limit of 2 warrants. Do NOT grant any more.`;
      }
      combinedPrompt += warrantInfo;
    }

    const todayHistory = historyData.filter((h) => h.dayNumber === state.session.currentDay);
    const isNewDay = isGreetingSignal || (historyData.length > 0 && todayHistory.length === 0);

    const effectiveMessage = isGreetingSignal
      ? '[Engizisyoncu iÃ§eri giriyor. Sen onlarÄ± daha Ã¶nce gÃ¶rdÃ¼n. Yeni gÃ¼ne uygun bir ÅŸekilde selamla.]'
      : userMessage;

    const llmResponse = await this.llm.generateNpcResponse(
      canonicalNpc?.name ?? currentState.npc.name,
      combinedPrompt,
      chatHistory,
      effectiveMessage,
      isNewDay,
    );

    let finalReply = llmResponse.reply;

    const warrantMatches = Array.from(finalReply.matchAll(/\[GRANT_WARRANT:\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\]/gi));
    const newlyGranted: string[] = [];

    if (warrantMatches.length > 0) {
      let issuedCount = currentState.session.warrantsIssued;

      for (const match of warrantMatches) {
        if (issuedCount < 2) {
          const loc = match[1];
          if (
            canonicalLocationIds.includes(loc) &&
            !currentState.session.activeWarrants.includes(loc) &&
            !currentState.session.usedWarrants.includes(loc)
          ) {
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
            warrantsIssued: { increment: newlyGranted.length },
          },
        });
      }
    }

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
      grantedWarrants: newlyGranted,
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

    const historyData = await this.prisma.dialogueHistory.findMany({
      where: { sessionId, npcId, dayNumber: currentDay },
      orderBy: { createdAt: 'asc' },
    });

    const totalDialoguesUsed = await this.prisma.dialogueHistory.count({
      where: { sessionId, speaker: 'PLAYER', dayNumber: currentDay },
    });

    return {
      history: historyData.map((h) => ({
        role: h.speaker === 'PLAYER' ? 'player' : 'npc',
        text: h.message,
        timestamp: h.createdAt,
      })),
      dialoguesUsed: totalDialoguesUsed,
      currentDay,
    };
  }
}
