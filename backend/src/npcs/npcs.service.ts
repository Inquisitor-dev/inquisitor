import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getLocalizedLocationLabel, getScenarioConfig } from '../scenarios/scenario-config';
import { findOwnedSession } from '../game-sessions/session-access';
import { CaseFacts } from '../scenarios/case-setup';
import { EVIDENCE_TAG, EvidenceDraft, evidenceFromTags, extractEvidenceTags } from './evidence';
import {
  EvidenceImpact,
  FEAR_BREAK_THRESHOLD,
  FEAR_GAIN,
  evidenceImpact,
  fearBand,
  fearPrompt,
  raiseFear,
  startingFear,
} from './fear';
import {
  deflectionReply,
  foldTurkish,
  leaksHiddenPrompt,
  looksLikePromptInjection,
} from './prompt-guard';

@Injectable()
export class NpcsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  private async loadState(sessionId: string, npcId: string) {
    const state = await this.prisma.sessionNpcState.findUnique({
      where: {
        sessionId_npcId: { sessionId, npcId },
      },
      include: {
        npc: true,
        session: true,
      },
    });
    if (state) return state;

    const npc = await this.prisma.npc.findUnique({ where: { id: npcId } });
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!npc || !session) throw new NotFoundException('Karakter ya da oturum bulunamadı.');

    return this.prisma.sessionNpcState.create({
      data: {
        sessionId,
        npcId,
        currentFear: startingFear(npc.baseFear),
        lieTendency: npc.baseLie,
        dynamicPrompt: 'You are a villager. You know nothing.',
      },
      include: { npc: true, session: true },
    });
  }

  // Yüzleştirme: oyuncu Kanıt Defteri'nden bir kanıtı karaktere gösterir. Kanıtın karakterle ilgisi
  // ve korkuya etkisi kodla belirlenir; karakterin tepkisini yapay zekâ bu karara göre yazar.
  async confront(sessionId: string, npcId: string, evidenceId: string) {
    if (npcId.startsWith('narrator_') || npcId === 'crime_scene') {
      throw new BadRequestException('Kanıt sadece karakterlere gösterilebilir.');
    }
    const evidence = await this.prisma.evidence.findFirst({
      where: { id: evidenceId, sessionId },
    });
    if (!evidence) throw new NotFoundException('Kanıt bulunamadı.');

    const state = await this.loadState(sessionId, npcId);
    const impact = evidenceImpact({
      evidence,
      targetNpcId: npcId,
      culpritId: state.session.culpritId,
      caseFacts: (state.session.caseFacts ?? null) as CaseFacts | null,
      alreadyShown: state.shownEvidenceIds.includes(evidence.id),
    });

    await this.prisma.sessionNpcState.update({
      where: { id: state.id },
      data: {
        currentFear: raiseFear(state.currentFear, impact),
        ...(impact === 'REPEAT' ? {} : { shownEvidenceIds: { push: evidence.id } }),
      },
    });

    return this.interact(sessionId, npcId, `*Ona bir kanıt gösteriyorsun:* ${evidence.text}`, {
      evidenceText: evidence.text,
      impact,
    });
  }

  async interact(
    sessionId: string,
    npcId: string,
    userMessage: string,
    confrontation?: { evidenceText: string; impact: EvidenceImpact },
  ) {
    const state = await this.loadState(sessionId, npcId);

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
7. Once the player has correctly cornered you about your true secret, stop endlessly inventing new excuses.
8. You do NOT know who the culprit is. Never name or guess a culprit as a fact; share only what your character could plausibly have seen, as described in your personal secret.`;

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
    const narratedLocationId = isNarrator ? currentState.npc.id.replace('narrator_', '') : null;
    const caseFacts = (currentState.session.caseFacts ?? null) as CaseFacts | null;
    const existingEvidence = await this.prisma.evidence.findMany({
      where: { sessionId },
      select: { kind: true, sourceId: true },
    });
    const hasConfessed = existingEvidence.some(
      (e) => e.kind === 'CONFESSION' && e.sourceId === currentState.npc.id,
    );
    const fearLevel = currentState.currentFear;
    // Korku eşiği bir yüzleştirmeyle aşıldıysa masum karakter itiraf eder; bunu yapay zekâ değil kod belirler
    const forcedConfession =
      !isNarrator &&
      !isCulprit &&
      !hasConfessed &&
      !!confrontation &&
      FEAR_GAIN[confrontation.impact] > 0 &&
      fearLevel >= FEAR_BREAK_THRESHOLD;

    if (isNarrator) {
      const narratedLocation = canonicalLocations.find((location) => location.id === narratedLocationId);
      const canonicalClueForLocation =
        sessionLocationClues[narratedLocationId!] || 'Bu mekan icin kayitli gizli ipucu yok.';

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
8. NEVER state the victim's name. Refer to them as 'the victim' or 'the body' to maintain mystery.
9. DO NOT end your description with a guiding question, hook, or suggestion like "Do you want to search here?" or "What do you want to look at?". Just describe the scene and STOP.
10. EVIDENCE TAG: If and only if this reply reveals the canonical hidden clue, end the reply with the tag [${EVIDENCE_TAG.clue}]. Never add it for atmosphere or a wrong spot.`;
    } else {
      combinedPrompt += `
PUBLIC IDENTITY:
You are ${canonicalNpc?.name ?? currentState.npc.name}.
Your public role is ${canonicalNpc?.role ?? currentState.npc.description}.
${canonicalNpc?.personaPrompt ?? currentState.npc.basePrompt}

YOUR PERSONAL SECRET/ROLE IN THIS:
${currentState.dynamicPrompt}
`;

      // Sadece katil olayın tamamını bilir; masumlar kendi gördüklerini ve mazeretlerini bilir
      if (isCulprit) {
        combinedPrompt += `
THE ABSOLUTE TRUTH OF THE INCIDENT:
${currentState.session.truthReveal}
`;
      } else if (caseFacts?.alibis[currentState.npc.id]) {
        combinedPrompt += `
YOUR WHEREABOUTS ON THE NIGHT OF THE MURDER (your secret alibi):
${caseFacts.alibis[currentState.npc.id]}
`;
      }

      combinedPrompt += `
${confrontationRules}`;

      if (!isCulprit) {
        combinedPrompt += `
9. EVIDENCE TAG: If and only if you confess your personal secret in this reply, end the reply with the tag [${EVIDENCE_TAG.confession}].`;
      }

      combinedPrompt += `

EMOTIONAL STATE:
${fearPrompt(fearLevel, isCulprit)}`;
      if (hasConfessed) {
        combinedPrompt += `
You have already confessed your personal secret to the Inquisitor. Do not deny it again.`;
      }

      if (confrontation) {
        const impactText: Record<EvidenceImpact, string> = {
          DECISIVE: 'This evidence exposes your personal secret.',
          IMPLICATING: 'This evidence points at you and makes you look guilty.',
          IRRELEVANT:
            'This evidence has nothing to do with you. You may be puzzled or dismissive, but it does not frighten you.',
          REPEAT: 'The Inquisitor has already shown you this before. React to being shown the same thing again.',
        };
        combinedPrompt += `

EVIDENCE SHOWN TO YOU:
The Inquisitor silently shows you this evidence: "${confrontation.evidenceText}"
${impactText[confrontation.impact]}
React to the evidence in character.`;
      }
      if (forcedConfession) {
        combinedPrompt += `
FEAR BREAK: You can no longer hold out. In this reply you break down and confess your personal secret, following the emotional sequence of the confession rules. You still NEVER confess to the murder.`;
      }

      // Doğrulayan kanıtı bilen tanık: söylediğinde kanıt deftere düşsün
      const placement = caseFacts?.verification.placement;
      if (placement?.type === 'TESTIMONY' && placement.npcId === currentState.npc.id && caseFacts?.verificationText) {
        combinedPrompt += `

VERIFYING EVIDENCE YOU KNOW:
${caseFacts.verificationText}
Share it only when the Inquisitor asks about the crime scene trace, the related item, or the night of the murder. If and only if you share it in this reply, end the reply with the tag [${EVIDENCE_TAG.verification}].`;
      }
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

    const npcDisplayName = canonicalNpc?.name ?? currentState.npc.name;
    // Talimatları ezmeye çalışan mesajlar LLM'e hiç gönderilmez; karakter içi hazır bir cevap döner
    const isInjectionAttempt =
      !isGreetingSignal && !confrontation && looksLikePromptInjection(userMessage);

    // Test modunda yapay zeka çağrılmaz; arama izni istenirse izin akışı da denenebilsin diye etiket eklenir
    const llmResponse = isInjectionAttempt
      ? { reply: deflectionReply(npcDisplayName, isNarrator) }
      : currentState.session.isTestMode
      ? {
          reply: this.buildTestReply(
            canonicalNpc?.name ?? currentState.npc.name,
            isGreetingSignal,
            userMessage,
            localizedLocationList,
            isNarrator,
            confrontation ? { impact: confrontation.impact, fear: fearLevel, forcedConfession } : undefined,
          ),
        }
      : await this.llm.generateNpcResponse(
          canonicalNpc?.name ?? currentState.npc.name,
          combinedPrompt,
          chatHistory,
          effectiveMessage,
          isNewDay,
        );

    // Cevapta prompt'un bölüm başlıkları görünüyorsa model gizli talimatları sızdırmıştır
    let finalReply = leaksHiddenPrompt(llmResponse.reply)
      ? deflectionReply(npcDisplayName, isNarrator)
      : llmResponse.reply;
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

    // Kanıt etiketleri cevaptan ayıklanır ve deftere işlenir; oyuncu etiketleri hiç görmez
    const extracted = extractEvidenceTags(finalReply);
    finalReply = extracted.reply;
    if (forcedConfession) extracted.tags.add(EVIDENCE_TAG.confession);
    const newEvidence = await this.recordEvidence(
      sessionId,
      state.session.currentDay,
      existingEvidence,
      evidenceFromTags({
        tags: extracted.tags,
        npcId: isNarrator ? null : currentState.npc.id,
        locationId: narratedLocationId,
        culpritId: currentState.session.culpritId,
        caseFacts,
        locationClues: sessionLocationClues,
        reply: finalReply,
        nameOf: (id) => scenarioConfig.npcDefinitions.find((npc) => npc.id === id)?.name ?? id,
      }),
    );

    await this.prisma.dialogueHistory.create({
      data: {
        sessionId,
        npcId,
        speaker: 'NPC',
        message: finalReply,
        dayNumber: state.session.currentDay,
      },
    });

    // Karakter ifadeleri Not defterine otomatik yazılır; fiziksel nesneler Envanter'de görünür
    const notes = await this.appendStatementsToNotes(
      sessionId,
      newEvidence.filter((evidence) => evidence.category === 'STATEMENT'),
      (id) => scenarioConfig.npcDefinitions.find((npc) => npc.id === id)?.name ?? id,
    );

    return {
      reply: finalReply,
      grantedWarrants: newlyGranted,
      newEvidence,
      notes,
      fear: isNarrator ? null : { level: fearLevel, band: fearBand(fearLevel) },
    };
  }

  // Daha önce kaydedilmemiş kanıtları ekler ve sadece yenilerini döndürür
  private async recordEvidence(
    sessionId: string,
    dayNumber: number,
    existing: { kind: string; sourceId: string }[],
    drafts: EvidenceDraft[],
  ) {
    const fresh = drafts.filter(
      (draft) => !existing.some((e) => e.kind === draft.kind && e.sourceId === draft.sourceId),
    );
    const created: Array<EvidenceDraft & { id: string; dayNumber: number }> = [];
    for (const draft of fresh) {
      try {
        const row = await this.prisma.evidence.create({
          data: { ...draft, sessionId, dayNumber },
          select: { id: true, kind: true, category: true, sourceId: true, text: true, dayNumber: true },
        });
        created.push(row as EvidenceDraft & { id: string; dayNumber: number });
      } catch (err) {
        // Aynı anda gelen iki istek aynı kanıtı yazmaya çalışırsa ikincisi atlanır
        if ((err as { code?: string }).code !== 'P2002') throw err;
      }
    }
    return created;
  }

  private async appendStatementsToNotes(
    sessionId: string,
    statements: { sourceId: string; text: string; dayNumber: number }[],
    nameOf: (npcId: string) => string,
  ): Promise<string | undefined> {
    if (statements.length === 0) return undefined;
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: { notes: true },
    });
    const lines = statements.map(
      (statement) => `[${statement.dayNumber}. gün · ${nameOf(statement.sourceId)}] ${statement.text}`,
    );
    const current = (session?.notes ?? '').trimEnd();
    const notes = [current, ...lines].filter(Boolean).join('\n\n');
    await this.prisma.gameSession.update({ where: { id: sessionId }, data: { notes } });
    return notes;
  }

  private buildTestReply(
    npcName: string,
    isGreeting: boolean,
    userMessage: string,
    locations: { id: string; localizedName: string }[],
    isNarrator = false,
    confrontation?: { impact: EvidenceImpact; fear: number; forcedConfession: boolean },
  ) {
    if (isGreeting) return `[TEST MODU] ${npcName} seni selamlıyor.`;
    if (confrontation) {
      const reaction = confrontation.forcedConfession
        ? 'dayanamıyor ve sırrını itiraf ediyor.'
        : `kanıta bakıyor (etki: ${confrontation.impact}).`;
      return `[TEST MODU] ${npcName} ${reaction} Korku: ${confrontation.fear}/10`;
    }

    // Kanıt Defteri yapay zekâ olmadan denenebilsin diye anahtar kelimelerle etiket eklenir:
    // anlatıcıda "ara/incele", karakterde "itiraf" ve "kanıt"
    const folded = foldTurkish(userMessage);
    if (isNarrator) {
      const found = /\b(ara|incele)/.test(folded);
      return `[TEST MODU] Anlatıcı: ${found ? 'Gizli ipucunu buldun.' : 'Etrafta olağandışı bir şey yok.'}${found ? ` [${EVIDENCE_TAG.clue}]` : ''}`;
    }
    const evidenceTags = [
      /itiraf/.test(folded) ? ` [${EVIDENCE_TAG.confession}]` : '',
      /kanit/.test(folded) ? ` [${EVIDENCE_TAG.verification}]` : '',
    ].join('');

    // "Değirmen" ile "degirmen" aynı sayılsın diye Türkçe karakterler sadeleştirilerek karşılaştırılır
    const normalized = foldTurkish(userMessage);
    const requested = locations.find(
      (location) =>
        location.id !== 'crime_scene' &&
        normalized.includes(foldTurkish(location.localizedName)),
    );
    const warrantTag = requested ? ` [GRANT_WARRANT: ${requested.id}]` : '';
    return `[TEST MODU] ${npcName}: "${userMessage.slice(0, 80)}" sorusunu duydum. Bu bir yer tutucu cevaptır.${warrantTag}${evidenceTags}`;
  }

  getOwnedSession(sessionId: string, userId: string) {
    return findOwnedSession(this.prisma, sessionId, userId);
  }

  private isExplicitWarrantRequest(userMessage: string, localizedLocationNames: string[]) {
    // Türkçe karakterler sadeleştirilir: "araştırabilir miyim" de "arastirabilir miyim" de tanınır
    const normalized = foldTurkish(userMessage)
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
      normalized.includes(foldTurkish(name)),
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
      fear:
        state && !npcId.startsWith('narrator_')
          ? { level: state.currentFear, band: fearBand(state.currentFear) }
          : null,
      shownEvidenceIds: state?.shownEvidenceIds ?? [],
    };
  }
}
