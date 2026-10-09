import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';

@Module({
  imports: [PrismaModule, LlmModule],
  providers: [BoardService],
  controllers: [BoardController],
})
export class BoardModule {}
