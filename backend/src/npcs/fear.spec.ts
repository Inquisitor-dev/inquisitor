import {
  fearThresholdOf,
  FEAR_BREAK_THRESHOLD,
  evidenceImpact,
  fearBand,
  raiseFear,
  startingFear,
} from './fear';
import { CaseFacts } from '../scenarios/case-setup';

const caseFacts = {
  crimeSceneClue: { implicatedNpcIds: ['mill', 'church'] },
} as unknown as CaseFacts;

const impactOf = (kind: string, sourceId: string, target: string) =>
  evidenceImpact({
    evidence: { kind, sourceId },
    targetNpcId: target,
    culpritId: 'mill',
    caseFacts,
    alreadyShown: false,
  });

describe('korku', () => {
  it('başlangıç korkusu her karakterde eşiğin altında kalır', () => {
    for (const base of [0, 1, 2, 3, 4, 5, 6, 7, 10, 99]) {
      expect(startingFear(base)).toBeLessThan(FEAR_BREAK_THRESHOLD);
      expect(startingFear(base)).toBeGreaterThanOrEqual(0);
    }
  });

  it('kendi sırrının kanıtı, geceler boyunca korkusu 0 a inmiş karakteri bile kırar', () => {
    expect(raiseFear(0, 'DECISIVE')).toBeGreaterThanOrEqual(
      FEAR_BREAK_THRESHOLD,
    );
    // Şüpheli gösteren tek kanıt ise sadece en korkak karakteri (başlangıç 4) kırabilir
    expect(raiseFear(startingFear(5), 'IMPLICATING')).toBeLessThan(
      FEAR_BREAK_THRESHOLD,
    );
  });

  it('kanıtın etkisini doğru sınıflar', () => {
    expect(impactOf('CLUE', 'tavern', 'tavern')).toBe('DECISIVE');
    expect(impactOf('CLUE', 'tavern', 'church')).toBe('IRRELEVANT');
    expect(impactOf('CLUE', 'crime_scene', 'church')).toBe('IMPLICATING');
    expect(impactOf('CLUE', 'crime_scene', 'farm')).toBe('IRRELEVANT');
    expect(impactOf('VERIFICATION', 'church', 'mill')).toBe('IMPLICATING');
    expect(impactOf('VERIFICATION', 'church', 'church')).toBe('IRRELEVANT');
    expect(impactOf('CONFESSION', 'tavern', 'mill')).toBe('IRRELEVANT');
    expect(
      evidenceImpact({
        evidence: { kind: 'CLUE', sourceId: 'tavern' },
        targetNpcId: 'tavern',
        culpritId: 'mill',
        caseFacts,
        alreadyShown: true,
      }),
    ).toBe('REPEAT');
  });

  it('korku bantları ve üst sınır', () => {
    expect(fearBand(0)).toBe('CALM');
    expect(fearBand(3)).toBe('UNEASY');
    expect(fearBand(5)).toBe('NERVOUS');
    expect(fearBand(7)).toBe('PANIC');
    expect(raiseFear(9, 'IMPLICATING')).toBe(10);
  });
});

describe('mizaca göre korku eşiği', () => {
  it('vaka gerçeklerindeki eşiği kullanır, yoksa 7', () => {
    const facts = { fearThresholds: { tavern: 6, church: 8 } };
    expect(fearThresholdOf(facts, 'tavern')).toBe(6);
    expect(fearThresholdOf(facts, 'church')).toBe(8);
    expect(fearThresholdOf(facts, 'mill')).toBe(7);
    expect(fearThresholdOf(null, 'mill')).toBe(7);
  });

  it('bantlar eşiğe göre kayar: kırılgan erken, soğukkanlı geç paniğe kapılır', () => {
    expect(fearBand(6, 6)).toBe('PANIC');
    expect(fearBand(6, 8)).toBe('NERVOUS');
    expect(fearBand(4, 6)).toBe('NERVOUS');
    expect(fearBand(4, 8)).toBe('UNEASY');
    expect(fearBand(3, 8)).toBe('CALM');
  });
});
