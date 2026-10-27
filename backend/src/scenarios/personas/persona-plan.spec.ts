import {
  LAST_ACTION_NIGHT,
  MAX_ACTIONS,
  PERSONA_POOLS,
  personaPlanOf,
  planPersona,
} from './persona-plan';

// Tekrarlanabilir rastgelelik
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const input = {
  culpritId: 'mill',
  suspectIds: ['tavern', 'church', 'mill', 'farm', 'graveyard'],
  protectedIds: ['church'],
};

describe('planPersona', () => {
  it('kolayda hiç persona yok', () => {
    for (let i = 0; i < 50; i++) {
      expect(planPersona('easy', input, seeded(i))).toEqual({
        persona: 'NONE',
        events: [],
      });
    }
  });

  it('ortada ve zorda yaklaşık yarı yarıya', () => {
    for (const difficulty of ['medium', 'hard']) {
      let withPersona = 0;
      for (let i = 0; i < 400; i++) {
        if (
          planPersona(difficulty, input, seeded(i * 7 + 1)).persona !== 'NONE'
        )
          withPersona++;
      }
      expect(withPersona).toBeGreaterThan(150);
      expect(withPersona).toBeLessThan(250);
    }
  });

  it('hamleler kendi gece aralığında, ayrı gecelerde, son geceden önce ve havuzda açık olanlardan', () => {
    for (let i = 0; i < 500; i++) {
      const plan = planPersona('hard', input, seeded(i));
      if (plan.persona === 'NONE') {
        expect(plan.events).toEqual([]);
        continue;
      }
      const pool = PERSONA_POOLS[plan.persona];
      expect(plan.events.length).toBeGreaterThanOrEqual(1);
      expect(plan.events.length).toBeLessThanOrEqual(MAX_ACTIONS);
      const nights = plan.events.map((e) => e.night);
      expect(new Set(nights).size).toBe(nights.length);
      for (const event of plan.events) {
        const def = pool.find((a) => a.kind === event.kind)!;
        expect(def.enabled).toBe(true);
        expect(event.night).toBeGreaterThanOrEqual(def.nights[0]);
        expect(event.night).toBeLessThanOrEqual(
          Math.min(def.nights[1], LAST_ACTION_NIGHT),
        );
      }
      // Gece sırasına göre
      expect([...nights].sort((a, b) => a - b)).toEqual(nights);
      for (const event of plan.events) {
        // Kilit kırma vakayı taşıyan kanıtın sahibine dokunmaz
        if (event.kind === 'BREAK_IN') {
          expect(event.locationId).toBeDefined();
          expect(input.protectedIds).not.toContain(event.locationId);
        }
        // Mektup izi katil dahil üç kişiye uyar
        if (event.kind === 'THREAT_LETTER') {
          expect(event.traceFits).toHaveLength(3);
          expect(event.traceFits).toContain('mill');
        }
      }
    }
  });

  it('eski vakalarda persona yoktur', () => {
    expect(personaPlanOf(null)).toEqual({ persona: 'NONE', events: [] });
    expect(personaPlanOf({ culpritId: 'mill' })).toEqual({
      persona: 'NONE',
      events: [],
    });
  });
});
