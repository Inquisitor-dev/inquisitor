import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { findOwnedSession, toPublicSession } from './session-access';

const baseSession = {
  id: 'session-1',
  userId: 'user-1',
  status: 'ACTIVE',
  culpritId: 'mill',
  truthReveal: 'Değirmenci yaptı.',
  locationClues: { tavern: 'Kanlı mendil' },
  currentDay: 2,
};

const prismaWith = (session: unknown) => {
  const findUnique = jest.fn().mockResolvedValue(session);
  return {
    prisma: { gameSession: { findUnique } } as unknown as PrismaService,
    findUnique,
  };
};

describe('toPublicSession', () => {
  it('aktif oturumda suçluyu, gerçeği ve ipuçlarını gizler', () => {
    const result = toPublicSession(baseSession);
    expect(result).not.toHaveProperty('culpritId');
    expect(result).not.toHaveProperty('truthReveal');
    expect(result).not.toHaveProperty('locationClues');
    expect(result).toMatchObject({ id: 'session-1', currentDay: 2 });
  });

  it.each(['WON', 'LOST'])('%s oturumda her şeyi gösterir', (status) => {
    const result = toPublicSession({ ...baseSession, status });
    expect(result).toHaveProperty('culpritId', 'mill');
    expect(result).toHaveProperty('truthReveal');
  });
});

describe('findOwnedSession', () => {
  it('oturumu sahibine döndürür', async () => {
    await expect(
      findOwnedSession(prismaWith(baseSession).prisma, 'session-1', 'user-1'),
    ).resolves.toBe(baseSession);
  });

  it('başkasının oturumunda "bulunamadı" verir', async () => {
    await expect(
      findOwnedSession(prismaWith(baseSession).prisma, 'session-1', 'user-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('olmayan oturumda "bulunamadı" verir', async () => {
    await expect(
      findOwnedSession(prismaWith(null).prisma, 'yok', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('boş id ile veritabanına gitmez', async () => {
    const { prisma, findUnique } = prismaWith(baseSession);
    await expect(findOwnedSession(prisma, '', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});
