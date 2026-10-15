// Not Defteri: oyun günlerine ayrılmış sayfa çiftleri. Oyuncunun yazı kutuları ve
// otomatik kayıt kartlarının (itiraf, tanıklık) yerleri burada tutulur.
// Kayıt kartlarının metni defterde saklanmaz; her açılışta Evidence satırlarından gelir.

export type NotebookPage = 'L' | 'R';

export interface NotebookTextItem {
  id: string;
  kind: 'text';
  day: number;
  page: NotebookPage;
  // Sayfanın yüzdesi olarak konum ve genişlik: defter hangi boyutta açılırsa açılsın aynı yerde durur
  x: number;
  y: number;
  w: number;
  text: string;
}

// Bir kayıt kartının oyuncunun taşıdığı yeri. Taşınmamış kartlar sayfanın başına sırayla dizilir.
export interface NotebookRecordItem {
  id: string;
  kind: 'record';
  day: number;
  page: NotebookPage;
  x: number;
  y: number;
  evidenceId: string;
}

export type NotebookItem = NotebookTextItem | NotebookRecordItem;

export interface NotebookState {
  items: NotebookItem[];
}

export const MAX_NOTEBOOK_ITEMS = 150;
export const MAX_NOTEBOOK_TEXT = 600;
export const NOTEBOOK_DAYS = 4;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(n * 10) / 10));
};

// İstemciden gelen, henüz doğrulanmamış öğe
type LooseItem = Partial<
  Record<
    'id' | 'kind' | 'day' | 'page' | 'x' | 'y' | 'w' | 'text' | 'evidenceId',
    unknown
  >
>;

const isPage = (value: unknown): value is NotebookPage =>
  value === 'L' || value === 'R';

export interface NotebookStatement {
  id: string;
  dayNumber: number;
}

// İstemciden gelen defteri temizler: bilinmeyen öğeler, sahip olunmayan kayıtlar ve sınır
// dışı değerler atılır. Kayıt kartı her zaman kanıtın alındığı günde kalır.
export function sanitizeNotebook(
  input: unknown,
  statements: NotebookStatement[],
): NotebookState {
  const raw = (input as Partial<NotebookState> | null)?.items;
  if (!Array.isArray(raw)) return { items: [] };

  const statementDay = new Map(statements.map((s) => [s.id, s.dayNumber]));
  const seenIds = new Set<string>();
  const seenRecords = new Set<string>();
  const items: NotebookItem[] = [];

  for (const entry of raw) {
    if (items.length >= MAX_NOTEBOOK_ITEMS) break;
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as LooseItem;
    if (
      typeof item.id !== 'string' ||
      !ID_PATTERN.test(item.id) ||
      seenIds.has(item.id)
    )
      continue;
    const page = isPage(item.page) ? item.page : 'L';
    const x = clamp(item.x, 0, 96, 6);
    const y = clamp(item.y, 0, 96, 10);

    if (item.kind === 'text') {
      const day = clamp(item.day, 1, NOTEBOOK_DAYS, 1);
      const text =
        typeof item.text === 'string'
          ? item.text.slice(0, MAX_NOTEBOOK_TEXT)
          : '';
      if (!text.trim()) continue;
      items.push({
        id: item.id,
        kind: 'text',
        day,
        page,
        x,
        y,
        w: clamp(item.w, 12, 100, 60),
        text,
      });
    } else if (item.kind === 'record') {
      const evidenceId = item.evidenceId;
      if (typeof evidenceId !== 'string' || seenRecords.has(evidenceId))
        continue;
      const day = statementDay.get(evidenceId);
      if (day === undefined) continue;
      seenRecords.add(evidenceId);
      items.push({ id: item.id, kind: 'record', day, page, x, y, evidenceId });
    } else {
      continue;
    }
    seenIds.add(item.id);
  }
  return { items };
}

export function parseStoredNotebook(value: unknown): NotebookState {
  const items = (value as Partial<NotebookState> | null)?.items;
  return { items: Array.isArray(items) ? items : [] };
}
