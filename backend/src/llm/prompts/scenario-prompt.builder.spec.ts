import { buildCaseBrief } from './scenario-prompt.builder';
import { getScenarioConfig } from '../../scenarios/scenario-config';
import { planCase } from '../../scenarios/case-setup';

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
