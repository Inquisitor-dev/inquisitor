import { Controller, Post, Body, Param, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';

@Controller('game-sessions')
export class GameSessionsController {
  constructor(
    private readonly gameSessionsService: GameSessionsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSession(@Request() req: any) {
    const userId: string = req.user.userId;

    // Günlük kota kontrolü
    const quota = await this.authService.checkAndResetDailyQuota(userId);
    if (quota.dailySessionCount >= 2) {
      throw new ForbiddenException('Günlük soruşturma limitine ulaştınız. (2/2) Yarın tekrar gelin.');
    }

    const session = await this.gameSessionsService.createSession(userId);

    // Başarılı oluşturulunca sayacı artır
    await this.authService.incrementSessionCount(userId);

    return session;
  }

  @Post(':id/end-day')
  @UseGuards(JwtAuthGuard)
  async endDay(@Param('id') sessionId: string) {
    return await this.gameSessionsService.endDay(sessionId);
  }

  @Post(':id/advance-time')
  @UseGuards(JwtAuthGuard)
  async advanceTime(@Param('id') sessionId: string) {
    return await this.gameSessionsService.advanceTime(sessionId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id') sessionId: string) {
    return await this.gameSessionsService.getSession(sessionId);
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  async updateNotes(@Param('id') sessionId: string, @Body('notes') notes: string) {
    return await this.gameSessionsService.updateNotes(sessionId, notes);
  }

  @Post(':id/condemn')
  @UseGuards(JwtAuthGuard)
  async condemnNpc(@Param('id') sessionId: string, @Body('npcId') npcId: string) {
    return await this.gameSessionsService.condemnNpc(sessionId, npcId);
  }

  @Post(':id/consume-warrant')
  @UseGuards(JwtAuthGuard)
  async consumeWarrant(@Param('id') sessionId: string) {
    return await this.gameSessionsService.consumeWarrant(sessionId);
  }

  @Post(':id/timeout')
  @UseGuards(JwtAuthGuard)
  async timeoutSession(@Param('id') sessionId: string) {
    return await this.gameSessionsService.timeoutSession(sessionId);
  }
}
