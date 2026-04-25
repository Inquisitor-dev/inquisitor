import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

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
    currentFear: number,
    lieTendency: number,
    chatHistory: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
  ): Promise<{ reply: string; fearChange: number; lieTendencyChange: number }> {
    try {
      const systemPrompt = `You are ${npcName}, a character in a medieval village being interrogated by a relentless Inquisitor.

CHARACTER BACKGROUND: ${npcPrompt}

PSYCHOLOGICAL STATE:
- Fear Level: ${currentFear}/10 (higher = more likely to tremble, make mistakes, reveal secrets)
- Deception Tendency: ${lieTendency}/10 (higher = more comfortable lying)

CRITICAL RULES:
1. ALWAYS reply in natural, literary TURKISH (Türkçe). Speak smoothly, avoid translation-like phrasing. 
2. Stay completely in character at all times. React naturally to the pressure.
3. Your response MUST be a valid JSON object with this exact format:
{"reply": "your Turkish response here", "fearChange": 0, "lieTendencyChange": 0}
4. fearChange and lieTendencyChange must be integers between -2 and +2.
5. Do NOT include any text outside the JSON object. Do not include markdown formatting or action markers like *sigh* inside the text, just natural speech and occasional subtle narrative descriptions if strictly necessary.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      this.logger.log(`Calling Gemini API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`);

      const response = await this.openai.chat.completions.create({
        model: 'gemini-flash-latest',
        messages: messages as any,
        temperature: 0.7,
      });

      const responseText = response.choices[0].message.content || '';
      this.logger.log(`Gemini raw response: ${responseText.slice(0, 200)}`);

      // Try to parse JSON - model sometimes returns raw text with {action} markers
      let reply = responseText;
      let fearChange = 0;
      let lieTendencyChange = 0;

      try {
        // Look for a proper JSON object in the response
        const jsonMatch = responseText.match(/\{(?:[^{}]|\{[^{}]*\})*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reply) {
            reply = parsed.reply;
            fearChange = typeof parsed.fearChange === 'number' ? parsed.fearChange : 0;
            lieTendencyChange = typeof parsed.lieTendencyChange === 'number' ? parsed.lieTendencyChange : 0;
          }
        }
        // If no valid JSON reply found, use the raw response as the reply (clean up any stray braces)
        reply = reply.replace(/\{[^}]*\}/g, (match) => {
          // Keep only {action} style markers as italics, remove JSON-looking ones
          if (match.includes('"') || match.includes(':')) return '';
          return `*${match.slice(1, -1).trim()}*`;
        }).trim();
      } catch (parseErr) {
        this.logger.warn(`JSON parse failed, using raw text: ${parseErr}`);
        // Use raw text, clean up any JSON-like syntax
        reply = responseText.replace(/^\s*\{[\s\S]*?\}\s*/, '').trim() || responseText;
      }

      if (!reply) reply = 'Hmm... *shifts uncomfortably*';

      return { reply, fearChange, lieTendencyChange };
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error?.message || error}`);
      this.logger.error(`Status: ${error?.status}, Code: ${error?.code}`);
      return {
        reply: 'Şu an sizinle konuşmak istemiyorum... (Sistem Hatası)',
        fearChange: 0,
        lieTendencyChange: 0,
      };
    }
  }

  async generateSessionScenario(): Promise<{
    scenario: string;
    culpritId: string;
    npcPrompts: Record<string, string>;
  }> {
    const prompt = `You are the Game Master for a dark medieval interrogation game.
Create a new murder or dark heresy mystery set in the village of Ashenmoor.

We have 3 main NPCs:
1. "tavern" (Brother Aldric, Innkeeper)
2. "church" (Father Malachar, Priest)
3. "graveyard" (Old Silas, Gravedigger)

YOUR TASK:
1. Invent a specific, gruesome, or mysterious incident that happened recently (e.g. a body found, a dark ritual, cursed crops).
2. Randomly select exactly ONE of the 3 NPCs to be the GUILTY CULPRIT.
3. Write a "dynamic prompt" (a dark secret or motivation) for EACH of the 3 NPCs. 
   - The guilty NPC's prompt must explain they did it and how they try to hide it.
   - The innocent NPCs must have their own secrets (e.g. they saw something, they stole something, they are falsely accusing someone) to make them look suspicious too.

Return a valid JSON object ONLY, in exactly this format:
{
  "scenario": "Description of the dark incident...",
  "culpritId": "tavern" | "church" | "graveyard",
  "npcPrompts": {
    "tavern": "Your personal secret/role regarding this incident...",
    "church": "Your personal secret/role regarding this incident...",
    "graveyard": "Your personal secret/role regarding this incident..."
  }
}`;

    this.logger.log(`Calling Gemini API to generate dynamic scenario...`);

    const response = await this.openai.chat.completions.create({
      model: 'gemini-flash-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    });

    const responseText = response.choices[0].message.content || '';
    
    try {
      const jsonMatch = responseText.match(/\{(?:[^{}]|\{[^{}]*\})*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(responseText);
    } catch (e) {
      this.logger.error(`Failed to parse scenario JSON: ${responseText}`);
      throw new Error('Failed to generate scenario JSON');
    }
  }
}
