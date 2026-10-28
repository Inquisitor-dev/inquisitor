import { getScenarioConfig } from './scenario-config';
import { planCase, type CaseFacts } from './case-setup';
import {
  buildCaseGraph,
  confessionClueId,
  CRIME_SCENE_CLUE_ID,
  locationClueId,
  VERIFICATION_CLUE_ID,
  type CaseGraph,
} from './case-graph';
import { solveCase } from './case-solver';
import { solutionPaths, MAX_SOLUTION_PATHS } from './solution-paths';
import {
  buildSolutionReport,
  graphClueIdsOf,
} from '../game-sessions/verdict/solution-report';

const SCENARIOS = ['medieval', 'modern', 'cyberpunk', 'china', 'winter'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const plansFor = (scenario: string, difficulty: string, count = 40) => {
  const config = getScenarioConfig(scenario, difficulty);
  return Array.from({ length: count }, (_, i) =>
    planCase(config, difficulty, seeded(((i + 3) * 2654435761) % 4294967296)),
  );
};

// Yalnızca yoldaki kanıtlar elde edilebilirken vaka çözülüyor mu
const solvesAlone = (graph: CaseGraph, clues: string[]) =>
  solveCase(graph, {
    removed: graph.clues.map((c) => c.id).filter((id) => !clues.includes(id)),
  }).solvable;

const factsOf = (plan: ReturnType<typeof planCase>) =>
  ({
    ...plan,
    version: 1,
    crimeSceneClueText: 'iz',
    verificationText: 'tanıklık',
    victim: { name: 'Kurban', profession: 'çiftçi' },
    alibis: {},
  }) as unknown as CaseFacts;

describe('çözüm yolları', () => {
  for (const scenario of SCENARIOS) {
    for (const difficulty of DIFFICULTIES) {
      it(`${scenario}/${difficulty}: her vakada en az iki farklı, tek başına yeten ve en küçük yol var`, () => {
        for (const plan of plansFor(scenario, difficulty)) {
          const graph = buildCaseGraph(plan);
          const paths = solutionPaths(graph);
          // Planlar tek kritik kanıtsızdır (iki bağımsız yol), o yüzden ikinci yol hep bulunur
          expect(paths.length).toBeGreaterThanOrEqual(2);
          expect(paths.length).toBeLessThanOrEqual(MAX_SOLUTION_PATHS);
          const keys = paths.map((p) => [...p.clues].sort().join('|'));
          expect(new Set(keys).size).toBe(paths.length);
          for (const path of paths) {
            expect(solvesAlone(graph, path.clues)).toBe(true);
            for (const id of path.clues) {
              expect(
                solvesAlone(
                  graph,
                  path.clues.filter((x) => x !== id),
                ),
              ).toBe(false);
            }
            // Katil itiraf etmez; izin sınırı aşılmaz
            expect(path.clues).not.toContain(confessionClueId(plan.culpritId));
            expect(path.warrants.length).toBeLessThanOrEqual(
              graph.warrantLimit,
            );
          }
          // En kısası başta
          for (let i = 1; i < paths.length; i++)
            expect(paths[i].clues.length).toBeGreaterThanOrEqual(
              paths[i - 1].clues.length,
            );
        }
      });
    }
  }

  it('çözülemeyen grafikte yol yok', () => {
    const plan = plansFor('medieval', 'easy', 1)[0];
    const graph = buildCaseGraph(plan);
    expect(solutionPaths({ ...graph, clues: [], deductions: [] })).toEqual([]);
  });
});

describe('çözüm raporu', () => {
  const nameOf = (id: string) => `Kişi-${id}`;
  const placeOf = (id: string) => `Mekân-${id}`;

  it('kanıt kayıtlarını grafikteki kanıtlarla eşler', () => {
    const plan = plansFor('medieval', 'medium', 1)[0];
    const facts = factsOf(plan);
    expect(
      graphClueIdsOf({ kind: 'CLUE', sourceId: 'crime_scene' }, facts),
    ).toEqual([CRIME_SCENE_CLUE_ID]);
    expect(graphClueIdsOf({ kind: 'CLUE', sourceId: 'mill' }, facts)).toEqual([
      locationClueId('mill'),
    ]);
    expect(
      graphClueIdsOf({ kind: 'VERIFICATION', sourceId: 'mill' }, facts),
    ).toEqual([VERIFICATION_CLUE_ID]);
    expect(graphClueIdsOf({ kind: 'EVENT', sourceId: 'rumor' }, facts)).toEqual(
      [],
    );
    // Mazereti anlatan kayıt, aklanan kişinin kanıtıdır
    const none = (facts.involvements ?? []).find(
      (i) => i.kind === 'NONE' && i.aboutNpcId,
    );
    if (none) {
      expect(
        graphClueIdsOf({ kind: 'ALIBI', sourceId: none.aboutNpcId! }, facts),
      ).toContain(`alibi:${none.npcId}`);
    }
  });

  it('bulunan kanıtları işaretler, metinlerde iç id yok', () => {
    for (const plan of plansFor('winter', 'hard', 15)) {
      const facts = factsOf(plan);
      const empty = buildSolutionReport({
        facts,
        evidence: [],
        nameOf,
        placeOf,
      });
      expect(empty.paths.length).toBeGreaterThanOrEqual(2);
      for (const path of empty.paths) {
        expect(path.found).toBe(0);
        expect(path.completed).toBe(false);
        const texts = [
          ...path.steps.flatMap((s) => [s.label, s.how]),
          ...path.conclusions,
          path.finale,
        ].join(' ');
        expect(texts).not.toMatch(
          /location:|confession:|testimony:|alibi:|crime_scene|verification/,
        );
        expect(path.finale).toContain(nameOf(plan.culpritId));
      }
      // Olay yeri izi bulunmuşsa onu içeren yolda işaretlidir
      const withTrace = buildSolutionReport({
        facts,
        evidence: [{ kind: 'CLUE', sourceId: 'crime_scene' }],
        nameOf,
        placeOf,
      });
      for (const path of withTrace.paths) {
        const step = path.steps.find((s) => s.clueId === CRIME_SCENE_CLUE_ID);
        if (step) expect(step.found).toBe(true);
        expect(path.found).toBe(step ? 1 : 0);
      }
    }
  });

  it('bütün kanıtları bulan oyuncunun yolları tamamlanmıştır', () => {
    const plan = plansFor('china', 'medium', 1)[0];
    const facts = factsOf(plan);
    const report = buildSolutionReport({
      facts,
      evidence: [],
      nameOf,
      placeOf,
    });
    const graph = buildCaseGraph(facts);
    const kindOf = (id: string) => graph.clues.find((c) => c.id === id)!;
    // Her yoldaki kanıtların kayıt hâli
    const evidence = report.paths.flatMap((p) =>
      p.steps.map((s) => {
        const c = kindOf(s.clueId);
        if (s.clueId === CRIME_SCENE_CLUE_ID)
          return { kind: 'CLUE', sourceId: 'crime_scene' };
        if (s.clueId === VERIFICATION_CLUE_ID)
          return { kind: 'VERIFICATION', sourceId: 'x' };
        if (s.clueId === 'body')
          return { kind: 'BODY', sourceId: 'crime_scene' };
        const [prefix, id] = s.clueId.split(':');
        if (prefix === 'location') return { kind: 'CLUE', sourceId: id };
        if (prefix === 'confession')
          return { kind: 'CONFESSION', sourceId: id };
        if (prefix === 'testimony') return { kind: 'TESTIMONY', sourceId: id };
        // alibi: kaydın kaynağı mazereti anlatan kişidir
        return {
          kind: 'ALIBI',
          sourceId: c.source.kind === 'TESTIMONY' ? c.source.npcId : '',
        };
      }),
    );
    const full = buildSolutionReport({ facts, evidence, nameOf, placeOf });
    expect(full.paths.every((p) => p.completed)).toBe(true);
  });

  it('Suskun Tanık yolunda beklediği kanıtın gösterilmesi istenir', () => {
    const plan = plansFor('medieval', 'hard', 40).find(
      (p) => p.verification.placement.type === 'TESTIMONY',
    )!;
    const placement = plan.verification.placement as { npcId: string };
    const facts = factsOf({
      ...plan,
      wildcards: [
        { kind: 'RELUCTANT', npcId: placement.npcId, requires: 'CRIME_SCENE' },
      ],
    });
    const steps = buildSolutionReport({
      facts,
      evidence: [],
      nameOf,
      placeOf,
    }).paths.flatMap((p) => p.steps);
    const witness = steps.find((s) => s.clueId === VERIFICATION_CLUE_ID);
    if (witness)
      expect(witness.how).toContain('ona şunu göster: Olay yerindeki iz');
    // Öbür tanıklıklarda kanıt gösterilmez, önce bulunur
    for (const step of steps.filter(
      (s) => s.clueId.startsWith('testimony:') && s.how.startsWith('Önce'),
    ))
      expect(step.how).not.toContain('göster');
  });

  it('planı olmayan eski vakada yol yok', () => {
    expect(
      buildSolutionReport({
        facts: { culpritId: 'mill' } as unknown as CaseFacts,
        evidence: [],
        nameOf,
        placeOf,
      }).paths,
    ).toEqual([]);
  });
});
