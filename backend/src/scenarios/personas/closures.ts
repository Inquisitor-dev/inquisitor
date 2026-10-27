// Bir gün kapalı olan mekânlar: kasaba olayı (sahibi şehir dışında) ya da katilin kilit kırması (gece
// zorla açılan mekân ertesi gün kapalı). Kapalı mekâna girilemez, sahibi o gün sorgulanamaz.
import { personaPlanOf } from './persona-plan';
import { townEventsOf } from './town-events';

export type ClosureReason = 'AWAY' | 'BREAK_IN';

export interface Closure {
  locationId: string;
  reason: ClosureReason;
}

export function closuresOn(caseFacts: unknown, day: number): Closure[] {
  const closures: Closure[] = [];
  for (const event of townEventsOf(caseFacts)) {
    if (event.kind === 'AWAY' && event.day === day) {
      closures.push({ locationId: event.npcId, reason: 'AWAY' });
    }
  }
  for (const event of personaPlanOf(caseFacts).events) {
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
): Closure | null {
  const location = locationOfNpc(npcId);
  return (
    closuresOn(caseFacts, day).find((c) => c.locationId === location) ?? null
  );
}
