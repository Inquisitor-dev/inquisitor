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

export interface ScenarioConfig {
  scenarioType: ScenarioType;
  settingLabel: string;
  worldDescription: string;
  styleInstruction: string;
  npcDefinitions: ScenarioNpcDefinition[];
  locationDefinitions: ScenarioLocationDefinition[];
}

export interface UniverseDefinition {
  scenarioType: ScenarioType;
  settingLabel: string;
  worldDescription: string;
  styleInstruction: string;
  npcs: ScenarioNpcDefinition[];
  locations: ScenarioLocationDefinition[];
  locationLabels: Record<string, string>;
}
