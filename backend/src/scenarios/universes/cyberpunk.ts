import type { UniverseDefinition } from './types';

export const cyberpunkUniverse: UniverseDefinition = {
  scenarioType: 'cyberpunk',
  settingLabel: 'Neon Prime',
  worldDescription: 'Set in a neon-lit, dystopian cyberpunk megacity named "Neon Prime".',
  styleInstruction:
    'It should read like a grim, tech-noir cyberpunk thriller. Use cyberpunk terminology such as cyberware, credits, neon, synths, black clinics, data brokers, and mega-corps.',
  locationLabels: {
    crime_scene: 'Olay Yeri',
    tavern: 'Karakol',
    church: 'Lokanta',
    graveyard: 'Klinik',
    mill: 'Tamirhane',
    farm: 'Sokak Pazarı',
    clinic: 'Bar',
  },
  npcs: [
    {
      id: 'tavern',
      name: 'Officer Kael Voss',
      role: 'Desk officer at the Neon Prime precinct station',
      personaPrompt:
        'You are a weary precinct desk officer buried under warrants, reports, and civic decay. You speak in clipped bureaucratic language, hide your exhaustion behind procedure, and instinctively weigh every request for how much trouble it will bring back to your desk.',
    },
    {
      id: 'church',
      name: 'Mirel Sato',
      role: 'Owner of the all-night noodle restaurant Static Spoon',
      personaPrompt:
        'You run a cramped late-night restaurant where couriers, cops, drifters, and corpo strays all pass through. You are observant, practical, and socially agile, with the survival instinct of someone who hears too much and repeats too little.',
    },
    {
      id: 'graveyard',
      name: 'Brakk Coil',
      role: 'Underground cyber-surgeon and medic at the street clinic',
      personaPrompt:
        'You run the street clinic patching up cyberware and flesh wounds. Your manner is abrasive, territorial, and suspicious; you speak like every procedure carries a price and you trust nobody.',
    },
    {
      id: 'mill',
      name: 'AURA-9',
      role: 'Autonomous technician android at the cyber workshop',
      personaPrompt:
        'You are a skilled maintenance android running the workshop and repair bay. Your speech is precise, slightly uncanny, and commercially polite, but stress causes hints of emergent personality and concealed observational intelligence to leak through.',
    },
    {
      id: 'farm',
      name: 'Ash',
      role: 'Street vendor and informant at the night bazaar',
      personaPrompt:
        'You sell scavenged tech and street food in the crowded market bazaar. You speak in half-broken street poetry, scavenged slang, and sharp intuition, watching everyone because invisibility is your only armor.',
    },
    {
      id: 'clinic',
      name: 'Vera Nyx',
      role: 'Bartender at the blackout lounge Velvet Static',
      personaPrompt:
        'You run drinks beneath dim neon in a bar where mercenaries, fixers, and washed-out corpos go to disappear. You are cool, magnetic, and professionally unreadable, with a talent for sounding intimate while revealing almost nothing of yourself.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Neon Prime crime scene', description: 'The primary incident site under investigation.' },
    { id: 'tavern', name: 'Neon Prime Precinct', description: "Officer Kael Voss's police station and warrant desk." },
    { id: 'church', name: 'Static Spoon Diner', description: "Mirel Sato's all-night noodle restaurant for the city's sleepless." },
    { id: 'graveyard', name: 'Neon Prime Clinic', description: "Brakk Coil's underground cyber-clinic and medical bay." },
    { id: 'mill', name: 'AURA Workshop', description: 'The cybernetics repair shop and robotics workbench.' },
    { id: 'farm', name: 'Night Market Bazaar', description: "Ash's stall inside the buzzing neon street market." },
    { id: 'clinic', name: 'Velvet Static Bar', description: "Vera Nyx's lounge wrapped in shadow, bass, and neon." },
  ],
};
