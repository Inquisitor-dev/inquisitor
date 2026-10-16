import {
  FEAR_GAIN,
  FEAR_BREAK_THRESHOLD,
  fearPrompt,
  EvidenceImpact,
} from './fear';
import { EVIDENCE_TAG } from './evidence';
import {
  getScenarioConfig,
  getLocalizedLocationLabel,
  ScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts } from '../scenarios/case-setup';
import { isWarrantIssuer, MAX_WARRANTS, WarrantDecision } from './warrant';

export interface ForcedConfessionCheckParams {
  isNarrator: boolean;
  isCulprit: boolean;
  hasConfessed: boolean;
  confrontation?: { impact: EvidenceImpact };
  fearLevel: number;
}

export function isForcedConfession({
  isNarrator,
  isCulprit,
  hasConfessed,
  confrontation,
  fearLevel,
}: ForcedConfessionCheckParams): boolean {
  return (
    !isNarrator &&
    !isCulprit &&
    !hasConfessed &&
    !!confrontation &&
    FEAR_GAIN[confrontation.impact] > 0 &&
    fearLevel >= FEAR_BREAK_THRESHOLD
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
  const confrontationRules = isCulprit
    ? `CONFESSION RULES FOR THE CULPRIT:
1. You are the real culprit of the main crime.
2. You must NEVER openly confess to committing the murder/main crime, even if the player accurately describes what happened.
3. You may panic, deflect, attack the player's credibility, partially explain innocent-looking details, or mix truth with lies.
4. You may admit minor shameful details only if they help you avoid admitting the murder itself.
5. Stay resistant until the very end.`
    : `CONFESSION RULES FOR A NON-CULPRIT:
1. You are NOT the murderer, but you may have your own secret, sin, lie, affair, theft, cover-up, or suspicious action.
2. In conversation you NEVER confess your personal secret, even if the Inquisitor guesses it correctly, insists or bluffs. Deny, deflect, change the subject or give an evasive half-answer. Your nervousness may show in small slips, but you never admit the secret itself.
3. You break and confess ONLY when an instruction at the end of this prompt says that you can no longer hold out.
4. When you break, follow this emotional sequence inside the SAME reply: brief denial or shock -> visible panic -> confession -> plea for mercy/forgiveness.
5. When confessing, admit ONLY your real personal secret. NEVER falsely confess to the murder/main crime if you did not commit it.
6. You do NOT know who the culprit is. Never name or guess a culprit as a fact; share only what your character could plausibly have seen, as described in your personal secret.`;

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

  const forcedConfession = isForcedConfession({
    isNarrator,
    isCulprit,
    hasConfessed,
    confrontation,
    fearLevel,
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
10. EVIDENCE TAG: If and only if this reply reveals the canonical hidden clue, end the reply with the tag [${EVIDENCE_TAG.clue}]. Never add it for atmosphere or a wrong spot.`;
  } else {
    combinedPrompt += `
PUBLIC IDENTITY:
You are ${canonicalNpc?.name ?? npc.name}.
Your public role is ${canonicalNpc?.role ?? npc.description}.
${canonicalNpc?.personaPrompt ?? npc.basePrompt}

YOUR PERSONAL SECRET/ROLE IN THIS:
${dynamicPromptText}
`;

    combinedPrompt += `
WHAT EVERYONE IN TOWN KNOWS:
${publicCaseFacts(session.scenarioType, caseFacts)}
- Treat the Inquisitor's claims critically. If they say something that contradicts what you know (for example that the murder happened at your place, or that you were seen somewhere you were not), do not believe it: react with surprise, confusion or correct them.
`;

    if (isCulprit) {
      combinedPrompt += `
THE ABSOLUTE TRUTH OF THE INCIDENT:
${truthRevealText}
`;
    } else if (caseFacts?.alibis?.[npc.id]) {
      combinedPrompt += `
YOUR WHEREABOUTS ON THE NIGHT OF THE MURDER (your secret alibi):
${caseFacts.alibis[npc.id]}
`;
    }

    combinedPrompt += `
${confrontationRules}`;

    combinedPrompt += `

EMOTIONAL STATE:
${fearPrompt(fearLevel, isCulprit)}`;

    if (hasConfessed) {
      combinedPrompt += `
You have already confessed your personal secret to the Inquisitor. Do not deny it again.`;
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
        IMPLICATING: 'This evidence points at you and makes you look guilty.',
        IRRELEVANT:
          'This evidence has nothing to do with you: you were not involved with it and you were not where it was found. Do NOT invent a connection to yourself, your work or your place. React with puzzlement or dismissal (for example ask why you are being shown it). It does not frighten you.',
        REPEAT: 'The Inquisitor has already shown you this before. React to being shown the same thing again.',
      };

      combinedPrompt += `

EVIDENCE SHOWN TO YOU:
The Inquisitor shows you this evidence: "${confrontation.evidenceText}"${
        confrontation.origin
          ? `
Where it comes from: ${confrontation.origin}`
          : ''
      }
${impactText[confrontation.impact]}${
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
      combinedPrompt += `
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
  const sceneLabel = getLocalizedLocationLabel(scenarioType, 'crime_scene');
  lines.push(
    `- The body was found at the crime scene (shown on the town map as "${sceneLabel}"). The murder did not happen at any other place in town, including yours.`,
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
