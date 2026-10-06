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
    id: "farm",
    name: "Petrol İstasyonu",
    icon: "⛽",
    description: "Yoldan geçen herkes bir şey görmüş olabilir.",
    actionLabel: "Petrol İstasyonuna git",
    minDifficulty: "medium",
  },
  {
    id: "tavern",
    name: "Karakol",
    icon: "🚔",
    description: "Resmi kayıtlar ile gayriresmi şüpheler burada çarpışıyor.",
    actionLabel: "Karakola git",
  },
  {
    id: "clinic",
    name: "Bar",
    icon: "🍺",
    description: "Gece fısıltıları ve dertleşmeler bu ahşap tezgâhta birikir.",
    actionLabel: "Bara git",
    minDifficulty: "hard",
  },
  {
    id: "home",
    name: "Evim",
    icon: "🏡",
    description: "Dinlenip notlarını gözden geçirebileceğin güvenli sığınağın.",
    actionLabel: "Eve dön",
  },
  {
    id: "church",
    name: "Hotel",
    icon: "🏨",
    description: "Kasabanın yabancıları ve gece misafirleri burada konaklar.",
    actionLabel: "Hotele git",
  },
  {
    id: "graveyard",
    name: "Video Oyuncusu",
    icon: "🎮",
    description: "Neon ışıklar ve atari sesleri arasında kasabanın gençleri toplanır.",
    actionLabel: "Video salonuna git",
  },
  {
    id: "mill",
    name: "Lokanta",
    icon: "🍽️",
    description: "Sıcak kahve ve gün boyu süren kasaba sohbetleri.",
    actionLabel: "Lokantaya git",
  },
];

const cyberpunkLocations: LocationDefinition[] = [
  {
    id: "home",
    name: "Evim",
    icon: "🏡",
    description: "Siber kargaşadan uzak, dinlenip güç toplayabileceğin güvenli sığınağın.",
    actionLabel: "Eve dön",
  },
  {
    id: "tavern",
    name: "Karakol",
    icon: "👮",
    description: "Veri logları ve insan ifadeleri aynı şeyi söylemeyebilir.",
    actionLabel: "Karakola git",
  },
  {
    id: "clinic",
    name: "Bar",
    icon: "🍸",
    description: "Loş neonlar altında paralı askerler ve muhbirler fısıldaşır.",
    actionLabel: "Bara git",
    minDifficulty: "hard",
  },
  {
    id: "graveyard",
    name: "Klinik",
    icon: "🏥",
    description: "Karanlık sokakların siber implantları ve yaraları burada tedavi edilir.",
    actionLabel: "Kliniğe git",
  },
  {
    id: "mill",
    name: "Tamirhane",
    icon: "🛠️",
    description: "Robotlar, yedek parçalar ve arızalı devre kartlarının atölyesi.",
    actionLabel: "Tamirhaneye git",
  },
  {
    id: "church",
    name: "Lokanta",
    icon: "🍜",
    description: "Buharı tüten ramen kaseleri ardında sırlar paylaşılır.",
    actionLabel: "Lokantaya git",
  },
  {
    id: "farm",
    name: "Sokak Pazarı",
    icon: "🏮",
    description: "Tente altlarında çalıntı çipler, sokak lezzetleri ve fısıltılar.",
    actionLabel: "Pazara git",
    minDifficulty: "medium",
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

export function getLocationLabel(scenarioType: ScenarioType, locationId: string) {
  if (locationId === "crime_scene") {
    return scenarioType === "medieval" ? "Cinayet Mahalli" : "Olay Yeri";
  }

  const locations = getVisibleLocations(scenarioType, "hard");
  return locations.find((item) => item.id === locationId)?.name ?? locationId;
}
