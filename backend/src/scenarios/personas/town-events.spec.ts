import { judgeSuspectLink } from '../../board/domain/board-judge';
import { closureFor, closuresOn } from './closures';
import { AWAY_DAYS, planTownEvents, reasonsFor } from './town-events';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const input = {
  scenarioType: 'medieval',
  suspectIds: ['tavern', 'church', 'mill', 'farm', 'graveyard'],
  protectedIds: ['church'],
  busyDays: [] as number[],
  busyIds: [] as string[],
};

describe('kasaba olayları', () => {
  it('vakaların yaklaşık yarısında bir kişi bir günlüğüne şehir dışında', () => {
    let count = 0;
    for (let i = 0; i < 400; i++) {
      const events = planTownEvents(input, seeded(i * 13 + 5));
      if (events.length === 0) continue;
      count++;
      const [e] = events;
      expect(e.kind).toBe('AWAY');
      expect(AWAY_DAYS).toContain(e.day);
      expect(input.protectedIds).not.toContain(e.npcId);
      expect(reasonsFor('medieval')[e.reasonIndex]).toBeDefined();
    }
    expect(count).toBeGreaterThan(150);
    expect(count).toBeLessThan(250);
  });

  it('kilit kırmanın gününe ve hedefine denk gelmez', () => {
    for (let i = 0; i < 200; i++) {
      const events = planTownEvents(
        { ...input, busyDays: [2], busyIds: ['mill'] },
        seeded(i),
      );
      for (const e of events) {
        expect(e.day).toBe(3);
        expect(e.npcId).not.toBe('mill');
      }
    }
  });

  it('kapanışlar: şehir dışı o gün, kilit kırma ertesi gün; anlatıcısı da kapalı', () => {
    const facts = {
      townEvents: [{ kind: 'AWAY', npcId: 'mill', day: 3, reasonIndex: 0 }],
      persona: {
        persona: 'PSYCHOPATH',
        events: [{ night: 1, kind: 'BREAK_IN', locationId: 'tavern' }],
      },
    };
    expect(closuresOn(facts, 1)).toEqual([]);
    expect(closuresOn(facts, 2)).toEqual([
      { locationId: 'tavern', reason: 'BREAK_IN' },
    ]);
    expect(closuresOn(facts, 3)).toEqual([
      { locationId: 'mill', reason: 'AWAY' },
    ]);
    expect(closureFor(facts, 3, 'narrator_mill')?.reason).toBe('AWAY');
    expect(closureFor(facts, 3, 'tavern')).toBeNull();
    // Eski vakalarda kapanış yok
    expect(closuresOn(null, 2)).toEqual([]);
  });
});

describe('panoda tehdit mektubu', () => {
  it('izin uyduğu herkesi gösterir (yalnız katili değil), uymayanları aklar', () => {
    const facts = {
      culpritId: 'mill',
      innocentIds: ['tavern', 'church', 'farm'],
      crimeSceneClue: { implicatedNpcIds: [] },
      verification: {
        kind: 'CORROBORATION',
        placement: { type: 'LOCATION', locationId: 'mill' },
      },
      persona: {
        persona: 'PSYCHOPATH',
        events: [
          {
            night: 1,
            kind: 'THREAT_LETTER',
            traceFits: ['mill', 'tavern', 'church'],
          },
        ],
      },
    } as never;
    const letter = {
      id: 'l',
      kind: 'LETTER',
      category: 'ITEM',
      sourceId: 'home',
      text: '',
    };
    expect(judgeSuspectLink('IMPLICATES', 'mill', letter, facts)).toBe(
      'CORRECT',
    );
    expect(judgeSuspectLink('IMPLICATES', 'tavern', letter, facts)).toBe(
      'CORRECT',
    );
    expect(judgeSuspectLink('IMPLICATES', 'farm', letter, facts)).toBe('WRONG');
    expect(judgeSuspectLink('CLEARS', 'farm', letter, facts)).toBe('CORRECT');
    expect(judgeSuspectLink('CLEARS', 'mill', letter, facts)).toBe('WRONG');
  });
});
