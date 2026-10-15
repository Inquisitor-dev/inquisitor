import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getLocalizedLocationLabel, getScenarioConfig } from '../scenarios/scenario-config';
import { findOwnedSession } from '../game-sessions/session-access';
import { CaseFacts } from '../scenarios/case-setup';
import { EVIDENCE_TAG, evidenceFromTags, extractEvidenceTags } from './evidence';
import {
  EvidenceImpact,
  evidenceImpact,
  fearBand,
  raiseFear,
  startingFear,
} from './fear';
import {
  deflectionReply,
  leaksHiddenPrompt,
  looksLikePromptInjection,
} from './prompt-guard';
import { isExplicitWarrantRequest } from './warrant';
import { buildNpcPrompt, isForcedConfession } from './prompt-builder';
import { buildTestReply } from './test-reply.builder';
import { appendStatementsToNotes, recordEvidence } from './evidence-recorder';


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

    const isNarrator = currentState.npc.id.startsWith('narrator_');
    const narratedLocationId = isNarrator ? currentState.npc.id.replace('narrator_', '') : null;
    const isCulprit = currentState.session.culpritId === currentState.npc.id;
    const fearLevel = currentState.currentFear;
    const caseFacts = (currentState.session.caseFacts ?? null) as CaseFacts | null;
    const sessionLocationClues = (currentState.session.locationClues ?? {}) as Record<string, string>;

    const existingEvidence = await this.prisma.evidence.findMany({
      where: { sessionId },
      select: { kind: true, sourceId: true },
    });
    const hasConfessed = existingEvidence.some(
      (e) => e.kind === 'CONFESSION' && e.sourceId === currentState.npc.id,
    );

    const forcedConfession = isForcedConfession({
      isNarrator,
      isCulprit,
      hasConfessed,
      confrontation,
      fearLevel,
    });

    const combinedPrompt = buildNpcPrompt({
      scenarioConfig,
      session: {
        scenarioType: currentState.session.scenarioType,
        scenario: currentState.session.scenario,
        truthReveal: currentState.session.truthReveal,
        culpritId: currentState.session.culpritId,
        warrantsIssued: currentState.session.warrantsIssued,
        activeWarrants: currentState.session.activeWarrants,
        caseFacts,
        locationClues: sessionLocationClues,
      },
      npc: currentState.npc,
      dynamicPrompt: currentState.dynamicPrompt,
      fearLevel,
      hasConfessed,
      confrontation,
    });

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
          reply: buildTestReply(
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
          {
            kind: isNarrator
              ? 'NARRATOR'
              : confrontation
                ? 'CONFRONT'
                : 'NPC_REPLY',
            sessionId,
          },
        );

    // Cevapta prompt'un bölüm başlıkları görünüyorsa model gizli talimatları sızdırmıştır
    let finalReply = leaksHiddenPrompt(llmResponse.reply)
      ? deflectionReply(npcDisplayName, isNarrator)
      : llmResponse.reply;
    const explicitWarrantRequest = isExplicitWarrantRequest(
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
    const newEvidence = await recordEvidence(
      this.prisma,
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
    const notes = await appendStatementsToNotes(
      this.prisma,
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



  getOwnedSession(sessionId: string, userId: string) {
    return findOwnedSession(this.prisma, sessionId, userId);
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
