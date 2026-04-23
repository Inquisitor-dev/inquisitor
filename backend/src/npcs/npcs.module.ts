import { Module } from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { NpcsController } from './npcs.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [NpcsController],
  providers: [NpcsService],
})
export class NpcsModule {}
