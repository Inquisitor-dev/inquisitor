import { CaseFacts } from '../scenarios/case-setup';

// Korku mekaniği: korkuyu yapay zekâ değil kod yönetir. Oyuncu bir karaktere kanıt gösterdiğinde
// kanıtın o karakterle ilgisi koda göre ölçülür ve korku artar. Korku eşiği geçince masum karakter
// sırrını itiraf eder (itiraf kodla kaydedilir), katil ise köşeye sıkışır ama cinayeti asla itiraf etmez.

export const FEAR_MAX = 10;
export const FEAR_BREAK_THRESHOLD = 7;
// Başlangıç korkusu eşiğin hep altında kalsın diye sınırlanır
export const STARTING_FEAR_MAX = 4;

// DECISIVE: karakterin kendi sırrını açığa çıkaran kanıt (kendi mekânının ipucu)
// IMPLICATING: karakteri şüpheli gösteren kanıt (olay yeri izi, katile karşı doğrulayan kanıt)
// IRRELEVANT: karakterle ilgisi olmayan kanıt
// REPEAT: aynı karaktere daha önce gösterilmiş kanıt
export type EvidenceImpact =
  | 'DECISIVE'
  | 'IMPLICATING'
  | 'IRRELEVANT'
  | 'REPEAT';

export const FEAR_GAIN: Record<EvidenceImpact, number> = {
  // Kendi sırrının kanıtı korku 0 olsa bile eşiği geçirir: o kanıtı bulan oyuncu itirafı hak eder
  DECISIVE: 7,
  IMPLICATING: 3,
  IRRELEVANT: 0,
  REPEAT: 0,
};

export type FearBand = 'CALM' | 'UNEASY' | 'NERVOUS' | 'PANIC';

export function startingFear(baseFear: number): number {
  return Math.min(STARTING_FEAR_MAX, Math.max(0, Math.round(baseFear / 2)));
}

export function fearBand(level: number): FearBand {
  if (level >= FEAR_BREAK_THRESHOLD) return 'PANIC';
  if (level >= 5) return 'NERVOUS';
  if (level >= 3) return 'UNEASY';
  return 'CALM';
}

export function evidenceImpact(params: {
  evidence: { kind: string; sourceId: string };
  targetNpcId: string;
  culpritId: string | null;
  caseFacts: CaseFacts | null;
  alreadyShown: boolean;
}): EvidenceImpact {
  const { evidence, targetNpcId, culpritId, caseFacts, alreadyShown } = params;
  if (alreadyShown) return 'REPEAT';

  // Doğrulayan kanıt (eşya ya da tanıklık) sadece katili sıkıştırır
  if (evidence.kind === 'VERIFICATION') {
    return targetNpcId === culpritId ? 'IMPLICATING' : 'IRRELEVANT';
  }
  if (evidence.kind === 'CLUE') {
    if (evidence.sourceId === 'crime_scene') {
      const implicated = caseFacts?.crimeSceneClue.implicatedNpcIds ?? [];
      return implicated.includes(targetNpcId) ? 'IMPLICATING' : 'IRRELEVANT';
    }
    // Her mekânın gizli ipucu orada yaşayan karakterin sırrını anlatır
    return evidence.sourceId === targetNpcId ? 'DECISIVE' : 'IRRELEVANT';
  }
  // Başkalarının itirafları kimseyi korkutmaz; mazeret sadece itiraf edeni ilgilendirir
  return 'IRRELEVANT';
}

export function raiseFear(current: number, impact: EvidenceImpact): number {
  return Math.min(FEAR_MAX, current + FEAR_GAIN[impact]);
}

// Korku seviyesinin karakterin konuşmasına yansıması (yapay zekâya giden talimat)
export function fearPrompt(level: number, isCulprit: boolean): string {
  const band = fearBand(level);
  const behaviour: Record<FearBand, string> = {
    CALM: 'You feel calm and in control. Answer steadily.',
    UNEASY:
      'You feel uneasy. Small signs show it: you avoid eye contact, fidget, answer a little too quickly.',
    NERVOUS:
      'You are clearly nervous. Your hands tremble, you sweat, you stammer and contradict small details.',
    PANIC: isCulprit
      ? 'You are cornered and panicking. Your story is cracking: you make one telling slip, but you NEVER confess to the murder.'
      : 'You are terrified and can no longer hold back your personal secret.',
  };
  return `FEAR LEVEL: ${level}/${FEAR_MAX}. ${behaviour[band]}`;
}
