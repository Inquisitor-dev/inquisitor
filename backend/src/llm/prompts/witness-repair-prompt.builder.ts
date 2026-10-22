import { getScenarioConfig } from '../../scenarios/scenario-config';

// Doğrulayan tanık katili görmemiştir: ne tanıklık metni ne de tanığın rolü katilin adını söyler.
// Gemini bu kurala her zaman uymuyor (oyun testinde tanık "Kael Voss'un kabloyla çıktığını gördüm"
// dedi ve vaka tek soruyla çözüldü). Kod adı yakalarsa iki metin tek küçük çağrıyla onarılır.

export interface WitnessRepairInput {
  scenarioType: string;
  witnessName: string;
  culpritName: string;
  verificationText: string;
  npcPrompt: string;
}

export function buildWitnessRepairPrompt(input: WitnessRepairInput): string {
  const setting = getScenarioConfig(input.scenarioType).settingLabel;
  return `You are a continuity editor for a detective game (setting: ${setting}).

${input.witnessName} is a witness who saw part of the murder, but could NOT see who did it (for example «karanlıktı, kapüşonluydu, arkası dönüktü»). The texts below wrongly name ${input.culpritName}.

TESTIMONY (one sentence, a fact about what the witness saw):
${input.verificationText}

WITNESS ROLE (second person, instructions for the character):
${input.npcPrompt}

Rewrite both so that the witness only describes the act, the place, the time and the object, and refers to the person as "someone" whose face they did not see. Remove every mention of ${input.culpritName} and any hint at them (name, job, uniform, kind, looks). Keep everything else, including the witness's own secret, word for word.
Correct Turkish spelling with all special characters, and no English words.

Return only JSON: {"verificationText": "...", "npcPrompt": "..."}`;
}

export function parseWitnessRepair(
  text: string,
): { verificationText: string; npcPrompt: string } | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      verificationText?: unknown;
      npcPrompt?: unknown;
    };
    if (
      typeof parsed.verificationText !== 'string' ||
      !parsed.verificationText.trim() ||
      typeof parsed.npcPrompt !== 'string' ||
      !parsed.npcPrompt.trim()
    ) {
      return null;
    }
    return {
      verificationText: parsed.verificationText.trim(),
      npcPrompt: parsed.npcPrompt.trim(),
    };
  } catch {
    return null;
  }
}

// Masumların mekân ipuçları ve rol metinleri de katili adıyla söylememeli: silahı bilmeden verenin
// ipucu "AURA-9'a satılan enjektörün fişi" diyordu ve tek arama izni vakayı bitiriyordu. Ad geçen
// alanların hepsi tek çağrıyla onarılır; anahtarlar aynen geri döner.
export function buildLeakRepairPrompt(input: {
  scenarioType: string;
  culpritName: string;
  fields: Record<string, string>;
}): string {
  const setting = getScenarioConfig(input.scenarioType).settingLabel;
  return `You are a continuity editor for a detective game (setting: ${setting}).

These texts belong to INNOCENT characters (their hidden location clues and their role instructions). They wrongly name the murderer, ${input.culpritName}, so the player could solve the case without any reasoning.

${JSON.stringify(input.fields, null, 2)}

Rewrite each text so that it no longer names or hints at ${input.culpritName} (name, job, uniform, kind, looks). Keep its object, place, hiding spot, meaning and everything else. Where a person must appear, use an unnamed one (for example «adı yazılmamış bir alıcı», «kapüşonlu bir müşteri»). The role texts may keep everything the character really knows, only without the murderer's identity.
Correct Turkish spelling with all special characters, and no English words.

Return only JSON with exactly the same keys and the rewritten texts.`;
}

export function parseLeakRepair(
  text: string,
  keys: string[],
): Record<string, string> | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = parsed[key];
      if (typeof value !== 'string' || !value.trim()) return null;
      result[key] = value.trim();
    }
    return result;
  } catch {
    return null;
  }
}
