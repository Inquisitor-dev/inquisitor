import { StoryPoolService } from './story-pool.service';
import {
  STORY_RULE_VERSION,
  StoryCriteria,
  StoryPackage,
} from './story-package';
import type { PrismaService } from '../prisma/prisma.service';

describe('StoryPoolService', () => {
  let service: StoryPoolService;
  let mockPrisma: {
    story: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  const samplePackage: StoryPackage = {
    scenarioType: 'medieval',
    difficulty: 'easy',
    wildcardCount: 0,
    gameMode: 'standard',
    plan: {
      culpritId: 'mill',
      innocentIds: ['tavern', 'church'],
      murderStyle: 'PLANNED',
      sceneState: 'TIDY',
      crimeSceneId: 'crime_scene',
      crimeSceneClue: {
        poolClueId: 'mum',
        poolClueText: 'Mum damlası',
        authentic: true,
        implicatedNpcIds: ['mill'],
        eliminatedNpcIds: ['tavern', 'church'],
      },
      verification: {
        kind: 'CORROBORATION',
        placement: { type: 'LOCATION', locationId: 'mill' },
      },
    } as any,
    facts: {
      culpritId: 'mill',
      innocentIds: ['tavern', 'church'],
      crimeSceneClueText: 'Mum damlası',
      verificationText: 'İzi doğrulayan kanıt',
      victim: { name: 'Kurban', profession: 'Tüccar' },
      alibis: { tavern: 'Meyhanedeydi', church: 'Kilisedeydi' },
    } as any,
    draft: {
      scenario: 'Bir cinayet işlendi.',
      truthReveal: 'Değirmenci yaptı.',
      culpritId: 'mill',
      npcPrompts: { mill: 'Sen katilsin.', tavern: 'Masumsun.' },
      locationClues: { crime_scene: 'Mum damlası.' },
    },
  };

  beforeEach(() => {
    mockPrisma = {
      story: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    service = new StoryPoolService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    delete process.env.STORY_POOL_ENABLED;
  });

  describe('isPoolEnabled', () => {
    it('STORY_POOL_ENABLED true ise true döner', () => {
      process.env.STORY_POOL_ENABLED = 'true';
      expect(service.isPoolEnabled()).toBe(true);
    });

    it('STORY_POOL_ENABLED tanımlı değilse ya da false ise false döner', () => {
      delete process.env.STORY_POOL_ENABLED;
      expect(service.isPoolEnabled()).toBe(false);
      process.env.STORY_POOL_ENABLED = 'false';
      expect(service.isPoolEnabled()).toBe(false);
    });
  });

  describe('findAvailableStory', () => {
    const criteria: StoryCriteria = {
      universe: 'medieval',
      difficulty: 'easy',
    };

    it('uygun oynanmamış onaylı hikâye varsa rastgele seçip döndürür', async () => {
      mockPrisma.story.findMany.mockResolvedValue([{ id: 'story-1' }]);
      mockPrisma.story.findUnique.mockResolvedValue({
        id: 'story-1',
        universe: 'medieval',
        difficulty: 'easy',
        status: 'APPROVED',
        content: samplePackage,
      });

      const result = await service.findAvailableStory('user-1', criteria);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('story-1');
      expect(result?.package.draft.scenario).toBe('Bir cinayet işlendi.');
      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: {
          universe: 'medieval',
          difficulty: 'easy',
          status: 'APPROVED',
          NOT: {
            sessions: {
              some: { userId: 'user-1' },
            },
          },
        },
        select: { id: true },
      });
    });

    it('havuzda uygun hikâye yoksa null döner', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      const result = await service.findAvailableStory('user-1', criteria);
      expect(result).toBeNull();
      expect(mockPrisma.story.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('saveDraft, approveStory, rejectStory', () => {
    it('saveDraft hikâyeyi DRAFT olarak kaydeder', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'new-story' });
      const criteria: StoryCriteria = {
        universe: 'cyberpunk',
        difficulty: 'hard',
      };

      await service.saveDraft(criteria, samplePackage, 2);

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: {
          universe: 'cyberpunk',
          difficulty: 'hard',
          wildcardCount: 0,
          gameMode: 'standard',
          content: samplePackage,
          status: 'DRAFT',
          ruleVersion: 2,
        },
      });
    });

    it('saveDraft verilen durumu ve doğrulama/hakem sonucunu yazar', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'rejected-story' });
      const reviewResults = { validation: { valid: false } };

      await service.saveDraft(
        { universe: 'winter', difficulty: 'easy' },
        samplePackage,
        2,
        { status: 'REJECTED', reviewResults },
      );

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'REJECTED',
          reviewResults,
        }),
      });
    });

    it('approveStory durumu APPROVED yapar ve inceleme sonucunu ekler', async () => {
      mockPrisma.story.update.mockResolvedValue({
        id: 'story-1',
        status: 'APPROVED',
      });

      await service.approveStory('story-1', { verdict: 'PASS', issues: [] });

      expect(mockPrisma.story.update).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        data: {
          status: 'APPROVED',
          reviewResults: { verdict: 'PASS', issues: [] },
        },
      });
    });

    it('rejectStory durumu REJECTED yapar', async () => {
      mockPrisma.story.update.mockResolvedValue({
        id: 'story-1',
        status: 'REJECTED',
      });

      await service.rejectStory('story-1', {
        verdict: 'REJECT',
        issues: ['hata'],
      });

      expect(mockPrisma.story.update).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        data: {
          status: 'REJECTED',
          reviewResults: { verdict: 'REJECT', issues: ['hata'] },
        },
      });
    });
  });

  describe('getPoolStats', () => {
    it('gruplanmış kova sayılarını döner', async () => {
      const stats = [
        {
          universe: 'medieval',
          difficulty: 'easy',
          status: 'APPROVED',
          _count: { id: 10 },
        },
      ];
      mockPrisma.story.groupBy.mockResolvedValue(stats);

      const result = await service.getPoolStats();
      expect(result).toBe(stats);
      expect(mockPrisma.story.groupBy).toHaveBeenCalledWith({
        by: ['universe', 'difficulty', 'status'],
        _count: { id: true },
      });
    });
  });

  describe('Vaka Motoru v2 biçimi ve tipleri', () => {
    const v2Package: StoryPackage = {
      scenarioType: 'medieval',
      difficulty: 'easy',
      wildcardCount: 0,
      gameMode: 'standard',
      plan: {
        culpritId: 'mill',
        innocentIds: ['tavern', 'church'],
        murderStyle: 'PLANNED',
        sceneState: 'TIDY',
        crimeSceneId: 'crime_scene',
        crimeSceneClue: {
          poolClueId: 'mum',
          poolClueText: 'Mum damlası',
          authentic: true,
          implicatedNpcIds: ['mill'],
          eliminatedNpcIds: ['tavern', 'church'],
        },
        verification: {
          kind: 'CORROBORATION',
          placement: { type: 'LOCATION', locationId: 'mill' },
        },
        weaponId: 'candlestick',
        motive: 'DEBT',
        timeOfDeath: 'MIDNIGHT',
        involvements: [
          { npcId: 'tavern', kind: 'SHARED_MOTIVE', aboutNpcId: 'mill' },
          { npcId: 'church', kind: 'FULLY_INNOCENT' },
        ],
        fearThresholds: {
          mill: 8,
          tavern: 7,
          church: 6,
        },
      } as any,
      facts: {
        culpritId: 'mill',
        innocentIds: ['tavern', 'church'],
        crimeSceneClueText: 'Mum damlası',
        verificationText: 'İzi doğrulayan kanıt',
        victim: { name: 'Kurban', profession: 'Tüccar' },
        alibis: { tavern: 'Meyhanedeydi', church: 'Kilisedeydi' },
        weaponId: 'candlestick',
        motive: 'DEBT',
        timeOfDeath: 'MIDNIGHT',
        involvements: [
          { npcId: 'tavern', kind: 'SHARED_MOTIVE', aboutNpcId: 'mill' },
          { npcId: 'church', kind: 'FULLY_INNOCENT' },
        ],
        fearThresholds: {
          mill: 8,
          tavern: 7,
          church: 6,
        },
      } as any,
      draft: {
        scenario: 'Bir cinayet işlendi.',
        truthReveal: 'Değirmenci yaptı.',
        culpritId: 'mill',
        npcPrompts: { mill: 'Sen katilsin.', tavern: 'Masumsun.' },
        locationClues: { crime_scene: 'Mum damlası.' },
      },
    };

    it('v2 paketi isV2StoryPackage tarafından tanınır', () => {
      const { isV2StoryPackage } = require('./story-package');
      expect(isV2StoryPackage(v2Package)).toBe(true);
      expect(isV2StoryPackage(samplePackage)).toBe(false);
    });

    it('validateV2StoryPackage v2 alanlarını doğrular ve eksikleri listeler', () => {
      const { validateV2StoryPackage } = require('./story-package');
      const validCheck = validateV2StoryPackage(v2Package);
      expect(validCheck.valid).toBe(true);
      expect(validCheck.errors).toHaveLength(0);

      const invalidCheck = validateV2StoryPackage(samplePackage);
      expect(invalidCheck.valid).toBe(false);
      expect(
        invalidCheck.errors.some((e: string) => e.includes('weaponId')),
      ).toBe(true);
      expect(
        invalidCheck.errors.some((e: string) => e.includes('involvements')),
      ).toBe(true);
    });

    it('saveDraft v2 paketi verildiğinde otomatik ruleVersion: 2 olarak kaydeder', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'v2-story' });
      await service.saveDraft(
        { universe: 'medieval', difficulty: 'easy' },
        v2Package,
      );

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ruleVersion: 2,
        }),
      });
    });

    it('örtü hikâyeli ama personasız paket 3. sürümle kaydedilir (oyuna seçilmez)', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'v3-story' });
      await service.saveDraft(
        { universe: 'medieval', difficulty: 'easy' },
        {
          ...v2Package,
          facts: { ...v2Package.facts, culpritCover: 'Yalnızdım.' },
        },
      );

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ruleVersion: 3 }) as unknown,
      });
    });

    it('personalı (v3) paket güncel kural sürümüyle (4) kaydedilir', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'v4-story' });
      await service.saveDraft(
        { universe: 'medieval', difficulty: 'easy' },
        {
          ...v2Package,
          plan: { ...v2Package.plan, persona: { persona: 'NONE', events: [] } },
          facts: { ...v2Package.facts, culpritCover: 'Yalnızdım.' },
        },
      );

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ruleVersion: STORY_RULE_VERSION,
        }) as unknown,
      });
      expect(STORY_RULE_VERSION).toBe(4);
    });

    it('findAvailableStory minRuleVersion filtresini doğru uygular', async () => {
      mockPrisma.story.findMany.mockResolvedValue([{ id: 'v2-story' }]);
      mockPrisma.story.findUnique.mockResolvedValue({
        id: 'v2-story',
        content: v2Package,
      });

      await service.findAvailableStory('user-1', {
        universe: 'medieval',
        difficulty: 'easy',
        minRuleVersion: 2,
      });

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          ruleVersion: { gte: 2 },
        }),
        select: { id: true },
      });
    });
  });
});
