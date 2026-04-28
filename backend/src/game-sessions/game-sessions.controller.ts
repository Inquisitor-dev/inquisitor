import { Controller, Post, Body, Param } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';

@Controller('game-sessions')
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}

  @Post()
  async createSession(@Body('userId') userId?: string) {
    // Gerçekte auth'dan gelen userId kullanılmalı, şimdilik demo
    return await this.gameSessionsService.createSession(userId || 'demo-user-001');
  }

  @Post(':id/end-day')
  async endDay(@Param('id') sessionId: string) {
    return await this.gameSessionsService.endDay(sessionId);
  }
}
