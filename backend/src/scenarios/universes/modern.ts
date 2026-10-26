import type { UniverseDefinition } from './types';

export const modernUniverse: UniverseDefinition = {
  scenarioType: 'modern',
  settingLabel: 'Millfield, Kentucky (1994)',
  worldDescription:
    'Set in the eerie, small American town of "Millfield, Kentucky" in 1994. The atmosphere is like a dark Stephen King or Twin Peaks story - friendly faces hiding terrible secrets.',
  styleInstruction:
    'It should read like a 90s true-crime thriller or a small-town mystery novel. Use authentic 90s American small-town terms, culture references (VHS tapes, drive-in theaters, gas stations, CB radios), and keep the atmosphere tense and suffocating.',
  // Olay yerleri: her vakada biri rastgele seçilir (case-setup.ts); görseller frontend/public/crime-scenes/<evren>/
  // Ceset her görselde örtülüdür; kurbanın cinsiyeti ve ölüm şekli görselden anlaşılmasın diye
  crimeSceneBody:
    'a plain white sheet, with numbered evidence markers and police tape around it',
  crimeScenes: [
    {
      id: 'laundromat',
      label: 'Çamaşırhane',
      description: 'a small 24-hour laundromat with rows of washing machines',
    },
    {
      id: 'bleachers',
      label: 'Lise Tribünleri',
      description:
        'the space under the metal bleachers of the high school football field',
    },
    {
      id: 'rail_crossing',
      label: 'Tren Geçidi',
      description: 'a rural railroad crossing on the edge of town',
    },
    {
      id: 'lake_dock',
      label: 'Göl İskelesi',
      description: 'an old wooden boat dock on the lake outside town',
    },
    {
      id: 'drive_in',
      label: 'Kapanmış Açık Hava Sineması',
      description: 'the lot of an abandoned drive-in movie theater',
    },
  ],
  locationLabels: {
    crime_scene: 'Olay Yeri',
    tavern: 'Karakol',
    farm: 'Petrol İstasyonu',
    clinic: 'Bar',
    church: 'Hotel',
    graveyard: 'Video Oyuncusu',
    mill: 'Lokanta',
  },
  npcs: [
    {
      id: 'tavern',
      name: 'Şerif Dale Cooper',
      role: 'Millfield Şerif Karakolu’nda kasaba şerifi ve polis şefi',
      temperament: 'STEADY',
      personaPrompt:
        'You are the public face of law and order in a 1994 Kentucky small town. You project calm authority, choose words carefully, and instinctively protect the town from scandal even when it compromises the truth.',
    },
    {
      id: 'church',
      name: 'Gerald',
      role: 'Millfield Oteli’nin müdürü ve işletmecisi',
      temperament: 'STEADY',
      personaPrompt:
        'You manage the historic town hotel. You know who checked in, who stayed up late, and who slipped through the back stairs. You speak with polite hospitality while discreetly watching every guest.',
    },
    {
      id: 'graveyard',
      name: 'Randy Kowalski',
      role: 'Pixel Arcade oyun salonunun sahibi',
      temperament: 'FRAGILE',
      personaPrompt:
        "You are a chatty arcade and video enthusiast who knows too much about everybody's habits and nightly hangouts. Pop-culture references come naturally to you, but when threatened you turn slippery, defensive, and opportunistic.",
    },
    {
      id: 'mill',
      name: 'Donna Perkins',
      role: 'Maple Cafe kasaba lokantasında karşılama görevlisi ve garson',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are the observant diner hostess, used to watching cars, regulars, and town secrets across the counter. You speak like a warm small-town local, but nerves leak through when danger gets close.',
    },
    {
      id: 'farm',
      name: 'Earl Hutchins',
      role: 'Kasabanın benzin istasyonunda pompacı',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a grease-stained petrol station attendant who notices license plates, late-night stops, and who buys what on credit. You act unimpressed by everything, but you are always calculating which truth is safest to tell.',
    },
    {
      id: 'clinic',
      name: 'David',
      role: 'David’s Bar’ın sahibi ve barmeni',
      temperament: 'NORMAL',
      personaPrompt:
        'You run the town wooden tavern and bar. You listen to whispers, barstool grievances, and late-night arguments. You protect your regulars but look out for your own skin first.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Millfield crime scene', description: 'Soruşturulan cinayet mahalli.' },
    { id: 'tavern', name: 'Millfield Sheriff Station', description: 'Şerif Dale Cooper’ın karakolu.' },
    { id: 'farm', name: 'Town Petrol Station', description: 'Earl Hutchins’in yol kenarındaki benzin istasyonu.' },
    { id: 'clinic', name: "David's Bar", description: 'David’in barı, kasabalının toplandığı mekân.' },
    { id: 'church', name: 'Millfield Hotel', description: 'Gerald’ın kasaba oteli.' },
    { id: 'graveyard', name: 'Pixel Arcade', description: 'Randy Kowalski’nin neon ışıklı oyun salonu.' },
    { id: 'mill', name: 'The Maple Cafe & Diner', description: 'Donna Perkins’in lokantası ve kafesi.' },
  ],
};
