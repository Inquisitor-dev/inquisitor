import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.logger.log(`GEMINI_API_KEY: ${apiKey ? `✅ Found (${apiKey.slice(0, 8)}...)` : '❌ MISSING!'}`);
    
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
        ? `\nIMPORTANT: This is a NEW DAY. The Inquisitor has returned. Do NOT greet them as a stranger. Acknowledge that you've met before. React naturally — perhaps warmer, colder, more nervous, or more guarded depending on your character and what was discussed yesterday.`
        : '';

      const systemPrompt = `You are ${npcName}, a character in a medieval village being interrogated by a relentless Inquisitor.

CHARACTER BACKGROUND: ${npcPrompt}

CRITICAL RULES:
1. ALWAYS reply in natural, literary TURKISH (Türkçe). Speak smoothly, avoid translation-like phrasing.
2. Stay completely in character at all times.
3. If your character is the CULPRIT, you must lie, deflect, and misdirect. Be clever but not obviously guilty.
4. If your character is INNOCENT, answer truthfully about what you know, but you may still have your own smaller secrets.
5. Your response MUST be a valid JSON object with this EXACT format:
{"reply": "your Turkish response here"}
6. Do NOT include any text outside the JSON object.${newDayInstruction}`;

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
          break; // Success, exit retry loop
        } catch (err: any) {
          if (err?.status === 429 && retries < maxRetries) {
            retries++;
            const waitTime = Math.pow(2, retries) * 1500; // 3s, 6s, 12s
            this.logger.warn(`API Rate Limit hit (429). Retrying ${retries}/${maxRetries} in ${waitTime}ms...`);
            await delay(waitTime);
          } else {
            throw err; // Not a 429 or max retries reached, throw it to the outer catch
          }
        }
      }

      const responseText = response?.choices?.[0]?.message?.content || '';
      this.logger.log(`Gemini raw response: ${responseText.slice(0, 200)}`);

      // Try to parse JSON
      let reply = responseText;

      try {
        const jsonMatch = responseText.match(/\{(?:[^{}]|\{[^{}]*\})*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reply) {
            reply = parsed.reply;
          }
        }
        // Clean up any stray braces if raw text returned
        reply = reply.replace(/\{[^}]*\}/g, (match) => {
          if (match.includes('"') || match.includes(':')) return '';
          return `*${match.slice(1, -1).trim()}*`;
        }).trim();
      } catch (parseErr) {
        this.logger.warn(`JSON parse failed, using raw text: ${parseErr}`);
        reply = responseText.replace(/^\s*\{[\s\S]*?\}\s*/, '').trim() || responseText;
      }

      if (!reply) reply = 'Hmm...';

      return { reply };

    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error?.message || error}`);
      this.logger.error(`Status: ${error?.status}, Code: ${error?.code}`);
      
      let errorMessage = 'Şu an sizinle konuşmak istemiyorum... (Beklenmeyen Sistem Hatası)';
      if (error?.status === 429) {
        errorMessage = '*Karakter sessizliğe bürünüyor...* (Sunucu aşırı yoğun, lütfen birazdan tekrar deneyin.)';
      }

      return { reply: errorMessage };
    }
  }

  async generateSessionScenario(difficulty: string = 'easy'): Promise<{
    scenario: string;
    truthReveal: string;
    culpritId: string;
    npcPrompts: Record<string, string>;
    locationClues: Record<string, string>;
  }> {
    // Zorluğa göre NPC listesi
    const baseNpcs = [
      { id: 'tavern', name: 'Brother Aldric', role: 'Innkeeper' },
      { id: 'church', name: 'Father Malachar', role: 'Priest' },
      { id: 'graveyard', name: 'Old Silas', role: 'Gravedigger' },
      { id: 'mill', name: 'Giles', role: 'Miller' },
    ];

    if (difficulty === 'medium' || difficulty === 'hard') {
      baseNpcs.push({ id: 'farm', name: 'Farmer Edmund', role: 'Farmer' });
    }
    if (difficulty === 'hard') {
      baseNpcs.push({ id: 'clinic', name: 'Doctor Harland', role: 'Healer/Doctor' });
    }

    const npcListText = baseNpcs
      .map((npc, i) => `${i + 1}. "${npc.id}" (${npc.name}, ${npc.role})`)
      .join('\n');

    const npcIds = baseNpcs.map(n => `"${n.id}"`).join(' | ');

    const npcPromptsTemplate = baseNpcs
      .map(n => `    "${n.id}": "Your personal secret/role regarding this incident..."`)
      .join(',\n');

    const locationList = ['crime_scene', ...baseNpcs.map(n => n.id)];
    const locationCluesTemplate = locationList
      .map(loc => `    "${loc}": "Turkish description of a subtle clue hidden at ${loc}..."`)
      .join(',\n');

    const difficultyInstruction = difficulty === 'easy'
      ? 'Create a relatively straightforward mystery with clear clues.'
      : difficulty === 'medium'
        ? 'Create a moderately complex mystery. Add more red herrings and make connections between suspects more tangled. The farmer adds an extra layer of rural suspicion.'
        : 'Create a highly complex, deeply layered mystery. Multiple suspects should have overlapping motives. The doctor\'s medical knowledge adds forensic complexity. Red herrings should be sophisticated and misleading. This should be very difficult to solve.';

    const prompt = `You are the Game Master for a dark medieval interrogation game.
Create a new murder or dark heresy mystery set in the village of Ashenmoor.
Difficulty level: ${difficulty.toUpperCase()}. ${difficultyInstruction}

We have ${baseNpcs.length} main NPCs:
${npcListText}

YOUR TASK:
1. Invent a specific, gruesome, or mysterious incident that happened recently (e.g. a body found, a dark ritual, cursed crops).
2. Randomly select exactly ONE of the ${baseNpcs.length} NPCs to be the GUILTY CULPRIT.
3. Write a "dynamic prompt" (a dark secret or motivation) for EACH of the ${baseNpcs.length} NPCs. 
   - The guilty NPC's prompt must explain they did it and how they try to hide it.
   - The innocent NPCs must have their own secrets (e.g. they saw something, they stole something, they are falsely accusing someone) to make them look suspicious too.

CRITICAL RULE:
The 'scenario' and 'truthReveal' text MUST be written in dark, literary, and natural TURKISH (Türkçe). It should read like a grimdark detective fantasy novel. Do not sound like a machine translation. Use rich vocabulary to describe the crime scene.
'truthReveal' should be a single, long, atmospheric paragraph revealing exactly who the culprit was, how they committed the crime, why they did it, and what the innocent NPCs were trying to hide. This will be shown to the player at the end of the game to explain the entire mystery.

CLUE & MYSTERY RULES:
1. DO NOT use cliché or overly obvious clues that instantly give away the killer's profession (e.g. NO flour for the miller, NO holy water for the priest, NO dirt for the gravedigger). The mystery must be difficult to solve. Use subtle, psychological, or indirect clues. Red herrings (false clues pointing to innocent people) are highly encouraged.
2. In the 'scenario' text, NEVER reveal the victim's name. Refer to them only as 'the victim', 'the body', or 'the poor soul' to maintain the mystery.
3. For 'locationClues': invent one hidden physical clue (real or red herring) per location. These should be very specific and small details - not generic descriptions, but exact objects/marks the player needs to find. Written in dark literary Turkish.

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

    this.logger.log(`Calling Gemini API to generate dynamic scenario (difficulty: ${difficulty})...`);

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
        break; // Success
      } catch (err: any) {
        if (err?.status === 429 && retries < maxRetries) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1500;
          this.logger.warn(`Scenario Generation Rate Limit hit (429). Retrying ${retries}/${maxRetries} in ${waitTime}ms...`);
          await delay(waitTime);
        } else {
          throw err;
        }
      }
    }

    const responseText = response?.choices?.[0]?.message?.content || '';
    
    try {
      // Find the first { and last } to extract JSON
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in response');
      }

      let jsonStr = responseText.substring(firstBrace, lastBrace + 1);
      
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        // Handle potential trailing commas (common in LLM output)
        const cleanedJson = jsonStr.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleanedJson);
      }
    } catch (e) {
      this.logger.error(`Failed to parse scenario JSON. Response: ${responseText}`);
      throw new Error('Failed to generate scenario JSON');
    }
  }
}
