import { CaseFacts } from '../scenarios/case-setup';

// Soruşturma Panosu: oyuncu kartları (şüpheliler, kanıtlar, kendi notları) panoya asar ve aralarına
// ip çeker. "Düşün" denince ipler vaka gerçeklerine göre kodla değerlendirilir.
//
// Değerlendirmenin ilkesi: bir ip, sadece bağladığı iki kartın kendisinin söylediğini teyit eder.
// Vakanın gizli kalan kısmı (ör. olay yeri izinin tuzak olduğu) ancak oyuncu onu ortaya çıkaran
// kanıtı bulup bağladığında doğrulanır. Böylece pano katili söylemez, oyuncunun akıl yürütmesini sınar.

export type BoardCardKind = 'suspect' | 'evidence' | 'note' | 'scene';

// Şüpheli ↔ kanıt: CLEARS (aklıyor), IMPLICATES (suçluyor)
// Kanıt ↔ kanıt: SUPPORTS (doğruluyor), CONTRADICTS (çelişiyor)
// Diğer bağlar (notlar, iki şüpheli): LINK, değerlendirilmez
export type BoardStringType =
  | 'CLEARS'
  | 'IMPLICATES'
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'LINK';
export type BoardVerdict = 'CORRECT' | 'WRONG';

export interface BoardCard {
  id: string;
  kind: BoardCardKind;
  // Şüphelide karakter id'si, kanıtta Evidence id'si
  refId?: string;
  // Sadece oyuncunun notunda
  text?: string;
  // Panodaki konum (panonun yüzdesi)
  x: number;
  y: number;
}

export interface BoardString {
  id: string;
  from: string;
  to: string;
  type: BoardStringType;
  // Son "Düşün"de sunucunun verdiği karar; istemci bunu yazamaz
  verdict?: BoardVerdict;
}

export interface BoardState {
  cards: BoardCard[];
  strings: BoardString[];
}

export const BOARD_LIMITS = {
  cards: 60,
  strings: 100,
  noteLength: 200,
  idLength: 40,
};

export interface BoardEvidence {
  id: string;
  kind: string;
  // ITEM: mekânda bulunan eşya, STATEMENT: bir karakterin ifadesi
  category?: string;
  sourceId: string;
  text: string;
}

const CARD_KINDS: BoardCardKind[] = ['suspect', 'evidence', 'note', 'scene'];

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

const isCrimeSceneClue = (e: BoardEvidence) =>
  e.kind === 'CLUE' && e.sourceId === 'crime_scene';

// Şüpheli ↔ kanıt ipinin kararı
function judgeSuspectLink(
  type: 'CLEARS' | 'IMPLICATES',
  suspectId: string,
  e: BoardEvidence,
  facts: CaseFacts,
): BoardVerdict {
  const implicated = facts.crimeSceneClue.implicatedNpcIds;
  const isCulprit = suspectId === facts.culpritId;
  let clears = false;
  let implicates = false;

  if (isCrimeSceneClue(e)) {
    // İzin işaret ettiği kişiler; izin gerçek mi tuzak mı olduğu burada söylenmez
    implicates = implicated.includes(suspectId);
    clears = !implicated.includes(suspectId);
  } else if (e.kind === 'VERIFICATION') {
    if (facts.verification.kind === 'CORROBORATION') {
      // İzi doğrulayan kanıt katili gösterir
      implicates = isCulprit;
    } else {
      // Tuzağın kusuru, tuzakla suçlanan kişiyi aklar
      clears = implicated.includes(suspectId);
    }
  } else if (e.kind === 'CONFESSION') {
    // İtiraf, itiraf edenin mazeretidir
    clears = e.sourceId === suspectId;
  } else if (e.kind === 'CLUE') {
    // Mekân ipucu orada yaşayanın sırrını anlatır: masumda mazeret, katilde kapanmayan bir açık
    if (e.sourceId === suspectId) {
      clears = !isCulprit;
      implicates = isCulprit;
    }
  }

  return (type === 'CLEARS' ? clears : implicates) ? 'CORRECT' : 'WRONG';
}

// Kanıt ↔ kanıt ipinin kararı (sıra önemsiz)
function judgeEvidenceLink(
  type: 'SUPPORTS' | 'CONTRADICTS',
  a: BoardEvidence,
  b: BoardEvidence,
  facts: CaseFacts,
): BoardVerdict {
  const implicated = facts.crimeSceneClue.implicatedNpcIds;
  const pair = (test: (x: BoardEvidence, y: BoardEvidence) => boolean) =>
    test(a, b) || test(b, a);
  let relation: 'SUPPORTS' | 'CONTRADICTS' | null = null;

  if (pair((x, y) => isCrimeSceneClue(x) && y.kind === 'VERIFICATION')) {
    // Doğrulayan kanıt izi ya doğrular ya da tuzak olduğunu gösterir
    relation =
      facts.verification.kind === 'CORROBORATION' ? 'SUPPORTS' : 'CONTRADICTS';
  } else if (pair((x, y) => isCrimeSceneClue(x) && y.kind === 'CONFESSION')) {
    // İzin gösterdiği birinin mazereti izle çelişir, göstermediği birininki uyuşur
    const confession = a.kind === 'CONFESSION' ? a : b;
    relation = implicated.includes(confession.sourceId)
      ? 'CONTRADICTS'
      : 'SUPPORTS';
  } else if (
    pair(
      (x, y) =>
        x.kind === 'CONFESSION' &&
        y.kind === 'CLUE' &&
        !isCrimeSceneClue(y) &&
        y.sourceId === x.sourceId,
    )
  ) {
    // Kişinin itirafı kendi mekânındaki ipucuyla aynı sırrı anlatır
    relation = 'SUPPORTS';
  } else if (
    facts.verification.kind === 'FLAW' &&
    pair(
      (x, y) =>
        x.kind === 'VERIFICATION' &&
        y.kind === 'CONFESSION' &&
        implicated.includes(y.sourceId),
    )
  ) {
    // Tuzağın kusuru, suçlanan kişinin mazeretini destekler
    relation = 'SUPPORTS';
  }

  return relation === type ? 'CORRECT' : 'WRONG';
}

export interface JudgedString {
  string: BoardString;
  from: BoardCard;
  to: BoardCard;
  verdict: BoardVerdict;
}

// Panodaki değerlendirilebilir iplerin hepsine karar verir
export function judgeBoard(
  board: BoardState,
  facts: CaseFacts,
  evidence: BoardEvidence[],
): JudgedString[] {
  const cards = new Map(board.cards.map((card) => [card.id, card]));
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));
  const judged: JudgedString[] = [];

  for (const string of board.strings) {
    const from = cards.get(string.from);
    const to = cards.get(string.to);
    if (!from || !to || string.type === 'LINK') continue;

    if (string.type === 'CLEARS' || string.type === 'IMPLICATES') {
      const suspect =
        from.kind === 'suspect' ? from : to.kind === 'suspect' ? to : null;
      const evCard =
        from.kind === 'evidence' ? from : to.kind === 'evidence' ? to : null;
      const e = evCard?.refId ? evidenceById.get(evCard.refId) : undefined;
      if (!suspect?.refId || !e) continue;
      judged.push({
        string,
        from,
        to,
        verdict: judgeSuspectLink(string.type, suspect.refId, e, facts),
      });
    } else {
      const a = from.refId ? evidenceById.get(from.refId) : undefined;
      const b = to.refId ? evidenceById.get(to.refId) : undefined;
      if (from.kind !== 'evidence' || to.kind !== 'evidence' || !a || !b)
        continue;
      judged.push({
        string,
        from,
        to,
        verdict: judgeEvidenceLink(string.type, a, b, facts),
      });
    }
  }
  return judged;
}

// Kararları panoya işler: değerlendirilen ipler kararını alır, diğerlerinin eski kararı silinir
export function applyVerdicts(
  board: BoardState,
  judged: JudgedString[],
): BoardState {
  const verdicts = new Map(judged.map((j) => [j.string.id, j.verdict]));
  return {
    cards: board.cards,
    strings: board.strings.map((s) => {
      const verdict = verdicts.get(s.id);
      const rest: BoardString = {
        id: s.id,
        from: s.from,
        to: s.to,
        type: s.type,
      };
      return verdict ? { ...rest, verdict } : rest;
    }),
  };
}

const STRING_TYPE_LABEL: Record<Exclude<BoardStringType, 'LINK'>, string> = {
  CLEARS: 'aklıyor',
  IMPLICATES: 'suçluyor',
  SUPPORTS: 'doğruluyor',
  CONTRADICTS: 'çelişiyor',
};

// Değerlendirilen bir ipin insan diliyle özeti (iç ses metni ve test düşüncesi için)
export interface ThoughtLine {
  a: string;
  b: string;
  relation: string;
  verdict: BoardVerdict;
}

export function describeJudged(
  judged: JudgedString[],
  labelOf: (card: BoardCard) => string,
): ThoughtLine[] {
  return judged.map((j) => ({
    a: labelOf(j.from),
    b: labelOf(j.to),
    relation:
      STRING_TYPE_LABEL[j.string.type as Exclude<BoardStringType, 'LINK'>],
    verdict: j.verdict,
  }));
}

export const EMPTY_BOARD_THOUGHT =
  'Panoda sınayabileceğim bir bağ yok. Önce kanıtları şüphelilere ya da birbirine iplerle bağlamalıyım.';

// Yapay zekâ kullanılmadan üretilen iç ses (test modunda ve yapay zekâ hata verdiğinde)
export function templateThought(lines: ThoughtLine[]): string {
  if (lines.length === 0) return EMPTY_BOARD_THOUGHT;
  return lines
    .map((l) =>
      l.verdict === 'CORRECT'
        ? `${l.a} ve ${l.b}: aralarına çektiğim "${l.relation}" ipi tutuyor.`
        : `${l.a} ve ${l.b}: "${l.relation}" ipini çekmekle hata etmişim gibi.`,
    )
    .join(' ');
}
