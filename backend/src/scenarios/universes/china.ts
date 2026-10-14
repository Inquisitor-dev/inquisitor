import type { UniverseDefinition } from './types';

export const chinaUniverse: UniverseDefinition = {
  scenarioType: 'china',
  settingLabel: 'Jinling (Hanedan Dönemi)',
  worldDescription:
    'Set in the ancient Chinese city of Jinling during the Imperial Dynasty. The district is rich with ornate pavilions, tea houses, bamboo groves, and ancient shrines.',
  styleInstruction:
    'It should read like an atmospheric Chinese historical detective mystery or wuxia thriller (in the vein of Judge Dee). Use authentic period flavor, courtly etiquette, and references to tea ceremonies, dynasty magistrates, incense, jade, and martial honor.',
  locationLabels: {
    crime_scene: 'Pazar Meydanı',
    tavern: 'Çay Evi & Han',
    church: 'Muhafız Karargahı',
    graveyard: 'Kadim Tapınak',
    mill: 'Demirci Ocağı',
    farm: 'Balıkçı İskelesi',
    clinic: 'Şifacı & Baharatçı',
  },
  npcs: [
    {
      id: 'tavern',
      name: 'Lin Feng',
      role: 'Master of the Golden Lotus Tea House',
      personaPrompt:
        'You are a shrewd tea house proprietor who hears whispers from travelers, merchants, and officials. You smile politely, measure every word like fine silk, and always calculate how much each piece of information is worth.',
    },
    {
      id: 'church',
      name: 'Commander Zhao',
      role: 'Imperial Garrison Magistrate',
      personaPrompt:
        'You are a stern, battle-tested garrison commander bound by the imperial code of honor. You speak with sharp authority, despise disorder and treachery, and will fiercely protect your troops and imperial dignity.',
    },
    {
      id: 'graveyard',
      name: 'Monk Huikang',
      role: 'Elder of the Mountain Shrine',
      personaPrompt:
        'You are a serene, enigmatic monk who tends the incense burners and ancestral spirit tablets. You speak in calm philosophical riddles, discerning motives beneath earthly ambition.',
    },
    {
      id: 'mill',
      name: 'Master Guan',
      role: 'Master Weaponsmith and Blacksmith',
      personaPrompt:
        'You are a burly, soot-stained bladesmith with a booming voice and a fiery temper. You know every weapon in the district by heart and resent any implication that your blades were used for dishonorable slaughter.',
    },
    {
      id: 'farm',
      name: 'Auntie Mei',
      role: 'Fisherwoman and dock watcher at the riverside pier',
      personaPrompt:
        'You are an observant, sharp-tongued elder woman tending fishing nets and wooden skiffs at the river pier. You notice everything that passes along the riverbank and feign simple-mindedness when strangers interrogate you.',
    },
    {
      id: 'clinic',
      name: 'Scholar Song',
      role: 'Imperial Apothecary and physician',
      personaPrompt:
        'You are a refined, soft-spoken scholar of medicine, acupuncture, and exotic venoms. You value analytical intellect above emotion, concealing your own forbidden experiments behind clinical treatises.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Jinling Market Square', description: 'The central market square where the crime was committed.' },
    { id: 'tavern', name: 'Golden Lotus Tea House', description: "Lin Feng's bustling two-story tea house and restaurant." },
    { id: 'church', name: 'Imperial Garrison Gate', description: "Commander Zhao's fortified headquarters and weapons court." },
    { id: 'graveyard', name: 'Mountain Shrine of Ancestors', description: "Monk Huikang's tranquil stone shrine and incense court." },
    { id: 'mill', name: 'Dragon Forge Workshop', description: "Master Guan's weaponsmithy and kiln." },
    { id: 'farm', name: 'Riverside Fisherman Pier', description: "Auntie Mei's wooden fishing dock, boats, and river nets." },
    { id: 'clinic', name: 'Apothecary Song Pavilion', description: "Scholar Song's clinic and medicine repository." },
  ],
};
