// Nezaret (v3, docs/v3-persona-tasarimi.md bölüm 5): oyuncu vakada bir kez bir şüpheliyi bir geceliğine
// nezarete aldırır. Kişinin mekânı günün kalanında kapanır, ertesi sabah çıkar. Katilse o gecenin hamlesi
// iptal olmaz, sonraki uygun geceye kayar: "o gece olay olmadı" çıkarımı bulanıklaşsın.
import {
  LAST_ACTION_NIGHT,
  PERSONA_POOLS,
  personaPlanOf,
  type PersonaPlan,
} from './persona-plan';

export interface Detention {
  npcId: string;
  // Nezarete alındığı gün (o gecenin sabahı çıkar)
  day: number;
}

export function detentionOf(personaState: unknown): Detention | null {
  const d = (personaState as { detention?: Detention } | null)?.detention;
  return d && typeof d.npcId === 'string' && typeof d.day === 'number'
    ? d
    : null;
}

// Nezaretin hesaba katıldığı gece planı: katil nezaretteyse o gecenin hamleleri, kendi gece aralıklarında
// boş bir sonraki geceye kayar; yer yoksa o hamle hiç olmaz.
export function effectivePersonaPlan(
  caseFacts: unknown,
  personaState: unknown,
): PersonaPlan {
  const plan = personaPlanOf(caseFacts);
  const detention = detentionOf(personaState);
  const culpritId = (caseFacts as { culpritId?: string } | null)?.culpritId;
  if (!detention || plan.persona === 'NONE' || detention.npcId !== culpritId) {
    return plan;
  }
  const pool = PERSONA_POOLS[plan.persona];
  const taken = new Set(
    plan.events.filter((e) => e.night !== detention.day).map((e) => e.night),
  );
  const events = plan.events.flatMap((e) => {
    if (e.night !== detention.day) return [e];
    const last = Math.min(
      pool.find((a) => a.kind === e.kind)?.nights[1] ?? LAST_ACTION_NIGHT,
      LAST_ACTION_NIGHT,
    );
    for (let night = e.night + 1; night <= last; night++) {
      if (!taken.has(night)) {
        taken.add(night);
        return [{ ...e, night }];
      }
    }
    return [];
  });
  return { ...plan, events: events.sort((a, b) => a.night - b.night) };
}
