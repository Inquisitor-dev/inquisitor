// Kapalı mekânın oyuncuya söylenen gerekçesi (kasaba olayı ya da kilit kırma)
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
} from '../scenarios/scenario-config';
import { closureFor } from '../scenarios/personas/closures';

export function closedMessage(
  session: {
    scenarioType: string;
    currentDay: number;
    caseFacts: unknown;
    personaState?: unknown;
  },
  npcId: string,
): string | null {
  const closure = closureFor(
    session.caseFacts,
    session.currentDay,
    npcId,
    session.personaState,
  );
  if (!closure) return null;
  const place = getLocalizedLocationLabel(
    session.scenarioType,
    closure.locationId,
  );
  if (closure.reason === 'DETAINED') {
    return `${place} bugün kapalı: sahibi nezarette. Yarın sabah çıkacak.`;
  }
  if (closure.reason === 'BREAK_IN') {
    return `${place} bugün kapalı: gece biri zorla girmiş, sahibi ortalığı topluyor. Yarın yeniden açılacak.`;
  }
  const name =
    getScenarioConfig(session.scenarioType, 'hard').npcDefinitions.find(
      (npc) => npc.id === closure.locationId,
    )?.name ?? place;
  return `${name} bugün kasabada değil; ${place} kapalı. Yarın dönecek.`;
}
