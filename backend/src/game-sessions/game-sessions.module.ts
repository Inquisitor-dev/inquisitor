import { Module } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { GameSessionsController } from './game-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, LlmModule, AuthModule],
  providers: [GameSessionsService],
  controllers: [GameSessionsController]
})
export class GameSessionsModule {}
