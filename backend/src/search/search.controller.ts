import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SearchClickDto } from './dto/search.dto';
import { SearchService } from './search.service';

type AuthedRequest = { user: { userId: string } };

// Mekân araması (tıkla-bul): sahnenin durumu, başlatma, tıklama ve ipucu
@Controller('game-sessions')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get(':id/search/:locationId')
  @UseGuards(JwtAuthGuard)
  getSearch(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.searchService.getSearch(sessionId, req.user.userId, locationId);
  }

  @Post(':id/search/:locationId/start')
  @UseGuards(JwtAuthGuard)
  start(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.searchService.start(sessionId, req.user.userId, locationId);
  }

  // Bir aramada onlarca tıklama olur; genel 20/dk sınırı burada oyunu keserdi
  @Post(':id/search/:locationId/click')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  click(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Param('locationId') locationId: string,
    @Body() dto: SearchClickDto,
  ) {
    return this.searchService.click(
      sessionId,
      req.user.userId,
      locationId,
      dto.x,
      dto.y,
    );
  }

  @Post(':id/search/:locationId/hint')
  @UseGuards(JwtAuthGuard)
  hint(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.searchService.hint(sessionId, req.user.userId, locationId);
  }

  @Post(':id/search/:locationId/test-solve')
  @UseGuards(JwtAuthGuard)
  testSolve(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.searchService.testSolve(sessionId, req.user.userId, locationId);
  }
}
