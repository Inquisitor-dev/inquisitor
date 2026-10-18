import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Maliyet ölçümü için çağrı türleri: her biri ayrı ayrı toplanabilsin diye
export type LlmCallKind =
  | 'SCENARIO'
  | 'SCENARIO_REVIEW'
  | 'NPC_REPLY'
  | 'CONFRONT'
  | 'NARRATOR'
  | 'BOARD_THOUGHT'
  | 'VERIFY_QUOTE'
  | 'CONTRADICTION_SCAN'
  | 'VERDICT_JUDGE';

export interface LlmUsageContext {
  kind: LlmCallKind;
  sessionId?: string;
}

interface CompletionUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

@Injectable()
export class LlmUsageRecorder {
  private readonly logger = new Logger('LlmUsage');

  constructor(private readonly prisma: PrismaService) {}

  // Kayıt oyunu asla bozmamalı: veritabanı hatası sadece uyarı olarak loglanır
  async record(
    context: LlmUsageContext,
    model: string,
    usage: CompletionUsage | undefined,
    durationMs: number,
  ): Promise<void> {
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

    this.logger.log(
      `${context.kind} model=${model} in=${promptTokens} out=${completionTokens} total=${totalTokens} ms=${durationMs}` +
        (context.sessionId ? ` session=${context.sessionId}` : ''),
    );

    try {
      await this.prisma.llmUsage.create({
        data: {
          sessionId: context.sessionId ?? null,
          kind: context.kind,
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          durationMs,
        },
      });
    } catch (error) {
      this.logger.warn(`Token kullanımı kaydedilemedi: ${error}`);
    }
  }
}
