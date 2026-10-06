import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MarketService } from './market.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MarketService', () => {
  let service: MarketService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      userPurchase: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      tokenTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    service = new MarketService(mockPrisma as unknown as PrismaService);
  });

  describe('getBalanceAndInventory', () => {
    it('kullanıcının bakiyesini, sahip olduğu eşyaları ve hareketleri döner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'inquisitor@church.va',
        tokenBalance: 750,
        score: 250,
        isAdmin: false,
      });

      mockPrisma.userPurchase.findMany.mockResolvedValue([
        { itemId: 'universe_modern', category: 'universe', createdAt: new Date() },
      ]);

      mockPrisma.tokenTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          amount: -500,
          balanceAfter: 750,
          reason: 'ITEM_PURCHASE',
          metadata: { itemId: 'universe_modern' },
          createdAt: new Date(),
        },
      ]);

      const result = await service.getBalanceAndInventory('user-1');

      expect(result.tokenBalance).toBe(750);
      expect(result.score).toBe(250);
      expect(result.ownedItemIds).toContain('universe_medieval'); // Varsayılan açık
      expect(result.ownedItemIds).toContain('universe_modern');
      expect(result.ledger.length).toBe(1);
    });

    it('kullanıcı bulunamazsa UnauthorizedException fırlatır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getBalanceAndInventory('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('purchaseItem', () => {
    it('yeterli bakiye ile eşyayı satın alır, bakiyeyi düşer ve ledger kaydı oluşturur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 1000,
        isAdmin: false,
      });
      mockPrisma.userPurchase.findUnique.mockResolvedValue(null);
      mockPrisma.userPurchase.create.mockResolvedValue({
        id: 'p-1',
        userId: 'user-1',
        itemId: 'universe_modern',
        pricePaid: 500,
      });
      mockPrisma.userPurchase.findMany.mockResolvedValue([
        { itemId: 'universe_modern' },
      ]);

      const result = await service.purchaseItem('user-1', 'universe_modern');

      expect(result.success).toBe(true);
      expect(result.tokenBalance).toBe(500);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenBalance: 500 },
      });
      expect(mockPrisma.tokenTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            amount: -500,
            balanceAfter: 500,
            reason: 'ITEM_PURCHASE',
          }),
        }),
      );
    });

    it('china ve winter evrenlerini doğru fiyatla (650 token) satın alır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 1000,
        isAdmin: false,
      });
      mockPrisma.userPurchase.findUnique.mockResolvedValue(null);
      mockPrisma.userPurchase.create.mockResolvedValue({
        id: 'p-china',
        userId: 'user-1',
        itemId: 'universe_china',
        pricePaid: 650,
      });
      mockPrisma.userPurchase.findMany.mockResolvedValue([
        { itemId: 'universe_china' },
      ]);

      const resultChina = await service.purchaseItem('user-1', 'universe_china');
      expect(resultChina.success).toBe(true);
      expect(resultChina.tokenBalance).toBe(350);
      expect(resultChina.purchasedItem.title).toBe('Jinling');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 1000,
        isAdmin: false,
      });
      mockPrisma.userPurchase.create.mockResolvedValue({
        id: 'p-winter',
        userId: 'user-1',
        itemId: 'universe_winter',
        pricePaid: 650,
      });
      mockPrisma.userPurchase.findMany.mockResolvedValue([
        { itemId: 'universe_winter' },
      ]);

      const resultWinter = await service.purchaseItem('user-1', 'universe_winter');
      expect(resultWinter.success).toBe(true);
      expect(resultWinter.tokenBalance).toBe(350);
      expect(resultWinter.purchasedItem.title).toBe('Frosthold');
    });

    it('yetersiz bakiyede BadRequestException fırlatır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 200,
        isAdmin: false,
      });
      mockPrisma.userPurchase.findUnique.mockResolvedValue(null);

      await expect(
        service.purchaseItem('user-1', 'universe_modern'),
      ).rejects.toThrow(BadRequestException);
    });

    it('zaten sahip olunan eşyada BadRequestException fırlatır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 1000,
        isAdmin: false,
      });
      mockPrisma.userPurchase.findUnique.mockResolvedValue({ id: 'p-existing' });

      await expect(
        service.purchaseItem('user-1', 'universe_modern'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('hasPurchased', () => {
    it('varsayılan eşyalar (easy, medieval) için true döner', async () => {
      expect(await service.hasPurchased('user-1', 'universe_medieval')).toBe(true);
      expect(await service.hasPurchased('user-1', 'difficulty_easy')).toBe(true);
    });

    it('admin kullanıcılar için her şeye true döner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isAdmin: true });
      expect(await service.hasPurchased('admin-1', 'universe_cyberpunk')).toBe(true);
    });

    it('satın almamış normal kullanıcı için false döner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isAdmin: false });
      mockPrisma.userPurchase.findUnique.mockResolvedValue(null);
      expect(await service.hasPurchased('user-1', 'universe_cyberpunk')).toBe(false);
    });
  });

  describe('awardCaseReward', () => {
    it('vaka kazanıldığında 100 baz token ve erken çözüm bonusunu verir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tokenBalance: 1000,
        score: 0,
      });

      // 1. Günde çözülen vaka (erken çözüm)
      const result = await service.awardCaseReward('user-1', 'session-1', 1);

      expect(result.rewardTokens).toBe(150); // 100 + 50
      expect(result.scoreEarned).toBe(150);
      expect(result.tokenBalance).toBe(1150);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenBalance: 1150, score: 150 },
      });
      expect(mockPrisma.tokenTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 150,
            reason: 'CASE_REWARD',
          }),
        }),
      );
    });
  });

  describe('getLeaderboard', () => {
    it('skora göre sıralanmış lider tablosunu ve kullanıcının sırasını döner', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'malachar@church.va', score: 500 },
        { id: 'u2', email: 'berke@inquisitor.ai', score: 300 },
      ]);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u2',
        email: 'berke@inquisitor.ai',
        score: 300,
      });
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getLeaderboard('u2');

      expect(result.leaderboard.length).toBe(2);
      expect(result.leaderboard[0].name).toBe('Engizitör Malachar');
      expect(result.leaderboard[0].score).toBe(500);
      expect(result.self?.rank).toBe(2);
      expect(result.self?.score).toBe(300);
    });
  });
});
