import {
  type Difficulty,
  type ScenarioConfig,
  type ScenarioType,
  UNIVERSE_REGISTRY,
} from './universes';

export * from './universes';

export const NPC_COUNT: Record<string, number> = { easy: 5, medium: 6, hard: 6 };

export function getScenarioConfig(
  scenarioType: string = 'medieval',
  difficulty: string = 'easy',
  // Vakanın olay yeri (caseFacts.crimeSceneId); verilince 'crime_scene' mekânı o yer olarak anlatılır
  crimeSceneId?: string | null,
): ScenarioConfig {
  const normalizedScenario = normalizeScenarioType(scenarioType);
  const normalizedDifficulty = normalizeDifficulty(difficulty);

  const universe = UNIVERSE_REGISTRY[normalizedScenario];

  // Kolay 5, orta ve zor 6 şüpheli. 4 kişilik mod kalktı: cinayete bağlı sırlara yer kalmıyor, tahmin
  // şansı yüksekti. Zoru ortadan kişi sayısı değil vaka ayarları ayırır (case-setup.ts)
  const npcCount = NPC_COUNT[normalizedDifficulty] ?? NPC_COUNT.easy;
  const npcDefinitions = universe.npcs.slice(0, npcCount);
  const crimeScene = universe.crimeScenes.find(
    (scene) => scene.id === crimeSceneId,
  );
  const locationDefinitions = universe.locations
    .filter(
      (location) =>
        location.id === 'crime_scene' ||
        npcDefinitions.some((npc) => npc.id === location.id),
    )
    .map((location) =>
      location.id === 'crime_scene' && crimeScene
        ? {
            ...location,
            name: crimeScene.label,
            description: `The murder site: ${crimeScene.label}, ${crimeScene.description}. The body lies on the ground, covered with ${universe.crimeSceneBody}.`,
          }
        : location,
    );

  return {
    scenarioType: normalizedScenario,
    settingLabel: universe.settingLabel,
    worldDescription: universe.worldDescription,
    styleInstruction: universe.styleInstruction,
    npcDefinitions,
    locationDefinitions,
    crimeScenes: universe.crimeScenes,
    crimeSceneBody: universe.crimeSceneBody,
    crimeScene,
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
