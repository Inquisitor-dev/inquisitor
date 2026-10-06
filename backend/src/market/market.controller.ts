import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MarketService } from './market.service';
import {
  MARKET_ITEMS_CATALOG,
  TOKEN_PACKS_CATALOG,
} from './market-catalog';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('catalog')
  getCatalog() {
    return {
      items: MARKET_ITEMS_CATALOG,
      packs: TOKEN_PACKS_CATALOG,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.marketService.getBalanceAndInventory(req.user.userId);
  }

  @Post('purchase')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async purchase(@Request() req: any, @Body('itemId') itemId: string) {
    return this.marketService.purchaseItem(req.user.userId, itemId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.marketService.getLeaderboard();
  }
}
