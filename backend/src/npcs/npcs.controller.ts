import { Controller, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';

@Controller('npcs')
export class NpcsController {
  constructor(
    private readonly npcsService: NpcsService,
    private readonly authService: AuthService,
  ) {}

  @Post('interact')
  @UseGuards(JwtAuthGuard)
  async interact(
    @Request() req: any,
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
    @Body('message') message: string,
  ) {
    if (!sessionId || !npcId || !message) {
      return { error: 'Gerekli alanlar eksik (sessionId, npcId, message)' };
    }

    const userId: string = req.user.userId;
    const isGreeting = message === '__NEW_DAY_GREETING__';

    // Selamlama sinyali değilse günlük mesaj kotasını kontrol et (test oturumları kota harcamaz)
    if (!isGreeting && !(await this.npcsService.isTestSession(sessionId))) {
      const quota = await this.authService.checkAndResetDailyQuota(userId);
      const maxMessages = quota.isPremium ? 100 : 30;
      if (quota.dailyMessageCount >= maxMessages) {
        throw new ForbiddenException(`Günlük mesaj limitine ulaştınız. (${maxMessages}/${maxMessages}) Yarın tekrar gelin.`);
      }
      await this.authService.incrementMessageCount(userId);
    }

    return await this.npcsService.interact(sessionId, npcId, message);
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
  ) {
    if (!sessionId || !npcId) {
      return { error: 'Gerekli alanlar eksik (sessionId, npcId)' };
    }

    return await this.npcsService.getNpcHistory(sessionId, npcId);
  }
}
