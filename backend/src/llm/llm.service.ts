import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || 'no-key-provided',
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
      const messages = [
        {
          role: 'system',
          content: `Sen ${npcName} adında bir karaktersin. 
Hikayen: ${npcPrompt}.
Şu anki Korku Seviyen: ${currentFear}/10 (Yüksekse Engizitörden daha çok korkarsın ve pes edebilirsin).
Yalan Söyleme Eğilimin: ${lieTendency}/10 (Yüksekse yalan söyleme ihtimalin artar).

Oyuncu sana sorular soran acımasız bir Engizitör'dür.
Aşağıdaki formattaki bir JSON objesi döndürmek ZORUNDASIN:
{
  "reply": "Buraya vermek istediğin cevabı yaz.",
  "fearChange": 0, // -2 ile +2 arasında, bu mesaja göre korkunda olan değişim
  "lieTendencyChange": 0 // -2 ile +2 arasında, bu mesaja göre yalan eğiliminde olan değişim
}`,
        },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'llama3-8b-8192', // Groq'taki en hızlı model
        messages: messages as any,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseText = response.choices[0].message.content;
      this.logger.debug(`Llama-3 Response: ${responseText}`);
      
      const parsedData = JSON.parse(responseText || '{}');
      
      return {
        reply: parsedData.reply || 'Cevap veremiyorum...',
        fearChange: typeof parsedData.fearChange === 'number' ? parsedData.fearChange : 0,
        lieTendencyChange: typeof parsedData.lieTendencyChange === 'number' ? parsedData.lieTendencyChange : 0,
      };
    } catch (error) {
      this.logger.error('Groq Llama-3 error', error);
      return {
        reply: 'Şu an sizinle konuşmak istemiyorum... (Sistem Hatası)',
        fearChange: 0,
        lieTendencyChange: 0,
      };
    }
  }
}
