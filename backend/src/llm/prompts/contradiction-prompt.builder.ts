import { getScenarioConfig } from '../../scenarios/scenario-config';
import { foldTurkish } from '../../npcs/prompt-guard';

// Çelişki Taraması (Sis Dedektifi): bir şüphelinin oyuncuya verdiği cevaplar arasındaki çelişkiler.
// Model yalnızca oyuncunun zaten duyduğu cevapları görür; gizli vaka bilgisi gönderilmez.

export interface Contradiction {
  quoteA: string;
  quoteB: string;
  note: string;
}

export const MAX_CONTRADICTIONS = 3;
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

Find places where ${npcName} contradicts THEIR OWN earlier words: different times, places, people, objects or actions for the same event. Ignore changes of mood, tone or politeness, and ignore things that are merely vague.

Return only JSON, no code fences:
{"contradictions":[{"a":1,"b":3,"quoteA":"...","quoteB":"...","note":"..."}]}
- "a" and "b" are the answer numbers; "quoteA" and "quoteB" are short EXACT copies of words from those answers (at most 15 words each).
- "note" is one short Turkish sentence saying what does not match, with correct Turkish characters. Never say or hint who is guilty and never add facts that are not in the answers.
- At most ${MAX_CONTRADICTIONS} items. If there is no real contradiction, return {"contradictions":[]}.`;
}

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

// Modelin cevabını okur; alıntısı gerçek cevapta geçmeyen maddeleri atar (uydurma çelişki olmasın).
// Okunamayan cevapta null döner.
export function parseContradictions(
  text: string,
  replies: string[],
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
    if (typeof raw.note !== 'string' || !raw.note.trim()) continue;
    result.push({
      quoteA: clip((raw.quoteA as string).trim(), QUOTE_LENGTH),
      quoteB: clip((raw.quoteB as string).trim(), QUOTE_LENGTH),
      note: clip(raw.note.trim(), NOTE_LENGTH),
    });
    if (result.length === MAX_CONTRADICTIONS) break;
  }
  return result;
}
