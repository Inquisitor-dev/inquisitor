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
import { DEFAULT_CHARACTER_ID } from '../abilities/abilities';
import {
  CreateSessionDto,
  UpdateNotesDto,
  CondemnNpcDto,
  ConsumeWarrantDto,
  RaidActDto,
  DetainDto,
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

    // Karakter vaka boyunca kilitlenir; yalnızca sahip olunan karakterle başlanır
    const characterId = dto.characterId || DEFAULT_CHARACTER_ID;
    const ownsCharacter = await this.marketService.hasPurchased(userId, `outfit_${characterId}`);
    if (!ownsCharacter) {
      throw new ForbiddenException('Bu karaktere sahip değilsin. Markette token ile açabilirsin.');
    }

    // Yapay zekasız test oturumu: kota kısıtları uygulanmaz, sayaç artmaz
    if (dto.testMode === true) {
      if (!isTestModeEnabled()) {
        throw new ForbiddenException('Test modu bu sunucuda kapalı.');
      }
      return this.gameSessionsService.createSession(userId, diff, sType, true, characterId);
    }

    // Günlük kota kontrolü (Premium kaldırıldı, standart limit 5 oturum)
    const quota = await this.authService.checkAndResetDailyQuota(userId);
    const maxSessions = quota.isAdmin ? 999 : 5;
    if (quota.dailySessionCount >= maxSessions) {
      throw new ForbiddenException(`Bugünkü soruşturma hakkın doldu (${maxSessions}/${maxSessions}). Yarın tekrar gel.`);
    }

    const session = await this.gameSessionsService.createSession(userId, diff, sType, false, characterId);

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

  // Nezaret: bir şüpheliyi bir geceliğine nezarete aldır (vakada bir kez)
  @Post(':id/detain')
  @UseGuards(JwtAuthGuard)
  async detain(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: DetainDto,
  ) {
    return await this.gameSessionsService.detain(sessionId, userId, dto.npcId);
  }

  // Gece baskını: süren ya da biten baskının hâli
  @Get(':id/raid')
  @UseGuards(JwtAuthGuard)
  async getRaid(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.getRaid(sessionId, userId);
  }

  // Gece baskınında bir aksiyon; baskın biterse gün kapanır
  @Post(':id/raid/act')
  @UseGuards(JwtAuthGuard)
  async raidAct(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: RaidActDto,
  ) {
    return await this.gameSessionsService.raidAct(sessionId, userId, dto.action);
  }

  // Bu sabahın gazetesi: gece olayları ve kasabanın haberleri
  @Get(':id/newspaper')
  @UseGuards(JwtAuthGuard)
  async getNewspaper(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.getNewspaper(sessionId, userId);
  }

  // Hüküm Dosyası formunun seçenekleri (şüpheliler, evrenin silahları, motifler, saatler, bağ türleri)
  @Get(':id/verdict-options')
  @UseGuards(JwtAuthGuard)
  async getVerdictOptions(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.gameSessionsService.getVerdictOptions(sessionId, userId);
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
      dto.report,
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
