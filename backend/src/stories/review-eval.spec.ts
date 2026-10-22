import { evaluateFixture, summarizeFixtures } from './review-eval';
import { REVIEW_FIXTURES } from './review-fixtures';
import type { StoryIssue, StoryReviewResult } from './story-review';

const fixture = (id: string) => REVIEW_FIXTURES.find((f) => f.id === id)!;

const issue = (patch: Partial<StoryIssue>): StoryIssue => ({
  category: 'TRUTH',
  severity: 'CERTAIN',
  field: 'truthReveal',
  quote: 'x',
  note: 'x',
  source: 'JUDGE',
  ...patch,
});

const result = (issues: StoryIssue[], judged = true): StoryReviewResult => ({
  verdict: issues.length ? 'REJECT' : 'PASS',
  issues,
  judged,
});

describe('evaluateFixture', () => {
  it('temiz vakada bulgu yoksa temiz, varsa yanlış alarm', () => {
    expect(evaluateFixture(fixture('clean'), result([])).outcome).toBe('CLEAN');
    expect(
      evaluateFixture(fixture('clean'), result([issue({})])),
    ).toMatchObject({ outcome: 'FALSE_ALARM', extra: 1 });
  });

  it('bozuk vakada beklenen kategorilerden biri yeter; alanı ayrıca ölçer', () => {
    const logic = fixture('logic-wound-weapon');
    expect(
      evaluateFixture(
        logic,
        result([issue({ category: 'TRUTH', field: 'truthReveal' })]),
      ),
    ).toEqual({ outcome: 'CAUGHT', fieldMatch: true, extra: 0 });
    expect(
      evaluateFixture(
        logic,
        result([
          issue({ category: 'LOGIC', field: 'npcPrompts.mill' }),
          issue({ category: 'LANGUAGE' }),
        ]),
      ),
    ).toEqual({ outcome: 'CAUGHT', fieldMatch: false, extra: 1 });
  });

  it('beklenen kategoride bulgu yoksa kaçırılmış sayılır', () => {
    expect(
      evaluateFixture(
        fixture('role-confess-instruction'),
        result([issue({ category: 'LANGUAGE' })]),
      ),
    ).toEqual({ outcome: 'MISSED', fieldMatch: null, extra: 1 });
  });
});

describe('summarizeFixtures', () => {
  it('yakalama, yanlış alarm ve çalışmayan hakemi sayar', () => {
    expect(
      summarizeFixtures([
        { fixture: fixture('clean'), result: result([]) },
        { fixture: fixture('clean'), result: result([issue({})]) },
        {
          fixture: fixture('role-confess-instruction'),
          result: result([issue({ category: 'ROLE' })]),
        },
        {
          fixture: fixture('logic-time-of-death'),
          result: result([], false),
        },
      ]),
    ).toEqual({
      caught: 1,
      broken: 2,
      falseAlarms: 1,
      clean: 2,
      unjudged: 1,
    });
  });
});
