import { ScenarioType } from '@/shared/types/scenario';
import type { MapLocation } from './types';
import { medievalLocations } from './medieval';
import { modernLocations } from './modern';
import { cyberpunkLocations } from './cyberpunk';
import { chinaLocations } from './china';
import { winterLocations } from './winter';

export * from './types';
export * from './medieval';
export * from './modern';
export * from './cyberpunk';
export * from './china';
export * from './winter';

export const MAP_LOCATIONS_BY_SCENARIO: Record<ScenarioType, MapLocation[]> = {
  medieval: medievalLocations,
  modern: modernLocations,
  cyberpunk: cyberpunkLocations,
  china: chinaLocations,
  winter: winterLocations,
};

export function getScenarioMapLocations(scenarioType?: string | null): MapLocation[] {
  const key = (scenarioType as ScenarioType) ?? 'medieval';
  return MAP_LOCATIONS_BY_SCENARIO[key] ?? medievalLocations;
}
