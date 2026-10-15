import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { InteractDto, ConfrontDto, HistoryDto } from './dto/npc-requests.dto';

@Controller('npcs')
export class NpcsController {
  constructor(
    private readonly npcsService: NpcsService,
    private readonly authService: AuthService,
  ) {}

  @Post('interact')
  @UseGuards(JwtAuthGuard)
  async interact(
    @CurrentUser('userId') userId: string,
    @Body() dto: InteractDto,
  ) {
    const isGreeting = dto.message === '__NEW_DAY_GREETING__';

    // Selamlama sinyali sorgu hakkı harcamaz
    await this.checkSessionAndQuota(dto.sessionId, userId, !isGreeting);

    return await this.npcsService.interact(dto.sessionId, dto.npcId, dto.message);
  }

  // Yüzleştirme: Kanıt Defteri'nden bir kanıtı karaktere göster. Bir sorgu hakkı harcar.
  @Post('confront')
  @UseGuards(JwtAuthGuard)
  async confront(
    @CurrentUser('userId') userId: string,
    @Body() dto: ConfrontDto,
  ) {
    // Geçersiz ya da aynı kişiye ikinci kez gösterilen kanıt sorgu hakkı harcamasın diye önce kontrol edilir
    await this.npcsService.getOwnedSession(dto.sessionId, userId);
    await this.npcsService.assertConfrontable(
      dto.sessionId,
      dto.npcId,
      dto.evidenceId,
    );
    await this.checkSessionAndQuota(dto.sessionId, userId, true);
    return await this.npcsService.confront(
      dto.sessionId,
      dto.npcId,
      dto.evidenceId,
      dto.message,
    );
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
    @CurrentUser('userId') userId: string,
    @Body() dto: HistoryDto,
  ) {
    await this.npcsService.getOwnedSession(dto.sessionId, userId);
    return await this.npcsService.getNpcHistory(dto.sessionId, dto.npcId);
  }
}
