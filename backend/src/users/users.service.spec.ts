import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAudioSettings', () => {
    it('kullanıcının ses ayarlarını döndürür', async () => {
      prisma.user.findUnique.mockResolvedValue({
        musicVolume: 0.7,
        musicMuted: false,
        footstepVolume: 0.5,
        footstepMuted: false,
        doorVolume: 0.4,
        doorMuted: true,
      });

      const settings = await service.getAudioSettings('user-1');
      expect(settings.musicVolume).toBe(0.7);
      expect(settings.doorMuted).toBe(true);
    });
  });

  describe('updateAudioSettings', () => {
    it('verilen ses ayarlarını clamp ederek günceller', async () => {
      prisma.user.update.mockResolvedValue({
        musicVolume: 1,
        musicMuted: true,
        footstepVolume: 0.5,
        footstepMuted: false,
        doorVolume: 0.5,
        doorMuted: false,
      });

      const updated = await service.updateAudioSettings('user-1', {
        musicVolume: 1.5,
        musicMuted: true,
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            musicVolume: 1,
            musicMuted: true,
          }),
        }),
      );
      expect(updated.musicMuted).toBe(true);
    });
  });
});
