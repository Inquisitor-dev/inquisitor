// Kasaba olayları (v3, docs/v3-persona-tasarimi.md bölüm 1): personadan bağımsız, vaka başında planlanan
// ve önceden sezdirilen olaylar. İlgili NPC sorulunca ya da konu açılınca söyler, kasabalılar dedikodusunu
// yapar, bir önceki sabahın gazetesi duyurur. Şimdilik tek tür: bir dükkân sahibi bir günlüğüne şehir
// dışında, mekânı o gün kapalı. Fırtına gibi wildcard'lar aynı yapıya eklenecek.

type Rng = () => number;

export type TownEventKind = 'AWAY';

export interface TownEvent {
  kind: TownEventKind;
  // Şehir dışına çıkan şüpheli (NPC id'si aynı zamanda mekânının id'si)
  npcId: string;
  // Kasabada olmadığı gün
  day: number;
  // Gerekçe (TOWN_EVENT_REASONS içindeki sıra)
  reasonIndex: number;
}

// Vakaların yaklaşık yarısında bir kasaba olayı olur (bütün zorluklarda)
export const TOWN_EVENT_CHANCE = 0.5;

// Kapanış ilk güne ve son güne denk gelmez: ilk gün sezdirilecek zaman kalmaz, son gün hüküm günü
export const AWAY_DAYS = [2, 3];

// Şehir dışına çıkma gerekçeleri (Türkçe; NPC istemine ve gazeteye girer). Her evrende aynı iskelet,
// sözcükler evrene uyar.
export const TOWN_EVENT_REASONS: Record<string, string[]> = {
  medieval: [
    'komşu köydeki hasta kız kardeşini ziyarete gidecek',
    'kasaba pazarına mal almaya gidecek',
    'manastırdaki akrabasının cenaze törenine gidecek',
  ],
  modern: [
    'eyaletin öbür ucundaki hasta annesini ziyarete gidecek',
    "Louisville'e malzeme almaya gidecek",
    'kuzeninin düğünü için komşu kasabaya gidecek',
  ],
  cyberpunk: [
    'dış halkadaki ailesini ziyarete gidecek',
    'yedek parça almak için liman sektörüne inecek',
    'zorunlu bir şirket denetimi için merkeze çağrıldı',
  ],
  china: [
    'nehrin karşı yakasındaki köyde yaşlı annesini ziyarete gidecek',
    'başkentteki tüccardan mal almaya gidecek',
    'atalarının mezarını ziyarete gidecek',
  ],
  winter: [
    'geçidin ötesindeki çiftlikte kardeşini ziyarete gidecek',
    'aşağı kasabaya erzak almaya inecek',
    'avcılarla birlikte bir günlüğüne tuzakları kontrole gidecek',
  ],
};

export const reasonsFor = (scenarioType: string) =>
  TOWN_EVENT_REASONS[scenarioType] ?? TOWN_EVENT_REASONS.medieval;

export interface TownEventInput {
  scenarioType: string;
  suspectIds: string[];
  // Vakayı taşıyan kanıtın sahibi kapanmaz (doğrulayan kanıtın mekânı ya da tanığı)
  protectedIds: string[];
  // Aynı gün başka bir kapanış varsa (kilit kırma) o gün seçilmez
  busyDays: number[];
  busyIds: string[];
}

export function planTownEvents(
  input: TownEventInput,
  rng: Rng = Math.random,
): TownEvent[] {
  if (rng() >= TOWN_EVENT_CHANCE) return [];
  const candidates = input.suspectIds.filter(
    (id) => !input.protectedIds.includes(id) && !input.busyIds.includes(id),
  );
  const days = AWAY_DAYS.filter((d) => !input.busyDays.includes(d));
  if (candidates.length === 0 || days.length === 0) return [];
  return [
    {
      kind: 'AWAY',
      npcId: candidates[Math.floor(rng() * candidates.length)],
      day: days[Math.floor(rng() * days.length)],
      reasonIndex: Math.floor(rng() * reasonsFor(input.scenarioType).length),
    },
  ];
}

export function townEventsOf(caseFacts: unknown): TownEvent[] {
  const events = (caseFacts as { townEvents?: TownEvent[] } | null)?.townEvents;
  return Array.isArray(events) ? events : [];
}
