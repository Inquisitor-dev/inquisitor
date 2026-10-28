// Bir gün kapalı olan mekânlar: kasaba olayı (sahibi şehir dışında), katilin kilit kırması (gece
// zorla açılan mekân ertesi gün kapalı) ya da nezaret (sahibi o günün kalanında nezarette).
// Kapalı mekâna girilemez, sahibi o gün sorgulanamaz.
import { detentionOf, effectivePersonaPlan } from './detention';
import { townEventsOf } from './town-events';
import { leftWildcardOf } from '../wildcards';

// LEFT: sahibi kasabadan temelli ayrıldı (Ayrılan Tanık wildcard'ı)
export type ClosureReason = 'AWAY' | 'BREAK_IN' | 'DETAINED' | 'LEFT';

export interface Closure {
  locationId: string;
  reason: ClosureReason;
}

export function closuresOn(
  caseFacts: unknown,
  day: number,
  personaState?: unknown,
): Closure[] {
  const closures: Closure[] = [];
  for (const event of townEventsOf(caseFacts)) {
    if (event.kind === 'AWAY' && event.day === day) {
      closures.push({ locationId: event.npcId, reason: 'AWAY' });
    }
  }
  const left = leftWildcardOf(caseFacts);
  if (left && day >= left.day) {
    closures.push({ locationId: left.npcId, reason: 'LEFT' });
  }
  const detention = detentionOf(personaState);
  if (detention?.day === day) {
    closures.push({ locationId: detention.npcId, reason: 'DETAINED' });
  }
  for (const event of effectivePersonaPlan(caseFacts, personaState).events) {
    if (
      event.kind === 'BREAK_IN' &&
      event.locationId &&
      event.night + 1 === day
    ) {
      closures.push({ locationId: event.locationId, reason: 'BREAK_IN' });
    }
  }
  return closures;
}

// Karakterin ya da anlatıcının mekânı (anlatıcı id'si "narrator_<mekân>")
export const locationOfNpc = (npcId: string) => npcId.replace(/^narrator_/, '');

export function closureFor(
  caseFacts: unknown,
  day: number,
  npcId: string,
  personaState?: unknown,
): Closure | null {
  const location = locationOfNpc(npcId);
  return (
    closuresOn(caseFacts, day, personaState).find(
      (c) => c.locationId === location,
    ) ?? null
  );
}
