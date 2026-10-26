import {
  CasePlan,
  isPlanSound,
  planCase,
  planCaseDraft,
} from '../scenarios/case-setup';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { buildCaseFacts } from '../game-sessions/case-facts';
import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';
import type { StoryPackage } from './story-package';
import { validateStoryPackage } from './story-validation';

// Tekrarlanabilir rastgele sayı (mulberry32): testler her seferinde aynı planı kursun
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const config = getScenarioConfig('medieval', 'easy');

// Plana uyan, her alanı dolu sade bir taslak
function draftFor(plan: CasePlan): ScenarioDraft {
  return {
    scenario:
      'Ashenmoor’u sis yuttuğu gece köyden biri evine dönmedi. Sabah bulunan beden herkesi susturdu.',
    truthReveal: 'Gerçek metni.',
    culpritId: plan.culpritId,
    npcPrompts: Object.fromEntries(
      config.npcDefinitions.map((npc) => [npc.id, `Sen ${npc.name}’sin.`]),
    ),
    locationClues: Object.fromEntries(
      getScenarioConfig(
        'medieval',
        'easy',
        plan.crimeSceneId,
      ).locationDefinitions.map((l) => [l.id, `${l.id} mekânında bir ipucu.`]),
    ),
    victim: { name: 'Marta Vell', profession: 'Tefeci' },
    verificationText: 'Doğrulayan kanıt metni.',
    alibis: Object.fromEntries(
      plan.innocentIds.map((id) => [id, 'Gece yarısı başka yerdeydi.']),
    ),
    witnessDescription: plan.verification.witnessDescriptionFits
      ? 'iri yarı biri'
      : undefined,
    culpritCover: 'Gece yarısı kendi yerimde tek başımaydım.',
  };
}

function packageFor(plan: CasePlan): StoryPackage {
  const draft = draftFor(plan);
  return {
    scenarioType: 'medieval',
    difficulty: 'easy',
    plan,
    facts: buildCaseFacts(plan, draft),
    draft,
  };
}

const soundPlan = planCase(config, 'easy', seeded(7));
const valid = () =>
  JSON.parse(JSON.stringify(packageFor(soundPlan))) as StoryPackage;
const nameOf = (id: string) =>
  config.npcDefinitions.find((npc) => npc.id === id)!.name;

describe('validateStoryPackage', () => {
  it('plana uyan, çözülebilir paketi geçirir', () => {
    expect(validateStoryPackage(valid())).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it('katilin örtü hikâyesi yoksa uyarır: katil kırılmaz, oyun hikâyeyi seçmez', () => {
    const pkg = valid();
    delete pkg.facts.culpritCover;
    const result = validateStoryPackage(pkg);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([
      expect.stringContaining('örtü hikâyesi (culpritCover) yok'),
    ]);
  });

  it('Vaka Motoru v2 alanı eksikse alan hatalarını döndürür', () => {
    const pkg = valid();
    delete (pkg.plan as Partial<CasePlan>).weaponId;
    const result = validateStoryPackage(pkg);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('v2 alanı eksik: plan.weaponId');
  });

  it('eksik rol metnini, mekân ipucunu ve mazereti bulur', () => {
    const pkg = valid();
    const innocent = pkg.plan.innocentIds[0];
    delete pkg.draft.npcPrompts[pkg.plan.culpritId];
    pkg.draft.locationClues.crime_scene = '  ';
    pkg.facts.alibis[innocent] = '';
    const { errors } = validateStoryPackage(pkg);
    expect(errors).toEqual(
      expect.arrayContaining([
        `${nameOf(pkg.plan.culpritId)} için rol metni (npcPrompts.${pkg.plan.culpritId}) yok.`,
        'Mekân ipucu (locationClues.crime_scene) yok.',
        `${nameOf(innocent)} için mazeret (alibis.${innocent}) yok.`,
      ]),
    );
  });

  it('plan, gerçekler ve metin farklı katil ya da ayrıntı söylüyorsa reddeder', () => {
    const pkg = valid();
    pkg.facts.culpritId = pkg.plan.innocentIds[0];
    pkg.draft.culpritId = pkg.plan.innocentIds[0];
    pkg.facts.motive = pkg.plan.motive === 'DEBT' ? 'GREED' : 'DEBT';
    const { errors } = validateStoryPackage(pkg);
    expect(errors).toEqual(
      expect.arrayContaining([
        'facts.culpritId plandaki katille aynı değil.',
        'draft.culpritId plandaki katille aynı değil.',
        'facts.motive plandakiyle aynı değil.',
      ]),
    );
  });

  it('kataloğunda olmayan silahı ve eksik masum bağını bulur', () => {
    const pkg = valid();
    const innocent = pkg.plan.innocentIds[0];
    pkg.plan.weaponId = 'laser';
    pkg.facts.weaponId = 'laser';
    pkg.plan.involvements = pkg.plan.involvements!.filter(
      (inv) => inv.npcId !== innocent,
    );
    const { errors } = validateStoryPackage(pkg);
    expect(errors).toEqual(
      expect.arrayContaining([
        'Silah bu evrenin kataloğunda yok: laser.',
        `${nameOf(innocent)} için cinayetle bağ yok.`,
      ]),
    );
  });

  it('kadro zorluğun şüphelileriyle aynı değilse reddeder', () => {
    const pkg = valid();
    pkg.difficulty = 'medium';
    expect(validateStoryPackage(pkg).errors[0]).toMatch(
      /Plandaki kadro .* bu zorluğun şüphelileriyle .* aynı değil/,
    );
  });

  describe('katilin erken sızması', () => {
    it('vaka metni kurbanın adını verirse reddeder', () => {
      const pkg = valid();
      pkg.draft.scenario = 'Marta Vell sabah köprüde bulundu.';
      expect(validateStoryPackage(pkg).errors).toContain(
        'Vaka metni (scenario) kurbanın adını veriyor.',
      );
    });

    it('vaka metni şüphelilerden yalnızca katili anıyorsa reddeder', () => {
      const pkg = valid();
      pkg.draft.scenario = `Herkes ${nameOf(pkg.plan.culpritId)}’e bakıyor.`;
      expect(validateStoryPackage(pkg).errors).toContain(
        `Vaka metni (scenario) şüphelilerden yalnızca katili (${nameOf(pkg.plan.culpritId)}) anıyor.`,
      );
    });

    it('katil ve şüphelilerin bir kısmı anılıyorsa uyarır, bütün şüpheliler anılıyorsa sorun yok', () => {
      const pkg = valid();
      const [first] = pkg.plan.innocentIds;
      pkg.draft.scenario = `${nameOf(pkg.plan.culpritId)} ve ${nameOf(first)} o gece köydeydi.`;
      const partial = validateStoryPackage(pkg);
      expect(partial.valid).toBe(true);
      expect(partial.warnings).toHaveLength(1);

      pkg.draft.scenario = `${config.npcDefinitions.map((npc) => npc.name).join(', ')} o gece köydeydi.`;
      expect(validateStoryPackage(pkg).warnings).toEqual([]);
    });
  });

  it('çözücüden geçmeyen planı reddeder', () => {
    // Çözücüden geçmemiş taslak planlar arasından sağlam olmayan ilki
    let unsound: CasePlan | null = null;
    for (let seed = 1; seed < 500 && !unsound; seed++) {
      const draftPlan = planCaseDraft(config, 'easy', seeded(seed));
      if (!isPlanSound(draftPlan, 'easy')) unsound = draftPlan;
    }
    expect(unsound).not.toBeNull();
    const result = validateStoryPackage(packageFor(unsound!));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      expect.stringMatching(/^Çözücü: vaka 2 arama izniyle çözülemiyor/),
    ]);
  });
});
