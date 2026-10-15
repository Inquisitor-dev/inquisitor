import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { BoardModule } from '../board/board.module';
import { AbilitiesService } from './abilities.service';
import { AbilitiesController } from './abilities.controller';

@Module({
  imports: [PrismaModule, LlmModule, BoardModule],
  providers: [AbilitiesService],
  controllers: [AbilitiesController],
})
export class AbilitiesModule {}
