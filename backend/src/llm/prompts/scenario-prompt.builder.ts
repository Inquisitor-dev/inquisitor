import {
  getLocalizedLocationLabel,
  getScenarioConfig,
  type ScenarioLocationDefinition,
  type ScenarioNpcDefinition,
} from '../../scenarios/scenario-config';
import type { CasePlan } from '../../scenarios/case-setup';
import {
  MOTIVE_LABELS,
  TIME_OF_DEATH_LABELS,
  WEAPON_METHOD_LABELS,
  WEAPONS,
} from '../../scenarios/case-catalog';
import { normalizeScenarioType } from '../../scenarios/scenario-config';

export type ScenarioDraft = {
  scenario: string;
  truthReveal: string;
  culpritId: string;
  npcPrompts: Record<string, string>;
  locationClues: Record<string, string>;
  // Vaka gerçeklerinin yapay zekâ tarafından yazılan kısmı (case-setup.ts CaseFacts)
  victim?: { name: string; profession: string };
  verificationText?: string;
  alibis?: Record<string, string>;
  // Yanılabilen tanıklık: tanığın gördüğü kişinin eşkâli (adı değil)
  witnessDescription?: string;
  // Katilin örtü hikâyesi: kırıldığında itiraf diye anlattığı yalan mazeret ve küçük sır
  culpritCover?: string;
};

// Kodun belirlediği vaka gerçeklerini yapay zekâya talimat olarak anlatır
export function buildCaseBrief(
  plan: CasePlan,
  scenarioType: string,
  npcNames: Record<string, string>,
): string {
  const who = (id: string) => `"${id}" (${npcNames[id] ?? id})`;
  const place = (id: string) =>
    `"${id}" (${getLocalizedLocationLabel(scenarioType, id)})`;
  const { crimeSceneClue, verification } = plan;

  const clueLine = crimeSceneClue.authentic
    ? `- CRIME SCENE CLUE (GENUINE): The culprit accidentally left this real trace. The 'crime_scene' clue MUST describe exactly this trace: "${crimeSceneClue.poolClueText}". Keep the same object, smell or mark and its meaning, but write the clue as one natural Turkish sentence together with its exact position at the scene. Do not paste the text in mid-sentence and do not repeat words such as "olay yerinde".`
    : `- CRIME SCENE CLUE (PLANTED): The culprit deliberately planted a fake clue to frame ${crimeSceneClue.implicatedNpcIds.map(who).join(' and ')}. Invent ONE concrete object or trace that is clearly linked to ${crimeSceneClue.implicatedNpcIds.length > 1 ? 'EACH of these people (for example something they share, or one mark for each of them; the clue names or clearly points at every one of them)' : 'this person'} (something they own, make or use) and to nobody else, and put it in the 'crime_scene' clue.`;

  const { placement } = verification;
  let verificationLine: string;
  if (verification.kind === 'CORROBORATION') {
    verificationLine =
      placement.type === 'LOCATION'
        ? `- VERIFYING EVIDENCE: The ${place(placement.locationId)} location clue MUST be physical evidence at the culprit's own place that matches the crime scene trace (for example the same material, the same item, or the rest of it). This replaces the usual secret clue of that location.`
        : verification.witnessDescriptionFits
          ? `- VERIFYING EVIDENCE (A WITNESS WHO DOES NOT KNOW WHO IT WAS): The innocent ${who(placement.npcId)} saw a figure at the murder location around the time of death, connected to the crime scene trace, but could NOT see the face. Invent ONE visible detail (build, height, gait, a cloak or hood, something carried, a smell) that is believable for EACH of these suspects given their role and usual look, and fits nobody else in the cast; avoid work clothes that only one of them would wear: ${verification.witnessDescriptionFits.map(who).join(', ')}. Return it in "witnessDescription" as a short Turkish phrase (for example "uzun boylu, deri önlüklü biri"). The witness never names or guesses anyone. Their npcPrompt MUST describe what they saw, and say they reveal it when the Inquisitor asks about the trace or about the night of the murder. "verificationText" states this sighting WITHOUT any suspect's name.`
          : `- VERIFYING EVIDENCE: The innocent ${who(placement.npcId)} witnessed something that links the culprit to the crime scene trace, without seeing who it was. Their npcPrompt MUST describe exactly what they saw, and say they reveal it when the Inquisitor asks about the trace or about the night of the murder. Neither the npcPrompt nor "verificationText" names or hints at the culprit.`;
  } else {
    verificationLine =
      placement.type === 'LOCATION'
        ? `- VERIFYING EVIDENCE: The ${place(placement.locationId)} location clue MUST show that the planted item was taken from there before the murder (for example an empty hook, a forced lock, or the matching missing piece). This replaces the usual secret clue of that location.`
        : placement.npcId === crimeSceneClue.implicatedNpcIds[0]
          ? `- VERIFYING EVIDENCE: The framed person ${who(placement.npcId)} noticed that the planted item went missing shortly before the murder. Their npcPrompt MUST say this, and that they mention it when the Inquisitor asks about the item.`
          : `- VERIFYING EVIDENCE: The innocent ${who(placement.npcId)} saw someone take the planted item from ${who(crimeSceneClue.implicatedNpcIds[0])}'s place shortly before the murder, but could not see who it was (for example «karanlıktı, kapüşonluydu, arkası dönüktü»). Their npcPrompt MUST describe this, and say they reveal it when asked about the item or that night. Neither the npcPrompt nor "verificationText" names, describes or guesses who took it: the witness does not know.`;
  }

  return `CASE FACTS (decided by the game engine; do NOT change them). The ids in quotes ("mill", "tavern"…) are for you only: never write them in any text you return; always use the character's name. Every text you return is Turkish: no English words, even inside a Turkish sentence:
- CULPRIT: ${who(plan.culpritId)}. Innocent suspects: ${plan.innocentIds.map(who).join(', ')}.
- MURDER STYLE: ${plan.murderStyle === 'HURRIED' ? 'HURRIED (unplanned, the culprit panicked)' : 'PLANNED (premeditated, the culprit staged the scene)'}.
${crimeSceneLine(plan, scenarioType)}
- CRIME SCENE APPEARANCE: ${plan.sceneState === 'MESSY' ? 'MESSY (disorder, signs of struggle)' : 'TIDY (orderly, almost nothing out of place)'}. The 'crime_scene' clue MUST describe the scene this way. The appearance does NOT tell whether the clue is genuine or planted; explain the appearance naturally in truthReveal.
${clueLine}
${verificationLine}
- Return "verificationText": one Turkish sentence that states the verifying evidence above as a fact.
- VICTIM: Invent the victim's full name and profession and return them in "victim". The 'scenario' text must NOT reveal the name, but the NPCs knew the victim and may talk about them.
- ALIBIS: Each innocent's secret MUST also give them an alibi for the time of the murder (where they really were and why they hide it). A FULLY INNOCENT suspect (see below) has no secret: their alibi is ordinary and they hide nothing. Return "alibis" with one Turkish sentence for each innocent: ${plan.innocentIds.map((id) => `"${id}"`).join(', ')}. The culprit has no true alibi and may lie about one.${caseDetailsLines(plan, scenarioType, who)}`;
}

// Vaka Motoru v2: silah, motif, ölüm saati ve masumların cinayete bağlı sırları. Kod seçer, yapay zekâ
// yalnızca etrafına hikâye yazar. Eski planlarda bu alanlar yoktur ve satırlar eklenmez.
function caseDetailsLines(
  plan: CasePlan,
  scenarioType: string,
  who: (id: string) => string,
): string {
  const lines: string[] = [];
  const weapon = WEAPONS[normalizeScenarioType(scenarioType)].find(
    (w) => w.id === plan.weaponId,
  );
  if (weapon) {
    lines.push(
      `- MURDER WEAPON: ${weapon.label} (cause of death: ${WEAPON_METHOD_LABELS[weapon.method]}). truthReveal MUST say the victim was killed with it. Under the cover, the body shows wounds of exactly this kind.`,
    );
  }
  if (plan.motive) {
    lines.push(
      `- MOTIVE: ${MOTIVE_LABELS[plan.motive]}. This is why the culprit killed. truthReveal explains it. When the verifying evidence is not at the culprit's place, the culprit's location clue shows this motive.`,
    );
  }
  if (plan.timeOfDeath) {
    lines.push(
      `- TIME OF DEATH: ${TIME_OF_DEATH_LABELS[plan.timeOfDeath]}. Every alibi covers exactly this time, and every witness saw what they saw around this time.`,
    );
  }
  const placement = plan.verification.placement;
  if (plan.motive) {
    // Katil de eşikte kırılır; kırılmayan tek kişi katil olsaydı korku göstergesi onu söylerdi
    const ownPlace = getLocalizedLocationLabel(scenarioType, plan.culpritId);
    const clueAtCulprit =
      placement.type === 'LOCATION' && placement.locationId === plan.culpritId;
    lines.push(
      `- CULPRIT'S COVER STORY: Return "culpritCover": what ${who(plan.culpritId)} tells when the Inquisitor finally breaks them, a prepared lie in one or two Turkish sentences, in the first person. (1) Where they claim they were at the time of death: alone at their own place (${ownPlace}), doing something ordinary; never with any other suspect and never at the murder location. (2) A small shameful secret that explains why they hid it (both parts are required): ${clueAtCulprit ? 'a quarrel, a debt or a hidden deal with the victim' : 'it innocently explains their own location clue (the motive clue), for example a debt, a quarrel or a hidden deal with the victim'}. It never mentions the murder, the weapon, blood, the crime scene or another suspect. truthReveal says this story is a lie. The culprit's npcPrompt does not mention confessing or breaking.`,
    );
  }
  const witnessId = placement.type === 'TESTIMONY' ? placement.npcId : null;
  const secretLines = (plan.involvements ?? [])
    .filter((inv) => inv.npcId !== witnessId)
    .map((inv) => {
      const npc = who(inv.npcId);
      const about = inv.aboutNpcId ? who(inv.aboutNpcId) : '';
      switch (inv.kind) {
        case 'WITNESS':
          return `  - ${npc} WITNESS: around the time of death they clearly saw ${about} somewhere else, far from the murder location: at the very place ${about}'s own alibi in 'alibis' names. Their npcPrompt names that place itself (for example "I saw her at the back door of the clinic"), never the word "alibi". Their npcPrompt says this, and that they tell it when the Inquisitor asks about the murder location or that night. Their own secret and alibi stay as usual.`;
        case 'SHARED_MOTIVE':
          return `  - ${npc} HAD THEIR OWN MOTIVE: they also had a reason to resent the victim (a different reason than the culprit's), which makes them look guilty. Their secret and alibi still clear them. Their npcPrompt mentions the grudge; they deny caring about it.`;
        case 'UNWITTING_HELP':
          return `  - ${npc} HELPED WITHOUT KNOWING: shortly before the murder they gave, lent or sold the murder weapon (${weapon?.label ?? 'the weapon'}) to ${about}, with no idea what it was for. They know very well whom they gave it to: their npcPrompt says so and that they keep it to themselves (never "I did not see who it was"). The npcPrompt does not mention confessing, being cornered or breaking: the game decides that. Their location clue shows where the weapon used to be or a record of the deal without the other person's name (it does NOT clear them). When they confess, they say whom they gave it to. Their alibi still covers the time of death.`;
        case 'SCAVENGER':
          return `  - ${npc} SCAVENGER: they found the body before anyone else, took a small valuable belonging of the victim and told no one. Their location clue is that belonging, hidden at their place (it does NOT clear them). They know when they found the body, which fixes the time of death; the game makes them tell it when they break. The npcPrompt does not mention confessing, being cornered or breaking. They did not kill. Their alibi in 'alibis' covers the time of death itself (where they were when the murder happened); they found the body only later.`;
        case 'LAST_CONVERSATION':
          return `  - ${npc} LAST CONVERSATION: they were the last to speak with the victim, who was troubled about the matter behind the motive (without naming who was behind it). Their npcPrompt says this, and that they share it when asked about the victim. The victim's worry is only this motive: do not add other worries (debts, enemies, plans) that point to a different motive. The npcPrompt never describes or hints at who the victim feared: no name, job, kind (human, android, cyborg…), looks or place. Their own secret and alibi stay as usual.`;
        case 'NONE':
          return `  - ${npc} FULLY INNOCENT: no link to the murder and no shameful secret at all (no smuggling, theft, affair or anything else to hide). They were with ${about} at the time of death doing something ordinary and say so openly. ${about}'s npcPrompt MUST confirm it ("${npc} was with me"), and the two alibis in 'alibis' name the same place and the same activity (when ${about} is also FULLY INNOCENT, the two were with each other and with nobody else). Their location clue is an ordinary sign that they were at that place with ${about} (for example a note, a receipt or a log entry about it); it must never show them working at their own place or anywhere else at the time of death.`;
        default:
          return '';
      }
    })
    .filter(Boolean);
  if (secretLines.length > 0) {
    lines.push(
      `- INNOCENTS' LINKS TO THE MURDER (each innocent's npcPrompt MUST include their link; these override the usual location clue rule where they say so):\n${secretLines.join('\n')}`,
    );
  }
  return lines.length > 0 ? `\n${lines.join('\n')}` : '';
}

// Cinayetin işlendiği yer ve cesedin görünüşü: oyundaki görsel her vakada aynı örtülü bedeni gösterir,
// metin onunla çelişmesin diye ölüm şekli bedenin görünüşüyle değil, ipuçları ve tanıklarla anlatılır
function crimeSceneLine(plan: CasePlan, scenarioType: string): string {
  const config = getScenarioConfig(scenarioType, undefined, plan.crimeSceneId);
  const scene = config.crimeScene;
  if (!scene) return '';
  return `- MURDER LOCATION: The murder happened and the body was found at "${scene.label}" (${scene.description}). This place is NOT any suspect's home or workplace. The victim was killed right there: the murder did NOT start or happen anywhere else and the body was NOT moved. Set the crime there in truthReveal and in every clue about the crime scene. The 'scenario' hook may say where the body was found.
- THE BODY: When the Inquisitor arrives, the body lies on the ground, covered with ${config.crimeSceneBody}. The people who found the body covered it; the culprit did not. Never write that the culprit covered, wrapped or hid the body with it. Do not describe the body in a way that contradicts this (no hanging, sitting or standing body). Convey how the victim died through the clues, the testimony and truthReveal.`;
}

export function buildScenarioPrompt(params: {
  difficulty: string;
  scenarioType: string;
  worldDescription: string;
  styleInstruction: string;
  baseNpcs: ScenarioNpcDefinition[];
  locationDefinitions: ScenarioLocationDefinition[];
  plan: CasePlan;
  caseBrief: string;
}): string {
  const {
    difficulty,
    worldDescription,
    styleInstruction,
    baseNpcs,
    locationDefinitions,
    plan,
    caseBrief,
    scenarioType,
  } = params;

  const npcListText = baseNpcs
    .map((npc, i) => `${i + 1}. "${npc.id}" (${npc.name}, ${npc.role})`)
    .join('\n');

  const locationListText = locationDefinitions
    .map(
      (location) =>
        `- "${location.id}" = ${getLocalizedLocationLabel(scenarioType, location.id)} (${location.description})`,
    )
    .join('\n');

  const npcIds = baseNpcs.map((n) => `"${n.id}"`).join(' | ');

  const npcPromptsTemplate = baseNpcs
    .map((n) => `    "${n.id}": "Your personal secret/role regarding this incident..."`)
    .join(',\n');

  const locationCluesTemplate = locationDefinitions
    .map(
      (location) =>
        `    "${location.id}": "Turkish description of a subtle clue hidden at ${getLocalizedLocationLabel(scenarioType, location.id)}..."`,
    )
    .join(',\n');

  const alibisTemplate = plan.innocentIds
    .map((id) => `    "${id}": "Turkish sentence: where this innocent really was during the murder"`)
    .join(',\n');

  const difficultyInstruction =
    difficulty === 'easy'
      ? 'Create a straightforward mystery. The narrative complexity relies solely on the interactions between the 4 main NPCs.'
      : difficulty === 'medium'
        ? 'Create a more complex mystery. The increased complexity should solely be a natural result of having 5 main NPCs. The additional character organically complicates the web of relationships and motives.'
        : 'Create a highly complex mystery. The complexity must purely stem from managing 6 interconnected main NPCs. The interwoven motives of these characters should naturally increase the difficulty without introducing artificial tricks.';

  return `You are the Game Master for a dark interrogation detective game.
${worldDescription}
Difficulty level: ${difficulty.toUpperCase()}. ${difficultyInstruction}

We have ${baseNpcs.length} main NPCs:
${npcListText}

These are the ONLY canonical explorable locations in this session:
${locationListText}

${caseBrief}

YOUR TASK:
1. Invent a specific, gruesome, or mysterious incident that happened recently, consistent with the CASE FACTS.
2. The GUILTY CULPRIT for this session is strictly locked to: "${plan.culpritId}". Do NOT choose anyone else.
3. Write a "dynamic prompt" (a dark secret or motivation) for EACH of the ${baseNpcs.length} NPCs.
   - The guilty NPC's prompt must explain they did it and how they try to hide it.
   - Each innocent NPC's secret must make them look suspicious AND be their alibi (see ALIBIS). When they confess the secret, it clears them of the murder.
   - Include any VERIFYING EVIDENCE testimony in the right NPC's prompt.
   - Every dynamic prompt must preserve that NPC's public identity exactly. Do NOT rename them, do NOT change their profession, and do NOT move them to another workplace.
   - A dynamic prompt describes what the character did, knows and hides. It never tells them when or whether to confess ("you will confess after questioning"): the game decides when anyone breaks.
   - No innocent's location clue names or hints at the culprit, and no innocent's dynamic prompt does either, with one exception: whoever gave, sold or lent the culprit the weapon knows who got it, and their prompt says so (they keep it to themselves; it says nothing about when they would admit it). Their written record of the deal still does not show the name (for example «adı yazılmamış bir alıcı»).

CRITICAL RULE:
The 'scenario' and 'truthReveal' text MUST be written in dark, literary, and natural TURKISH (Turkce). ${styleInstruction} Do not sound like a machine translation. Use rich vocabulary to describe the village and its atmosphere. Never put English words or game terms (such as tidy, messy, hurried, planned) in Turkish text.
'truthReveal' should be a single, long, atmospheric paragraph revealing exactly who the victim and the culprit were, how the crime was committed, why, whether the crime scene clue was genuine or planted and what proves it, and what the innocent NPCs were hiding. This will be shown to the player at the end of the game to explain the entire mystery.

CLUE & MYSTERY RULES:
1. The 'scenario' text MUST be a general mystery hook. It MUST NOT reveal the crime scene appearance (orderly or messy, signs of struggle or none), how the murder seems to have happened (in panic or planned), the crime scene clue, or whether anything is genuine or planted. The player discovers those at the crime scene.
2. For all OTHER locations (non-crime-scene), the hidden clue belongs to the NPC who lives/works there, unless the VERIFYING EVIDENCE is placed at that location:
   - An INNOCENT's location clue MUST be physical proof of that innocent's own secret, the same activity, place and time as their alibi in 'alibis' (for example the smuggled goods or the stolen money). It must never place them somewhere else or doing something else at the time of death. It MUST NOT involve the victim's belongings, blood, the murder weapon, or anything that points at the culprit or at another NPC, unless INNOCENTS' LINKS TO THE MURDER above says otherwise for that innocent.
   - The CULPRIT's location clue (when the verifying evidence is not there) shows the culprit's motive or suspicious activity, not a direct proof of the murder.
3. In the 'scenario' text, NEVER reveal the victim's name. Refer to them only as 'the victim', 'the body', or 'the poor soul' to maintain the mystery.
4. For 'locationClues': exactly one hidden physical clue per canonical location. These should be very specific and small details, not generic descriptions, but exact objects or marks the player needs to find.
5. Every location clue MUST explicitly include the exact hiding spot or exact physical position of the clue inside that location.
6. The truthReveal paragraph must fully support and explain why every location clue exists. Do not leave any location clue disconnected from the truth. It describes each clue and the planted trace exactly as written in 'locationClues' and never adds other hidden, planted or stolen items, or places them anywhere else.
7. Imagine the narrator will later reveal ONLY these canonical clues. So do NOT create optional alternates.
8. NEVER invent extra named locations, businesses, landmarks, neighborhoods, or workplaces outside the canonical list above.
9. The crime, alibis, rumors, and secrets must stay grounded in the canonical cast and canonical locations only.
10. NEVER show the player English location names in parentheses or as translations. Use only the Turkish display names from the canonical list.

Return a valid JSON object ONLY, in exactly this format:
{
  "scenario": "Dark, atmospheric Turkish mystery hook (no crime scene details)...",
  "truthReveal": "Dark, atmospheric Turkish paragraph revealing the ENTIRE truth and behind-the-scenes of this mystery...",
  "culpritId": ${npcIds},
  "victim": { "name": "Full name", "profession": "Turkish profession" },
  "verificationText": "One Turkish sentence stating the verifying evidence...",${
    plan.verification.witnessDescriptionFits
      ? '\n  "witnessDescription": "Short Turkish phrase: the visible detail the witness saw",'
      : ''
  }${
    plan.motive
      ? '\n  "culpritCover": "The culprit\'s prepared lie, one or two Turkish sentences, first person",'
      : ''
  }
  "alibis": {
${alibisTemplate}
  },
  "npcPrompts": {
${npcPromptsTemplate}
  },
  "locationClues": {
${locationCluesTemplate}
  }
}`;
}

export function buildReconciliationPrompt(params: {
  draft: ScenarioDraft;
  scenarioType: string;
  locationDefinitions: Array<{ id: string; description: string }>;
  culpritId: string;
  caseBrief: string;
}): string {
  const { draft, scenarioType, locationDefinitions, culpritId, caseBrief } =
    params;

  const locationChecklist = locationDefinitions
    .map(
      (location) =>
        `- ${location.id}: ${getLocalizedLocationLabel(scenarioType, location.id)} (${location.description})`,
    )
    .join('\n');

  return `You are a continuity editor for a detective game. Your job is to make the hidden truth and the canonical location clues perfectly consistent with each other.

CANONICAL LOCATIONS:
${locationChecklist}

${caseBrief}

SCENARIO DRAFT JSON:
${JSON.stringify(draft, null, 2)}

CONTINUITY RULES:
1. The culpritId MUST strictly be "${culpritId}".
2. Keep the same overall mystery, motives, and NPC secret structure unless a small rewrite is needed for consistency.
3. Every CASE FACT above must still hold: crime scene appearance, genuine/planted clue, verifying evidence placement, victim and alibis. Fix the draft where it breaks them.
4. Ensure every canonical location has exactly one location clue.
5. Every location clue must name a concrete object/mark AND its exact hiding spot or physical position.
6. The truthReveal paragraph must explain or support all location clues, the verifying evidence and the alibis. If needed, rewrite truthReveal so they make sense. Remove any hidden, planted or stolen item from truthReveal that is not in 'locationClues' (for example "he also hid a chip at the bar" when the bar's clue is something else).
6c. Only the culprit, and whoever unknowingly gave them the weapon, know who the culprit is. No other innocent's npcPrompt, no innocent's location clue and no "verificationText" may name or hint at the culprit; a witness who saw the act did not see who it was, and a record of a sale or loan does not show the buyer's name. The one who gave the weapon knows whom they gave it to (never "I did not see who it was"). No npcPrompt tells the character to confess.
6a. Each INNOCENT's location clue must prove that innocent's own alibi secret, at the same place and time as the alibi. If a clue places them somewhere else or doing something else at the time of death, rewrite the clue to match the alibi. If one shows the victim's belongings, blood, the weapon, or points at the culprit or another NPC, rewrite it into physical proof of that innocent's alibi.
6b. The 'scenario' hook must not reveal how orderly or messy the crime scene is, or whether the murder looks panicked or planned. Remove such sentences.
6c. No English words or game terms (tidy, messy, hurried, planned) in Turkish text.
7. Do NOT invent alternate clues for the same location.
8. Do NOT add non-canonical locations.
9. Keep everything in natural, dark Turkish.

Return a valid JSON object with the EXACT same top-level shape as the draft:
{
  "scenario": "...",
  "truthReveal": "...",
  "culpritId": "...",
  "victim": { "name": "...", "profession": "..." },
  "verificationText": "...",
  "witnessDescription": "... (only if the draft has it)",
  "culpritCover": "... (only if the draft has it)",
  "alibis": { ... },
  "npcPrompts": { ... },
  "locationClues": {
    "locationId": "Single-sentence Turkish clue with exact spot and object"
  }
}`;
}

export function parseScenarioDraft(responseText: string): ScenarioDraft {
  const firstBrace = responseText.indexOf('{');
  const lastBrace = responseText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON object found in response');
  }

  const jsonStr = responseText.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr) as ScenarioDraft;
  } catch {
    return JSON.parse(jsonStr.replace(/,\s*([\]}])/g, '$1')) as ScenarioDraft;
  }
}

export function mergeScenarioDraftWithFallback(
  draft: ScenarioDraft,
  reviewed: ScenarioDraft,
  canonicalLocationIds: string[],
): ScenarioDraft {
  const mergedClues: Record<string, string> = {};

  for (const locationId of canonicalLocationIds) {
    mergedClues[locationId] =
      reviewed.locationClues?.[locationId] ||
      draft.locationClues?.[locationId] ||
      '';
  }

  return {
    scenario: reviewed.scenario || draft.scenario,
    truthReveal: reviewed.truthReveal || draft.truthReveal,
    culpritId: draft.culpritId,
    npcPrompts: reviewed.npcPrompts || draft.npcPrompts,
    locationClues: mergedClues,
    victim: reviewed.victim?.name ? reviewed.victim : draft.victim,
    verificationText: reviewed.verificationText || draft.verificationText,
    alibis: { ...(draft.alibis ?? {}), ...(reviewed.alibis ?? {}) },
    witnessDescription: reviewed.witnessDescription || draft.witnessDescription,
    culpritCover: reviewed.culpritCover || draft.culpritCover,
  };
}
