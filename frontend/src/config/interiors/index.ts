export * from './types';
export * from './medieval';
export * from './cyberpunk';
export * from './china';
export * from './winter';
export * from './modern';

import type { LocationInteriorData } from './types';
import { MEDIEVAL_INTERIORS } from './medieval';
import { CYBERPUNK_INTERIORS } from './cyberpunk';
import { CHINA_INTERIORS } from './china';
import { WINTER_INTERIORS } from './winter';
import { MODERN_INTERIORS } from './modern';

// İç mekânı hazırlanmış evrenler. Listede olmayan evrende iç mekân sayfası "henüz hazır değil" der.
export const INTERIORS_BY_SCENARIO: Record<string, Record<string, LocationInteriorData>> = {
  medieval: MEDIEVAL_INTERIORS,
  cyberpunk: CYBERPUNK_INTERIORS,
  china: CHINA_INTERIORS,
  winter: WINTER_INTERIORS,
  modern: MODERN_INTERIORS,
};

export function getInterior(scenarioType: string, locationId: string): LocationInteriorData | null {
  return INTERIORS_BY_SCENARIO[scenarioType]?.[locationId] ?? null;
}

export function getScenarioInteriors(scenarioType: string): LocationInteriorData[] {
  return Object.values(INTERIORS_BY_SCENARIO[scenarioType] ?? {});
}
