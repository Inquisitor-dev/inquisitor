import type { CaseFacts, CasePlan } from '../scenarios/case-setup';
import type { ScenarioDraft } from '../llm/prompts/scenario-prompt.builder';

// Vaka gerçekleri: kodun planı + yapay zekânın yazdığı ayrıntılar. Kanıt Defteri ve
// Hüküm Dosyası bu kayda göre çalışır; aktif oturumda oyuncuya gönderilmez.
// Oturum açılırken ve hikâye hakemi denemesinde (prisma/story-review.ts) aynı biçimde kurulur.
export function buildCaseFacts(
  plan: CasePlan,
  draft: ScenarioDraft,
): CaseFacts {
  return {
    ...plan,
    version: 1,
    crimeSceneClueText:
      draft.locationClues?.crime_scene ??
      plan.crimeSceneClue.poolClueText ??
      '',
    verificationText: draft.verificationText ?? '',
    victim: draft.victim ?? { name: '', profession: '' },
    alibis: Object.fromEntries(
      plan.innocentIds.map((id) => [id, draft.alibis?.[id] ?? '']),
    ),
    witnessDescription: draft.witnessDescription,
    culpritCover: draft.culpritCover,
    threatLetter: draft.threatLetter,
  };
}
