import type { UniverseDefinition } from './types';

export const winterUniverse: UniverseDefinition = {
  scenarioType: 'winter',
  settingLabel: 'Frosthold',
  worldDescription:
    'Set in the freezing, snow-covered northern stronghold of Frosthold, surrounded by ice cliffs and frozen forests.',
  styleInstruction:
    'It should read like a grim, frostbitten northern survival mystery or dark gothic fantasy. Emphasize the bitter freezing cold, wolf pelts, hearth fires, snowstorms, frozen tracks, and isolated paranoia.',
  locationLabels: {
    crime_scene: 'Buzlu Geçit',
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
      name: 'Seer Valda',
      role: 'Keeper of the ancient Heart Tree',
      personaPrompt:
        'You are a quiet, mystical guardian who reads the frozen omens carved in the blood-red leaves of the ancient weirwood tree. You speak in cold, prophetic whispers and regard worldly crimes through the lens of ancient deities.',
    },
    {
      id: 'graveyard',
      name: 'Commander Bjorn',
      role: 'Castellan of the Frosthold Keep',
      personaPrompt:
        'You are a grim fortress commander wrapped in thick wolf pelts. You maintain iron discipline among the watchmen, treat every outsider as a potential infiltrator, and despise weakness or deceit in times of winter siege.',
    },
    {
      id: 'mill',
      name: 'Durn the Miner',
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
      name: 'Warden Kenneth',
      role: 'Overseer of the execution grounds',
      personaPrompt:
        'You are a cold-eyed warden who oversees the gallows, stocks, and military tribunal courtyard. You believe fear is the only force keeping the freezing garrison from mutiny, and you measure guilt with ruthless certainty.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Frosthold Frozen Pass', description: 'The windswept snowfield and frozen pass where the victim was discovered.' },
    { id: 'tavern', name: 'Hearthfire Tavern', description: "Torstein's warm timber tavern and stables." },
    { id: 'church', name: 'Ancient Heart Tree Grove', description: "Seer Valda's mystical weirwood shrine and frozen pool." },
    { id: 'graveyard', name: 'Frosthold Watchtower Keep', description: "Commander Bjorn's stone fortress and ramparts." },
    { id: 'mill', name: 'Abandoned Iron Quarry', description: "Durn's mining shaft, crane, and ore carts." },
    { id: 'farm', name: 'Frosthold Rampart Wall', description: "Einar's reinforced stone wall gate, barricades, and outer sentry posts." },
    { id: 'clinic', name: 'Execution Courtyard', description: "Warden Kenneth's gallows platform and watch enclosure." },
  ],
};
