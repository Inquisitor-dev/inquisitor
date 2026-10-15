import { foldTurkish } from './prompt-guard';
import { EVIDENCE_TAG } from './evidence';
import type { EvidenceImpact } from './fear';

export function buildTestReply(
  npcName: string,
  isGreeting: boolean,
  userMessage: string,
  isNarrator = false,
  confrontation?: {
    impact: EvidenceImpact;
    fear: number;
    forcedConfession: boolean;
  },
  // Arama izni kararını kod verir; test cevabına not olarak eklenir
  warrantNote?: string,
): string {
  if (isGreeting) return `[TEST MODU] ${npcName} seni selamlıyor.`;
  if (confrontation) {
    const reaction = confrontation.forcedConfession
      ? 'dayanamıyor ve sırrını itiraf ediyor.'
      : `kanıta bakıyor (etki: ${confrontation.impact}).`;
    return `[TEST MODU] ${npcName} ${reaction} Korku: ${confrontation.fear}/10`;
  }

  // Kanıt Defteri yapay zekâ olmadan denenebilsin diye anahtar kelimelerle etiket eklenir:
  // anlatıcıda "ara/incele", karakterde "kanıt" (tanıklık). İtiraf sadece korku eşiğiyle gelir.
  const folded = foldTurkish(userMessage);
  if (isNarrator) {
    const found = /\b(ara|incele)/.test(folded);
    return `[TEST MODU] Anlatıcı: ${found ? 'Gizli ipucunu buldun.' : 'Etrafta olağandışı bir şey yok.'}${found ? ` [${EVIDENCE_TAG.clue}]` : ''}`;
  }
  const evidenceTag = /kanit/.test(folded)
    ? ` [${EVIDENCE_TAG.verification}]`
    : '';
  const note = warrantNote ? ` ${warrantNote}` : '';
  return `[TEST MODU] ${npcName}: "${userMessage.slice(0, 80)}" sorusunu duydum. Bu bir yer tutucu cevaptır.${note}${evidenceTag}`;
}
