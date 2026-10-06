import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { isTestModeEnabled } from '../test-mode';

type AuthedRequest = { user: { userId: string } };

import { MarketService } from '../market/market.service';

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
    if (testMode === true) {
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
  async endDay(@Request() req: AuthedRequest, @Param('id') sessionId: string) {
    return await this.gameSessionsService.endDay(sessionId, req.user.userId);
  }

  @Post(':id/advance-time')
  @UseGuards(JwtAuthGuard)
  async advanceTime(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.advanceTime(
      sessionId,
      req.user.userId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.getSession(
      sessionId,
      req.user.userId,
    );
  }

  @Get(':id/evidence')
  @UseGuards(JwtAuthGuard)
  async getEvidence(@Request() req: AuthedRequest, @Param('id') sessionId: string) {
    return {
      evidence: await this.gameSessionsService.getEvidence(sessionId, req.user.userId),
    };
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  async updateNotes(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('notes') notes: string,
  ) {
    return await this.gameSessionsService.updateNotes(
      sessionId,
      req.user.userId,
      notes,
    );
  }

  @Post(':id/condemn')
  @UseGuards(JwtAuthGuard)
  async condemnNpc(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('npcId') npcId: string,
  ) {
    return await this.gameSessionsService.condemnNpc(
      sessionId,
      req.user.userId,
      npcId,
    );
  }

  @Post(':id/consume-warrant')
  @UseGuards(JwtAuthGuard)
  async consumeWarrant(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('location') location: string,
  ) {
    return await this.gameSessionsService.consumeWarrant(
      sessionId,
      req.user.userId,
      location,
    );
  }

  @Post(':id/timeout')
  @UseGuards(JwtAuthGuard)
  async timeoutSession(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.timeoutSession(
      sessionId,
      req.user.userId,
    );
  }
}
