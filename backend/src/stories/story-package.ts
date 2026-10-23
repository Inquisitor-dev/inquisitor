import type { CaseFacts, CasePlan, Involvement } from '../scenarios/case-setup';
import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';
import type { StoryReviewInput } from './story-review';
import {
  MOTIVES,
  type MotiveId,
  TIMES_OF_DEATH,
  type TimeOfDeath,
} from '../scenarios/case-catalog';

/**
 * Vaka Motoru v2 gereksinimlerini (silah, motif, ölüm saati, sırlar ve kişilik korku eşikleri)
 * kesin olarak içeren zenginleştirilmiş vaka planı.
 */
export interface CasePlanV2 extends CasePlan {
  weaponId: string;
  motive: MotiveId;
  timeOfDeath: TimeOfDeath;
  involvements: Involvement[];
  fearThresholds: Record<string, number>;
}

/**
 * Vaka Motoru v2 gerçekleri: v2 planı ve yapay zekâ metinlerinin birleşimi.
 */
export interface CaseFactsV2 extends CaseFacts, CasePlanV2 {
  weaponId: string;
  motive: MotiveId;
  timeOfDeath: TimeOfDeath;
  involvements: Involvement[];
  fearThresholds: Record<string, number>;
}

/**
 * Önceden üretilmiş ya da oyunda kurulmuş eksiksiz vaka paketi.
 * Kodun planı (CasePlan), vaka gerçekleri (CaseFacts) ve Gemini'nin yazdığı
 * tüm metinleri (ScenarioDraft) içerir.
 */
export interface StoryPackage {
  scenarioType: string;
  difficulty: string;
  wildcardCount?: number;
  gameMode?: string;
  plan: CasePlan;
  facts: CaseFacts;
  draft: ScenarioDraft;
}

/**
 * Vaka Motoru v2 standartlarına tam uyumlu hikâye paketi.
 */
export interface StoryPackageV2 extends StoryPackage {
  plan: CasePlanV2;
  facts: CaseFactsV2;
}

/**
 * Havuzdan hikâye aramak için kullanılan kriterler.
 */
export interface StoryCriteria {
  universe: string;
  difficulty: string;
  wildcardCount?: number;
  gameMode?: string;
  ruleVersion?: number;
  minRuleVersion?: number;
}

/**
 * StoryPackage nesnesini hakemin (StoryReview) okuyabileceği formata dönüştürür.
 */
export function packageToReviewInput(pkg: StoryPackage): StoryReviewInput {
  return {
    scenarioType: pkg.scenarioType,
    facts: pkg.facts,
    scenario: pkg.draft.scenario,
    truthReveal: pkg.draft.truthReveal,
    npcPrompts: pkg.draft.npcPrompts ?? {},
    locationClues: pkg.draft.locationClues ?? {},
  };
}

/**
 * Bir hikâye paketinin Vaka Motoru v2 biçiminde olup olmadığını kontrol eden Type Guard.
 */
export function isV2StoryPackage(pkg: StoryPackage): pkg is StoryPackageV2 {
  return (
    typeof pkg.plan?.weaponId === 'string' &&
    typeof pkg.plan?.motive === 'string' &&
    typeof pkg.plan?.timeOfDeath === 'string' &&
    Array.isArray(pkg.plan?.involvements) &&
    pkg.plan.involvements.length > 0 &&
    typeof pkg.plan?.fearThresholds === 'object' &&
    pkg.plan.fearThresholds !== null &&
    typeof pkg.facts?.weaponId === 'string' &&
    Array.isArray(pkg.facts?.involvements)
  );
}

/**
 * Bir hikâye paketinin Vaka Motoru v2 kurallarına uygunluğunu ayrıntılı olarak doğrular.
 * Bozuk veya eksik alanların listesini döner.
 */
export function validateV2StoryPackage(pkg: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, errors: ['Hikâye paketi bir nesne olmalıdır.'] };
  }

  const p = pkg as Partial<StoryPackage>;
  if (!p.scenarioType) errors.push('scenarioType eksik.');
  if (!p.difficulty) errors.push('difficulty eksik.');
  if (!p.plan) errors.push('plan nesnesi eksik.');
  if (!p.facts) errors.push('facts nesnesi eksik.');
  if (!p.draft) errors.push('draft nesnesi eksik.');

  if (p.plan) {
    if (!p.plan.culpritId) errors.push('plan.culpritId eksik.');
    if (!p.plan.weaponId) errors.push('v2 alanı eksik: plan.weaponId');
    if (!p.plan.motive || !MOTIVES.includes(p.plan.motive)) {
      errors.push(`v2 alanı geçersiz: plan.motive (${p.plan.motive})`);
    }
    if (!p.plan.timeOfDeath || !TIMES_OF_DEATH.includes(p.plan.timeOfDeath)) {
      errors.push(`v2 alanı geçersiz: plan.timeOfDeath (${p.plan.timeOfDeath})`);
    }
    if (!Array.isArray(p.plan.involvements) || p.plan.involvements.length === 0) {
      errors.push('v2 alanı eksik veya boş: plan.involvements (cinayete bağlı sırlar)');
    }
    if (!p.plan.fearThresholds || typeof p.plan.fearThresholds !== 'object') {
      errors.push('v2 alanı eksik: plan.fearThresholds (kişiliğe göre korku eşikleri)');
    }
  }

  if (p.facts) {
    if (!p.facts.victim?.name) errors.push('facts.victim.name eksik.');
    if (!p.facts.alibis || typeof p.facts.alibis !== 'object') {
      errors.push('facts.alibis mazeretler eksik.');
    }
  }

  if (p.draft) {
    if (!p.draft.scenario) errors.push('draft.scenario eksik.');
    if (!p.draft.truthReveal) errors.push('draft.truthReveal eksik.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Veritabanından okunan JSON içeriğin geçerli bir StoryPackage olduğunu doğrular.
 */
export function parseStoryPackage(raw: unknown): StoryPackage {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Geçersiz hikâye paketi: içerik bir nesne olmalıdır.');
  }
  const pkg = raw as Partial<StoryPackage>;
  if (
    !pkg.scenarioType ||
    !pkg.difficulty ||
    !pkg.plan ||
    !pkg.facts ||
    !pkg.draft
  ) {
    throw new Error(
      'Geçersiz hikâye paketi: zorunlu alanlar (scenarioType, difficulty, plan, facts, draft) eksik.',
    );
  }
  return pkg as StoryPackage;
}

/**
 * JSON içeriği çözer ve Vaka Motoru v2 biçiminde olduğunu garanti eder.
 */
export function parseV2StoryPackage(raw: unknown): StoryPackageV2 {
  const pkg = parseStoryPackage(raw);
  const validation = validateV2StoryPackage(pkg);
  if (!validation.valid) {
    throw new Error(
      `Vaka Motoru v2 paket doğrulama hatası:\n- ${validation.errors.join('\n- ')}`,
    );
  }
  return pkg as StoryPackageV2;
}
