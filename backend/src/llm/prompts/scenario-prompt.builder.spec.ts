import {
  buildCaseBrief,
  buildScenarioPrompt,
  mergeScenarioDraftWithFallback,
} from './scenario-prompt.builder';
import { getScenarioConfig } from '../../scenarios/scenario-config';
import { CasePlan, planCase } from '../../scenarios/case-setup';

describe('buildCaseBrief', () => {
  const config = getScenarioConfig('cyberpunk', 'easy');
  const npcNames = Object.fromEntries(
    config.npcDefinitions.map((npc) => [npc.id, npc.name]),
  );

  it('olay yerini ve örtüyü cesedi bulanların örttüğünü söyler', () => {
    const plan = { ...planCase(config, 'easy'), crimeSceneId: 'metro' };
    const brief = buildCaseBrief(plan, 'cyberpunk', npcNames);
    expect(brief).toContain('MURDER LOCATION');
    expect(brief).toContain('Metro Peronu');
    expect(brief).toContain('a sealed black body bag');
    expect(brief).toContain('the culprit did not');
  });

  it('gerçek izi cümlenin ortasına yapıştırmak yerine doğal bir cümleyle anlatmasını ister', () => {
    let rngSeed = 1;
    const rng = () => {
      rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
      return rngSeed / 4294967296;
    };
    let plan = planCase(config, 'easy', rng);
    while (!plan.crimeSceneClue.authentic) plan = planCase(config, 'easy', rng);
    const brief = buildCaseBrief(plan, 'cyberpunk', npcNames);
    expect(brief).toContain(plan.crimeSceneClue.poolClueText!);
    expect(brief).toContain('one natural Turkish sentence');
    expect(brief).not.toContain('MUST use exactly this text');
  });
});

describe('Vaka Motoru v2 vaka özeti', () => {
  const config = getScenarioConfig('medieval', 'hard');
  const npcNames = Object.fromEntries(
    config.npcDefinitions.map((npc) => [npc.id, npc.name]),
  );
  const base = planCase(config, 'hard');
  // Elle kurulmuş, her sır türünü içeren bir plan
  const plan: CasePlan = {
    ...base,
    culpritId: 'mill',
    innocentIds: ['tavern', 'church', 'graveyard', 'farm', 'clinic'],
    murderStyle: 'HURRIED',
    crimeSceneClue: { ...base.crimeSceneClue, authentic: true },
    verification: {
      kind: 'CORROBORATION',
      placement: { type: 'TESTIMONY', npcId: 'tavern' },
      witnessDescriptionFits: ['mill', 'farm', 'clinic'],
    },
    weaponId: 'hammer',
    motive: 'DEBT',
    timeOfDeath: 'MIDNIGHT',
    involvements: [
      { npcId: 'tavern', kind: 'WITNESS', aboutNpcId: 'mill' },
      { npcId: 'church', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
      { npcId: 'graveyard', kind: 'SCAVENGER' },
      { npcId: 'farm', kind: 'NONE', aboutNpcId: 'clinic' },
      { npcId: 'clinic', kind: 'NONE', aboutNpcId: 'church' },
    ],
  };
  const brief = buildCaseBrief(plan, 'medieval', npcNames);

  it('silahı, motifi ve ölüm saatini koddaki kimliklerden yazar', () => {
    expect(brief).toContain('MURDER WEAPON: Demirci çekici');
    expect(brief).toContain('MOTIVE: Borç');
    expect(brief).toContain('TIME OF DEATH: Gece yarısı civarı');
  });

  it('tanıktan katili adıyla değil, eşkâlle anlatmasını ister', () => {
    expect(brief).toContain('A WITNESS WHO DOES NOT KNOW WHO IT WAS');
    expect(brief).toContain('"farm" (Çiftçi Edmund)');
    expect(brief).toContain('WITHOUT any suspect');
    const prompt = buildScenarioPrompt({
      difficulty: 'hard',
      scenarioType: 'medieval',
      worldDescription: '',
      styleInstruction: '',
      baseNpcs: config.npcDefinitions,
      locationDefinitions: config.locationDefinitions,
      plan,
      caseBrief: brief,
    });
    expect(prompt).toContain('"witnessDescription"');
  });

  it('her masumun cinayetle bağını o masuma yazdırır', () => {
    expect(brief).toContain('HELPED WITHOUT KNOWING');
    // Silahı veren kime verdiğini bilir; yalnızca yazılı kayıtta alıcının adı yoktur
    expect(brief).toContain('They know very well whom they gave it to');
    // Rol metni itiraftan ya da kırılmadan söz etmez; kimlikler metne yazılmaz
    expect(brief).not.toContain('until they break');
    expect(brief).toContain('does not mention confessing');
    expect(brief).toContain('never write them in any text you return');
    expect(brief).toContain("without the other person's name");
    expect(brief).toContain('SCAVENGER');
    expect(brief).toContain('FULLY INNOCENT');
    // Doğrulayan tanığın kendi satırı zaten var; bağ listesinde tekrar edilmez
    expect(brief).not.toContain('"tavern" (Kardeş Aldric) WITNESS');
  });

  it('tutarlılık kontrolü eşkâli korur', () => {
    const merged = mergeScenarioDraftWithFallback(
      {
        scenario: 'a',
        truthReveal: 'b',
        culpritId: 'mill',
        npcPrompts: {},
        locationClues: {},
        witnessDescription: 'deri önlüklü, iri biri',
      },
      {
        scenario: '',
        truthReveal: '',
        culpritId: 'mill',
        npcPrompts: {},
        locationClues: {},
      },
      [],
    );
    expect(merged.witnessDescription).toBe('deri önlüklü, iri biri');
  });
});
