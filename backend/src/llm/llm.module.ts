import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmUsageRecorder } from './usage/llm-usage.recorder';

@Module({
  providers: [LlmService, LlmUsageRecorder],
  exports: [LlmService],
})
export class LlmModule {}
