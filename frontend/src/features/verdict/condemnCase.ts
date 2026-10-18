import { api } from '@/shared/api/client';
import { useGameStore } from '@/store/useGameStore';
import type { CaseOutcome, ScoredVerdict, VerdictReportInput } from './verdictTypes';

export interface CondemnResponse {
  session?: {
    truthReveal?: string;
    locationClues?: Record<string, string>;
    lastDay?: number;
    timeOfDay?: number;
  };
  won?: boolean;
  // İkinci Nefes (Yeşim Hekim): yanlış hüküm vakayı bitirmez
  spared?: boolean;
  clearedNpcId?: string;
  culpritId?: string;
  message?: string;
  reward?: { rewardTokens?: number; scoreEarned?: number } | null;
  verdict?: ScoredVerdict | null;
}

export function condemnCase(sessionId: string, npcId: string, report?: VerdictReportInput) {
  return api.post<CondemnResponse>(`/game-sessions/${sessionId}/condemn`, {
    npcId,
    ...(report ? { report } : {}),
  });
}

// Vaka bitti: gerçeği ve raporun puanını store'a yazar, sonuç ekranının adresini döner
export function finishCase(data: CondemnResponse, condemnedNpcId: string): string {
  const store = useGameStore.getState();
  if (data.session?.truthReveal) store.setTruthReveal(data.session.truthReveal);
  if (data.session?.locationClues) store.setLocationClues(data.session.locationClues);
  const outcome: CaseOutcome = {
    won: !!data.won,
    message: data.message ?? '',
    condemnedNpcId,
    culpritId: data.culpritId ?? null,
    reward: data.reward ?? null,
    verdict: data.verdict ?? null,
  };
  store.setCaseOutcome(outcome);
  const reward = data.reward;
  const params = new URLSearchParams({ won: String(outcome.won), message: outcome.message });
  if (reward?.rewardTokens) params.set('rewardTokens', String(reward.rewardTokens));
  if (reward?.scoreEarned) params.set('scoreEarned', String(reward.scoreEarned));
  return `/result?${params.toString()}`;
}
