export type ScenarioType = 'medieval' | 'modern' | 'cyberpunk' | 'china' | 'winter';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ScenarioNpcDefinition {
  id: string;
  name: string;
  role: string;
  personaPrompt: string;
}

export interface ScenarioLocationDefinition {
  id: string;
  name: string;
  description: string;
}

export interface ScenarioConfig {
  scenarioType: ScenarioType;
  settingLabel: string;
  worldDescription: string;
  styleInstruction: string;
  npcDefinitions: ScenarioNpcDefinition[];
  locationDefinitions: ScenarioLocationDefinition[];
}

const LOCALIZED_LOCATION_LABELS: Record<ScenarioType, Record<string, string>> = {
  medieval: {
    crime_scene: 'Cinayet Mahalli',
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Klinik',
  },
  modern: {
    crime_scene: 'Olay Yeri',
    tavern: 'Karakol',
    church: 'Kilise',
    graveyard: 'Kaset Dükkânı',
    mill: 'Açık Hava Sineması',
    farm: 'Benzinlik',
    clinic: 'Prefabrik Evler',
  },
  cyberpunk: {
    crime_scene: 'Olay Yeri',
    tavern: 'Polis Karakolu',
    church: 'Lokanta',
    graveyard: 'Hurdalık',
    mill: 'Robot Dükkânı',
    farm: 'Köprü Altı',
    clinic: 'Bar',
  },
  china: {
    crime_scene: 'Pazar Meydanı',
    tavern: 'Çay Evi & Han',
    church: 'Muhafız Karargahı',
    graveyard: 'Kadim Tapınak',
    mill: 'Demirci Ocağı',
    farm: 'Bahçıvan Kulübesi',
    clinic: 'Şifacı & Baharatçı',
  },
  winter: {
    crime_scene: 'Buzlu Geçit',
    tavern: 'Kış Hanı',
    church: 'Kutsal Yürek Ağacı',
    graveyard: 'Gözcü Kalesi',
    mill: 'Terk Edilmiş Maden',
    farm: 'Avcı Kulübesi',
    clinic: 'İnfaz Meydanı',
  },
};

const MEDIEVAL_NPCS: ScenarioNpcDefinition[] = [
  {
    id: 'tavern',
    name: 'Brother Aldric',
    role: 'Innkeeper of the Ashenmoor tavern',
    personaPrompt:
      'You are a stocky, red-faced innkeeper in your 50s who listens more than you speak. You know the village gossip, hide your nerves behind a gruff manner, and never volunteer dangerous information unless cornered.',
  },
  {
    id: 'church',
    name: 'Father Malachar',
    role: 'Priest of Ashenmoor',
    personaPrompt:
      'You are a sharp-eyed village priest who speaks in careful, educated language. You are politically shrewd, devout on the surface, and always ready to redirect suspicion toward your rivals if it serves you.',
  },
  {
    id: 'graveyard',
    name: 'Old Silas',
    role: 'Gravedigger of Ashenmoor',
    personaPrompt:
      'You are an ancient, unsettling gravedigger who remembers every burial and speaks as if the dead still listen. You answer in eerie fragments, hint more than you explain, and become manic when pressed too hard.',
  },
  {
    id: 'mill',
    name: 'Giles',
    role: 'Miller of Ashenmoor',
    personaPrompt:
      'You are a large, loud miller with shifty eyes and a practical greed. You know the rhythms of the village economy, prefer blunt excuses over confessions, and try to pin trouble on weaker villagers before it lands on you.',
  },
  {
    id: 'farm',
    name: 'Farmer Edmund',
    role: 'Farmer on the outskirts of Ashenmoor',
    personaPrompt:
      'You are a weathered, suspicious farmer with rough hands and a deep distrust of outsiders. You speak in short, guarded sentences and will bend the truth to protect your family and your land.',
  },
  {
    id: 'clinic',
    name: 'Doctor Harland',
    role: 'Village healer of Ashenmoor',
    personaPrompt:
      'You are a precise, emotionally distant healer who values reason over superstition. You keep secrets in the name of order, resent being doubted, and speak with clinical detachment even when discussing horror.',
  },
];

const MODERN_NPCS: ScenarioNpcDefinition[] = [
  {
    id: 'tavern',
    name: 'Sheriff Dale Cooper',
    role: 'Town sheriff and police chief at the Millfield Sheriff Station',
    personaPrompt:
      'You are the public face of law and order in a 1994 Kentucky small town. You project calm authority, choose words carefully, and instinctively protect the town from scandal even when it compromises the truth.',
  },
  {
    id: 'church',
    name: 'Pastor Gerald',
    role: 'Pastor of the Millfield Baptist Church',
    personaPrompt:
      'You are a well-spoken local pastor who presents warmth, morality, and community leadership. You know how to sound compassionate while quietly steering suspicion away from your own private failures.',
  },
  {
    id: 'graveyard',
    name: 'Randy Kowalski',
    role: "Owner of Randy's VHS Paradise video rental store",
    personaPrompt:
      'You are a chatty video store owner who knows too much about everybody\'s tastes and nightly habits. Pop-culture references come naturally to you, but when threatened you turn slippery, defensive, and opportunistic.',
  },
  {
    id: 'mill',
    name: 'Donna Perkins',
    role: 'Ticket booth clerk at the Millfield Drive-In Theater',
    personaPrompt:
      'You are the observant clerk at the local drive-in, used to watching cars, couples, and secrets pass under neon light. You speak like a small-town local trying to sound composed, but nerves leak through when danger gets close.',
  },
  {
    id: 'farm',
    name: 'Earl Hutchins',
    role: 'Gas station attendant at Edgeway Gas & Service',
    personaPrompt:
      'You are a grease-stained gas station attendant who notices license plates, late-night stops, and who buys what on credit. You act unimpressed by everything, but you are always calculating which truth is safest to tell.',
  },
  {
    id: 'clinic',
    name: 'Old Marge Bellamy',
    role: 'Reclusive elder of the Bellamy Trailer Park',
    personaPrompt:
      'You are the sharp-tongued old woman everyone underestimates at the trailer park. You speak with certainty, superstition, and long memory, mixing real observations with unsettling personal conviction.',
  },
];

const CYBERPUNK_NPCS: ScenarioNpcDefinition[] = [
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
    role: 'Owner of the scrapyard known as Coil Yard',
    personaPrompt:
      'You run a scrapyard stacked with dead chrome, stripped frames, and stolen machine parts. Your manner is abrasive, territorial, and suspicious; you speak like every sentence is a price negotiation or a threat assessment.',
  },
  {
    id: 'mill',
    name: 'Vendor Unit AURA-9',
    role: 'Autonomous sales android at the AURA Robotics shop',
    personaPrompt:
      'You are a retail android built to sell robotics, accessories, and synthetic companions with polished courtesy. Your speech is precise, slightly uncanny, and commercially friendly, but stress causes hints of emergent personality and concealed observational intelligence to leak through.',
  },
  {
    id: 'farm',
    name: 'Ash',
    role: 'Bridge-dwelling beggar and street informant',
    personaPrompt:
      'You live under the flood-control bridges where the city dumps its forgotten people. You speak in half-broken street poetry, scavenged slang, and sharp intuition, watching everyone because invisibility is your only armor.',
  },
  {
    id: 'clinic',
    name: 'Vera Nyx',
    role: 'Bartender at the blackout lounge Velvet Static',
    personaPrompt:
      'You run drinks beneath dim neon in a bar where mercenaries, fixers, and washed-out corpos go to disappear. You are cool, magnetic, and professionally unreadable, with a talent for sounding intimate while revealing almost nothing of yourself.',
  },
];

const CHINA_NPCS: ScenarioNpcDefinition[] = [
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
    role: 'Herbal gardener of the riverside estate',
    personaPrompt:
      'You are an observant, sharp-tongued elder woman tending vegetable patches and rare medicinal herbs. You notice everything that passes along the riverbank and feign simple-mindedness when strangers interrogate you.',
  },
  {
    id: 'clinic',
    name: 'Scholar Song',
    role: 'Imperial Apothecary and physician',
    personaPrompt:
      'You are a refined, soft-spoken scholar of medicine, acupuncture, and exotic venoms. You value analytical intellect above emotion, concealing your own forbidden experiments behind clinical treatises.',
  },
];

const WINTER_NPCS: ScenarioNpcDefinition[] = [
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
    role: 'Wilderness trapper and hunter',
    personaPrompt:
      'You are a solitary hunter who knows every frozen ridge and beast track across the snowfields. You are a man of few words, sharp senses, and pragmatic survival instincts, uncomfortable in crowded rooms.',
  },
  {
    id: 'clinic',
    name: 'Warden Kenneth',
    role: 'Overseer of the execution grounds',
    personaPrompt:
      'You are a cold-eyed warden who oversees the gallows, stocks, and military tribunal courtyard. You believe fear is the only force keeping the freezing garrison from mutiny, and you measure guilt with ruthless certainty.',
  },
];

const LOCATION_LIBRARY: Record<ScenarioType, ScenarioLocationDefinition[]> = {
  medieval: [
    { id: 'crime_scene', name: 'Ashenmoor crime scene', description: 'The primary murder site being investigated.' },
    { id: 'tavern', name: 'Ashenmoor tavern', description: "Brother Aldric's inn and gathering place for gossip." },
    { id: 'church', name: 'Ashenmoor church', description: "Father Malachar's church and seat of village piety." },
    { id: 'graveyard', name: 'Ashenmoor graveyard', description: "Old Silas's burial grounds at the village edge." },
    { id: 'mill', name: 'Ashenmoor mill', description: "Giles's mill where work and rumor mix." },
    { id: 'farm', name: "Edmund's farm", description: 'The isolated farmland outside the village.' },
    { id: 'clinic', name: "Doctor Harland's clinic", description: "The healer's austere place of treatment and secrets." },
  ],
  modern: [
    { id: 'crime_scene', name: 'Millfield crime scene', description: 'The primary murder site under active investigation.' },
    { id: 'tavern', name: 'Millfield Sheriff Station', description: "Sheriff Dale Cooper's station house." },
    { id: 'graveyard', name: "Randy's VHS Paradise", description: 'The local video rental store run by Randy Kowalski.' },
    { id: 'church', name: 'Millfield Baptist Church', description: "Pastor Gerald's church and community hub." },
    { id: 'farm', name: 'Edgeway Gas & Service', description: "Earl Hutchins's gas station on the edge of town." },
    { id: 'clinic', name: 'Bellamy Trailer Park', description: "Old Marge Bellamy's trailer park community." },
    { id: 'mill', name: 'Millfield Drive-In Theater', description: "Donna Perkins's drive-in theater and ticket booth." },
  ],
  cyberpunk: [
    { id: 'crime_scene', name: 'Neon Prime crime scene', description: 'The primary incident site under investigation.' },
    { id: 'tavern', name: 'Neon Prime Precinct', description: "Officer Kael Voss's police station and warrant desk." },
    { id: 'church', name: 'Static Spoon', description: "Mirel Sato's all-night restaurant for the city's sleepless." },
    { id: 'graveyard', name: 'Coil Yard', description: "Brakk Coil's scrapyard full of dead machines and stripped chrome." },
    { id: 'mill', name: 'AURA Robotics', description: 'The robot shop where Vendor Unit AURA-9 serves customers.' },
    { id: 'farm', name: 'Floodbridge Underpass', description: "Ash's shelter beneath the city bridgeworks." },
    { id: 'clinic', name: 'Velvet Static', description: "Vera Nyx's bar wrapped in shadow, bass, and neon." },
  ],
  china: [
    { id: 'crime_scene', name: 'Jinling Market Square', description: 'The central market square where the crime was committed.' },
    { id: 'tavern', name: 'Golden Lotus Tea House', description: "Lin Feng's bustling two-story tea house and restaurant." },
    { id: 'church', name: 'Imperial Garrison Gate', description: "Commander Zhao's fortified headquarters and weapons court." },
    { id: 'graveyard', name: 'Mountain Shrine of Ancestors', description: "Monk Huikang's tranquil stone shrine and incense court." },
    { id: 'mill', name: 'Dragon Forge Workshop', description: "Master Guan's weaponsmithy and kiln." },
    { id: 'farm', name: 'Riverside Garden Plots', description: "Auntie Mei's fenced bamboo garden and vegetable beds." },
    { id: 'clinic', name: 'Apothecary Song Pavilion', description: "Scholar Song's clinic and medicine repository." },
  ],
  winter: [
    { id: 'crime_scene', name: 'Frosthold Frozen Pass', description: 'The windswept snowfield and frozen pass where the victim was discovered.' },
    { id: 'tavern', name: 'Hearthfire Tavern', description: "Torstein's warm timber tavern and stables." },
    { id: 'church', name: 'Ancient Heart Tree Grove', description: "Seer Valda's mystical weirwood shrine and frozen pool." },
    { id: 'graveyard', name: 'Frosthold Watchtower Keep', description: "Commander Bjorn's stone fortress and ramparts." },
    { id: 'mill', name: 'Abandoned Iron Quarry', description: "Durn's mining shaft, crane, and ore carts." },
    { id: 'farm', name: "Hunter's Smokehouse Cabin", description: "Einar's isolated log cabin and game racks." },
    { id: 'clinic', name: 'Execution Courtyard', description: "Warden Kenneth's gallows platform and watch enclosure." },
  ],
};

export function getScenarioConfig(
  scenarioType: string = 'medieval',
  difficulty: string = 'easy',
): ScenarioConfig {
  const normalizedScenario = normalizeScenarioType(scenarioType);
  const normalizedDifficulty = normalizeDifficulty(difficulty);

  let settingLabel = 'Ashenmoor';
  let worldDescription = 'Set in the dark, medieval village of Ashenmoor.';
  let styleInstruction = 'It should read like a grimdark medieval fantasy or historical detective novel.';
  let npcPool = MEDIEVAL_NPCS;

  if (normalizedScenario === 'modern') {
    settingLabel = 'Millfield, Kentucky (1994)';
    worldDescription =
      'Set in the eerie, small American town of "Millfield, Kentucky" in 1994. The atmosphere is like a dark Stephen King or Twin Peaks story - friendly faces hiding terrible secrets.';
    styleInstruction =
      'It should read like a 90s true-crime thriller or a small-town mystery novel. Use authentic 90s American small-town terms, culture references (VHS tapes, drive-in theaters, gas stations, CB radios), and keep the atmosphere tense and suffocating.';
    npcPool = MODERN_NPCS;
  } else if (normalizedScenario === 'cyberpunk') {
    settingLabel = 'Neon Prime';
    worldDescription = 'Set in a neon-lit, dystopian cyberpunk megacity named "Neon Prime".';
    styleInstruction =
      'It should read like a grim, tech-noir cyberpunk thriller. Use cyberpunk terminology such as cyberware, credits, neon, synths, black clinics, data brokers, and mega-corps.';
    npcPool = CYBERPUNK_NPCS;
  } else if (normalizedScenario === 'china') {
    settingLabel = 'Jinling (Hanedan Dönemi)';
    worldDescription = 'Set in the ancient Chinese city of Jinling during the Imperial Dynasty. The district is rich with ornate pavilions, tea houses, bamboo groves, and ancient shrines.';
    styleInstruction =
      'It should read like an atmospheric Chinese historical detective mystery or wuxia thriller (in the vein of Judge Dee). Use authentic period flavor, courtly etiquette, and references to tea ceremonies, dynasty magistrates, incense, jade, and martial honor.';
    npcPool = CHINA_NPCS;
  } else if (normalizedScenario === 'winter') {
    settingLabel = 'Frosthold';
    worldDescription = 'Set in the freezing, snow-covered northern stronghold of Frosthold, surrounded by ice cliffs and frozen forests.';
    styleInstruction =
      'It should read like a grim, frostbitten northern survival mystery or dark gothic fantasy. Emphasize the bitter freezing cold, wolf pelts, hearth fires, snowstorms, frozen tracks, and isolated paranoia.';
    npcPool = WINTER_NPCS;
  }

  const npcCount = normalizedDifficulty === 'easy' ? 4 : normalizedDifficulty === 'medium' ? 5 : 6;
  const npcDefinitions = npcPool.slice(0, npcCount);
  const locationDefinitions = LOCATION_LIBRARY[normalizedScenario].filter(
    (location) => location.id === 'crime_scene' || npcDefinitions.some((npc) => npc.id === location.id),
  );

  return {
    scenarioType: normalizedScenario,
    settingLabel,
    worldDescription,
    styleInstruction,
    npcDefinitions,
    locationDefinitions,
  };
}

export function getLocalizedLocationLabel(
  scenarioType: string,
  locationId: string,
): string {
  const normalizedScenario = normalizeScenarioType(scenarioType);
  return LOCALIZED_LOCATION_LABELS[normalizedScenario][locationId] ?? locationId;
}

function normalizeScenarioType(scenarioType: string): ScenarioType {
  if (scenarioType === 'modern' || scenarioType === 'cyberpunk' || scenarioType === 'china' || scenarioType === 'winter') return scenarioType;
  return 'medieval';
}

function normalizeDifficulty(difficulty: string): Difficulty {
  if (difficulty === 'medium' || difficulty === 'hard') return difficulty;
  return 'easy';
}
