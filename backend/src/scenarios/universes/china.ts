import type { UniverseDefinition } from './types';

export const chinaUniverse: UniverseDefinition = {
  scenarioType: 'china',
  settingLabel: 'Jinling (Hanedan Dönemi)',
  worldDescription:
    'Set in the ancient Chinese city of Jinling during the Imperial Dynasty. The district is rich with ornate pavilions, tea houses, bamboo groves, and ancient shrines.',
  styleInstruction:
    'It should read like an atmospheric Chinese historical detective mystery or wuxia thriller (in the vein of Judge Dee). Use authentic period flavor, courtly etiquette, and references to tea ceremonies, dynasty magistrates, incense, jade, and martial honor.',
  // Olay yerleri: her vakada biri rastgele seçilir (case-setup.ts); görseller frontend/public/crime-scenes/<evren>/
  // Ceset her görselde örtülüdür; kurbanın cinsiyeti ve ölüm şekli görselden anlaşılmasın diye
  crimeSceneBody: 'a plain white mourning cloth',
  crimeScenes: [
    {
      id: 'market_square',
      label: 'Pazar Meydanı',
      description:
        'the central market square with wooden stalls and paper lanterns',
    },
    {
      id: 'canal_bridge',
      label: 'Kanal Köprüsü',
      description:
        'a curved stone bridge over a narrow canal with moored boats',
    },
    {
      id: 'bamboo_grove',
      label: 'Bambu Korusu',
      description: 'a dense bamboo grove with a narrow stone path',
    },
    {
      id: 'dye_workshop',
      label: 'İpek Boyahanesi',
      description:
        'the courtyard of a silk dyeing workshop with dye vats and hanging silk',
    },
    {
      id: 'lotus_pavilion',
      label: 'Lotus Köşkü',
      description: 'a small wooden pavilion beside a lotus pond in a garden',
    },
  ],
  locationLabels: {
    crime_scene: 'Olay Yeri',
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
      role: 'Altın Lotus Çay Evi ve hanının sahibi',
      temperament: 'STEADY',
      personaPrompt:
        'You are a shrewd tea house proprietor who hears whispers from travelers, merchants, and officials. You smile politely, measure every word like fine silk, and always calculate how much each piece of information is worth.',
    },
    {
      id: 'church',
      name: 'Komutan Zhao',
      role: 'İmparatorluk muhafız karargâhının komutanı',
      temperament: 'STEADY',
      personaPrompt:
        'You are a stern, battle-tested garrison commander bound by the imperial code of honor. You speak with sharp authority, despise disorder and treachery, and will fiercely protect your troops and imperial dignity.',
    },
    {
      id: 'graveyard',
      name: 'Keşiş Huikang',
      role: 'Dağ tapınağının yaşlı keşişi',
      temperament: 'NORMAL',
      personaPrompt:
        'You are a serene, enigmatic monk who tends the incense burners and ancestral spirit tablets. You speak in calm philosophical riddles, discerning motives beneath earthly ambition.',
    },
    {
      id: 'mill',
      name: 'Usta Guan',
      role: 'Silah ustası ve demirci',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a burly, soot-stained bladesmith with a booming voice and a fiery temper. You know every weapon in the district by heart and resent any implication that your blades were used for dishonorable slaughter.',
    },
    {
      id: 'farm',
      name: 'Mei Teyze',
      role: 'Nehir kıyısındaki iskelede balıkçı ve iskele bekçisi',
      temperament: 'NORMAL',
      personaPrompt:
        'You are an observant, sharp-tongued elder woman tending fishing nets and wooden skiffs at the river pier. You notice everything that passes along the riverbank and feign simple-mindedness when strangers interrogate you.',
    },
    {
      id: 'clinic',
      name: 'Bilgin Song',
      role: 'İmparatorluk şifacısı ve baharatçısı',
      temperament: 'FRAGILE',
      personaPrompt:
        'You are a refined, soft-spoken scholar of medicine, acupuncture, and exotic venoms. You value analytical intellect above emotion, concealing your own forbidden experiments behind clinical treatises.',
    },
  ],
  locations: [
    {
      id: 'crime_scene',
      name: 'Jinling crime scene',
      description: 'Soruşturulan cinayet mahalli.',
    },
    { id: 'tavern', name: 'Golden Lotus Tea House', description: 'Lin Feng’in iki katlı, kalabalık çay evi ve lokantası.' },
    { id: 'church', name: 'Imperial Garrison Gate', description: 'Komutan Zhao’nun tahkimli karargâhı ve silah avlusu.' },
    { id: 'graveyard', name: 'Mountain Shrine of Ancestors', description: 'Keşiş Huikang’ın sakin taş tapınağı ve tütsü avlusu.' },
    { id: 'mill', name: 'Dragon Forge Workshop', description: 'Usta Guan’ın silah atölyesi ve ocağı.' },
    { id: 'farm', name: 'Riverside Fisherman Pier', description: 'Mei Teyze’nin ahşap balıkçı iskelesi, kayıkları ve nehir ağları.' },
    { id: 'clinic', name: 'Apothecary Song Pavilion', description: 'Bilgin Song’un muayenehanesi ve ilaç deposu.' },
  ],
};
