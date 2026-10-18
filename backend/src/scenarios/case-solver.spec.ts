import { buildCaseGraph, CaseGraph, MAX_WARRANTS_PER_CASE } from './case-graph';
import { criticalPoints, solveCase } from './case-solver';
import { planCase } from './case-setup';
import { getScenarioConfig } from './scenario-config';

const SCENARIOS = [
  'medieval',
  'modern',
  'cyberpunk',
  'china',
  'winter',
] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Elle kurulmuş küçük bir vaka: A katil; B, C, D masum
const tinyGraph = (overrides: Partial<CaseGraph> = {}): CaseGraph => ({
  suspects: ['A', 'B', 'C', 'D'],
  culpritId: 'A',
  clues: [
    {
      id: 'scene',
      source: { kind: 'CRIME_SCENE' },
      requires: [],
      pressures: [],
      eliminates: ['B'],
    },
    {
      id: 'c-alibi',
      source: { kind: 'LOCATION', locationId: 'C' },
      requires: [],
      pressures: [],
      eliminates: ['C'],
    },
    {
      id: 'd-alibi',
      source: { kind: 'LOCATION', locationId: 'D' },
      requires: [],
      pressures: [],
      eliminates: ['D'],
    },
  ],
  deductions: [],
  startFear: {},
  fearThreshold: { B: 7, C: 7, D: 7 },
  warrantLimit: 2,
  ...overrides,
});

describe('solveCase', () => {
  it('elemeyle tek şüpheliye inen vakayı en az izinle çözer', () => {
    const r = solveCase(tinyGraph());
    expect(r.solvable).toBe(true);
    expect(r.warrantsUsed.sort()).toEqual(['C', 'D']);
    expect(r.remaining).toEqual(['A']);
  });

  it('izin yetmezse çözülemez der ve elenemeyenleri gösterir', () => {
    const r = solveCase(tinyGraph({ warrantLimit: 1 }));
    expect(r.solvable).toBe(false);
    expect(r.remaining).toContain('A');
    expect(r.remaining.length).toBe(2);
  });

  it('korku eşiğine ulaşan masum itiraf eder ve elenir; katil itiraf etmez', () => {
    const graph = tinyGraph({
      warrantLimit: 1,
      clues: [
        ...tinyGraph().clues,
        {
          id: 'pressure-d',
          source: { kind: 'CRIME_SCENE' },
          requires: [],
          pressures: [
            { npcId: 'D', amount: 7 },
            { npcId: 'A', amount: 7 },
          ],
          eliminates: [],
        },
        {
          id: 'confession:D',
          source: { kind: 'CONFESSION', npcId: 'D' },
          requires: [],
          pressures: [],
          eliminates: ['D'],
        },
        {
          id: 'confession:A',
          source: { kind: 'CONFESSION', npcId: 'A' },
          requires: [],
          pressures: [],
          eliminates: ['A'],
        },
      ],
    });
    const r = solveCase(graph);
    expect(r.solvable).toBe(true);
    expect(r.clues).toContain('confession:D');
    expect(r.clues).not.toContain('confession:A');
    expect(r.warrantsUsed).toEqual(['C']);
  });

  it('katili doğrudan gösteren çıkarım vakayı elemesiz çözer', () => {
    const r = solveCase(
      tinyGraph({
        warrantLimit: 0,
        clues: [
          {
            id: 'witness',
            source: { kind: 'TESTIMONY', npcId: 'B' },
            requires: ['scene'],
            pressures: [],
            eliminates: [],
          },
          ...tinyGraph().clues,
        ],
        deductions: [
          {
            id: 'saw-A',
            requires: ['witness'],
            eliminates: [],
            identifies: 'A',
          },
        ],
      }),
    );
    expect(r.solvable).toBe(true);
    expect(r.identified).toBe(true);
    expect(r.warrantsUsed).toEqual([]);
  });

  it('tek bir kanıta bağlı vakada o kanıt kritik nokta olarak bulunur', () => {
    expect(criticalPoints(tinyGraph())).toEqual([
      'scene',
      'c-alibi',
      'd-alibi',
    ]);
  });
});

// Bugünkü (v1) planlar her zaman çözülebilir değil: planlı cinayetlerde (tuzak iz) tuzağı ele veren kanıt
// yalnızca suçlanan kişiyi temize çıkarıyor, kalan masumlar için 2 izin yetmiyor. v2'nin planı bunu
// çözücüyle garanti edecek; o zaman bu testler "her plan çözülebilir" diye sıkılaşacak.
describe('bugünkü (v1) vakalar', () => {
  it.each(SCENARIOS.flatMap((s) => DIFFICULTIES.map((d) => [s, d] as const)))(
    '%s / %s: katil hiçbir yoldan elenmez; aceleyle işlenen cinayetler en çok 2 izinle çözülür',
    (scenario, difficulty) => {
      const config = getScenarioConfig(scenario, difficulty);
      for (let i = 1; i <= 200; i++) {
        const plan = planCase(config, difficulty, seeded(i));
        const r = solveCase(buildCaseGraph(plan));
        expect(r.remaining).toContain(plan.culpritId);
        if (plan.murderStyle === 'HURRIED') {
          expect(r.solvable).toBe(true);
          expect(r.warrantsUsed.length).toBeLessThanOrEqual(
            MAX_WARRANTS_PER_CASE,
          );
        }
      }
    },
  );
});
