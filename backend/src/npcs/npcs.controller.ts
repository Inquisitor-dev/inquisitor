import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { MAX_PLAYER_MESSAGE_LENGTH } from './prompt-guard';

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

    if (message.length > MAX_PLAYER_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Mesaj en fazla ${MAX_PLAYER_MESSAGE_LENGTH} karakter olabilir.`,
      );
    }
    // Selamlama sinyali sorgu hakkı harcamaz
    await this.checkSessionAndQuota(sessionId, userId, !isGreeting);

    return await this.npcsService.interact(sessionId, npcId, message);
  }

  // Yüzleştirme: Kanıt Defteri'nden bir kanıtı karaktere göster. Bir sorgu hakkı harcar.
  @Post('confront')
  @UseGuards(JwtAuthGuard)
  async confront(
    @Request() req: { user: { userId: string } },
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
    @Body('evidenceId') evidenceId: string,
  ) {
    if (!sessionId || !npcId || !evidenceId) {
      throw new BadRequestException('Gerekli alanlar eksik (sessionId, npcId, evidenceId)');
    }
    await this.checkSessionAndQuota(sessionId, req.user.userId, true);
    return await this.npcsService.confront(sessionId, npcId, evidenceId);
  }

  private async checkSessionAndQuota(sessionId: string, userId: string, usesQuota: boolean) {
    const session = await this.npcsService.getOwnedSession(sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }

    // Günlük mesaj kotası (test oturumları kota harcamaz)
    if (usesQuota && !session.isTestMode) {
      const quota = await this.authService.checkAndResetDailyQuota(userId);
      const maxMessages = quota.isAdmin ? 999 : 100;
      if (quota.dailyMessageCount >= maxMessages) {
        throw new ForbiddenException(`Bugünkü sorgu hakkın doldu (${maxMessages}/${maxMessages}). Yarın tekrar gel.`);
      }
      await this.authService.incrementMessageCount(userId);
    }
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Request() req: { user: { userId: string } },
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
  ) {
    if (!sessionId || !npcId) {
      return { error: 'Gerekli alanlar eksik (sessionId, npcId)' };
    }

    await this.npcsService.getOwnedSession(sessionId, req.user.userId);
    return await this.npcsService.getNpcHistory(sessionId, npcId);
  }
}
