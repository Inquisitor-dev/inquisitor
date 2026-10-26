import { foldTurkish } from '../../npcs/prompt-guard';
import { getScenarioConfig } from '../../scenarios/scenario-config';

// Katilin mekân ipucu motifini ya da şüpheli bir uğraşı göstermeli, cinayetin doğrudan kanıtı olmamalı.
// Gemini bu kurala her zaman uymuyor (oyun testinde fıçıların arkasında kanlı cinayet aleti çıktı):
// o zaman aranan tek mekân vakayı bitiriyordu. Kod bunu yakalar, ipucu ve gerçek metni onarılır.

// Kan ve onun ekleri ("kanlı", "kanı", "kanlar"); "kanıt", "kanepe" gibi kelimeler sayılmaz
const BLOOD = /\bkan(li\w*|lar\w*|i|in|a|da)?\b/;

export function culpritClueGivesAway(
  clue: string,
  weaponLabel?: string,
): boolean {
  const text = foldTurkish(clue);
  if (BLOOD.test(text)) return true;
  if (!weaponLabel) return false;
  // Silahın adındaki anlamlı kelimeler ("Demirci çekici" → demirci, cekici)
  return foldTurkish(weaponLabel)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4)
    .some((w) => text.includes(w));
}

export interface ClueRepairInput {
  scenarioType: string;
  // Katilin mekânının adı (yerelleştirilmiş)
  place: string;
  clue: string;
  truthReveal: string;
  motiveLabel?: string;
  weaponLabel?: string;
}

export function buildClueRepairPrompt(input: ClueRepairInput): string {
  const setting = getScenarioConfig(input.scenarioType).settingLabel;
  return `You are a continuity editor for a detective game (setting: ${setting}).

The hidden clue at the murderer's own place (${input.place}) gives the murder away directly. It must instead show the murderer's motive${input.motiveLabel ? ` (${input.motiveLabel})` : ''} or a suspicious activity: something that makes them look worth watching, never proof of the murder.

CURRENT CLUE:
${input.clue}

TRUE STORY (it may mention the same clue):
${input.truthReveal}

Rewrite:
- "clue": one Turkish sentence. Keep the exact hiding spot inside ${input.place}. It must NOT contain blood, the murder weapon${input.weaponLabel ? ` (${input.weaponLabel})` : ''}, the victim's belongings or anything from the crime scene.
- "truthReveal": the true story with only the sentences about this clue changed so that they match the new clue. Keep everything else word for word.
Correct Turkish spelling with all special characters, and no English words.

Return only JSON: {"clue": "...", "truthReveal": "..."}`;
}

export function parseClueRepair(
  text: string,
): { clue: string; truthReveal: string } | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      clue?: unknown;
      truthReveal?: unknown;
    };
    if (
      typeof parsed.clue !== 'string' ||
      !parsed.clue.trim() ||
      typeof parsed.truthReveal !== 'string' ||
      !parsed.truthReveal.trim()
    ) {
      return null;
    }
    return { clue: parsed.clue.trim(), truthReveal: parsed.truthReveal.trim() };
  } catch {
    return null;
  }
}

// Tuzak iz, suçlanmak istenen herkesi işaret etmeli: kişinin adı ya da mekânı geçmeli. Yalnızca birini
// gösterirse panonun "iz → diğeri" kararı oyuncuya anlamsız gelir (oyun testinde iz iki kişiden birini
// gösteriyordu).
export function traceMissesFramed(
  clue: string,
  framed: { name: string; place: string }[],
  mentions: (text: string, name: string) => boolean,
): { name: string; place: string }[] {
  return framed.filter(
    (f) => !mentions(clue, f.name) && !mentions(clue, f.place),
  );
}

export interface TraceRepairInput {
  scenarioType: string;
  clue: string;
  truthReveal: string;
  framed: { name: string; place: string }[];
}

export function buildTraceRepairPrompt(input: TraceRepairInput): string {
  const setting = getScenarioConfig(input.scenarioType).settingLabel;
  const people = input.framed
    .map((f) => `${f.name} (${f.place})`)
    .join(' and ');
  return `You are a continuity editor for a detective game (setting: ${setting}).

The murderer planted a fake trace at the crime scene to frame ${people}. The trace must point at EACH of them, but now it does not.

CURRENT TRACE:
${input.clue}

TRUE STORY:
${input.truthReveal}

Rewrite:
- "clue": one Turkish sentence. Keep the same object and its exact position at the scene, and make it clearly linked to every one of them by name or by their place (for example one mark for each, or something they share). Never name the murderer.
- "truthReveal": the true story with only the sentences about this trace changed so that they match. Keep everything else word for word.
Correct Turkish spelling with all special characters, and no English words.

Return only JSON: {"clue": "...", "truthReveal": "..."}`;
}

// Tamamen masum eşler aynı yerde birlikteydi; mazeretleri farklı mekân söylerse oyuncu birini yalancı
// sanır (oyun taramasında: "revirde Giles ile" / "değirmende Harland ile"). Metinde geçen mekânlar,
// mekân adının bütün kelimeleri kelime başında geçiyorsa sayılır ("Sokak Pazarı" için yalnız "sokak" yetmez).
// Ekler ve ünsüz yumuşaması tanınır: pilotta "Kadim Tapınak" → "tapınağın", "Balıkçı İskelesi" →
// "iskelemde" yakalanmadığı için ayrı yer söyleyen eşler onarılmadan geçti.
const foldPlace = (text: string) =>
  foldTurkish(text).replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');

// "bar", "han", "sur" gibi kısa adlar yalnızca kendi başına ya da bir hâl ekiyle sayılır ("barınak" sayılmaz)
const SHORT_SUFFIX =
  "(?:'?(?:a|e|i|u|in|un|inin|unun|ina|una|inda|unda|indaki|undaki|indan|undan|ini|unu|da|de|ta|te|dan|den|tan|ten|daki|deki|taki|teki|la|le|ya|ye|nin|nun|na|ne|nda|nde|ndaki|ndeki|ndan|nden|ni|nu|lar|ler))?";

const SOFTENING: Record<string, string> = {
  k: 'g',
  g: 'k',
  p: 'b',
  b: 'p',
  t: 'd',
  d: 't',
};

function placeWordPattern(word: string): RegExp {
  // Tamlama eki düşer: "iskelesi" → "iskele", "pazari" → "pazar", "ocagi" → "ocag"
  let stem = word;
  if (/(si|su)$/.test(stem) && stem.length - 2 >= 3) stem = stem.slice(0, -2);
  else if (/[^aeiou][iu]$/.test(stem) && stem.length - 1 >= 3)
    stem = stem.slice(0, -1);
  const last = stem.slice(-1);
  const stems = SOFTENING[last]
    ? [stem, stem.slice(0, -1) + SOFTENING[last]]
    : [stem];
  const body = `(?:${stems.join('|')})`;
  return stem.length <= 3
    ? new RegExp(`(^|[^a-z0-9])${body}${SHORT_SUFFIX}(?![a-z0-9])`)
    : new RegExp(`(^|[^a-z0-9])${body}`);
}

export function placesIn(
  text: string,
  labels: Record<string, string>,
): Set<string> {
  const folded = foldPlace(text);
  return new Set(
    Object.entries(labels)
      // "Çay Evi & Han" iki yerin adıdır; biri geçmesi yeter
      .filter(([, label]) =>
        label.split('&').some((part) => {
          const words = foldPlace(part)
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length >= 3);
          return (
            words.length > 0 &&
            words.every((w) => placeWordPattern(w).test(folded))
          );
        }),
      )
      .map(([id]) => id),
  );
}

export interface AlibiAlignInput {
  scenarioType: string;
  // Yeri doğru kabul edilen kişi ve mazereti
  anchorName: string;
  anchorAlibi: string;
  place: string;
  // Yeri farklı söyleyen eş
  partnerName: string;
  partnerAlibi: string;
  partnerClue: string;
  // Gerçek metni de eşin eski yerini anlatıyorsa onarılmazsa hakem çelişki bulur
  truthReveal: string;
}

export function buildAlibiAlignPrompt(input: AlibiAlignInput): string {
  const setting = getScenarioConfig(input.scenarioType).settingLabel;
  return `You are a continuity editor for a detective game (setting: ${setting}).

${input.anchorName} and ${input.partnerName} were together at the time of the murder, at ${input.place}. Their accounts must name the same place and the same activity, but ${input.partnerName}'s account names another place.

${input.anchorName}'s account (correct):
${input.anchorAlibi}

${input.partnerName}'s account (wrong place):
${input.partnerAlibi}

${input.partnerName}'s hidden location clue (an ordinary sign of that night):
${input.partnerClue}

TRUE STORY:
${input.truthReveal}

Rewrite:
- "alibi": ${input.partnerName}'s account in one Turkish sentence: together with ${input.anchorName} at ${input.place}, doing the same thing as in the correct account.
- "clue": the location clue with the same object and hiding spot, now showing that ${input.partnerName} spent that time at ${input.place} with ${input.anchorName}.
- "truthReveal": the true story with only the sentences about where ${input.partnerName} and ${input.anchorName} were (and their clues) changed to match. Keep everything else word for word.
Correct Turkish spelling with all special characters, and no English words.

Return only JSON: {"alibi": "...", "clue": "...", "truthReveal": "..."}`;
}

export function parseAlibiAlign(
  text: string,
): { alibi: string; clue: string; truthReveal: string } | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      alibi?: unknown;
      clue?: unknown;
      truthReveal?: unknown;
    };
    if (
      typeof parsed.alibi !== 'string' ||
      !parsed.alibi.trim() ||
      typeof parsed.clue !== 'string' ||
      !parsed.clue.trim() ||
      typeof parsed.truthReveal !== 'string' ||
      !parsed.truthReveal.trim()
    ) {
      return null;
    }
    return {
      alibi: parsed.alibi.trim(),
      clue: parsed.clue.trim(),
      truthReveal: parsed.truthReveal.trim(),
    };
  } catch {
    return null;
  }
}
