// Gece olaylarının işlenmesi ve sabah gazetesi (v3, docs/v3-persona-tasarimi.md). Saf kod: oturum
// servisi gün kapanırken processNight'ı çağırır, sonucu GameSession.personaState'e yazar.
import type {
  PersonaEvent,
  PersonaPlan,
} from '../scenarios/personas/persona-plan';
import { reasonsFor, type TownEvent } from '../scenarios/personas/town-events';
import { newspaperTextsFor } from './newspaper-texts';

export interface NewspaperItem {
  // MURDER: ilk sabahın cinayet haberi; PERSONA: katilin hamlesi; NOTICE: kasaba olayının duyurusu
  // (yarın / bugün kapalı); TOWN: kasabanın sıradan haberi
  kind: 'MURDER' | 'PERSONA' | 'NOTICE' | 'TOWN';
  headline: string;
  body: string;
}

export interface Newspaper {
  // Gazetenin geldiği sabah (oyun günü)
  day: number;
  title: string;
  items: NewspaperItem[];
}

export interface PersonaState {
  version: 1;
  // İşlenmiş geceler: aynı gece iki kez işlenmesin
  processedNights: number[];
  // Gerçekleşen hamleler (kasabada herkes duyar)
  happened: PersonaEvent[];
  papers: Newspaper[];
}

// Gecenin bıraktığı kayıtlar. EVENT: defterdeki olay kartı (Kanıt Göster, pano ve Hüküm Dosyası'nda
// yer almaz). LETTER: kapının altındaki mektup, envantere düşen gerçek bir kanıt (izi birkaç kişiye uyar).
export interface NightRecordDraft {
  kind: 'EVENT' | 'LETTER';
  category: 'EVENT' | 'ITEM';
  sourceId: string;
  text: string;
}

// Vakanın gece planı: persona, kasaba olayları ve (varsa) mektubun metni
export interface NightPlan {
  persona: PersonaPlan;
  townEvents: TownEvent[];
  letter?: { text: string; trace: string };
}

export interface NightContext {
  scenarioType: string;
  // Gazetenin sıradan haberleri her vakada aynı sırayla gelmesin diye oturuma bağlı tohum
  seed: string;
  placeName: (locationId: string) => string;
  npcName: (npcId: string) => string;
}

export const emptyPersonaState = (): PersonaState => ({
  version: 1,
  processedNights: [],
  happened: [],
  papers: [],
});

export function parsePersonaState(raw: unknown): PersonaState {
  const s = raw as Partial<PersonaState> | null;
  if (!s || s.version !== 1) return emptyPersonaState();
  return {
    version: 1,
    processedNights: Array.isArray(s.processedNights) ? s.processedNights : [],
    happened: Array.isArray(s.happened) ? s.happened : [],
    papers: Array.isArray(s.papers) ? s.papers : [],
  };
}

// Tohumdan sayı: aynı oturumun aynı sabahı hep aynı haberleri verir
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// O sabahın sıradan haberleri: vaka boyunca aynı haber mümkünse iki kez çıkmaz; havuz biterse
// (uzun ve olaysız vaka) eskiler yeniden kullanılır, gazete boş gelmesin
function townItems(
  ctx: NightContext,
  day: number,
  count: number,
  used: Set<string>,
): NewspaperItem[] {
  const all = newspaperTextsFor(ctx.scenarioType).fillers;
  const unused = all.filter((f) => !used.has(f.headline));
  const fillers = unused.length >= count ? unused : [...all];
  const items: NewspaperItem[] = [];
  let h = hash(`${ctx.seed}:${day}`);
  while (items.length < count && fillers.length > 0) {
    const [f] = fillers.splice(h % fillers.length, 1);
    items.push({ kind: 'TOWN', ...f });
    h = hash(`${h}`);
  }
  return items;
}

const usedHeadlines = (state: PersonaState) =>
  new Set(state.papers.flatMap((p) => p.items.map((i) => i.headline)));

const reasonOf = (event: TownEvent, scenarioType: string) => {
  const reasons = reasonsFor(scenarioType);
  return reasons[event.reasonIndex % reasons.length];
};

// Kasaba olaylarının duyurusu: bir gün önceden "yarın kapalı", o gün "bugün kapalı"
function townNotices(
  townEvents: TownEvent[],
  day: number,
  ctx: NightContext,
): NewspaperItem[] {
  return townEvents.flatMap((e): NewspaperItem[] => {
    if (e.kind !== 'AWAY') return [];
    const place = ctx.placeName(e.npcId);
    const name = ctx.npcName(e.npcId);
    if (e.day === day + 1) {
      return [
        {
          kind: 'NOTICE',
          headline: `Yarın ${place} kapalı`,
          body: `${name} ${reasonOf(e, ctx.scenarioType)}; ${place} yarın bütün gün kapalı kalacak.`,
        },
      ];
    }
    if (e.day === day) {
      return [
        {
          kind: 'NOTICE',
          headline: `${place} bugün kapalı`,
          body: `${name} bugün kasabada değil; ${place} yarın yeniden açılacak.`,
        },
      ];
    }
    return [];
  });
}

// Gazetenin sıradan haberleri, öbür haberlerle birlikte en az iki haber olacak kadar (en az bir)
function paperFor(
  day: number,
  lead: NewspaperItem[],
  state: PersonaState,
  ctx: NightContext,
): Newspaper {
  const count = Math.max(1, 2 - lead.length);
  return {
    day,
    title: newspaperTextsFor(ctx.scenarioType).title,
    items: [...lead, ...townItems(ctx, day, count, usedHeadlines(state))],
  };
}

// İlk sabahın gazetesi: cinayet haberi, varsa yarınki kapanışın duyurusu ve bir sıradan haber
export function firstMorningPaper(
  ctx: NightContext,
  victim: string,
  crimeScene: string,
  townEvents: TownEvent[] = [],
): Newspaper {
  const texts = newspaperTextsFor(ctx.scenarioType);
  return {
    day: 1,
    title: texts.title,
    items: [
      { kind: 'MURDER', ...texts.murder(victim, crimeScene) },
      ...townNotices(townEvents, 1, ctx),
      ...townItems(ctx, 1, 1, new Set()),
    ],
  };
}

const personaItem = (
  event: PersonaEvent,
  ctx: NightContext,
): NewspaperItem | null => {
  const texts = newspaperTextsFor(ctx.scenarioType);
  switch (event.kind) {
    case 'THREAT_LETTER':
      return { kind: 'PERSONA', ...texts.letter };
    case 'BREAK_IN':
      return event.locationId
        ? {
            kind: 'PERSONA',
            ...texts.breakIn(ctx.placeName(event.locationId)),
          }
        : null;
    default:
      // Baskın gazeteye ayrı yazılır (adım 3)
      return null;
  }
};

// Gecenin defter kartı ve (mektupta) envantere düşen kanıt
function nightRecords(
  event: PersonaEvent,
  night: number,
  plan: NightPlan,
  ctx: NightContext,
): NightRecordDraft[] {
  const card = (text: string): NightRecordDraft => ({
    kind: 'EVENT',
    category: 'EVENT',
    sourceId: `night-${night}-${event.kind}`,
    text,
  });
  switch (event.kind) {
    case 'THREAT_LETTER': {
      const records = [
        card('Gece kapımın altına imzasız bir tehdit mektubu bırakılmış.'),
      ];
      if (plan.letter) {
        records.push({
          kind: 'LETTER',
          category: 'ITEM',
          sourceId: 'home',
          text: `İmzasız tehdit mektubu: “${plan.letter.text}” Kâğıtta ${plan.letter.trace}.`,
        });
      }
      return records;
    }
    case 'BREAK_IN':
      return event.locationId
        ? [
            card(
              `Gece ${ctx.placeName(event.locationId)} zorla açılmış. Sahibi bugün kapıyı kapalı tutuyor.`,
            ),
          ]
        : [];
    default:
      return [];
  }
}

// Bir geceyi işler: o gecenin hamleleri gerçekleşir, ertesi sabahın gazetesi yazılır.
// Aynı gece ikinci kez işlenmez.
export function processNight(
  state: PersonaState,
  plan: NightPlan,
  night: number,
  ctx: NightContext,
): {
  state: PersonaState;
  happened: PersonaEvent[];
  records: NightRecordDraft[];
} {
  if (state.processedNights.includes(night)) {
    return { state, happened: [], records: [] };
  }
  const day = night + 1;
  const happened = plan.persona.events.filter((e) => e.night === night);
  const lead = [
    ...happened
      .map((e) => personaItem(e, ctx))
      .filter((i): i is NewspaperItem => !!i),
    ...townNotices(plan.townEvents, day, ctx),
  ];
  const paper = paperFor(day, lead, state, ctx);
  return {
    state: {
      ...state,
      processedNights: [...state.processedNights, night],
      happened: [...state.happened, ...happened],
      papers: [...state.papers.filter((p) => p.day !== paper.day), paper],
    },
    happened,
    records: happened.flatMap((e) => nightRecords(e, night, plan, ctx)),
  };
}

// O sabahın gazetesi (yoksa null)
export const paperForDay = (state: PersonaState, day: number) =>
  state.papers.find((p) => p.day === day) ?? null;

// Kasabada herkesin bildiği gece olayları ve bugünün gazetesi (NPC istemi, İngilizce)
export function publicNightLines(
  state: PersonaState,
  day: number,
  ctx: Pick<NightContext, 'scenarioType' | 'placeName'>,
): string[] {
  const investigator = newspaperTextsFor(ctx.scenarioType).investigator;
  const lines = state.happened.flatMap((e) => {
    switch (e.kind) {
      case 'THREAT_LETTER':
        return [
          `- In the night after day ${e.night}, someone slipped an unsigned threatening letter under the ${investigator}'s door. The whole town has heard about it; nobody knows who wrote it.`,
        ];
      case 'BREAK_IN':
        return e.locationId
          ? [
              `- In the night after day ${e.night}, someone broke into "${ctx.placeName(e.locationId)}". It stayed closed the next day. Nobody saw who did it.`,
            ]
          : [];
      default:
        return [];
    }
  });
  const paper = paperForDay(state, day);
  const town = paper?.items.filter((i) => i.kind === 'TOWN') ?? [];
  if (town.length > 0) {
    lines.push(
      `- Today's town paper also reports: ${town.map((i) => `"${i.headline}" (${i.body})`).join('; ')}. You may chat about this if it comes up.`,
    );
  }
  return lines;
}

// Kasaba olayları önceden sezilir: şehir dışına çıkacak kişi planını bilir ve sorulunca ya da konu
// açılınca söyler; ötekiler dedikodusunu duymuştur (NPC istemi, İngilizce; gerekçe Türkçe)
export function townPromptLines(
  townEvents: TownEvent[],
  day: number,
  npcId: string,
  ctx: Pick<NightContext, 'scenarioType' | 'placeName' | 'npcName'>,
): string[] {
  return townEvents.flatMap((e): string[] => {
    if (e.kind !== 'AWAY') return [];
    const reason = reasonOf(e, ctx.scenarioType);
    const place = ctx.placeName(e.npcId);
    if (e.npcId === npcId) {
      if (day < e.day) {
        return [
          `- YOUR PLANS: on day ${e.day} you will be out of town for the whole day (in Turkish: "${reason}"), so "${place}" will be closed that day. Today is day ${day}. If the Inquisitor says they will come back later or tomorrow, asks about your plans, or the topic comes up, tell them naturally in your own words. It has nothing to do with the murder.`,
        ];
      }
      if (day > e.day) {
        return [
          `- On day ${e.day} you were out of town for the whole day (in Turkish: "${reason}") and came back the next morning. Mention it if asked where you were.`,
        ];
      }
      return [];
    }
    if (day <= e.day) {
      return [
        `- Word in town: ${ctx.npcName(e.npcId)} ${day === e.day ? 'is out of town today' : `will be out of town on day ${e.day}`} (in Turkish: "${reason}"), so "${place}" ${day === e.day ? 'is' : 'will be'} closed that day. You may mention it if it comes up.`,
      ];
    }
    return [];
  });
}

// Kilit kırılan mekânın sahibi ertesi gün ne olduğunu anlatır. Katilin kendi mekânıysa bunu kendisi
// düzenlemiştir ve bir kurban gibi anlatır.
export function breakInOwnerLines(
  state: PersonaState,
  npcId: string,
  isCulprit: boolean,
): string[] {
  return state.happened
    .filter((e) => e.kind === 'BREAK_IN' && e.locationId === npcId)
    .map((e) =>
      isCulprit
        ? `- In the night after day ${e.night} you broke into your own place yourself so that you would look like a victim. Tell it exactly the way a shocked victim would: the door was forced, things were scattered, you do not know who did it.`
        : `- In the night after day ${e.night} someone broke into your place: the door was forced and your things were scattered, nothing important seems missing. You do not know who did it and it frightened you. You kept the place closed the next day to set it right. Tell it if asked.`,
    );
}

// Katilin istemi: gece hamlelerini kendisi yaptı ama kendiliğinden açmaz
export function culpritNightLines(state: PersonaState): string[] {
  if (state.happened.length === 0) return [];
  return [
    '- You yourself did the night events listed above that someone did to the investigator or to a place in town. Never bring them up yourself and never admit them; if asked, react the way anyone else in town would.',
  ];
}
