import {
  StoryRow,
  importAction,
  parseStoryFile,
  serializeStoryFile,
  storyFilePath,
  toStoryFile,
} from './story-files';

const content = {
  scenarioType: 'winter',
  difficulty: 'hard',
  plan: {},
  facts: {},
  draft: {},
};

const row = (patch: Partial<StoryRow> = {}): StoryRow => ({
  id: '9629f3ad-677c-4736-8d28-f8b78ac4a84e',
  universe: 'winter',
  difficulty: 'hard',
  status: 'APPROVED',
  wildcardCount: 0,
  gameMode: 'standard',
  ruleVersion: 2,
  createdAt: new Date('2026-10-23T17:22:00.000Z'),
  updatedAt: new Date('2026-10-23T18:00:00.000Z'),
  content,
  reviewResults: { decision: { status: 'APPROVED', by: 'Enes' } },
  ...patch,
});

const PATH = 'winter/hard/9629f3ad-677c-4736-8d28-f8b78ac4a84e.json';
const roundTrip = (r: StoryRow) =>
  JSON.parse(serializeStoryFile(toStoryFile(r))) as unknown;

describe('storyFilePath', () => {
  it('evren/zorluk/kimlik.json', () => {
    expect(storyFilePath(row())).toBe(PATH);
  });

  it('yol dışına çıkan değeri reddeder', () => {
    expect(() => storyFilePath(row({ universe: '../etc' }))).toThrow();
  });
});

describe('parseStoryFile', () => {
  it('dışa aktarılan dosyayı aynen okur', () => {
    expect(parseStoryFile(roundTrip(row()), PATH)).toEqual(toStoryFile(row()));
  });

  it('bozuk dosyayı yolu ve sebebiyle reddeder', () => {
    const file = toStoryFile(row());
    expect(() =>
      parseStoryFile({ ...file, status: 'PUBLISHED' }, PATH),
    ).toThrow(`${PATH}: geçersiz durum`);
    expect(() => parseStoryFile({ ...file, content: {} }, PATH)).toThrow(
      'Geçersiz hikâye paketi',
    );
    expect(() => parseStoryFile(file, 'winter/easy/x.json')).toThrow(
      'yolu içeriğiyle uyuşmuyor',
    );
  });
});

describe('importAction', () => {
  const file = toStoryFile(row());

  it('yerelde yoksa ekler, aynıysa dokunmaz', () => {
    expect(importAction(file, null)).toBe('CREATE');
    expect(importAction(file, row())).toBe('SAME');
  });

  it('dosya daha yeniyse günceller', () => {
    const older = row({
      status: 'DRAFT',
      updatedAt: new Date('2026-10-23T17:30:00.000Z'),
    });
    expect(importAction(file, older)).toBe('UPDATE');
  });

  it('yerelde dışa aktarılmamış daha yeni karar varsa ezmez', () => {
    const newer = row({
      status: 'REJECTED',
      updatedAt: new Date('2026-10-24T09:00:00.000Z'),
    });
    expect(importAction(file, newer)).toBe('LOCAL_NEWER');
  });
});
