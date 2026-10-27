// Katil personaları (v3, docs/v3-persona-tasarimi.md). Vaka başında kod, katilin personasını ve gece
// hamlelerini seçer. Personaların sabit bir sırası yoktur: her personanın bir aksiyon havuzu vardır ve her
// aksiyonun olabileceği geceler tanımlıdır. Vaka başında havuzdan 1–3 aksiyon çekilir, bazı geceler boş
// geçer; böylece ne katil ne de persona her vakada aynı davranır. Oyuncu personayı bilmez.

type Rng = () => number;

export type PersonaId = 'NONE' | 'PSYCHOPATH';

export type PersonaActionKind = 'THREAT_LETTER' | 'BREAK_IN' | 'RAID';

export interface PersonaEvent {
  // Hamlenin yapıldığı gece: N. günün gecesi (sabahı N+1. gün)
  night: number;
  kind: PersonaActionKind;
  // Mekâna yönelik hamlelerde hedef mekân (kundaklama / kilit kırma)
  locationId?: string;
}

export interface PersonaPlan {
  persona: PersonaId;
  events: PersonaEvent[];
}

interface ActionDef {
  kind: PersonaActionKind;
  // Olabileceği ilk ve son gece (ikisi dahil)
  nights: [number, number];
  // Motoru hazır olmayan aksiyonlar havuzda tanımlıdır ama çekilmez
  enabled: boolean;
}

// Dört günlük vakada geceler 1.–3. günlerin gecesidir; son günün gecesi yoktur, hüküm verilir.
// İkinci Nefes'in eklediği 4. gece de son gece sayılır: hamle olmaz.
export const LAST_ACTION_NIGHT = 3;

// Bir vakada çekilen aksiyon sayısı
export const MIN_ACTIONS = 1;
export const MAX_ACTIONS = 3;

// Personalı vaka oranı: kolayda yok, ortada ve zorda yarı yarıya
export const PERSONA_CHANCE: Record<string, number> = {
  easy: 0,
  medium: 0.5,
  hard: 0.5,
};

// Tehdit mektubu baskından önce gelir; kapanan mekân son güne denk gelmez (en geç 2. gece → 3. gün)
export const PERSONA_POOLS: Record<Exclude<PersonaId, 'NONE'>, ActionDef[]> = {
  PSYCHOPATH: [
    { kind: 'THREAT_LETTER', nights: [1, 2], enabled: true },
    // Adım 2'de (mekânın gerçekten kapanması) açılacak
    { kind: 'BREAK_IN', nights: [1, 2], enabled: false },
    // Adım 3'te (baskın motoru) açılacak
    { kind: 'RAID', nights: [2, 3], enabled: false },
  ],
};

const PERSONAS = Object.keys(PERSONA_POOLS) as Exclude<PersonaId, 'NONE'>[];

const pick = <T>(items: T[], rng: Rng): T =>
  items[Math.floor(rng() * items.length)];

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Aksiyonları ayrı gecelere yerleştirir (her aksiyon kendi gece aralığında); olmazsa null
function assignNights(
  actions: ActionDef[],
  rng: Rng,
  taken: Set<number> = new Set(),
): number[] | null {
  if (actions.length === 0) return [];
  const [first, ...rest] = actions;
  const [from, to] = first.nights;
  const nights = shuffle(
    Array.from({ length: to - from + 1 }, (_, i) => from + i).filter(
      (n) => n <= LAST_ACTION_NIGHT && !taken.has(n),
    ),
    rng,
  );
  for (const night of nights) {
    const next = new Set(taken).add(night);
    const others = assignNights(rest, rng, next);
    if (others) return [night, ...others];
  }
  return null;
}

export interface PersonaPlanInput {
  // Mekâna yönelik hamlelerin hedef olabileceği mekânlar (şüphelilerin mekânları)
  suspectLocationIds: string[];
}

// Vakanın personasını ve gece planını seçer. Sıradan katilde (NONE) gece olayı yoktur.
export function planPersona(
  difficulty: string,
  input: PersonaPlanInput,
  rng: Rng = Math.random,
): PersonaPlan {
  const chance = PERSONA_CHANCE[difficulty] ?? 0;
  if (chance <= 0 || rng() >= chance) return { persona: 'NONE', events: [] };

  const persona = pick(PERSONAS, rng);
  const pool = PERSONA_POOLS[persona].filter((a) => a.enabled);
  const upper = Math.min(MAX_ACTIONS, pool.length);
  const count = MIN_ACTIONS + Math.floor(rng() * (upper - MIN_ACTIONS + 1));

  // Çekilen aksiyonlar ayrı gecelere sığmazsa bir eksiğiyle yeniden denenir
  for (let n = count; n >= MIN_ACTIONS; n--) {
    const chosen = shuffle(pool, rng).slice(0, n);
    const nights = assignNights(chosen, rng);
    if (!nights) continue;
    const events = chosen
      .map((action, i): PersonaEvent => {
        const event: PersonaEvent = { night: nights[i], kind: action.kind };
        if (action.kind === 'BREAK_IN' && input.suspectLocationIds.length > 0) {
          event.locationId = pick(input.suspectLocationIds, rng);
        }
        return event;
      })
      .sort((a, b) => a.night - b.night);
    return { persona, events };
  }
  return { persona, events: [] };
}

// Eski vakalarda persona yoktur
export function personaPlanOf(caseFacts: unknown): PersonaPlan {
  const plan = (caseFacts as { persona?: PersonaPlan } | null)?.persona;
  return plan && Array.isArray(plan.events)
    ? plan
    : { persona: 'NONE', events: [] };
}
