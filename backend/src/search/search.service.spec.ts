import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { SEARCH_SCENES } from './scenes';
import type { SearchAttempt, SearchState } from './search-game';

const scene = SEARCH_SCENES.find(
  (s) =>
    s.universe === 'medieval' &&
    s.locationId === 'tavern' &&
    s.areaId === 'barrels',
)!;

const center = (id: string) => {
  const box = [...scene.objects, ...scene.finalSpots].find(
    (o) => o.id === id,
  )!.box;
  return { x: box[0] + box[2] / 2, y: box[1] + box[3] / 2 };
};

function setup(overrides: Record<string, unknown> = {}) {
  const session: Record<string, unknown> = {
    id: 'sess-1',
    userId: 'u1',
    status: 'ACTIVE',
    isTestMode: true,
    difficulty: 'easy',
    scenarioType: 'medieval',
    currentDay: 1,
    timeOfDay: 1,
    culpritId: 'church',
    // Vaka planı kanıtı tavernanın tezgâh arkasına koymuş
    caseFacts: {
      searchAreas: { tavern: 'barrels' },
      verification: { placement: { type: 'TESTIMONY', npcId: 'mill' } },
    },
    personaState: null,
    locationClues: { tavern: 'Fıçının arkasında kanlı bir bez.' },
    activeWarrants: ['tavern'],
    usedWarrants: [],
    searchState: null,
    ...overrides,
  };
  const evidence: { kind: string; sourceId: string }[] = [];
  const prisma = {
    gameSession: {
      findUnique: jest.fn(() => Promise.resolve({ ...session })),
      update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        Object.assign(session, data);
        return Promise.resolve(session);
      }),
    },
    evidence: {
      findMany: jest.fn(() => Promise.resolve(evidence)),
      create: jest.fn(({ data }: { data: Record<string, string | number> }) => {
        evidence.push({
          kind: String(data.kind),
          sourceId: String(data.sourceId),
        });
        return Promise.resolve({ id: `e${evidence.length}`, ...data });
      }),
    },
  };
  const service = new SearchService(prisma as never);
  const attempt = () =>
    (session.searchState as SearchState | null)?.tavern as SearchAttempt;
  return { service, session, prisma, evidence, attempt };
}

describe('SearchService', () => {
  it('taslak sahne yalnızca test modunda açılır', async () => {
    const live = setup({ isTestMode: false });
    expect(await live.service.getSearch('sess-1', 'u1', 'tavern')).toEqual({
      available: false,
      areas: [],
      openArea: null,
      view: null,
    });
    const test = setup();
    const open = await test.service.getSearch('sess-1', 'u1', 'tavern');
    expect(open.available).toBe(true);
    expect(open.areas).toEqual(['barrels', 'fireplace', 'table', 'stairs']);
  });

  it('getSearch açık alanı söyler', async () => {
    const { service } = setup();
    expect((await service.getSearch('sess-1', 'u1', 'tavern')).openArea).toBe(
      'barrels',
    );
  });

  it('kanıtın olmadığı alan aranmaz', async () => {
    const { service } = setup();
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'fireplace'),
    ).rejects.toThrow('aranmaya değer');
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'chandelier'),
    ).rejects.toThrow('aranmaya değer');
  });

  it('planda alan yoksa oturuma göre sabit bir alan açılır', async () => {
    const a = setup({ caseFacts: null });
    const first = (await a.service.getSearch('sess-1', 'u1', 'tavern'))
      .openArea;
    expect(['barrels', 'fireplace', 'table', 'stairs']).toContain(first);
    const b = setup({ caseFacts: null });
    expect((await b.service.getSearch('sess-1', 'u1', 'tavern')).openArea).toBe(
      first,
    );
  });

  it('alansız eski arama kaydı yok sayılır', async () => {
    const { service } = setup({
      searchState: { tavern: { attempt: 1, status: 'RUNNING' } },
    });
    expect((await service.getSearch('sess-1', 'u1', 'tavern')).view).toBeNull();
    const { view } = await service.start('sess-1', 'u1', 'tavern', 'barrels');
    expect(view.attempt).toBe(1);
  });

  it('başarısız aramadan sonra yalnızca aynı alan yeni listeyle aranır', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    session.searchState = {
      tavern: { ...attempt(), startedAt: Date.now() - 10 * 60_000 },
    };
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'fireplace'),
    ).rejects.toThrow('aranmaya değer');
    const { view } = await service.start('sess-1', 'u1', 'tavern', 'barrels');
    expect(view.areaId).toBe('barrels');
    expect(view.attempt).toBe(2);
  });

  it('test modunda süren denemenin kutuları okunur, normal oyunda okunmaz', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    const spots = await service.testSpots('sess-1', 'u1', 'tavern');
    expect(spots.targets.map((t) => t.id).sort()).toEqual(
      [...attempt().targets].sort(),
    );
    expect(spots.finalSpots.filter((f) => f.current)).toHaveLength(1);
    session.isTestMode = false;
    await expect(service.testSpots('sess-1', 'u1', 'tavern')).rejects.toThrow();
  });

  it('arama izni olmadan başlamaz', async () => {
    const { service } = setup({ activeWarrants: [] });
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'barrels'),
    ).rejects.toThrow(BadRequestException);
  });

  it('başlatınca kutusuz görünüm döner; süren arama yeniden başlatılmaz', async () => {
    const { service, attempt } = setup();
    const { view } = await service.start('sess-1', 'u1', 'tavern', 'barrels');
    expect(view.status).toBe('RUNNING');
    expect(JSON.stringify(view)).not.toContain('box');
    const first = attempt().targets;
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    expect(attempt().targets).toEqual(first);
    expect(attempt().attempt).toBe(1);
  });

  it('asıl yer bulununca mekânın ipucu kaydedilir ve izin harcanır', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    for (const id of attempt().targets) {
      const { x, y } = center(id);
      const r = await service.click('sess-1', 'u1', 'tavern', x, y);
      expect(r.outcome).toBe('FOUND');
      expect(r.evidence).toEqual([]);
    }
    const { x, y } = center(attempt().finalSpotId);
    const r = await service.click('sess-1', 'u1', 'tavern', x, y);
    expect(r.outcome).toBe('FINAL_FOUND');
    expect(r.view.status).toBe('WON');
    expect(r.evidence).toEqual([
      expect.objectContaining({
        kind: 'CLUE',
        sourceId: 'tavern',
        text: 'Fıçının arkasında kanlı bir bez.',
      }),
    ]);
    expect(session.activeWarrants).toEqual([]);
    expect(session.usedWarrants).toEqual(['tavern']);
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'barrels'),
    ).rejects.toThrow('zaten aradın');
  });

  it('doğrulayan kanıt o mekândaysa VERIFICATION olarak kaydedilir', async () => {
    const { service } = setup({
      caseFacts: {
        searchAreas: { tavern: 'barrels' },
        verification: { placement: { type: 'LOCATION', locationId: 'tavern' } },
      },
    });
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    const { evidence } = await service.testSolve('sess-1', 'u1', 'tavern');
    expect(evidence[0]).toMatchObject({ kind: 'VERIFICATION' });
  });

  it('başarısız aramadan sonra yeni denemeyle yeniden başlar', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    session.searchState = {
      tavern: { ...attempt(), startedAt: Date.now() - 10 * 60_000 },
    };
    const { view, timeOfDay } = await service.start(
      'sess-1',
      'u1',
      'tavern',
      'barrels',
    );
    expect(view.attempt).toBe(2);
    expect(view.status).toBe('RUNNING');
    // Başarısız deneme günün bir vaktini harcadı
    expect(timeOfDay).toBe(2);
    expect(session.timeOfDay).toBe(2);
  });

  it('başarısız arama vaktini bir kez harcar; okumak yeniden harcatmaz', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    session.searchState = {
      tavern: { ...attempt(), startedAt: Date.now() - 10 * 60_000 },
    };
    const first = await service.getSearch('sess-1', 'u1', 'tavern');
    expect(first.view?.status).toBe('FAILED');
    expect(first.timeOfDay).toBe(2);
    await service.getSearch('sess-1', 'u1', 'tavern');
    expect(session.timeOfDay).toBe(2);
  });

  it('yanlış tıklamalar süreyi bitirirse de vakit harcanır', async () => {
    const { service, session, attempt } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    // Sürenin bitmesine bir yanlış tıklama kaldı
    session.searchState = {
      tavern: { ...attempt(), startedAt: Date.now() - 178_000 },
    };
    const r = await service.click('sess-1', 'u1', 'tavern', 99, 1);
    expect(r.outcome).toBe('MISS');
    expect(r.view.status).toBe('FAILED');
    expect(r.timeOfDay).toBe(2);
  });

  it('gece başarısız olan arama vakti geceden öteye taşımaz', async () => {
    const { service, session, attempt } = setup({ timeOfDay: 4 });
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    session.searchState = {
      tavern: { ...attempt(), startedAt: Date.now() - 10 * 60_000 },
    };
    expect((await service.getSearch('sess-1', 'u1', 'tavern')).timeOfDay).toBe(
      4,
    );
  });

  it('kazanılan arama vakit harcamaz', async () => {
    const { service, session } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    await service.testSolve('sess-1', 'u1', 'tavern');
    expect(session.timeOfDay).toBe(1);
  });

  it('test çözümü yalnızca test modunda çalışır', async () => {
    const { service, session } = setup();
    await service.start('sess-1', 'u1', 'tavern', 'barrels');
    session.isTestMode = false;
    await expect(service.testSolve('sess-1', 'u1', 'tavern')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('bitmiş vakada arama yapılmaz', async () => {
    const { service } = setup({ status: 'WON' });
    await expect(
      service.start('sess-1', 'u1', 'tavern', 'barrels'),
    ).rejects.toThrow('sona erdi');
  });
});
