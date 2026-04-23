import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { NpcsModule } from './npcs/npcs.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, GameSessionsModule, NpcsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
