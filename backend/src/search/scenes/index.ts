import type { SearchSceneDef } from '../search-scene';
import { MEDIEVAL_SEARCH_SCENES } from './medieval';

// Evrenlerin arama sahneleri. Sahnesi olmayan mekân eski yolla (anlatıcıyla) aranır.
export const SEARCH_SCENES: SearchSceneDef[] = [...MEDIEVAL_SEARCH_SCENES];

// Taslak sahneler yalnızca test modunda açılır
export function findSearchScene(
  universe: string,
  locationId: string,
  testMode: boolean,
): SearchSceneDef | null {
  const scene = SEARCH_SCENES.find(
    (s) => s.universe === universe && s.locationId === locationId,
  );
  if (!scene) return null;
  return scene.status === 'READY' || testMode ? scene : null;
}
