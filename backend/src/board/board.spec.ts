import { CaseFacts } from '../scenarios/case-setup';
import {
  applyVerdicts,
  BoardEvidence,
  describeJudged,
  BoardState,
  judgeBoard,
  judgePending,
  MAX_STRINGS_PER_THOUGHT,
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
  crimeSceneId: 'well',
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
  {
    id: 'e-clue-mill',
    kind: 'CLUE',
    category: 'ITEM',
    sourceId: 'mill',
    text: 'değirmen ipucu',
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

  it('itiraf tek başına kimseyi aklamaz: katil de kırılınca yalan bir mazeret anlatır', () => {
    expect(
      verdictOf(genuineFacts, 's-tavern', 'c-e-conf-tavern', 'CLEARS'),
    ).toBe('WRONG');
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

  it('katilin kendi mekânındaki ipucu onu suçlamaz: aranan mekân tek iple katili söylemez', () => {
    expect(
      verdictOf(genuineFacts, 's-mill', 'c-e-clue-mill', 'IMPLICATES'),
    ).toBe('WRONG');
    expect(
      verdictOf(genuineFacts, 's-church', 'c-e-clue-church', 'IMPLICATES'),
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

describe('judgePending: bir düşünüşte en fazla 3 yeni ip', () => {
  it('yalnızca karar almamış ipler, önce kurulanlar önce değerlendirilir; kalanlar sırada bekler', () => {
    const strings = [
      // Mühürlü ip yeniden değerlendirilmez
      {
        id: 'sealed',
        from: 's-church',
        to: 'c-e-scene',
        type: 'CLEARS' as const,
        verdict: 'CORRECT' as const,
      },
      ...['s-tavern', 's-mill', 's-church'].map((from, i) => ({
        id: `n${i}`,
        from,
        to: 'c-e-scene',
        type: 'IMPLICATES' as const,
      })),
      {
        id: 'n3',
        from: 's-tavern',
        to: 'c-e-verif',
        type: 'IMPLICATES' as const,
      },
      {
        id: 'n4',
        from: 's-mill',
        to: 'c-e-verif',
        type: 'IMPLICATES' as const,
      },
      // Değerlendirilemeyen bağ sıraya girmez
      { id: 'link', from: 'n-1', to: 's-mill', type: 'LINK' as const },
    ];
    const { judged, waiting } = judgePending(
      { cards, strings },
      genuineFacts,
      evidence,
    );
    expect(judged.map((j) => j.string.id)).toEqual(['n0', 'n1', 'n2']);
    expect(judged).toHaveLength(MAX_STRINGS_PER_THOUGHT);
    expect(waiting).toBe(2);

    // Kararlar işlenince mühürlü ipin kararı korunur, sıradakiler kararsız kalır
    const after = applyVerdicts({ cards, strings }, judged);
    const verdictOf = (id: string) =>
      after.strings.find((s) => s.id === id)?.verdict;
    expect(verdictOf('sealed')).toBe('CORRECT');
    expect(verdictOf('n0')).toBe('CORRECT');
    expect(verdictOf('n3')).toBeUndefined();

    // Sonraki düşünüş sıradakileri değerlendirir
    const next = judgePending(after, genuineFacts, evidence);
    expect(next.judged.map((j) => j.string.id)).toEqual(['n3', 'n4']);
    expect(next.waiting).toBe(0);
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
        a: 'Olay yeri izi',
        b: 'Rahip',
        type: 'CLEARS',
        relation: 'aklıyor',
        verdict: 'CORRECT',
      },
      {
        a: 'İtiraf: Hancı',
        b: 'Değirmenci',
        type: 'CLEARS',
        relation: 'aklıyor',
        verdict: 'WRONG',
      },
    ]);
    expect(text).toContain('Rahip temiz görünüyor');
    expect(text).toContain('Değirmenci için İtiraf: Hancı yetmiyor galiba');
  });
});

describe('judgeBoard: Vaka Motoru v2 kanıtları', () => {
  // Katil değirmenci. Kilise eşkâl tanığı (tarif değirmenciye ve hancıya uyar), çiftçi kısmi tanık
  // (hancıyı başka yerde gördü), hancı silahı bilmeden verdi, mezarcı tamamen masum ve onu çiftçi doğruluyor.
  const v2Facts = {
    ...genuineFacts,
    innocentIds: ['tavern', 'church', 'farm', 'graveyard'],
    verification: {
      kind: 'CORROBORATION',
      placement: { type: 'TESTIMONY', npcId: 'church' },
      witnessDescriptionFits: ['mill', 'tavern'],
    },
    involvements: [
      { npcId: 'church', kind: 'WITNESS', aboutNpcId: 'mill' },
      { npcId: 'farm', kind: 'WITNESS', aboutNpcId: 'tavern' },
      { npcId: 'tavern', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
      { npcId: 'graveyard', kind: 'NONE', aboutNpcId: 'farm' },
    ],
  } as unknown as CaseFacts;
  const v2Evidence = [
    {
      id: 'w',
      kind: 'VERIFICATION',
      category: 'STATEMENT',
      sourceId: 'church',
      text: 'eşkâl',
    },
    {
      id: 't',
      kind: 'TESTIMONY',
      category: 'STATEMENT',
      sourceId: 'farm',
      text: 'hancıyı gördüm',
    },
    {
      id: 'a',
      kind: 'ALIBI',
      category: 'STATEMENT',
      sourceId: 'farm',
      text: 'mezarcı benimleydi',
    },
    {
      id: 'b',
      kind: 'BODY',
      category: 'ITEM',
      sourceId: 'crime_scene',
      text: 'yara',
    },
    {
      id: 'h',
      kind: 'CONFESSION',
      category: 'STATEMENT',
      sourceId: 'tavern',
      text: 'çekici verdim',
    },
    {
      id: 'g',
      kind: 'CONFESSION',
      category: 'STATEMENT',
      sourceId: 'graveyard',
      text: 'çiftçiyle birlikteydim',
    },
  ];
  const v2Cards = [
    ...['mill', 'tavern', 'church', 'farm', 'graveyard'].map((id, i) => ({
      id: `s-${id}`,
      kind: 'suspect' as const,
      refId: id,
      x: 10 * i,
      y: 10,
    })),
    ...v2Evidence.map((e, i) => ({
      id: `c-${e.id}`,
      kind: 'evidence' as const,
      refId: e.id,
      x: 10 * i,
      y: 50,
    })),
  ];
  const judge = (
    from: string,
    to: string,
    type: 'CLEARS' | 'IMPLICATES' | 'SUPPORTS' | 'CONTRADICTS',
  ) =>
    judgeBoard(
      { cards: v2Cards, strings: [{ id: 'x', from, to, type }] },
      v2Facts,
      v2Evidence,
    )[0]?.verdict;

  it('eşkâl tanıklığı yalnız katile değil tarife uyan herkese "doğru" der: pano adı ele vermez', () => {
    expect(judge('s-mill', 'c-w', 'IMPLICATES')).toBe('CORRECT');
    expect(judge('s-tavern', 'c-w', 'IMPLICATES')).toBe('CORRECT');
    expect(judge('s-farm', 'c-w', 'CLEARS')).toBe('CORRECT');
    expect(judge('s-farm', 'c-w', 'IMPLICATES')).toBe('WRONG');
  });

  it('kısmi tanıklık gördüğü kişiyi, mazeret doğrulaması doğruladığı kişiyi aklar', () => {
    expect(judge('s-tavern', 'c-t', 'CLEARS')).toBe('CORRECT');
    expect(judge('s-mill', 'c-t', 'CLEARS')).toBe('WRONG');
    expect(judge('s-graveyard', 'c-a', 'CLEARS')).toBe('CORRECT');
    expect(judge('s-farm', 'c-a', 'CLEARS')).toBe('WRONG');
  });

  it('beden incelemesi kimseyi işaret etmez; silahı verenin itirafıyla birlikte silah zincirini destekler', () => {
    expect(judge('s-tavern', 'c-b', 'IMPLICATES')).toBe('WRONG');
    expect(judge('s-mill', 'c-b', 'IMPLICATES')).toBe('WRONG');
    expect(judge('c-b', 'c-h', 'SUPPORTS')).toBe('CORRECT');
    // Silahı verenin itirafı aleti alan katili gösterir; itiraf edeni ise tek başına aklamaz
    expect(judge('s-mill', 'c-h', 'IMPLICATES')).toBe('CORRECT');
    expect(judge('s-tavern', 'c-h', 'CLEARS')).toBe('WRONG');
  });

  it('tamamen masumun itirafı birlikte olduğu kişiyi aklar, kendini değil', () => {
    expect(judge('s-farm', 'c-g', 'CLEARS')).toBe('CORRECT');
    expect(judge('s-graveyard', 'c-g', 'CLEARS')).toBe('WRONG');
    expect(judge('s-tavern', 'c-g', 'CLEARS')).toBe('WRONG');
    expect(judge('s-mill', 'c-h', 'CLEARS')).toBe('WRONG');
  });

  it('birkaç kişiye uyan kanıtın doğru "işaret eder" ipi paylaşılan olarak işaretlenir', () => {
    const judgedOf = (from: string, to: string) =>
      judgeBoard(
        {
          cards: v2Cards,
          strings: [{ id: 'x', from, to, type: 'IMPLICATES' }],
        },
        v2Facts,
        v2Evidence,
      )[0];
    // Eşkâl iki kişiye uyuyor: iç ses "yalnız onu gösteriyor" demesin
    expect(judgedOf('s-mill', 'c-w')?.shared).toBe(true);
    // Silahı verenin itirafı yalnız katili gösterir
    expect(judgedOf('s-mill', 'c-h')?.shared).toBeUndefined();
    const lines = describeJudged([judgedOf('s-tavern', 'c-w')], (c) => c.id);
    expect(templateThought(lines)).toContain('yalnız onu da göstermiyor');
  });
});
