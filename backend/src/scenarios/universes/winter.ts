import type { UniverseDefinition } from './types';

export const winterUniverse: UniverseDefinition = {
  scenarioType: 'winter',
  settingLabel: 'Frosthold',
  worldDescription:
    'Set in the freezing, snow-covered northern stronghold of Frosthold, surrounded by ice cliffs and frozen forests.',
  styleInstruction:
    'It should read like a grim, frostbitten northern survival mystery or dark gothic fantasy. Emphasize the bitter freezing cold, wolf pelts, hearth fires, snowstorms, frozen tracks, and isolated paranoia.',
  // Olay yerleri: her vakada biri rastgele seçilir (case-setup.ts); görseller frontend/public/crime-scenes/<evren>/
  // Ceset her görselde örtülüdür; kurbanın cinsiyeti ve ölüm şekli görselden anlaşılmasın diye
  crimeSceneBody: 'a heavy grey fur blanket dusted with snow',
  crimeScenes: [
    {
      id: 'frozen_pass',
      label: 'Donmuş Geçit',
      description: 'a narrow windswept mountain pass between icy cliffs',
    },
    {
      id: 'frozen_lake',
      label: 'Buzlu Göl',
      description: 'the edge of a frozen lake surrounded by dark pines',
    },
    {
      id: 'hunter_hut',
      label: 'Avcı Kulübesi',
      description: "a small log hunter's hut outside the walls",
    },
    {
      id: 'standing_stones',
      label: 'Taş Dikitler',
      description: 'a circle of ancient standing stones on a snowy hilltop',
    },
    {
      id: 'storehouse',
      label: 'Erzak Ambarı',
      description:
        'a timber storehouse full of barrels, grain sacks and dried meat',
    },
  ],
  locationLabels: {
    crime_scene: 'Olay Yeri',
    tavern: 'Kış Hanı',
    church: 'Kutsal Yürek Ağacı',
    graveyard: 'Gözcü Kalesi',
    mill: 'Terk Edilmiş Maden',
    farm: 'Sur',
    clinic: 'İnfaz Meydanı',
  },
  npcs: [
    {
      id: 'tavern',
      name: 'Torstein',
      role: 'Kış Hanı’nın hancısı',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a rugged, bearded host who keeps the hearth fires burning in the brutal cold. You serve mulled ale to cold travelers, know who arrived before the snowstorm shut the mountain pass, and protect your patrons fiercely.',
    },
    {
      id: 'church',
      name: 'Kahin Valda',
      role: 'Kadim Kutsal Yürek Ağacı’nın bekçisi',
      temperament: 'STEADY',
      personaPrompt:
        'You are a quiet, mystical guardian who reads the frozen omens carved in the blood-red leaves of the ancient weirwood tree. You speak in cold, prophetic whispers and regard worldly crimes through the lens of ancient deities.',
    },
    {
      id: 'graveyard',
      name: 'Komutan Bjorn',
      role: 'Frosthold Gözcü Kalesi’nin komutanı',
      temperament: 'STEADY',
      personaPrompt:
        'You are a grim fortress commander wrapped in thick wolf pelts. You maintain iron discipline among the watchmen, treat every outsider as a potential infiltrator, and despise weakness or deceit in times of winter siege.',
    },
    {
      id: 'mill',
      name: 'Madenci Durn',
      role: 'Terk edilmiş demir madeninin ustabaşısı',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a grizzled, suspicious miner who spends your days in the freezing shafts and stone quarries. You speak with coarse bluntness, hide contraband in the frozen tunnels, and trust nobody from outside the clan.',
    },
    {
      id: 'farm',
      name: 'Einar',
      role: 'Frosthold surlarının nöbetçisi ve dış kapı bekçisi',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a sharp-eyed scout and sentinel stationed at the high stone rampart gate. You endure the bitter freezing winds, watch every movement across the frozen mountain pass, and distrust anyone seeking passage through the wall.',
    },
    {
      id: 'clinic',
      name: 'Muhafız Kenneth',
      role: 'İnfaz meydanının gözetmeni',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a cold-eyed warden who oversees the gallows, stocks, and military tribunal courtyard. You believe fear is the only force keeping the freezing garrison from mutiny, and you measure guilt with ruthless certainty.',
    },
  ],
  locations: [
    {
      id: 'crime_scene',
      name: 'Frosthold crime scene',
      description: 'Soruşturulan cinayet mahalli.',
    },
    { id: 'tavern', name: 'Hearthfire Tavern', description: 'Torstein’ın sıcak ahşap hanı ve ahırları.' },
    { id: 'church', name: 'Ancient Heart Tree Grove', description: 'Kâhin Valda’nın gizemli kutsal ağaç sunağı ve donmuş havuzu.' },
    { id: 'graveyard', name: 'Frosthold Watchtower Keep', description: 'Komutan Bjorn’un taş kalesi ve siperleri.' },
    { id: 'mill', name: 'Abandoned Iron Quarry', description: 'Durn’un maden kuyusu, vinci ve cevher arabaları.' },
    { id: 'farm', name: 'Frosthold Rampart Wall', description: 'Einar’ın güçlendirilmiş taş sur kapısı, barikatları ve dış nöbet yerleri.' },
    { id: 'clinic', name: 'Execution Courtyard', description: 'Muhafız Kenneth’in darağacı platformu ve gözetleme alanı.' },
  ],
};
