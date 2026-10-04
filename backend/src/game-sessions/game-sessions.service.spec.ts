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
  currentDay: 1,
  timeOfDay: 0,
  notes: '',
  activeWarrants: [] as string[],
  usedWarrants: [] as string[],
};

const SECRET_FIELDS = ['culpritId', 'truthReveal', 'locationClues'];

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
  return { service, gameSession };
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

  it('kazanılmış vaka süre dolunca kayba çevrilmez', async () => {
    const { service, gameSession } = setup({ ...activeSession, status: 'WON' });
    const result = await service.timeoutSession('session-1', 'owner');
    expect(gameSession.update).not.toHaveBeenCalled();
    expect(result.won).toBe(true);
  });
});
