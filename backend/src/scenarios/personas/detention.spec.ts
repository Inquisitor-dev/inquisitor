import { closureFor, closuresOn } from './closures';
import { effectivePersonaPlan } from './detention';
import {
  detentionPromptLines,
  emptyPersonaState,
  paperForDay,
  processNight,
} from '../../personas/persona-night';

const facts = (events: unknown[]) => ({
  culpritId: 'mill',
  persona: { persona: 'PSYCHOPATH', events },
});
const ctx = {
  scenarioType: 'medieval',
  seed: 's',
  placeName: (id: string) => `<${id}>`,
  npcName: (id: string) => `[${id}]`,
};

describe('nezaret', () => {
  it('nezaretteki kişinin mekânı o gün kapalı; anlatıcısı da', () => {
    const state = { detention: { npcId: 'tavern', day: 2 } };
    expect(closuresOn({}, 2, state)).toEqual([
      { locationId: 'tavern', reason: 'DETAINED' },
    ]);
    expect(closureFor({}, 2, 'narrator_tavern', state)?.reason).toBe(
      'DETAINED',
    );
    expect(closuresOn({}, 3, state)).toEqual([]);
  });

  it('katil nezaretteyse o gecenin hamlesi kendi aralığında sonraki boş geceye kayar', () => {
    const f = facts([
      { night: 2, kind: 'RAID', raidStart: 'HALLWAY' },
      { night: 1, kind: 'THREAT_LETTER' },
    ]);
    const shifted = effectivePersonaPlan(f, {
      detention: { npcId: 'mill', day: 2 },
    });
    expect(shifted.events.map((e) => [e.kind, e.night])).toEqual([
      ['THREAT_LETTER', 1],
      ['RAID', 3],
    ]);
  });

  it('kayacak yer yoksa hamle olmaz; masum nezaretteyse plan değişmez', () => {
    // Kilit kırma en geç 2. gece: 2. gecede nezaret varsa kayamaz
    const f = facts([{ night: 2, kind: 'BREAK_IN', locationId: 'church' }]);
    expect(
      effectivePersonaPlan(f, { detention: { npcId: 'mill', day: 2 } }).events,
    ).toEqual([]);
    expect(
      effectivePersonaPlan(f, { detention: { npcId: 'tavern', day: 2 } })
        .events,
    ).toHaveLength(1);
  });

  it('gazete yazar, kasaba duyar, kişi ertesi gün kırgın', () => {
    const state = {
      ...emptyPersonaState(),
      detention: { npcId: 'tavern', day: 1 },
    };
    const none = {
      persona: { persona: 'NONE' as const, events: [] },
      townEvents: [],
    };
    const after = processNight(state, none, 1, ctx).state;
    expect(paperForDay(after, 2)!.items[0].headline).toContain('[tavern]');
    expect(detentionPromptLines(after, 2, 'tavern', ctx)[0]).toContain(
      'resentful',
    );
    expect(detentionPromptLines(after, 2, 'mill', ctx)[0]).toContain(
      'held overnight',
    );
    expect(detentionPromptLines(after, 1, 'tavern', ctx)).toEqual([]);
  });
});
