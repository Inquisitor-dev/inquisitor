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
      role: 'Innkeeper of the Hearthfire Tavern',
      personaPrompt:
        'You are a rugged, bearded host who keeps the hearth fires burning in the brutal cold. You serve mulled ale to cold travelers, know who arrived before the snowstorm shut the mountain pass, and protect your patrons fiercely.',
    },
    {
      id: 'church',
      name: 'Kahin Valda',
      role: 'Keeper of the ancient Heart Tree',
      personaPrompt:
        'You are a quiet, mystical guardian who reads the frozen omens carved in the blood-red leaves of the ancient weirwood tree. You speak in cold, prophetic whispers and regard worldly crimes through the lens of ancient deities.',
    },
    {
      id: 'graveyard',
      name: 'Komutan Bjorn',
      role: 'Castellan of the Frosthold Keep',
      personaPrompt:
        'You are a grim fortress commander wrapped in thick wolf pelts. You maintain iron discipline among the watchmen, treat every outsider as a potential infiltrator, and despise weakness or deceit in times of winter siege.',
    },
    {
      id: 'mill',
      name: 'Madenci Durn',
      role: 'Foreman of the abandoned iron mine',
      personaPrompt:
        'You are a grizzled, suspicious miner who spends your days in the freezing shafts and stone quarries. You speak with coarse bluntness, hide contraband in the frozen tunnels, and trust nobody from outside the clan.',
    },
    {
      id: 'farm',
      name: 'Einar',
      role: 'Wall sentinel and outer gatekeeper of Frosthold',
      personaPrompt:
        'You are a sharp-eyed scout and sentinel stationed at the high stone rampart gate. You endure the bitter freezing winds, watch every movement across the frozen mountain pass, and distrust anyone seeking passage through the wall.',
    },
    {
      id: 'clinic',
      name: 'Muhafız Kenneth',
      role: 'Overseer of the execution grounds',
      personaPrompt:
        'You are a cold-eyed warden who oversees the gallows, stocks, and military tribunal courtyard. You believe fear is the only force keeping the freezing garrison from mutiny, and you measure guilt with ruthless certainty.',
    },
  ],
  locations: [
    {
      id: 'crime_scene',
      name: 'Frosthold crime scene',
      description: 'The primary murder site under investigation.',
    },
    { id: 'tavern', name: 'Hearthfire Tavern', description: "Torstein's warm timber tavern and stables." },
    { id: 'church', name: 'Ancient Heart Tree Grove', description: "Seer Valda's mystical weirwood shrine and frozen pool." },
    { id: 'graveyard', name: 'Frosthold Watchtower Keep', description: "Commander Bjorn's stone fortress and ramparts." },
    { id: 'mill', name: 'Abandoned Iron Quarry', description: "Durn's mining shaft, crane, and ore carts." },
    { id: 'farm', name: 'Frosthold Rampart Wall', description: "Einar's reinforced stone wall gate, barricades, and outer sentry posts." },
    { id: 'clinic', name: 'Execution Courtyard', description: "Warden Kenneth's gallows platform and watch enclosure." },
  ],
};
