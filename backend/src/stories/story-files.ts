import { parseStoryPackage } from './story-package';
import type { StoryStatus } from './story-approval';

// Hikâye havuzunun ortak kaydı: her hikâye repo'da bir JSON dosyasıdır (backend/stories/<evren>/
// <zorluk>/<id>.json). Hikâyeyi üreten ve onaylayan yerel veritabanından dışa aktarır
// (stories:export) ve commit'ler; ekip ve canlı ortam main'i çekip içe aktarır (stories:import).
// Dosya yolu ve içerik sabit sıradadır: değişmeyen hikâye dışa aktarımda fark üretmez.

export const STORY_STATUSES: StoryStatus[] = ['DRAFT', 'APPROVED', 'REJECTED'];

export interface StoryFile {
  id: string;
  universe: string;
  difficulty: string;
  status: StoryStatus;
  wildcardCount: number;
  gameMode: string;
  ruleVersion: number;
  createdAt: string;
  updatedAt: string;
  content: unknown;
  reviewResults: unknown;
}

// Veritabanı satırının dosyaya giden alanları (Prisma Story modelinin alt kümesi)
export interface StoryRow {
  id: string;
  universe: string;
  difficulty: string;
  status: StoryStatus;
  wildcardCount: number;
  gameMode: string;
  ruleVersion: number;
  createdAt: Date;
  updatedAt: Date;
  content: unknown;
  reviewResults: unknown;
}

// Kimlik ve kova adı dosya yoluna girer: yol dışına çıkan ya da garip karakterli değer kabul edilmez
const SAFE_NAME = /^[a-z0-9-]+$/i;

export function storyFilePath(story: {
  id: string;
  universe: string;
  difficulty: string;
}): string {
  for (const part of [story.id, story.universe, story.difficulty]) {
    if (!SAFE_NAME.test(part))
      throw new Error(`Dosya yoluna uygun olmayan değer: "${part}"`);
  }
  return `${story.universe}/${story.difficulty}/${story.id}.json`;
}

export function toStoryFile(row: StoryRow): StoryFile {
  return {
    id: row.id,
    universe: row.universe,
    difficulty: row.difficulty,
    status: row.status,
    wildcardCount: row.wildcardCount,
    gameMode: row.gameMode,
    ruleVersion: row.ruleVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    content: row.content,
    reviewResults: row.reviewResults ?? null,
  };
}

export const serializeStoryFile = (file: StoryFile) =>
  `${JSON.stringify(file, null, 2)}\n`;

// Dosyayı okur ve içe aktarmadan önce doğrular; bozuk dosya hata verir (sessizce atlanmaz)
export function parseStoryFile(raw: unknown, path: string): StoryFile {
  const fail = (reason: string) => {
    throw new Error(`${path}: ${reason}`);
  };
  if (!raw || typeof raw !== 'object') fail('JSON nesnesi değil');
  const file = raw as Partial<StoryFile>;
  for (const key of ['id', 'universe', 'difficulty', 'gameMode'] as const) {
    if (typeof file[key] !== 'string' || !file[key]) fail(`"${key}" eksik`);
  }
  if (!STORY_STATUSES.includes(file.status as StoryStatus))
    fail(`geçersiz durum "${String(file.status)}"`);
  for (const key of ['wildcardCount', 'ruleVersion'] as const) {
    if (!Number.isInteger(file[key])) fail(`"${key}" tam sayı değil`);
  }
  for (const key of ['createdAt', 'updatedAt'] as const) {
    if (Number.isNaN(Date.parse(String(file[key]))))
      fail(`"${key}" tarih değil`);
  }
  try {
    parseStoryPackage(file.content);
  } catch (error) {
    fail(String(error));
  }
  const story = file as StoryFile;
  if (storyFilePath(story) !== path)
    fail(`yolu içeriğiyle uyuşmuyor (${storyFilePath(story)} olmalı)`);
  return story;
}

export type ImportAction = 'CREATE' | 'UPDATE' | 'SAME' | 'LOCAL_NEWER';

// Dosyayla yerel kaydı karşılaştırır. Yerel kayıt daha yeniyse (dışa aktarılmamış onay ya da ret)
// üzerine yazılmaz: önce dışa aktarılmalı.
export function importAction(
  file: StoryFile,
  local: StoryRow | null,
): ImportAction {
  if (!local) return 'CREATE';
  const current = serializeStoryFile(toStoryFile(local));
  if (current === serializeStoryFile(file)) return 'SAME';
  return local.updatedAt.getTime() > Date.parse(file.updatedAt)
    ? 'LOCAL_NEWER'
    : 'UPDATE';
}
