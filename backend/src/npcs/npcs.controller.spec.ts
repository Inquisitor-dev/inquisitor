import { Test, TestingModule } from '@nestjs/testing';
import { NpcsController } from './npcs.controller';
import { NpcsService } from './npcs.service';
import { AuthService } from '../auth/auth.service';

describe('NpcsController', () => {
  let controller: NpcsController;
  let session: Record<string, unknown>;
  let sentToday: number;
  let incrementMessageCount: jest.Mock;

  beforeEach(async () => {
    session = {
      id: 'session-1',
      status: 'ACTIVE',
      isTestMode: false,
      characterId: 'engizitor',
      currentDay: 1,
    };
    sentToday = 0;
    incrementMessageCount = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcsController],
      providers: [
        {
          provide: NpcsService,
          useValue: {
            interact: jest.fn(),
            getDialogueHistory: jest.fn(),
            getOwnedSession: jest.fn(() => Promise.resolve(session)),
            playerMessagesToday: jest.fn(() => Promise.resolve(sentToday)),
          },
        },
        {
          provide: AuthService,
          useValue: {
            checkAndResetDailyQuota: jest
              .fn()
              .mockResolvedValue({ isAdmin: false, dailyMessageCount: 0 }),
            incrementMessageCount,
          },
        },
      ],
    }).compile();

    controller = module.get<NpcsController>(NpcsController);
  });

  const ask = () =>
    controller.interact('owner', {
      sessionId: 'session-1',
      npcId: 'tavern',
      message: 'Neredeydin?',
    });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Sabır: Engizitör’ün günün ilk 3 mesajı kotadan düşmez', async () => {
    sentToday = 2;
    await ask();
    expect(incrementMessageCount).not.toHaveBeenCalled();
    sentToday = 3;
    await ask();
    expect(incrementMessageCount).toHaveBeenCalledTimes(1);
  });

  it('diğer karakterlerin her mesajı kotadan düşer', async () => {
    session.characterId = 'kara_yargic';
    await ask();
    expect(incrementMessageCount).toHaveBeenCalledTimes(1);
  });
});
