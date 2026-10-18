import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  canonicalItemId,
  findMarketItem,
  itemIdAliases,
  MARKET_ITEMS_CATALOG,
  MarketItemDef,
} from './market-catalog';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  avatar?: string;
  username?: string | null;
  isSelf?: boolean;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Varsayılan + satın alınan eşya id'leri. Katalogdan çıkarılmış eşyalar elenir (DB satırı silinmez). */
  private ownedIdsFrom(purchases: { itemId: string }[]): string[] {
    const defaultOwnedIds = MARKET_ITEMS_CATALOG.filter((i) => i.ownedByDefault).map(
      (i) => i.id,
    );
    const purchasedIds = purchases
      .map((p) => canonicalItemId(p.itemId))
      .filter((id) => findMarketItem(id));
    return Array.from(new Set([...defaultOwnedIds, ...purchasedIds]));
  }

  /**
   * Kullanıcının token bakiyesi, sahip olduğu eşyalar ve işlem geçmişini döner.
   */
  async getBalanceAndInventory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        tokenBalance: true,
        score: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    const purchases = await this.prisma.userPurchase.findMany({
      where: { userId },
      select: { itemId: true, category: true, createdAt: true },
    });

    // Son 30 token hareketi (ledger)
    const ledger = await this.prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        amount: true,
        balanceAfter: true,
        reason: true,
        metadata: true,
        createdAt: true,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
      score: user.score,
      isAdmin: user.isAdmin,
      ownedItemIds: this.ownedIdsFrom(purchases),
      ledger,
    };
  }

  /**
   * Sunucuda doğrulanan eşya satın alımı.
   */
  async purchaseItem(userId: string, itemId: string) {
    const item = findMarketItem(itemId);
    if (!item) {
      throw new BadRequestException('Böyle bir market eşyası bulunamadı.');
    }

    if (item.ownedByDefault) {
      return {
        success: true,
        message: 'Bu eşya başlangıçtan itibaren hesabında açık.',
        item,
      };
    }

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, tokenBalance: true, isAdmin: true },
      });

      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı.');
      }

      const existing = await tx.userPurchase.findFirst({
        where: { userId, itemId: { in: itemIdAliases(itemId) } },
      });

      if (existing) {
        throw new BadRequestException('Bu eşyaya zaten sahipsin.');
      }

      if (user.tokenBalance < item.price) {
        throw new BadRequestException(
          `Yetersiz bakiye. Bu eşya ${item.price} token, senin bakiyen ise ${user.tokenBalance} token.`,
        );
      }

      const newBalance = user.tokenBalance - item.price;

      // Bakiyeyi güncelle
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: newBalance },
      });

      // Satın alımı kaydet
      const purchase = await tx.userPurchase.create({
        data: {
          userId,
          itemId: item.id,
          category: item.category,
          pricePaid: item.price,
        },
      });

      // Ledger (hareket kaydı) ekle
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -item.price,
          balanceAfter: newBalance,
          reason: 'ITEM_PURCHASE',
          metadata: {
            itemId: item.id,
            category: item.category,
            title: item.title,
          },
        },
      });

      const allPurchases = await tx.userPurchase.findMany({
        where: { userId },
        select: { itemId: true },
      });

      this.logger.log(`User ${userId} purchased ${itemId} for ${item.price} tokens. New balance: ${newBalance}`);

      return {
        success: true,
        tokenBalance: newBalance,
        purchasedItem: item,
        ownedItemIds: this.ownedIdsFrom(allPurchases),
      };
    });
  }

  /**
   * Kullanıcının belirtilen eşyaya sahip olup olmadığını doğrular.
   * Admin kullanıcılar her şeye erişebilir.
   */
  async hasPurchased(userId: string, itemId: string): Promise<boolean> {
    const item = findMarketItem(itemId);
    if (item?.ownedByDefault) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (user?.isAdmin) return true;

    const purchase = await this.prisma.userPurchase.findFirst({
      where: { userId, itemId: { in: itemIdAliases(itemId) } },
    });

    return !!purchase;
  }

  /**
   * Vaka kazanıldığında (condemn) kullanıcıya token ve puan ödülü verir.
   */
  async awardCaseReward(
    userId: string,
    sessionId: string,
    dayNumber: number,
    // İkinci Nefes (Yeşim Hekim) ile çözülen vakada ödül ve puan yarıya iner, hızlı bonus yok
    // Hüküm Dosyası: raporun puanı ödülü ve sıralama puanını ölçekler (0.5–1; rapor yoksa 1)
    options: { halved?: boolean; multiplier?: number } = {},
  ) {
    const halved = options.halved === true;
    const multiplier = Math.max(0, Math.min(1, options.multiplier ?? 1));
    const baseReward = halved ? 50 : 100;
    const fastBonus = !halved && dayNumber <= 2 ? 50 : 0;
    const totalReward = Math.round((baseReward + fastBonus) * multiplier);

    const baseScore = halved ? 50 : 100;
    const fastScoreBonus = halved ? 0 : dayNumber <= 2 ? 50 : 10;
    const totalScore = Math.round((baseScore + fastScoreBonus) * multiplier);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, tokenBalance: true, score: true },
      });

      if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

      const newBalance = user.tokenBalance + totalReward;
      const newScore = user.score + totalScore;

      await tx.user.update({
        where: { id: userId },
        data: {
          tokenBalance: newBalance,
          score: newScore,
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: totalReward,
          balanceAfter: newBalance,
          reason: 'CASE_REWARD',
          metadata: {
            sessionId,
            dayNumber,
            baseReward,
            fastBonus,
            scoreAwarded: totalScore,
            halved,
            reportMultiplier: multiplier,
          },
        },
      });

      this.logger.log(
        `Awarded ${totalReward} tokens and ${totalScore} points to user ${userId} for session ${sessionId} (day ${dayNumber})`,
      );

      return {
        rewardTokens: totalReward,
        scoreEarned: totalScore,
        tokenBalance: newBalance,
        newScore,
      };
    });
  }

  /**
   * Token kredilendirmesi (Stripe ödemesi veya admin aktarımı).
   */
  async creditTokens(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Yüklenecek token tutarı pozitif olmalıdır.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, tokenBalance: true },
      });

      if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

      const newBalance = user.tokenBalance + amount;

      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: newBalance },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount,
          balanceAfter: newBalance,
          reason,
          metadata: metadata || null,
        },
      });

      this.logger.log(`Credited ${amount} tokens to user ${userId}. Reason: ${reason}. New balance: ${newBalance}`);

      return {
        success: true,
        tokenBalance: newBalance,
      };
    });
  }

  /**
   * Sıralama tablosunu (Leaderboard) döner.
   */
  async getLeaderboard(currentUserId?: string) {
    const topUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        score: true,
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 10,
    });

    const formatName = (u: { email: string; username?: string | null }) => {
      if (u.username) {
        return u.username;
      }
      const namePart = u.email.split('@')[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return `Engizitör ${capitalized}`;
    };

    const entries: LeaderboardEntry[] = topUsers.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      name: formatName(u),
      score: u.score,
      avatar: u.avatar || 'avatar_1',
      username: u.username,
      isSelf: currentUserId ? u.id === currentUserId : false,
    }));

    let selfEntry: LeaderboardEntry | null = null;

    if (currentUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, email: true, username: true, avatar: true, score: true },
      });

      if (currentUser) {
        const higherCount = await this.prisma.user.count({
          where: { score: { gt: currentUser.score } },
        });
        selfEntry = {
          rank: higherCount + 1,
          userId: currentUser.id,
          name: formatName(currentUser),
          score: currentUser.score,
          avatar: currentUser.avatar || 'avatar_1',
          username: currentUser.username,
          isSelf: true,
        };
      }
    }

    return {
      leaderboard: entries,
      self: selfEntry,
    };
  }
}
