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

export const CARD_KINDS: BoardCardKind[] = ['suspect', 'evidence', 'note', 'scene'];
