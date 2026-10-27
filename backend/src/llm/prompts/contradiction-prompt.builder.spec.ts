import {
  type Contradiction,
  buildContradictionCheckPrompt,
  buildContradictionPrompt,
  parseContradictionCheck,
  parseContradictions,
} from './contradiction-prompt.builder';

const replies = [
  'O akşam değirmende değildim, evdeydim.',
  'Gece yarısına kadar handa içtim.',
  'Kimseyi görmedim.',
  'Hatırlamıyorum.',
];

describe('Çelişki Taraması prompt’u', () => {
  it('yalnızca cevapları içerir ve JSON ister', () => {
    const prompt = buildContradictionPrompt('Hancı', replies, 'medieval');
    expect(prompt).toContain('1. O akşam değirmende değildim, evdeydim.');
    expect(prompt).toContain('"contradictions"');
  });
});

describe('parseContradictions', () => {
  const json = (items: unknown[]) => JSON.stringify({ contradictions: items });
  const valid = {
    a: 1,
    b: 2,
    quoteA: 'evdeydim',
    quoteB: 'handa',
    bothTrue: false,
    note: 'x',
  };

  it('alıntısı cevapta geçen maddeleri alır (tırnak, büyük harf ve Türkçe karakter farkı önemsiz)', () => {
    const result = parseContradictions(
      '```json\n' +
        json([
          {
            ...valid,
            quoteA: '“EVDEYDİM.”',
            quoteB: 'handa ictim',
            note: 'Gece nerede olduğu tutmuyor.',
          },
        ]) +
        '\n```',
      replies,
    );
    expect(result).toEqual([
      {
        a: 1,
        b: 2,
        quoteA: '“EVDEYDİM.”',
        quoteB: 'handa ictim',
        note: 'Gece nerede olduğu tutmuyor.',
      },
    ]);
  });

  it('uydurma alıntıyı, aynı cevabı ve notsuz maddeyi atar; en çok 3 madde', () => {
    const result = parseContradictions(
      json([
        { ...valid, quoteB: 'kiliseye gittim' },
        { ...valid, b: 1 },
        { ...valid, note: '' },
        { ...valid, a: 9 },
        valid,
        valid,
        valid,
        valid,
      ]),
      replies,
    );
    expect(result).toHaveLength(3);
    expect(
      parseContradictions(json([valid, valid, valid, valid]), replies, 5),
    ).toHaveLength(4);
  });

  it('modelin kendi kontrolünü geçemeyen, "çelişki yok" diyen ve iddiasız alıntılı maddeyi atar', () => {
    const result = parseContradictions(
      json([
        { ...valid, bothTrue: true },
        { ...valid, bothTrue: undefined },
        { ...valid, note: 'Burada çelişki tespit edilmemiştir.' },
        { ...valid, a: 4, quoteA: 'Hatırlamıyorum' },
      ]),
      replies,
    );
    expect(result).toEqual([]);
  });

  it('okunamayan cevapta null döner', () => {
    expect(parseContradictions('çelişki yok', replies)).toBeNull();
    expect(parseContradictions('{"x": 1}', replies)).toBeNull();
    expect(parseContradictions(json([]), replies)).toEqual([]);
  });
});

describe('ikinci kontrol', () => {
  const candidates: Contradiction[] = [
    { a: 1, b: 2, quoteA: 'evdeydim', quoteB: 'handa', note: 'Yer tutmuyor.' },
    { a: 2, b: 3, quoteA: 'handa', quoteB: 'Kimseyi', note: 'Kişi tutmuyor.' },
  ];

  it('her adayı iki tam cevapla sorar', () => {
    const prompt = buildContradictionCheckPrompt('Hancı', replies, candidates);
    expect(prompt).toContain(
      '1. Answer A: "O akşam değirmende değildim, evdeydim."',
    );
    expect(prompt).toContain('Answer B: "Kimseyi görmedim."');
    expect(prompt).toContain('"verdicts"');
  });

  it('yalnızca ikisi birden doğru olamaz denen adayları tutar; okunamayan cevapta null', () => {
    const verdicts = (items: unknown[]) => JSON.stringify({ verdicts: items });
    expect(
      parseContradictionCheck(
        verdicts([
          { item: 1, bothTrue: false },
          { item: 2, bothTrue: true },
        ]),
        candidates,
      ),
    ).toEqual([candidates[0]]);
    expect(
      parseContradictionCheck(verdicts([{ item: 2 }]), candidates),
    ).toEqual([]);
    expect(parseContradictionCheck('tamam', candidates)).toBeNull();
  });
});
