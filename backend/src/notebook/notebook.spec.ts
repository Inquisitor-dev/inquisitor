import { MAX_NOTEBOOK_TEXT, sanitizeNotebook } from './notebook';

describe('sanitizeNotebook', () => {
  const statements = [
    { id: 'ev-1', dayNumber: 2 },
    { id: 'ev-2', dayNumber: 1 },
  ];

  it('geçerli yazı kutularını ve kayıt kartlarını korur', () => {
    const result = sanitizeNotebook(
      {
        items: [
          {
            id: 't1',
            kind: 'text',
            day: 1,
            page: 'R',
            x: 10,
            y: 20,
            w: 50,
            text: 'Hancı yalan söylüyor.',
          },
          {
            id: 'r1',
            kind: 'record',
            day: 1,
            page: 'L',
            x: 5,
            y: 5,
            evidenceId: 'ev-1',
          },
        ],
      },
      statements,
    );
    expect(result.items).toEqual([
      {
        id: 't1',
        kind: 'text',
        day: 1,
        page: 'R',
        x: 10,
        y: 20,
        w: 50,
        text: 'Hancı yalan söylüyor.',
      },
      // Kayıt kartı her zaman ifadenin alındığı günde kalır
      {
        id: 'r1',
        kind: 'record',
        day: 2,
        page: 'L',
        x: 5,
        y: 5,
        evidenceId: 'ev-1',
      },
    ]);
  });

  it('sahip olunmayan kanıtı, boş yazıyı, bilinmeyen türü ve tekrarları atar', () => {
    const result = sanitizeNotebook(
      {
        items: [
          {
            id: 'r1',
            kind: 'record',
            page: 'L',
            x: 0,
            y: 0,
            evidenceId: 'baskasinin',
          },
          {
            id: 't1',
            kind: 'text',
            day: 1,
            page: 'L',
            x: 0,
            y: 0,
            w: 40,
            text: '   ',
          },
          { id: 'x1', kind: 'script', day: 1 },
          {
            id: 'r2',
            kind: 'record',
            page: 'L',
            x: 0,
            y: 0,
            evidenceId: 'ev-2',
          },
          {
            id: 'r3',
            kind: 'record',
            page: 'L',
            x: 0,
            y: 0,
            evidenceId: 'ev-2',
          },
          {
            id: 'r2',
            kind: 'text',
            day: 1,
            page: 'L',
            x: 0,
            y: 0,
            w: 40,
            text: 'aynı id',
          },
          {
            id: '<img>',
            kind: 'text',
            day: 1,
            page: 'L',
            x: 0,
            y: 0,
            w: 40,
            text: 'kötü id',
          },
        ],
      },
      statements,
    );
    expect(result.items.map((i) => i.id)).toEqual(['r2']);
  });

  it('konumu, günü, sayfayı ve yazı uzunluğunu sınırlar', () => {
    const [item] = sanitizeNotebook(
      {
        items: [
          {
            id: 't1',
            kind: 'text',
            day: 9,
            page: 'X',
            x: -20,
            y: 400,
            w: 5,
            text: 'a'.repeat(2000),
          },
        ],
      },
      statements,
    ).items;
    expect(item).toMatchObject({ day: 4, page: 'L', x: 0, y: 96, w: 12 });
    expect((item as { text: string }).text).toHaveLength(MAX_NOTEBOOK_TEXT);
  });

  it('sadece bulunan fiziksel kanıtların fotoğrafını kabul eder, notu ve eğikliği sınırlar', () => {
    const result = sanitizeNotebook(
      {
        items: [
          {
            id: 'p1',
            kind: 'photo',
            day: 2,
            page: 'R',
            x: 30,
            y: 40,
            evidenceId: 'item-1',
            caption: 'Kan izi mi?',
            rot: 3,
          },
          {
            id: 'p2',
            kind: 'photo',
            day: 2,
            page: 'R',
            x: 30,
            y: 40,
            evidenceId: 'ev-1',
            caption: '',
            rot: 0,
          },
          {
            id: 'p3',
            kind: 'photo',
            day: 2,
            page: 'R',
            x: 30,
            y: 40,
            evidenceId: 'item-1',
            caption: 'x'.repeat(500),
            rot: 45,
          },
        ],
      },
      statements,
      ['item-1'],
    );
    expect(result.items.map((i) => i.id)).toEqual(['p1', 'p3']);
    expect(result.items[0]).toMatchObject({
      kind: 'photo',
      caption: 'Kan izi mi?',
      rot: 3,
    });
    expect(result.items[1]).toMatchObject({ rot: 8 });
    expect((result.items[1] as { caption: string }).caption).toHaveLength(160);
  });

  it('geçerli çizgileri korur, bozuk olanları atar', () => {
    const result = sanitizeNotebook(
      {
        items: [
          {
            id: 's1',
            kind: 'stroke',
            day: 1,
            page: 'L',
            color: 'red',
            size: 2,
            points: [10, 10, 20.04, 25, 150, -3],
          },
          {
            id: 's2',
            kind: 'stroke',
            day: 1,
            page: 'L',
            color: 'green',
            size: 1,
            points: [1, 1, 2, 2],
          },
          {
            id: 's3',
            kind: 'stroke',
            day: 1,
            page: 'L',
            color: 'ink',
            size: 1,
            points: [1, 1],
          },
          {
            id: 's4',
            kind: 'stroke',
            day: 1,
            page: 'L',
            color: 'ink',
            size: 1,
            points: [1, 'x', 2, 2],
          },
          {
            id: 's5',
            kind: 'stroke',
            day: 1,
            page: 'R',
            color: 'blue',
            size: 7,
            points: [1, 1, 2, 2, 3],
          },
        ],
      },
      statements,
    );
    expect(result.items).toEqual([
      {
        id: 's1',
        kind: 'stroke',
        day: 1,
        page: 'L',
        color: 'red',
        size: 2,
        points: [10, 10, 20, 25, 100, 0],
      },
      {
        id: 's5',
        kind: 'stroke',
        day: 1,
        page: 'R',
        color: 'blue',
        size: 1,
        points: [1, 1, 2, 2],
      },
    ]);
  });

  it('çizgiler yazı sınırına sayılmaz ve nokta sayısı kırpılır', () => {
    const long = Array.from({ length: 1000 }, (_, i) => i % 100);
    const result = sanitizeNotebook(
      {
        items: [
          ...Array.from({ length: 160 }, (_, i) => ({
            id: `t${i}`,
            kind: 'text',
            day: 1,
            page: 'L',
            x: 1,
            y: 1,
            w: 20,
            text: 'not',
          })),
          {
            id: 'long',
            kind: 'stroke',
            day: 1,
            page: 'L',
            color: 'ink',
            size: 1,
            points: long,
          },
        ],
      },
      statements,
    );
    expect(result.items.filter((i) => i.kind === 'text')).toHaveLength(150);
    const stroke = result.items.find((i) => i.kind === 'stroke') as {
      points: number[];
    };
    expect(stroke.points).toHaveLength(240);
  });

  it('bozuk girdiden boş defter çıkarır', () => {
    expect(sanitizeNotebook(null, statements)).toEqual({ items: [] });
    expect(sanitizeNotebook({ items: 'x' }, statements)).toEqual({ items: [] });
  });
});
