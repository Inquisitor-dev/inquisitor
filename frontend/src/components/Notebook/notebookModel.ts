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

export type PenColor = 'ink' | 'red' | 'blue';
export const PEN_COLORS: { id: PenColor; label: string }[] = [
  { id: 'ink', label: 'Koyu mürekkep' },
  { id: 'red', label: 'Kan kırmızısı' },
  { id: 'blue', label: 'Lacivert' },
];

// Kalemle çizilmiş bir çizgi: noktalar sayfanın yüzdesi olarak [x1, y1, x2, y2, ...]
export interface NotebookStrokeItem {
  id: string;
  kind: 'stroke';
  day: number;
  page: NotebookPage;
  color: PenColor;
  size: 1 | 2;
  points: number[];
}

export type NotebookItem =
  | NotebookTextItem
  | NotebookRecordItem
  | NotebookPhotoItem
  | NotebookStrokeItem;

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

export const MAX_STROKE_POINTS = 120;

const round1 = (n: number) => Math.round(n * 10) / 10;

// Ramer–Douglas–Peucker: düz giden kısımlardaki gereksiz noktaları atar, çizginin şekli korunur
export function simplifyStroke(points: number[], epsilon = 0.25): number[] {
  const count = points.length / 2;
  if (count <= 2) return points.map(round1);
  const keep = new Uint8Array(count);
  keep[0] = keep[count - 1] = 1;
  const stack: [number, number][] = [[0, count - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    const [ax, ay, bx, by] = [points[start * 2], points[start * 2 + 1], points[end * 2], points[end * 2 + 1]];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    let farthest = -1;
    let maxDistance = 0;
    for (let i = start + 1; i < end; i++) {
      const px = points[i * 2];
      const py = points[i * 2 + 1];
      const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
      if (distance > maxDistance) {
        maxDistance = distance;
        farthest = i;
      }
    }
    if (farthest !== -1 && maxDistance > epsilon) {
      keep[farthest] = 1;
      stack.push([start, farthest], [farthest, end]);
    }
  }
  let result: number[] = [];
  for (let i = 0; i < count; i++) {
    if (keep[i]) result.push(round1(points[i * 2]), round1(points[i * 2 + 1]));
  }
  // Çok uzun çizgide noktalar eşit aralıklarla seyreltilir
  if (result.length > MAX_STROKE_POINTS * 2) {
    const step = result.length / 2 / MAX_STROKE_POINTS;
    const thinned: number[] = [];
    for (let i = 0; i < MAX_STROKE_POINTS; i++) {
      const index = Math.min(Math.round(i * step), result.length / 2 - 1);
      thinned.push(result[index * 2], result[index * 2 + 1]);
    }
    result = thinned;
  }
  return result;
}

// Yumuşak çizgi: noktalar arasında ikinci derece eğriler
export function strokePath(points: number[]): string {
  if (points.length < 4) return '';
  let d = `M${points[0]} ${points[1]}`;
  if (points.length === 4) return `${d} L${points[2]} ${points[3]}`;
  for (let i = 2; i < points.length - 2; i += 2) {
    const mx = (points[i] + points[i + 2]) / 2;
    const my = (points[i + 1] + points[i + 3]) / 2;
    d += ` Q${points[i]} ${points[i + 1]} ${mx} ${my}`;
  }
  return `${d} L${points[points.length - 2]} ${points[points.length - 1]}`;
}

// İşaretçi (piksel) bir çizgiye yeterince yakın mı: silgi için
export function strokeHit(
  points: number[],
  px: number,
  py: number,
  width: number,
  height: number,
  radius: number,
): boolean {
  const toPx = (i: number) => [(points[i] / 100) * width, (points[i + 1] / 100) * height];
  for (let i = 0; i < points.length - 2; i += 2) {
    const [ax, ay] = toPx(i);
    const [bx, by] = toPx(i + 2);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    if (Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) <= radius) return true;
  }
  return false;
}
