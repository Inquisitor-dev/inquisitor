// Gece olaylarının işlenmesi ve sabah gazetesi (v3, docs/v3-persona-tasarimi.md). Saf kod: oturum
// servisi gün kapanırken processNight'ı çağırır, sonucu GameSession.personaState'e yazar.
import type {
  PersonaActionKind,
  PersonaEvent,
  PersonaPlan,
} from '../scenarios/personas/persona-plan';
import { newspaperTextsFor } from './newspaper-texts';

export interface NewspaperItem {
  // PERSONA: katilin hamlesi; MURDER: ilk sabahın cinayet haberi; TOWN: kasabanın sıradan haberi
  kind: 'MURDER' | 'PERSONA' | 'TOWN';
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

// Defterdeki olay kartı: kanıt kaydı olarak yazılır (kategori EVENT; Kanıt Göster, pano ve Hüküm
// Dosyası'nda yer almaz)
export interface EventCardDraft {
  kind: 'EVENT';
  category: 'EVENT';
  sourceId: string;
  text: string;
}

export interface NightContext {
  scenarioType: string;
  // Gazetenin sıradan haberleri her vakada aynı sırayla gelmesin diye oturuma bağlı tohum
  seed: string;
  placeName: (locationId: string) => string;
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

// İlk sabahın gazetesi: cinayet haberi ve bir sıradan haber
export function firstMorningPaper(
  ctx: NightContext,
  victim: string,
  crimeScene: string,
): Newspaper {
  const texts = newspaperTextsFor(ctx.scenarioType);
  return {
    day: 1,
    title: texts.title,
    items: [
      { kind: 'MURDER', ...texts.murder(victim, crimeScene) },
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
        ? { kind: 'PERSONA', ...texts.breakIn(ctx.placeName(event.locationId)) }
        : null;
    default:
      // Baskın gazeteye ayrı yazılır (adım 3)
      return null;
  }
};

const EVENT_CARD_TEXT: Partial<Record<PersonaActionKind, string>> = {
  THREAT_LETTER: 'Gece kapımın altına imzasız bir tehdit mektubu bırakılmış.',
};

// Bir geceyi işler: o gecenin hamleleri gerçekleşir, ertesi sabahın gazetesi yazılır.
// Aynı gece ikinci kez işlenmez.
export function processNight(
  state: PersonaState,
  plan: PersonaPlan,
  night: number,
  ctx: NightContext,
): { state: PersonaState; happened: PersonaEvent[]; cards: EventCardDraft[] } {
  if (state.processedNights.includes(night)) {
    return { state, happened: [], cards: [] };
  }
  const happened = plan.events.filter((e) => e.night === night);
  const items = happened
    .map((e) => personaItem(e, ctx))
    .filter((i): i is NewspaperItem => !!i);
  // Olaylı sabah bir, olaysız sabah iki sıradan haber: gazete her sabah dolu gelir
  const town = townItems(
    ctx,
    night + 1,
    items.length > 0 ? 1 : 2,
    usedHeadlines(state),
  );
  const paper: Newspaper = {
    day: night + 1,
    title: newspaperTextsFor(ctx.scenarioType).title,
    items: [...items, ...town],
  };
  const cards = happened.flatMap((e): EventCardDraft[] => {
    const text = EVENT_CARD_TEXT[e.kind];
    return text
      ? [
          {
            kind: 'EVENT',
            category: 'EVENT',
            sourceId: `night-${night}-${e.kind}`,
            text,
          },
        ]
      : [];
  });
  return {
    state: {
      ...state,
      processedNights: [...state.processedNights, night],
      happened: [...state.happened, ...happened],
      papers: [...state.papers.filter((p) => p.day !== paper.day), paper],
    },
    happened,
    cards,
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
              `- In the night after day ${e.night}, someone broke into "${ctx.placeName(e.locationId)}". Nobody saw who did it.`,
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

// Katilin istemi: gece hamlelerini kendisi yaptı ama kendiliğinden açmaz
export function culpritNightLines(state: PersonaState): string[] {
  if (state.happened.length === 0) return [];
  return [
    '- You yourself did the night events listed above that someone did to the investigator or to a place in town. Never bring them up yourself and never admit them; if asked, react the way anyone else in town would.',
  ];
}
