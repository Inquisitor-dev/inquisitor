import { Controller, Post, Body, Param, Get } from '@nestjs/common';
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

  @Post(':id/advance-time')
  async advanceTime(@Param('id') sessionId: string) {
    return await this.gameSessionsService.advanceTime(sessionId);
  }

  @Get(':id')
  async getSession(@Param('id') sessionId: string) {
    return await this.gameSessionsService.getSession(sessionId);
  }

  @Post(':id/notes')
  async updateNotes(@Param('id') sessionId: string, @Body('notes') notes: string) {
    return await this.gameSessionsService.updateNotes(sessionId, notes);
  }

  @Post(':id/condemn')
  async condemnNpc(@Param('id') sessionId: string, @Body('npcId') npcId: string) {
    return await this.gameSessionsService.condemnNpc(sessionId, npcId);
  }
}
