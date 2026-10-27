import { getScenarioConfig } from '../../scenarios/scenario-config';
import { foldTurkish } from '../../npcs/prompt-guard';

// Çelişki Taraması (Sis Dedektifi): bir şüphelinin oyuncuya verdiği cevaplar arasındaki çelişkiler.
// Model yalnızca oyuncunun zaten duyduğu cevapları görür; gizli vaka bilgisi gönderilmez.

export interface Contradiction {
  // Cevap numaraları (1'den başlar); ikinci kontrolde tam cevaplar bunlarla bulunur
  a: number;
  b: number;
  quoteA: string;
  quoteB: string;
  note: string;
}

export const MAX_CONTRADICTIONS = 3;
// İlk tarama ikinci kontrole bundan fazla aday vermez
export const MAX_CANDIDATES = 5;
const QUOTE_LENGTH = 160;
const NOTE_LENGTH = 200;

export function buildContradictionPrompt(
  npcName: string,
  replies: string[],
  scenarioType: string,
): string {
  const setting = getScenarioConfig(scenarioType).settingLabel;
  const numbered = replies.map((reply, i) => `${i + 1}. ${reply}`).join('\n');

  return `You help a detective in a murder investigation (setting: ${setting}). Below are the answers ${npcName} gave the detective, in order:
${numbered}

Find places where ${npcName} contradicts THEIR OWN earlier words. A contradiction is two statements about the SAME person, time and event that cannot both be true: "I was alone" vs "my sister was with me", "I never left the tavern" vs "I went home before midnight", "I own no knife" vs "I sharpened my knife". Denying something and later admitting it ("why would I be at the graveyard?" vs "yes, I was at the graveyard last night") also counts.

These are NOT contradictions, never report them:
- one answer adds something the other did not mention (saying nothing about it is not denying it), or gives more detail;
- a vague or "I don't remember" answer followed by a specific one;
- events that follow each other ("I was at the tavern", "later I went home");
- statements about different times, days, places or people, or what others say or rumours;
- admitting a quarrel, a meeting or knowing someone after saying they saw nobody that night;
- figures of speech and boasts ("I only talk to the graves", "my hands know only the shovel");
- descriptions of the weather, smells or a room, and changes of mood, tone or politeness.
If you are not sure both statements cannot be true at once, leave the item out.

Return only JSON, no code fences:
{"contradictions":[{"a":1,"b":3,"quoteA":"...","quoteB":"...","fact":"...","bothTrue":false,"note":"..."}]}
- First check each candidate: "fact" names in a few English words the single fact both quotes are about (e.g. "where he was at midnight"); "bothTrue" is true if both quotes could be true at the same time. Items with "bothTrue": true are discarded, so be honest.
- "a" and "b" are the answer numbers; "quoteA" and "quoteB" are short EXACT copies of words from those answers (at most 15 words each).
- "note" is one short Turkish sentence saying what does not match, with correct Turkish characters. Never say or hint who is guilty and never add facts that are not in the answers.
- At most ${MAX_CANDIDATES} items. Most suspects do not contradict themselves; if there is no real contradiction, return {"contradictions":[]}.`;
}

const NO_CONTRADICTION =
  /celiski (yok|bulunma|tespit edilme|goru(lme|nme))|celismiyor|celismemekte/;
// Hiçbir şey öne sürmeyen kısa alıntı ("Hatırlamıyorum") bir çelişkinin tarafı olamaz
const NO_CLAIM =
  /^(hatirlamiyorum|bilmiyorum|emin degilim|bilemem|hatirlamam)\b.{0,20}$/;

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

// Modelin cevabını okur; alıntısı gerçek cevapta geçmeyen maddeleri atar (uydurma çelişki olmasın).
// Okunamayan cevapta null döner.
export function parseContradictions(
  text: string,
  replies: string[],
  limit = MAX_CONTRADICTIONS,
): Contradiction[] | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const items = (parsed as { contradictions?: unknown }).contradictions;
  if (!Array.isArray(items)) return null;

  // Modelin eklediği tırnak ve üç noktalar karşılaştırmaya katılmaz
  const normalize = (s: string) =>
    foldTurkish(s)
      .replace(/^[\s"“”'«»]+|[\s"“”'«».…]+$/g, '')
      .replace(/\s+/g, ' ');
  const quoted = (index: unknown, quote: unknown) =>
    Number.isInteger(index) &&
    typeof quote === 'string' &&
    quote.trim().length > 0 &&
    normalize(replies[(index as number) - 1] ?? '').includes(normalize(quote));

  const result: Contradiction[] = [];
  for (const raw of items as Record<string, unknown>[]) {
    if (!raw || typeof raw !== 'object' || raw.a === raw.b) continue;
    if (!quoted(raw.a, raw.quoteA) || !quoted(raw.b, raw.quoteB)) continue;
    if (
      NO_CLAIM.test(normalize(raw.quoteA as string)) ||
      NO_CLAIM.test(normalize(raw.quoteB as string))
    ) {
      continue;
    }
    if (typeof raw.note !== 'string' || !raw.note.trim()) continue;
    // Modelin kendi kontrolü: iki söz aynı anda doğru olabiliyorsa çelişki değil
    if (raw.bothTrue !== false) continue;
    // Model ara sıra "çelişki yok" diyen bir madde de yazıyor
    if (NO_CONTRADICTION.test(foldTurkish(raw.note))) continue;
    result.push({
      a: raw.a as number,
      b: raw.b as number,
      quoteA: clip((raw.quoteA as string).trim(), QUOTE_LENGTH),
      quoteB: clip((raw.quoteB as string).trim(), QUOTE_LENGTH),
      note: clip(raw.note.trim(), NOTE_LENGTH),
    });
    if (result.length === limit) break;
  }
  return result;
}

const ANSWER_LENGTH = 600;

// İkinci kontrol: her aday, iki tam cevapla birlikte ayrı ayrı sorulur. Tek çağrıda hem bulup hem
// elemek flash-lite modeline zor geliyor; ölçümde yanlış alarmların çoğu ("kimseyi görmedim" /
// "onunla tartışmıştık") bu soruda düşüyor.
export function buildContradictionCheckPrompt(
  npcName: string,
  replies: string[],
  candidates: Contradiction[],
): string {
  const answer = (n: number) => clip(replies[n - 1] ?? '', ANSWER_LENGTH);
  const items = candidates
    .map(
      (c, i) =>
        `${i + 1}. Answer A: "${answer(c.a)}"\n   Answer B: "${answer(c.b)}"\n   Claimed mismatch: ${c.note}`,
    )
    .join('\n');

  return `A tool flagged these pairs of answers ${npcName} gave a detective as possible contradictions. Check each pair on its own.
${items}

For each pair decide: could a person truthfully say BOTH answers about the same night? Read the whole answers, not only the claimed mismatch.
- Both can be true: one adds detail or something the other did not mention, a vague answer followed by a specific one, events that follow each other, different times, places or people, what others say, figures of speech, mood.
- Both cannot be true: they give different places, times, people, objects or actions for the same moment, or one denies what the other admits.

Return only JSON, no code fences: {"verdicts":[{"item":1,"bothTrue":true}]}`;
}

// İkinci kontrolün cevabı: tutulacak adaylar (bothTrue: false olanlar). Okunamayan cevapta null.
export function parseContradictionCheck(
  text: string,
  candidates: Contradiction[],
): Contradiction[] | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const verdicts = (parsed as { verdicts?: unknown }).verdicts;
  if (!Array.isArray(verdicts)) return null;
  const kept = new Set<number>();
  for (const v of verdicts as Record<string, unknown>[]) {
    if (v && Number.isInteger(v.item) && v.bothTrue === false) {
      kept.add(v.item as number);
    }
  }
  return candidates
    .filter((_, i) => kept.has(i + 1))
    .slice(0, MAX_CONTRADICTIONS);
}
