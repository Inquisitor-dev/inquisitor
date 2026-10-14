import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { isTestModeEnabled } from '../test-mode';
import { MarketService } from '../market/market.service';
import {
  CreateSessionDto,
  UpdateNotesDto,
  CondemnNpcDto,
  ConsumeWarrantDto,
} from './dto/game-sessions.dto';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_SCENARIOS = ['medieval', 'modern', 'cyberpunk', 'china', 'winter'];

@Controller('game-sessions')
export class GameSessionsController {
  constructor(
    private readonly gameSessionsService: GameSessionsService,
    private readonly authService: AuthService,
    private readonly marketService: MarketService,
  ) {}

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async findActiveSession(@CurrentUser('userId') userId: string) {
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
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    const diff = dto.difficulty || 'easy';
    const sType = dto.scenarioType || 'medieval';

    if (!VALID_DIFFICULTIES.includes(diff) || !VALID_SCENARIOS.includes(sType)) {
      throw new BadRequestException('Geçersiz evren ya da zorluk seçimi.');
    }

    // Evren ve zorluk kilitleri sunucu tarafında doğrulanır
    if (diff !== 'easy') {
      const ownsDiff = await this.marketService.hasPurchased(userId, `difficulty_${diff}`);
      if (!ownsDiff) {
        throw new ForbiddenException(`"${diff}" zorluğu henüz açılmamış. Markette token ile açabilirsin.`);
      }
    }

    if (sType !== 'medieval') {
      const ownsUniverse = await this.marketService.hasPurchased(userId, `universe_${sType}`);
      if (!ownsUniverse) {
        throw new ForbiddenException(`"${sType}" evreni henüz açılmamış. Markette token ile açabilirsin.`);
      }
    }

    // Yapay zekasız test oturumu: kota kısıtları uygulanmaz, sayaç artmaz
    if (dto.testMode === true) {
      if (!isTestModeEnabled()) {
        throw new ForbiddenException('Test modu bu sunucuda kapalı.');
      }
      return this.gameSessionsService.createSession(userId, diff, sType, true);
    }

    // Günlük kota kontrolü (Premium kaldırıldı, standart limit 5 oturum)
    const quota = await this.authService.checkAndResetDailyQuota(userId);
    const maxSessions = quota.isAdmin ? 999 : 5;
    if (quota.dailySessionCount >= maxSessions) {
      throw new ForbiddenException(`Bugünkü soruşturma hakkın doldu (${maxSessions}/${maxSessions}). Yarın tekrar gel.`);
    }

    const session = await this.gameSessionsService.createSession(userId, diff, sType);

    // Başarılı oluşturulunca sayacı artır
    await this.authService.incrementSessionCount(userId);

    return session;
  }

  @Post(':id/end-day')
  @UseGuards(JwtAuthGuard)
  async endDay(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return await this.gameSessionsService.endDay(sessionId, userId);
  }

  @Post(':id/advance-time')
  @UseGuards(JwtAuthGuard)
  async advanceTime(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.advanceTime(sessionId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.getSession(sessionId, userId);
  }

  @Get(':id/evidence')
  @UseGuards(JwtAuthGuard)
  async getEvidence(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return {
      evidence: await this.gameSessionsService.getEvidence(sessionId, userId),
    };
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  async updateNotes(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: UpdateNotesDto,
  ) {
    return await this.gameSessionsService.updateNotes(
      sessionId,
      userId,
      dto.notes ?? '',
    );
  }

  @Post(':id/condemn')
  @UseGuards(JwtAuthGuard)
  async condemnNpc(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: CondemnNpcDto,
  ) {
    return await this.gameSessionsService.condemnNpc(
      sessionId,
      userId,
      dto.npcId,
    );
  }

  @Post(':id/consume-warrant')
  @UseGuards(JwtAuthGuard)
  async consumeWarrant(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: ConsumeWarrantDto,
  ) {
    return await this.gameSessionsService.consumeWarrant(
      sessionId,
      userId,
      dto.location,
    );
  }

  @Post(':id/timeout')
  @UseGuards(JwtAuthGuard)
  async timeoutSession(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.timeoutSession(sessionId, userId);
  }
}
