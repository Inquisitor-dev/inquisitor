// Hikâye havuzunu doldurma: `npm run stories:generate -- <seçenekler>`
//   --per-bucket N           her kovada (evren × zorluk) olması gereken reddedilmemiş hikâye sayısı (varsayılan 1)
//   --universe a,b           evrenler (varsayılan: hepsi)
//   --difficulty a,b         zorluklar (varsayılan: hepsi)
//   --max-tokens N           token bütçesi; dolunca yeni hikâyeye başlanmaz (varsayılan 300000)
//   --dry-run                veritabanına okumaz ve yazmaz; hikâyeleri yalnızca üretip denetler
//   --out dosya.json         sonuçları (dry-run'da paketlerle birlikte) dosyaya yazar
// Her hikâye: paket üretimi (oyundaki yol) → kod doğrulaması → hakem → Story tablosuna DRAFT ya da
// REJECTED. Kovada zaten reddedilmemiş hikâye varsa sayılır: komut yarıda kalırsa yeniden çalıştırınca
// kaldığı yerden devam eder. Token kullanımı LlmUsage tablosuna da yazılır (npm run usage:report).
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { LlmService } from '../src/llm/llm.service';
import {
  LlmUsageContext,
  LlmUsageRecorder,
} from '../src/llm/usage/llm-usage.recorder';
import { GameSessionsService } from '../src/game-sessions/game-sessions.service';
import { StoryPoolService } from '../src/stories/story-pool.service';
import {
  StoryPackage,
  packageToReviewInput,
} from '../src/stories/story-package';
import { validateStoryPackage } from '../src/stories/story-validation';
import { StoryJudge, reviewStory } from '../src/stories/story-review';
import {
  StoryBucket,
  StoryReviewRecord,
  bucketKey,
  initialStoryStatus,
  plannedJobs,
} from '../src/stories/story-generation';
import { UNIVERSE_REGISTRY } from '../src/scenarios/universes';

Logger.overrideLogger(['warn', 'error']);

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DEFAULT_MAX_TOKENS = 300_000;
// Kotayı zorlamamak için iki hikâye arasında kısa bekleme
const PAUSE_MS = 1500;
// Art arda bu kadar üretim hatası (çoğunlukla kota) olursa durulur
const MAX_CONSECUTIVE_FAILURES = 3;

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

const list = (name: string, fallback: string[]) =>
  option(name)?.split(',').filter(Boolean) ?? fallback;

const count = (name: string, fallback: number) => {
  const value = Number(option(name));
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const dryRun = option('dry-run') !== undefined;
const prisma = new PrismaService();

// Token kullanımı hem bellekte (bütçe ve rapor için) toplanır hem de LlmUsage'a yazılır
const usage = { generation: 0, review: 0 };
const dbRecorder = new LlmUsageRecorder(prisma);
const recorder = {
  record: async (
    context: LlmUsageContext,
    model: string,
    tokens: { total_tokens?: number } | undefined,
    durationMs: number,
  ) => {
    const total = tokens?.total_tokens ?? 0;
    if (context.kind === 'STORY_REVIEW') usage.review += total;
    else usage.generation += total;
    if (!dryRun) await dbRecorder.record(context, model, tokens, durationMs);
  },
};
const llm = new LlmService(recorder as unknown as LlmUsageRecorder);
const sessions = new GameSessionsService(prisma, llm);
const pool = new StoryPoolService(prisma);
const judge: StoryJudge = (input, fields) => llm.reviewStory(input, fields);

interface GeneratedStory {
  bucket: string;
  storyId: string | null;
  status: 'DRAFT' | 'REJECTED' | 'FAILED';
  record: StoryReviewRecord | null;
  error?: string;
  package?: StoryPackage;
}

// Kovalardaki reddedilmemiş hikâyeler (DRAFT + APPROVED)
async function existingCounts(): Promise<Record<string, number>> {
  if (dryRun) return {};
  const stats = await pool.getPoolStats();
  const counts: Record<string, number> = {};
  for (const row of stats) {
    if (row.status === 'REJECTED') continue;
    const key = bucketKey(row);
    counts[key] = (counts[key] ?? 0) + row._count.id;
  }
  return counts;
}

async function generateOne(bucket: StoryBucket): Promise<GeneratedStory> {
  usage.generation = 0;
  usage.review = 0;
  const pkg = await sessions.generateStoryPackage(
    bucket.universe,
    bucket.difficulty,
  );
  const validation = validateStoryPackage(pkg);
  // Doğrulamadan kalan hikâye için hakeme token harcanmaz
  const review = validation.valid
    ? await reviewStory(packageToReviewInput(pkg), judge)
    : null;
  const status = initialStoryStatus(validation, review);
  const record: StoryReviewRecord = {
    validation,
    review,
    tokens: { ...usage },
    generatedAt: new Date().toISOString(),
  };
  const story = dryRun
    ? null
    : await pool.saveDraft(bucket, pkg, undefined, {
        status,
        reviewResults: record,
      });
  return {
    bucket: bucketKey(bucket),
    storyId: story?.id ?? null,
    status,
    record,
    ...(dryRun ? { package: pkg } : {}),
  };
}

function printStory(index: number, total: number, story: GeneratedStory) {
  const head = `[${index}/${total}] ${story.bucket}`;
  if (!story.record) {
    console.log(`\n${head}: üretilemedi (${story.error})`);
    return;
  }
  const { validation, review, tokens } = story.record;
  console.log(
    `\n${head} → ${story.status}${story.storyId ? ` · ${story.storyId}` : ''}` +
      ` · hakem: ${review ? review.verdict : 'çalışmadı (doğrulamadan kaldı)'}` +
      ` · üretim ${tokens.generation} + hakem ${tokens.review} token`,
  );
  for (const error of validation.errors) console.log(`  - HATA ${error}`);
  for (const warning of validation.warnings)
    console.log(`  - UYARI ${warning}`);
  for (const issue of review?.issues ?? []) {
    console.log(
      `  - ${issue.severity} ${issue.category} [${issue.field}] “${issue.quote}” — ${issue.note}`,
    );
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY tanımlı değil (backend/.env).');
    process.exitCode = 1;
    return;
  }
  const universes = list('universe', Object.keys(UNIVERSE_REGISTRY));
  const difficulties = list('difficulty', DIFFICULTIES);
  const perBucket = count('per-bucket', 1);
  const maxTokens = count('max-tokens', DEFAULT_MAX_TOKENS);
  const buckets = universes.flatMap((universe) =>
    difficulties.map((difficulty) => ({ universe, difficulty })),
  );

  const jobs = plannedJobs(buckets, perBucket, await existingCounts());
  console.log(
    `${buckets.length} kova, kova başına ${perBucket} hikâye: ${jobs.length} hikâye üretilecek` +
      ` (bütçe ${maxTokens} token${dryRun ? ', dry-run: veritabanına yazılmaz' : ''}).`,
  );

  const results: GeneratedStory[] = [];
  let spent = 0;
  let consecutiveFailures = 0;
  for (const [i, job] of jobs.entries()) {
    if (spent >= maxTokens) {
      console.log(
        `\nBütçe doldu (${spent} token); ${jobs.length - i} hikâye üretilmedi. Komutu yeniden çalıştırınca kaldığı yerden devam eder.`,
      );
      break;
    }
    let story: GeneratedStory;
    try {
      story = await generateOne(job);
      consecutiveFailures = 0;
    } catch (error) {
      story = {
        bucket: bucketKey(job),
        storyId: null,
        status: 'FAILED',
        record: null,
        error: String(error),
      };
      consecutiveFailures++;
    }
    spent += usage.generation + usage.review;
    results.push(story);
    printStory(i + 1, jobs.length, story);
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(
        `\nArt arda ${MAX_CONSECUTIVE_FAILURES} hikâye üretilemedi (kota ya da bağlantı); durduruldu.`,
      );
      break;
    }
    await sleep(PAUSE_MS);
  }

  const by = (status: GeneratedStory['status']) =>
    results.filter((r) => r.status === status).length;
  const drafts = by('DRAFT');
  console.log(
    `\nSonuç: ${results.length} hikâye · taslak ${drafts} · reddedilen ${by('REJECTED')} · üretilemeyen ${by('FAILED')}` +
      ` · toplam ${spent} token` +
      (results.length
        ? ` · hikâye başına ${Math.round(spent / results.length)}`
        : '') +
      (drafts ? ` · taslak başına ${Math.round(spent / drafts)}` : ''),
  );

  if (!dryRun) {
    const counts = await existingCounts();
    console.log('\nKovalardaki reddedilmemiş hikâyeler:');
    console.table(
      buckets.map((bucket) => ({
        kova: bucketKey(bucket),
        hikâye: counts[bucketKey(bucket)] ?? 0,
        hedef: perBucket,
      })),
    );
  }

  const out = option('out');
  if (out) {
    writeFileSync(out, JSON.stringify(results, null, 2));
    console.log(`\nSonuçlar ${out} dosyasına yazıldı.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.onModuleDestroy());
