import type { ImageSourcePropType, TextStyle, ViewStyle } from "react-native";

import type { Difficulty, ScenarioType } from "@/types/game";

export const inquisitorColors = {
  bg: "#050505",
  bgSecondary: "#0d0d0d",
  bgCard: "#111111",
  bgCardSoft: "rgba(255,255,255,0.03)",
  primary: "#8A0303",
  primaryDark: "#5a0202",
  primaryGlow: "rgba(138, 3, 3, 0.35)",
  parchment: "#E8DCC4",
  muted: "#8a7f72",
  dim: "#4a4440",
  border: "rgba(232, 220, 196, 0.1)",
  borderRed: "rgba(138, 3, 3, 0.4)",
  overlay: "rgba(0,0,0,0.85)",
};

export const fonts = {
  title: "serif",
  body: undefined,
};

export const textStyles = {
  title: {
    color: inquisitorColors.parchment,
    fontFamily: fonts.title,
    fontWeight: "900",
  } satisfies TextStyle,
  eyebrow: {
    color: inquisitorColors.muted,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
  } satisfies TextStyle,
  buttonTitle: {
    color: inquisitorColors.parchment,
    fontFamily: fonts.title,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  } satisfies TextStyle,
};

export function getMapAsset(scenarioType: ScenarioType, timeOfDay: number): ImageSourcePropType {
  if (scenarioType === "modern") {
    if (timeOfDay <= 1) return require("../../assets/map/town_map_morning.png");
    if (timeOfDay <= 3) return require("../../assets/map/town_map_sunset.png");
    return require("../../assets/map/town_map_night.png");
  }

  if (scenarioType === "cyberpunk") {
    if (timeOfDay <= 1) return require("../../assets/map/cyberpunk_map_morning.png");
    if (timeOfDay <= 3) return require("../../assets/map/cyberpunk_map_sunset.png");
    return require("../../assets/map/cyberpunk_map_night.png");
  }

  if (timeOfDay <= 1) return require("../../assets/map/village_map_morning.png");
  if (timeOfDay <= 3) return require("../../assets/map/village_map_sunset.png");
  return require("../../assets/map/village_map.png");
}

export function getInteractAsset(locationId: string): ImageSourcePropType {
  if (locationId === "church") return require("../../assets/backgrounds/bg_church.jpg");
  if (locationId === "graveyard") return require("../../assets/backgrounds/bg_graveyard.png");
  if (locationId === "mill") return require("../../assets/backgrounds/bg_mill.jpg");
  if (locationId === "tavern") return require("../../assets/backgrounds/bg_tavern.jpg");
  return require("../../assets/backgrounds/bg_crime_scene.jpg");
}

type MapHotspot = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

const medievalHotspots: MapHotspot[] = [
  { id: "church", top: 15, left: 8, width: 28, height: 45 },
  { id: "mill", top: 35, left: 68, width: 18, height: 35 },
  { id: "tavern", top: 36, left: 42, width: 16, height: 25 },
  { id: "graveyard", top: 10, left: 70, width: 25, height: 30 },
  { id: "farm", top: 65, left: 5, width: 22, height: 30 },
  { id: "clinic", top: 65, left: 72, width: 20, height: 28 },
];

const modernHotspots: MapHotspot[] = [
  { id: "tavern", top: 8, left: 8, width: 28, height: 45 },
  { id: "graveyard", top: 25, left: 42, width: 20, height: 32 },
  { id: "church", top: 3, left: 80, width: 18, height: 30 },
  { id: "farm", top: 48, left: 25, width: 20, height: 28 },
  { id: "clinic", top: 30, left: 71, width: 9, height: 20 },
  { id: "mill", top: 55, left: 55, width: 38, height: 32 },
];

const cyberpunkHotspots: MapHotspot[] = [
  { id: "tavern", top: 20, left: 2, width: 27, height: 48 },
  { id: "church", top: 40, left: 45, width: 12, height: 18 },
  { id: "graveyard", top: 38, left: 73, width: 25, height: 44 },
  { id: "mill", top: 28, left: 60, width: 14, height: 21 },
  { id: "farm", top: 29, left: 73, width: 16, height: 16 },
  { id: "clinic", top: 39, left: 36, width: 9, height: 14 },
];

const difficultyOrder: Difficulty[] = ["easy", "medium", "hard"];

export function getMapHotspots(scenarioType: ScenarioType, difficulty: Difficulty) {
  const base =
    scenarioType === "modern"
      ? modernHotspots
      : scenarioType === "cyberpunk"
        ? cyberpunkHotspots
        : medievalHotspots;

  const currentIdx = difficultyOrder.indexOf(difficulty);
  return base.filter((spot) => {
    if (spot.id === "farm") return currentIdx >= 1;
    if (spot.id === "clinic") return currentIdx >= 2;
    return true;
  });
}

export function getScenarioPlaceTitle(scenarioType: ScenarioType) {
  if (scenarioType === "modern") return "Millfield Kasabasi";
  if (scenarioType === "cyberpunk") return "Neon Prime";
  return "Ashenmoor Koyu";
}

export function getVignetteStyle(isNight?: boolean): ViewStyle {
  return {
    backgroundColor: isNight ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.28)",
  };
}
