import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getLocalizedLocationLabel, getScenarioConfig } from '../scenarios/scenario-config';

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
      if (!npc || !session) throw new NotFoundException('NPC veya Session bulunamadi.');

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
    const scenarioConfig = getScenarioConfig(
      currentState.session.scenarioType,
      currentState.session.difficulty,
    );
    const canonicalNpc = scenarioConfig.npcDefinitions.find((npc) => npc.id === currentState.npc.id);
    const canonicalLocations = scenarioConfig.locationDefinitions;
    const canonicalLocationIds = canonicalLocations
      .filter((location) => location.id !== 'crime_scene')
      .map((location) => location.id);
    const localizedLocationList = canonicalLocations.map((location) => ({
      ...location,
      localizedName: getLocalizedLocationLabel(currentState.session.scenarioType, location.id),
    }));
    const sessionLocationClues = (currentState.session.locationClues ?? {}) as Record<string, string>;
    const locationListText = canonicalLocations
      .map((location) => {
        const localizedName = getLocalizedLocationLabel(currentState.session.scenarioType, location.id);
        return `- ${location.id}: ${localizedName} (${location.description})`;
      })
      .join('\n');
    const rosterText = scenarioConfig.npcDefinitions
      .map((npc) => `- ${npc.id}: ${npc.name} (${npc.role})`)
      .join('\n');
    const isCulprit = currentState.session.culpritId === currentState.npc.id;
    const confrontationRules = isCulprit
      ? `CONFESSION RULES FOR THE CULPRIT:
1. You are the real culprit of the main crime.
2. You must NEVER openly confess to committing the murder/main crime, even if the player accurately describes what happened.
3. You may panic, deflect, attack the player's credibility, partially explain innocent-looking details, or mix truth with lies.
4. You may admit minor shameful details only if they help you avoid admitting the murder itself.
5. Stay resistant until the very end.`
      : `CONFESSION RULES FOR A NON-CULPRIT:
1. You are NOT the murderer, but you may have your own secret, sin, lie, affair, theft, cover-up, or suspicious action.
2. If the player makes only a vague accusation, you should deny or deflect.
3. If the player confronts you with a SPECIFIC and SUBSTANTIALLY CORRECT accusation that matches your true secret in the PERSONAL SECRET section, you must break.
4. When you break, follow this emotional sequence inside the SAME reply: brief denial or shock -> visible panic -> confession -> plea for mercy/forgiveness.
5. When confessing, admit ONLY your real personal secret. NEVER falsely confess to the murder/main crime if you did not commit it.
6. If the player's accusation is wrong, exaggerated, or aimed at the wrong secret, continue to deny it.
7. Once the player has correctly cornered you about your true secret, stop endlessly inventing new excuses.`;

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
4. If you mention a place, use ONLY the Turkish canonical display names above.
5. NEVER show English location names, internal ids, or parenthetical translations such as "Degirmen (Mill)".
6. Judge accusations against the true canon below, not against the player's bluffing.
`;

    const isNarrator = currentState.npc.id.startsWith('narrator_');

    if (isNarrator) {
      const narratedLocationId = currentState.npc.id.replace('narrator_', '');
      const narratedLocation = canonicalLocations.find((location) => location.id === narratedLocationId);
      const canonicalClueForLocation =
        sessionLocationClues[narratedLocationId] || 'Bu mekan icin kayitli gizli ipucu yok.';

      combinedPrompt += `
NARRATOR ROLE:
You are the objective environment narrator for ${narratedLocation?.name ?? narratedLocationId}.

THE ABSOLUTE TRUTH OF WHAT HAPPENED:
${currentState.session.truthReveal}

CANONICAL HIDDEN CLUE FOR THIS LOCATION:
${canonicalClueForLocation}

INVESTIGATION RULES FOR NARRATOR:
1. The player is searching the environment.
2. If the player makes a GENERAL search, describe ONLY the general atmosphere and surface-level objects. DO NOT reveal hidden clues or secrets.
3. This canonical hidden clue is the ONLY major hidden evidence you may reveal for this location.
4. If the player searches a SPECIFIC object or area that plausibly matches the canonical clue's hiding spot, reveal that exact clue or a very close paraphrase of it.
5. If the player searches the wrong spot, say there is nothing unusual there. Do NOT invent a replacement clue.
6. You may add atmospheric detail, but you must NEVER change the clue's object, location, or meaning.
7. NEVER state the killer's name directly as a fact of the environment. You only describe physical evidence.
8. NEVER state the victim's name. Refer to them as 'the victim' or 'the body' to maintain mystery.`;
    } else {
      combinedPrompt += `
PUBLIC IDENTITY:
You are ${canonicalNpc?.name ?? currentState.npc.name}.
Your public role is ${canonicalNpc?.role ?? currentState.npc.description}.
${canonicalNpc?.personaPrompt ?? currentState.npc.basePrompt}

YOUR PERSONAL SECRET/ROLE IN THIS:
${currentState.dynamicPrompt}

THE ABSOLUTE TRUTH OF THE INCIDENT:
${currentState.session.truthReveal}

${confrontationRules}`;
    }

    const isWarrantIssuer =
      (currentState.session.scenarioType === 'medieval' && currentState.npc.id === 'church') ||
      ((currentState.session.scenarioType === 'modern' ||
        currentState.session.scenarioType === 'cyberpunk') &&
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
        warrantInfo += `\n\nIMPORTANT: You may grant up to ${remaining} more search warrant(s), but ONLY if the player clearly and directly asks for a search warrant / arama izni. Never grant one proactively, never grant one just because you suspect something, and never grant one in response to a generic question. Only grant warrants for canonical location IDs from this list: ${canonicalLocationIds.join(', ')}. To grant, use [GRANT_WARRANT: location_id] tags.`;
      } else {
        warrantInfo += `\n\nIMPORTANT: You have reached the limit of 2 warrants. Do NOT grant any more.`;
      }
      combinedPrompt += warrantInfo;
    }

    const todayHistory = historyData.filter((h) => h.dayNumber === state.session.currentDay);
    const isNewDay = isGreetingSignal || (historyData.length > 0 && todayHistory.length === 0);

    const effectiveMessage = isGreetingSignal
      ? '[Engizisyoncu iceri giriyor. Sen onlari daha once gordun. Yeni gune uygun bir sekilde selamla.]'
      : userMessage;

    const llmResponse = await this.llm.generateNpcResponse(
      canonicalNpc?.name ?? currentState.npc.name,
      combinedPrompt,
      chatHistory,
      effectiveMessage,
      isNewDay,
    );

    let finalReply = llmResponse.reply;
    const explicitWarrantRequest = this.isExplicitWarrantRequest(
      userMessage,
      localizedLocationList.map((location) => location.localizedName),
    );

    const warrantMatches = Array.from(
      finalReply.matchAll(/\[GRANT_WARRANT:\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\]/gi),
    );
    const newlyGranted: string[] = [];

    if (warrantMatches.length > 0) {
      let issuedCount = currentState.session.warrantsIssued;

      for (const match of warrantMatches) {
        if (explicitWarrantRequest && issuedCount < 2) {
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

  private isExplicitWarrantRequest(userMessage: string, localizedLocationNames: string[]) {
    const normalized = userMessage
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const warrantPatterns = [
      /arama izni/,
      /izin verir misin/,
      /izin ver/,
      /izni ver/,
      /arama yapabilir miyim/,
      /arastirabilir miyim/,
      /arastirabilir miyim/,
      /inceleyebilir miyim/,
      /warrant/,
    ];

    const mentionsWarrantIntent = warrantPatterns.some((pattern) => pattern.test(normalized));
    const mentionsKnownLocation = localizedLocationNames.some((name) =>
      normalized.includes(name.toLocaleLowerCase('tr-TR')),
    );

    return mentionsWarrantIntent || (mentionsKnownLocation && normalized.includes('izin'));
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
