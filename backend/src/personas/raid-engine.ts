// Gece baskını (v3, docs/v3-persona-tasarimi.md bölüm 4): saf durum makinesi. Oyuncu evinin dört odası
// arasında hazır aksiyonlarla ilerler; kod küçük bir durum tutar, sonucu durumdan kod hesaplar. Gemini
// çağrılmaz. Metinler ayrı (raid-texts.ts); burada yalnızca kurallar ve olaylar var.

export type RaidRoom = 'BEDROOM' | 'KITCHEN' | 'HALLWAY' | 'DOORSTEP';

export type RaidAction =
  | 'GO_BEDROOM'
  | 'GO_KITCHEN'
  | 'GO_HALLWAY'
  | 'GO_DOORSTEP'
  | 'LISTEN'
  | 'CALL_OUT'
  | 'HIDE'
  | 'LIGHT_LAMP'
  | 'LOOK_WINDOW'
  | 'TAKE_KNIFE'
  | 'LOCK_BACKDOOR'
  | 'LOOK_DARK'
  | 'DRAW_GUN';

export const RAID_ACTIONS: RaidAction[] = [
  'GO_BEDROOM',
  'GO_KITCHEN',
  'GO_HALLWAY',
  'GO_DOORSTEP',
  'LISTEN',
  'CALL_OUT',
  'HIDE',
  'LIGHT_LAMP',
  'LOOK_WINDOW',
  'TAKE_KNIFE',
  'LOCK_BACKDOOR',
  'LOOK_DARK',
  'DRAW_GUN',
];

// Anlatıcının söyleyeceği olaylar (sırayla)
export type RaidEvent =
  | { kind: 'ENTERED'; room: RaidRoom }
  | { kind: 'HEARD'; room: RaidRoom }
  | { kind: 'HEARD_NOTHING' }
  | { kind: 'WARNING'; room: RaidRoom }
  | { kind: 'LAMP_LIT' }
  | { kind: 'KNIFE_TAKEN' }
  | { kind: 'GUN_DRAWN' }
  | { kind: 'BACKDOOR_LOCKED' }
  | { kind: 'WINDOW'; seen: boolean }
  | { kind: 'DARK'; heard: boolean }
  | { kind: 'CALLED_OUT' }
  | { kind: 'APPROACHES' }
  | { kind: 'STRUGGLE' }
  | { kind: 'FLED' }
  | { kind: 'FAINTED' }
  | { kind: 'DIED' }
  | { kind: 'HID' }
  | { kind: 'LEFT_QUIETLY' };

// İyi: saldırgan kaçar ve iz bırakır · Nötr: gider, kimse bir şey kazanmaz · Kötü: bayılırsın · Ölüm: yalnızca zorda
export type RaidOutcome = 'GOOD' | 'NEUTRAL' | 'BAD' | 'DEATH';

export interface RaidState {
  room: RaidRoom;
  light: boolean;
  holding: 'NONE' | 'KNIFE' | 'GUN';
  // 0–3: yüksek ses saldırganı oyuncuya doğru getirir
  noise: number;
  attacker: { room: RaidRoom };
  // Oyuncunun bildiği saldırgan odası (dinleyerek, pencereden ya da rüyada)
  known: RaidRoom | null;
  // Uyarısı verilmiş oda: oraya hazırlıksız girmek uyarıyı görmezden gelmektir
  warnedRoom: RaidRoom | null;
  warningsIgnored: number;
  struggles: number;
  backdoorLocked: boolean;
  turn: number;
  outcome: RaidOutcome | null;
}

export interface RaidOptions {
  // Zorda ilk hazırlıksız karşılaşma bir boğuşmadır, ikincisi ölüm olabilir
  hard: boolean;
  // Mavi Rozet: "silahını çek"
  hasGun: boolean;
}

export const MAX_TURNS = 6;

const ADJACENT: Record<RaidRoom, RaidRoom[]> = {
  BEDROOM: ['HALLWAY'],
  KITCHEN: ['HALLWAY'],
  HALLWAY: ['BEDROOM', 'KITCHEN', 'DOORSTEP'],
  DOORSTEP: ['HALLWAY'],
};

const GO: Record<RaidRoom, RaidAction> = {
  BEDROOM: 'GO_BEDROOM',
  KITCHEN: 'GO_KITCHEN',
  HALLWAY: 'GO_HALLWAY',
  DOORSTEP: 'GO_DOORSTEP',
};

const ROOM_OF_GO: Partial<Record<RaidAction, RaidRoom>> = {
  GO_BEDROOM: 'BEDROOM',
  GO_KITCHEN: 'KITCHEN',
  GO_HALLWAY: 'HALLWAY',
  GO_DOORSTEP: 'DOORSTEP',
};

// Saldırganın başlayabileceği odalar (yatak odası değil: oyuncu orada uyanır)
export const ATTACKER_START_ROOMS: RaidRoom[] = [
  'KITCHEN',
  'HALLWAY',
  'DOORSTEP',
];

const adjacent = (a: RaidRoom, b: RaidRoom) => ADJACENT[a].includes(b);

// Oyuncu yatak odasında, karanlıkta uyanır. Kar Kâhini saldırganın odasını rüyada görmüştür.
export function startRaid(
  attackerRoom: RaidRoom,
  dreamSeen = false,
): RaidState {
  return {
    room: 'BEDROOM',
    light: false,
    holding: 'NONE',
    noise: 0,
    attacker: { room: attackerRoom },
    known: dreamSeen ? attackerRoom : null,
    // Saldırgan bitişik odadaysa ilk uyarı uyanırken gelir (openingEvents)
    warnedRoom: adjacent(attackerRoom, 'BEDROOM') ? attackerRoom : null,
    warningsIgnored: 0,
    struggles: 0,
    backdoorLocked: false,
    turn: 0,
    outcome: null,
  };
}

// Uyanınca anlatılan: saldırgan bitişik odadaysa ilk uyarı
export function openingEvents(state: RaidState): RaidEvent[] {
  return state.warnedRoom ? [{ kind: 'WARNING', room: state.warnedRoom }] : [];
}

export function availableActions(
  state: RaidState,
  opts: RaidOptions,
): RaidAction[] {
  if (state.outcome) return [];
  const actions: RaidAction[] = ADJACENT[state.room].map((room) => GO[room]);
  actions.push('LISTEN', 'CALL_OUT', 'HIDE');
  if (state.room === 'BEDROOM') {
    if (!state.light) actions.push('LIGHT_LAMP');
    actions.push('LOOK_WINDOW');
  }
  if (state.room === 'KITCHEN') {
    if (state.holding === 'NONE') actions.push('TAKE_KNIFE');
    if (!state.backdoorLocked) actions.push('LOCK_BACKDOOR');
  }
  if (state.room === 'DOORSTEP') actions.push('LOOK_DARK');
  if (opts.hasGun && state.holding !== 'GUN') actions.push('DRAW_GUN');
  return actions;
}

// Saldırganın oyuncuya doğru bir adımı (koridordan geçer). Mutfak kilitlendiyse oraya giremez: kilitli
// mutfakta beklemek güvenli ama nötr bir yoldur.
function stepToward(state: RaidState): RaidRoom {
  const from = state.attacker.room;
  if (state.room === 'KITCHEN' && state.backdoorLocked) return from;
  if (adjacent(from, state.room)) return state.room;
  return 'HALLWAY';
}

// Hazırlıksız karşılaşma, hazırlıklı karşılaşma
function encounter(
  state: RaidState,
  opts: RaidOptions,
  events: RaidEvent[],
): RaidState {
  const armed = state.holding !== 'NONE';
  if (state.holding === 'GUN' || (state.light && armed)) {
    events.push({ kind: 'FLED' });
    return { ...state, outcome: 'GOOD' };
  }
  if (opts.hard && state.struggles >= 1 && state.warningsIgnored >= 2) {
    events.push({ kind: 'DIED' });
    return { ...state, outcome: 'DEATH' };
  }
  if (opts.hard && state.struggles === 0) {
    // Zorda ilk hata bir boğuşmadır: saldırgan karanlığa çekilir, oyuncunun bir şansı daha var
    events.push({ kind: 'STRUGGLE' });
    const away =
      ADJACENT[state.room].find((r) => r !== 'BEDROOM') ??
      ADJACENT[state.room][0];
    // Saldırganın çekildiği oda duyulur: oraya hazırlıksız girmek ikinci uyarıyı da görmezden gelmektir
    events.push({ kind: 'WARNING', room: away });
    return {
      ...state,
      struggles: 1,
      attacker: { room: away },
      known: away,
      warnedRoom: away,
      noise: 0,
    };
  }
  events.push({ kind: 'FAINTED' });
  return { ...state, outcome: 'BAD' };
}

// Tur sonu: ses yüksekse saldırgan yaklaşır; aynı odaya gelirse karşılaşma; bitişik odadaysa uyarı
function endTurn(
  state: RaidState,
  opts: RaidOptions,
  events: RaidEvent[],
): RaidState {
  let next = { ...state, turn: state.turn + 1 };
  if (next.noise >= 2) {
    const to = stepToward(next);
    if (to !== next.attacker.room) {
      events.push({ kind: 'APPROACHES' });
      next = { ...next, attacker: { room: to } };
    }
  }
  next = { ...next, noise: Math.max(0, next.noise - 1) };
  if (next.attacker.room === next.room) {
    return checkLimit(encounter(next, opts, events), events);
  }
  if (adjacent(next.attacker.room, next.room)) {
    events.push({ kind: 'WARNING', room: next.attacker.room });
    next = { ...next, warnedRoom: next.attacker.room };
  } else {
    next = { ...next, warnedRoom: null };
  }
  return checkLimit(next, events);
}

// Süre dolunca saldırgan sessizce gider (nötr); boğuşmadan sonra da geçerli
function checkLimit(state: RaidState, events: RaidEvent[]): RaidState {
  if (state.outcome || state.turn < MAX_TURNS) return state;
  events.push({ kind: 'LEFT_QUIETLY' });
  return { ...state, outcome: 'NEUTRAL' };
}

export function act(
  state: RaidState,
  action: RaidAction,
  opts: RaidOptions,
): { state: RaidState; events: RaidEvent[] } {
  if (!availableActions(state, opts).includes(action)) {
    throw new Error(`Bu aksiyon şu an yapılamaz: ${action}`);
  }
  const events: RaidEvent[] = [];
  let next: RaidState = { ...state };

  const target = ROOM_OF_GO[action];
  if (target) {
    // Karanlıkta yürümek ses çıkarır
    const ignored = next.warnedRoom === target;
    next = {
      ...next,
      room: target,
      noise: Math.min(3, next.noise + (next.light ? 0 : 1)),
      warningsIgnored: next.warningsIgnored + (ignored ? 1 : 0),
    };
    events.push({ kind: 'ENTERED', room: target });
    if (next.attacker.room === target) {
      return {
        state: checkLimit(
          encounter({ ...next, turn: next.turn + 1 }, opts, events),
          events,
        ),
        events,
      };
    }
    return { state: endTurn(next, opts, events), events };
  }

  switch (action) {
    case 'LISTEN': {
      const near =
        next.attacker.room === next.room ||
        adjacent(next.attacker.room, next.room);
      if (near) {
        events.push({ kind: 'HEARD', room: next.attacker.room });
        next = { ...next, known: next.attacker.room };
      } else {
        events.push({ kind: 'HEARD_NOTHING' });
      }
      break;
    }
    case 'CALL_OUT': {
      events.push({ kind: 'CALLED_OUT' });
      // Dinleyip doğru anda seslenmek: saldırgan bitişik odadaysa ve oyuncu hazırlıklıysa kaçar
      const ready = next.light || next.holding !== 'NONE';
      if (
        ready &&
        next.known === next.attacker.room &&
        adjacent(next.attacker.room, next.room)
      ) {
        events.push({ kind: 'FLED' });
        return {
          state: { ...next, turn: next.turn + 1, outcome: 'GOOD' },
          events,
        };
      }
      next = { ...next, noise: Math.min(3, next.noise + 2) };
      break;
    }
    case 'HIDE':
      events.push({ kind: 'HID' });
      return {
        state: { ...next, turn: next.turn + 1, outcome: 'NEUTRAL' },
        events,
      };
    case 'LIGHT_LAMP':
      events.push({ kind: 'LAMP_LIT' });
      next = { ...next, light: true, noise: Math.min(3, next.noise + 1) };
      break;
    case 'LOOK_WINDOW': {
      const seen = next.attacker.room === 'DOORSTEP';
      events.push({ kind: 'WINDOW', seen });
      if (seen) next = { ...next, known: 'DOORSTEP' };
      break;
    }
    case 'TAKE_KNIFE':
      events.push({ kind: 'KNIFE_TAKEN' });
      next = { ...next, holding: 'KNIFE', noise: Math.min(3, next.noise + 1) };
      break;
    case 'LOCK_BACKDOOR':
      events.push({ kind: 'BACKDOOR_LOCKED' });
      next = {
        ...next,
        backdoorLocked: true,
        noise: Math.min(3, next.noise + 1),
      };
      break;
    case 'LOOK_DARK': {
      const heard = adjacent(next.attacker.room, next.room);
      events.push({ kind: 'DARK', heard });
      if (heard) next = { ...next, known: next.attacker.room };
      break;
    }
    case 'DRAW_GUN':
      events.push({ kind: 'GUN_DRAWN' });
      next = { ...next, holding: 'GUN' };
      break;
  }
  return { state: endTurn(next, opts, events), events };
}
