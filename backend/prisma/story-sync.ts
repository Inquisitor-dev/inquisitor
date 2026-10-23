// Hikâye havuzunun ortak kaydı (backend/stories/<evren>/<zorluk>/<id>.json):
//   npm run stories:export   yerel veritabanındaki bütün hikâyeleri dosyalara yazar; sonra commit + PR
//   npm run stories:import   main'i çektikten sonra dosyaları yerel veritabanına ekler ya da günceller
//     [--dry-run]            veritabanına yazmadan ne yapılacağını gösterir
//     [--dir yol]            dosya klasörü (varsayılan: backend/stories)
// Hikâyeler kimlikle eşleşir; dosyada olmayan yerel hikâye silinmez, veritabanında olmayan dosya da
// silinmez (yalnızca bildirilir). Yerelde dosyadan daha yeni kayıt (dışa aktarılmamış onay ya da ret)
// içe aktarımda ezilmez. Canlı veritabanı da aynı komutla doldurulur (DATABASE_URL ile).
import 'dotenv/config';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, sep } from 'path';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  StoryRow,
  importAction,
  parseStoryFile,
  serializeStoryFile,
  storyFilePath,
  toStoryFile,
} from '../src/stories/story-files';

Logger.overrideLogger(['warn', 'error']);

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

const prisma = new PrismaService();
const root = option('dir') || join(__dirname, '..', 'stories');

// Klasördeki bütün .json dosyaları, kök klasöre göre "evren/zorluk/id.json" biçiminde
function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return entry.name.endsWith('.json')
      ? [relative(root, path).split(sep).join('/')]
      : [];
  });
}

async function exportStories() {
  const rows = (await prisma.story.findMany({
    orderBy: { createdAt: 'asc' },
  })) as StoryRow[];
  let written = 0;
  for (const row of rows) {
    const path = storyFilePath(row);
    const full = join(root, path);
    const text = serializeStoryFile(toStoryFile(row));
    // Windows'ta git dosyayı CRLF ile açar; satır sonu farkı değişiklik sayılmaz
    if (
      existsSync(full) &&
      readFileSync(full, 'utf8').replace(/\r\n/g, '\n') === text
    )
      continue;
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
    written++;
  }
  const ids = new Set(rows.map((row) => storyFilePath(row)));
  const orphans = listFiles(root).filter((path) => !ids.has(path));
  console.log(
    `${rows.length} hikâye · ${written} dosya yazıldı · ${rows.length - written} değişmedi.`,
  );
  if (orphans.length)
    console.log(
      `Veritabanında olmayan ${orphans.length} dosya var (silinmedi; önce stories:import çalıştırılmalı):\n  ${orphans.join('\n  ')}`,
    );
  if (written) console.log("Şimdi backend/stories klasörünü commit'le.");
}

async function importStories(dryRun: boolean) {
  const paths = listFiles(root);
  if (paths.length === 0) {
    console.log(`${root} içinde hikâye dosyası yok.`);
    return;
  }
  const files = paths.map((path) =>
    parseStoryFile(
      JSON.parse(readFileSync(join(root, path), 'utf8')) as unknown,
      path,
    ),
  );
  const locals = (await prisma.story.findMany({
    where: { id: { in: files.map((file) => file.id) } },
  })) as StoryRow[];
  const localById = new Map(locals.map((row) => [row.id, row]));

  const counts = { CREATE: 0, UPDATE: 0, SAME: 0, LOCAL_NEWER: 0 };
  for (const file of files) {
    const action = importAction(file, localById.get(file.id) ?? null);
    counts[action]++;
    if (action === 'LOCAL_NEWER')
      console.log(
        `  ${file.id.slice(0, 8)} yerelde daha yeni; atlandı (önce stories:export).`,
      );
    if (dryRun || action === 'SAME' || action === 'LOCAL_NEWER') continue;
    const data = {
      universe: file.universe,
      difficulty: file.difficulty,
      status: file.status,
      wildcardCount: file.wildcardCount,
      gameMode: file.gameMode,
      ruleVersion: file.ruleVersion,
      content: file.content as Prisma.InputJsonValue,
      reviewResults:
        file.reviewResults === null
          ? Prisma.DbNull
          : (file.reviewResults as Prisma.InputJsonValue),
      createdAt: new Date(file.createdAt),
      updatedAt: new Date(file.updatedAt),
    };
    await prisma.story.upsert({
      where: { id: file.id },
      create: { id: file.id, ...data },
      update: data,
    });
  }
  console.log(
    `${files.length} dosya${dryRun ? ' (deneme, yazılmadı)' : ''} · yeni ${counts.CREATE} · güncellenen ${counts.UPDATE} · aynı ${counts.SAME} · yerelde daha yeni ${counts.LOCAL_NEWER}`,
  );
}

async function main() {
  if (option('export') !== undefined) return exportStories();
  if (option('import') !== undefined)
    return importStories(option('dry-run') !== undefined);
  console.log(
    'Kullanım: npm run stories:export | npm run stories:import -- [--dry-run] [--dir yol]',
  );
}

main()
  .catch((error) => {
    console.error(String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.onModuleDestroy());
