import { Test, TestingModule } from '@nestjs/testing';
import { NpcsController } from './npcs.controller';
import { NpcsService } from './npcs.service';
import { AuthService } from '../auth/auth.service';
import { LlmCreditError } from '../llm/client/gemini-client';

describe('NpcsController', () => {
  let controller: NpcsController;
  let session: Record<string, unknown>;
  let sentToday: number;
  let incrementMessageCount: jest.Mock;
  let interact: jest.Mock;
  let confront: jest.Mock;
  let verifyQuote: jest.Mock;

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
    interact = jest.fn();
    confront = jest.fn();
    verifyQuote = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcsController],
      providers: [
        {
          provide: NpcsService,
          useValue: {
            interact,
            confront,
            verifyQuote,
            assertConfrontable: jest.fn(),
            assertVerifiable: jest.fn(),
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

  describe('API kredisi bitince (402) sorgu hakkı harcanmaz', () => {
    beforeEach(() => {
      session.characterId = 'kara_yargic';
      const failure = () => Promise.reject(new LlmCreditError());
      interact.mockImplementation(failure);
      confront.mockImplementation(failure);
      verifyQuote.mockImplementation(failure);
    });

    it.each<[string, () => Promise<unknown>]>([
      ['interact', () => ask()],
      [
        'confront',
        () =>
          controller.confront('owner', {
            sessionId: 'session-1',
            npcId: 'tavern',
            evidenceId: 'ev-1',
          }),
      ],
      [
        'verify-quote',
        () =>
          controller.verifyQuote('owner', {
            sessionId: 'session-1',
            npcId: 'tavern',
            quoteId: 'q-1',
          }),
      ],
    ])('%s', async (_name, call) => {
      await expect(call()).rejects.toBeInstanceOf(LlmCreditError);
      expect(incrementMessageCount).not.toHaveBeenCalled();
    });
  });

  it('diğer karakterlerin her mesajı kotadan düşer', async () => {
    session.characterId = 'kara_yargic';
    await ask();
    expect(incrementMessageCount).toHaveBeenCalledTimes(1);
  });
});
