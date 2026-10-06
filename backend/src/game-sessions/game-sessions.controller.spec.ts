import { Test, TestingModule } from '@nestjs/testing';
import { GameSessionsController } from './game-sessions.controller';
import { GameSessionsService } from './game-sessions.service';
import { AuthService } from '../auth/auth.service';
import { MarketService } from '../market/market.service';

describe('GameSessionsController', () => {
  let controller: GameSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameSessionsController],
      providers: [
        {
          provide: GameSessionsService,
          useValue: {
            findActiveSession: jest.fn(),
            createSession: jest.fn(),
            endDay: jest.fn(),
            advanceTime: jest.fn(),
            getSession: jest.fn(),
            getEvidence: jest.fn(),
            updateNotes: jest.fn(),
            condemnNpc: jest.fn(),
            consumeWarrant: jest.fn(),
            timeoutSession: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            checkAndResetDailyQuota: jest.fn(),
            incrementSessionCount: jest.fn(),
          },
        },
        {
          provide: MarketService,
          useValue: {
            hasPurchased: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<GameSessionsController>(GameSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
