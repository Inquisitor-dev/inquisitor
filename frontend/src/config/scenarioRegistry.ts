import { ScenarioType, SCENARIOS } from '@/shared/types/scenario';
import { SCENARIO_LOCATION_LABELS } from './locationLabels';

export interface ScenarioDefinition {
  id: ScenarioType;
  name: string;
  sub: string;
  era: string;
  description: string;
  mapBackgrounds: [morning: string, sunset: string, night: string];
  locationLabels: Record<string, string>;
  footsteps: string[];
}

export const SCENARIO_REGISTRY: Record<ScenarioType, ScenarioDefinition> = {
  medieval: {
    ...SCENARIOS.medieval,
    mapBackgrounds: [
      '/map/village_map_morning.webp',
      '/map/village_map_sunset.webp',
      '/map/village_map.webp',
    ],
    locationLabels: SCENARIO_LOCATION_LABELS.medieval,
    footsteps: [
      '/sounds/footsteps/Mud_Mono_01.wav',
      '/sounds/footsteps/Mud_Mono_02.wav',
      '/sounds/footsteps/Mud_Mono_03.wav',
      '/sounds/footsteps/Mud_Mono_04.wav',
      '/sounds/footsteps/Mud_Mono_05.wav',
    ],
  },
  modern: {
    ...SCENARIOS.modern,
    mapBackgrounds: [
      '/map/town_map_morning.webp',
      '/map/town_map_sunset.webp',
      '/map/town_map_night.webp',
    ],
    locationLabels: SCENARIO_LOCATION_LABELS.modern,
    footsteps: [
      '/sounds/footsteps/asfalt1.wav',
      '/sounds/footsteps/asfalt2.wav',
      '/sounds/footsteps/asfalt3.wav',
      '/sounds/footsteps/asfalt4.wav',
      '/sounds/footsteps/asfalt5.wav',
      '/sounds/footsteps/asfalt6.wav',
    ],
  },
  cyberpunk: {
    ...SCENARIOS.cyberpunk,
    mapBackgrounds: [
      '/map/cyberpunk_map_morning.webp',
      '/map/cyberpunk_map_sunset.webp',
      '/map/cyberpunk_map_night.webp',
    ],
    locationLabels: SCENARIO_LOCATION_LABELS.cyberpunk,
    footsteps: [
      '/sounds/footsteps/asfalt1.wav',
      '/sounds/footsteps/asfalt2.wav',
      '/sounds/footsteps/asfalt3.wav',
      '/sounds/footsteps/asfalt4.wav',
      '/sounds/footsteps/asfalt5.wav',
      '/sounds/footsteps/asfalt6.wav',
    ],
  },
  china: {
    ...SCENARIOS.china,
    mapBackgrounds: [
      '/map/china_morning.webp',
      '/map/china_sunset.webp',
      '/map/china_night.webp',
    ],
    locationLabels: SCENARIO_LOCATION_LABELS.china,
    footsteps: [
      '/sounds/footsteps/Tile_Mono_01.wav',
      '/sounds/footsteps/Tile_Mono_02.wav',
      '/sounds/footsteps/Tile_Mono_03.wav',
      '/sounds/footsteps/Tile_Mono_04.wav',
      '/sounds/footsteps/Tile_Mono_05.wav',
    ],
  },
  winter: {
    ...SCENARIOS.winter,
    mapBackgrounds: [
      '/map/winter_morning.webp',
      '/map/winter_sunset.webp',
      '/map/winter_night.webp',
    ],
    locationLabels: SCENARIO_LOCATION_LABELS.winter,
    footsteps: [
      '/sounds/footsteps/SnowSteps_01.wav',
      '/sounds/footsteps/SnowSteps_02.wav',
      '/sounds/footsteps/SnowSteps_03.wav',
      '/sounds/footsteps/SnowSteps_04.wav',
      '/sounds/footsteps/SnowSteps_05.wav',
    ],
  },
};

export function getScenarioDefinition(scenarioType?: string | null): ScenarioDefinition {
  const key = (scenarioType as ScenarioType) ?? 'medieval';
  return SCENARIO_REGISTRY[key] ?? SCENARIO_REGISTRY.medieval;
}
