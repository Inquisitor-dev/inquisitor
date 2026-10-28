import { foldTurkish } from './prompt-guard';

export function isExplicitWarrantRequest(
  userMessage: string,
  localizedLocationNames: string[],
): boolean {
  // Türkçe karakterler sadeleştirilir: "araştırabilir miyim" de "arastirabilir miyim" de tanınır
  const normalized = foldTurkish(userMessage)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const warrantPatterns = [
    /arama izni/,
    /izin verir misin/,
    /izin ver/,
    /izni ver/,
    /arama yapabilir miyim/,
    /arastirabilir miyim/,
    /inceleyebilir miyim/,
    /warrant/,
  ];

  const mentionsWarrantIntent = warrantPatterns.some((pattern) =>
    pattern.test(normalized),
  );
  const mentionsKnownLocation = localizedLocationNames.some((name) =>
    normalized.includes(foldTurkish(name)),
  );

  return (
    mentionsWarrantIntent ||
    (mentionsKnownLocation && normalized.includes('izin'))
  );
}

export function isWarrantIssuer(scenarioType: string, npcId: string): boolean {
  if (scenarioType === 'medieval' || scenarioType === 'china') {
    return npcId === 'church';
  }
  if (scenarioType === 'modern' || scenarioType === 'cyberpunk') {
    return npcId === 'tavern';
  }
  if (scenarioType === 'winter') {
    return npcId === 'graveyard' || npcId === 'church';
  }
  return false;
}

export const MAX_WARRANTS = 2;

export interface WarrantLocation {
  id: string;
  localizedName: string;
  // Mekânın sahibi (NPC id'leri mekân id'leriyle aynıdır): "Earl'ün dükkânı" da o mekânı ister
  ownerName?: string;
}

// Unvanlar isim sayılmaz: "Brother Aldric" için "brother" her kardeşle eşleşirdi
export const NAME_TITLES = new Set([
  'brother',
  'sister',
  'father',
  'mother',
  'kardes',
  'peder',
  'rahibe',
  'doctor',
  'doktor',
  'sheriff',
  'serif',
  'lady',
  'lord',
  'master',
  'usta',
  'ihtiyar',
  'degirmenci',
  'ciftci',
  'memur',
  'officer',
  'komutan',
  'commander',
  'kesis',
  'monk',
  'teyze',
  'auntie',
  'bilgin',
  'scholar',
  'kahin',
  'seer',
  'madenci',
  'miner',
  'muhafiz',
  'warden',
  'the',
]);

// Oyuncunun mesajında adı geçen mekânlar: mekânın adı ya da sahibinin adı (ilk adı yeterli)
export function findRequestedLocations(
  userMessage: string,
  locations: WarrantLocation[],
): string[] {
  const normalized = foldTurkish(userMessage);
  return locations
    .filter((location) => {
      if (normalized.includes(foldTurkish(location.localizedName))) return true;
      const owner = location.ownerName ? foldTurkish(location.ownerName) : '';
      return owner
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3 && !NAME_TITLES.has(word))
        .some((word) => new RegExp(`\\b${word}`).test(normalized));
    })
    .map((location) => location.id);
}

export type WarrantOutcome =
  | 'GRANTED'
  | 'NO_LOCATION'
  | 'LIMIT_REACHED'
  | 'ALREADY_HELD';

export interface WarrantDecision {
  outcome: WarrantOutcome;
  granted: string[];
  // İstenen ama zaten elde olan ya da kullanılmış izinler
  alreadyHeld: string[];
  remainingAfter: number;
}

// Arama iznini yapay zekâ değil kod verir: karakter sadece kararı kendi ağzından söyler.
// Böylece "izin verdim" deyip izni envantere düşürmeme durumu yaşanmaz.
export function decideWarrants(params: {
  userMessage: string;
  locations: WarrantLocation[];
  warrantsIssued: number;
  activeWarrants: string[];
  usedWarrants: string[];
  // Vakanın izin sınırı (Hevesli Kadı wildcard'ında 3; scenarios/wildcards.ts warrantLimitOf)
  limit?: number;
}): WarrantDecision | null {
  const {
    userMessage,
    locations,
    warrantsIssued,
    activeWarrants,
    usedWarrants,
  } = params;
  if (
    !isExplicitWarrantRequest(
      userMessage,
      locations.map((l) => l.localizedName),
    )
  ) {
    return null;
  }

  const remaining = Math.max(
    0,
    (params.limit ?? MAX_WARRANTS) - warrantsIssued,
  );
  const requested = findRequestedLocations(userMessage, locations);
  const alreadyHeld = requested.filter(
    (id) => activeWarrants.includes(id) || usedWarrants.includes(id),
  );
  const fresh = requested.filter((id) => !alreadyHeld.includes(id));

  if (requested.length === 0) {
    return {
      outcome: 'NO_LOCATION',
      granted: [],
      alreadyHeld: [],
      remainingAfter: remaining,
    };
  }
  if (fresh.length === 0) {
    return {
      outcome: 'ALREADY_HELD',
      granted: [],
      alreadyHeld,
      remainingAfter: remaining,
    };
  }
  if (remaining === 0) {
    return {
      outcome: 'LIMIT_REACHED',
      granted: [],
      alreadyHeld,
      remainingAfter: 0,
    };
  }
  const granted = fresh.slice(0, remaining);
  return {
    outcome: 'GRANTED',
    granted,
    alreadyHeld,
    remainingAfter: remaining - granted.length,
  };
}
