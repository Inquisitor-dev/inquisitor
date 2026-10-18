import type { CaseFacts } from '../../scenarios/case-setup';
import {
  INVOLVEMENT_LABELS,
  InvolvementKind,
  MOTIVE_LABELS,
  MOTIVES,
  MotiveId,
  TIME_OF_DEATH_LABELS,
  TIMES_OF_DEATH,
  TimeOfDeath,
  WEAPONS,
} from '../../scenarios/case-catalog';
import { normalizeScenarioType } from '../../scenarios/scenario-config';
import { judgeSuspectLink } from '../../board/domain/board-judge';
import type { BoardEvidence } from '../../board/domain/board.types';

// Hüküm Dosyası: oyuncu vakanın sonunda yalnızca katili değil, olayın tamamını raporlar.
// Katil kazanıp kaybetmeyi belirler; raporun geri kalanı 0–100 puan verir ve ödülü ölçekler.
// Alanların hepsi vaka gerçeklerinin kimlikleriyle (id) karşılaştırılır; yalnızca "olay nasıl
// gerçekleşti" metnini yapay zekâ hakem puanlar.

export const MAX_REPORT_EVIDENCE = 5;
export const MAX_NARRATIVE_LENGTH = 1500;

export interface VerdictReport {
  // Dayanak kanıtlar: oyuncunun katili gösterdiğini düşündüğü Evidence id'leri
  evidenceIds?: string[];
  weaponId?: string;
  motive?: MotiveId;
  timeOfDeath?: TimeOfDeath;
  // Her masum için oyuncunun tahmini: cinayetle bağı neydi (InvolvementKind; bilinmeyen değer boş sayılır)
  involvements?: Record<string, string>;
  narrative?: string;
}

export type VerdictFieldId =
  | 'EVIDENCE'
  | 'WEAPON'
  | 'MOTIVE'
  | 'TIME_OF_DEATH'
  | 'INVOLVEMENTS'
  | 'NARRATIVE';

// Alanların ağırlığı (toplam 100). Vakada karşılığı olmayan alan (ör. silahı olmayan eski vaka)
// puanlamaya katılmaz, kalanlar 100'e ölçeklenir.
export const FIELD_WEIGHTS: Record<VerdictFieldId, number> = {
  EVIDENCE: 20,
  WEAPON: 15,
  MOTIVE: 15,
  TIME_OF_DEATH: 10,
  INVOLVEMENTS: 20,
  NARRATIVE: 20,
};

export interface VerdictFieldResult {
  id: VerdictFieldId;
  // Ağırlığı içinde alınan puan
  points: number;
  max: number;
  // Oyuncunun cevabı ve gerçek, ekranda yan yana gösterilecek metin
  answer: string;
  truth: string;
  // Masumlar ve kanıtlar için satır satır döküm
  details?: {
    label: string;
    answer: string;
    truth: string;
    correct: boolean;
  }[];
}

export interface ScoredVerdict {
  // 0–100; vakada karşılığı olan alanların ağırlıklarına göre ölçeklenir
  total: number;
  fields: VerdictFieldResult[];
  judgeComment?: string;
}

const NOT_ANSWERED = 'Boş bıraktın';

// Bir kanıt katili gösterme yolunda işe yarar mı: katili işaret eder, bir masumu aklar,
// silah zincirinin parçasıdır (beden) ya da motifi söyler (son konuşma)
export function isSupportingEvidence(
  e: BoardEvidence,
  facts: CaseFacts,
): boolean {
  // Tuzak iz katili değil, suçlanmak istenen masumu gösterir: hükmün dayanağı olamaz
  if (
    e.kind === 'CLUE' &&
    e.sourceId === 'crime_scene' &&
    facts.crimeSceneClue.authentic === false
  )
    return false;
  if (judgeSuspectLink('IMPLICATES', facts.culpritId, e, facts) === 'CORRECT')
    return true;
  if (
    facts.innocentIds.some(
      (id) => judgeSuspectLink('CLEARS', id, e, facts) === 'CORRECT',
    )
  )
    return true;
  // Katilin mekân ipucu motifini gösterir (panoda kimseyi suçlamasa da hükmün dayanağıdır)
  if (e.kind === 'CLUE' && e.sourceId === facts.culpritId) return true;
  const involvements = facts.involvements ?? [];
  if (e.kind === 'BODY')
    return involvements.some((i) => i.kind === 'UNWITTING_HELP');
  if (e.kind === 'TESTIMONY')
    return involvements.some(
      (i) => i.npcId === e.sourceId && i.kind === 'LAST_CONVERSATION',
    );
  return false;
}

export interface ScoreVerdictInput {
  facts: CaseFacts;
  scenarioType: string;
  report: VerdictReport;
  // Oyuncunun bu vakada bulduğu kanıtlar
  evidence: BoardEvidence[];
  nameOf: (npcId: string) => string;
  // Yapay zekâ hakemin olay anlatımına verdiği puan (0–1); null: anlatım yok ya da hakem çalışmadı
  narrativeScore: number | null;
  judgeComment?: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function scoreVerdict({
  facts,
  scenarioType,
  report,
  evidence,
  nameOf,
  narrativeScore,
  judgeComment,
}: ScoreVerdictInput): ScoredVerdict {
  const fields: { result: VerdictFieldResult; share: number }[] = [];
  const add = (
    id: VerdictFieldId,
    share: number,
    answer: string,
    truth: string,
    details?: VerdictFieldResult['details'],
  ) =>
    fields.push({
      share: clamp01(share),
      result: {
        id,
        points: 0,
        max: FIELD_WEIGHTS[id],
        answer,
        truth,
        details,
      },
    });

  // Dayanak kanıtlar: katili gösteren kanıtlardan en fazla 3'ünü bulmak tam puan; ilgisiz her seçim
  // yarım doğru kadar götürür. Oyuncunun bulmadığı kanıt seçilemez.
  const owned = new Map(evidence.map((e) => [e.id, e]));
  const picked = [...new Set(report.evidenceIds ?? [])]
    .map((id) => owned.get(id))
    .filter((e): e is BoardEvidence => !!e)
    .slice(0, MAX_REPORT_EVIDENCE);
  const supportingOwned = evidence.filter((e) =>
    isSupportingEvidence(e, facts),
  );
  if (supportingOwned.length > 0) {
    const good = picked.filter((e) => isSupportingEvidence(e, facts)).length;
    const bad = picked.length - good;
    const target = Math.min(3, supportingOwned.length);
    add(
      'EVIDENCE',
      (good - bad * 0.5) / target,
      picked.length > 0
        ? `${picked.length} kanıt seçtin, ${good} tanesi katile giden yolda işe yarıyor`
        : NOT_ANSWERED,
      `Bulduğun ${supportingOwned.length} kanıt katile giden yolda işe yarıyordu`,
      picked.map((e) => {
        const correct = isSupportingEvidence(e, facts);
        return {
          label: e.text,
          answer: 'Dayanak',
          truth: correct ? 'Dayanak' : 'İlgisiz',
          correct,
        };
      }),
    );
  }

  const weapons = WEAPONS[normalizeScenarioType(scenarioType)];
  const weapon = weapons.find((w) => w.id === facts.weaponId);
  if (weapon) {
    const answered = weapons.find((w) => w.id === report.weaponId);
    add(
      'WEAPON',
      answered?.id === weapon.id ? 1 : 0,
      answered?.label ?? NOT_ANSWERED,
      weapon.label,
    );
  }

  if (facts.motive) {
    const answered = MOTIVES.includes(report.motive as MotiveId)
      ? report.motive
      : undefined;
    add(
      'MOTIVE',
      answered === facts.motive ? 1 : 0,
      answered ? MOTIVE_LABELS[answered] : NOT_ANSWERED,
      MOTIVE_LABELS[facts.motive],
    );
  }

  if (facts.timeOfDeath) {
    const answered = TIMES_OF_DEATH.includes(report.timeOfDeath as TimeOfDeath)
      ? report.timeOfDeath
      : undefined;
    add(
      'TIME_OF_DEATH',
      answered === facts.timeOfDeath ? 1 : 0,
      answered ? TIME_OF_DEATH_LABELS[answered] : NOT_ANSWERED,
      TIME_OF_DEATH_LABELS[facts.timeOfDeath],
    );
  }

  const involvements = facts.involvements ?? [];
  if (involvements.length > 0) {
    const details = involvements.map((inv) => {
      const raw = report.involvements?.[inv.npcId];
      const answer =
        raw && raw in INVOLVEMENT_LABELS ? (raw as InvolvementKind) : null;
      return {
        label: nameOf(inv.npcId),
        answer: answer ? INVOLVEMENT_LABELS[answer] : NOT_ANSWERED,
        truth: INVOLVEMENT_LABELS[inv.kind],
        correct: answer === inv.kind,
      };
    });
    const correct = details.filter((d) => d.correct).length;
    add(
      'INVOLVEMENTS',
      correct / details.length,
      `${details.length} kişiden ${correct} tanesini doğru bildin`,
      'Her masumun cinayetle bağı',
      details,
    );
  }

  const narrative = report.narrative?.trim() ?? '';
  if (narrativeScore !== null || narrative.length === 0) {
    add(
      'NARRATIVE',
      narrative.length === 0 ? 0 : (narrativeScore ?? 0),
      narrative.length > 0 ? narrative : NOT_ANSWERED,
      'Olayın gerçek akışı aşağıda',
    );
  }

  // Vakada karşılığı olan alanların ağırlıkları 100'e ölçeklenir
  const weightSum = fields.reduce((sum, f) => sum + f.result.max, 0);
  const scale = weightSum > 0 ? 100 / weightSum : 0;
  for (const f of fields) {
    f.result.max = Math.round(f.result.max * scale);
    f.result.points = Math.round(f.result.max * f.share);
  }
  const total = Math.min(
    100,
    fields.reduce((sum, f) => sum + f.result.points, 0),
  );

  return {
    total,
    fields: fields.map((f) => f.result),
    ...(judgeComment ? { judgeComment } : {}),
  };
}

// Ödül çarpanı: doğru katille boş rapor bile ödülün yarısını alır, tam rapor ödülün tamamını
export function rewardMultiplier(total: number): number {
  return 0.5 + 0.5 * clamp01(total / 100);
}

// Hakeme giden gerçekler: koddaki kimliklerin Türkçe karşılıkları
export function verdictFactLines(
  facts: CaseFacts,
  scenarioType: string,
  nameOf: (npcId: string) => string,
): string[] {
  const weapon = WEAPONS[normalizeScenarioType(scenarioType)].find(
    (w) => w.id === facts.weaponId,
  );
  const lines = [
    `Katil: ${nameOf(facts.culpritId)}`,
    `Kurban: ${facts.victim.name} (${facts.victim.profession})`,
  ];
  if (weapon) lines.push(`Cinayet aleti: ${weapon.label}`);
  if (facts.motive) lines.push(`Motif: ${MOTIVE_LABELS[facts.motive]}`);
  if (facts.timeOfDeath)
    lines.push(`Ölüm saati: ${TIME_OF_DEATH_LABELS[facts.timeOfDeath]}`);
  lines.push(
    facts.murderStyle === 'PLANNED'
      ? 'Cinayet planlıydı; olay yerindeki iz başkasını suçlamak için konmuştu.'
      : 'Cinayet aceleyle işlendi; olay yerindeki iz gerçekti.',
  );
  for (const inv of facts.involvements ?? []) {
    lines.push(
      `${nameOf(inv.npcId)}: ${INVOLVEMENT_LABELS[inv.kind]}${
        facts.alibis?.[inv.npcId] ? ` (${facts.alibis[inv.npcId]})` : ''
      }`,
    );
  }
  return lines;
}

// Test modunda (yapay zekâsız) hakem: anlatımda katilin adı, aleti ve motifi geçiyor mu
export function templateJudgement(
  facts: CaseFacts,
  scenarioType: string,
  nameOf: (npcId: string) => string,
  narrative: string,
): { score: number; comment: string } {
  const text = narrative.toLocaleLowerCase('tr-TR');
  const has = (label: string | undefined) =>
    !!label &&
    label
      .toLocaleLowerCase('tr-TR')
      .split(/[^\p{L}]+/u)
      .some((w) => w.length >= 4 && text.includes(w));
  const weapon = WEAPONS[normalizeScenarioType(scenarioType)].find(
    (w) => w.id === facts.weaponId,
  );
  const hits = [
    has(nameOf(facts.culpritId)),
    has(weapon?.label),
    has(facts.motive ? MOTIVE_LABELS[facts.motive] : undefined),
  ].filter(Boolean).length;
  return {
    score: hits / 3,
    comment: `[Test Hakemi] Anlatımında katil, alet ve motiften ${hits} tanesi geçiyor.`,
  };
}
