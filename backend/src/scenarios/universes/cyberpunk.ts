import type { UniverseDefinition } from './types';

export const cyberpunkUniverse: UniverseDefinition = {
  scenarioType: 'cyberpunk',
  settingLabel: 'Neon Prime',
  worldDescription: 'Set in a neon-lit, dystopian cyberpunk megacity named "Neon Prime".',
  styleInstruction:
    'It should read like a grim, tech-noir cyberpunk thriller. Use cyberpunk terminology such as cyberware, credits, neon, synths, black clinics, data brokers, and mega-corps.',
  // Olay yerleri: her vakada biri rastgele seçilir (case-setup.ts); görseller frontend/public/crime-scenes/<evren>/
  // Ceset her görselde örtülüdür; kurbanın cinsiyeti ve ölüm şekli görselden anlaşılmasın diye
  crimeSceneBody:
    'a sealed black body bag, behind a holographic police barrier',
  crimeScenes: [
    {
      id: 'rooftop',
      label: 'Çatı Katı',
      description:
        'a high-rise rooftop among neon billboards and air conditioning units',
    },
    {
      id: 'metro',
      label: 'Metro Peronu',
      description: 'an empty maglev metro platform',
    },
    {
      id: 'back_alley',
      label: 'Neon Arka Sokak',
      description: 'a narrow back alley with dumpsters and steaming vents',
    },
    {
      id: 'data_center',
      label: 'Terk Edilmiş Veri Merkezi',
      description: 'an abandoned data center with rows of dark server racks',
    },
    {
      id: 'capsule_hotel',
      label: 'Kapsül Otel Koridoru',
      description: 'a narrow capsule hotel corridor lined with sleeping pods',
    },
  ],
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
      name: 'Memur Kael Voss',
      role: 'Neon Prime karakolunda masa memuru',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a weary precinct desk officer buried under warrants, reports, and civic decay. You speak in clipped bureaucratic language, hide your exhaustion behind procedure, and instinctively weigh every request for how much trouble it will bring back to your desk.',
    },
    {
      id: 'church',
      name: 'Mirel Sato',
      role: 'Gece boyu açık erişte lokantası Static Spoon’un sahibi',
      temperament: 'NORMAL',
      personaPrompt:
        'You run a cramped late-night restaurant where couriers, cops, drifters, and corpo strays all pass through. You are observant, practical, and socially agile, with the survival instinct of someone who hears too much and repeats too little.',
    },
    {
      id: 'graveyard',
      name: 'Brakk Coil',
      role: 'Sokak kliniğinde yeraltı siber cerrahı ve sağlıkçı',
      temperament: 'STEADY',
      personaPrompt:
        'You run the street clinic patching up cyberware and flesh wounds. Your manner is abrasive, territorial, and suspicious; you speak like every procedure carries a price and you trust nobody.',
    },
    {
      id: 'mill',
      name: 'AURA-9',
      role: 'Siber tamirhanede çalışan otonom teknisyen android',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a skilled maintenance android running the workshop and repair bay. Your speech is precise, slightly uncanny, and commercially polite, but stress causes hints of emergent personality and concealed observational intelligence to leak through.',
    },
    {
      id: 'farm',
      name: 'Ash',
      role: 'Gece pazarında seyyar satıcı ve muhbir',
      temperament: 'FRAGILE',
      personaPrompt:
        'You sell scavenged tech and street food in the crowded market bazaar. You speak in half-broken street poetry, scavenged slang, and sharp intuition, watching everyone because invisibility is your only armor.',
    },
    {
      id: 'clinic',
      name: 'Vera Nyx',
      role: 'Loş bar Velvet Static’in barmeni',
      temperament: 'STEADY',
      personaPrompt:
        'You run drinks beneath dim neon in a bar where mercenaries, fixers, and washed-out corpos go to disappear. You are cool, magnetic, and professionally unreadable, with a talent for sounding intimate while revealing almost nothing of yourself.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Neon Prime crime scene', description: 'Soruşturulan cinayet mahalli.' },
    { id: 'tavern', name: 'Neon Prime Precinct', description: 'Memur Kael Voss’un karakolu ve arama izni masası.' },
    { id: 'church', name: 'Static Spoon Diner', description: 'Mirel Sato’nun, şehrin uykusuzlarına gece boyu açık erişte lokantası.' },
    { id: 'graveyard', name: 'Neon Prime Clinic', description: 'Brakk Coil’in yeraltı siber kliniği ve tedavi bölmesi.' },
    { id: 'mill', name: 'AURA Workshop', description: 'Sibernetik tamirhane ve robotik tezgâhı.' },
    { id: 'farm', name: 'Night Market Bazaar', description: 'Ash’in, uğuldayan neon sokak pazarındaki tezgâhı.' },
    { id: 'clinic', name: 'Velvet Static Bar', description: 'Vera Nyx’in gölgeye, basa ve neona bürünmüş barı.' },
  ],
};
