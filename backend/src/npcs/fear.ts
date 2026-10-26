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

// Karakterin itiraf eşiği: v2 vakalarında mizaca göre (soğukkanlı 8, normal 7, kırılgan 6), eskilerde 7
export function fearThresholdOf(
  caseFacts: Pick<Partial<CaseFacts>, 'fearThresholds'> | null | undefined,
  npcId: string,
): number {
  return caseFacts?.fearThresholds?.[npcId] ?? FEAR_BREAK_THRESHOLD;
}

// Bantlar eşiğe göredir: kırılgan biri daha erken terler, soğukkanlı biri daha geç
export function fearBand(
  level: number,
  threshold: number = FEAR_BREAK_THRESHOLD,
): FearBand {
  if (level >= threshold) return 'PANIC';
  if (level >= threshold - 2) return 'NERVOUS';
  if (level >= threshold - 4) return 'UNEASY';
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

  // Doğrulayan kanıt (eşya ya da tanıklık) katili sıkıştırır. Yanılabilen tanıklık ise tarife uyan herkesi
  // sıkıştırır: yalnızca katilin korkusu artsaydı gösterge, tanığın söylemediği adı ele verirdi.
  if (evidence.kind === 'VERIFICATION') {
    const fits = caseFacts?.verification?.witnessDescriptionFits;
    if (fits && caseFacts?.verification.kind === 'CORROBORATION') {
      return fits.includes(targetNpcId) ? 'IMPLICATING' : 'IRRELEVANT';
    }
    return targetNpcId === culpritId ? 'IMPLICATING' : 'IRRELEVANT';
  }
  // Yara, aleti bilmeden veren kişiyi tedirgin eder: aletin onun elinden çıktığını anlar
  if (evidence.kind === 'BODY') {
    const helper = caseFacts?.involvements?.find(
      (i) => i.kind === 'UNWITTING_HELP' && i.npcId === targetNpcId,
    );
    return helper ? 'IMPLICATING' : 'IRRELEVANT';
  }
  // Kurbanın son konuşmada anlattığı dert motifi gösterir ama kimseyi adıyla söylemez: kimseyi korkutmaz.
  // Yalnızca katili korkutsaydı, ifadeyi herkese sırayla göstermek korku göstergesinden katili söylerdi.
  if (evidence.kind === 'TESTIMONY') return 'IRRELEVANT';
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
export function fearPrompt(
  level: number,
  isCulprit: boolean,
  threshold: number = FEAR_BREAK_THRESHOLD,
  // Örtü hikâyesi olan katil panikte ona sarılır; "sırrını tutamıyorsun" denince gerçek motifi de söylüyordu
  hasCoverStory = false,
): string {
  const band = fearBand(level, threshold);
  const behaviour: Record<FearBand, string> = {
    CALM: 'You feel calm and in control. Answer steadily.',
    UNEASY:
      'You feel uneasy. Small signs show it: you avoid eye contact, fidget, answer a little too quickly.',
    NERVOUS:
      'You are clearly nervous. Your hands tremble, you sweat, you stammer and contradict small details.',
    PANIC: !isCulprit
      ? 'You are terrified and can no longer hold back your personal secret.'
      : hasCoverStory
        ? 'You are terrified and cling to your cover story. You add nothing to it: you never reveal your real motive, the weapon or anything from the true story, and you NEVER confess to the murder.'
        : 'You are cornered and panicking. Your story is cracking: you make one telling slip, but you NEVER confess to the murder.',
  };
  return `FEAR LEVEL: ${level}/${FEAR_MAX}. ${behaviour[band]}`;
}
