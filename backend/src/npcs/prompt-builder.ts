import {
  FEAR_GAIN,
  FEAR_BREAK_THRESHOLD,
  fearPrompt,
} from './fear';
import { EVIDENCE_TAG, EvidenceImpact } from './evidence';
import {
  getScenarioConfig,
  getLocalizedLocationLabel,
  ScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts } from '../scenarios/case-setup';
import { isWarrantIssuer } from './warrant';

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
    scenario: string;
    truthReveal: string;
    culpritId: string;
    warrantsIssued: number;
    activeWarrants: string[];
    caseFacts?: CaseFacts | null;
    locationClues?: Record<string, string> | null;
  };
  npc: {
    id: string;
    name: string;
    description: string;
    basePrompt: string;
  };
  dynamicPrompt: string;
  fearLevel: number;
  hasConfessed: boolean;
  confrontation?: { evidenceText: string; impact: EvidenceImpact };
}

export function buildNpcPrompt({
  scenarioConfig,
  session,
  npc,
  dynamicPrompt,
  fearLevel,
  hasConfessed,
  confrontation,
}: BuildNpcPromptParams): string {
  const canonicalNpc = scenarioConfig.npcDefinitions.find((n) => n.id === npc.id);
  const canonicalLocations = scenarioConfig.locationDefinitions;
  const canonicalLocationIds = canonicalLocations
    .filter((loc) => loc.id !== 'crime_scene')
    .map((loc) => loc.id);

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

  const isCulprit = session.culpritId === npc.id;
  const confrontationRules = isCulprit
    ? `CONFESSION RULES FOR THE CULPRIT:
1. You are the real culprit of the main crime.
2. You must NEVER openly confess to committing the murder/main crime, even if the player accurately describes what happened.
3. You may panic, deflect, attack the player's credibility, partially explain innocent-looking details, or mix truth with lies.
4. You may admit minor shameful details only if they help you avoid admitting the murder itself.
5. Stay resistant until the very end.`
    : `CONFESSION RULES FOR A NON-CULPRIT:
1. You are NOT the murderer, but you may have your own secret, sin, lie, affair, theft, cover-up, or suspicious action.
2. If the player makes only a vague accusation, you should deny or deflect.
3. If the player confronts you with a SPECIFIC and SUBSTANTIALLY CORRECT accusation that matches your true secret in the PERSONAL SECRET section, you must break.
4. When you break, follow this emotional sequence inside the SAME reply: brief denial or shock -> visible panic -> confession -> plea for mercy/forgiveness.
5. When confessing, admit ONLY your real personal secret. NEVER falsely confess to the murder/main crime if you did not commit it.
6. If the player's accusation is wrong, exaggerated, or aimed at the wrong secret, continue to deny it.
7. Once the player has correctly cornered you about your true secret, stop endlessly inventing new excuses.
8. You do NOT know who the culprit is. Never name or guess a culprit as a fact; share only what your character could plausibly have seen, as described in your personal secret.`;

  let combinedPrompt = `SETTING: ${scenarioConfig.settingLabel}

CANONICAL LOCATIONS:
${locationListText}

CANONICAL CAST:
${rosterText}

INCIDENT SCENARIO:
${session.scenario}

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
  const caseFacts = (session.caseFacts ?? null) as CaseFacts | null;

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
${session.truthReveal}

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
${dynamicPrompt}
`;

    if (isCulprit) {
      combinedPrompt += `
THE ABSOLUTE TRUTH OF THE INCIDENT:
${session.truthReveal}
`;
    } else if (caseFacts?.alibis?.[npc.id]) {
      combinedPrompt += `
YOUR WHEREABOUTS ON THE NIGHT OF THE MURDER (your secret alibi):
${caseFacts.alibis[npc.id]}
`;
    }

    combinedPrompt += `
${confrontationRules}`;

    if (!isCulprit) {
      combinedPrompt += `
9. EVIDENCE TAG: If and only if you confess your personal secret in this reply, end the reply with the tag [${EVIDENCE_TAG.confession}].`;
    }

    combinedPrompt += `

EMOTIONAL STATE:
${fearPrompt(fearLevel, isCulprit)}`;

    if (hasConfessed) {
      combinedPrompt += `
You have already confessed your personal secret to the Inquisitor. Do not deny it again.`;
    }

    if (confrontation) {
      const impactText: Record<EvidenceImpact, string> = {
        DECISIVE: 'This evidence exposes your personal secret.',
        IMPLICATING: 'This evidence points at you and makes you look guilty.',
        IRRELEVANT:
          'This evidence has nothing to do with you. You may be puzzled or dismissive, but it does not frighten you.',
        REPEAT: 'The Inquisitor has already shown you this before. React to being shown the same thing again.',
      };

      combinedPrompt += `

EVIDENCE SHOWN TO YOU:
The Inquisitor silently shows you this evidence: "${confrontation.evidenceText}"
${impactText[confrontation.impact]}
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
  }

  if (isWarrantIssuer(session.scenarioType, npc.id)) {
    const issuedCount = session.warrantsIssued;
    const activeCount = session.activeWarrants.length;
    const remaining = 2 - issuedCount;

    let warrantInfo = `\n\n[SYSTEM - SEARCH WARRANT STATUS]:
- Total Warrants Issued in Session: ${issuedCount}/2
- Currently Active Warrants: ${activeCount > 0 ? session.activeWarrants.join(', ') : 'None'}
- Remaining Warrants You Can Grant: ${remaining}
- Canonical Searchable Location IDs: ${canonicalLocationIds.join(', ')}`;

    if (remaining > 0) {
      warrantInfo += `\n\nIMPORTANT: You can grant up to ${remaining} more search warrant(s). If the player clearly and directly asks for a search warrant / arama izni for one or more canonical locations, you MUST grant them (up to the remaining number) in this reply: you may grumble, warn or doubt in words, but you do not refuse. Never grant one proactively and never in response to a generic question. Only grant warrants for canonical location IDs from this list: ${canonicalLocationIds.join(', ')}. To grant, use [GRANT_WARRANT: location_id] tags.`;
    } else {
      warrantInfo += `\n\nIMPORTANT: You have reached the limit of 2 warrants. Do NOT grant any more.`;
    }
    combinedPrompt += warrantInfo;
  }

  return combinedPrompt;
}
