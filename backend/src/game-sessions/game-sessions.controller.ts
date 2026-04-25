import { Controller, Post, Body } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';

@Controller('game-sessions')
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}

  @Post()
  async createSession(@Body('userId') userId?: string) {
    // Gerçekte auth'dan gelen userId kullanılmalı, şimdilik demo
    return await this.gameSessionsService.createSession(userId || 'demo-user-001');
  }
}
