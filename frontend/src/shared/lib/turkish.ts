// Yönelme hâli eki (-e/-a, ünlüyle bitende -ye/-ya): "Kilise'ye", "Taverna'ya", "Değirmen'e".
// Son ünlüye göre seçilir (kalın ünlü: a, ı, o, u). Kesme işaretiyle özel ada eklenir.
const VOWELS = 'aeıioöuüAEIİOÖUÜ';
const BACK = 'aıouAIOU';

export function withDative(name: string): string {
  const letters = [...name.trim()];
  const lastVowel = [...letters].reverse().find((c) => VOWELS.includes(c));
  const suffix = lastVowel && BACK.includes(lastVowel) ? 'a' : 'e';
  const last = letters[letters.length - 1] ?? '';
  return `${name.trim()}'${VOWELS.includes(last) ? 'y' : ''}${suffix}`;
}
