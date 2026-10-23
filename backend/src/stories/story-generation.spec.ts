import {
  initialStoryStatus,
  plannedJobs,
  StoryBucket,
} from './story-generation';
import type { StoryReviewResult } from './story-review';

const buckets: StoryBucket[] = [
  { universe: 'medieval', difficulty: 'easy' },
  { universe: 'winter', difficulty: 'easy' },
];

describe('plannedJobs', () => {
  it('kovaları sırayla birer birer doldurur', () => {
    expect(plannedJobs(buckets, 2, {})).toEqual([
      buckets[0],
      buckets[1],
      buckets[0],
      buckets[1],
    ]);
  });

  it('kovada var olan hikâyeleri sayar; dolu kova için iş çıkmaz', () => {
    expect(
      plannedJobs(buckets, 2, { 'medieval/easy': 1, 'winter/easy': 5 }),
    ).toEqual([buckets[0]]);
    expect(
      plannedJobs(buckets, 1, { 'medieval/easy': 1, 'winter/easy': 1 }),
    ).toEqual([]);
  });
});

describe('initialStoryStatus', () => {
  const valid = { valid: true, errors: [], warnings: [] };
  const review = (
    verdict: StoryReviewResult['verdict'],
  ): StoryReviewResult => ({
    verdict,
    issues: [],
    judged: true,
  });

  it('kod doğrulamasından kalan hikâyeyi reddeder', () => {
    expect(
      initialStoryStatus({ valid: false, errors: ['x'], warnings: [] }, null),
    ).toBe('REJECTED');
  });

  it('hakem kesin hata bulduysa reddeder, yoksa taslak bırakır', () => {
    expect(initialStoryStatus(valid, review('REJECT'))).toBe('REJECTED');
    expect(initialStoryStatus(valid, review('HUMAN'))).toBe('DRAFT');
    expect(initialStoryStatus(valid, review('PASS'))).toBe('DRAFT');
    expect(initialStoryStatus(valid, null)).toBe('DRAFT');
  });
});
