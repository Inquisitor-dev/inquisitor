import type {
  Difficulty,
  LocationDefinition,
  NpcProfile,
  ScenarioType,
} from "@/types/game";

export const timeLabels = ["Sabah", "Oglen", "Ikindi", "Aksam", "Gece"] as const;

const medievalLocations: LocationDefinition[] = [
  {
    id: "church",
    name: "Kilise",
    icon: "✝",
    description: "Rituel izleri ve suskun bir ruhban sınıfı seni bekliyor.",
    actionLabel: "Kiliseye git",
  },
  {
    id: "mill",
    name: "Degirmen",
    icon: "⚙",
    description: "Gurultulu mekaniklerin arasinda saklanan detaylari ara.",
    actionLabel: "Degirmene git",
  },
  {
    id: "tavern",
    name: "Taverna",
    icon: "🍺",
    description: "Sarhos diller genelde fazla sey soyler.",
    actionLabel: "Tavernaya git",
  },
  {
    id: "graveyard",
    name: "Mezarlik",
    icon: "🪦",
    description: "Eski mezarlar ve yeni sirlar yan yana duruyor.",
    actionLabel: "Mezarliga git",
  },
  {
    id: "farm",
    name: "Ciftlik",
    icon: "🌾",
    description: "Zor durumda acilan kapilar bazen gercekleri de aciga cikarir.",
    actionLabel: "Ciftlige git",
    minDifficulty: "medium",
  },
  {
    id: "clinic",
    name: "Klinik",
    icon: "🏥",
    description: "Yaralarin hikayesi, taniklarinkinden daha tutarlidir.",
    actionLabel: "Klinige git",
    minDifficulty: "hard",
  },
];

const modernLocations: LocationDefinition[] = [
  {
    id: "tavern",
    name: "Karakol",
    icon: "🚔",
    description: "Resmi kayitlar ile gayriresmi supheler burada carpisiyor.",
    actionLabel: "Karakola git",
  },
  {
    id: "graveyard",
    name: "Kaset Dukkani",
    icon: "📼",
    description: "Gecmise ait kasetlerde bugunun kirik izleri sakli olabilir.",
    actionLabel: "Kaset dukkanina git",
  },
  {
    id: "church",
    name: "Kilise",
    icon: "✝",
    description: "Kasabanin en sessiz mekani genelde en fazla sir saklar.",
    actionLabel: "Kiliseye git",
  },
  {
    id: "farm",
    name: "Benzinlik",
    icon: "⛽",
    description: "Yoldan gecen herkes bir sey gormus olabilir.",
    actionLabel: "Benzinlige git",
    minDifficulty: "medium",
  },
  {
    id: "clinic",
    name: "Prefabrik Evler",
    icon: "🏠",
    description: "Dar duvarlar ardinda basik sesler ve saklanan gerilim var.",
    actionLabel: "Prefabrik evlere git",
    minDifficulty: "hard",
  },
  {
    id: "mill",
    name: "Acik Hava Sinemasi",
    icon: "🎬",
    description: "Bos ekranlar bazen taniklardan daha acik konusur.",
    actionLabel: "Acik hava sinemasina git",
  },
];

const cyberpunkLocations: LocationDefinition[] = [
  {
    id: "tavern",
    name: "Polis Karakolu",
    icon: "👮",
    description: "Veri loglari ve insan ifadeleri ayni seyi soylemeyebilir.",
    actionLabel: "Polis karakoluna git",
  },
  {
    id: "church",
    name: "Lokanta",
    icon: "🍜",
    description: "Kalabalik arasinda gizlenmek kolay, iz birakmamak zor.",
    actionLabel: "Lokantaya git",
  },
  {
    id: "graveyard",
    name: "Hurdalik",
    icon: "🛠",
    description: "Atik parcalar arasinda kullanisli bir gercek sakli olabilir.",
    actionLabel: "Hurdaliga git",
  },
  {
    id: "mill",
    name: "Robot Dukkani",
    icon: "🤖",
    description: "Programlanmis davranis bile bazen panikle titrer.",
    actionLabel: "Robot dukkanina git",
  },
  {
    id: "farm",
    name: "Kopru Alti",
    icon: "🧥",
    description: "Sehirin gormek istemedigi insanlar genelde en cok seyi bilir.",
    actionLabel: "Kopru altina git",
    minDifficulty: "medium",
  },
  {
    id: "clinic",
    name: "Bar",
    icon: "🍸",
    description: "Neon altinda yuzler degisir ama celiskiler kalir.",
    actionLabel: "Bara git",
    minDifficulty: "hard",
  },
];

const medievalNpcs: NpcProfile[] = [
  { id: "tavern", name: "Kardes Aldric", icon: "🍺", role: "Hanci" },
  { id: "church", name: "Peder Malachar", icon: "✝", role: "Rahip" },
  { id: "mill", name: "Degirmenci Giles", icon: "⚙", role: "Degirmenci" },
  { id: "graveyard", name: "Ihtiyar Silas", icon: "🪦", role: "Mezarci" },
  { id: "farm", name: "Ciftci Edmund", icon: "🌾", role: "Ciftci" },
  { id: "clinic", name: "Doktor Harland", icon: "🏥", role: "Doktor" },
];

const modernNpcs: NpcProfile[] = [
  { id: "tavern", name: "Serif Dale Cooper", icon: "🚔", role: "Polis Amiri" },
  { id: "church", name: "Papaz Gerald", icon: "✝", role: "Papaz" },
  { id: "mill", name: "Donna", icon: "🎬", role: "Gise Gorevlisi" },
  { id: "graveyard", name: "Randy", icon: "📼", role: "Video Kasetci" },
  { id: "farm", name: "Earl", icon: "⛽", role: "Pompaci" },
  { id: "clinic", name: "Old Marge", icon: "🏠", role: "Kasabali" },
];

const cyberpunkNpcs: NpcProfile[] = [
  { id: "tavern", name: "Officer Kael Voss", icon: "👮", role: "Memur" },
  { id: "church", name: "Mirel Sato", icon: "🍜", role: "Lokanta Sahibi" },
  { id: "mill", name: "AURA-9", icon: "🤖", role: "Satici Android" },
  { id: "graveyard", name: "Brakk Coil", icon: "🛠", role: "Hurdaci" },
  { id: "farm", name: "Ash", icon: "🧥", role: "Gezgin" },
  { id: "clinic", name: "Vera Nyx", icon: "🍸", role: "Barmen" },
];

const difficultyOrder: Difficulty[] = ["easy", "medium", "hard"];

export function getVisibleLocations(
  scenarioType: ScenarioType,
  difficulty: Difficulty,
) {
  const list =
    scenarioType === "modern"
      ? modernLocations
      : scenarioType === "cyberpunk"
        ? cyberpunkLocations
        : medievalLocations;

  const currentIndex = difficultyOrder.indexOf(difficulty);
  return list.filter((location) => {
    if (!location.minDifficulty) {
      return true;
    }

    return difficultyOrder.indexOf(location.minDifficulty) <= currentIndex;
  });
}

export function getScenarioTitle(scenarioType: ScenarioType) {
  if (scenarioType === "modern") {
    return "Millfield Kasabasi";
  }

  if (scenarioType === "cyberpunk") {
    return "Neon Prime";
  }

  return "Ashenmoor Koyu";
}

export function getScenarioNpcs(
  scenarioType: ScenarioType,
  difficulty: Difficulty,
) {
  const list =
    scenarioType === "modern"
      ? modernNpcs
      : scenarioType === "cyberpunk"
        ? cyberpunkNpcs
        : medievalNpcs;

  const currentIndex = difficultyOrder.indexOf(difficulty);

  return list.filter((npc) => {
    if (npc.id === "farm") {
      return currentIndex >= 1;
    }

    if (npc.id === "clinic") {
      return currentIndex >= 2;
    }

    return true;
  });
}

export function getNpcProfile(scenarioType: ScenarioType, npcId: string) {
  const all =
    scenarioType === "modern"
      ? [
          ...modernNpcs,
          { id: "crime_scene", name: "Olay Yeri", icon: "🩸", role: "Sessiz Taniklar" },
        ]
      : scenarioType === "cyberpunk"
        ? [
            ...cyberpunkNpcs,
            { id: "crime_scene", name: "Olay Yeri", icon: "🩸", role: "Sessiz Taniklar" },
          ]
        : [
            ...medievalNpcs,
            { id: "crime_scene", name: "Cinayet Mahalli", icon: "🩸", role: "Sessiz Taniklar" },
          ];

  return (
    all.find((item) => item.id === npcId) ?? {
      id: npcId,
      name: "Mechul Supheli",
      icon: "👤",
      role: "Golgedeki Yabanci",
    }
  );
}
