import {
  BOARD_LIMITS,
  CARD_KINDS,
  type BoardCard,
  type BoardCardKind,
  type BoardState,
  type BoardString,
  type BoardStringType,
} from './board.types';

const isId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= BOARD_LIMITS.idLength;

const clampPercent = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 50;

// İki kartın arasına hangi tür ipler çekilebilir
export function allowedStringTypes(
  a: BoardCardKind,
  b: BoardCardKind,
): BoardStringType[] {
  const pair = [a, b].sort().join('+');
  if (pair === 'evidence+suspect') return ['CLEARS', 'IMPLICATES', 'LINK'];
  if (pair === 'evidence+evidence') return ['SUPPORTS', 'CONTRADICTS', 'LINK'];
  return ['LINK'];
}

// İstemciden gelen panoyu temizler: bilinmeyen alanlar atılır, sınırlar uygulanır, oyuncunun
// sahip olmadığı kanıta ya da vakada olmayan şüpheliye ait kart kabul edilmez. Kararlar (verdict)
// sunucuda en son kaydedilen panodan, ip değişmediyse korunur.
export function sanitizeBoard(
  input: unknown,
  ctx: {
    suspectIds: string[];
    evidenceIds: string[];
    previous: BoardState | null;
  },
): BoardState {
  const raw = (input && typeof input === 'object' ? input : {}) as {
    cards?: unknown;
    strings?: unknown;
  };
  const cards: BoardCard[] = [];
  const seen = new Set<string>();

  for (const item of Array.isArray(raw.cards) ? raw.cards : []) {
    if (cards.length >= BOARD_LIMITS.cards) break;
    const c = item as Partial<BoardCard>;
    if (
      !isId(c.id) ||
      seen.has(c.id) ||
      !CARD_KINDS.includes(c.kind as BoardCardKind)
    )
      continue;
    const kind = c.kind as BoardCardKind;
    const card: BoardCard = {
      id: c.id,
      kind,
      x: clampPercent(c.x),
      y: clampPercent(c.y),
    };
    if (kind === 'suspect') {
      if (!isId(c.refId) || !ctx.suspectIds.includes(c.refId)) continue;
      card.refId = c.refId;
    } else if (kind === 'evidence') {
      if (!isId(c.refId) || !ctx.evidenceIds.includes(c.refId)) continue;
      card.refId = c.refId;
    } else if (kind === 'note') {
      card.text =
        typeof c.text === 'string'
          ? c.text.slice(0, BOARD_LIMITS.noteLength)
          : '';
    }
    seen.add(card.id);
    cards.push(card);
  }

  const byId = new Map(cards.map((card) => [card.id, card]));
  const previousStrings = new Map(
    (ctx.previous?.strings ?? []).map((s) => [s.id, s]),
  );
  const strings: BoardString[] = [];
  const seenStrings = new Set<string>();

  for (const item of Array.isArray(raw.strings) ? raw.strings : []) {
    if (strings.length >= BOARD_LIMITS.strings) break;
    const s = item as Partial<BoardString>;
    if (
      !isId(s.id) ||
      seenStrings.has(s.id) ||
      !isId(s.from) ||
      !isId(s.to) ||
      s.from === s.to
    )
      continue;
    const a = byId.get(s.from);
    const b = byId.get(s.to);
    if (!a || !b) continue;
    const allowed = allowedStringTypes(a.kind, b.kind);
    const type = allowed.includes(s.type as BoardStringType)
      ? (s.type as BoardStringType)
      : 'LINK';
    const string: BoardString = { id: s.id, from: s.from, to: s.to, type };
    const prev = previousStrings.get(s.id);
    if (
      prev?.verdict &&
      prev.from === string.from &&
      prev.to === string.to &&
      prev.type === string.type
    ) {
      string.verdict = prev.verdict;
    }
    seenStrings.add(string.id);
    strings.push(string);
  }

  return { cards, strings };
}

export function parseStoredBoard(value: unknown): BoardState | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<BoardState>;
  if (!Array.isArray(v.cards) || !Array.isArray(v.strings)) return null;
  return { cards: v.cards, strings: v.strings };
}
