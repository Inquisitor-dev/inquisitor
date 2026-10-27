import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';
import {
  ensureThreatLetter,
  fallbackLetter,
  isAcceptableLetter,
} from './threat-letter';

const names = { mill: 'Değirmenci Giles', church: 'Peder Malachar' };
const withLetter = {
  persona: {
    persona: 'PSYCHOPATH' as const,
    events: [{ night: 1, kind: 'THREAT_LETTER' as const }],
  },
};

const draft = (threatLetter?: string, letterTrace?: string): ScenarioDraft => ({
  scenario: '',
  truthReveal: '',
  culpritId: 'mill',
  npcPrompts: {},
  locationClues: {},
  victim: { name: 'Elara Voss', profession: 'Ebe' },
  threatLetter,
  letterTrace,
});

const good =
  'Mumun ışığında yazdığını görüyorum. Her sorunu duyuyorum. Bu köyden git, yoksa sıkıntın büyür.';

describe('tehdit mektubu denetimi', () => {
  it('uygun mektubu ve izi olduğu gibi tutar ("sıkıntı" küfür sayılmaz)', () => {
    const out = ensureThreatLetter(
      draft(good, 'kâğıtta un tozu var'),
      withLetter,
      names,
      'medieval',
    );
    expect(out.threatLetter).toBe(good);
    expect(out.letterTrace).toBe('kâğıtta un tozu var');
  });

  it('kısa, küfürlü ya da bir şüpheliyi / kurbanı anan mektup evrenin hazır mektubuyla değişir', () => {
    for (const bad of [
      'Git.',
      `${good} Seni orospu çocuğu.`,
      `${good} Değirmenci Giles'e sorma.`,
      `${good} Elara'yı unut.`,
    ]) {
      expect(
        ensureThreatLetter(draft(bad), withLetter, names, 'medieval')
          .threatLetter,
      ).toBe(fallbackLetter('medieval'));
    }
  });

  it('iz yoksa ya da bir şüpheliyi anıyorsa sade bir iz konur', () => {
    expect(
      ensureThreatLetter(draft(good), withLetter, names, 'medieval')
        .letterTrace,
    ).toBeTruthy();
    expect(
      ensureThreatLetter(
        draft(good, "Peder Malachar'ın mumu"),
        withLetter,
        names,
        'medieval',
      ).letterTrace,
    ).not.toContain('Malachar');
  });

  it('planda mektup yoksa taslağa dokunmaz', () => {
    const d = draft(undefined);
    expect(
      ensureThreatLetter(
        d,
        { persona: { persona: 'NONE', events: [] } },
        names,
        'medieval',
      ),
    ).toBe(d);
  });

  it('hazır mektuplar denetimden geçer', () => {
    for (const universe of [
      'medieval',
      'modern',
      'cyberpunk',
      'china',
      'winter',
    ]) {
      expect(
        isAcceptableLetter(fallbackLetter(universe), Object.values(names)),
      ).toBe(true);
    }
  });
});
