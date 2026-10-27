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
import {
  InteractDto,
  ConfrontDto,
  HistoryDto,
  QuotesDto,
  VerifyQuoteDto,
} from './dto/npc-requests.dto';
import { isFreeMessage } from '../abilities/ability-effects';
import { closedMessage } from '../personas/closure-message';

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
    await this.checkSessionAndQuota(dto.sessionId, userId, !isGreeting, dto.npcId);

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
    await this.checkSessionAndQuota(dto.sessionId, userId, true, dto.npcId);
    return await this.npcsService.confront(
      dto.sessionId,
      dto.npcId,
      dto.evidenceId,
      dto.message,
    );
  }

  // Teyit (Gece Muhabiri): okunabilecek sözler
  @Post('quotes')
  @UseGuards(JwtAuthGuard)
  async quotes(@CurrentUser('userId') userId: string, @Body() dto: QuotesDto) {
    await this.npcsService.getOwnedSession(dto.sessionId, userId);
    return { quotes: await this.npcsService.quoteCandidates(dto.sessionId, dto.npcId) };
  }

  // Teyit: bir şüphelinin sözünü başka bir şüpheliye oku. Bir sorgu hakkı harcar.
  @Post('verify-quote')
  @UseGuards(JwtAuthGuard)
  async verifyQuote(
    @CurrentUser('userId') userId: string,
    @Body() dto: VerifyQuoteDto,
  ) {
    await this.npcsService.getOwnedSession(dto.sessionId, userId);
    // Geçersiz ya da kullanılmış yetenek sorgu hakkı harcamasın
    await this.npcsService.assertVerifiable(dto.sessionId, dto.npcId, dto.quoteId);
    await this.checkSessionAndQuota(dto.sessionId, userId, true, dto.npcId);
    return await this.npcsService.verifyQuote(dto.sessionId, dto.npcId, dto.quoteId);
  }

  private async checkSessionAndQuota(
    sessionId: string,
    userId: string,
    usesQuota: boolean,
    npcId: string,
  ) {
    const session = await this.npcsService.getOwnedSession(sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }
    // Kapalı mekâna girilemez, sahibi o gün sorgulanamaz (kasaba olayı ya da kilit kırma); hak harcanmaz
    const closed = closedMessage(session, npcId);
    if (closed) throw new BadRequestException(closed);

    // Sabır (Engizitör): oyun gününün ilk mesajları kotadan düşmez
    const isFree =
      usesQuota &&
      isFreeMessage(
        session.characterId,
        await this.npcsService.playerMessagesToday(sessionId, session.currentDay),
      );

    // Günlük mesaj kotası (test oturumları kota harcamaz)
    if (usesQuota && !isFree && !session.isTestMode) {
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
