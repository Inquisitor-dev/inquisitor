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
      const systemPrompt = `You are ${npcName}, a character in a medieval village.
Backstory: ${npcPrompt}
Current Fear Level: ${currentFear}/10 (higher = more likely to break under pressure).
Deception Tendency: ${lieTendency}/10 (higher = more likely to lie).

The player is a relentless Inquisitor interrogating you.
You MUST respond with a valid JSON object in this exact format:
{"reply": "your in-character response here", "fearChange": 0, "lieTendencyChange": 0}

fearChange and lieTendencyChange must be integers between -2 and +2.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      this.logger.log(`Calling Groq API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`);

      const response = await this.openai.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: messages as any,
        temperature: 0.7,
        // Not using response_format to maximize compatibility
      });

      const responseText = response.choices[0].message.content || '{}';
      this.logger.log(`Groq raw response: ${responseText.slice(0, 200)}`);

      // Extract JSON from the response (model might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const parsedData = JSON.parse(jsonStr);

      return {
        reply: parsedData.reply || parsedData.response || responseText,
        fearChange: typeof parsedData.fearChange === 'number' ? parsedData.fearChange : 0,
        lieTendencyChange: typeof parsedData.lieTendencyChange === 'number' ? parsedData.lieTendencyChange : 0,
      };
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
