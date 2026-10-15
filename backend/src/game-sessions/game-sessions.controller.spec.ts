import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GameSessionsController } from './game-sessions.controller';
import { GameSessionsService } from './game-sessions.service';
import { AuthService } from '../auth/auth.service';
import { MarketService } from '../market/market.service';

describe('GameSessionsController', () => {
  let controller: GameSessionsController;
  let createSession: jest.Mock;
  let hasPurchased: jest.Mock;

  beforeEach(async () => {
    createSession = jest.fn().mockResolvedValue({ id: 'new-session' });
    hasPurchased = jest.fn().mockResolvedValue(true);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameSessionsController],
      providers: [
        {
          provide: GameSessionsService,
          useValue: {
            findActiveSession: jest.fn(),
            createSession,
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
            checkAndResetDailyQuota: jest
              .fn()
              .mockResolvedValue({ isAdmin: false, dailySessionCount: 0 }),
            incrementSessionCount: jest.fn(),
          },
        },
        {
          provide: MarketService,
          useValue: { hasPurchased },
        },
      ],
    }).compile();

    controller = module.get<GameSessionsController>(GameSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('karakter gönderilmezse varsayılan karakterle başlar', async () => {
    await controller.createSession('owner', {});
    expect(hasPurchased).toHaveBeenCalledWith('owner', 'outfit_engizitor');
    expect(createSession).toHaveBeenCalledWith(
      'owner',
      'easy',
      'medieval',
      false,
      'engizitor',
    );
  });

  it('sahip olunmayan karakterle vaka açılmaz', async () => {
    hasPurchased.mockImplementation((_user: string, itemId: string) =>
      Promise.resolve(itemId !== 'outfit_kara_yargic'),
    );
    await expect(
      controller.createSession('owner', { characterId: 'kara_yargic' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(createSession).not.toHaveBeenCalled();
  });
});
