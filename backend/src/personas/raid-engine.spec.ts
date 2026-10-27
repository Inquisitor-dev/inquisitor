import {
  act,
  availableActions,
  MAX_TURNS,
  openingEvents,
  startRaid,
  type RaidAction,
  type RaidEvent,
  type RaidOptions,
  type RaidRoom,
  type RaidState,
} from './raid-engine';

const medium: RaidOptions = { hard: false, hasGun: false };
const hard: RaidOptions = { hard: true, hasGun: false };

function play(state: RaidState, actions: RaidAction[], opts: RaidOptions) {
  const events: RaidEvent[] = [];
  let s = state;
  for (const a of actions) {
    const r = act(s, a, opts);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

describe('gece baskını', () => {
  it('ışık açık ve elde bıçakla karşılaşınca saldırgan kaçar (iyi)', () => {
    const { state, events } = play(
      startRaid('DOORSTEP'),
      [
        'LIGHT_LAMP',
        'GO_HALLWAY',
        'GO_KITCHEN',
        'TAKE_KNIFE',
        'GO_HALLWAY',
        'GO_DOORSTEP',
      ],
      medium,
    );
    expect(state.outcome).toBe('GOOD');
    expect(events.at(-1)).toEqual({ kind: 'FLED' });
  });

  it('karanlıkta silahsız onun odasına girmek bayıltır (kötü); uyarı önceden verilmiştir', () => {
    const start = startRaid('HALLWAY');
    expect(openingEvents(start)).toEqual([
      { kind: 'WARNING', room: 'HALLWAY' },
    ]);
    const { state, events } = play(start, ['GO_HALLWAY'], medium);
    expect(state.outcome).toBe('BAD');
    expect(state.warningsIgnored).toBe(1);
    expect(events.at(-1)).toEqual({ kind: 'FAINTED' });
  });

  it('zorda ilk hata boğuşma, ikinci uyarıyı da görmezden gelmek ölüm', () => {
    const first = play(startRaid('HALLWAY'), ['GO_HALLWAY'], hard);
    expect(first.state.outcome).toBeNull();
    expect(first.events).toContainEqual({ kind: 'STRUGGLE' });
    // Saldırgan bitişik bir odaya çekildi; oyuncu oraya da hazırlıksız girer
    const away = first.state.attacker.room;
    const go = {
      KITCHEN: 'GO_KITCHEN',
      DOORSTEP: 'GO_DOORSTEP',
      BEDROOM: 'GO_BEDROOM',
    } as Record<string, RaidAction>;
    const second = play(first.state, [go[away]], hard);
    expect(second.state.outcome).toBe('DEATH');
  });

  it('ortada ölüm yok: ikinci hata yalnızca bayıltır', () => {
    for (let i = 0; i < 300; i++) {
      const { state } = randomPlay(i, medium);
      expect(state.outcome).not.toBe('DEATH');
    }
  });

  it('dinleyip doğru anda seslenmek: saldırgan kaçar (iyi)', () => {
    const { state } = play(
      startRaid('HALLWAY'),
      ['LIGHT_LAMP', 'LISTEN', 'CALL_OUT'],
      medium,
    );
    expect(state.outcome).toBe('GOOD');
  });

  it('saklanmak ve süre dolana kadar sessiz kalmak nötr', () => {
    expect(play(startRaid('KITCHEN'), ['HIDE'], medium).state.outcome).toBe(
      'NEUTRAL',
    );
    const waited = play(
      startRaid('DOORSTEP'),
      Array(MAX_TURNS).fill('LISTEN') as RaidAction[],
      medium,
    );
    expect(waited.state.outcome).toBe('NEUTRAL');
    expect(waited.events.at(-1)).toEqual({ kind: 'LEFT_QUIETLY' });
  });

  it('yüksek ses saldırganı getirir; önce yaklaştığı duyulur', () => {
    const { state, events } = play(
      startRaid('DOORSTEP'),
      ['CALL_OUT', 'CALL_OUT'],
      medium,
    );
    expect(events).toContainEqual({ kind: 'APPROACHES' });
    expect(events).toContainEqual({ kind: 'WARNING', room: 'HALLWAY' });
    expect(state.outcome).toBe('BAD');
  });

  it('Mavi Rozet karanlıkta da silahını çekince saldırgan kaçar', () => {
    const opts = { hard: true, hasGun: true };
    expect(availableActions(startRaid('HALLWAY'), opts)).toContain('DRAW_GUN');
    expect(
      play(startRaid('HALLWAY'), ['DRAW_GUN', 'GO_HALLWAY'], opts).state
        .outcome,
    ).toBe('GOOD');
  });

  it('kilitli mutfağa saldırgan giremez', () => {
    const { state } = play(
      startRaid('DOORSTEP'),
      [
        'GO_HALLWAY',
        'GO_KITCHEN',
        'LOCK_BACKDOOR',
        'CALL_OUT',
        'CALL_OUT',
        'LISTEN',
      ],
      medium,
    );
    expect(state.outcome).toBe('NEUTRAL');
    expect(state.attacker.room).not.toBe('KITCHEN');
  });

  it('o an yapılamayan aksiyon reddedilir; bitmiş baskında aksiyon yok', () => {
    expect(() => act(startRaid('KITCHEN'), 'TAKE_KNIFE', medium)).toThrow();
    const done = play(startRaid('KITCHEN'), ['HIDE'], medium).state;
    expect(availableActions(done, medium)).toEqual([]);
  });

  it('her yol en çok MAX_TURNS aksiyonda biter; her kötü sonucun önünde uyarı vardır', () => {
    for (let i = 0; i < 2000; i++) {
      const opts = i % 2 ? hard : { hard: false, hasGun: i % 3 === 0 };
      const { state, events, steps } = randomPlay(i, opts);
      expect(state.outcome).not.toBeNull();
      expect(steps).toBeLessThanOrEqual(MAX_TURNS);
      // Kötü sonuçtan önce en az bir uyarı: saldırgan yaklaşırken bulunduğu oda duyulur
      if (state.outcome === 'BAD' || state.outcome === 'DEATH') {
        expect(events.some((e) => e.kind === 'WARNING')).toBe(true);
      }
    }
  });
});

// Tekrarlanabilir rastgele oyun
function randomPlay(seed: number, opts: RaidOptions) {
  let s = seed + 1;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const rooms: RaidRoom[] = ['KITCHEN', 'HALLWAY', 'DOORSTEP'];
  let state = startRaid(rooms[Math.floor(rnd() * 3)]);
  const events: RaidEvent[] = [...openingEvents(state)];
  let steps = 0;
  while (!state.outcome) {
    const options = availableActions(state, opts);
    const r = act(state, options[Math.floor(rnd() * options.length)], opts);
    state = r.state;
    events.push(...r.events);
    steps++;
  }
  return { state, events, steps };
}
