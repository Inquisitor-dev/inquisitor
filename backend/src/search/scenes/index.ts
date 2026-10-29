import type { SearchSceneDef } from '../search-scene';
import { MEDIEVAL_SEARCH_SCENES } from './medieval';
import { MEDIEVAL_CHURCH_SCENES } from './medieval-church';
import { MEDIEVAL_CLINIC_SCENES } from './medieval-clinic';
import { MEDIEVAL_FARM_SCENES } from './medieval-farm';
import { MEDIEVAL_GRAVEYARD_SCENES } from './medieval-graveyard';
import { MEDIEVAL_MILL_SCENES } from './medieval-mill';

// Evrenlerin arama sahneleri (her biri bir mekânın bir alanı). Sahnesi olmayan mekân eski yolla
// (anlatıcıyla) aranır.
export const SEARCH_SCENES: SearchSceneDef[] = [
  ...MEDIEVAL_SEARCH_SCENES,
  ...MEDIEVAL_CHURCH_SCENES,
  ...MEDIEVAL_MILL_SCENES,
  ...MEDIEVAL_GRAVEYARD_SCENES,
  ...MEDIEVAL_FARM_SCENES,
  ...MEDIEVAL_CLINIC_SCENES,
];

// Taslak sahneler yalnızca test modunda açılır
const usable = (scene: SearchSceneDef, testMode: boolean) =>
  scene.status === 'READY' || testMode;

export function findSearchScene(
  universe: string,
  locationId: string,
  areaId: string,
  testMode: boolean,
): SearchSceneDef | null {
  const scene = SEARCH_SCENES.find(
    (s) =>
      s.universe === universe &&
      s.locationId === locationId &&
      s.areaId === areaId,
  );
  return scene && usable(scene, testMode) ? scene : null;
}

// Mekânın aranabilir alanları; boşsa mekân anlatıcıyla aranır
export function searchAreas(
  universe: string,
  locationId: string,
  testMode: boolean,
): string[] {
  return SEARCH_SCENES.filter(
    (s) =>
      s.universe === universe &&
      s.locationId === locationId &&
      usable(s, testMode),
  ).map((s) => s.areaId);
}
