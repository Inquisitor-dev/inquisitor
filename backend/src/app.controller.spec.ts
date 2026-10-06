import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketService } from './market/market.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MarketService,
          useValue: {
            getLeaderboard: jest.fn().mockResolvedValue({
              leaderboard: [],
              self: null,
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('leaderboard', () => {
    it('should return leaderboard data', async () => {
      const result = await appController.getLeaderboard();
      expect(result).toHaveProperty('leaderboard');
    });
  });
});
