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

${input.witnessName} is a witness who saw part of the murder, but could NOT see who did it (dark, hooded, from behind). The texts below wrongly name ${input.culpritName}.

TESTIMONY (one sentence, a fact about what the witness saw):
${input.verificationText}

WITNESS ROLE (second person, instructions for the character):
${input.npcPrompt}

Rewrite both so that the witness only describes the act, the place, the time and the object, and refers to the person as "someone" whose face they did not see. Remove every mention of ${input.culpritName} and any hint at them (name, job, uniform, kind, looks). Keep everything else, including the witness's own secret, word for word.
Correct Turkish spelling with all special characters.

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
