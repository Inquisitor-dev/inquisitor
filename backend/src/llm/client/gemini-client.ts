import { Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GEMINI_MODELS verilmezse kullanılan zincir. gemini-1.5-* ve gemini-pro kapatıldı (404),
// 2.5 serisi yeni kullanıcılara kapalı; bu yüzden yalnızca güncel modeller var.
// Yerelde ve canlıda kullanılan zincirle aynı tutulmalı ve sadece ucuz Flash-Lite modelleri
// içermeli: bir hata pahalı bir modele sessizce düşmesin.
const DEFAULT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

const MODELS = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const MODEL_CHAIN = MODELS.length > 0 ? MODELS : DEFAULT_MODELS;
const ATTEMPTS_PER_MODEL = 2;

// 402: API kredisi bitti. Oyuncunun hatası değildir, oyuncuya ödeme ya da kredi sözü edilmez.
const isOutOfCredit = (err: any) => err?.status === 402;

const isRetryable = (err: any) =>
  isOutOfCredit(err) ||
  err?.status === 404 ||
  err?.status === 429 ||
  err?.status >= 500 ||
  err instanceof OpenAI.APIConnectionError;

const isTimeout = (err: any) => err instanceof OpenAI.APIConnectionTimeoutError;

// Zincirde bir model 402 döndüyse ve hiçbir model cevap veremediyse fırlatılır. HTTP hatası olduğu
// için yakalanmazsa oyuncuya 503 ve bu metin gider; onarım adımları ve NPC cevabı bunu yutmaz.
export class LlmCreditError extends ServiceUnavailableException {
  constructor(cause?: unknown) {
    super(
      'Yapay zekâ hizmeti şu an kullanılamıyor. Hakkın harcanmadı, biraz sonra yeniden dene.',
      { cause },
    );
  }
}

export interface CompletionRequest {
  messages: { role: string; content: string }[];
  temperature: number;
}

export class GeminiClient {
  private openai: OpenAI;
  private readonly logger = new Logger(GeminiClient.name);

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.logger.log(`GEMINI_API_KEY: ${apiKey ? 'Loaded' : 'MISSING!'}`);

    this.openai = new OpenAI({
      apiKey: apiKey || 'no-key-provided',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      maxRetries: 0,
    });
  }

  // Model zincirini sırayla dener; her model için kısa bir tekrar denemesi yapar
  async createCompletion(
    params: CompletionRequest,
    label: string,
    timeoutMs: number,
  ) {
    let lastError: any;
    let creditError: unknown;
    // Sonraki modeller başka sebeple düşse de asıl sorun kredidir; 402 öne alınır
    const failure = (err: any) => {
      if (!creditError) return err;
      this.logger.error(
        `[${label}] Gemini API kredisi bitti (402); hiçbir model cevap veremedi.`,
      );
      return new LlmCreditError(creditError);
    };

    for (const model of MODEL_CHAIN) {
      for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
        try {
          this.logger.log(
            `[${label}] Calling ${model} (attempt ${attempt}/${ATTEMPTS_PER_MODEL})`,
          );
          return await this.openai.chat.completions.create(
            {
              model,
              messages: params.messages as any,
              temperature: params.temperature,
            },
            { timeout: timeoutMs },
          );
        } catch (err: any) {
          lastError = err;
          if (isOutOfCredit(err)) creditError = err;
          if (!isRetryable(err)) throw failure(err);
          this.logger.warn(
            `[${label}] ${model} failed (${err?.status ?? err?.constructor?.name}).`,
          );
          // Aynı modeli tekrar denemenin faydası yok: sıradaki modele geçilir
          if (isTimeout(err) || err?.status === 404 || isOutOfCredit(err))
            break;
          if (attempt < ATTEMPTS_PER_MODEL) await delay(1500 * attempt);
        }
      }
      this.logger.warn(`[${label}] Switching away from ${model}.`);
    }

    throw failure(lastError);
  }
}
