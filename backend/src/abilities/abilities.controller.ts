import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AbilitiesService } from './abilities.service';
import { UseAbilityDto } from './dto/use-ability.dto';

// Oyuncu karakterinin yetenekleri (karakter vaka başında oturuma kilitlenir)
@Controller('game-sessions')
export class AbilitiesController {
  constructor(private readonly abilitiesService: AbilitiesService) {}

  @Get(':id/abilities')
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return this.abilitiesService.list(sessionId, userId);
  }

  @Post(':id/abilities/use')
  @UseGuards(JwtAuthGuard)
  use(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: UseAbilityDto,
  ) {
    return this.abilitiesService.use(sessionId, userId, dto);
  }
}
