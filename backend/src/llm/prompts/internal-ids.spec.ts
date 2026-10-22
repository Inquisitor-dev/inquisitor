import { cleanInternalIds } from './internal-ids';
import { cleanDraftIds, ensureHelperKnowsBuyer } from '../llm.service';

const names = { mill: 'AURA-9', tavern: 'Lin Feng', farm: 'Ash' };

describe('iç kimlik temizliği', () => {
  it("Enes'in raporundaki biçimler karakterin adına çevrilir", () => {
    expect(cleanInternalIds("Katil 'mill' (AURA-9) idi.", names)).toBe(
      'Katil AURA-9 idi.',
    );
    expect(
      cleanInternalIds("Çay evi sahibi Lin Feng ('tavern') sakladı.", names),
    ).toBe('Çay evi sahibi Lin Feng sakladı.');
    expect(cleanInternalIds("'mill' kimliğiyle bilinen android.", names)).toBe(
      'AURA-9 kimliğiyle bilinen android.',
    );
    expect(cleanInternalIds('Ceset crime_scene alanındaydı.', names)).toBe(
      'Ceset olay yeri alanındaydı.',
    );
  });

  it('kimlik geçmeyen metne ve paragraflara dokunmaz', () => {
    const text = 'Ash pazardaydı.\n\nAURA-9 tamirhanedeydi.';
    expect(cleanInternalIds(text, names)).toBe(text);
  });

  it('taslağın bütün metin alanları temizlenir', () => {
    const draft = cleanDraftIds(
      {
        scenario: 'Bir ceset.',
        truthReveal: "'farm' (Ash) suçsuzdu.",
        culpritId: 'mill',
        npcPrompts: { tavern: "Sen 'tavern' (Lin Feng) sin." },
        locationClues: { farm: "'farm' tezgâhı." },
        alibis: { farm: "'farm' pazardaydı." },
        verificationText: "Lin Feng ('tavern') gördü.",
      },
      names,
    );
    expect(draft.truthReveal).toBe('Ash suçsuzdu.');
    expect(draft.npcPrompts.tavern).toBe('Sen Lin Feng sin.');
    expect(draft.locationClues.farm).toBe('Ash tezgâhı.');
    expect(draft.alibis?.farm).toBe('Ash pazardaydı.');
    expect(draft.verificationText).toBe('Lin Feng gördü.');
  });
});

describe('silahı veren kime verdiğini bilir', () => {
  const plan = {
    culpritId: 'farm',
    involvements: [
      { npcId: 'tavern', kind: 'UNWITTING_HELP' as const, aboutNpcId: 'farm' },
    ],
  };
  const base = {
    scenario: '',
    truthReveal: '',
    culpritId: 'farm',
    locationClues: {},
  };

  it('rol metninde alıcının adı yoksa koddan eklenir', () => {
    // Hakem denemesinde reddedilen rol metni
    const draft = ensureHelperKnowsBuyer(
      {
        ...base,
        npcPrompts: {
          tavern: 'Cinayetten kısa süre önce şüpheli birine kablo sattın.',
        },
      },
      plan,
      names,
    );
    expect(draft.npcPrompts.tavern).toContain('kime verdiğini biliyorsun: Ash');
  });

  it('ad zaten varsa dokunmaz', () => {
    const npcPrompts = { tavern: "Kabloyu Ash'e sattın." };
    expect(
      ensureHelperKnowsBuyer({ ...base, npcPrompts }, plan, names).npcPrompts,
    ).toBe(npcPrompts);
  });
});
