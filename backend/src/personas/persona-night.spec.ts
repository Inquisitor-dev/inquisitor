import type { PersonaPlan } from '../scenarios/personas/persona-plan';
import type { TownEvent } from '../scenarios/personas/town-events';
import {
  breakInOwnerLines,
  culpritNightLines,
  ownPlanLines,
  emptyPersonaState,
  firstMorningPaper,
  paperForDay,
  parsePersonaState,
  processNight,
  publicNightLines,
  townPromptLines,
  type NightPlan,
} from './persona-night';
import { NEWSPAPER_TEXTS } from './newspaper-texts';

const ctx = {
  scenarioType: 'medieval',
  seed: 'oturum-1',
  placeName: (id: string) => `<${id}>`,
  npcName: (id: string) => `[${id}]`,
};

const plan = (
  events: PersonaPlan['events'],
  townEvents: TownEvent[] = [],
): NightPlan => ({
  persona: { persona: 'PSYCHOPATH', events },
  townEvents,
  letter: { text: 'Seni izliyorum.', trace: 'kâğıtta mum isi kokusu var' },
});

const letterPlan = plan([
  { night: 2, kind: 'THREAT_LETTER', traceFits: ['mill', 'church', 'farm'] },
]);

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
    const { state, happened, records } = processNight(
      emptyPersonaState(),
      letterPlan,
      1,
      ctx,
    );
    expect(happened).toEqual([]);
    expect(records).toEqual([]);
    const paper = paperForDay(state, 2)!;
    expect(paper.items).toHaveLength(2);
    expect(paper.items.every((i) => i.kind === 'TOWN')).toBe(true);
  });

  it('mektup gecesi: haber, olay kartı, envantere mektup ve kasabanın bildikleri', () => {
    const first = processNight(emptyPersonaState(), letterPlan, 1, ctx).state;
    const { state, happened, records } = processNight(
      first,
      letterPlan,
      2,
      ctx,
    );
    expect(happened.map((e) => e.kind)).toEqual(['THREAT_LETTER']);
    expect(records).toEqual([
      expect.objectContaining({
        kind: 'EVENT',
        category: 'EVENT',
        sourceId: 'night-2-THREAT_LETTER',
      }),
      expect.objectContaining({
        kind: 'LETTER',
        category: 'ITEM',
        sourceId: 'home',
      }),
    ]);
    expect(records[1].text).toContain('Seni izliyorum.');
    expect(records[1].text).toContain('mum isi kokusu');
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

  it('kilit kırma: gazete, olay kartı ve sahibinin ertesi gün anlatması', () => {
    const breakIn = plan([
      { night: 1, kind: 'BREAK_IN', locationId: 'tavern' },
    ]);
    const { state, records } = processNight(
      emptyPersonaState(),
      breakIn,
      1,
      ctx,
    );
    expect(paperForDay(state, 2)!.items[0].headline).toContain('<tavern>');
    expect(records).toEqual([
      expect.objectContaining({ kind: 'EVENT', sourceId: 'night-1-BREAK_IN' }),
    ]);
    expect(breakInOwnerLines(state, 'tavern', false)[0]).toContain(
      'someone broke into your place',
    );
    expect(breakInOwnerLines(state, 'tavern', true)[0]).toContain('yourself');
    expect(breakInOwnerLines(state, 'mill', false)).toEqual([]);
  });

  it('kasaba olayı önceden sezdirilir: bir gün önce ve o gün gazetede, NPC istemlerinde', () => {
    const away: TownEvent[] = [
      { kind: 'AWAY', npcId: 'mill', day: 3, reasonIndex: 0 },
    ];
    const town = plan([], away);
    const night1 = processNight(emptyPersonaState(), town, 1, ctx).state;
    expect(paperForDay(night1, 2)!.items[0]).toEqual(
      expect.objectContaining({
        kind: 'NOTICE',
        headline: 'Yarın <mill> kapalı',
      }),
    );
    const night2 = processNight(night1, town, 2, ctx).state;
    expect(paperForDay(night2, 3)!.items[0].headline).toBe(
      '<mill> bugün kapalı',
    );
    // 2. gün kapanacaksa ilk sabahın gazetesi duyurur
    const early: TownEvent[] = [
      { kind: 'AWAY', npcId: 'mill', day: 2, reasonIndex: 1 },
    ];
    expect(firstMorningPaper(ctx, 'Elara', 'Kuyu', early).items[1].kind).toBe(
      'NOTICE',
    );

    // Kişinin kendi programı ayrı ve göreli zamanla (gün numarası değil)
    expect(townPromptLines(away, 1, 'mill', ctx)).toEqual([]);
    expect(ownPlanLines(away, 2, 'mill', ctx)[0]).toContain('TOMORROW');
    expect(ownPlanLines(away, 2, 'mill', ctx)[0]).toContain('the answer is NO');
    expect(ownPlanLines(away, 1, 'mill', ctx)[0]).toContain(
      'THE DAY AFTER TOMORROW',
    );
    expect(ownPlanLines(away, 4, 'mill', ctx)[0]).toContain('Yesterday');
    expect(ownPlanLines(away, 2, 'tavern', ctx)).toEqual([]);
    expect(townPromptLines(away, 1, 'tavern', ctx)[0]).toContain(
      'the day after tomorrow',
    );
    expect(townPromptLines(away, 2, 'tavern', ctx)[0]).toContain(
      'Word in town',
    );
    expect(townPromptLines(away, 4, 'tavern', ctx)).toEqual([]);
  });

  it('baskın: sonuca göre gazete ve kart; Çatı Geçişi gecesi ev aranmış bulunur, iz yok', () => {
    const raidPlan = (outcome: 'GOOD' | 'SEARCHED'): NightPlan => ({
      ...plan([{ night: 2, kind: 'RAID', raidStart: 'HALLWAY' }]),
      raid: { outcome, trace: 'kâğıtta un tozu var' },
    });
    const good = processNight(emptyPersonaState(), raidPlan('GOOD'), 2, ctx);
    expect(good.records.map((r) => r.kind)).toEqual(['EVENT', 'RAID_TRACE']);
    expect(paperForDay(good.state, 3)!.items[0].headline).toContain('baskın');
    const searched = processNight(
      emptyPersonaState(),
      raidPlan('SEARCHED'),
      2,
      ctx,
    );
    expect(searched.records.map((r) => r.kind)).toEqual(['EVENT']);
    expect(paperForDay(searched.state, 3)!.items[0].headline).toContain(
      'aranmış',
    );
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
    const none: NightPlan = {
      persona: { persona: 'NONE', events: [] },
      townEvents: [],
    };
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
