import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  StoryCriteria,
  StoryPackage,
  parseStoryPackage,
} from './story-package';

@Injectable()
export class StoryPoolService {
  private readonly logger = new Logger(StoryPoolService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hikâye havuzunun açık olup olmadığını STORY_POOL_ENABLED ortam değişkenine göre belirler.
   */
  isPoolEnabled(): boolean {
    return process.env.STORY_POOL_ENABLED === 'true';
  }

  /**
   * Kriterlere uyan ve kullanıcının daha önce oynamadığı rastgele onaylı bir hikâye paketi seçer.
   * Havuzda uygun hikâye yoksa null döner.
   */
  async findAvailableStory(
    userId: string,
    criteria: StoryCriteria,
  ): Promise<{ id: string; package: StoryPackage } | null> {
    const candidates = await this.prisma.story.findMany({
      where: {
        universe: criteria.universe,
        difficulty: criteria.difficulty,
        ...(criteria.wildcardCount !== undefined
          ? { wildcardCount: criteria.wildcardCount }
          : {}),
        ...(criteria.gameMode ? { gameMode: criteria.gameMode } : {}),
        status: 'APPROVED',
        NOT: {
          sessions: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (candidates.length === 0) {
      this.logger.warn(
        `[StoryPool] Kullanıcı ${userId} için ${criteria.universe}/${criteria.difficulty} kriterinde oynanmamış onaylı hikâye bulunamadı.`,
      );
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];

    const story = await this.prisma.story.findUnique({
      where: { id: chosen.id },
    });

    if (!story) return null;

    try {
      const pkg = parseStoryPackage(story.content);
      return { id: story.id, package: pkg };
    } catch (err) {
      this.logger.error(
        `[StoryPool] Hikâye (${story.id}) paketi çözümlenemedi: ${err}`,
      );
      return null;
    }
  }

  /**
   * Üretilen bir hikâye paketini taslak (DRAFT) olarak veritabanına kaydeder.
   */
  async saveDraft(
    criteria: StoryCriteria,
    pkg: StoryPackage,
    ruleVersion: number = 1,
  ) {
    return this.prisma.story.create({
      data: {
        universe: criteria.universe,
        difficulty: criteria.difficulty,
        wildcardCount: criteria.wildcardCount ?? 0,
        gameMode: criteria.gameMode ?? 'standard',
        content: pkg as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
        ruleVersion,
      },
    });
  }

  /**
   * Taslak durumundaki bir hikâyeyi onaylar (APPROVED).
   */
  async approveStory(storyId: string, reviewResults?: unknown) {
    return this.prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'APPROVED',
        ...(reviewResults ? { reviewResults: reviewResults } : {}),
      },
    });
  }

  /**
   * Bir hikâyeyi reddeder (REJECTED).
   */
  async rejectStory(storyId: string, reviewResults?: unknown) {
    return this.prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'REJECTED',
        ...(reviewResults ? { reviewResults: reviewResults } : {}),
      },
    });
  }

  /**
   * Havuzdaki hikâyelerin durumlarına göre kova doluluk sayılarını döner.
   */
  async getPoolStats() {
    return this.prisma.story.groupBy({
      by: ['universe', 'difficulty', 'status'],
      _count: { id: true },
    });
  }
}
