import {
  type Difficulty,
  type ScenarioConfig,
  type ScenarioType,
  UNIVERSE_REGISTRY,
} from './universes';

export * from './universes';

export function getScenarioConfig(
  scenarioType: string = 'medieval',
  difficulty: string = 'easy',
): ScenarioConfig {
  const normalizedScenario = normalizeScenarioType(scenarioType);
  const normalizedDifficulty = normalizeDifficulty(difficulty);

  const universe = UNIVERSE_REGISTRY[normalizedScenario];

  const npcCount = normalizedDifficulty === 'easy' ? 4 : normalizedDifficulty === 'medium' ? 5 : 6;
  const npcDefinitions = universe.npcs.slice(0, npcCount);
  const locationDefinitions = universe.locations.filter(
    (location) => location.id === 'crime_scene' || npcDefinitions.some((npc) => npc.id === location.id),
  );

  return {
    scenarioType: normalizedScenario,
    settingLabel: universe.settingLabel,
    worldDescription: universe.worldDescription,
    styleInstruction: universe.styleInstruction,
    npcDefinitions,
    locationDefinitions,
  };
}

export function getLocalizedLocationLabel(
  scenarioType: string,
  locationId: string,
): string {
  const normalizedScenario = normalizeScenarioType(scenarioType);
  const universe = UNIVERSE_REGISTRY[normalizedScenario];
  return universe.locationLabels[locationId] ?? locationId;
}

export function normalizeScenarioType(scenarioType: string): ScenarioType {
  if (scenarioType === 'modern' || scenarioType === 'cyberpunk' || scenarioType === 'china' || scenarioType === 'winter') return scenarioType;
  return 'medieval';
}

export function normalizeDifficulty(difficulty: string): Difficulty {
  if (difficulty === 'medium' || difficulty === 'hard') return difficulty;
  return 'easy';
}
