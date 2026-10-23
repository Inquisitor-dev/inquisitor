import type { StoryValidation } from './story-validation';
import type { StoryReviewResult } from './story-review';

// Hikâye havuzunu doldurma (prisma/story-generate.ts) için saf yardımcılar: hangi kovaya kaç hikâye
// üretileceği, üretilen hikâyenin ilk durumu ve Story.reviewResults'a yazılan kayıt.

export interface StoryBucket {
  universe: string;
  difficulty: string;
}

export const bucketKey = (bucket: StoryBucket) =>
  `${bucket.universe}/${bucket.difficulty}`;

// Her kovayı hedef sayıya tamamlayan işler. Kovalar sırayla birer birer doldurulur: bütçe yarıda
// biterse hikâyeler kovalara eşit dağılmış olur. Kovada zaten (reddedilmemiş) hikâye varsa sayılır;
// komut yarıda kalıp yeniden çalıştırılınca kaldığı yerden devam eder.
export function plannedJobs(
  buckets: StoryBucket[],
  perBucket: number,
  existing: Record<string, number>,
): StoryBucket[] {
  const missing = buckets.map((bucket) =>
    Math.max(0, perBucket - (existing[bucketKey(bucket)] ?? 0)),
  );
  const jobs: StoryBucket[] = [];
  for (let round = 0; round < perBucket; round++) {
    buckets.forEach((bucket, i) => {
      if (round < missing[i]) jobs.push(bucket);
    });
  }
  return jobs;
}

export type StoryDraftStatus = 'DRAFT' | 'REJECTED';

// Kod doğrulamasından kalan ya da hakemin kesin hata bulduğu hikâye doğrudan reddedilir;
// geri kalanı taslak olarak insan onayını bekler (hakem geçirse de)
export function initialStoryStatus(
  validation: StoryValidation,
  review: StoryReviewResult | null,
): StoryDraftStatus {
  if (!validation.valid) return 'REJECTED';
  return review?.verdict === 'REJECT' ? 'REJECTED' : 'DRAFT';
}

// Story.reviewResults: kod doğrulaması, hakem, maliyet ve (onaydan sonra) insanın kararı
export interface StoryReviewRecord {
  validation: StoryValidation;
  // Doğrulamadan kalan hikâye hakeme gönderilmez
  review: StoryReviewResult | null;
  tokens: { generation: number; review: number };
  generatedAt: string;
  decision?: {
    status: 'APPROVED' | 'REJECTED';
    by: string;
    note?: string;
    at: string;
  };
}
