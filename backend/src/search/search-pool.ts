// Arama sahnesi havuzu: hikâye havuzu gibi, vaka açılırken oyuncunun oynamadığı sahneler seçilir. Her mekânın
// alanı vaka planından gelir (kanıt orada yazılıdır), sahne o alanın varyantlarından çekilir.
// Seçim yalnızca mekâna, alana ve oyuncunun geçmişine bakar: katilin mekânı ötekilerden farklı seçilemez.
import { seededRng } from './search-game';
import { areaScenes } from './scenes';
import { sceneIdOf, type SearchSceneDef } from './search-scene';

// sahne id → son oynanma zamanı (ms)
export type ScenePlays = Map<string, number>;

// Oynanmamışlardan rastgele biri; hepsi oynandıysa en eski oynanan (arama hiçbir zaman kapanmaz)
export function chooseScene(
  candidates: SearchSceneDef[],
  plays: ScenePlays,
  rng: () => number,
): SearchSceneDef | null {
  if (candidates.length === 0) return null;
  const fresh = candidates.filter((s) => !plays.has(sceneIdOf(s)));
  if (fresh.length > 0) return fresh[Math.floor(rng() * fresh.length)];
  return candidates.reduce((oldest, s) =>
    plays.get(sceneIdOf(s))! < plays.get(sceneIdOf(oldest))! ? s : oldest,
  );
}

// Vakanın her mekânına sahne atar: { mekân: sahne id }. Sahnesi olmayan mekân listeye girmez.
export function assignScenes(params: {
  universe: string;
  searchAreas: Record<string, string> | undefined;
  testMode: boolean;
  plays: ScenePlays;
  seed: string;
}): Record<string, string> {
  const assigned: Record<string, string> = {};
  for (const [locationId, areaId] of Object.entries(params.searchAreas ?? {})) {
    const scene = chooseScene(
      areaScenes(params.universe, locationId, areaId, params.testMode),
      params.plays,
      seededRng(`${params.seed}:${locationId}:scene`),
    );
    if (scene) assigned[locationId] = sceneIdOf(scene);
  }
  return assigned;
}

// Oturumun bir alandaki sahnesi: atanmış olan; atama yoksa (eski vakalar, başka alana düşen kanıt) ya da o
// sahne artık kullanılamıyorsa oturuma tohumlanmış bir varyant. Aynı oturumda hep aynısı gelir.
export function sessionScene(params: {
  universe: string;
  locationId: string;
  areaId: string;
  testMode: boolean;
  assigned: unknown;
  sessionId: string;
}): SearchSceneDef | null {
  const { universe, locationId, areaId, testMode, sessionId } = params;
  const candidates = areaScenes(universe, locationId, areaId, testMode);
  if (candidates.length === 0) return null;
  const assignedId = (params.assigned as Record<string, string> | null)?.[
    locationId
  ];
  const assigned = candidates.find((s) => sceneIdOf(s) === assignedId);
  if (assigned) return assigned;
  const rng = seededRng(`${sessionId}:${locationId}:scene`);
  return candidates[Math.floor(rng() * candidates.length)];
}
