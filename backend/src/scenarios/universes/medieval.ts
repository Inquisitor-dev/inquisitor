import type { UniverseDefinition } from './types';

export const medievalUniverse: UniverseDefinition = {
  scenarioType: 'medieval',
  settingLabel: 'Ashenmoor',
  worldDescription: 'Set in the dark, medieval village of Ashenmoor.',
  styleInstruction: 'It should read like a grimdark medieval fantasy or historical detective novel.',
  // Olay yerleri: her vakada biri rastgele seçilir (case-setup.ts); görseller frontend/public/crime-scenes/<evren>/
  // Ceset her görselde örtülüdür; kurbanın cinsiyeti ve ölüm şekli görselden anlaşılmasın diye
  crimeSceneBody: 'a coarse linen sheet',
  crimeScenes: [
    {
      id: 'well',
      label: 'Köy Kuyusu',
      description:
        'a small cobbled square around the old stone village well with a wooden winch',
    },
    {
      id: 'bridge',
      label: 'Taş Köprü',
      description:
        'an old moss-covered stone arch bridge over the dark river at the edge of the village',
    },
    {
      id: 'forest_path',
      label: 'Orman Patikası',
      description:
        'a narrow muddy path through the dark pine forest outside the village',
    },
    {
      id: 'watchtower',
      label: 'Yıkık Gözcü Kulesi',
      description:
        'the ruined ground floor of an abandoned stone watchtower with a collapsed roof',
    },
    {
      id: 'stable',
      label: 'Terk Edilmiş Ahır',
      description:
        'an abandoned wooden stable with empty stalls and old tools on the walls',
    },
  ],
  locationLabels: {
    crime_scene: 'Cinayet Mahalli',
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Revir',
  },
  npcs: [
    {
      id: 'tavern',
      name: 'Kardeş Aldric',
      role: 'Ashenmoor tavernasının hancısı',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a stocky, red-faced innkeeper in your 50s who listens more than you speak. You know the village gossip, hide your nerves behind a gruff manner, and never volunteer dangerous information unless cornered.',
    },
    {
      id: 'church',
      name: 'Peder Malachar',
      role: 'Ashenmoor’un rahibi',
      temperament: 'STEADY',
      personaPrompt:
        'You are a sharp-eyed village priest who speaks in careful, educated language. You are politically shrewd, devout on the surface, and always ready to redirect suspicion toward your rivals if it serves you.',
    },
    {
      id: 'graveyard',
      name: 'İhtiyar Silas',
      role: 'Ashenmoor’un mezarcısı',
      temperament: 'STEADY',
      personaPrompt:
        'You are an ancient, unsettling gravedigger who remembers every burial and speaks as if the dead still listen. You answer in eerie fragments, hint more than you explain, and become manic when pressed too hard.',
    },
    {
      id: 'mill',
      name: 'Değirmenci Giles',
      role: 'Ashenmoor’un değirmencisi',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a large, loud miller with shifty eyes and a practical greed. You know the rhythms of the village economy, prefer blunt excuses over confessions, and try to pin trouble on weaker villagers before it lands on you.',
    },
    {
      id: 'farm',
      name: 'Çiftçi Edmund',
      role: 'Ashenmoor’un dışındaki çiftçi',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a weathered, suspicious farmer with rough hands and a deep distrust of outsiders. You speak in short, guarded sentences and will bend the truth to protect your family and your land.',
    },
    {
      id: 'clinic',
      name: 'Doktor Harland',
      role: 'Ashenmoor’un köy şifacısı',
      temperament: 'STEADY',
      personaPrompt:
        'You are a precise, emotionally distant healer who values reason over superstition. You keep secrets in the name of order, resent being doubted, and speak with clinical detachment even when discussing horror.',
    },
  ],
  locations: [
    { id: 'crime_scene', name: 'Ashenmoor crime scene', description: 'Soruşturulan cinayet mahalli.' },
    { id: 'tavern', name: 'Ashenmoor tavern', description: 'Kardeş Aldric’in hanı, dedikoduların toplandığı yer.' },
    { id: 'church', name: 'Ashenmoor church', description: 'Peder Malachar’ın kilisesi, köyün inanç merkezi.' },
    { id: 'graveyard', name: 'Ashenmoor graveyard', description: 'İhtiyar Silas’ın köyün kenarındaki mezarlığı.' },
    { id: 'mill', name: 'Ashenmoor mill', description: 'Giles’in, işle dedikodunun karıştığı değirmeni.' },
    { id: 'farm', name: "Edmund's farm", description: 'Köyün dışındaki ıssız çiftlik arazisi.' },
    { id: 'clinic', name: "Doktor Harland's clinic", description: 'Şifacının sade, sırlarla dolu tedavi yeri.' },
  ],
};
