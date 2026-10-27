// Psikopatın tehdit mektubu (v3): metni Gemini senaryoyla birlikte yazar, kod denetler (kâğıttaki izi kod
// seçer: scenarios/personas/letter-traces.ts). Korkutucu ve
// tehditkâr olmalı ama küfür ve ağır hakaret içermemeli; bir şüpheliyi ya da kurbanı adıyla anmamalı.
// Geçemezse evrenin hazır mektubu kullanılır.
import { mentions } from '../npcs/case-statements';
import { foldTurkish } from '../npcs/prompt-guard';
import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';
import type { CasePlan } from '../scenarios/case-setup';

// Küfür ve ağır hakaret (Türkçe karakterler sadeleştirilmiş). Kısa olanlar yalnızca tam kelime olarak
// aranır: "sik" ve "got" önek olarak "sıkıntı" ve "götür"e de uyardı.
const BANNED =
  /\b(amk|aq|sik|got|pic)\b|\b(orospu|siktir|yarrak|kahpe|serefsiz|ibne|pezevenk|kancik|gerizekali)/;

// Mektup bunlardan kısa olamaz (boş ya da tek kelimelik cevap)
const MIN_LENGTH = 40;

const FALLBACK_LETTERS: Record<string, string> = {
  medieval:
    'Mumun ışığında yazdığını görüyorum, Engizitör. Her kapıyı çaldığında bir adım gerimde değil, bir adım önündeyim. Kazmayı bırak; bazı mezarlar açılmak için kazılmaz.',
  modern:
    'Gece pencerenin önünden geçtim, dedektif. Not defterine yazdığın her ismi ben de biliyorum. Bu kasabadan sessizce git; bir sonraki mektubu kapına bırakmam.',
  cyberpunk:
    'Kameraların kör olduğu yerleri biliyorum, dedektif. Kapına kâğıt bıraktım çünkü kâğıt iz bırakmaz sanırsın. Aramayı kes; sinyalin kesildiğinde kimse seni aramayacak.',
  china:
    'Fenerin söndüğünde avluna girdim, müfettiş. Fırçanla yazdığın her şeyi okudum. Bu şehirden çekil; nehir her sırrı taşımaz ama seni taşır.',
  winter:
    'Kardaki izlerini sabaha kadar izledim, müfettiş. Soğuk herkesi susturur, seni de susturacak. Sorularını bırak ve geçit açılınca bu kasabadan git.',
};

export const fallbackLetter = (scenarioType: string) =>
  FALLBACK_LETTERS[scenarioType] ?? FALLBACK_LETTERS.medieval;

export function isAcceptableLetter(text: string, names: string[]): boolean {
  const letter = text.trim();
  if (letter.length < MIN_LENGTH) return false;
  if (BANNED.test(foldTurkish(letter))) return false;
  return !names.some((name) => name && mentions(letter, name));
}

// Planda mektup varsa metni ve izi denetler; geçemeyen hazır metinle değiştirilir
export function ensureThreatLetter(
  draft: ScenarioDraft,
  plan: Pick<CasePlan, 'persona'>,
  npcNames: Record<string, string>,
  scenarioType: string,
): ScenarioDraft {
  if (!plan.persona?.events.some((e) => e.kind === 'THREAT_LETTER'))
    return draft;
  const names = [...Object.values(npcNames), draft.victim?.name ?? ''];
  const letter = draft.threatLetter?.trim() ?? '';
  return {
    ...draft,
    threatLetter: isAcceptableLetter(letter, names)
      ? letter
      : fallbackLetter(scenarioType),
  };
}
