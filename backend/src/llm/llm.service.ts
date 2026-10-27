import { Injectable, Logger } from '@nestjs/common';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
  normalizeScenarioType,
} from '../scenarios/scenario-config';
import { MOTIVE_LABELS, WEAPONS } from '../scenarios/case-catalog';
import {
  buildAlibiAlignPrompt,
  buildClueRepairPrompt,
  buildTraceRepairPrompt,
  culpritClueGivesAway,
  parseAlibiAlign,
  parseClueRepair,
  placesIn,
  traceMissesFramed,
} from './prompts/clue-repair-prompt.builder';
import {
  buildLeakRepairPrompt,
  buildWitnessRepairPrompt,
  parseLeakRepair,
  parseWitnessRepair,
} from './prompts/witness-repair-prompt.builder';
import { mentions } from '../npcs/case-statements';
import { cleanInternalIds } from './prompts/internal-ids';
import { CasePlan } from '../scenarios/case-setup';
import type { ThoughtLine } from '../board/board';
import { CompletionRequest, GeminiClient } from './client/gemini-client';
import { LlmUsageContext, LlmUsageRecorder } from './usage/llm-usage.recorder';
import {
  buildNpcDialogueSystemPrompt,
  parseNpcReply,
} from './prompts/npc-prompt.builder';
import { buildBoardThoughtPrompt } from './prompts/board-prompt.builder';
import {
  buildVerdictJudgePrompt,
  parseVerdictJudgement,
  VerdictJudgeCase,
  VerdictJudgement,
} from './prompts/verdict-judge-prompt.builder';
import {
  type Contradiction,
  MAX_CANDIDATES,
  buildContradictionCheckPrompt,
  buildContradictionPrompt,
  parseContradictionCheck,
  parseContradictions,
} from './prompts/contradiction-prompt.builder';
import {
  type ScenarioDraft,
  buildCaseBrief,
  buildScenarioPrompt,
  buildReconciliationPrompt,
  parseScenarioDraft,
  mergeScenarioDraftWithFallback,
} from './prompts/scenario-prompt.builder';
import {
  buildStoryReviewPrompt,
  parseStoryReview,
} from './prompts/story-review-prompt.builder';
import type { StoryIssue, StoryReviewInput } from '../stories/story-review';
import { removeConfessionInstructions } from './prompts/confession-instructions';
import { ensureThreatLetter } from '../personas/threat-letter';

export type { ScenarioDraft };

// Silahı bilmeden veren kime verdiğini bilir. Gemini "kayıtta alıcının adı yok" kuralını rol metnine de
// taşıyıp "şüpheli birine sattın" yazabiliyor; hakem bunu reddediyor. Ad yoksa cümle koddan eklenir.
export function ensureHelperKnowsBuyer(
  draft: ScenarioDraft,
  plan: Pick<CasePlan, 'culpritId' | 'involvements'>,
  npcNames: Record<string, string>,
): ScenarioDraft {
  const culpritName = npcNames[plan.culpritId] ?? plan.culpritId;
  const npcPrompts = { ...draft.npcPrompts };
  let changed = false;
  for (const inv of plan.involvements ?? []) {
    if (inv.kind !== 'UNWITTING_HELP') continue;
    const prompt = npcPrompts[inv.npcId] ?? '';
    if (mentions(prompt, culpritName)) continue;
    npcPrompts[inv.npcId] =
      `${prompt} Cinayet aletini kime verdiğini biliyorsun: ${culpritName}. Bunu kendine saklıyorsun.`.trim();
    changed = true;
  }
  return changed ? { ...draft, npcPrompts } : draft;
}

// Metinde geçen mekânlar; karakter adları mekân sayılmaz ("Değirmenci Giles" değirmen değildir)
function placesNamed(
  text: string,
  npcNames: Record<string, string>,
  labels: Record<string, string>,
): Set<string> {
  const withoutNames = Object.values(npcNames).reduce(
    (acc, name) => acc.split(name).join(' '),
    text,
  );
  return placesIn(withoutNames, labels);
}

// Kısmi tanık gördüğü kişiyi o kişinin mazeretindeki yerde gördü; oyunda bu yer tanığa koddan verilir
// (linkPromptLines). Gemini rol metnine yine de başka bir yer yazabiliyor (denemede 8 vakanın 2'sinde
// "kliniğin arka kapısında"), o zaman masumun mazereti tanıkla çelişir. Görülen kişinin adını ve
// mazeretinde olmayan bir mekânı birlikte anan cümle rol metninden çıkar; doğru yeri kod söyler.
export function dropWrongSightings(
  draft: ScenarioDraft,
  plan: Pick<CasePlan, 'culpritId' | 'involvements'>,
  npcNames: Record<string, string>,
  scenarioType: string,
): ScenarioDraft {
  const labels = Object.fromEntries(
    Object.keys(npcNames).map((id) => [
      id,
      getLocalizedLocationLabel(scenarioType, id),
    ]),
  );
  const npcPrompts = { ...draft.npcPrompts };
  let changed = false;
  for (const inv of plan.involvements ?? []) {
    const seenId = inv.aboutNpcId;
    if (inv.kind !== 'WITNESS' || !seenId || seenId === plan.culpritId) {
      continue;
    }
    const alibiPlaces = placesNamed(
      draft.alibis?.[seenId] ?? '',
      npcNames,
      labels,
    );
    const prompt = npcPrompts[inv.npcId];
    if (!prompt || alibiPlaces.size === 0) continue;
    const seenName = npcNames[seenId] ?? seenId;
    const sentences = prompt.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter((sentence) => {
      if (!mentions(sentence, seenName)) return true;
      const places = placesNamed(sentence, npcNames, labels);
      return places.size === 0 || [...places].some((p) => alibiPlaces.has(p));
    });
    if (kept.length !== sentences.length) {
      npcPrompts[inv.npcId] = kept.join(' ');
      changed = true;
    }
  }
  return changed ? { ...draft, npcPrompts } : draft;
}

// Katilin örtü hikâyesi (kırılınca anlattığı yalan): yalnız, kendi mekânında, cinayetle ilgisiz bir sırla.
// Başka bir şüpheliyi (eş gösterirse o kişi yalanlar), kanı ya da silahı (bilmemesi gerekir) anarsa ya da
// hiç yazılmamışsa koddan sade bir yalan konur. "Olay yerine hiç gitmedim" gibi bir inkâr serbesttir.
// Eski planlarda (motif yok) örtü hikâyesi istenmez, katil eskisi gibi kırılmaz.
export function ensureCulpritCover(
  draft: ScenarioDraft,
  plan: Pick<CasePlan, 'culpritId' | 'motive' | 'weaponId'>,
  npcNames: Record<string, string>,
  scenarioType: string,
): ScenarioDraft {
  if (!plan.motive) return draft;
  const cover = draft.culpritCover?.trim() ?? '';
  const weaponLabel = WEAPONS[normalizeScenarioType(scenarioType)].find(
    (w) => w.id === plan.weaponId,
  )?.label;
  const namesOther = Object.entries(npcNames).some(
    ([id, name]) => id !== plan.culpritId && mentions(cover, name),
  );
  if (cover && !namesOther && !culpritClueGivesAway(cover, weaponLabel)) {
    return cover === draft.culpritCover
      ? draft
      : { ...draft, culpritCover: cover };
  }
  const place = getLocalizedLocationLabel(scenarioType, plan.culpritId);
  return {
    ...draft,
    culpritCover: `Cinayet saatinde ${place} içinde tek başımaydım, kendi işimle uğraşıyordum. Bunu saklamamın sebebi kurbanla aramızdaki eski bir mesele; bilinse herkes beni suçlardı.`,
  };
}

// Üretilen bütün metinlerdeki iç kimlikler ("'mill' (AURA-9)") karakterin adına çevrilir
export function cleanDraftIds(
  draft: ScenarioDraft,
  npcNames: Record<string, string>,
): ScenarioDraft {
  const clean = (text: string) => cleanInternalIds(text, npcNames);
  const cleanAll = (map: Record<string, string> | undefined) =>
    map
      ? Object.fromEntries(
          Object.entries(map).map(([key, text]) => [key, clean(text)]),
        )
      : map;
  return {
    ...draft,
    scenario: clean(draft.scenario),
    truthReveal: clean(draft.truthReveal),
    npcPrompts: cleanAll(draft.npcPrompts) ?? {},
    locationClues: cleanAll(draft.locationClues) ?? {},
    alibis: cleanAll(draft.alibis),
    verificationText: draft.verificationText
      ? clean(draft.verificationText)
      : draft.verificationText,
    witnessDescription: draft.witnessDescription
      ? clean(draft.witnessDescription)
      : draft.witnessDescription,
    culpritCover: draft.culpritCover
      ? clean(draft.culpritCover)
      : draft.culpritCover,
    threatLetter: draft.threatLetter
      ? clean(draft.threatLetter)
      : draft.threatLetter,
  };
}

@Injectable()
export class LlmService {
  private readonly client = new GeminiClient();
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly usage: LlmUsageRecorder) {}

  // Her çağrının süresi ve token kullanımı ölçülüp kaydedilir (maliyet takibi)
  private async complete(
    params: CompletionRequest,
    label: string,
    timeoutMs: number,
    usage: LlmUsageContext,
  ) {
    const startedAt = Date.now();
    const response = await this.client.createCompletion(
      params,
      label,
      timeoutMs,
    );
    await this.usage.record(
      usage,
      response?.model ?? 'unknown',
      response?.usage,
      Date.now() - startedAt,
    );
    return response;
  }

  async generateNpcResponse(
    npcName: string,
    npcPrompt: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    isNewDay: boolean = false,
    usage: LlmUsageContext = { kind: 'NPC_REPLY' },
  ): Promise<{ reply: string }> {
    try {
      const systemPrompt = buildNpcDialogueSystemPrompt(
        npcName,
        npcPrompt,
        isNewDay,
      );

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      this.logger.log(
        `Calling Gemini API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`,
      );
      const response = await this.complete(
        { messages, temperature: 0.7 },
        `NPC ${npcName}`,
        30_000,
        usage,
      );

      let responseText = response?.choices?.[0]?.message?.content || '';
      // Model bazen hiç metin döndürmüyor (çoğunlukla kırılma ve itiraf sahnelerinde güvenlik filtresi):
      // bir kez daha denenir, yoksa cevap "Hmm..." olarak kalıyordu
      if (!responseText.trim()) {
        this.logger.warn(
          `Empty reply for NPC ${npcName} (finish: ${response?.choices?.[0]?.finish_reason}); retrying once.`,
        );
        const retry = await this.complete(
          { messages, temperature: 0.9 },
          `NPC ${npcName} retry`,
          30_000,
          usage,
        );
        responseText = retry?.choices?.[0]?.message?.content || '';
      }
      this.logger.log(`Gemini raw response: ${responseText.slice(0, 200)}`);

      const reply = parseNpcReply(responseText, (msg) => this.logger.warn(msg));
      return { reply };
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error?.message || error}`);
      this.logger.error(
        `Type: ${error?.constructor?.name}, Status: ${error?.status}, Code: ${error?.code}`,
      );

      let errorMessage =
        '*Karakter susuyor...* (Beklenmeyen bir hata oluştu, birazdan tekrar dene.)';
      if (error?.status === 429) {
        errorMessage =
          '*Karakter sessizliğe bürünüyor...* (Sunucu şu an çok yoğun, birazdan tekrar dene.)';
      }

      return { reply: errorMessage };
    }
  }

  async generateSessionScenario(
    difficulty: string = 'easy',
    scenarioType: string = 'medieval',
    plan: CasePlan,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const scenarioConfig = getScenarioConfig(
      scenarioType,
      difficulty,
      plan.crimeSceneId,
    );
    const {
      worldDescription,
      styleInstruction,
      npcDefinitions: baseNpcs,
      locationDefinitions,
    } = scenarioConfig;
    const { culpritId } = plan;
    const npcNames = Object.fromEntries(
      baseNpcs.map((npc) => [npc.id, npc.name]),
    );
    const caseBrief = buildCaseBrief(plan, scenarioType, npcNames);

    const prompt = buildScenarioPrompt({
      difficulty,
      scenarioType,
      worldDescription,
      styleInstruction,
      baseNpcs,
      locationDefinitions,
      plan,
      caseBrief,
    });

    this.logger.log(
      `Calling Gemini API to generate dynamic scenario (difficulty: ${difficulty}, scenario: ${scenarioType})...`,
    );

    const response = await this.complete(
      { messages: [{ role: 'user', content: prompt }], temperature: 0.9 },
      'Scenario',
      90_000,
      { kind: 'SCENARIO', sessionId },
    );

    const responseText = response?.choices?.[0]?.message?.content || '';

    try {
      const draft = parseScenarioDraft(responseText);
      const reconciled = await this.reconcileScenarioConsistency(
        draft,
        scenarioType,
        locationDefinitions,
        culpritId,
        caseBrief,
        sessionId,
      );
      const clueRepaired = await this.repairCulpritClue(
        reconciled,
        plan,
        scenarioType,
        sessionId,
      );
      const traceRepaired = await this.repairPlantedTrace(
        clueRepaired,
        plan,
        scenarioType,
        npcNames,
        sessionId,
      );
      const witnessRepaired = await this.repairWitnessLeak(
        traceRepaired,
        plan,
        scenarioType,
        npcNames,
        sessionId,
      );
      const leaksRepaired = await this.repairInnocentLeaks(
        witnessRepaired,
        plan,
        scenarioType,
        npcNames,
        sessionId,
      );
      const placesRepaired = await this.repairAlibiPlaces(
        leaksRepaired,
        plan,
        scenarioType,
        npcNames,
        sessionId,
      );
      const sighted = dropWrongSightings(
        ensureHelperKnowsBuyer(placesRepaired, plan, npcNames),
        plan,
        npcNames,
        scenarioType,
      );
      const covered = ensureCulpritCover(sighted, plan, npcNames, scenarioType);
      if (covered.culpritCover !== sighted.culpritCover?.trim()) {
        this.logger.warn(
          `Culprit cover story rejected, using a plain one: ${sighted.culpritCover ?? '(none)'}`,
        );
      }
      const lettered = ensureThreatLetter(covered, plan, npcNames, scenarioType);
      if (lettered.threatLetter !== covered.threatLetter?.trim()) {
        this.logger.warn(
          `Threat letter rejected, using the universe's own: ${covered.threatLetter ?? '(none)'}`,
        );
      }
      const cleaned = cleanDraftIds(lettered, npcNames);
      // İtirafı oyun verir: rol metinlerinde "sorguda itiraf edeceksin" gibi talimat kalmaz
      return {
        ...cleaned,
        npcPrompts: removeConfessionInstructions(cleaned.npcPrompts ?? {}),
      };
    } catch {
      this.logger.error(`Failed to parse scenario JSON. Response: ${responseText}`);
      throw new Error('Failed to generate scenario JSON');
    }
  }

  // Katilin mekân ipucu cinayeti doğrudan ele veriyorsa (kan, cinayet aleti) ipucu ve gerçek metni
  // motifi gösterecek şekilde onarılır. Doğrulayan kanıt katilin mekânındaysa ipucu zaten izin eşidir.
  private async repairCulpritClue(
    draft: ScenarioDraft,
    plan: CasePlan,
    scenarioType: string,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const { culpritId, verification } = plan;
    if (
      verification.placement.type === 'LOCATION' &&
      verification.placement.locationId === culpritId
    ) {
      return draft;
    }
    const clue = draft.locationClues?.[culpritId];
    const weaponLabel = WEAPONS[normalizeScenarioType(scenarioType)].find(
      (w) => w.id === plan.weaponId,
    )?.label;
    if (!clue || !culpritClueGivesAway(clue, weaponLabel)) return draft;

    this.logger.warn(
      `Culprit clue gives the murder away, repairing: ${clue.slice(0, 120)}`,
    );
    const place = getLocalizedLocationLabel(scenarioType, culpritId);
    let repaired: { clue: string; truthReveal: string } | null = null;
    try {
      const response = await this.complete(
        {
          messages: [
            {
              role: 'user',
              content: buildClueRepairPrompt({
                scenarioType,
                place,
                clue,
                truthReveal: draft.truthReveal,
                motiveLabel: plan.motive
                  ? MOTIVE_LABELS[plan.motive]
                  : undefined,
                weaponLabel,
              }),
            },
          ],
          temperature: 0.4,
        },
        'Culprit clue repair',
        30_000,
        { kind: 'CLUE_REPAIR', sessionId },
      );
      repaired = parseClueRepair(
        response?.choices?.[0]?.message?.content || '',
      );
    } catch (error) {
      this.logger.warn(`Culprit clue repair failed. ${error}`);
    }

    if (repaired && !culpritClueGivesAway(repaired.clue, weaponLabel)) {
      return {
        ...draft,
        truthReveal: repaired.truthReveal,
        locationClues: { ...draft.locationClues, [culpritId]: repaired.clue },
      };
    }
    // Onarım da ele veriyorsa ipucu koddan, motifi gösteren sade bir nota döner
    this.logger.warn(
      'Culprit clue repair rejected; using a plain motive clue.',
    );
    return {
      ...draft,
      locationClues: {
        ...draft.locationClues,
        [culpritId]: `${place} içinde, gözden uzak bir köşeye sıkıştırılmış, kurbanla aradaki meseleyi ima eden katlanmış bir not duruyor.`,
      },
    };
  }

  // Tuzak iz suçlanmak istenen herkesi (adı ya da mekânıyla) işaret etmeli; etmiyorsa iz ve gerçek metni
  // tek küçük çağrıyla onarılır, olmazsa ize eksik kişiler için koddan bir işaret cümlesi eklenir.
  private async repairPlantedTrace(
    draft: ScenarioDraft,
    plan: CasePlan,
    scenarioType: string,
    npcNames: Record<string, string>,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const { crimeSceneClue } = plan;
    const clue = draft.locationClues?.crime_scene;
    if (crimeSceneClue.authentic || !clue) return draft;
    const framed = crimeSceneClue.implicatedNpcIds.map((id) => ({
      name: npcNames[id] ?? id,
      place: getLocalizedLocationLabel(scenarioType, id),
    }));
    const missing = traceMissesFramed(clue, framed, mentions);
    if (missing.length === 0) return draft;

    this.logger.warn(
      `Planted trace misses ${missing.map((m) => m.name).join(', ')}, repairing.`,
    );
    let repaired: { clue: string; truthReveal: string } | null = null;
    try {
      const response = await this.complete(
        {
          messages: [
            {
              role: 'user',
              content: buildTraceRepairPrompt({
                scenarioType,
                clue,
                truthReveal: draft.truthReveal,
                framed,
              }),
            },
          ],
          temperature: 0.4,
        },
        'Planted trace repair',
        30_000,
        { kind: 'CLUE_REPAIR', sessionId },
      );
      repaired = parseClueRepair(
        response?.choices?.[0]?.message?.content || '',
      );
    } catch (error) {
      this.logger.warn(`Planted trace repair failed. ${error}`);
    }

    const culpritName = npcNames[plan.culpritId] ?? plan.culpritId;
    if (
      repaired &&
      traceMissesFramed(repaired.clue, framed, mentions).length === 0 &&
      !mentions(repaired.clue, culpritName)
    ) {
      return {
        ...draft,
        truthReveal: repaired.truthReveal,
        locationClues: { ...draft.locationClues, crime_scene: repaired.clue },
      };
    }
    this.logger.warn('Planted trace repair rejected; adding a plain mark.');
    const extra = missing.map((m) => `${m.name} (${m.place})`).join(' ve ');
    return {
      ...draft,
      locationClues: {
        ...draft.locationClues,
        crime_scene: `${clue} Yakınında ${extra} ile bağlantılı bir işaret de seçiliyor.`,
      },
    };
  }

  // Tamamen masum eşler aynı yeri söyler. İkisinin mazeretinde geçen mekânlar ayrışıyorsa ikincinin
  // mazereti ve mekân ipucu ilkinin yerine göre onarılır; olmazsa ilkinin mazereti ikisine de verilir.
  private async repairAlibiPlaces(
    draft: ScenarioDraft,
    plan: CasePlan,
    scenarioType: string,
    npcNames: Record<string, string>,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const alibis = { ...(draft.alibis ?? {}) };
    const locationClues = { ...draft.locationClues };
    let truthReveal = draft.truthReveal;
    const labels = Object.fromEntries(
      Object.keys(npcNames).map((id) => [
        id,
        getLocalizedLocationLabel(scenarioType, id),
      ]),
    );
    const done = new Set<string>();
    let changed = false;
    const placesOf = (text: string) => placesNamed(text, npcNames, labels);

    const kindOf = (id: string) =>
      plan.involvements?.find((i) => i.npcId === id)?.kind;
    for (const inv of plan.involvements ?? []) {
      if (inv.kind !== 'NONE' || !inv.aboutNpcId) continue;
      // Tek tamamen masumun eşi başka bir roldeyse (ör. leş kargası) eşin mazereti ve ipucu o rolün
      // sırrını taşır; onarılan taraf tamamen masum olandır (pilotta Çin-orta: Huikang/Mei Teyze)
      const partnerIsNone = kindOf(inv.aboutNpcId) === 'NONE';
      const anchorId = partnerIsNone ? inv.npcId : inv.aboutNpcId;
      const partnerId = partnerIsNone ? inv.aboutNpcId : inv.npcId;
      const key = [anchorId, partnerId].sort().join('|');
      if (done.has(key)) continue;
      done.add(key);
      const anchorAlibi = alibis[anchorId];
      const partnerAlibi = alibis[partnerId];
      if (!anchorAlibi || !partnerAlibi) continue;
      const anchorPlaces = placesOf(anchorAlibi);
      const partnerPlaces = placesOf(partnerAlibi);
      const conflict =
        anchorPlaces.size > 0 &&
        partnerPlaces.size > 0 &&
        ![...partnerPlaces].some((p) => anchorPlaces.has(p));
      if (!conflict) continue;

      const placeId = [...anchorPlaces][0];
      this.logger.warn(
        `Alibi partners name different places (${anchorId}: ${[...anchorPlaces].join(',')}, ${partnerId}: ${[...partnerPlaces].join(',')}); aligning.`,
      );
      let aligned: { alibi: string; clue: string; truthReveal: string } | null =
        null;
      try {
        const response = await this.complete(
          {
            messages: [
              {
                role: 'user',
                content: buildAlibiAlignPrompt({
                  scenarioType,
                  anchorName: npcNames[anchorId] ?? anchorId,
                  anchorAlibi,
                  place: labels[placeId],
                  partnerName: npcNames[partnerId] ?? partnerId,
                  partnerAlibi,
                  partnerClue: locationClues[partnerId] ?? '',
                  truthReveal,
                }),
              },
            ],
            temperature: 0.3,
          },
          'Alibi place repair',
          30_000,
          { kind: 'CLUE_REPAIR', sessionId },
        );
        aligned = parseAlibiAlign(
          response?.choices?.[0]?.message?.content || '',
        );
      } catch (error) {
        this.logger.warn(`Alibi place repair failed. ${error}`);
      }
      changed = true;
      if (aligned && placesOf(aligned.alibi).has(placeId)) {
        alibis[partnerId] = aligned.alibi;
        locationClues[partnerId] = aligned.clue;
        truthReveal = aligned.truthReveal;
      } else {
        // İlkinin mazereti iki adı da içerir; ikisinde de aynı yer ve iş geçer
        alibis[partnerId] = anchorAlibi;
      }
    }
    return changed ? { ...draft, alibis, locationClues, truthReveal } : draft;
  }

  // Masumların mekân ipuçları ve rol metinleri katilin adını söylemez. Silahı bilmeden veren aleti kime
  // verdiğini bilir (itirafı koddan söyler), o yüzden onun rol metni denetlenmez; doğrulayan tanığın rol
  // metni repairWitnessLeak'te denetlenir. Onarım da adı söylerse ipucu koddan sade bir notla değişir.
  private async repairInnocentLeaks(
    draft: ScenarioDraft,
    plan: CasePlan,
    scenarioType: string,
    npcNames: Record<string, string>,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const culpritName = npcNames[plan.culpritId] ?? plan.culpritId;
    const leaks = (text: string | undefined) =>
      !!text && mentions(text, culpritName);
    const { placement } = plan.verification;
    const witnessId = placement.type === 'TESTIMONY' ? placement.npcId : null;
    const kindOf = (id: string) =>
      plan.involvements?.find((i) => i.npcId === id)?.kind;

    const fields: Record<string, string> = {};
    for (const id of plan.innocentIds) {
      const clue = draft.locationClues?.[id];
      if (leaks(clue)) fields[`clue:${id}`] = clue;
      const prompt = draft.npcPrompts?.[id];
      if (
        id !== witnessId &&
        kindOf(id) !== 'UNWITTING_HELP' &&
        leaks(prompt)
      ) {
        fields[`prompt:${id}`] = prompt;
      }
    }
    const keys = Object.keys(fields);
    if (keys.length === 0) return draft;

    this.logger.warn(
      `Innocent texts name the culprit, repairing: ${keys.join(', ')}`,
    );
    let repaired: Record<string, string> | null = null;
    try {
      const response = await this.complete(
        {
          messages: [
            {
              role: 'user',
              content: buildLeakRepairPrompt({
                scenarioType,
                culpritName,
                fields,
              }),
            },
          ],
          temperature: 0.3,
        },
        'Innocent leak repair',
        30_000,
        { kind: 'WITNESS_REPAIR', sessionId },
      );
      repaired = parseLeakRepair(
        response?.choices?.[0]?.message?.content || '',
        keys,
      );
    } catch (error) {
      this.logger.warn(`Innocent leak repair failed. ${error}`);
    }

    const locationClues = { ...draft.locationClues };
    const npcPrompts = { ...draft.npcPrompts };
    for (const key of keys) {
      const [field, id] = key.split(':');
      const fixed = repaired?.[key];
      const ok = !!fixed && !leaks(fixed);
      if (field === 'clue') {
        locationClues[id] = ok
          ? fixed
          : `${getLocalizedLocationLabel(scenarioType, id)} içinde, gözden uzak bir köşede, sahibinin o geceyle ilgili sakladığı bir kayıt duruyor.`;
      } else {
        // Rol metninde ad kalırsa adın geçtiği cümleler çıkarılır
        npcPrompts[id] = ok
          ? fixed
          : fields[key]
              .split(/(?<=[.!?])\s+/)
              .filter((sentence) => !leaks(sentence))
              .join(' ');
      }
    }
    return { ...draft, locationClues, npcPrompts };
  }

  // Doğrulayan tanık katili görmemiştir. Tanıklık metninde ya da tanığın rolünde katilin adı geçerse
  // ikisi tek küçük çağrıyla onarılır; olmazsa koddan, kimseyi adıyla söylemeyen sade bir tanıklık konur.
  private async repairWitnessLeak(
    draft: ScenarioDraft,
    plan: CasePlan,
    scenarioType: string,
    npcNames: Record<string, string>,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const { placement } = plan.verification;
    if (placement.type !== 'TESTIMONY') return draft;
    const witnessId = placement.npcId;
    const culpritName = npcNames[plan.culpritId] ?? plan.culpritId;
    const witnessName = npcNames[witnessId] ?? witnessId;
    const verificationText = draft.verificationText ?? '';
    const npcPrompt = draft.npcPrompts?.[witnessId] ?? '';
    const leaks = (text: string) => mentions(text, culpritName);
    if (!leaks(verificationText) && !leaks(npcPrompt)) return draft;

    this.logger.warn(
      `Verifying witness names the culprit, repairing: ${verificationText.slice(0, 120)}`,
    );
    let repaired: { verificationText: string; npcPrompt: string } | null = null;
    try {
      const response = await this.complete(
        {
          messages: [
            {
              role: 'user',
              content: buildWitnessRepairPrompt({
                scenarioType,
                witnessName,
                culpritName,
                verificationText,
                npcPrompt,
              }),
            },
          ],
          temperature: 0.3,
        },
        'Witness repair',
        30_000,
        { kind: 'WITNESS_REPAIR', sessionId },
      );
      repaired = parseWitnessRepair(
        response?.choices?.[0]?.message?.content || '',
      );
    } catch (error) {
      this.logger.warn(`Witness repair failed. ${error}`);
    }

    if (
      repaired &&
      !leaks(repaired.verificationText) &&
      !leaks(repaired.npcPrompt)
    ) {
      return {
        ...draft,
        verificationText: repaired.verificationText,
        npcPrompts: { ...draft.npcPrompts, [witnessId]: repaired.npcPrompt },
      };
    }
    // Onarım da adı söylüyorsa tanıklık koddan kurulur: eylem var, kişi yok
    this.logger.warn('Witness repair rejected; using a plain testimony.');
    const framed = plan.crimeSceneClue.implicatedNpcIds[0];
    const plain =
      plan.verification.kind === 'FLAW' && framed
        ? `${witnessName}, cinayetten kısa süre önce birinin, olay yerinde bulunan eşyayı ${npcNames[framed] ?? framed} adlı kişinin mekânından aldığını gördü; karanlıkta kim olduğunu seçemedi.`
        : `${witnessName}, cinayet saatinde olay yerinin yakınında ${draft.witnessDescription ? `${draft.witnessDescription} ` : ''}birini gördü; yüzünü seçemedi.`;
    return {
      ...draft,
      verificationText: plain,
      npcPrompts: {
        ...draft.npcPrompts,
        [witnessId]: `Sen ${witnessName}'sın. O gece şunu gördün: ${plain} Kim olduğunu bilmiyorsun, kimseyi tahmin etmezsin. Bunu, o gece ya da olay yerindeki eşya sorulunca anlatırsın.`,
      },
    };
  }

  private async reconcileScenarioConsistency(
    draft: ScenarioDraft,
    scenarioType: string,
    locationDefinitions: Array<{ id: string; description: string }>,
    culpritId: string,
    caseBrief: string,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const reviewPrompt = buildReconciliationPrompt({
      draft,
      scenarioType,
      locationDefinitions,
      culpritId,
      caseBrief,
    });

    try {
      const response = await this.complete(
        { messages: [{ role: 'user', content: reviewPrompt }], temperature: 0.2 },
        'Scenario review',
        90_000,
        { kind: 'SCENARIO_REVIEW', sessionId },
      );

      const responseText = response?.choices?.[0]?.message?.content || '';
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        return draft;
      }

      const reviewed = JSON.parse(
        responseText.substring(firstBrace, lastBrace + 1),
      ) as ScenarioDraft;
      return mergeScenarioDraftWithFallback(
        draft,
        reviewed,
        locationDefinitions.map((location) => location.id),
      );
    } catch (error) {
      this.logger.warn(
        `Scenario continuity reconciliation failed, using draft as-is. ${error}`,
      );
      return draft;
    }
  }

  async generateBoardThought(
    lines: ThoughtLine[],
    scenarioType: string,
    sessionId?: string,
  ): Promise<string | null> {
    const prompt = buildBoardThoughtPrompt(lines, scenarioType);

    try {
      const response = await this.complete(
        { messages: [{ role: 'user', content: prompt }], temperature: 0.6 },
        'Board thought',
        30_000,
        { kind: 'BOARD_THOUGHT', sessionId },
      );
      const text = (response?.choices?.[0]?.message?.content || '').trim();
      return text || null;
    } catch (error) {
      this.logger.warn(
        `Board thought failed, falling back to template. ${error}`,
      );
      return null;
    }
  }

  // Hüküm Dosyası hakemi: oyuncunun olay anlatımını gerçekle karşılaştırır; başarısızlıkta null
  async judgeVerdictNarrative(
    judgeCase: VerdictJudgeCase,
    narrative: string,
    sessionId?: string,
  ): Promise<VerdictJudgement | null> {
    const prompt = buildVerdictJudgePrompt(judgeCase, narrative);

    try {
      const response = await this.complete(
        { messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
        'Verdict judge',
        30_000,
        { kind: 'VERDICT_JUDGE', sessionId },
      );
      return parseVerdictJudgement(
        response?.choices?.[0]?.message?.content || '',
      );
    } catch (error) {
      this.logger.warn(`Verdict judge failed. ${error}`);
      return null;
    }
  }

  // Çelişki Taraması: şüphelinin kendi cevapları arasındaki çelişkiler; başarısızlıkta null.
  // Önce adaylar bulunur, sonra her aday iki tam cevapla ayrıca kontrol edilir (yanlış alarm olmasın).
  async findContradictions(
    npcName: string,
    replies: string[],
    scenarioType: string,
    sessionId?: string,
  ): Promise<Contradiction[] | null> {
    const ask = async <T>(
      prompt: string,
      parse: (text: string) => T | null,
    ): Promise<T | null> => {
      // Model ara sıra okunamayan JSON döndürüyor (ölçümde 36 taramada 1); o zaman bir kez daha sorulur
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await this.complete(
          { messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
          'Contradiction scan',
          30_000,
          { kind: 'CONTRADICTION_SCAN', sessionId },
        );
        const parsed = parse(response?.choices?.[0]?.message?.content || '');
        if (parsed) return parsed;
      }
      return null;
    };

    try {
      const candidates = await ask(
        buildContradictionPrompt(npcName, replies, scenarioType),
        (text) => parseContradictions(text, replies, MAX_CANDIDATES),
      );
      if (!candidates?.length) return candidates;
      const checked = await ask(
        buildContradictionCheckPrompt(npcName, replies, candidates),
        (text) => parseContradictionCheck(text, candidates),
      );
      return checked;
    } catch (error) {
      this.logger.warn(`Contradiction scan failed. ${error}`);
      return null;
    }
  }

  // Hikâye hakemi: havuza girecek vakanın metinlerindeki kaymalar; başarısızlıkta null.
  // stories/story-review.ts reviewStory'ye StoryJudge olarak verilir. Model ara sıra okunamayan
  // JSON döndürüyor (denemelerde ~%5); o zaman bir kez daha sorulur.
  async reviewStory(
    input: StoryReviewInput,
    fields: Record<string, string>,
  ): Promise<StoryIssue[] | null> {
    const prompt = buildStoryReviewPrompt(input, fields);

    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const response = await this.complete(
          { messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
          'Story review',
          90_000,
          { kind: 'STORY_REVIEW' },
        );
        const text = response?.choices?.[0]?.message?.content || '';
        const issues = parseStoryReview(text, fields);
        if (issues) return issues;
        this.logger.warn(
          `Story review returned unreadable JSON (attempt ${attempt}): …${text.slice(-300)}`,
        );
      }
      return null;
    } catch (error) {
      this.logger.warn(`Story review failed. ${error}`);
      return null;
    }
  }
}
