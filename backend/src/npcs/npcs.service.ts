import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { getLocalizedLocationLabel, getScenarioConfig } from '../scenarios/scenario-config';
import { findOwnedSession } from '../game-sessions/session-access';
import { CaseFacts } from '../scenarios/case-setup';
import { EVIDENCE_TAG, evidenceFromTags, extractEvidenceTags } from './evidence';
import {
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
import { decideWarrants, isWarrantIssuer, WarrantDecision } from './warrant';
import {
  buildNpcPrompt,
  isForcedConfession,
  NpcConfrontation,
} from './prompt-builder';
import { buildTestReply } from './test-reply.builder';
import { recordEvidence } from './evidence-recorder';
import { Prisma } from '@prisma/client';
import {
  availability,
  findAbility,
  parseAbilityState,
  recordUse,
} from '../abilities/abilities';
import {
  chargedMessages,
  isDreamActive,
  isQuietRoom,
} from '../abilities/ability-effects';
import type { VerifiedStatement } from './prompt-builder';


// Teyit'te okunan sözün en fazla uzunluğu (karakter)
const QUOTE_MAX_LENGTH = 300;

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

  // Yüzleştirmenin yapılabilir olduğunu kontrol eder. Controller bunu kota harcanmadan önce çağırır:
  // geçersiz ya da aynı kişiye ikinci kez gösterilen kanıt sorgu hakkı yemesin.
  async assertConfrontable(
    sessionId: string,
    npcId: string,
    evidenceId: string,
  ) {
    if (npcId.startsWith('narrator_') || npcId === 'crime_scene') {
      throw new BadRequestException('Kanıt sadece karakterlere gösterilebilir.');
    }
    const evidence = await this.prisma.evidence.findFirst({
      where: { id: evidenceId, sessionId },
    });
    if (!evidence) throw new NotFoundException('Kanıt bulunamadı.');

    const state = await this.loadState(sessionId, npcId);
    if (state.shownEvidenceIds.includes(evidence.id)) {
      throw new BadRequestException('Bu kanıtı ona zaten gösterdin.');
    }
    return { evidence, state };
  }

  // Yüzleştirme: oyuncu Kanıt Defteri'nden bir kanıtı karaktere gösterir, isterse bir şey de söyler.
  // Kanıtın karakterle ilgisi ve korkuya etkisi kodla belirlenir; karakterin tepkisini yapay zekâ
  // bu karara göre yazar. Kanıtın nereden geldiği de söylenir ki karakter onu kendi mekânına bağlamasın.
  async confront(
    sessionId: string,
    npcId: string,
    evidenceId: string,
    remark?: string,
  ) {
    const { evidence, state } = await this.assertConfrontable(
      sessionId,
      npcId,
      evidenceId,
    );
    const impact = evidenceImpact({
      evidence,
      targetNpcId: npcId,
      culpritId: state.session.culpritId,
      caseFacts: (state.session.caseFacts ?? null) as CaseFacts | null,
      alreadyShown: false,
    });

    await this.prisma.sessionNpcState.update({
      where: { id: state.id },
      data: {
        currentFear: raiseFear(state.currentFear, impact),
        shownEvidenceIds: { push: evidence.id },
      },
    });

    // Talimatları ezmeye çalışan söz yapay zekâya hiç gitmez; kanıt yine de gösterilir
    const trimmed = remark?.trim();
    const cleanRemark =
      trimmed && !looksLikePromptInjection(trimmed) ? trimmed : undefined;
    const scenarioConfig = getScenarioConfig(
      state.session.scenarioType,
      state.session.difficulty,
    );
    const nameOf = (id: string) =>
      scenarioConfig.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;

    const playerLine =
      `*Ona bir kanıt gösteriyorsun:* ${evidence.text}` +
      (cleanRemark ? `\n${cleanRemark}` : '');
    return this.interact(sessionId, npcId, playerLine, {
      evidenceText: evidence.text,
      impact,
      origin: describeEvidenceOrigin(
        evidence,
        npcId,
        state.session.scenarioType,
        nameOf,
      ),
      remark: cleanRemark,
    });
  }

  // Teyit (Gece Muhabiri) için seçilebilecek sözler: oyuncunun duyduğu şüpheli cevapları
  // (anlatıcı ve konuşulan kişinin kendi sözü hariç), en yeniden eskiye
  async quoteCandidates(sessionId: string, listenerNpcId: string) {
    const session = await this.prisma.gameSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    const rows = await this.prisma.dialogueHistory.findMany({
      where: {
        sessionId,
        speaker: 'NPC',
        npcId: { not: listenerNpcId },
        NOT: { npcId: { startsWith: 'narrator_' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, npcId: true, message: true, dayNumber: true },
    });
    return rows
      .filter((row) => row.message.trim().length >= 15)
      .map((row) => ({
        id: row.id,
        npcId: row.npcId,
        name:
          config.npcDefinitions.find((npc) => npc.id === row.npcId)?.name ??
          row.npcId,
        text: row.message.trim().slice(0, QUOTE_MAX_LENGTH),
        day: row.dayNumber,
      }));
  }

  // Teyit kullanılabilir mi (kota harcanmadan önce controller çağırır)
  async assertVerifiable(sessionId: string, listenerNpcId: string, quoteId: string) {
    if (listenerNpcId.startsWith('narrator_') || listenerNpcId === 'crime_scene') {
      throw new BadRequestException('Söz sadece şüphelilere okunabilir.');
    }
    const session = await this.prisma.gameSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    const ability = findAbility('verify_quote')!;
    const check = availability(session, ability);
    if (!check.available) throw new BadRequestException(check.reason);

    const quote = await this.prisma.dialogueHistory.findFirst({
      where: { id: quoteId, sessionId, speaker: 'NPC' },
    });
    if (
      !quote ||
      quote.npcId.startsWith('narrator_') ||
      quote.npcId === listenerNpcId
    ) {
      throw new BadRequestException(
        'Bu söz başka bir şüphelinin sana söylediği bir söz olmalı.',
      );
    }
    return { session, quote };
  }

  // Teyit: bir şüphelinin gerçekten söylediği söz başka bir şüpheliye okunur; söz gerçek olduğu için
  // karakter onu blöf diye geçiştiremez. Korkuyu değiştirmez.
  async verifyQuote(sessionId: string, listenerNpcId: string, quoteId: string) {
    const { session, quote } = await this.assertVerifiable(
      sessionId,
      listenerNpcId,
      quoteId,
    );
    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    const speakerName =
      config.npcDefinitions.find((npc) => npc.id === quote.npcId)?.name ??
      quote.npcId;
    const text = quote.message.trim().slice(0, QUOTE_MAX_LENGTH);

    const result = await this.interact(
      sessionId,
      listenerNpcId,
      `*${speakerName} bana şunu söyledi:* “${text}”`,
      undefined,
      { speakerName, text },
    );

    const state = recordUse(
      parseAbilityState(session.abilityState),
      'verify_quote',
      session.currentDay,
    );
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { abilityState: state as unknown as Prisma.InputJsonValue },
    });
    return result;
  }

  async interact(
    sessionId: string,
    npcId: string,
    userMessage: string,
    confrontation?: NpcConfrontation,
    verifiedStatement?: VerifiedStatement,
  ) {
    const state = await this.loadState(sessionId, npcId);

    // Yapay zekâya konuşmanın son 10 mesajı gider (en eskileri değil), eskiden yeniye sıralı
    const historyData = (
      await this.prisma.dialogueHistory.findMany({
        where: { sessionId, npcId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    ).reverse();

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
    // Sessiz Oda (Gölge Ajan): o gün bu şüpheli daha doğrudan konuşur
    const quietRoom =
      !isNarrator &&
      isQuietRoom(
        parseAbilityState(currentState.session.abilityState),
        currentState.npc.id,
        currentState.session.currentDay,
      );

    // Rüya Tabiri (Kar Kâhini): o gün tanık sorulmasa da anlatır
    const dreamActive =
      !isNarrator &&
      isDreamActive(
        parseAbilityState(currentState.session.abilityState),
        currentState.session.currentDay,
      );

    const npcDisplayName = canonicalNpc?.name ?? currentState.npc.name;
    // Talimatları ezmeye çalışan mesajlar LLM'e hiç gönderilmez; karakter içi hazır bir cevap döner
    const isInjectionAttempt =
      !isGreetingSignal && !confrontation && looksLikePromptInjection(userMessage);

    // Arama iznini kod verir; izin veren karakter sadece kararı kendi ağzından söyler
    const warrantDecision: WarrantDecision | null =
      !isGreetingSignal &&
      !confrontation &&
      !isInjectionAttempt &&
      isWarrantIssuer(currentState.session.scenarioType, currentState.npc.id)
        ? decideWarrants({
            userMessage,
            locations: localizedLocationList
              .filter((location) => canonicalLocationIds.includes(location.id))
              .map((location) => ({
                id: location.id,
                localizedName: location.localizedName,
                // İzni veren kişinin kendi adı geçince kendi mekânı istenmiş sayılmasın
                ownerName:
                  location.id === currentState.npc.id
                    ? undefined
                    : scenarioConfig.npcDefinitions.find(
                        (npc) => npc.id === location.id,
                      )?.name,
              })),
            warrantsIssued: currentState.session.warrantsIssued,
            activeWarrants: currentState.session.activeWarrants,
            usedWarrants: currentState.session.usedWarrants,
          })
        : null;

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
      warrantDecision,
      quietRoom,
      dreamActive,
      verifiedStatement,
    });

    const todayHistory = historyData.filter((h) => h.dayNumber === state.session.currentDay);
    const isNewDay = isGreetingSignal || (historyData.length > 0 && todayHistory.length === 0);

    const effectiveMessage = isGreetingSignal
      ? '[Engizisyoncu iceri giriyor. Sen onlari daha once gordun. Yeni gune uygun bir sekilde selamla.]'
      : userMessage;

    // Test modunda yapay zekâ çağrılmaz; arama izni kararı cevaba not olarak eklenir
    const llmResponse = isInjectionAttempt
      ? { reply: deflectionReply(npcDisplayName, isNarrator) }
      : currentState.session.isTestMode
      ? {
          reply: buildTestReply(
            canonicalNpc?.name ?? currentState.npc.name,
            isGreetingSignal,
            userMessage,
            isNarrator,
            confrontation ? { impact: confrontation.impact, fear: fearLevel, forcedConfession } : undefined,
            warrantDecision
              ? testWarrantNote(warrantDecision, (id) =>
                  getLocalizedLocationLabel(currentState.session.scenarioType, id),
                )
              : undefined,
            quietRoom,
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
                : verifiedStatement
                  ? 'VERIFY_QUOTE'
                  : 'NPC_REPLY',
            sessionId,
          },
        );

    // Cevapta prompt'un bölüm başlıkları görünüyorsa model gizli talimatları sızdırmıştır
    let finalReply = leaksHiddenPrompt(llmResponse.reply)
      ? deflectionReply(npcDisplayName, isNarrator)
      : llmResponse.reply;
    // Yapay zekâ eski alışkanlıkla izin etiketi yazarsa oyuncu görmesin; izni sadece kod verir
    finalReply = finalReply.replace(/\[GRANT_WARRANT:[^\]]*\]/gi, '').trim();

    const newlyGranted = warrantDecision?.granted ?? [];
    if (newlyGranted.length > 0) {
      await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          activeWarrants: [
            ...currentState.session.activeWarrants,
            ...newlyGranted,
          ],
          warrantsIssued: { increment: newlyGranted.length },
        },
      });
    }

    // Kanıt etiketleri cevaptan ayıklanır ve deftere işlenir; oyuncu etiketleri hiç görmez
    const extracted = extractEvidenceTags(finalReply);
    finalReply = extracted.reply;
    // İtirafa yapay zekâ değil korku eşiği karar verir: sohbetteki itiraf etiketi sayılmaz,
    // eşik aşıldığında ise itiraf her zaman kaydedilir (Not defterine de düşer)
    if (forcedConfession) extracted.tags.add(EVIDENCE_TAG.confession);
    else extracted.tags.delete(EVIDENCE_TAG.confession);
    // Rüya Tabiri: tanık o gün konuştuysa tanıklık kaydedilir (metin yine vaka kaydından gelir)
    if (dreamActive && !isGreetingSignal && !isInjectionAttempt) {
      extracted.tags.add(EVIDENCE_TAG.verification);
    }
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

    // Karakter ifadeleri (STATEMENT) Not Defteri'nde alındıkları günün sayfasına kayıt kartı
    // olarak çıkar (src/notebook); fiziksel nesneler Envanter'de görünür

    return {
      reply: finalReply,
      grantedWarrants: newlyGranted,
      newEvidence,
      fear: isNarrator ? null : { level: fearLevel, band: fearBand(fearLevel) },
    };
  }



  getOwnedSession(sessionId: string, userId: string) {
    return findOwnedSession(this.prisma, sessionId, userId);
  }

  // Oyuncunun o oyun gününde gönderdiği mesaj sayısı (sorgu ve yüzleştirme)
  playerMessagesToday(sessionId: string, dayNumber: number) {
    return this.prisma.dialogueHistory.count({
      where: { sessionId, speaker: 'PLAYER', dayNumber },
    });
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

    // Sabır'ın ücretsiz mesajları soru hakkından düşülmez
    const totalDialoguesUsed = chargedMessages(
      state?.session?.characterId ?? '',
      await this.playerMessagesToday(sessionId, currentDay),
    );

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

// Kanıtın nereden geldiği, karakterin anlayacağı dille
function describeEvidenceOrigin(
  evidence: { category: string; sourceId: string },
  npcId: string,
  scenarioType: string,
  nameOf: (id: string) => string,
): string {
  if (evidence.category === 'STATEMENT') {
    return evidence.sourceId === npcId
      ? 'It is a statement you gave yourself earlier.'
      : `It is a statement given by ${nameOf(evidence.sourceId)}.`;
  }
  if (evidence.sourceId === 'crime_scene') {
    return 'It was found at the crime scene, where the body was.';
  }
  if (evidence.sourceId === npcId) return 'It was found at your own place.';
  return `It was found at "${getLocalizedLocationLabel(scenarioType, evidence.sourceId)}".`;
}

// Test modunda arama izni kararı cevaba kısa bir not olarak eklenir
function testWarrantNote(
  decision: WarrantDecision,
  label: (id: string) => string,
): string {
  switch (decision.outcome) {
    case 'GRANTED':
      return `Arama izni verildi: ${decision.granted.map(label).join(', ')}.`;
    case 'NO_LOCATION':
      return 'Hangi mekân için izin istiyorsun?';
    case 'ALREADY_HELD':
      return `Bu mekân için iznin zaten var: ${decision.alreadyHeld.map(label).join(', ')}.`;
    case 'LIMIT_REACHED':
      return 'Bu vakada arama izni hakkın doldu.';
  }
}
