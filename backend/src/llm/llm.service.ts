import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.logger.log(`GROQ_API_KEY: ${apiKey ? `✅ Found (${apiKey.slice(0, 8)}...)` : '❌ MISSING!'}`);
    
    this.openai = new OpenAI({
      apiKey: apiKey || 'no-key-provided',
      baseURL: 'https://api.groq.com/openai/v1',
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
1. ALWAYS reply in TURKISH (Türkçe). Never use English words in your response.
2. Stay completely in character at all times.
3. Your response MUST be a valid JSON object with this exact format:
{"reply": "your Turkish response here", "fearChange": 0, "lieTendencyChange": 0}
4. fearChange and lieTendencyChange must be integers between -2 and +2.
5. Do NOT include any text outside the JSON object.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      this.logger.log(`Calling Groq API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`);

      const response = await this.openai.chat.completions.create({
        model: 'llama-3.1-8b-instant', // llama3-8b-8192 decommissioned → llama-3.1-8b-instant
        messages: messages as any,
        temperature: 0.7,
      });

      const responseText = response.choices[0].message.content || '';
      this.logger.log(`Groq raw response: ${responseText.slice(0, 200)}`);

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
      this.logger.error(`Groq API Error: ${error?.message || error}`);
      this.logger.error(`Status: ${error?.status}, Code: ${error?.code}`);
      return {
        reply: 'Şu an sizinle konuşmak istemiyorum... (Sistem Hatası)',
        fearChange: 0,
        lieTendencyChange: 0,
      };
    }
  }
}
