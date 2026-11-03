import { SEARCH_SCENES } from './scenes';
import { assignScenes, chooseScene, sessionScene } from './search-pool';
import { sceneIdOf, type SearchSceneDef } from './search-scene';

const variant = (v: string): SearchSceneDef => ({
  universe: 'modern',
  locationId: 'church',
  areaId: 'static_tv',
  variant: v,
  clueSpot: 'sehpada',
  image: `/${v}.webp`,
  status: 'DRAFT',
  objects: [],
  finalSpots: [],
});
const [a, b, c] = ['a', 'b', 'c'].map(variant);
const rng = () => 0.5;

describe('chooseScene', () => {
  it('oynanmış sahneyi seçmez', () => {
    const plays = new Map([
      [sceneIdOf(a), 1],
      [sceneIdOf(c), 2],
    ]);
    expect(chooseScene([a, b, c], plays, rng)).toBe(b);
  });

  it('hepsi oynandıysa en eski oynananı verir', () => {
    const plays = new Map([
      [sceneIdOf(a), 30],
      [sceneIdOf(b), 10],
      [sceneIdOf(c), 20],
    ]);
    expect(chooseScene([a, b, c], plays, rng)).toBe(b);
  });

  it('sahne yoksa boş döner', () => {
    expect(chooseScene([], new Map(), rng)).toBeNull();
  });

  it('oynanmamışların hepsi çekilebilir', () => {
    let i = 0;
    const values = [0, 0.4, 0.9];
    const drawn = values.map(() =>
      chooseScene([a, b, c], new Map(), () => values[i++]),
    );
    expect(drawn).toEqual([a, b, c]);
  });
});

describe('assignScenes', () => {
  const medieval = SEARCH_SCENES.find((s) => s.universe === 'medieval')!;
  const areas = { [medieval.locationId]: medieval.areaId };

  it('plandaki alanın sahnesini atar, sahnesi olmayan mekânı atlar', () => {
    expect(
      assignScenes({
        universe: 'medieval',
        searchAreas: { ...areas, yok: 'yok' },
        testMode: true,
        plays: new Map(),
        seed: 's',
      }),
    ).toEqual({ [medieval.locationId]: sceneIdOf(medieval) });
  });

  it('taslak sahne test modu dışında atanmaz', () => {
    expect(medieval.status).toBe('DRAFT');
    expect(
      assignScenes({
        universe: 'medieval',
        searchAreas: areas,
        testMode: false,
        plays: new Map(),
        seed: 's',
      }),
    ).toEqual({});
  });

  it('planı olmayan vakada boş döner', () => {
    expect(
      assignScenes({
        universe: 'medieval',
        searchAreas: undefined,
        testMode: true,
        plays: new Map(),
        seed: 's',
      }),
    ).toEqual({});
  });
});

describe('sessionScene', () => {
  const medieval = SEARCH_SCENES.find((s) => s.universe === 'medieval')!;
  const params = {
    universe: medieval.universe,
    locationId: medieval.locationId,
    areaId: medieval.areaId,
    testMode: true,
    sessionId: 's',
  };

  it('atanmış sahneyi verir', () => {
    expect(
      sessionScene({
        ...params,
        assigned: { [medieval.locationId]: sceneIdOf(medieval) },
      }),
    ).toBe(medieval);
  });

  it('atama yoksa ya da sahne silindiyse yine sahne verir, aynı oturumda aynısını', () => {
    const first = sessionScene({ ...params, assigned: null });
    expect(first).toBeTruthy();
    expect(
      sessionScene({
        ...params,
        assigned: { [medieval.locationId]: 'silinmis/sahne' },
      }),
    ).toBe(first);
  });

  it('taslak sahne test modu dışında gelmez', () => {
    expect(
      sessionScene({ ...params, testMode: false, assigned: null }),
    ).toBeNull();
  });
});
