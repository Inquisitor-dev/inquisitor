// Hikâye havuzunun insan onayı: `npm run stories:approve -- <komut>`
//   --list [--status DRAFT|REJECTED|APPROVED|all] [--universe x] [--difficulty y]
//                              hikâyeleri hakem kararı ve bulgularıyla listeler (varsayılan: DRAFT)
//   --show <id>                hikâyeyi okunur halde gösterir: vaka, metinler, roller, ipuçları, notlar
//   --approve <id> [--note ".."] [--force]
//                              onaylar; hakemin reddettiği hikâye yalnızca --force ile onaylanır,
//                              kod doğrulamasından kalan hiçbir zaman onaylanmaz
//   --reject <id> --note ".."  reddeder (not zorunlu); onaylı hikâyeyi de havuzdan çeker
//   --stats                    kovaların durumu (evren × zorluk × durum)
//   [--by Ad]                  kararı veren (varsayılan STORY_REVIEWER, yoksa Enes)
// <id> yerine listedeki ilk 8 karakter yeter. Karar Story.reviewResults.decision'a yazılır.
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { StoryPoolService } from '../src/stories/story-pool.service';
import { parseStoryPackage } from '../src/stories/story-package';
import {
  StoryStatus,
  canApprove,
  parseReviewRecord,
  resolveStoryId,
  storySummary,
  withDecision,
} from '../src/stories/story-approval';

Logger.overrideLogger(['warn', 'error']);

const STATUSES: StoryStatus[] = ['DRAFT', 'APPROVED', 'REJECTED'];

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

const prisma = new PrismaService();
const pool = new StoryPoolService(prisma);
const reviewer = () => option('by') || process.env.STORY_REVIEWER || 'Enes';

const fail = (message: string) => {
  console.error(message);
  process.exitCode = 1;
};

async function findStory(prefix: string) {
  if (!prefix) {
    fail('Hikâye kimliğini (ya da ilk 8 karakterini) yaz.');
    return null;
  }
  const candidates = await prisma.story.findMany({
    where: { id: { startsWith: prefix } },
    select: { id: true },
  });
  const resolved = resolveStoryId(
    prefix,
    candidates.map((c) => c.id),
  );
  if ('error' in resolved) {
    fail(resolved.error);
    return null;
  }
  return prisma.story.findUnique({ where: { id: resolved.id } });
}

async function list() {
  const status = (option('status') || 'DRAFT').toUpperCase();
  const where: Prisma.StoryWhereInput = {
    ...(status !== 'ALL' ? { status: status as StoryStatus } : {}),
    ...(option('universe') ? { universe: option('universe') } : {}),
    ...(option('difficulty') ? { difficulty: option('difficulty') } : {}),
  };
  const stories = await prisma.story.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      universe: true,
      difficulty: true,
      status: true,
      reviewResults: true,
      createdAt: true,
    },
  });
  if (stories.length === 0) {
    console.log(`"${status}" durumunda hikâye yok.`);
    return;
  }
  console.table(
    stories.map((story) => {
      const record = parseReviewRecord(story.reviewResults);
      const issues = record?.review?.issues ?? [];
      const certain = issues.filter((i) => i.severity === 'CERTAIN').length;
      return {
        kimlik: story.id.slice(0, 8),
        kova: `${story.universe}/${story.difficulty}`,
        durum: story.status,
        doğrulama: !record
          ? '-'
          : record.validation.valid
            ? `geçti${record.validation.warnings.length ? ` (${record.validation.warnings.length} uyarı)` : ''}`
            : `${record.validation.errors.length} hata`,
        hakem: record?.review?.verdict ?? '-',
        bulgu: issues.length
          ? `${certain} kesin / ${issues.length - certain} şüphe`
          : '-',
        karar: record?.decision
          ? `${record.decision.status} (${record.decision.by})`
          : '-',
        tarih: story.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      };
    }),
  );
  console.log('Ayrıntı için: npm run stories:approve -- --show <kimlik>');
}

async function show(prefix: string) {
  const story = await findStory(prefix);
  if (!story) return;
  console.log(
    `Hikâye ${story.id} · ${story.status} · kural sürümü ${story.ruleVersion}`,
  );
  console.log(
    storySummary(
      parseStoryPackage(story.content),
      parseReviewRecord(story.reviewResults),
    ),
  );
}

async function decide(prefix: string, status: 'APPROVED' | 'REJECTED') {
  const note = option('note') || undefined;
  if (status === 'REJECTED' && !note) {
    fail('Reddederken neden reddettiğini --note ile yaz.');
    return;
  }
  const story = await findStory(prefix);
  if (!story) return;
  const record = parseReviewRecord(story.reviewResults);
  if (status === 'APPROVED') {
    const check = canApprove(
      story.status,
      record,
      option('force') !== undefined,
    );
    if (!check.ok) {
      fail(check.reason);
      return;
    }
  }
  const decision = {
    status,
    by: reviewer(),
    ...(note ? { note } : {}),
    at: new Date().toISOString(),
  };
  const updated = withDecision(record, decision);
  if (status === 'APPROVED') await pool.approveStory(story.id, updated);
  else await pool.rejectStory(story.id, updated);
  console.log(
    `${story.id.slice(0, 8)} ${status === 'APPROVED' ? 'onaylandı; havuzda oynanabilir' : 'reddedildi'} (${decision.by}). Ekiple paylaşmak için: npm run stories:export, sonra commit.`,
  );
}

async function stats() {
  const rows = await pool.getPoolStats();
  const buckets = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const key = `${row.universe}/${row.difficulty}`;
    const counts = buckets.get(key) ?? {};
    counts[row.status] = row._count.id;
    buckets.set(key, counts);
  }
  if (buckets.size === 0) {
    console.log('Havuz boş.');
    return;
  }
  console.table(
    [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kova, counts]) => ({
        kova,
        ...Object.fromEntries(STATUSES.map((s) => [s, counts[s] ?? 0])),
      })),
  );
}

async function main() {
  if (option('list') !== undefined) return list();
  if (option('show') !== undefined) return show(option('show')!);
  if (option('approve') !== undefined)
    return decide(option('approve')!, 'APPROVED');
  if (option('reject') !== undefined)
    return decide(option('reject')!, 'REJECTED');
  if (option('stats') !== undefined) return stats();
  console.log(
    'Kullanım: npm run stories:approve -- --list [--status DRAFT|REJECTED|APPROVED|all] | --show <id> | --approve <id> [--note ".."] [--force] | --reject <id> --note ".." | --stats [--by Ad]',
  );
}

main()
  .catch((error) => fail(String(error)))
  .finally(() => prisma.onModuleDestroy());
