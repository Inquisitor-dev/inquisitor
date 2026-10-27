import type { PersonaPlan } from '../scenarios/personas/persona-plan';
import {
  culpritNightLines,
  emptyPersonaState,
  firstMorningPaper,
  paperForDay,
  parsePersonaState,
  processNight,
  publicNightLines,
} from './persona-night';
import { NEWSPAPER_TEXTS } from './newspaper-texts';

const ctx = {
  scenarioType: 'medieval',
  seed: 'oturum-1',
  placeName: (id: string) => `<${id}>`,
};

const letterPlan: PersonaPlan = {
  persona: 'PSYCHOPATH',
  events: [{ night: 2, kind: 'THREAT_LETTER' }],
};

describe('sabah gazetesi', () => {
  it('ilk sabah cinayeti duyurur', () => {
    const paper = firstMorningPaper(ctx, 'Elara', 'Köy Kuyusu');
    expect(paper.day).toBe(1);
    expect(paper.title).toBe(NEWSPAPER_TEXTS.medieval.title);
    expect(paper.items[0].kind).toBe('MURDER');
    expect(paper.items[0].body).toContain('Elara');
    expect(paper.items[0].body).toContain('Köy Kuyusu');
  });

  it('her sabah gelir: olaysız gecede de iki sıradan haber', () => {
    const { state, happened, cards } = processNight(
      emptyPersonaState(),
      letterPlan,
      1,
      ctx,
    );
    expect(happened).toEqual([]);
    expect(cards).toEqual([]);
    const paper = paperForDay(state, 2)!;
    expect(paper.items).toHaveLength(2);
    expect(paper.items.every((i) => i.kind === 'TOWN')).toBe(true);
  });

  it('olaylı gece: haber, olay kartı ve kasabanın bildikleri', () => {
    const first = processNight(emptyPersonaState(), letterPlan, 1, ctx).state;
    const { state, happened, cards } = processNight(first, letterPlan, 2, ctx);
    expect(happened).toEqual([{ night: 2, kind: 'THREAT_LETTER' }]);
    expect(cards).toEqual([
      expect.objectContaining({
        kind: 'EVENT',
        category: 'EVENT',
        sourceId: 'night-2-THREAT_LETTER',
      }),
    ]);
    const paper = paperForDay(state, 3)!;
    expect(paper.items[0]).toEqual(
      expect.objectContaining({
        kind: 'PERSONA',
        headline: NEWSPAPER_TEXTS.medieval.letter.headline,
      }),
    );
    // Sıradan haberler vaka boyunca tekrar etmez
    const headlines = state.papers.flatMap((p) =>
      p.items.map((i) => i.headline),
    );
    expect(new Set(headlines).size).toBe(headlines.length);

    const lines = publicNightLines(state, 3, ctx);
    expect(lines[0]).toContain('threatening letter');
    expect(lines[0]).toContain('Engizitör');
    expect(lines.some((l) => l.includes("Today's town paper"))).toBe(true);
    expect(culpritNightLines(state)).toHaveLength(1);
  });

  it('aynı gece ikinci kez işlenmez', () => {
    const once = processNight(emptyPersonaState(), letterPlan, 2, ctx);
    const twice = processNight(once.state, letterPlan, 2, ctx);
    expect(twice.happened).toEqual([]);
    expect(twice.state).toBe(once.state);
  });

  it('olay yoksa katile satır eklenmez; bozuk kayıt boş duruma döner', () => {
    expect(culpritNightLines(emptyPersonaState())).toEqual([]);
    expect(parsePersonaState({ version: 9 })).toEqual(emptyPersonaState());
    expect(parsePersonaState(null)).toEqual(emptyPersonaState());
  });

  it('uzun ve olaysız vakada da her sabah gazete dolu gelir', () => {
    const none: PersonaPlan = { persona: 'NONE', events: [] };
    let state = {
      ...emptyPersonaState(),
      papers: [firstMorningPaper(ctx, 'Elara', 'Kuyu')],
    };
    for (let night = 1; night <= 4; night++) {
      state = processNight(state, none, night, ctx).state;
      expect(paperForDay(state, night + 1)!.items).toHaveLength(2);
    }
  });
});
