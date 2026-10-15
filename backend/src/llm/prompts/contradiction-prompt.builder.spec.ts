import {
  buildContradictionPrompt,
  parseContradictions,
} from './contradiction-prompt.builder';

const replies = [
  'O akşam değirmende değildim, evdeydim.',
  'Gece yarısına kadar handa içtim.',
  'Kimseyi görmedim.',
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

  it('alıntısı cevapta geçen maddeleri alır (tırnak, büyük harf ve Türkçe karakter farkı önemsiz)', () => {
    const result = parseContradictions(
      '```json\n' +
        json([
          {
            a: 1,
            b: 2,
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
        quoteA: '“EVDEYDİM.”',
        quoteB: 'handa ictim',
        note: 'Gece nerede olduğu tutmuyor.',
      },
    ]);
  });

  it('uydurma alıntıyı, aynı cevabı ve notsuz maddeyi atar; en çok 3 madde', () => {
    const valid = {
      a: 1,
      b: 2,
      quoteA: 'evdeydim',
      quoteB: 'handa',
      note: 'x',
    };
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
  });

  it('okunamayan cevapta null döner', () => {
    expect(parseContradictions('çelişki yok', replies)).toBeNull();
    expect(parseContradictions('{"x": 1}', replies)).toBeNull();
    expect(parseContradictions(json([]), replies)).toEqual([]);
  });
});
