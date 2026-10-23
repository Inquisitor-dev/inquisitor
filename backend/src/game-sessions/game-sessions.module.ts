import { Module } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { GameSessionsController } from './game-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { AuthModule } from '../auth/auth.module';
import { MarketModule } from '../market/market.module';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [PrismaModule, LlmModule, AuthModule, MarketModule, StoriesModule],
  providers: [GameSessionsService],
  controllers: [GameSessionsController],
})
export class GameSessionsModule {}
