// Not Defteri'nin veri modeli (sunucudaki backend/src/notebook/notebook.ts ile aynı biçim)

export type NotebookPage = 'L' | 'R';

export interface NotebookTextItem {
  id: string;
  kind: 'text';
  day: number;
  page: NotebookPage;
  // Sayfanın yüzdesi olarak konum ve genişlik
  x: number;
  y: number;
  w: number;
  text: string;
}

export interface NotebookRecordItem {
  id: string;
  kind: 'record';
  day: number;
  page: NotebookPage;
  x: number;
  y: number;
  evidenceId: string;
}

// Sayfaya bantlanmış kanıt fotoğrafı ve altına yazılan not
export interface NotebookPhotoItem {
  id: string;
  kind: 'photo';
  day: number;
  page: NotebookPage;
  x: number;
  y: number;
  evidenceId: string;
  caption: string;
  // Fotoğrafın hafif eğikliği (derece)
  rot: number;
}

export type NotebookItem = NotebookTextItem | NotebookRecordItem | NotebookPhotoItem;

export interface NotebookState {
  items: NotebookItem[];
}

// Bir ifade kanıtından (itiraf ya da tanıklık) gelen kayıt kartı
export interface NotebookRecord {
  evidenceId: string;
  kind: 'CONFESSION' | 'VERIFICATION' | 'CLUE';
  day: number;
  speaker: string;
  text: string;
}

export const NOTEBOOK_DAYS = 4;
export const MAX_TEXT_LENGTH = 600;
export const DEFAULT_TEXT_WIDTH = 55;
export const MAX_CAPTION_LENGTH = 160;

// Bantlanan fotoğraf her seferinde biraz farklı eğik dursun
export const randomTilt = () => Math.round((Math.random() * 8 - 4) * 10) / 10;

let counter = 0;
export const newItemId = () => `n${Date.now().toString(36)}${(counter++).toString(36)}`;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Defterin sayfa çiftleri: 0 vaka dosyası, sonra her oyun günü için bir çift
export function spreadCount(currentDay: number, items: NotebookItem[], records: NotebookRecord[]) {
  const lastDay = Math.max(
    currentDay,
    ...items.map((item) => item.day),
    ...records.map((record) => record.day),
  );
  return 1 + clamp(lastDay, 1, NOTEBOOK_DAYS);
}

export const recordLabel = (record: NotebookRecord) =>
  record.kind === 'CONFESSION' ? 'İtiraf' : 'Tanıklık';
