import { Test, TestingModule } from '@nestjs/testing';
import { NpcsController } from './npcs.controller';
import { NpcsService } from './npcs.service';
import { AuthService } from '../auth/auth.service';

describe('NpcsController', () => {
  let controller: NpcsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcsController],
      providers: [
        {
          provide: NpcsService,
          useValue: {
            interact: jest.fn(),
            getDialogueHistory: jest.fn(),
            getOwnedSession: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            checkAndResetDailyQuota: jest.fn(),
            incrementMessageCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NpcsController>(NpcsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
