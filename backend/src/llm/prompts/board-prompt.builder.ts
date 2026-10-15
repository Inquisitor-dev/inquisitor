import { getScenarioConfig } from '../../scenarios/scenario-config';
import type { ThoughtLine } from '../../board/board';

export function buildBoardThoughtPrompt(
  lines: ThoughtLine[],
  scenarioType: string,
): string {
  const setting = getScenarioConfig(scenarioType).settingLabel;
  const facts = lines
    .map(
      (l, i) =>
        `${i + 1}. "${l.a}" → "${l.b}": ${l.type === 'CLEARS' || l.type === 'IMPLICATES' ? `bu kanıt bu kişiyi ${l.relation}` : `bu iki kanıt birbiriyle ${l.relation}`}. ${l.verdict === 'CORRECT' ? 'Tutuyor.' : 'Tutmuyor.'}`,
    )
    .join('\n');

  return `You write the private thoughts of a detective who is investigating a murder (setting: ${setting}).
The detective is alone at night, staring at their own notes and thinking quietly. These are the hunches they are weighing; for each one you already know whether it holds up or not:
${facts}

Write what goes through the detective's head, in Turkish.
- First person, the detective talking to themselves. Short, everyday sentences. 2 to 5 sentences in total. No lists, no headings, no quotation marks.
- Sound unsure and human: use hedges such as "sanırım", "galiba", "belki de", "bence", "gibi görünüyor", "-mış gibi".
- Never use words of certainty or verdict: "kesin", "kesinlikle", "tamamen", "tamamıyla", "mutlaka", "doğru çıktı", "doğruydu", "yanlıştı", "hata yaptım", "büyük bir hata", "hamle", "iddia".
- Do not talk about a board, strings, links, claims, a game or an engine. Refer to people by name and to evidence by what it is (her itirafı, olay yerindeki iz, değirmende bulduğum şey).
- Cover every hunch above: for the ones that hold up, say it seems to fit; for the ones that do not, show doubt. You may add a vague musing about a PERSON, such as "belki başka bir şey saklıyor", but never invent a concrete new fact, never name or hint at who the murderer is, and never say what the right connection would be.
- Never question whether a piece of evidence is genuine, fake, planted or from another time. Doubt only the connection, not the evidence itself.
- Use correct Turkish spelling with all special characters.

Example of the tone (different case): Kardeş Aldric haklı gibi görünüyor, anlattıkları vergi memurları meselesiyle örtüşüyor. Ama Peder Malachar'ı aynı şeyle aklayamam sanırım. Bence onun da başka bir sırrı var.

Return only the thoughts.`;
}
