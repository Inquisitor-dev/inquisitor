import { CaseFacts } from '../scenarios/case-setup';
import {
  applyVerdicts,
  BoardEvidence,
  BoardState,
  judgeBoard,
  sanitizeBoard,
  templateThought,
} from './board';

// Ortak vaka: katil değirmenci (mill). Olay yeri izi gerçek; hancı (tavern) ve değirmenciyi gösterir,
// kilise (church) elenir. Doğrulayan kanıt değirmende.
const genuineFacts = {
  culpritId: 'mill',
  innocentIds: ['tavern', 'church'],
  murderStyle: 'HURRIED',
  sceneState: 'MESSY',
  crimeSceneClue: {
    authentic: true,
    poolClueId: 'x',
    poolClueText: 'iz',
    implicatedNpcIds: ['tavern', 'mill'],
    eliminatedNpcIds: ['church'],
  },
  verification: {
    kind: 'CORROBORATION',
    placement: { type: 'LOCATION', locationId: 'mill' },
  },
  version: 1,
  crimeSceneClueText: 'iz',
  verificationText: 'doğrulama',
  victim: { name: 'A', profession: 'B' },
  alibis: { tavern: 'hancı mazeret', church: 'rahip mazeret' },
} as CaseFacts;

// Tuzak vaka: katil değirmenci, iz hancıyı (tavern) suçlamak için konmuş; kusur hancının tanıklığında
const plantedFacts = {
  ...genuineFacts,
  murderStyle: 'PLANNED',
  crimeSceneClue: {
    authentic: false,
    poolClueId: null,
    poolClueText: null,
    implicatedNpcIds: ['tavern'],
    eliminatedNpcIds: ['tavern'],
  },
  verification: {
    kind: 'FLAW',
    placement: { type: 'TESTIMONY', npcId: 'tavern' },
  },
} as CaseFacts;

const evidence: BoardEvidence[] = [
  {
    id: 'e-scene',
    kind: 'CLUE',
    category: 'ITEM',
    sourceId: 'crime_scene',
    text: 'iz',
  },
  {
    id: 'e-verif',
    kind: 'VERIFICATION',
    category: 'ITEM',
    sourceId: 'mill',
    text: 'doğrulama',
  },
  {
    id: 'e-conf-tavern',
    kind: 'CONFESSION',
    category: 'STATEMENT',
    sourceId: 'tavern',
    text: 'hancı mazeret',
  },
  {
    id: 'e-conf-church',
    kind: 'CONFESSION',
    category: 'STATEMENT',
    sourceId: 'church',
    text: 'rahip mazeret',
  },
  {
    id: 'e-clue-church',
    kind: 'CLUE',
    category: 'ITEM',
    sourceId: 'church',
    text: 'kilise ipucu',
  },
];

const cards = [
  { id: 's-tavern', kind: 'suspect' as const, refId: 'tavern', x: 10, y: 10 },
  { id: 's-mill', kind: 'suspect' as const, refId: 'mill', x: 20, y: 10 },
  { id: 's-church', kind: 'suspect' as const, refId: 'church', x: 30, y: 10 },
  ...evidence.map((e, i) => ({
    id: `c-${e.id}`,
    kind: 'evidence' as const,
    refId: e.id,
    x: 10 * i,
    y: 50,
  })),
  { id: 'n-1', kind: 'note' as const, text: 'şüpheli', x: 90, y: 90 },
];

const verdictOf = (
  facts: CaseFacts,
  from: string,
  to: string,
  type: 'CLEARS' | 'IMPLICATES' | 'SUPPORTS' | 'CONTRADICTS' | 'LINK',
) => {
  const board: BoardState = { cards, strings: [{ id: 'x', from, to, type }] };
  return judgeBoard(board, facts, evidence)[0]?.verdict ?? null;
};

describe('judgeBoard: şüpheli ↔ kanıt', () => {
  it('olay yeri izi gösterdiği kişileri suçlar, göstermediğini aklar (izin tuzak olduğu söylenmez)', () => {
    expect(verdictOf(genuineFacts, 's-tavern', 'c-e-scene', 'IMPLICATES')).toBe(
      'CORRECT',
    );
    expect(verdictOf(genuineFacts, 's-church', 'c-e-scene', 'CLEARS')).toBe(
      'CORRECT',
    );
    expect(verdictOf(genuineFacts, 's-church', 'c-e-scene', 'IMPLICATES')).toBe(
      'WRONG',
    );
    // Tuzakta da iz hancıyı gösterir; tuzak olduğu ancak kusurla birlikte anlaşılır
    expect(verdictOf(plantedFacts, 's-tavern', 'c-e-scene', 'IMPLICATES')).toBe(
      'CORRECT',
    );
  });

  it('itiraf sadece itiraf edeni aklar', () => {
    expect(
      verdictOf(genuineFacts, 's-tavern', 'c-e-conf-tavern', 'CLEARS'),
    ).toBe('CORRECT');
    expect(verdictOf(genuineFacts, 's-mill', 'c-e-conf-tavern', 'CLEARS')).toBe(
      'WRONG',
    );
    expect(
      verdictOf(genuineFacts, 's-tavern', 'c-e-conf-tavern', 'IMPLICATES'),
    ).toBe('WRONG');
  });

  it('masumun kendi mekânındaki ipucu onu aklar', () => {
    expect(
      verdictOf(genuineFacts, 's-church', 'c-e-clue-church', 'CLEARS'),
    ).toBe('CORRECT');
    expect(
      verdictOf(genuineFacts, 's-tavern', 'c-e-clue-church', 'CLEARS'),
    ).toBe('WRONG');
  });

  it('doğrulayan kanıt katili suçlar; tuzağın kusuru suçlananı aklar', () => {
    expect(verdictOf(genuineFacts, 's-mill', 'c-e-verif', 'IMPLICATES')).toBe(
      'CORRECT',
    );
    expect(verdictOf(genuineFacts, 's-tavern', 'c-e-verif', 'IMPLICATES')).toBe(
      'WRONG',
    );
    expect(verdictOf(plantedFacts, 's-tavern', 'c-e-verif', 'CLEARS')).toBe(
      'CORRECT',
    );
    expect(verdictOf(plantedFacts, 's-mill', 'c-e-verif', 'IMPLICATES')).toBe(
      'WRONG',
    );
  });
});

describe('judgeBoard: kanıt ↔ kanıt', () => {
  it('doğrulayan kanıt gerçek izi doğrular, tuzağın kusuru izle çelişir', () => {
    expect(verdictOf(genuineFacts, 'c-e-scene', 'c-e-verif', 'SUPPORTS')).toBe(
      'CORRECT',
    );
    expect(
      verdictOf(genuineFacts, 'c-e-verif', 'c-e-scene', 'CONTRADICTS'),
    ).toBe('WRONG');
    expect(
      verdictOf(plantedFacts, 'c-e-scene', 'c-e-verif', 'CONTRADICTS'),
    ).toBe('CORRECT');
  });

  it('izin gösterdiği kişinin mazereti izle çelişir', () => {
    expect(
      verdictOf(genuineFacts, 'c-e-scene', 'c-e-conf-tavern', 'CONTRADICTS'),
    ).toBe('CORRECT');
    expect(
      verdictOf(genuineFacts, 'c-e-scene', 'c-e-conf-church', 'SUPPORTS'),
    ).toBe('CORRECT');
  });

  it('itiraf kendi mekânının ipucuyla uyuşur; ilgisiz kanıtlar bağlanamaz', () => {
    expect(
      verdictOf(genuineFacts, 'c-e-conf-church', 'c-e-clue-church', 'SUPPORTS'),
    ).toBe('CORRECT');
    expect(
      verdictOf(genuineFacts, 'c-e-conf-tavern', 'c-e-clue-church', 'SUPPORTS'),
    ).toBe('WRONG');
    expect(
      verdictOf(
        genuineFacts,
        'c-e-conf-tavern',
        'c-e-clue-church',
        'CONTRADICTS',
      ),
    ).toBe('WRONG');
  });

  it('notlara çekilen ve türsüz ipler değerlendirilmez', () => {
    expect(verdictOf(genuineFacts, 'n-1', 'c-e-scene', 'LINK')).toBeNull();
    expect(verdictOf(genuineFacts, 's-tavern', 's-mill', 'LINK')).toBeNull();
  });
});

describe('sanitizeBoard', () => {
  const ctx = {
    suspectIds: ['tavern', 'mill', 'church'],
    evidenceIds: evidence.map((e) => e.id),
    previous: null,
  };

  it('başkasının kanıtını, vakada olmayan şüpheliyi ve bozuk kartları atar', () => {
    const board = sanitizeBoard(
      {
        cards: [
          { id: 'a', kind: 'evidence', refId: 'yabanci-kanit', x: 5, y: 5 },
          { id: 'b', kind: 'suspect', refId: 'clinic', x: 5, y: 5 },
          { id: 'c', kind: 'hacker', x: 5, y: 5 },
          { id: 'd', kind: 'suspect', refId: 'mill', x: 500, y: -3 },
          { id: 'e', kind: 'note', text: 'x'.repeat(500), x: 1, y: 1 },
        ],
        strings: [],
      },
      ctx,
    );
    expect(board.cards.map((c) => c.id)).toEqual(['d', 'e']);
    expect(board.cards[0]).toMatchObject({ x: 100, y: 0 });
    expect(board.cards[1].text).toHaveLength(200);
  });

  it('ipin türünü uçlarına göre düzeltir ve istemcinin yazdığı kararı kabul etmez', () => {
    const board = sanitizeBoard(
      {
        cards: [
          { id: 's', kind: 'suspect', refId: 'mill', x: 1, y: 1 },
          { id: 'n', kind: 'note', text: '', x: 2, y: 2 },
          { id: 'e', kind: 'evidence', refId: 'e-scene', x: 3, y: 3 },
        ],
        strings: [
          { id: '1', from: 's', to: 'n', type: 'IMPLICATES' },
          {
            id: '2',
            from: 's',
            to: 'e',
            type: 'IMPLICATES',
            verdict: 'CORRECT',
          },
          { id: '3', from: 's', to: 'yok', type: 'LINK' },
        ],
      },
      ctx,
    );
    expect(board.strings).toEqual([
      { id: '1', from: 's', to: 'n', type: 'LINK' },
      { id: '2', from: 's', to: 'e', type: 'IMPLICATES' },
    ]);
  });

  it('sunucunun önceki kararını ip değişmediyse korur', () => {
    const previous: BoardState = {
      cards: [],
      strings: [
        { id: '2', from: 's', to: 'e', type: 'IMPLICATES', verdict: 'CORRECT' },
      ],
    };
    const input = {
      cards: [
        { id: 's', kind: 'suspect', refId: 'mill', x: 1, y: 1 },
        { id: 'e', kind: 'evidence', refId: 'e-scene', x: 3, y: 3 },
      ],
      strings: [{ id: '2', from: 's', to: 'e', type: 'IMPLICATES' }],
    };
    expect(sanitizeBoard(input, { ...ctx, previous }).strings[0].verdict).toBe(
      'CORRECT',
    );
    const changed = {
      ...input,
      strings: [{ id: '2', from: 's', to: 'e', type: 'CLEARS' }],
    };
    expect(
      sanitizeBoard(changed, { ...ctx, previous }).strings[0].verdict,
    ).toBeUndefined();
  });
});

describe('applyVerdicts ve templateThought', () => {
  it('kararları iplere işler ve şablon iç sesi yazar', () => {
    const board: BoardState = {
      cards,
      strings: [
        { id: 'ok', from: 's-church', to: 'c-e-scene', type: 'CLEARS' },
        {
          id: 'bad',
          from: 's-mill',
          to: 'c-e-conf-tavern',
          type: 'CLEARS',
          verdict: 'CORRECT',
        },
        {
          id: 'free',
          from: 'n-1',
          to: 's-mill',
          type: 'LINK',
          verdict: 'CORRECT',
        },
      ],
    };
    const judged = judgeBoard(board, genuineFacts, evidence);
    const result = applyVerdicts(board, judged);
    expect(result.strings.map((s) => s.verdict)).toEqual([
      'CORRECT',
      'WRONG',
      undefined,
    ]);

    const text = templateThought([
      {
        a: 'Rahip',
        b: 'Olay yeri izi',
        relation: 'aklıyor',
        verdict: 'CORRECT',
      },
      {
        a: 'Değirmenci',
        b: 'İtiraf: Hancı',
        relation: 'aklıyor',
        verdict: 'WRONG',
      },
    ]);
    expect(text).toContain('tutuyor');
    expect(text).toContain('hata');
  });
});
