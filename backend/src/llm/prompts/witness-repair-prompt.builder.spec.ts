import {
  buildWitnessRepairPrompt,
  parseWitnessRepair,
} from './witness-repair-prompt.builder';

describe('doğrulayan tanık onarım istemi', () => {
  it('adı kaldırmayı ve tanığın sırrını korumayı ister', () => {
    const prompt = buildWitnessRepairPrompt({
      scenarioType: 'cyberpunk',
      witnessName: 'Brakk Coil',
      culpritName: 'Kael Voss',
      verificationText: 'Brakk, Kael Voss kabloyu aldı dedi.',
      npcPrompt: 'Sen Brakk Coil sin.',
    });
    expect(prompt).toContain('Remove every mention of Kael Voss');
    expect(prompt).toContain("witness's own secret, word for word");
  });

  it('cevap ayrıştırılır; eksik alan reddedilir', () => {
    expect(
      parseWitnessRepair('{"verificationText": "A", "npcPrompt": "B"}'),
    ).toEqual({ verificationText: 'A', npcPrompt: 'B' });
    expect(parseWitnessRepair('{"verificationText": "A"}')).toBeNull();
    expect(parseWitnessRepair('yok')).toBeNull();
  });
});
