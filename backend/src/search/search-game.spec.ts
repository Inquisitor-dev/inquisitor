import { SEARCH_SCENES } from './scenes';
import type { SearchSceneDef } from './search-scene';
import {
  applyClick,
  publicView,
  SEARCH_SETTINGS,
  sceneProblems,
  settingsFor,
  startAttempt,
  takeHint,
  withExpiry,
  type SearchAttempt,
} from './search-game';

const scene: SearchSceneDef = {
  universe: 'medieval',
  locationId: 'tavern',
  areaId: 'barrels',
  clueSpot: 'raflarda',
  image: '/x.webp',
  status: 'READY',
  objects: Array.from({ length: 12 }, (_, i) => ({
    id: `o${i}`,
    label: `Nesne ${i}`,
    box: [i * 8, 10, 5, 5],
  })),
  finalSpots: [
    { id: 'f1', box: [10, 80, 5, 5], prompt: 'Bir tahta oynamış.' },
    { id: 'f2', box: [60, 80, 5, 5], prompt: 'Bir taş yeni.' },
  ],
};

const center = (id: string) => {
  const box = [...scene.objects, ...scene.finalSpots].find(
    (o) => o.id === id,
  )!.box;
  return { x: box[0] + box[2] / 2, y: box[1] + box[3] / 2 };
};

const start = (difficulty = 'easy', seed = 's1', attempt = 1) =>
  startAttempt({ scene, difficulty, seed, attempt, now: 0 });

const click = (
  attempt: SearchAttempt,
  x: number,
  y: number,
  difficulty = 'easy',
  now = 1000,
) => applyClick({ scene, attempt, difficulty, x, y, now });

describe('startAttempt', () => {
  it('zorluğa göre hedef sayısı seçer, aynı tohumla aynı listeyi verir', () => {
    for (const difficulty of Object.keys(SEARCH_SETTINGS)) {
      const a = start(difficulty);
      expect(a.targets).toHaveLength(SEARCH_SETTINGS[difficulty].targets);
      expect(new Set(a.targets).size).toBe(a.targets.length);
      expect(start(difficulty).targets).toEqual(a.targets);
    }
  });

  it('yeni denemede liste değişir', () => {
    const lists = new Set(
      [1, 2, 3, 4].map((n) => start('easy', 's1', n).targets.join(',')),
    );
    expect(lists.size).toBeGreaterThan(1);
  });
});

describe('applyClick', () => {
  it('hedefi bulur, liste bitince asıl yer aranır ve bulununca kazanılır', () => {
    let a = start();
    for (const id of a.targets) {
      const { x, y } = center(id);
      const r = click(a, x, y);
      expect(r.outcome).toEqual({ kind: 'FOUND', objectId: id });
      a = r.attempt;
    }
    const view = publicView({
      scene,
      attempt: a,
      difficulty: 'easy',
      now: 1000,
    });
    expect(view.stage).toBe('FINAL');
    expect(view.prompt).toBeTruthy();
    const { x, y } = center(a.finalSpotId);
    const r = click(a, x, y);
    expect(r.outcome.kind).toBe('FINAL_FOUND');
    expect(r.attempt.status).toBe('WON');
  });

  it('asıl yer liste bitmeden tıklanınca sayılmaz', () => {
    const a = start();
    const { x, y } = center(a.finalSpotId);
    const r = click(a, x, y);
    expect(r.outcome.kind).toBe('MISS');
    expect(r.attempt.finalFound).toBe(false);
  });

  it('listede olmayan nesneye ya da boşluğa tıklamak süreden yer', () => {
    const a = start();
    const other = scene.objects.find((o) => !a.targets.includes(o.id))!;
    const { x, y } = center(other.id);
    const r = click(a, x, y);
    expect(r.outcome.kind).toBe('MISS');
    expect(r.attempt.penaltyMs).toBe(settingsFor('easy').missPenaltyMs);
    expect(click(r.attempt, 99, 99).attempt.misses).toBe(2);
  });

  it('bulunmuş nesneye yeniden tıklamak ceza değildir', () => {
    const a = start();
    const { x, y } = center(a.targets[0]);
    const once = click(a, x, y).attempt;
    const twice = click(once, x, y);
    expect(twice.outcome.kind).toBe('ALREADY_FOUND');
    expect(twice.attempt.penaltyMs).toBe(0);
  });

  it('iç içe kutularda küçük olan sayılır', () => {
    const nested: SearchSceneDef = {
      ...scene,
      objects: [
        { id: 'buyuk', label: 'Büyük', box: [10, 10, 40, 40] },
        { id: 'kucuk', label: 'Küçük', box: [20, 20, 4, 4] },
        ...scene.objects.slice(2),
      ],
    };
    const attempt: SearchAttempt = {
      ...start(),
      targets: ['buyuk', 'kucuk'],
    };
    const r = applyClick({
      scene: nested,
      attempt,
      difficulty: 'easy',
      x: 22,
      y: 22,
      now: 1000,
    });
    expect(r.outcome).toEqual({ kind: 'FOUND', objectId: 'kucuk' });
  });

  it('kenara yakın tıklama payla sayılır', () => {
    const a = start();
    const box = scene.objects.find((o) => o.id === a.targets[0])!.box;
    const r = click(a, box[0] - 1, box[1]);
    expect(r.outcome.kind).toBe('FOUND');
  });

  it('süre dolunca arama başarısız olur ve tıklama işlemez', () => {
    const a = start();
    const late = settingsFor('easy').timeLimitMs + 1;
    expect(withExpiry(a, 'easy', late).status).toBe('FAILED');
    const { x, y } = center(a.targets[0]);
    expect(click(a, x, y, 'easy', late).outcome.kind).toBe('NOT_RUNNING');
  });
});

describe('takeHint', () => {
  it('bulunmamış hedefin çevresini gösterir, hak ve süre harcar', () => {
    const a = start();
    const r = takeHint({
      scene,
      attempt: a,
      difficulty: 'easy',
      seed: 's1',
      now: 0,
    })!;
    const box = scene.objects.find((o) => o.id === a.targets[0])!.box;
    const cx = box[0] + box[2] / 2;
    const cy = box[1] + box[3] / 2;
    // Daire nesnenin merkezini içine alır
    expect(Math.hypot(r.hint.x - cx, r.hint.y - cy)).toBeLessThanOrEqual(
      r.hint.r,
    );
    expect(r.attempt.hintsUsed).toBe(1);
    expect(r.attempt.penaltyMs).toBe(settingsFor('easy').hintPenaltyMs);
  });

  it('hak bitince null döner', () => {
    let a = start('medium');
    a = takeHint({
      scene,
      attempt: a,
      difficulty: 'medium',
      seed: 's1',
      now: 0,
    })!.attempt;
    expect(
      takeHint({ scene, attempt: a, difficulty: 'medium', seed: 's1', now: 0 }),
    ).toBeNull();
  });
});

describe('publicView', () => {
  it('istemciye kutu ya da asıl yerin kimliği gitmez', () => {
    const a = start();
    const view = publicView({ scene, attempt: a, difficulty: 'easy', now: 0 });
    const json = JSON.stringify(view);
    expect(json).not.toContain('box');
    expect(json).not.toContain(a.finalSpotId);
    expect(view.prompt).toBeNull();
  });
});

describe('sahne kayıtları', () => {
  it.each(
    SEARCH_SCENES.map((s) => [`${s.universe}/${s.locationId}/${s.areaId}`, s]),
  )('%s geçerli', (_name, s) => {
    expect(sceneProblems(s)).toEqual([]);
  });

  it('her alanın tek sahnesi var', () => {
    const keys = SEARCH_SCENES.map(
      (s) => `${s.universe}/${s.locationId}/${s.areaId}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('kusurları bulur', () => {
    expect(
      sceneProblems({
        ...scene,
        objects: [{ id: 'a', label: '', box: [98, 0, 5, 5] }],
        finalSpots: [],
      }),
    ).toEqual(
      expect.arrayContaining([
        'a: ad boş',
        'a: kutu görselin dışında',
        'asıl yer yok',
      ]),
    );
  });
});
