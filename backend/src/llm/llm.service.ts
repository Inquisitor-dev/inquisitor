import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { getLocalizedLocationLabel, getScenarioConfig } from '../scenarios/scenario-config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ScenarioDraft = {
  scenario: string;
  truthReveal: string;
  culpritId: string;
  npcPrompts: Record<string, string>;
  locationClues: Record<string, string>;
};

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.logger.log(`GEMINI_API_KEY: ${apiKey ? 'Loaded' : 'MISSING!'}`);

    this.openai = new OpenAI({
      apiKey: apiKey || 'no-key-provided',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  async generateNpcResponse(
    npcName: string,
    npcPrompt: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    isNewDay: boolean = false,
  ): Promise<{ reply: string }> {
    try {
      const newDayInstruction = isNewDay
        ? `\nIMPORTANT: This is a NEW DAY. The Inquisitor has returned. Do NOT greet them as a stranger. Acknowledge that you've met before. React naturally - perhaps warmer, colder, more nervous, or more guarded depending on your character and what was discussed yesterday.`
        : '';

      const systemPrompt = `You are ${npcName}, a character in a dark interrogation mystery game.

CHARACTER BACKGROUND: ${npcPrompt}

CRITICAL RULES:
1. ALWAYS reply in natural, literary TURKISH (Turkce). Speak smoothly, avoid translation-like phrasing.
2. Stay completely in character at all times.
3. Never contradict the supplied identity, job, setting, or canonical location list.
4. Follow any confession, confrontation, resistance, or truth-handling rules inside the supplied character background exactly.
5. If your character is the CULPRIT, you must lie, deflect, and misdirect about the main crime. Be clever but not obviously guilty.
6. If your character is NOT the culprit and the player accurately corners you about your true personal secret, you must confess that secret instead of looping forever in denial.
7. Never confess to a crime your character did not commit.
8. Your response MUST be a valid JSON object with this EXACT format:
{"reply": "your Turkish response here"}
9. Do NOT include any text outside the JSON object.${newDayInstruction}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        try {
          this.logger.log(`Calling Gemini API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`);
          response = await this.openai.chat.completions.create({
            model: 'gemini-flash-latest',
            messages: messages as any,
            temperature: 0.7,
          });
          break;
        } catch (err: any) {
          if (err?.status === 429 && retries < maxRetries) {
            retries++;
            const waitTime = Math.pow(2, retries) * 1500;
            this.logger.warn(
              `API Rate Limit hit (429). Retrying ${retries}/${maxRetries} in ${waitTime}ms...`,
            );
            await delay(waitTime);
          } else {
            throw err;
          }
        }
      }

      const responseText = response?.choices?.[0]?.message?.content || '';
      this.logger.log(`Gemini raw response: ${responseText.slice(0, 200)}`);

      let reply = responseText;

      try {
        const jsonMatch = responseText.match(/\{(?:[^{}]|\{[^{}]*\})*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reply) {
            reply = parsed.reply;
          }
        }
        reply = reply
          .replace(/\{[^}]*\}/g, (match) => {
            if (match.includes('"') || match.includes(':')) return '';
            return `*${match.slice(1, -1).trim()}*`;
          })
          .trim();
      } catch (parseErr) {
        this.logger.warn(`JSON parse failed, using raw text: ${parseErr}`);
        reply = responseText.replace(/^\s*\{[\s\S]*?\}\s*/, '').trim() || responseText;
      }

      if (!reply) reply = 'Hmm...';

      return { reply };
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error?.message || error}`);
      this.logger.error(`Status: ${error?.status}, Code: ${error?.code}`);

      let errorMessage = 'Su an sizinle konusmak istemiyorum... (Beklenmeyen Sistem Hatasi)';
      if (error?.status === 429) {
        errorMessage =
          '*Karakter sessizlige burunuyor...* (Sunucu asiri yogun, lutfen birazdan tekrar deneyin.)';
      }

      return { reply: errorMessage };
    }
  }

  async generateSessionScenario(
    difficulty: string = 'easy',
    scenarioType: string = 'medieval',
  ): Promise<ScenarioDraft> {
    const scenarioConfig = getScenarioConfig(scenarioType, difficulty);
    const {
      worldDescription,
      styleInstruction,
      npcDefinitions: baseNpcs,
      locationDefinitions,
    } = scenarioConfig;

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

    const difficultyInstruction =
      difficulty === 'easy'
        ? 'Create a straightforward mystery. The narrative complexity relies solely on the interactions between the 4 main NPCs.'
        : difficulty === 'medium'
          ? 'Create a more complex mystery. The increased complexity should solely be a natural result of having 5 main NPCs. The additional character organically complicates the web of relationships and motives.'
          : 'Create a highly complex mystery. The complexity must purely stem from managing 6 interconnected main NPCs. The interwoven motives of these characters should naturally increase the difficulty without introducing artificial tricks.';

    const prompt = `You are the Game Master for a dark interrogation detective game.
${worldDescription}
Difficulty level: ${difficulty.toUpperCase()}. ${difficultyInstruction}

We have ${baseNpcs.length} main NPCs:
${npcListText}

These are the ONLY canonical explorable locations in this session:
${locationListText}

YOUR TASK:
1. Invent a specific, gruesome, or mysterious incident that happened recently.
2. Randomly select exactly ONE of the ${baseNpcs.length} NPCs to be the GUILTY CULPRIT.
3. Write a "dynamic prompt" (a dark secret or motivation) for EACH of the ${baseNpcs.length} NPCs.
   - The guilty NPC's prompt must explain they did it and how they try to hide it.
   - The innocent NPCs must have their own secrets (e.g. they saw something, they stole something, they are falsely accusing someone) to make them look suspicious too.
   - Every dynamic prompt must preserve that NPC's public identity exactly. Do NOT rename them, do NOT change their profession, and do NOT move them to another workplace.

CRITICAL RULE:
The 'scenario' and 'truthReveal' text MUST be written in dark, literary, and natural TURKISH (Turkce). ${styleInstruction} Do not sound like a machine translation. Use rich vocabulary to describe the crime scene.
'truthReveal' should be a single, long, atmospheric paragraph revealing exactly who the culprit was, how they committed the crime, why they did it, and what the innocent NPCs were trying to hide. This will be shown to the player at the end of the game to explain the entire mystery.

CLUE & MYSTERY RULES:
1. CRITICAL RULE FOR THE CRIME SCENE AND MURDER STYLE: You must randomly decide between two types of murder:
A) PLANNED & COLD-BLOODED: The crime scene is relatively clean, organized, or staged. The physical clue left at the 'crime_scene' MUST be a planted RED HERRING pointing directly to an INNOCENT person (e.g. a profession-specific item belonging to someone else).
B) FAST & HURRIED: The crime scene is messy, shows signs of struggle, or panic. The physical clue left at the 'crime_scene' MUST be a GENUINE clue accidentally left by the actual CULPRIT.
CRITICAL ENFORCEMENT: If you chose B (FAST & HURRIED), you are FORBIDDEN from inventing your own crime scene clue. You MUST select EXACTLY ONE of the following vague clues and use it as the 'crime_scene' location clue:
- "Yerde siyah, siradan bir kumas parcasi."
- "Yerde camurlu, sekli bozulmus silik bir ayak izi."
- "Kosede, uzerinde hicbir isaret veya arma bulunmayan dusmus siradan bir dugme."
- "Yere dokulmus, nereden geldigi anlasilmayan birkac damla siradan mum lekesi."
The 'scenario' text MUST be a general mystery hook and MUST NOT immediately reveal whether the scene is messy or clean. Instead, the 'crime_scene' entry in 'locationClues' MUST contain the description of the struggle/cleanliness along with the physical item clue. The player will only discover this state when they interrogate the crime scene narrator.
2. For all OTHER locations (non-crime-scene), the hidden clue should reveal the dirty secret or suspicious activity of the NPC who resides/works there. It does not have to be related to the murder, but it should make them look guilty of *something*.
3. In the 'scenario' text, NEVER reveal the victim's name. Refer to them only as 'the victim', 'the body', or 'the poor soul' to maintain the mystery.
4. For 'locationClues': invent one hidden physical clue (real or red herring) per canonical location. These should be very specific and small details, not generic descriptions, but exact objects or marks the player needs to find.
5. Every location clue MUST explicitly include the exact hiding spot or exact physical position of the clue inside that location.
6. The truthReveal paragraph must fully support and explain why every location clue exists. Do not leave any location clue disconnected from the truth.
7. Imagine the narrator will later reveal ONLY these canonical clues. So do NOT create optional alternates.
8. NEVER invent extra named locations, businesses, landmarks, neighborhoods, or workplaces outside the canonical list above.
9. The crime, alibis, rumors, and secrets must stay grounded in the canonical cast and canonical locations only.
10. NEVER show the player English location names in parentheses or as translations. Use only the Turkish display names from the canonical list.

Return a valid JSON object ONLY, in exactly this format:
{
  "scenario": "Dark, atmospheric Turkish description of the crime scene...",
  "truthReveal": "Dark, atmospheric Turkish paragraph revealing the ENTIRE truth and behind-the-scenes of this mystery...",
  "culpritId": ${npcIds},
  "npcPrompts": {
${npcPromptsTemplate}
  },
  "locationClues": {
${locationCluesTemplate}
  }
}`;

    this.logger.log(
      `Calling Gemini API to generate dynamic scenario (difficulty: ${difficulty}, scenario: ${scenarioType})...`,
    );

    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await this.openai.chat.completions.create({
          model: 'gemini-flash-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
        });
        break;
      } catch (err: any) {
        if (err?.status === 429 && retries < maxRetries) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1500;
          this.logger.warn(
            `Scenario Generation Rate Limit hit (429). Retrying ${retries}/${maxRetries} in ${waitTime}ms...`,
          );
          await delay(waitTime);
        } else {
          throw err;
        }
      }
    }

    const responseText = response?.choices?.[0]?.message?.content || '';

    try {
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in response');
      }

      const jsonStr = responseText.substring(firstBrace, lastBrace + 1);

      try {
        const draft = JSON.parse(jsonStr) as ScenarioDraft;
        return await this.reconcileScenarioConsistency(draft, scenarioType, locationDefinitions);
      } catch {
        const cleanedJson = jsonStr.replace(/,\s*([\]}])/g, '$1');
        const draft = JSON.parse(cleanedJson) as ScenarioDraft;
        return await this.reconcileScenarioConsistency(draft, scenarioType, locationDefinitions);
      }
    } catch {
      this.logger.error(`Failed to parse scenario JSON. Response: ${responseText}`);
      throw new Error('Failed to generate scenario JSON');
    }
  }

  private async reconcileScenarioConsistency(
    draft: ScenarioDraft,
    scenarioType: string,
    locationDefinitions: Array<{ id: string; description: string }>,
  ): Promise<ScenarioDraft> {
    const locationChecklist = locationDefinitions
      .map(
        (location) =>
          `- ${location.id}: ${getLocalizedLocationLabel(scenarioType, location.id)} (${location.description})`,
      )
      .join('\n');

    const reviewPrompt = `You are a continuity editor for a detective game. Your job is to make the hidden truth and the canonical location clues perfectly consistent with each other.

CANONICAL LOCATIONS:
${locationChecklist}

SCENARIO DRAFT JSON:
${JSON.stringify(draft, null, 2)}

CONTINUITY RULES:
1. Keep the same culpritId.
2. Keep the same overall mystery, motives, and NPC secret structure unless a small rewrite is needed for consistency.
3. Ensure every canonical location has exactly one location clue.
4. Every location clue must name a concrete object/mark AND its exact hiding spot or physical position.
5. The truthReveal paragraph must explain or support all location clues. If needed, rewrite truthReveal so those clues make sense.
6. Do NOT invent alternate clues for the same location.
7. Do NOT add non-canonical locations.
8. Keep everything in natural, dark Turkish.

Return a valid JSON object with the EXACT same top-level shape as the draft:
{
  "scenario": "...",
  "truthReveal": "...",
  "culpritId": "...",
  "npcPrompts": { ... },
  "locationClues": {
    "locationId": "Single-sentence Turkish clue with exact spot and object"
  }
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-flash-latest',
        messages: [{ role: 'user', content: reviewPrompt }],
        temperature: 0.2,
      });

      const responseText = response?.choices?.[0]?.message?.content || '';
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        return draft;
      }

      const reviewed = JSON.parse(responseText.substring(firstBrace, lastBrace + 1)) as ScenarioDraft;
      return this.mergeScenarioDraftWithFallback(draft, reviewed, locationDefinitions.map((location) => location.id));
    } catch (error) {
      this.logger.warn(`Scenario continuity reconciliation failed, using draft as-is. ${error}`);
      return draft;
    }
  }

  private mergeScenarioDraftWithFallback(
    draft: ScenarioDraft,
    reviewed: ScenarioDraft,
    canonicalLocationIds: string[],
  ): ScenarioDraft {
    const mergedClues: Record<string, string> = {};

    for (const locationId of canonicalLocationIds) {
      mergedClues[locationId] = reviewed.locationClues?.[locationId] || draft.locationClues?.[locationId] || '';
    }

    return {
      scenario: reviewed.scenario || draft.scenario,
      truthReveal: reviewed.truthReveal || draft.truthReveal,
      culpritId: draft.culpritId,
      npcPrompts: reviewed.npcPrompts || draft.npcPrompts,
      locationClues: mergedClues,
    };
  }
}
