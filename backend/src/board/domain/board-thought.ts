import type { JudgedString } from './board-judge';
import type {
  BoardCard,
  BoardStringType,
  BoardVerdict,
} from './board.types';

const STRING_TYPE_LABEL: Record<Exclude<BoardStringType, 'LINK'>, string> = {
  CLEARS: 'aklıyor',
  IMPLICATES: 'suçluyor',
  SUPPORTS: 'doğruluyor',
  CONTRADICTS: 'çelişiyor',
};

// Değerlendirilen bir ipin insan diliyle özeti (iç ses metni ve test düşüncesi için)
// Şüpheli ↔ kanıt iplerinde `a` kanıt, `b` şüphelidir (cümleler buna göre kurulur)
export interface ThoughtLine {
  a: string;
  b: string;
  type: Exclude<BoardStringType, 'LINK'>;
  relation: string;
  verdict: BoardVerdict;
}

export function describeJudged(
  judged: JudgedString[],
  labelOf: (card: BoardCard) => string,
): ThoughtLine[] {
  return judged.map((j) => {
    const type = j.string.type as Exclude<BoardStringType, 'LINK'>;
    const suspectFirst = j.from.kind === 'suspect';
    const first = suspectFirst ? j.to : j.from;
    const second = suspectFirst ? j.from : j.to;
    return {
      a: labelOf(first),
      b: labelOf(second),
      type,
      relation: STRING_TYPE_LABEL[type],
      verdict: j.verdict,
    };
  });
}

export const EMPTY_BOARD_THOUGHT =
  'Panoya bakıyorum ama elimde birbirine bağladığım bir şey yok. Önce kanıtları şüphelilerle ya da birbiriyle eşleştirmeliyim sanırım.';

// Dedektifin kendi kendine düşünmesi: kısa, kararsız cümleler. Kesinlik bildiren sözlerden kaçınılır.
const THOUGHT_TEMPLATES: Record<
  Exclude<BoardStringType, 'LINK'>,
  Record<BoardVerdict, (a: string, b: string) => string>
> = {
  CLEARS: {
    CORRECT: (e, s) => `${s} temiz görünüyor. ${e} bunu destekliyor gibi.`,
    WRONG: (e, s) =>
      `${s} için ${e} yetmiyor galiba. Belki de başka bir şey saklıyor.`,
  },
  IMPLICATES: {
    CORRECT: (e, s) => `${e} ister istemez ${s} üzerinde bir gölge bırakıyor.`,
    WRONG: (e, s) => `${e} ile ${s} arasında bir bağ göremiyorum sanırım.`,
  },
  SUPPORTS: {
    CORRECT: (a, b) => `${a} ile ${b} birbirini tutuyor gibi.`,
    WRONG: (a, b) => `${a} ile ${b} pek örtüşmüyor galiba.`,
  },
  CONTRADICTS: {
    CORRECT: (a, b) =>
      `${a} ile ${b} birbirine uymuyor. Biri bir şeyleri yanlış anlatıyor olabilir.`,
    WRONG: (a, b) => `${a} ile ${b} arasında bir çelişki göremiyorum aslında.`,
  },
};

// Yapay zekâ kullanılmadan üretilen iç ses (test modunda ve yapay zekâ hata verdiğinde)
export function templateThought(lines: ThoughtLine[]): string {
  if (lines.length === 0) return EMPTY_BOARD_THOUGHT;
  return lines
    .map((l) => THOUGHT_TEMPLATES[l.type][l.verdict](l.a, l.b))
    .join(' ');
}
