export type ScenarioType = 'medieval' | 'modern' | 'cyberpunk';
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
    role: 'Owner of Randy’s VHS Paradise video rental store',
    personaPrompt:
      'You are a chatty video store owner who knows too much about everybody’s tastes and nightly habits. Pop-culture references come naturally to you, but when threatened you turn slippery, defensive, and opportunistic.',
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
    name: 'Aldric',
    role: 'Owner of the Neon Neon synth-bar',
    personaPrompt:
      'You run a neon-soaked bar where every deal leaves a ghost in the air. You are streetwise, guarded, and fluent in half-truths, speaking like someone who survives by never being fully known.',
  },
  {
    id: 'church',
    name: 'Malachar',
    role: 'Leader of the Digital Ascension tech-cult',
    personaPrompt:
      'You are a charismatic cult leader who wraps manipulation in polished doctrine. You speak with eerie calm, sacred certainty, and the practiced confidence of someone used to followers obeying without question.',
  },
  {
    id: 'graveyard',
    name: 'Silas',
    role: 'Data-crypt scavenger and body recycler',
    personaPrompt:
      'You sift through the city’s dead hardware and dead flesh with equal ease. Your speech is fragmented, cynical, and strangely poetic, as if the megacity hums inside your skull.',
  },
  {
    id: 'mill',
    name: 'Giles',
    role: 'Foreman of the corp-processing factory',
    personaPrompt:
      'You are a factory foreman hardened by quotas, noise, and corporate indifference. You speak in blunt, industrial terms and treat morality like just another failing machine part.',
  },
  {
    id: 'farm',
    name: 'Edmund',
    role: 'Hydroponics lab operator',
    personaPrompt:
      'You manage synthetic crops in a sterile hydroponics stack and distrust anyone who treats living systems carelessly. You are practical, anxious, and quick to hide the compromises required to keep food flowing.',
  },
  {
    id: 'clinic',
    name: 'Doc Harland',
    role: 'Ripperdoc and black-market surgeon',
    personaPrompt:
      'You are a meticulous back-alley surgeon who sees flesh and chrome as interchangeable inventory. Your tone is cool, precise, and faintly contemptuous of people who cannot face what bodies really are.',
  },
];

const LOCATION_LIBRARY: Record<ScenarioType, ScenarioLocationDefinition[]> = {
  medieval: [
    { id: 'crime_scene', name: 'Ashenmoor crime scene', description: 'The primary murder site being investigated.' },
    { id: 'tavern', name: 'Ashenmoor tavern', description: 'Brother Aldric’s inn and gathering place for gossip.' },
    { id: 'church', name: 'Ashenmoor church', description: 'Father Malachar’s church and seat of village piety.' },
    { id: 'graveyard', name: 'Ashenmoor graveyard', description: 'Old Silas’s burial grounds at the village edge.' },
    { id: 'mill', name: 'Ashenmoor mill', description: 'Giles’s mill where work and rumor mix.' },
    { id: 'farm', name: 'Edmund’s farm', description: 'The isolated farmland outside the village.' },
    { id: 'clinic', name: 'Doctor Harland’s clinic', description: 'The healer’s austere place of treatment and secrets.' },
  ],
  modern: [
    { id: 'crime_scene', name: 'Millfield crime scene', description: 'The primary murder site under active investigation.' },
    { id: 'tavern', name: 'Millfield Sheriff Station', description: 'Sheriff Dale Cooper’s station house.' },
    { id: 'graveyard', name: 'Randy’s VHS Paradise', description: 'The local video rental store run by Randy Kowalski.' },
    { id: 'church', name: 'Millfield Baptist Church', description: 'Pastor Gerald’s church and community hub.' },
    { id: 'farm', name: 'Edgeway Gas & Service', description: 'Earl Hutchins’s gas station on the edge of town.' },
    { id: 'clinic', name: 'Bellamy Trailer Park', description: 'Old Marge Bellamy’s trailer park community.' },
    { id: 'mill', name: 'Millfield Drive-In Theater', description: 'Donna Perkins’s drive-in theater and ticket booth.' },
  ],
  cyberpunk: [
    { id: 'crime_scene', name: 'Neon Prime crime scene', description: 'The primary incident site under investigation.' },
    { id: 'tavern', name: 'Neon Neon synth-bar', description: 'Aldric’s synth-bar soaked in music and vice.' },
    { id: 'church', name: 'Digital Ascension temple', description: 'Malachar’s tech-cult sanctuary.' },
    { id: 'graveyard', name: 'The data-crypt', description: 'Silas’s scavenging ground of dead code and bodies.' },
    { id: 'mill', name: 'Corp-processing factory', description: 'Giles’s industrial production complex.' },
    { id: 'farm', name: 'Hydroponics stack', description: 'Edmund’s synthetic agriculture lab.' },
    { id: 'clinic', name: 'Harland’s ripperdoc clinic', description: 'Doc Harland’s black-market surgical den.' },
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
      'Set in the eerie, small American town of "Millfield, Kentucky" in 1994. The atmosphere is like a dark Stephen King or Twin Peaks story — friendly faces hiding terrible secrets.';
    styleInstruction =
      'It should read like a 90s true-crime thriller or a small-town mystery novel. Use authentic 90s American small-town terms, culture references (VHS tapes, drive-in theaters, gas stations, CB radios), and keep the atmosphere tense and suffocating.';
    npcPool = MODERN_NPCS;
  } else if (normalizedScenario === 'cyberpunk') {
    settingLabel = 'Neon Prime';
    worldDescription = 'Set in a neon-lit, dystopian cyberpunk megacity named "Neon Prime".';
    styleInstruction =
      'It should read like a grim, tech-noir cyberpunk thriller. Use cyberpunk terminology such as cyberware, credits, neon, synths, and mega-corps.';
    npcPool = CYBERPUNK_NPCS;
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

function normalizeScenarioType(scenarioType: string): ScenarioType {
  if (scenarioType === 'modern' || scenarioType === 'cyberpunk') return scenarioType;
  return 'medieval';
}

function normalizeDifficulty(difficulty: string): Difficulty {
  if (difficulty === 'medium' || difficulty === 'hard') return difficulty;
  return 'easy';
}
