import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { GameSessionsService } from './game-sessions.service';

const activeSession = {
  id: 'session-1',
  userId: 'owner',
  status: 'ACTIVE',
  culpritId: 'mill',
  truthReveal: 'Değirmenci yaptı.',
  locationClues: { tavern: 'Kanlı mendil' },
  caseFacts: { culpritId: 'mill' },
  currentDay: 1,
  timeOfDay: 0,
  notes: '',
  activeWarrants: [] as string[],
  usedWarrants: [] as string[],
};

const SECRET_FIELDS = [
  'culpritId',
  'truthReveal',
  'locationClues',
  'caseFacts',
];

function setup(session: Record<string, unknown> = activeSession) {
  const gameSession = {
    findUnique: jest.fn().mockResolvedValue(session),
    findUniqueOrThrow: jest
      .fn()
      .mockResolvedValue({ ...session, npcStates: [] }),
    findFirst: jest.fn().mockResolvedValue(session),
    update: jest
      .fn()
      .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...session, ...data }),
      ),
  };
  const prisma = {
    gameSession,
    sessionNpcState: { update: jest.fn() },
  } as unknown as PrismaService;
  const service = new GameSessionsService(prisma, {} as LlmService);
  return { service, gameSession, prisma };
}

const expectNoSecrets = (result: object) => {
  for (const field of SECRET_FIELDS) expect(result).not.toHaveProperty(field);
};

describe('GameSessionsService — erişim ve gizlilik', () => {
  it('aktif oturumu okurken gizli alanları döndürmez', async () => {
    const { service } = setup();
    expectNoSecrets(await service.getSession('session-1', 'owner'));
  });

  it('aktif oturumu bulurken gizli alanları döndürmez', async () => {
    const { service } = setup();
    expectNoSecrets((await service.findActiveSession('owner'))!);
  });

  it('gün bitirme, zaman, not ve izin cevaplarında gizli alan yok', async () => {
    const { service } = setup();
    expectNoSecrets(await service.endDay('session-1', 'owner'));
    expectNoSecrets(await service.advanceTime('session-1', 'owner'));
    expectNoSecrets(await service.updateNotes('session-1', 'owner', 'not'));
    expectNoSecrets(
      await service.consumeWarrant('session-1', 'owner', 'tavern'),
    );
  });

  it.each([
    [
      'getSession',
      (s: GameSessionsService) => s.getSession('session-1', 'intruder'),
    ],
    ['endDay', (s: GameSessionsService) => s.endDay('session-1', 'intruder')],
    [
      'advanceTime',
      (s: GameSessionsService) => s.advanceTime('session-1', 'intruder'),
    ],
    [
      'updateNotes',
      (s: GameSessionsService) => s.updateNotes('session-1', 'intruder', 'x'),
    ],
    [
      'condemnNpc',
      (s: GameSessionsService) => s.condemnNpc('session-1', 'intruder', 'mill'),
    ],
    [
      'consumeWarrant',
      (s: GameSessionsService) =>
        s.consumeWarrant('session-1', 'intruder', 'tavern'),
    ],
    [
      'timeoutSession',
      (s: GameSessionsService) => s.timeoutSession('session-1', 'intruder'),
    ],
    [
      'getEvidence',
      (s: GameSessionsService) => s.getEvidence('session-1', 'intruder'),
    ],
  ])(
    '%s başkasının oturumunda "bulunamadı" verir ve hiçbir şey yazmaz',
    async (_name, call) => {
      const { service, gameSession } = setup();
      await expect(call(service)).rejects.toBeInstanceOf(NotFoundException);
      expect(gameSession.update).not.toHaveBeenCalled();
    },
  );

  it('mahkum etme sonrası gerçek açılır', async () => {
    const { service } = setup();
    const result = await service.condemnNpc('session-1', 'owner', 'mill');
    expect(result.won).toBe(true);
    expect(result.session).toHaveProperty('truthReveal');
  });

  it('Hüküm Dosyası puanlanır, kaydedilir ve ödülü ölçekler (test modunda hakem şablondur)', async () => {
    const facts = {
      culpritId: 'mill',
      innocentIds: ['tavern'],
      crimeSceneClue: {
        implicatedNpcIds: ['mill'],
        eliminatedNpcIds: ['tavern'],
      },
      verification: {
        kind: 'CORROBORATION',
        placement: { type: 'LOCATION', locationId: 'mill' },
      },
      victim: { name: 'Lord', profession: 'Lord' },
      alibis: { tavern: 'barda' },
      weaponId: 'sickle',
      motive: 'DEBT',
      timeOfDeath: 'MIDNIGHT',
      involvements: [{ npcId: 'tavern', kind: 'NONE', aboutNpcId: 'mill' }],
    };
    const session = {
      ...activeSession,
      scenarioType: 'medieval',
      difficulty: 'easy',
      isTestMode: true,
      caseFacts: facts,
    };
    const { gameSession, prisma } = setup(session);
    (prisma as unknown as { evidence: object }).evidence = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'e1',
          kind: 'CLUE',
          category: 'ITEM',
          sourceId: 'crime_scene',
          text: 'iz',
        },
      ]),
    };
    const market = {
      awardCaseReward: jest.fn().mockResolvedValue({ rewardTokens: 75 }),
    };
    const service = new GameSessionsService(
      prisma,
      {} as LlmService,
      market as never,
    );
    const result = await service.condemnNpc('session-1', 'owner', 'mill', {
      evidenceIds: ['e1'],
      weaponId: 'dagger',
      motive: 'DEBT',
      timeOfDeath: 'MIDNIGHT',
      involvements: { tavern: 'NONE' },
    });
    // Kanıt 20 + motif 15 + saat 10 + bağ 20 = 65; silah yanlış, anlatım boş
    expect(result.verdict?.total).toBe(65);
    const [saved] = gameSession.update.mock.calls.at(-1) as [
      { data: { status: string; verdictReport: { condemnedNpcId: string } } },
    ];
    expect(saved.data.status).toBe('WON');
    expect(saved.data.verdictReport.condemnedNpcId).toBe('mill');
    expect(market.awardCaseReward).toHaveBeenCalledWith(
      'owner',
      'session-1',
      1,
      {
        halved: false,
        multiplier: 0.825,
      },
    );
  });

  it('gün sonunda korku azalır; Vizör Kilidi ve Çatı Geçişi bedeli uygulanır', async () => {
    const session = {
      ...activeSession,
      abilityState: { uses: {}, visorLockNpcId: 'mill', lostMorningDay: 2 },
    };
    const { service, gameSession, prisma } = setup(session);
    gameSession.findUniqueOrThrow.mockResolvedValue({
      ...session,
      npcStates: [
        { id: 's-mill', npcId: 'mill', currentFear: 5 },
        { id: 's-tavern', npcId: 'tavern', currentFear: 5 },
      ],
    });
    await service.endDay('session-1', 'owner');
    expect(gameSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { currentDay: 2, timeOfDay: 1 } }),
    );
    const fearUpdates = (
      prisma.sessionNpcState.update as jest.Mock
    ).mock.calls.map(
      ([arg]: [{ where: { id: string }; data: { currentFear: number } }]) => [
        arg.where.id,
        arg.data.currentFear,
      ],
    );
    expect(fearUpdates).toEqual([
      ['s-mill', 5],
      ['s-tavern', 4],
    ]);
  });

  it('son günden sonra gün bitirilemez; hüküm verilir', async () => {
    const { service, gameSession } = setup({ ...activeSession, currentDay: 4 });
    await expect(service.endDay('session-1', 'owner')).rejects.toThrow(
      'son günündesin',
    );
    expect(gameSession.update).not.toHaveBeenCalled();
  });

  it('herkese açık oturumda vakanın son günü (lastDay) yer alır', async () => {
    const { service } = setup();
    expect(await service.getSession('session-1', 'owner')).toMatchObject({
      lastDay: 4,
    });
  });

  describe('İkinci Nefes (Yeşim Hekim)', () => {
    const hekim = { ...activeSession, characterId: 'yesim_hekim' };

    it('ilk yanlış hüküm vakayı bitirmez: masum aklanır, gün kapanır, cevapta suçlu yok', async () => {
      const { service, gameSession } = setup(hekim);
      const result = await service.condemnNpc('session-1', 'owner', 'tavern');
      expect(result).toMatchObject({
        won: false,
        spared: true,
        clearedNpcId: 'tavern',
        reward: null,
      });
      expectNoSecrets(result);
      expectNoSecrets(result.session);
      expect(result).not.toHaveProperty('culpritId');
      // Hiçbir güncelleme oturumu LOST yapmaz
      for (const [arg] of gameSession.update.mock.calls as [
        { data: { status?: string } },
      ][]) {
        expect(arg.data.status).toBeUndefined();
      }
      expect(gameSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentDay: 2, timeOfDay: 0 } }),
      );
    });

    it('son günde verilen yanlış hüküm vakayı bir gün uzatır', async () => {
      const { service, gameSession } = setup({ ...hekim, currentDay: 4 });
      await service.condemnNpc('session-1', 'owner', 'tavern');
      expect(gameSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            abilityState: expect.objectContaining({
              secondBreath: { clearedNpcId: 'tavern', extended: true },
            }),
          },
        }),
      );
      expect(gameSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentDay: 5, timeOfDay: 0 } }),
      );
    });

    it('ikinci yanlış hüküm vakayı kaybettirir', async () => {
      const used = {
        ...hekim,
        abilityState: {
          uses: {},
          secondBreath: { clearedNpcId: 'tavern', extended: false },
        },
      };
      const { service } = setup(used);
      const result = await service.condemnNpc('session-1', 'owner', 'farm');
      expect(result.won).toBe(false);
      expect(result).not.toHaveProperty('spared');
    });

    it('aklanan kişi tekrar mahkûm edilemez', async () => {
      const used = {
        ...hekim,
        abilityState: {
          uses: {},
          secondBreath: { clearedNpcId: 'tavern', extended: false },
        },
      };
      const { service } = setup(used);
      await expect(
        service.condemnNpc('session-1', 'owner', 'tavern'),
      ).rejects.toThrow('masum');
    });

    it('doğru hüküm normal biter; başka karakterde yanlış hüküm hemen kaybettirir', async () => {
      const win = await setup(hekim).service.condemnNpc(
        'session-1',
        'owner',
        'mill',
      );
      expect(win.won).toBe(true);
      const lose = await setup(activeSession).service.condemnNpc(
        'session-1',
        'owner',
        'tavern',
      );
      expect(lose).toMatchObject({ won: false });
      expect(lose).not.toHaveProperty('spared');
    });
  });

  it('kazanılmış vaka süre dolunca kayba çevrilmez', async () => {
    const { service, gameSession } = setup({ ...activeSession, status: 'WON' });
    const result = await service.timeoutSession('session-1', 'owner');
    expect(gameSession.update).not.toHaveBeenCalled();
    expect(result.won).toBe(true);
  });
});

describe('GameSessionsService — vaka kurulumu (test modu)', () => {
  function setupCreate() {
    const create = jest
      .fn()
      .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'new-session', ...data }),
      );
    const prisma = {
      gameSession: { updateMany: jest.fn(), create },
      npc: { findMany: jest.fn().mockResolvedValue([]) },
      sessionNpcState: { create: jest.fn() },
    } as unknown as PrismaService;
    const service = new GameSessionsService(prisma, {} as LlmService);
    return { service, create };
  }

  it.each(['easy', 'medium', 'hard'])(
    '%s: vaka gerçekleri kaydedilir, oyuncuya gönderilmez',
    async (difficulty) => {
      const { service, create } = setupCreate();
      const result = await service.createSession(
        'owner',
        difficulty,
        'medieval',
        true,
      );

      expectNoSecrets(result);

      const saved = create.mock.calls[0][0].data as {
        culpritId: string;
        caseFacts: {
          culpritId: string;
          innocentIds: string[];
          crimeSceneClueText: string;
          verificationText: string;
          victim: { name: string };
          alibis: Record<string, string>;
          crimeSceneClue: { eliminatedNpcIds: string[] };
        };
        locationClues: Record<string, string>;
      };
      const facts = saved.caseFacts;
      expect(facts.culpritId).toBe(saved.culpritId);
      expect(facts.crimeSceneClueText).toBeTruthy();
      expect(facts.verificationText).toBeTruthy();
      expect(facts.victim.name).toBeTruthy();
      // Her masumun bir mazereti var, suçlunun yok
      expect(Object.keys(facts.alibis).sort()).toEqual(
        [...facts.innocentIds].sort(),
      );
      expect(facts.alibis).not.toHaveProperty(facts.culpritId);
      expect(saved.locationClues.crime_scene).toBeTruthy();
    },
  );

  it('paket üret ve paketten kur bağımsız çalışabilir', async () => {
    const { service, create } = setupCreate();
    const pkg = await service.generateStoryPackage('medieval', 'easy', {
      testMode: true,
    });
    expect(pkg.plan).toBeDefined();
    expect(pkg.facts).toBeDefined();
    expect(pkg.draft).toBeDefined();
    expect(create).not.toHaveBeenCalled();

    const session = await service.setupSessionFromPackage('owner', pkg, {
      isTestMode: true,
      storyId: 'story-xyz',
    });

    expect(create).toHaveBeenCalledTimes(1);
    const createdData = create.mock.calls[0][0].data;
    expect(createdData.storyId).toBe('story-xyz');
    expect(createdData.culpritId).toBe(pkg.plan.culpritId);
    expectNoSecrets(session);
  });

  describe('STORY_POOL_ENABLED ve havuzdan vaka açma', () => {
    afterEach(() => {
      delete process.env.STORY_POOL_ENABLED;
    });

    it('havuz açıkken ve onaylı hikâye varken yapay zekâ çağrılmaz, storyId bağlanır', async () => {
      process.env.STORY_POOL_ENABLED = 'true';
      const { create } = setupCreate();
      const mockLlm = {
        generateSessionScenario: jest.fn(),
      } as unknown as LlmService;

      const mockStoryPool = {
        isPoolEnabled: jest.fn().mockReturnValue(true),
        findAvailableStory: jest.fn().mockResolvedValue({
          id: 'pooled-story-123',
          package: {
            scenarioType: 'medieval',
            difficulty: 'easy',
            plan: {
              culpritId: 'mill',
              innocentIds: ['tavern'],
              crimeSceneClue: { authentic: true, poolClueId: 'c1' },
              verification: {
                kind: 'CORROBORATION',
                placement: { type: 'LOCATION' },
              },
            },
            facts: {
              culpritId: 'mill',
              innocentIds: ['tavern'],
              crimeSceneClueText: 'ipucu',
              verificationText: 'kanıt',
              victim: { name: 'Kurban' },
              alibis: { tavern: 'oradaydı' },
            },
            draft: {
              scenario: 'Havuzdan gelen hikaye.',
              truthReveal: 'Değirmenci yaptı.',
              culpritId: 'mill',
              npcPrompts: { mill: 'promp1' },
              locationClues: { crime_scene: 'ipucu' },
            },
          },
        }),
      };

      const prisma = {
        gameSession: { updateMany: jest.fn(), create },
        npc: { findMany: jest.fn().mockResolvedValue([]) },
        sessionNpcState: { create: jest.fn() },
      } as unknown as PrismaService;

      const serviceWithPool = new GameSessionsService(
        prisma,
        mockLlm,
        undefined,
        mockStoryPool as any,
      );

      const session = await serviceWithPool.createSession(
        'owner',
        'easy',
        'medieval',
        false,
      );

      // Yalnızca güncel kural sürümündeki (personalı, wildcard listeli) hikâyeler seçilir
      expect(mockStoryPool.findAvailableStory).toHaveBeenCalledWith('owner', {
        universe: 'medieval',
        difficulty: 'easy',
        minRuleVersion: 5,
      });
      expect(mockLlm.generateSessionScenario).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0][0].data.storyId).toBe('pooled-story-123');
      expect(create.mock.calls[0][0].data.scenario).toBe(
        'Havuzdan gelen hikaye.',
      );
      expectNoSecrets(session);
    });

    it('havuz boşsa canlı üretime düşer', async () => {
      process.env.STORY_POOL_ENABLED = 'true';
      const { create } = setupCreate();
      const mockLlm = {
        generateSessionScenario: jest.fn().mockResolvedValue({
          scenario: 'Canlı üretilen hikaye.',
          truthReveal: 'Canlı gerçek.',
          culpritId: 'mill',
          npcPrompts: {},
          locationClues: { crime_scene: 'canlı iz' },
        }),
      } as unknown as LlmService;

      const mockStoryPool = {
        isPoolEnabled: jest.fn().mockReturnValue(true),
        findAvailableStory: jest.fn().mockResolvedValue(null),
      };

      const prisma = {
        gameSession: { updateMany: jest.fn(), create },
        npc: { findMany: jest.fn().mockResolvedValue([]) },
        sessionNpcState: { create: jest.fn() },
      } as unknown as PrismaService;

      const serviceWithPool = new GameSessionsService(
        prisma,
        mockLlm,
        undefined,
        mockStoryPool as any,
      );

      const session = await serviceWithPool.createSession(
        'owner',
        'easy',
        'medieval',
        false,
      );

      expect(mockStoryPool.findAvailableStory).toHaveBeenCalled();
      expect(mockLlm.generateSessionScenario).toHaveBeenCalled();
      expect(create.mock.calls[0][0].data.storyId).toBeNull();
      expectNoSecrets(session);
    });
  });
});
