// Oyuncu karakterlerinin yetenekleri. Tanımlar ve kullanım kuralları saf koddur; etkileri
// AbilitiesService uygular. Yetenek metinleri istemcide (frontend config/outfitStories.ts) durur.

export type AbilityId =
  | 'patience'
  | 'archive_summary'
  | 'backstage'
  | 'contradiction_scan'
  | 'informant'
  | 'quiet_room'
  | 'threat'
  | 'tracking'
  | 'data_leak'
  | 'pulse'
  | 'visor_lock'
  | 'rooftop'
  | 'second_breath'
  | 'deep_reflection'
  | 'dream_reading'
  | 'keen_eye'
  | 'verify_quote';

// DAILY: oyun gününde bir kez, CASE: vakada bir kez, PASSIVE: kendiliğinden çalışır
export type AbilityLimit = 'DAILY' | 'CASE' | 'PASSIVE';
// Yeteneğin hedefi: bir şüpheli, bir mekân, panodaki bir ip ya da hiçbiri
export type AbilityTarget = 'npc' | 'location' | 'string' | 'none';

export interface AbilityDef {
  id: AbilityId;
  characterId: string;
  name: string;
  limit: AbilityLimit;
  target: AbilityTarget;
}

export const DEFAULT_CHARACTER_ID = 'engizitor';

// Gardıroptaki 16 karakter; id'ler frontend config/outfits.ts ve market-catalog.ts ile aynı
export const CHARACTER_IDS = [
  'engizitor',
  'engizitor_hanim',
  'sokak_kurdu',
  'sis_dedektifi',
  'sehir_dedektifi',
  'golge_ajan',
  'kara_yargic',
  'kul_avcisi',
  'kizil_devre',
  'mavi_rozet',
  'neon_kuzgun',
  'yesim_hekim',
  'ak_turna',
  'kar_kahini',
  'ayaz_izcisi',
  'gece_muhabiri',
] as const;

export const ABILITIES: AbilityDef[] = [
  {
    id: 'patience',
    characterId: 'engizitor',
    name: 'Sabır',
    limit: 'PASSIVE',
    target: 'none',
  },
  {
    id: 'archive_summary',
    characterId: 'engizitor_hanim',
    name: 'Arşiv Özeti',
    limit: 'DAILY',
    target: 'npc',
  },
  {
    id: 'backstage',
    characterId: 'sokak_kurdu',
    name: 'Kulis',
    limit: 'DAILY',
    target: 'location',
  },
  {
    id: 'contradiction_scan',
    characterId: 'sis_dedektifi',
    name: 'Çelişki Taraması',
    limit: 'DAILY',
    target: 'npc',
  },
  {
    id: 'informant',
    characterId: 'sehir_dedektifi',
    name: 'Muhbir',
    limit: 'DAILY',
    target: 'none',
  },
  {
    id: 'quiet_room',
    characterId: 'golge_ajan',
    name: 'Sessiz Oda',
    limit: 'DAILY',
    target: 'npc',
  },
  {
    id: 'threat',
    characterId: 'kara_yargic',
    name: 'Tehdit',
    limit: 'DAILY',
    target: 'npc',
  },
  {
    id: 'tracking',
    characterId: 'kul_avcisi',
    name: 'İz Sürme',
    limit: 'DAILY',
    target: 'location',
  },
  {
    id: 'data_leak',
    characterId: 'kizil_devre',
    name: 'Veri Sızdırma',
    limit: 'CASE',
    target: 'string',
  },
  {
    id: 'pulse',
    characterId: 'mavi_rozet',
    name: 'Nabız',
    limit: 'DAILY',
    target: 'none',
  },
  {
    id: 'visor_lock',
    characterId: 'mavi_rozet',
    name: 'Vizör Kilidi',
    limit: 'CASE',
    target: 'npc',
  },
  {
    id: 'rooftop',
    characterId: 'neon_kuzgun',
    name: 'Çatı Geçişi',
    limit: 'DAILY',
    target: 'location',
  },
  // Hüküm anında kendiliğinden devreye girer (vakada bir kez); düğmesi yok
  {
    id: 'second_breath',
    characterId: 'yesim_hekim',
    name: 'İkinci Nefes',
    limit: 'PASSIVE',
    target: 'none',
  },
  {
    id: 'deep_reflection',
    characterId: 'ak_turna',
    name: 'Derin Tefekkür',
    limit: 'PASSIVE',
    target: 'none',
  },
  {
    id: 'dream_reading',
    characterId: 'kar_kahini',
    name: 'Rüya Tabiri',
    limit: 'DAILY',
    target: 'none',
  },
  {
    id: 'keen_eye',
    characterId: 'ayaz_izcisi',
    name: 'Keskin Göz',
    limit: 'DAILY',
    target: 'location',
  },
  {
    id: 'verify_quote',
    characterId: 'gece_muhabiri',
    name: 'Teyit',
    limit: 'DAILY',
    target: 'npc',
  },
];

// Tanımı yapılmış ama etkisi henüz yazılmamış yetenekler: kullanılamaz, kendiliğinden de çalışmaz
export const PENDING_ABILITIES: ReadonlySet<AbilityId> = new Set<AbilityId>([
  'second_breath',
  'deep_reflection',
  'dream_reading',
  'keen_eye',
  'verify_quote',
]);

// Günün son dilimi (gece) ve vakanın son günü
export const NIGHT = 4;
export const LAST_DAY = 4;

// Oturumda saklanan yetenek durumu (GameSession.abilityState)
export interface AbilityState {
  // Yetenek id'si -> kullanıldığı günler
  uses: Partial<Record<AbilityId, number[]>>;
  // Sessiz Oda: o gün daha doğrudan konuşan şüpheli
  quietRoom?: { npcId: string; day: number };
  // Vizör Kilidi: korkusu gece azalmayan şüpheli
  visorLockNpcId?: string;
  // Çatı Geçişi: gece girilen mekân
  rooftop?: { locationId: string; day: number };
  // Çatı Geçişi'nin bedeli: bu günün sabahı kaybedilir
  lostMorningDay?: number;
}

export const findAbility = (id: string): AbilityDef | undefined =>
  ABILITIES.find((ability) => ability.id === id);

export const abilitiesFor = (characterId: string): AbilityDef[] =>
  ABILITIES.filter((ability) => ability.characterId === characterId);

export const isCharacterId = (id: unknown): id is string =>
  typeof id === 'string' && (CHARACTER_IDS as readonly string[]).includes(id);

const isDayList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((day) => Number.isInteger(day));

// Veritabanındaki JSON'u güvenle okur; bozuk alanlar yok sayılır
export function parseAbilityState(value: unknown): AbilityState {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<
    string,
    unknown
  >;
  const rawUses = (
    raw.uses && typeof raw.uses === 'object' ? raw.uses : {}
  ) as Record<string, unknown>;
  const uses: AbilityState['uses'] = {};
  for (const ability of ABILITIES) {
    const days = rawUses[ability.id];
    if (isDayList(days)) uses[ability.id] = days;
  }

  const state: AbilityState = { uses };
  const quietRoom = raw.quietRoom as AbilityState['quietRoom'];
  if (typeof quietRoom?.npcId === 'string' && Number.isInteger(quietRoom.day)) {
    state.quietRoom = { npcId: quietRoom.npcId, day: quietRoom.day };
  }
  if (typeof raw.visorLockNpcId === 'string')
    state.visorLockNpcId = raw.visorLockNpcId;
  const rooftop = raw.rooftop as AbilityState['rooftop'];
  if (
    typeof rooftop?.locationId === 'string' &&
    Number.isInteger(rooftop.day)
  ) {
    state.rooftop = { locationId: rooftop.locationId, day: rooftop.day };
  }
  if (Number.isInteger(raw.lostMorningDay))
    state.lostMorningDay = raw.lostMorningDay as number;
  return state;
}

export function recordUse(
  state: AbilityState,
  id: AbilityId,
  day: number,
): AbilityState {
  return {
    ...state,
    uses: { ...state.uses, [id]: [...(state.uses[id] ?? []), day] },
  };
}

export interface AbilitySession {
  status: string;
  characterId: string;
  currentDay: number;
  timeOfDay: number;
  boardThoughtDay: number;
  abilityState: unknown;
}

export type Availability =
  | { available: true }
  | { available: false; reason: string };

// Yeteneğin şu an kullanılıp kullanılamayacağı (hedefe bağlı kontroller servistedir)
export function availability(
  session: AbilitySession,
  ability: AbilityDef,
): Availability {
  const no = (reason: string): Availability => ({ available: false, reason });
  if (session.status !== 'ACTIVE') return no('Bu soruşturma sona erdi.');
  if (session.characterId !== ability.characterId)
    return no('Bu yetenek bu vakadaki karakterine ait değil.');
  if (PENDING_ABILITIES.has(ability.id))
    return no('Bu yetenek yakında aktif olacak.');
  if (ability.limit === 'PASSIVE')
    return no('Bu yetenek kendiliğinden çalışır.');

  const used = parseAbilityState(session.abilityState).uses[ability.id] ?? [];
  if (ability.limit === 'DAILY' && used.includes(session.currentDay)) {
    return no('Bu yeteneği bugün zaten kullandın.');
  }
  if (ability.limit === 'CASE' && used.length > 0)
    return no('Bu yeteneği bu vakada zaten kullandın.');

  const isNight = session.timeOfDay >= NIGHT;
  if (ability.id === 'backstage' && isNight) return no('Gece kullanılamaz.');
  if (ability.id === 'rooftop') {
    if (!isNight) return no('Yalnızca gece kullanılabilir.');
    if (session.currentDay >= LAST_DAY)
      return no('Son gece kullanılamaz; o gece hükmünü verirsin.');
  }
  if (
    ability.id === 'data_leak' &&
    session.boardThoughtDay === session.currentDay
  ) {
    return no('Bugün panoda zaten düşündün.');
  }
  return { available: true };
}
