export type ScenarioType = 'medieval' | 'modern' | 'cyberpunk' | 'china' | 'winter';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ScenarioNpcDefinition {
  id: string;
  name: string;
  role: string;
  personaPrompt: string;
}

export interface ScenarioLocationDefinition {
  id: string;
  name: string;
  description: string;
}

// Cinayetin işlendiği yer: haritada görünmez, "Olay Yeri" düğmesiyle açılır
export interface CrimeSceneDefinition {
  id: string;
  // Oyuncuya gösterilen Türkçe ad
  label: string;
  // Yapay zekâya verilen İngilizce tarif
  description: string;
}

export interface ScenarioConfig {
  scenarioType: ScenarioType;
  settingLabel: string;
  worldDescription: string;
  styleInstruction: string;
  npcDefinitions: ScenarioNpcDefinition[];
  locationDefinitions: ScenarioLocationDefinition[];
  crimeScenes: CrimeSceneDefinition[];
  // Cesedin üzerindeki örtü (görsellerle aynı); yapay zekâ cesedi buna göre anlatır
  crimeSceneBody: string;
  // Bu vakanın olay yeri; vaka planlanmadan önce ve eski vakalarda yok
  crimeScene?: CrimeSceneDefinition;
}

export interface UniverseDefinition {
  scenarioType: ScenarioType;
  settingLabel: string;
  worldDescription: string;
  styleInstruction: string;
  npcs: ScenarioNpcDefinition[];
  locations: ScenarioLocationDefinition[];
  crimeScenes: CrimeSceneDefinition[];
  crimeSceneBody: string;
  locationLabels: Record<string, string>;
}
