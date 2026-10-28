// Hüküm Dosyası: oyuncunun vakanın sonunda verdiği rapor ve sunucunun puanlaması
// (backend/src/game-sessions/verdict/verdict-report.ts ile aynı biçim)

export interface VerdictOption {
  id: string;
  label: string;
}

export interface VerdictOptions {
  suspects: { id: string; name: string; role: string }[];
  // Boş liste: vakada bu alan yok (eski vaka); form o adımı atlar
  weapons: VerdictOption[];
  motives: VerdictOption[];
  timesOfDeath: VerdictOption[];
  involvementKinds: VerdictOption[];
  limits: { evidence: number; narrative: number };
}

export interface VerdictReportInput {
  evidenceIds: string[];
  weaponId?: string;
  motive?: string;
  timeOfDeath?: string;
  involvements: Record<string, string>;
  narrative: string;
}

export type VerdictFieldId =
  | 'EVIDENCE'
  | 'WEAPON'
  | 'MOTIVE'
  | 'TIME_OF_DEATH'
  | 'INVOLVEMENTS'
  | 'NARRATIVE';

export interface VerdictFieldResult {
  id: VerdictFieldId;
  points: number;
  max: number;
  answer: string;
  truth: string;
  details?: { label: string; answer: string; truth: string; correct: boolean }[];
}

export interface ScoredVerdict {
  total: number;
  fields: VerdictFieldResult[];
  judgeComment?: string;
}

// Sonuç ekranının ihtiyaç duyduğu her şey (store'da tutulur)
export interface CaseOutcome {
  won: boolean;
  message: string;
  condemnedNpcId: string;
  culpritId: string | null;
  reward: { rewardTokens?: number; scoreEarned?: number } | null;
  verdict: ScoredVerdict | null;
}

// Sonuç ekranının çözüm yolları (backend: verdict/solution-report.ts); yalnızca vaka bitince gelir
export interface SolutionStep {
  clueId: string;
  label: string;
  how: string;
  clears: string[];
  found: boolean;
}

export interface SolutionPath {
  steps: SolutionStep[];
  conclusions: string[];
  finale: string;
  warrants: number;
  found: number;
  completed: boolean;
}

export interface SolutionReport {
  paths: SolutionPath[];
}
