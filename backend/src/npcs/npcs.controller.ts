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

    const session = await this.npcsService.getOwnedSession(sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu sorusturma sona erdi.');
    }
    if (message.length > MAX_PLAYER_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Mesaj en fazla ${MAX_PLAYER_MESSAGE_LENGTH} karakter olabilir.`,
      );
    }

    // Selamlama sinyali değilse günlük mesaj kotasını kontrol et (test oturumları kota harcamaz)
    if (!isGreeting && !session.isTestMode) {
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
