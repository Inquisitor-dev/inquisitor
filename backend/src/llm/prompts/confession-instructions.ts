import { foldTurkish } from '../../npcs/prompt-guard';

// İtirafı oyun verir (korku eşiği, npcs/fear.ts); rol metni karaktere ne zaman itiraf edeceğini
// söylememeli. Gemini istemdeki "itiraf ettiğinde şunu söyler" satırlarını rol metnine "Sorguda bunu
// itiraf edeceksin" diye taşıyabiliyor (hakem denemelerinde silahı bilmeden veren ve leş kargası
// rollerinde görüldü). Bu cümleler koddan çıkarılır.

// "itiraf edeceksin / edersin / etmelisin"
const CONFESS_INSTRUCTION = /itiraf (ed(ecek|er)sin|etmelisin)/;
// Baskı anı: sıkıştırılınca, köşeye sıkışınca, kırılınca, baskı altında, kanıt gösterilince, tehdit edilince
const PRESSURE =
  /(sikistir|koseye sikis|kiril|baski|kanit gosteril|tehdit edil)/;
// İkinci tekil kişiye anlatma emri (olumsuzu sayılmaz: "söylemezsin", "anlatmazsın")
const REVEAL_WORD = /^(itiraf|anlat|soyl|acikl|dokul)\p{L}*sin$/u;
const NEGATIVE = /(mez|maz|meyecek|mayacak)/;

export function isConfessionInstruction(sentence: string): boolean {
  const folded = foldTurkish(sentence);
  if (CONFESS_INSTRUCTION.test(folded)) return true;
  if (!PRESSURE.test(folded)) return false;
  return (folded.match(/\p{L}+/gu) ?? []).some(
    (word) => REVEAL_WORD.test(word) && !NEGATIVE.test(word),
  );
}

// Metindeki itiraf talimatı cümlelerini çıkarır; değişiklik yoksa metni aynen döndürür
export function stripConfessionInstructions(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter(
    (sentence) => !isConfessionInstruction(sentence),
  );
  return kept.length === sentences.length ? text : kept.join(' ');
}

export function removeConfessionInstructions(
  npcPrompts: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(npcPrompts).map(([id, prompt]) => [
      id,
      stripConfessionInstructions(prompt),
    ]),
  );
}
