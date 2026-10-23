import type { CaseFacts, CasePlan } from '../scenarios/case-setup';
import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';
import type { StoryReviewInput } from './story-review';

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
 * Havuzdan hikâye aramak için kullanılan kriterler.
 */
export interface StoryCriteria {
  universe: string;
  difficulty: string;
  wildcardCount?: number;
  gameMode?: string;
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
