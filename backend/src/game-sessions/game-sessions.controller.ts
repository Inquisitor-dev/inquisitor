import { Controller, Post, Body, Param, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { isTestModeEnabled } from '../test-mode';

@Controller('game-sessions')
export class GameSessionsController {
  constructor(
    private readonly gameSessionsService: GameSessionsService,
    private readonly authService: AuthService,
  ) {}

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async findActiveSession(@Request() req: any) {
    const userId: string = req.user.userId;
    const session = await this.gameSessionsService.findActiveSession(userId);
    return { session };
  }

  @Get('test-mode')
  @UseGuards(JwtAuthGuard)
  testModeStatus() {
    return { enabled: isTestModeEnabled() };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Request() req: any, 
    @Body('difficulty') difficulty?: string,
    @Body('scenarioType') scenarioType?: string,
    @Body('testMode') testMode?: boolean,
  ) {
    const userId: string = req.user.userId;
    const diff = difficulty || 'easy';
    const sType = scenarioType || 'medieval';

    // Yapay zekasız test oturumu: kota ve Premium kısıtları uygulanmaz, sayaç artmaz
    if (testMode === true) {
      if (!isTestModeEnabled()) {
        throw new ForbiddenException('Test modu bu sunucuda kapali.');
      }
      return this.gameSessionsService.createSession(userId, diff, sType, true);
    }

    // Günlük kota kontrolü
    const quota = await this.authService.checkAndResetDailyQuota(userId);
    const maxSessions = quota.isPremium ? 5 : 2;
    if (quota.dailySessionCount >= maxSessions) {
      throw new ForbiddenException(`Günlük soruşturma limitine ulaştınız. (${maxSessions}/${maxSessions}) Yarın tekrar gelin.`);
    }

    // Premium olmayan kullanıcılar sadece easy ve medieval oynayabilir
    if (!quota.isPremium && !quota.isAdmin) {
      if (diff !== 'easy') {
        throw new ForbiddenException('Zorluk seçimi sadece Premium üyelere açıktır.');
      }
      if (sType !== 'medieval') {
        throw new ForbiddenException('Farklı senaryo seçimi sadece Premium üyelere açıktır.');
      }
    }

    const session = await this.gameSessionsService.createSession(userId, diff, sType);

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
  async consumeWarrant(@Param('id') sessionId: string, @Body('location') location: string) {
    return await this.gameSessionsService.consumeWarrant(sessionId, location);
  }

  @Post(':id/timeout')
  @UseGuards(JwtAuthGuard)
  async timeoutSession(@Param('id') sessionId: string) {
    return await this.gameSessionsService.timeoutSession(sessionId);
  }
}
