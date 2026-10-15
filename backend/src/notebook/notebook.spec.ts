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

  it('bozuk girdiden boş defter çıkarır', () => {
    expect(sanitizeNotebook(null, statements)).toEqual({ items: [] });
    expect(sanitizeNotebook({ items: 'x' }, statements)).toEqual({ items: [] });
  });
});
