import { Logger } from '@nestjs/common';
import OpenAI from 'openai';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-flash-latest',
];

const MODELS = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const MODEL_CHAIN = MODELS.length > 0 ? MODELS : DEFAULT_MODELS;
const ATTEMPTS_PER_MODEL = 2;

const isRetryable = (err: any) =>
  err?.status === 404 ||
  err?.status === 429 ||
  err?.status >= 500 ||
  err instanceof OpenAI.APIConnectionError;

const isTimeout = (err: any) => err instanceof OpenAI.APIConnectionTimeoutError;

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
          if (!isRetryable(err)) throw err;
          this.logger.warn(
            `[${label}] ${model} failed (${err?.status ?? err?.constructor?.name}).`,
          );
          if (isTimeout(err) || err?.status === 404) break;
          if (attempt < ATTEMPTS_PER_MODEL) await delay(1500 * attempt);
        }
      }
      this.logger.warn(`[${label}] Switching away from ${model}.`);
    }

    throw lastError;
  }
}
