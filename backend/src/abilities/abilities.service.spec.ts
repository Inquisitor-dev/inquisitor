import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AbilitiesService } from './abilities.service';
import { UseAbilityDto } from './dto/use-ability.dto';

const SECRET_FIELDS = [
  'culpritId',
  'truthReveal',
  'locationClues',
  'caseFacts',
];

function setup(
  patch: Record<string, unknown> = {},
  extra: { fear?: number; replies?: string[] } = {},
) {
  const session: Record<string, unknown> = {
    id: 'session-1',
    userId: 'owner',
    status: 'ACTIVE',
    scenarioType: 'medieval',
    difficulty: 'easy',
    characterId: 'kara_yargic',
    culpritId: 'mill',
    truthReveal: 'Değirmenci yaptı.',
    locationClues: {},
    caseFacts: {
      verification: {
        kind: 'FLAW',
        placement: { type: 'LOCATION', locationId: 'church' },
      },
    },
    currentDay: 2,
    timeOfDay: 1,
    boardThoughtDay: 0,
    abilityState: null,
    notes: 'Eski not',
    activeWarrants: [],
    usedWarrants: [],
    ...patch,
  };
  const gameSession = {
    findUnique: jest.fn().mockResolvedValue(session),
    update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
      Object.assign(session, data);
      return Promise.resolve({ ...session });
    }),
  };
  const sessionNpcState = {
    findUnique: jest.fn().mockResolvedValue({
      id: 'state-1',
      npcId: 'mill',
      currentFear: extra.fear ?? 1,
    }),
    findMany: jest.fn().mockResolvedValue([{ npcId: 'mill', currentFear: 6 }]),
    update: jest.fn(),
  };
  const dialogueHistory = {
    findMany: jest
      .fn()
      .mockResolvedValue(
        (extra.replies ?? []).map((message) => ({ message })).reverse(),
      ),
  };
  const evidence = { findMany: jest.fn().mockResolvedValue([]) };
  const prisma = {
    gameSession,
    sessionNpcState,
    dialogueHistory,
    evidence,
  } as unknown as PrismaService;
  return {
    service: new AbilitiesService(prisma),
    gameSession,
    sessionNpcState,
    session,
  };
}

const use = (
  service: AbilitiesService,
  dto: Partial<UseAbilityDto>,
  userId = 'owner',
) => service.use('session-1', userId, dto as UseAbilityDto);

describe('AbilitiesService', () => {
  it('başkasının oturumunda "bulunamadı" verir', async () => {
    const { service, gameSession } = setup();
    await expect(
      use(service, { abilityId: 'threat', npcId: 'mill' }, 'intruder'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(gameSession.update).not.toHaveBeenCalled();
  });

  it('Tehdit korkuyu artırır, kullanım kaydedilir ve gizli alanlar dönmez', async () => {
    const { service, sessionNpcState } = setup();
    const response = await use(service, { abilityId: 'threat', npcId: 'mill' });
    expect(sessionNpcState.update).toHaveBeenCalledWith({
      where: { id: 'state-1' },
      data: { currentFear: 3 },
    });
    expect(response.result.fear).toEqual({
      npcId: 'mill',
      level: 3,
      band: 'UNEASY',
    });
    expect(response.session.abilityState).toEqual({ uses: { threat: [2] } });
    for (const field of SECRET_FIELDS)
      expect(response.session).not.toHaveProperty(field);
  });

  it('aynı gün ikinci kullanım reddedilir', async () => {
    const { service } = setup();
    await use(service, { abilityId: 'threat', npcId: 'mill' });
    await expect(
      use(service, { abilityId: 'threat', npcId: 'mill' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('başka karakterin yeteneği ve vakada olmayan hedef reddedilir', async () => {
    const { service, gameSession } = setup();
    await expect(use(service, { abilityId: 'pulse' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      use(service, { abilityId: 'threat', npcId: 'narrator_mill' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(gameSession.update).not.toHaveBeenCalled();
  });

  it('Tehdit 6’daki şüpheliye hak harcatmaz', async () => {
    const { service, gameSession } = setup({}, { fear: 6 });
    await expect(
      use(service, { abilityId: 'threat', npcId: 'mill' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(gameSession.update).not.toHaveBeenCalled();
  });

  it('Nabız tüm şüphelilerin korkusunu verir', async () => {
    const { service } = setup({ characterId: 'mavi_rozet' });
    const { result } = await use(service, { abilityId: 'pulse' });
    expect(result.pulse?.find((row) => row.npcId === 'mill')).toMatchObject({
      level: 6,
      toThreshold: 1,
    });
    expect(
      result.pulse?.every((row) => !row.npcId.startsWith('narrator_')),
    ).toBe(true);
  });

  it('İz Sürme izin sınırına saymadan arama izni verir', async () => {
    const { service, gameSession } = setup({ characterId: 'kul_avcisi' });
    await use(service, { abilityId: 'tracking', locationId: 'tavern' });
    const data = gameSession.update.mock.calls[0][0].data;
    expect(data.activeWarrants).toEqual(['tavern']);
    expect(data).not.toHaveProperty('warrantsIssued');
    await expect(
      setup({ characterId: 'kul_avcisi' }).service.use('session-1', 'owner', {
        abilityId: 'tracking',
        locationId: 'crime_scene',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Çatı Geçişi ertesi sabahı kaybettirir', async () => {
    const { service } = setup({ characterId: 'neon_kuzgun', timeOfDay: 4 });
    const { session } = await use(service, {
      abilityId: 'rooftop',
      locationId: 'mill',
    });
    expect(session.abilityState).toMatchObject({
      rooftop: { locationId: 'mill', day: 2 },
      lostMorningDay: 3,
    });
  });

  it('Arşiv Özeti son cevapları notlara alıntılar; konuşulmamış kişide hak harcanmaz', async () => {
    const { service } = setup(
      { characterId: 'engizitor_hanim' },
      { replies: ['Bir', 'İki', 'Üç'] },
    );
    const { result } = await use(service, {
      abilityId: 'archive_summary',
      npcId: 'mill',
    });
    expect(result.notes).toContain('Eski not');
    expect(result.notes).toContain('“Bir”\n“İki”\n“Üç”');

    const silent = setup({ characterId: 'engizitor_hanim' });
    await expect(
      use(silent.service, { abilityId: 'archive_summary', npcId: 'mill' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(silent.gameSession.update).not.toHaveBeenCalled();
  });

  it('Muhbir bulunmamış doğrulayan kanıtın mekânını notlara yazar', async () => {
    const { service } = setup({ characterId: 'sehir_dedektifi' });
    const { result } = await use(service, { abilityId: 'informant' });
    expect(result.locationId).toBe('church');
    expect(result.notes).toContain('Muhbir');
  });
});
