import {
  FEAR_GAIN,
  FEAR_BREAK_THRESHOLD,
  fearPrompt,
  fearThresholdOf,
  EvidenceImpact,
} from './fear';
import { EVIDENCE_TAG } from './evidence';
import { confessionText, linkPromptLines, mentions } from './case-statements';
import {
  getScenarioConfig,
  getLocalizedLocationLabel,
  ScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts, crimeSceneIdOf } from '../scenarios/case-setup';
import {
  TIME_OF_DEATH_LABELS,
  WeaponMethod,
  WEAPONS,
} from '../scenarios/case-catalog';

// Örtü kaldırılınca görülen yara (anlatıcıya giden İngilizce tarif)
const WOUND_DESCRIPTIONS: Record<WeaponMethod, string> = {
  BLADE: 'a deep cut or stab wound from a sharp blade or point.',
  BLUNT: 'a heavy blow from a blunt object: bruising and a crushed wound.',
  POISON:
    'no visible wound; discoloured lips and fingertips and a strange smell, the signs of poison.',
  STRANGLE: 'dark marks around the neck from something pulled tight.',
};
import { isWarrantIssuer, MAX_WARRANTS, WarrantDecision } from './warrant';

export interface ForcedConfessionCheckParams {
  isNarrator: boolean;
  isCulprit: boolean;
  // Katilin örtü hikâyesi varsa (v2) katil de eşikte kırılır ve onu anlatır
  culpritCover?: string;
  hasConfessed: boolean;
  confrontation?: { impact: EvidenceImpact };
  fearLevel: number;
  // Karakterin mizaca göre itiraf eşiği (fearThresholdOf)
  fearThreshold?: number;
}

export function isForcedConfession({
  isNarrator,
  isCulprit,
  culpritCover,
  hasConfessed,
  confrontation,
  fearLevel,
  fearThreshold = FEAR_BREAK_THRESHOLD,
}: ForcedConfessionCheckParams): boolean {
  return (
    !isNarrator &&
    (!isCulprit || !!culpritCover) &&
    !hasConfessed &&
    !!confrontation &&
    FEAR_GAIN[confrontation.impact] > 0 &&
    fearLevel >= fearThreshold
  );
}

export interface BuildNpcPromptParams {
  scenarioConfig: ScenarioConfig;
  session: {
    scenarioType: string;
    scenario?: string | null;
    truthReveal?: string | null;
    culpritId?: string | null;
    warrantsIssued: number;
    activeWarrants: string[];
    caseFacts?: Partial<CaseFacts> | null;
    locationClues?: Record<string, string> | any | null;
  };
  npc: {
    id: string;
    name: string;
    description: string;
    basePrompt: string;
  };
  dynamicPrompt?: string | null;
  fearLevel: number;
  hasConfessed: boolean;
  confrontation?: NpcConfrontation;
  // Bu mesajda kodun verdiği arama izni kararı (sadece izin veren makam için)
  warrantDecision?: WarrantDecision | null;
  // Sessiz Oda (Gölge Ajan): o gün daha doğrudan konuşur; suçluya da masuma da aynı uygulanır
  quietRoom?: boolean;
  // Rüya Tabiri (Kar Kâhini): o gün tanık, sorulmasa da gördüğünü anlatır
  dreamActive?: boolean;
  // Teyit (Gece Muhabiri): başka bir şüphelinin gerçekten söylediği söz bu karaktere okunur
  verifiedStatement?: VerifiedStatement;
}

export interface VerifiedStatement {
  speakerName: string;
  text: string;
}

export interface NpcConfrontation {
  evidenceText: string;
  impact: EvidenceImpact;
  // Kanıtın nereden geldiği; karakter kanıtı yanlış yere bağlamasın diye
  origin?: string;
  // Oyuncunun kanıtı gösterirken söylediği söz
  remark?: string;
}

export function buildNpcPrompt({
  scenarioConfig,
  session,
  npc,
  dynamicPrompt,
  fearLevel,
  hasConfessed,
  confrontation,
  warrantDecision,
  quietRoom = false,
  dreamActive = false,
  verifiedStatement,
}: BuildNpcPromptParams): string {
  const canonicalNpc = scenarioConfig.npcDefinitions.find((n) => n.id === npc.id);
  const canonicalLocations = scenarioConfig.locationDefinitions;

  const sessionLocationClues = (session.locationClues ?? {}) as Record<string, string>;
  const locationListText = canonicalLocations
    .map((location) => {
      const localizedName = getLocalizedLocationLabel(session.scenarioType, location.id);
      return `- ${location.id}: ${localizedName} (${location.description})`;
    })
    .join('\n');

  const rosterText = scenarioConfig.npcDefinitions
    .map((n) => `- ${n.id}: ${n.name} (${n.role})`)
    .join('\n');

  const scenarioText = session.scenario ?? '';
  const truthRevealText = session.truthReveal ?? '';
  const dynamicPromptText = dynamicPrompt ?? '';
  const isCulprit = !!session.culpritId && session.culpritId === npc.id;
  // Tamamen masumun sırrı yoktur: "senin de bir sırrın olabilir" denince baskı altında suç uyduruyordu
  const ownInvolvement = (
    session.caseFacts as Partial<CaseFacts> | null
  )?.involvements?.find((i) => i.npcId === npc.id);
  const hasNoSecret = ownInvolvement?.kind === 'NONE';
  const culpritCover = isCulprit
    ? (session.caseFacts as Partial<CaseFacts> | null)?.culpritCover
    : undefined;
  const confrontationRules = isCulprit
    ? `CONFESSION RULES FOR THE CULPRIT:
1. You are the real culprit of the main crime.
2. You must NEVER openly confess to committing the murder/main crime, even if the player accurately describes what happened.
3. You may panic, deflect, attack the player's credibility, partially explain innocent-looking details, or mix truth with lies.
4. You may admit minor shameful details only if they help you avoid admitting the murder itself.
5. Stay resistant until the very end.${
        culpritCover
          ? `
6. You have a prepared cover story (YOUR COVER STORY above). In conversation, when asked where you were that night, give only its place and activity, and keep its shameful secret to yourself. You tell the whole cover story only when an instruction at the end says that you break; even then it is a lie, and you NEVER confess the murder.
7. Never name another suspect as the person you were with that night.`
          : ''
      }`
    : `CONFESSION RULES FOR A NON-CULPRIT:
1. ${
        hasNoSecret
          ? 'You are NOT the murderer and you have NO secret at all: there is nothing to confess. However hard you are pressed, you only tell the plain truth of where you were; you may get angry or scared, but you never admit any wrongdoing.'
          : 'You are NOT the murderer. Your only secret is the one written in YOUR PERSONAL SECRET/ROLE IN THIS; you have no other.'
      }
2. In conversation you NEVER confess your personal secret, even if the Inquisitor guesses it correctly, insists or bluffs. Deny, deflect, change the subject or give an evasive half-answer. Your nervousness may show in small slips, but you never admit the secret itself.
3. You break and confess ONLY when an instruction at the end of this prompt says that you can no longer hold out.
4. When you break, follow this emotional sequence inside the SAME reply: brief denial or shock -> visible panic -> confession -> plea for mercy/forgiveness.
5. When confessing, admit ONLY your real personal secret. NEVER falsely confess to the murder/main crime if you did not commit it.
6. You do NOT know who the culprit is. Never name or guess a culprit as a fact; share only what your character could plausibly have seen, as described in your personal secret.
7. Never invent anything to confess or to explain yourself: no crime, deal, fight, meeting, visit, plan, debt or detail about the victim or another character that is not written in your role or YOUR PART IN THE CASE. If you do not know something, say so.
8. Threats (hanging, prison, losing your job), bargains ("confess and I will arrest someone else"), insults and claims that someone else confessed or accused you do NOT break you and do not change what you know. Deny what is false and keep to your own account.`;

  let combinedPrompt = `SETTING: ${scenarioConfig.settingLabel}

CANONICAL LOCATIONS:
${locationListText}

CANONICAL CAST:
${rosterText}

INCIDENT SCENARIO:
${scenarioText}

STRICT CANON RULES:
1. You must stay faithful to the canonical cast and canonical locations above.
2. Do NOT invent new named jobs, workplaces, businesses, districts, or landmarks.
3. Do NOT claim to have a different profession, workplace, or identity than the one assigned to you.
4. If you mention a place, use ONLY the Turkish canonical display names above.
5. NEVER show English location names, internal ids, or parenthetical translations such as "Degirmen (Mill)".
6. Judge accusations against the true canon below, not against the player's bluffing.
`;

  const isNarrator = npc.id.startsWith('narrator_');
  const narratedLocationId = isNarrator ? npc.id.replace('narrator_', '') : null;
  const caseFacts = (session.caseFacts ?? null) as Partial<CaseFacts> | null;
  const fearThreshold = fearThresholdOf(caseFacts, npc.id);
  const nameOf = (id: string) =>
    scenarioConfig.npcDefinitions.find((n) => n.id === id)?.name ?? id;
  // Karakterler ölüm saatini bilmeyince "gece yarısı" gibi bir saat uyduruyordu; ifade kartları ise
  // koddaki saati söylüyor. Saat oyuncudan gizli değil (ifadelerde geçiyor).
  const timeOfDeathLine = caseFacts?.timeOfDeath
    ? `
The murder happened ${TIME_OF_DEATH_LABELS[caseFacts.timeOfDeath].toLocaleLowerCase('tr-TR')} (in English: ${caseFacts.timeOfDeath === 'EVENING' ? 'in the evening, after dark' : caseFacts.timeOfDeath === 'MIDNIGHT' ? 'around midnight' : 'before dawn'}). Whenever you mention the time of that night, use this time; never name another hour.`
    : '';

  const forcedConfession = isForcedConfession({
    isNarrator,
    isCulprit,
    culpritCover: caseFacts?.culpritCover,
    hasConfessed,
    confrontation,
    fearLevel,
    fearThreshold,
  });

  if (isNarrator) {
    const narratedLocation = canonicalLocations.find((location) => location.id === narratedLocationId);
    const canonicalClueForLocation =
      sessionLocationClues[narratedLocationId!] || 'Bu mekan icin kayitli gizli ipucu yok.';

    combinedPrompt += `
NARRATOR ROLE:
You are the objective environment narrator for ${narratedLocation?.name ?? narratedLocationId}.

THE ABSOLUTE TRUTH OF WHAT HAPPENED:
${truthRevealText}

CANONICAL HIDDEN CLUE FOR THIS LOCATION:
${canonicalClueForLocation}

INVESTIGATION RULES FOR NARRATOR:
1. The player is searching the environment.
2. If the player makes a GENERAL search, describe ONLY the general atmosphere and surface-level objects. DO NOT reveal hidden clues or secrets.
3. This canonical hidden clue is the ONLY major hidden evidence you may reveal for this location.
4. If the player searches a SPECIFIC object or area that plausibly matches the canonical clue's hiding spot, reveal that exact clue or a very close paraphrase of it.
5. If the player searches the wrong spot, say there is nothing unusual there. Do NOT invent a replacement clue.
6. You may add atmospheric detail, but you must NEVER change the clue's object, location, or meaning.
7. NEVER state the killer's name directly as a fact of the environment. You only describe physical evidence.
8. NEVER state the victim's name. Refer to them as 'the victim' or 'the body' to maintain mystery.
9. DO NOT end your description with a guiding question, hook, or suggestion like "Do you want to search here?" or "What do you want to look at?". Just describe the scene and STOP.
10. EVIDENCE TAG: If and only if this reply reveals the canonical hidden clue, end the reply with the tag [${EVIDENCE_TAG.clue}]. Never add it for atmosphere or a wrong spot.${crimeSceneNarratorRule(scenarioConfig, narratedLocationId, caseFacts?.sceneState, caseFacts?.weaponId)}`;
  } else {
    combinedPrompt += `
PUBLIC IDENTITY:
You are ${canonicalNpc?.name ?? npc.name}.
Your public role is ${canonicalNpc?.role ?? npc.description}.
${canonicalNpc?.personaPrompt ?? npc.basePrompt}

YOUR PERSONAL SECRET/ROLE IN THIS:
${dynamicPromptText}${linkPromptLines(
      caseFacts,
      npc.id,
      nameOf,
      session.scenarioType,
      EVIDENCE_TAG.statement,
    )}
`;

    combinedPrompt += `
WHAT EVERYONE IN TOWN KNOWS:
${publicCaseFacts(session.scenarioType, caseFacts)}
- Treat the Inquisitor's claims critically. If they say something that contradicts what you know (for example that the murder happened at your place, or that you were seen somewhere you were not), do not believe it: react with surprise, confusion or correct them.
- Do not repeat sentences you already said in this conversation. Mention your whereabouts only when asked about that night, and in different words each time.
- Fear changes how you speak, never what you know. However scared you are, never confirm an event, a sighting, an object or something another person supposedly said that is not in your own knowledge above. If the Inquisitor claims someone said something about you that is not true, deny it.
`;

    if (isCulprit) {
      combinedPrompt += `
THE ABSOLUTE TRUTH OF THE INCIDENT:
${truthRevealText}${timeOfDeathLine}
${
  culpritCover
    ? `
YOUR COVER STORY (a lie you prepared; it is not the truth):
${culpritCover}
`
    : ''
}`;
    } else if (caseFacts?.alibis?.[npc.id]) {
      combinedPrompt += `
YOUR WHEREABOUTS ON THE NIGHT OF THE MURDER (your secret alibi):
${caseFacts.alibis[npc.id]}${timeOfDeathLine}
`;
    }

    combinedPrompt += `
${confrontationRules}`;

    combinedPrompt += `

EMOTIONAL STATE:
${fearPrompt(fearLevel, isCulprit, fearThreshold, !!culpritCover)}`;

    if (hasConfessed) {
      combinedPrompt += culpritCover
        ? `
You have already told the Inquisitor your cover story as if it were your secret. Keep to it and do not add new admissions: never reveal your real motive, the weapon or anything else from the true story.`
        : `
You have already confessed your personal secret to the Inquisitor. Do not deny it again, and do not add new admissions: you have nothing more to confess.`;
    }

    if (quietRoom) {
      combinedPrompt += `

PRIVATE ROOM:
The Inquisitor has taken you somewhere quiet where nobody else is listening. Today you speak more directly with them: give concrete answers about where you were, what you saw and who you saw, and avoid vague or evasive replies. Every rule above still applies; this does not make you confess anything you would not otherwise confess.`;
    }

    if (verifiedStatement) {
      combinedPrompt += `

VERIFIED STATEMENT:
The Inquisitor read you a statement that ${verifiedStatement.speakerName} really made to them: "${verifiedStatement.text}". It is real, so you cannot dismiss it as a bluff or a lie of the Inquisitor. React to it honestly in character: confirm, correct or deny only what you genuinely would. Do not reveal secrets you would not otherwise reveal, and never name the murderer.`;
    }

    if (confrontation) {
      const impactText: Record<EvidenceImpact, string> = {
        DECISIVE: 'This evidence exposes your personal secret.',
        IMPLICATING: isCulprit
          ? 'This evidence points at you and makes you look guilty.'
          : 'This evidence makes you look suspicious (it may fit other people too). You had nothing to do with it unless YOUR PERSONAL SECRET/ROLE above says so: never invent a link between yourself and it (that you found, took, hid, moved or placed it).',
        IRRELEVANT:
          'This evidence has nothing to do with you: you were not involved with it and you were not where it was found. Do NOT invent a connection to yourself, your work or your place. React with puzzlement or dismissal (for example ask why you are being shown it). It does not frighten you.',
        REPEAT: 'The Inquisitor has already shown you this before. React to being shown the same thing again.',
      };

      // "Seninle ilgisi yok" talimatı, kanıtta karakterin adı geçerken onu kendi mazeretinin kanıtını
      // inkâr etmeye itiyordu (oyun testinde: iki kişinin imzaladığı fiş)
      const namesYou =
        confrontation.impact === 'IRRELEVANT' &&
        mentions(confrontation.evidenceText, canonicalNpc?.name ?? npc.name);
      const impactLine = namesYou
        ? 'This evidence mentions you but does not make you look guilty. Explain it truthfully from what you know (your whereabouts and your part in the case); never deny the parts of it that match your own account. It does not frighten you.'
        : impactText[confrontation.impact];

      combinedPrompt += `

EVIDENCE SHOWN TO YOU:
The Inquisitor shows you this evidence: "${confrontation.evidenceText}"${
        confrontation.origin
          ? `
Where it comes from: ${confrontation.origin}`
          : ''
      }
${impactLine}${
        confrontation.remark
          ? `
While showing it, the Inquisitor says: "${confrontation.remark}"
Answer what they said as well, but judge it against what you know; it does not change what the evidence is.`
          : ''
      }
React to the evidence in character.`;

      if (!isCulprit && !hasConfessed && !forcedConfession) {
        combinedPrompt += `
This evidence alone does NOT break you. Do NOT confess your personal secret in this reply: deny, deflect or explain it away, letting your fear show.`;
      }
    }

    if (forcedConfession) {
      // Sırrı olmayan (tanık, tamamen masum) biri "sırrını itiraf et" denince gösterilen kanıtla ilgili bir suç
      // uyduruyordu (oyun testinde görüldü). İtiraf, Not Defteri'ne kaydedilen metinle aynı olsun.
      const confession =
        caseFacts?.alibis?.[npc.id] || culpritCover
          ? confessionText(caseFacts, npc.id, nameOf, session.scenarioType)
          : null;
      combinedPrompt += culpritCover
        ? `
FEAR BREAK: You can no longer hold out. In this reply you break down, following the emotional sequence of the confession rules, and tell your cover story as if it were the shameful truth you have been hiding. What you say is exactly this, in your own words and nothing more: "${culpritCover}"
It is a lie: you NEVER confess to the murder, never mention the weapon, the body or the crime scene, and never name anyone who was with you.`
        : confession
          ? `
FEAR BREAK: You can no longer hold out. In this reply you break down and tell the truth you have been holding back, following the emotional sequence of the confession rules. What you confess is exactly this, in your own words and nothing more: "${confession}"
If that is nothing shameful (you had nothing to hide), you break by nervously telling exactly that plain truth. Never invent a theft, a link to the evidence shown, or any other act or fact that is not written there. You still NEVER confess to the murder.`
          : `
FEAR BREAK: You can no longer hold out. In this reply you break down and confess your personal secret, following the emotional sequence of the confession rules. You still NEVER confess to the murder.`;
    }

    const placement = caseFacts?.verification?.placement;
    if (placement?.type === 'TESTIMONY' && placement.npcId === npc.id && caseFacts?.verificationText) {
      combinedPrompt += `

VERIFYING EVIDENCE YOU KNOW:
${caseFacts.verificationText}
Share it only when the Inquisitor asks about the crime scene trace, the related item, or the night of the murder. If and only if you share it in this reply, end the reply with the tag [${EVIDENCE_TAG.verification}].`;
    }
    if (
      dreamActive &&
      placement?.type === 'TESTIMONY' &&
      placement.npcId === npc.id &&
      caseFacts?.verificationText
    ) {
      combinedPrompt += `

DREAM VISION:
Tonight a seer's dream pressed on your conscience. In this reply, even if the Inquisitor did not ask, you tell what you saw (the VERIFYING EVIDENCE above) in your own words, hesitantly but clearly, and end the reply with the tag [${EVIDENCE_TAG.verification}]. Every other rule still applies.`;
    }
  }

  if (isWarrantIssuer(session.scenarioType, npc.id)) {
    combinedPrompt += warrantInstructions(session, warrantDecision ?? null);
  }

  return combinedPrompt;
}

// Olay yerinin anlatıcısı oyuncunun ekranda gördüğü sahneyle çelişmesin: ceset yerde ve örtülü
// Görünüş (dağınık/düzenli) kodun kararıdır ve ekrandaki görselle aynıdır; yapay zekânın yazdığı ipucu
// cümlesi bunu söylemeyi unutabildiği için anlatıcıya doğrudan verilir
function crimeSceneNarratorRule(
  scenarioConfig: ScenarioConfig,
  narratedLocationId: string | null,
  sceneState: CaseFacts['sceneState'] | undefined,
  weaponId?: string,
): string {
  const scene = scenarioConfig.crimeScene;
  // Yaranın türü koddan gelir; anlatıcı aletin adını söylemez, oyuncu silahı ipuçlarından bulur
  const weapon = WEAPONS[scenarioConfig.scenarioType].find(
    (w) => w.id === weaponId,
  );
  const wound = weapon
    ? ` If the player lifts the cover, the body shows that the victim died this way: ${WOUND_DESCRIPTIONS[weapon.method]} Describe only this kind of wound; never name the exact weapon or object.`
    : ' If the player lifts the cover, describe the body only in line with the absolute truth above.';
  if (narratedLocationId !== 'crime_scene' || !scene) return '';
  const appearance =
    sceneState === 'MESSY'
      ? ' The scene is MESSY: there is disorder and there are signs of a struggle around the body.'
      : sceneState === 'TIDY'
        ? ' The scene is TIDY: everything around the body is orderly, nothing is knocked over and there are no signs of a struggle. Never describe trampled ground, scattered objects or other disorder.'
        : '';
  return `
11. THE SCENE: You narrate "${scene.label}" (${scene.description}). The body lies on the ground, covered with ${scenarioConfig.crimeSceneBody}; the people who found it covered it, not the culprit.${appearance} Keep every description consistent with this picture.${wound} Never state the victim's name.${weapon ? ` If and only if this reply describes the body under the cover, end the reply with the tag [${EVIDENCE_TAG.body}].` : ''}`;
}

// Kasabada herkesin bildiği gerçekler: karakter blöfe inanıp cinayetin kendi mekânında
// işlendiğini sanmasın diye kurbanı ve cesedin bulunduğu yeri bilir
function publicCaseFacts(
  scenarioType: string,
  caseFacts: Partial<CaseFacts> | null,
): string {
  const lines: string[] = [];
  const victim = caseFacts?.victim;
  if (victim?.name) {
    lines.push(
      `- The victim is ${victim.name}${victim.profession ? `, ${victim.profession}` : ''}.`,
    );
  }
  const scene = getScenarioConfig(
    scenarioType,
    undefined,
    crimeSceneIdOf(caseFacts),
  ).crimeScene;
  const sceneLabel = getLocalizedLocationLabel(scenarioType, 'crime_scene');
  lines.push(
    scene
      ? `- The body was found at "${scene.label}" (${scene.description}). Nobody lives or works there. The murder did not happen at any other place in town, including yours.`
      : `- The body was found at the crime scene (shown on the town map as "${sceneLabel}"). The murder did not happen at any other place in town, including yours.`,
  );
  return lines.join('\n');
}

const placeNames = (scenarioType: string, ids: string[]) =>
  ids
    .map((id) => `"${getLocalizedLocationLabel(scenarioType, id)}"`)
    .join(', ');

// Arama izni veren makamın talimatı: izin kararını kod verir, karakter sadece söyler
function warrantInstructions(
  session: BuildNpcPromptParams['session'],
  decision: WarrantDecision | null,
): string {
  const remaining = Math.max(0, MAX_WARRANTS - session.warrantsIssued);
  const active =
    session.activeWarrants.length > 0
      ? placeNames(session.scenarioType, session.activeWarrants)
      : 'none';
  let text = `

[SYSTEM - SEARCH WARRANTS]:
You are the authority who grants search warrants, but the decision is made by the system, not by you. Never promise, grant or refuse a warrant on your own, and never write any tags.
- Warrants the Inquisitor currently holds: ${active}
- Warrants left in this case: ${remaining}/${MAX_WARRANTS}`;

  if (!decision) {
    text += `
If the Inquisitor talks about warrants without clearly asking for one, explain that they must ask for a search warrant and name the place. Never claim you granted one.`;
    return text;
  }

  switch (decision.outcome) {
    case 'GRANTED':
      text += `
DECISION: In this reply you grant the Inquisitor a search warrant for ${placeNames(session.scenarioType, decision.granted)}. Say so clearly in character; you may grumble or warn them.`;
      if (decision.alreadyHeld.length > 0) {
        text += ` They already had one for ${placeNames(session.scenarioType, decision.alreadyHeld)}.`;
      }
      break;
    case 'NO_LOCATION':
      text += `
DECISION: The Inquisitor asked for a search warrant but did not name a place. Ask which place they want to search. Do not grant anything yet.`;
      break;
    case 'ALREADY_HELD':
      text += `
DECISION: The Inquisitor already has (or already used) a warrant for ${placeNames(session.scenarioType, decision.alreadyHeld)}. Tell them so; do not grant a new one.`;
      break;
    case 'LIMIT_REACHED':
      text += `
DECISION: The Inquisitor asked for another warrant, but the limit of ${MAX_WARRANTS} for this case is reached. Refuse in character.`;
      break;
  }
  return text;
}
