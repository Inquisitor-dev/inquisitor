import { getScenarioConfig } from './scenario-config';
import { isPlanSound, planCase, type CaseFacts } from './case-setup';
import {
  BODY_CLUE_ID,
  buildCaseGraph,
  confessionClueId,
  CRIME_SCENE_CLUE_ID,
  locationClueId,
  testimonyClueId,
  VERIFICATION_CLUE_ID,
} from './case-graph';
import {
  graphWithWildcards,
  hasLeft,
  shortDayStart,
  warrantLimitOf,
  WILDCARDS_BY_DIFFICULTY,
  type WildcardPlan,
} from './wildcards';
import { closuresOn } from './personas/closures';
import { closedMessage } from '../personas/closure-message';
import {
  emptyPersonaState,
  firstMorningPaper,
  processNight,
  type NightContext,
} from '../personas/persona-night';
import {
  ownWildcardPlanLines,
  wildcardPromptLines,
} from '../personas/wildcard-texts';
import { decideWarrants } from '../npcs/warrant';
import {
  evidenceFromTags,
  EVIDENCE_TAG,
  withoutTestimonySentences,
} from '../npcs/evidence';
import { buildNpcPrompt } from '../npcs/prompt-builder';

const SCENARIOS = ['medieval', 'modern', 'cyberpunk', 'china', 'winter'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const plansFor = (scenario: string, difficulty: string, count = 300) => {
  const config = getScenarioConfig(scenario, difficulty);
  return Array.from({ length: count }, (_, i) =>
    planCase(config, difficulty, seeded(((i + 7) * 2654435761) % 4294967296)),
  );
};

const ctx: NightContext = {
  scenarioType: 'medieval',
  seed: 'test',
  placeName: (id) => `Mekân-${id}`,
  npcName: (id) => `Kişi-${id}`,
};

describe('wildcard planı', () => {
  it.each(SCENARIOS.flatMap((s) => DIFFICULTIES.map((d) => [s, d] as const)))(
    '%s / %s: en çok bir wildcard, zorluğa uygun tür ve plan yine sağlam',
    (scenario, difficulty) => {
      for (const plan of plansFor(scenario, difficulty)) {
        const wildcards = plan.wildcards ?? [];
        expect(wildcards.length).toBeLessThanOrEqual(1);
        for (const w of wildcards) {
          expect(WILDCARDS_BY_DIFFICULTY[difficulty]).toContain(w.kind);
        }
        expect(isPlanSound(plan, difficulty)).toBe(true);
      }
    },
  );

  it('vakaların yaklaşık üçte birinde wildcard olur', () => {
    const plans = SCENARIOS.flatMap((s) => plansFor(s, 'medium', 200));
    const share =
      plans.filter((p) => (p.wildcards ?? []).length > 0).length / plans.length;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.4);
  });

  it('ayrılan kişi katil, vakayı taşıyan kanıtın sahibi ya da başka bir kapanışın sahibi olmaz', () => {
    let seen = 0;
    for (const scenario of SCENARIOS) {
      for (const plan of plansFor(scenario, 'medium', 400)) {
        const left = plan.wildcards?.find((w) => w.kind === 'LEFT');
        if (!left || left.kind !== 'LEFT') continue;
        seen++;
        const placement = plan.verification.placement;
        expect(left.npcId).not.toBe(plan.culpritId);
        expect(left.npcId).not.toBe(
          placement.type === 'LOCATION'
            ? placement.locationId
            : placement.npcId,
        );
        expect((plan.townEvents ?? []).map((e) => e.npcId)).not.toContain(
          left.npcId,
        );
        expect(
          (plan.persona?.events ?? [])
            .filter((e) => e.kind === 'BREAK_IN')
            .map((e) => e.locationId),
        ).not.toContain(left.npcId);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('söylentinin hedefi katile de düşer (yalnızca masumlara düşseydi katili aklardı)', () => {
    let rumors = 0;
    let onCulprit = 0;
    for (const scenario of SCENARIOS) {
      for (const difficulty of ['medium', 'hard']) {
        for (const plan of plansFor(scenario, difficulty, 400)) {
          const rumor = plan.wildcards?.find((w) => w.kind === 'RUMOR');
          if (!rumor || rumor.kind !== 'RUMOR') continue;
          rumors++;
          if (rumor.npcId === plan.culpritId) onCulprit++;
        }
      }
    }
    expect(rumors).toBeGreaterThan(50);
    // 5–6 şüpheliden biri: yaklaşık altıda bir
    expect(onCulprit / rumors).toBeGreaterThan(0.08);
    expect(onCulprit / rumors).toBeLessThan(0.3);
  });

  it('suskun tanık yalnızca doğrulayan tanıklığın sahibine düşer', () => {
    for (const scenario of SCENARIOS) {
      for (const plan of plansFor(scenario, 'hard', 300)) {
        const w = plan.wildcards?.find((x) => x.kind === 'RELUCTANT');
        if (!w || w.kind !== 'RELUCTANT') continue;
        expect(plan.verification.placement).toEqual({
          type: 'TESTIMONY',
          npcId: w.npcId,
        });
      }
    }
  });

  it('kurbanın notu ve hevesli kadı zorda, ayrılan tanık kolay ve zorda çıkmaz', () => {
    expect(WILDCARDS_BY_DIFFICULTY.hard).not.toContain('VICTIM_NOTE');
    expect(WILDCARDS_BY_DIFFICULTY.hard).not.toContain('EXTRA_WARRANT');
    expect(WILDCARDS_BY_DIFFICULTY.easy).not.toContain('LEFT');
    expect(WILDCARDS_BY_DIFFICULTY.hard).not.toContain('LEFT');
  });
});

describe('wildcard çözücü etkisi', () => {
  const plan = planCase(
    getScenarioConfig('medieval', 'medium'),
    'medium',
    seeded(42),
  );
  const graph = buildCaseGraph({ ...plan, wildcards: [] });

  it('ayrılan kişinin ifadesi, itirafı ve mekânı çözücüden düşer', () => {
    const innocent = plan.innocentIds[0];
    const reduced = graphWithWildcards(graph, [
      { kind: 'LEFT', npcId: innocent, day: 3, reasonIndex: 0 },
    ]);
    const ids = reduced.clues.map((c) => c.id);
    expect(ids).not.toContain(confessionClueId(innocent));
    expect(ids).not.toContain(locationClueId(innocent));
    expect(ids).not.toContain(testimonyClueId(innocent));
    expect(
      reduced.clues.some(
        (c) => c.source.kind === 'TESTIMONY' && c.source.npcId === innocent,
      ),
    ).toBe(false);
  });

  it('suskun tanığın tanıklığı istenen kanıta bağlanır', () => {
    const reduced = graphWithWildcards(
      {
        ...graph,
        clues: [
          {
            id: VERIFICATION_CLUE_ID,
            source: { kind: 'TESTIMONY', npcId: 'tavern' },
            requires: [],
            pressures: [],
            eliminates: [],
          },
        ],
      },
      [{ kind: 'RELUCTANT', npcId: 'tavern', requires: 'BODY' }],
    );
    expect(reduced.clues[0].requires).toEqual([BODY_CLUE_ID]);
    const trace = graphWithWildcards(reduced, [
      { kind: 'RELUCTANT', npcId: 'tavern', requires: 'CRIME_SCENE' },
    ]);
    expect(trace.clues[0].requires).toEqual([
      BODY_CLUE_ID,
      CRIME_SCENE_CLUE_ID,
    ]);
  });
});

describe('wildcard kuralları', () => {
  const withWildcard = (w: WildcardPlan) => ({ wildcards: [w] });

  it('hevesli kadı vakada üçüncü izni verir; çözücü yine iki izinle kurar', () => {
    expect(warrantLimitOf({})).toBe(2);
    expect(warrantLimitOf(withWildcard({ kind: 'EXTRA_WARRANT' }))).toBe(3);
    const request = {
      userMessage: 'Değirmen için arama izni istiyorum.',
      locations: [{ id: 'mill', localizedName: 'Değirmen' }],
      warrantsIssued: 2,
      activeWarrants: [],
      usedWarrants: ['tavern', 'church'],
    };
    expect(decideWarrants(request)?.outcome).toBe('LIMIT_REACHED');
    expect(decideWarrants({ ...request, limit: 3 })?.outcome).toBe('GRANTED');
    expect(
      buildCaseGraph(planCase(getScenarioConfig('medieval', 'easy'), 'easy'))
        .warrantLimit,
    ).toBe(2);
  });

  it('kısa günde sabahın iki dilimi kaybedilir', () => {
    const facts = withWildcard({ kind: 'SHORT_DAY', day: 2, reasonIndex: 0 });
    expect(shortDayStart(facts, 2)).toBe(2);
    expect(shortDayStart(facts, 3)).toBe(0);
  });

  it('ayrılan kişinin mekânı ayrıldığı günden sonra hep kapalı', () => {
    const facts = withWildcard({
      kind: 'LEFT',
      npcId: 'mill',
      day: 3,
      reasonIndex: 0,
    });
    expect(closuresOn(facts, 2)).toEqual([]);
    expect(closuresOn(facts, 3)).toEqual([
      { locationId: 'mill', reason: 'LEFT' },
    ]);
    expect(closuresOn(facts, 4)).toEqual([
      { locationId: 'mill', reason: 'LEFT' },
    ]);
    expect(hasLeft(facts, 'mill', 4)).toBe(true);
    expect(
      closedMessage(
        { scenarioType: 'medieval', currentDay: 3, caseFacts: facts },
        'mill',
      ),
    ).toContain('kasabadan ayrıldı');
  });

  it('gazete ayrılışı bir gün önce ve o sabah duyurur; ötekiler dedikodusunu bilir', () => {
    const facts = withWildcard({
      kind: 'LEFT',
      npcId: 'mill',
      day: 3,
      reasonIndex: 0,
    });
    const night1 = processNight(
      emptyPersonaState(),
      {
        persona: { persona: 'NONE', events: [] },
        townEvents: [],
        wildcards: facts.wildcards,
      },
      1,
      ctx,
    );
    expect(night1.state.papers[0].items.map((i) => i.headline)).toContain(
      'Kişi-mill kasabadan ayrılıyor',
    );
    const night2 = processNight(
      night1.state,
      {
        persona: { persona: 'NONE', events: [] },
        townEvents: [],
        wildcards: facts.wildcards,
      },
      2,
      ctx,
    );
    expect(night2.state.papers[1].items.map((i) => i.headline)).toContain(
      'Kişi-mill kasabadan ayrıldı',
    );
    expect(wildcardPromptLines(facts, 2, 'tavern', ctx)[0]).toContain(
      'leaving town',
    );
    expect(wildcardPromptLines(facts, 2, 'mill', ctx)).toEqual([]);
    expect(ownWildcardPlanLines(facts, 2, 'mill', ctx)[0]).toContain(
      'TOMORROW',
    );
    expect(ownWildcardPlanLines(facts, 3, 'mill', ctx)).toEqual([]);
  });

  it('kısa gün ilk günse ilk sabahın gazetesi duyurur; hevesli kadı ilk sabah duyurulur', () => {
    const paper = firstMorningPaper(
      ctx,
      'Lord',
      'Kuyu',
      [],
      [
        { kind: 'SHORT_DAY', day: 2, reasonIndex: 0 },
        { kind: 'EXTRA_WARRANT' },
      ],
    );
    const headlines = paper.items.map((i) => i.headline);
    expect(headlines.some((h) => h.startsWith('Yarın:'))).toBe(true);
    expect(headlines).toContain('Arama izinlerinde kolaylık');
  });

  it('söylenti 2. sabah deftere doğrulanmamış bir olay kartı olarak düşer', () => {
    const wildcards: WildcardPlan[] = [
      { kind: 'RUMOR', npcId: 'church', day: 2, rumorIndex: 0 },
    ];
    const night = processNight(
      emptyPersonaState(),
      { persona: { persona: 'NONE', events: [] }, townEvents: [], wildcards },
      1,
      ctx,
    );
    expect(night.records).toEqual([
      expect.objectContaining({
        kind: 'EVENT',
        category: 'EVENT',
        sourceId: 'rumor',
      }),
    ]);
    expect(night.records[0].text).toContain('Doğrulanmamış');
    // Hedef katil de olsa masum da olsa aynı satırı alır
    expect(wildcardPromptLines({ wildcards }, 1, 'church', ctx)).toEqual([]);
    expect(wildcardPromptLines({ wildcards }, 2, 'church', ctx)[0]).toContain(
      'A rumor about you',
    );
    expect(wildcardPromptLines({ wildcards }, 2, 'tavern', ctx)[0]).toContain(
      'unverified',
    );
  });
});

describe('suskun tanığın rol metni', () => {
  it('kilit açılmadan tanıklığı anlatan cümle ve ona dönen talimat düşer (Gemini denemesi)', () => {
    const role =
      "Peder Malachar olarak, köyün manevi rehberisiniz. Cinayet gecesi biri gizlice İhtiyar Silas'ın kulübesinden bir şeyler alırken gördünüz ancak karanlıkta kim olduğunu tanımadınız. Sinyal verildiğinde veya bu gece sorulduğunda bu bilgiyi paylaşırsınız.";
    const testimony =
      "Peder Malachar, cinayet gecesi karanlık bir silüetin İhtiyar Silas'ın kulübesinden bu eşyayı aldığını gördüğünü ancak yüzünü seçemediğini belirtmektedir.";
    expect(withoutTestimonySentences(role, testimony, ['Peder Malachar'])).toBe(
      'Peder Malachar olarak, köyün manevi rehberisiniz.',
    );
  });

  it('tanıklıkla ilgisi olmayan cümleler kalır', () => {
    const role = 'Değirmenin sahibisiniz. Un çuvallarını sayarsınız.';
    expect(
      withoutTestimonySentences(role, 'Kilisenin önünde bir fener gördüm.', [
        'Giles',
      ]),
    ).toBe(role);
  });
});

describe('wildcard kanıtları', () => {
  const facts = {
    culpritId: 'church',
    motive: 'DEBT',
    weaponId: 'dagger',
    verification: {
      kind: 'CORROBORATION',
      placement: { type: 'TESTIMONY', npcId: 'tavern' },
    },
    verificationText: 'Gece yarısı kiliseden çıkan birini gördüm.',
  } as unknown as CaseFacts;

  it('kurbanın notu beden incelenince envantere düşer', () => {
    const drafts = evidenceFromTags({
      tags: new Set([EVIDENCE_TAG.body]),
      npcId: null,
      locationId: 'crime_scene',
      culpritId: 'church',
      caseFacts: {
        ...facts,
        wildcards: [{ kind: 'VICTIM_NOTE' }],
      },
      locationClues: {},
      scenarioType: 'medieval',
    });
    const note = drafts.find((d) => d.kind === 'NOTE');
    expect(note).toEqual(
      expect.objectContaining({ category: 'ITEM', sourceId: 'victim' }),
    );
    expect(drafts.some((d) => d.kind === 'BODY')).toBe(true);
  });

  it('wildcard yoksa not düşmez', () => {
    const drafts = evidenceFromTags({
      tags: new Set([EVIDENCE_TAG.body]),
      npcId: null,
      locationId: 'crime_scene',
      culpritId: 'church',
      caseFacts: facts,
      locationClues: {},
      scenarioType: 'medieval',
    });
    expect(drafts.some((d) => d.kind === 'NOTE')).toBe(false);
  });

  it('suskun tanığın kilidi açılmadan tanıklık kaydedilmez ve isteme girmez', () => {
    const base = {
      tags: new Set([EVIDENCE_TAG.verification]),
      npcId: 'tavern',
      locationId: null,
      culpritId: 'church',
      caseFacts: facts,
      locationClues: {},
    };
    expect(
      evidenceFromTags({ ...base, verificationLocked: true }).some(
        (d) => d.kind === 'VERIFICATION',
      ),
    ).toBe(false);
    expect(evidenceFromTags(base).some((d) => d.kind === 'VERIFICATION')).toBe(
      true,
    );

    const prompt = (reluctantLock?: 'CRIME_SCENE' | 'BODY') =>
      buildNpcPrompt({
        scenarioConfig: getScenarioConfig('medieval', 'easy'),
        session: {
          scenarioType: 'medieval',
          culpritId: 'church',
          warrantsIssued: 0,
          activeWarrants: [],
          caseFacts: facts,
        },
        npc: {
          id: 'tavern',
          name: 'Aldric',
          description: 'Hancı',
          basePrompt: '',
        },
        fearLevel: 0,
        hasConfessed: false,
        reluctantLock,
      });
    const locked = prompt('BODY');
    expect(locked).not.toContain(facts.verificationText);
    expect(locked).toContain('WHAT YOU SAW THAT NIGHT');
    expect(locked).toContain('findings under the cover');
    expect(locked).toContain('Never claim you saw nothing');
    expect(prompt()).toContain(facts.verificationText);
  });
});
