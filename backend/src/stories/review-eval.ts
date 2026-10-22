import type { ReviewFixture } from './review-fixtures';
import type { StoryReviewResult } from './story-review';

// Hakem denemesinin değerlendirmesi (prisma/story-review.ts --fixtures):
// temiz vakada her bulgu yanlış alarmdır; bozuk vakada beklenen kategoride bir bulgu yakalamadır.

export type FixtureOutcome =
  | 'CAUGHT' // beklenen kategoride bulgu var
  | 'MISSED' // bozuk vakada beklenen bulgu yok
  | 'CLEAN' // temiz vakada bulgu yok
  | 'FALSE_ALARM'; // temiz vakada bulgu var

export interface FixtureEvaluation {
  outcome: FixtureOutcome;
  // Yakalanan bulgu beklenen alanda mı (temiz vakada ve kaçırılanda null)
  fieldMatch: boolean | null;
  // Beklenen kategoride olmayan bulgular (bozuk vakada fazladan, temizde hepsi)
  extra: number;
}

export function evaluateFixture(
  fixture: ReviewFixture,
  result: StoryReviewResult,
): FixtureEvaluation {
  if (fixture.expect.length === 0) {
    return {
      outcome: result.issues.length === 0 ? 'CLEAN' : 'FALSE_ALARM',
      fieldMatch: null,
      extra: result.issues.length,
    };
  }
  const hits = result.issues.filter((issue) =>
    fixture.expect.includes(issue.category),
  );
  return {
    outcome: hits.length > 0 ? 'CAUGHT' : 'MISSED',
    fieldMatch:
      hits.length > 0
        ? hits.some((issue) => issue.field === fixture.field)
        : null,
    extra: result.issues.length - hits.length,
  };
}

export interface FixtureSummary {
  // Bozuk vakalardan yakalananlar / toplam deneme
  caught: number;
  broken: number;
  // Temiz vakada yanlış alarm veren denemeler / toplam
  falseAlarms: number;
  clean: number;
  // Hakemin çalışmadığı denemeler (cevap okunamadı ya da çağrı başarısız)
  unjudged: number;
}

export function summarizeFixtures(
  runs: { fixture: ReviewFixture; result: StoryReviewResult }[],
): FixtureSummary {
  const summary: FixtureSummary = {
    caught: 0,
    broken: 0,
    falseAlarms: 0,
    clean: 0,
    unjudged: 0,
  };
  for (const { fixture, result } of runs) {
    if (!result.judged) summary.unjudged++;
    const { outcome } = evaluateFixture(fixture, result);
    if (outcome === 'CAUGHT' || outcome === 'MISSED') summary.broken++;
    if (outcome === 'CAUGHT') summary.caught++;
    if (outcome === 'CLEAN' || outcome === 'FALSE_ALARM') summary.clean++;
    if (outcome === 'FALSE_ALARM') summary.falseAlarms++;
  }
  return summary;
}
