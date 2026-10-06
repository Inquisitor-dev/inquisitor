import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MarketService } from './market/market.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly marketService: MarketService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.marketService.getLeaderboard();
  }
}
