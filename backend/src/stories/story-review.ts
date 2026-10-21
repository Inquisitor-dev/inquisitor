import type { CaseFacts } from '../scenarios/case-setup';
import {
  INVOLVEMENT_LABELS,
  MOTIVES,
  TEMPERAMENT_THRESHOLD,
  TIMES_OF_DEATH,
} from '../scenarios/case-catalog';
import { foldTurkish } from '../npcs/prompt-guard';

// Hikâye hakemi: havuza girecek bir vakanın metinlerini onaydan önce denetler. Kesin kurallar
// (katilin ipucunda kan/silah, tuzak izin herkesi göstermesi, adıyla sızıntı, masum eşlerin yeri)
// üretim sırasında kodla onarılır (llm.service.ts repair*). Burada ikisi kalır: kodla bedavaya
// bulunabilen iç kimlikler ve yalnızca okuyarak görülebilen serbest metin kaymaları (yapay zekâ hakemi).

export type StoryIssueCategory =
  | 'TRUTH' // gerçek metni mazeretlerle ya da ipuçlarıyla çelişiyor
  | 'ROLE' // rol metninde yanlış talimat (itiraf et) ya da yanlış bilgi (alıcıyı bilmiyor)
  | 'IMPLICIT_LEAK' // adı geçmeden katili tek başına işaret eden tarif
  | 'LANGUAGE' // İngilizce kelime, yazım hatası, iç kimlik
  | 'LOGIC'; // yara ile silah, saatler ile ölüm saati uyuşmuyor

export const STORY_ISSUE_CATEGORIES: StoryIssueCategory[] = [
  'TRUTH',
  'ROLE',
  'IMPLICIT_LEAK',
  'LANGUAGE',
  'LOGIC',
];

// CERTAIN: metinden alıntıyla gösterilebilen kesin hata; DOUBT: insanın bakması gereken şüphe
export type StoryIssueSeverity = 'CERTAIN' | 'DOUBT';

export interface StoryIssue {
  category: StoryIssueCategory;
  severity: StoryIssueSeverity;
  // Metnin alan anahtarı (storyReviewFields): "truthReveal", "npcPrompts.mill" gibi
  field: string;
  // Alandan birebir alıntı
  quote: string;
  note: string;
  source: 'CODE' | 'JUDGE';
}

// PASS: havuza girebilir; REJECT: kesin hata var; HUMAN: şüphe var ya da hakem çalışmadı
export type StoryVerdict = 'PASS' | 'REJECT' | 'HUMAN';

// Hakemin okuduğu vaka: kodun planı (CaseFacts) ve yapay zekânın yazdığı metinler
export interface StoryReviewInput {
  scenarioType: string;
  facts: CaseFacts;
  scenario: string;
  truthReveal: string;
  npcPrompts: Record<string, string>;
  locationClues: Record<string, string>;
}

export interface StoryReviewResult {
  verdict: StoryVerdict;
  issues: StoryIssue[];
  // Yapay zekâ hakemi çalıştı mı (test modunda ya da hata olunca false)
  judged: boolean;
}

// Hakem metinleri okuyup alıntıyla hata gösterir; çalışmazsa null
export type StoryJudge = (
  input: StoryReviewInput,
  fields: Record<string, string>,
) => Promise<StoryIssue[] | null>;

// Denetlenen bütün metinler, alan anahtarıyla. Hakemin alıntıları bu metinlerde aranır.
export function storyReviewFields(
  input: StoryReviewInput,
): Record<string, string> {
  const { facts } = input;
  const fields: Record<string, string> = {
    scenario: input.scenario,
    truthReveal: input.truthReveal,
    verificationText: facts.verificationText,
  };
  if (facts.witnessDescription)
    fields.witnessDescription = facts.witnessDescription;
  for (const [id, text] of Object.entries(facts.alibis ?? {}))
    fields[`alibis.${id}`] = text;
  for (const [id, text] of Object.entries(input.npcPrompts ?? {}))
    fields[`npcPrompts.${id}`] = text;
  for (const [id, text] of Object.entries(input.locationClues ?? {}))
    fields[`locationClues.${id}`] = text;
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, text]) => typeof text === 'string' && text.trim(),
    ),
  );
}

// Oyuncuya görünmemesi gereken iç kimlikler: mekân/NPC id'leri (büyük-küçük harf fark etmez),
// snake_case kimlikler (crime_scene, kitchen_knife, ipucu id'leri) ve koddaki sabit adlar
const LOCATION_ID_PATTERN = /\b(tavern|church|graveyard|mill|farm|clinic)\b/gi;
const SNAKE_CASE_PATTERN = /\b[a-z]+(?:_[a-z]+)+\b/g;
const ENUM_IDS = [
  'HURRIED',
  'PLANNED',
  'MESSY',
  'TIDY',
  'CORROBORATION',
  'FLAW',
  'TESTIMONY',
  ...MOTIVES,
  ...TIMES_OF_DEATH,
  ...Object.keys(INVOLVEMENT_LABELS),
  ...Object.keys(TEMPERAMENT_THRESHOLD),
];
const ENUM_ID_PATTERN = new RegExp(`\\b(${ENUM_IDS.join('|')})\\b`, 'g');

export function findInternalIds(fields: Record<string, string>): StoryIssue[] {
  const issues: StoryIssue[] = [];
  for (const [field, text] of Object.entries(fields)) {
    const found = new Set([
      ...(text.match(LOCATION_ID_PATTERN) ?? []),
      ...(text.match(SNAKE_CASE_PATTERN) ?? []),
      ...(text.match(ENUM_ID_PATTERN) ?? []),
    ]);
    for (const id of found) {
      issues.push({
        category: 'LANGUAGE',
        severity: 'CERTAIN',
        field,
        quote: id,
        note: `Metinde iç kimlik ya da İngilizce mekân adı geçiyor: "${id}".`,
        source: 'CODE',
      });
    }
  }
  return issues;
}

// Modelin eklediği tırnak, üç nokta ve boşluk farkları karşılaştırmaya katılmaz
const normalizeQuote = (text: string) =>
  foldTurkish(text)
    .replace(/^[\s"“”'«»]+|[\s"“”'«».…]+$/g, '')
    .replace(/\s+/g, ' ');

// Alıntı gerçekten o alanın metninde geçiyor mu (uydurma bulgu olmasın)
export const quoteIn = (text: string, quote: string) => {
  const needle = normalizeQuote(quote);
  return needle.length > 0 && normalizeQuote(text).includes(needle);
};

// Karar koddan: kesin hata varsa red, şüphe varsa ya da hakem çalışmadıysa insana, yoksa geçer
export function decideStoryReview(
  issues: StoryIssue[],
  judged: boolean,
): StoryVerdict {
  if (issues.some((issue) => issue.severity === 'CERTAIN')) return 'REJECT';
  if (!judged || issues.length > 0) return 'HUMAN';
  return 'PASS';
}

// Kod kontrolü her zaman çalışır; hakem verilmezse (test modu) ya da başarısız olursa karar insana kalır
export async function reviewStory(
  input: StoryReviewInput,
  judge: StoryJudge | null,
): Promise<StoryReviewResult> {
  const fields = storyReviewFields(input);
  const codeIssues = findInternalIds(fields);
  const judgeIssues = judge ? await judge(input, fields) : null;
  const issues = [...codeIssues, ...(judgeIssues ?? [])];
  const judged = judgeIssues !== null;
  return { verdict: decideStoryReview(issues, judged), issues, judged };
}
