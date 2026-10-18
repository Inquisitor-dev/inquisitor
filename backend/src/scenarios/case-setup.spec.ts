import { SCENARIO_CLUES } from './clues-config';
import { getScenarioConfig } from './scenario-config';
import { ELIMINATION_TARGET, findAuthenticClues, planCase } from './case-setup';

const SCENARIOS = ['medieval', 'modern', 'cyberpunk', 'china', 'winter'] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

// Tekrarlanabilir rastgelelik: aynı tohumla aynı vakalar üretilir
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const plansFor = (scenario: string, difficulty: string, count = 400) => {
  const config = getScenarioConfig(scenario, difficulty);
  return Array.from({ length: count }, (_, i) =>
    planCase(config, difficulty, seeded(i + 1)),
  );
};

describe('ipucu havuzu', () => {
  it.each(SCENARIOS.flatMap((s) => DIFFICULTIES.map((d) => [s, d] as const)))(
    '%s / %s: her olası suçlu için hedefe uyan bir gerçek iz var',
    (scenario, difficulty) => {
      const config = getScenarioConfig(scenario, difficulty);
      const activeIds = config.npcDefinitions.map((npc) => npc.id);
      for (const culpritId of activeIds) {
        const candidates = findAuthenticClues(
          SCENARIO_CLUES[scenario],
          activeIds,
          culpritId,
          ELIMINATION_TARGET[difficulty],
        );
        expect(candidates.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SCENARIOS)(
    '%s: havuzdaki hiçbir ipucu ölü (hiçbir zorlukta seçilemez) değildir',
    (scenario) => {
      const reachableIds = new Set<string>();
      for (const difficulty of DIFFICULTIES) {
        const config = getScenarioConfig(scenario, difficulty);
        const activeIds = config.npcDefinitions.map((npc) => npc.id);
        for (const culpritId of activeIds) {
          for (const clue of findAuthenticClues(
            SCENARIO_CLUES[scenario],
            activeIds,
            culpritId,
            ELIMINATION_TARGET[difficulty],
          )) {
            reachableIds.add(clue.id);
          }
        }
      }
      expect([...reachableIds].sort()).toEqual(
        SCENARIO_CLUES[scenario].map((c) => c.id).sort(),
      );
    },
  );
});

describe('planCase', () => {
  it.each(SCENARIOS.flatMap((s) => DIFFICULTIES.map((d) => [s, d] as const)))(
    '%s / %s: kurallar her vakada tutuyor',
    (scenario, difficulty) => {
      const target = ELIMINATION_TARGET[difficulty];
      const activeIds = getScenarioConfig(
        scenario,
        difficulty,
      ).npcDefinitions.map((npc) => npc.id);

      for (const plan of plansFor(scenario, difficulty)) {
        const { crimeSceneClue, verification, culpritId, innocentIds } = plan;

        // Gerçek iz de tuzak da aynı sayıda kişiyi eler
        expect(crimeSceneClue.eliminatedNpcIds).toHaveLength(target);
        // Suçlu asla elenmez
        expect(crimeSceneClue.eliminatedNpcIds).not.toContain(culpritId);
        expect(innocentIds).not.toContain(culpritId);
        expect(innocentIds).toHaveLength(activeIds.length - 1);

        if (crimeSceneClue.authentic) {
          expect(plan.murderStyle).toBe('HURRIED');
          expect(crimeSceneClue.implicatedNpcIds).toContain(culpritId);
          expect(crimeSceneClue.poolClueText).toBeTruthy();
          expect(verification.kind).toBe('CORROBORATION');
          if (verification.placement.type === 'LOCATION') {
            expect(verification.placement.locationId).toBe(culpritId);
          } else {
            expect(innocentIds).toContain(verification.placement.npcId);
          }
        } else {
          expect(plan.murderStyle).toBe('PLANNED');
          // Tuzak tam olarak hedef kadar masumu suçlu gösterir
          expect(crimeSceneClue.implicatedNpcIds).toHaveLength(target);
          expect(crimeSceneClue.implicatedNpcIds).not.toContain(culpritId);
          expect(verification.kind).toBe('FLAW');
          const placementId =
            verification.placement.type === 'LOCATION'
              ? verification.placement.locationId
              : verification.placement.npcId;
          expect(innocentIds).toContain(placementId);
        }
      }
    },
  );

  it('olay yerinin görünüşü ipucunun gerçekliğini ele vermez', () => {
    const plans = SCENARIOS.flatMap((s) => plansFor(s, 'medium'));
    const combos = new Set(
      plans.map((p) => `${p.crimeSceneClue.authentic}-${p.sceneState}`),
    );
    // Dört kombinasyonun hepsi görülür: dağınık-gerçek, dağınık-tuzak, düzenli-gerçek, düzenli-tuzak
    expect(combos).toEqual(
      new Set(['true-MESSY', 'true-TIDY', 'false-MESSY', 'false-TIDY']),
    );
  });

  it('doğrulayan kanıtın yeri her vakada aynı değil', () => {
    const placements = new Set(
      plansFor('medieval', 'easy').map((p) => p.verification.placement.type),
    );
    expect(placements).toEqual(new Set(['LOCATION', 'TESTIMONY']));
  });
});

describe('olay yeri seçimi', () => {
  it.each(SCENARIOS)(
    '%s: her evrende 5 olay yeri var ve hepsi seçilebiliyor',
    (scenario) => {
      const config = getScenarioConfig(scenario, 'easy');
      const ids = config.crimeScenes.map((scene) => scene.id);
      expect(new Set(ids).size).toBe(5);
      const picked = new Set(
        plansFor(scenario, 'easy').map((plan) => plan.crimeSceneId),
      );
      expect([...picked].sort()).toEqual([...ids].sort());
    },
  );

  it('seçilen olay yeri, yapay zekâya giden crime_scene mekânının adı ve tarifi olur', () => {
    const config = getScenarioConfig('medieval', 'easy', 'well');
    const location = config.locationDefinitions.find(
      (l) => l.id === 'crime_scene',
    );
    expect(config.crimeScene?.label).toBe('Köy Kuyusu');
    expect(location?.name).toBe('Köy Kuyusu');
    expect(location?.description).toContain('linen sheet');
  });

  it('olay yeri yoksa (eski vakalar) mekân değişmez', () => {
    const config = getScenarioConfig('medieval', 'easy');
    expect(config.crimeScene).toBeUndefined();
    expect(
      config.locationDefinitions.find((l) => l.id === 'crime_scene')?.name,
    ).toBe('Ashenmoor crime scene');
  });
});
