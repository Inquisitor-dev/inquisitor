export type ScenarioType = "medieval" | "modern" | "cyberpunk";
export type Difficulty = "easy" | "medium" | "hard";

export type InventoryState = {
  activeWarrants: string[];
  usedWarrants: string[];
};

export type SessionSnapshot = {
  id: string;
  currentDay?: number;
  day?: number;
  timeOfDay?: number;
  notes?: string | null;
  scenario?: string | null;
  difficulty?: Difficulty;
  scenarioType?: ScenarioType;
  dialoguesUsedToday?: number;
  activeWarrants?: string[];
  usedWarrants?: string[];
  truthReveal?: string | null;
  locationClues?: Record<string, string> | null;
};

export type NpcProfile = {
  id: string;
  name: string;
  icon: string;
  role: string;
};

export type LocationDefinition = {
  id: string;
  name: string;
  icon: string;
  description: string;
  actionLabel: string;
  minDifficulty?: Difficulty;
};

export type NpcMessage = {
  role: "player" | "npc";
  text: string;
  timestamp?: string;
};

export type AuthPayload = {
  token: string;
  email: string;
  userId: string;
  isAdmin?: boolean;
  isPremium?: boolean;
};
