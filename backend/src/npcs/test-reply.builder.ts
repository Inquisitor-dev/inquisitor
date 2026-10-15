import { foldTurkish } from './prompt-guard';
import { EVIDENCE_TAG } from './evidence';
import type { EvidenceImpact } from './fear';

export function buildTestReply(
  npcName: string,
  isGreeting: boolean,
  userMessage: string,
  locations: { id: string; localizedName: string }[],
  isNarrator = false,
  confrontation?: { impact: EvidenceImpact; fear: number; forcedConfession: boolean },
): string {
  if (isGreeting) return `[TEST MODU] ${npcName} seni selamlıyor.`;
  if (confrontation) {
    const reaction = confrontation.forcedConfession
      ? 'dayanamıyor ve sırrını itiraf ediyor.'
      : `kanıta bakıyor (etki: ${confrontation.impact}).`;
    return `[TEST MODU] ${npcName} ${reaction} Korku: ${confrontation.fear}/10`;
  }

  // Kanıt Defteri yapay zekâ olmadan denenebilsin diye anahtar kelimelerle etiket eklenir:
  // anlatıcıda "ara/incele", karakterde "itiraf" ve "kanıt"
  const folded = foldTurkish(userMessage);
  if (isNarrator) {
    const found = /\b(ara|incele)/.test(folded);
    return `[TEST MODU] Anlatıcı: ${found ? 'Gizli ipucunu buldun.' : 'Etrafta olağandışı bir şey yok.'}${found ? ` [${EVIDENCE_TAG.clue}]` : ''}`;
  }
  const evidenceTags = [
    /itiraf/.test(folded) ? ` [${EVIDENCE_TAG.confession}]` : '',
    /kanit/.test(folded) ? ` [${EVIDENCE_TAG.verification}]` : '',
  ].join('');

  // "Değirmen" ile "degirmen" aynı sayılsın diye Türkçe karakterler sadeleştirilerek karşılaştırılır
  const normalized = foldTurkish(userMessage);
  const requested = locations.find(
    (location) =>
      location.id !== 'crime_scene' &&
      normalized.includes(foldTurkish(location.localizedName)),
  );
  const warrantTag = requested ? ` [GRANT_WARRANT: ${requested.id}]` : '';
  return `[TEST MODU] ${npcName}: "${userMessage.slice(0, 80)}" sorusunu duydum. Bu bir yer tutucu cevaptır.${warrantTag}${evidenceTags}`;
}
