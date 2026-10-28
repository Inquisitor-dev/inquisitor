// Arama izni veren karakterler (NPC id'leri). İstemciye GET /game-sessions/:id/warrants ile gider;
// izin verilmeyen karakterlerin istemi de oyuncuyu bunlara yönlendirir.
const WARRANT_ISSUERS: Record<string, string[]> = {
  medieval: ['church'],
  china: ['church'],
  modern: ['tavern'],
  cyberpunk: ['tavern'],
  winter: ['graveyard', 'church'],
};

export function warrantIssuersOf(scenarioType: string): string[] {
  return WARRANT_ISSUERS[scenarioType] ?? [];
}

export function isWarrantIssuer(scenarioType: string, npcId: string): boolean {
  return warrantIssuersOf(scenarioType).includes(npcId);
}

export const MAX_WARRANTS = 2;

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

export type WarrantOutcome = 'GRANTED' | 'LIMIT_REACHED' | 'ALREADY_HELD';

export interface WarrantDecision {
  outcome: WarrantOutcome;
  granted: string[];
  // İstenen ama zaten elde olan ya da kullanılmış izinler
  alreadyHeld: string[];
  remainingAfter: number;
}

// Arama iznini yapay zekâ değil kod verir: karakter sadece kararı kendi ağzından söyler.
// Oyuncu mekânı yazarak değil, izin verenin ekranındaki "Arama İzni İste" penceresinden seçer;
// yazıyla istek eskiden "Madeni", "maden ocağını" gibi biçimlerde tanınmıyor ve model kendi kafasından
// reddediyordu (docs/tasarim-gerekceleri.md).
export function decideWarrants(params: {
  // Seçilen mekân; yoksa bu tur izin istenmemiştir
  requestedLocationId?: string | null;
  warrantsIssued: number;
  activeWarrants: string[];
  usedWarrants: string[];
  // Vakanın izin sınırı (Hevesli Kadı wildcard'ında 3; scenarios/wildcards.ts warrantLimitOf)
  limit?: number;
}): WarrantDecision | null {
  const { requestedLocationId, warrantsIssued, activeWarrants, usedWarrants } =
    params;
  if (!requestedLocationId) return null;

  const remaining = Math.max(
    0,
    (params.limit ?? MAX_WARRANTS) - warrantsIssued,
  );
  if (
    activeWarrants.includes(requestedLocationId) ||
    usedWarrants.includes(requestedLocationId)
  ) {
    return {
      outcome: 'ALREADY_HELD',
      granted: [],
      alreadyHeld: [requestedLocationId],
      remainingAfter: remaining,
    };
  }
  if (remaining === 0) {
    return {
      outcome: 'LIMIT_REACHED',
      granted: [],
      alreadyHeld: [],
      remainingAfter: 0,
    };
  }
  return {
    outcome: 'GRANTED',
    granted: [requestedLocationId],
    alreadyHeld: [],
    remainingAfter: remaining - 1,
  };
}
