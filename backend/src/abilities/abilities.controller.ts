import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AbilitiesService } from './abilities.service';

// Oyuncu karakterinin yetenekleri (karakter vaka başında oturuma kilitlenir)
@Controller('game-sessions')
export class AbilitiesController {
  constructor(private readonly abilitiesService: AbilitiesService) {}

  @Get(':id/abilities')
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return this.abilitiesService.list(sessionId, userId);
  }
}
