// Gece olaylarının işlenmesi ve sabah gazetesi (v3, docs/v3-persona-tasarimi.md). Saf kod: oturum
// servisi gün kapanırken processNight'ı çağırır, sonucu GameSession.personaState'e yazar.
import type {
  PersonaEvent,
  PersonaPlan,
} from '../scenarios/personas/persona-plan';
import { reasonsFor, type TownEvent } from '../scenarios/personas/town-events';
import { newspaperTextsFor } from './newspaper-texts';
import type { RaidOutcome, RaidState } from './raid-engine';
import type { Detention } from '../scenarios/personas/detention';

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

// SEARCHED: oyuncu o gece Çatı Geçişi'yle dışarıdaydı; baskın olmadı, evi aranmış buldu
export type RaidRecordOutcome = RaidOutcome | 'SEARCHED';

export interface RaidRecord {
  night: number;
  state: RaidState;
  // Oyuncuya anlatılanlar (sırayla)
  log: string[];
  outcome: RaidRecordOutcome | null;
}

export interface PersonaState {
  version: 1;
  // İşlenmiş geceler: aynı gece iki kez işlenmesin
  processedNights: number[];
  // Gerçekleşen hamleler (kasabada herkes duyar)
  happened: PersonaEvent[];
  papers: Newspaper[];
  // Gece baskını (sürerken outcome null; bitmeden ertesi gün başlamaz)
  raid?: RaidRecord;
  // Baskının kötü sonucu: bu vakanın ödülünden kesinti (0–1) ve çalınan kanıtlar
  rewardPenalty?: number;
  stolenEvidenceIds?: string[];
  // Nezaret (vakada bir kez): kimi, hangi gün
  detention?: Detention;
}

// Gecenin bıraktığı kayıtlar. EVENT: defterdeki olay kartı (Kanıt Göster, pano ve Hüküm Dosyası'nda
// yer almaz). LETTER: kapının altındaki mektup, envantere düşen gerçek bir kanıt (izi birkaç kişiye uyar).
export interface NightRecordDraft {
  kind: 'EVENT' | 'LETTER' | 'RAID_TRACE';
  category: 'EVENT' | 'ITEM';
  sourceId: string;
  text: string;
}

// Vakanın gece planı: persona, kasaba olayları ve (varsa) mektubun metni
export interface NightPlan {
  persona: PersonaPlan;
  townEvents: TownEvent[];
  letter?: { text: string; trace: string };
  // Baskının sonucu ve kapı önünde kalan izin metni (iyi sonuçta)
  raid?: { outcome: RaidRecordOutcome; trace: string };
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
    ...(s.raid ? { raid: s.raid } : {}),
    ...(s.rewardPenalty ? { rewardPenalty: s.rewardPenalty } : {}),
    ...(Array.isArray(s.stolenEvidenceIds)
      ? { stolenEvidenceIds: s.stolenEvidenceIds }
      : {}),
    ...(s.detention ? { detention: s.detention } : {}),
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
  plan: NightPlan,
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
    case 'RAID':
      return raidPaperItem(plan.raid?.outcome, ctx);
    default:
      return null;
  }
};

// Tamlayan eki: "Engizitörün", "dedektifin", "müfettişin"
const genitive = (word: string) => {
  const vowel = [...word].reverse().find((c) => 'aeıioöuü'.includes(c));
  const suffix =
    vowel === 'ö' || vowel === 'ü'
      ? 'ün'
      : vowel === 'o' || vowel === 'u'
        ? 'un'
        : vowel === 'a' || vowel === 'ı'
          ? 'ın'
          : 'in';
  return `${word}${suffix}`;
};

// Baskının gazete haberi sonuca göre
function raidPaperItem(
  outcome: RaidRecordOutcome | undefined,
  ctx: NightContext,
): NewspaperItem {
  const who = genitive(newspaperTextsFor(ctx.scenarioType).investigator);
  const Who = who.charAt(0).toLocaleUpperCase('tr-TR') + who.slice(1);
  switch (outcome) {
    case 'GOOD':
      return {
        kind: 'PERSONA',
        headline: `${Who} evine gece baskın`,
        body: `Gece ${who} evine biri girdi. Fark edilince kaçtı; kapı önünde bir iz bıraktı.`,
      };
    case 'SEARCHED':
      return {
        kind: 'PERSONA',
        headline: `${Who} evi aranmış`,
        body: `${Who.replace(/(ün|un|ın|in)$/, '')} gece evde yokken evine biri girip her yeri karıştırdı. Bir şey alınmamış.`,
      };
    case 'BAD':
      return {
        kind: 'PERSONA',
        headline: `${Who.replace(/(ün|un|ın|in)$/, '')} evinde baygın bulundu`,
        body: `Gece ${who} evine giren biri onu bayıltıp evini aradı. Neyin alındığı bilinmiyor.`,
      };
    default:
      return {
        kind: 'PERSONA',
        headline: `${Who} evinde gece ayak sesleri`,
        body: `Gece ${who} evine biri girdi ve karanlıkta sessizce çıkıp gitti. Kim olduğunu gören yok.`,
      };
  }
}

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
          text: `İmzasız tehdit mektubu: “${plan.letter.text}” İz: ${plan.letter.trace}.`,
        });
      }
      return records;
    }
    case 'BREAK_IN':
      return event.locationId
        ? [
            card(
              `${ctx.placeName(event.locationId)}: gece biri zorla girmiş. Sahibi bugün kimseyi kabul etmiyor.`,
            ),
          ]
        : [];
    case 'RAID': {
      const outcome = plan.raid?.outcome;
      const records = [
        card(
          outcome === 'GOOD'
            ? 'Gece evime biri girdi. Hazır olduğumu fark edince kaçtı; kapı önünde bir iz bıraktı.'
            : outcome === 'SEARCHED'
              ? 'Ben dışarıdayken evime biri girmiş; her yer karıştırılmış ama bir şey alınmamış.'
              : outcome === 'BAD'
                ? 'Gece evime biri girdi. Beni bayılttı ve evi aradı.'
                : 'Gece evime biri girdi ve karanlıkta sessizce çıkıp gitti.',
        ),
      ];
      if (outcome === 'GOOD' && plan.raid) {
        records.push({
          kind: 'RAID_TRACE',
          category: 'ITEM',
          sourceId: 'home',
          text: `Kaçan saldırganın kapı önünde düşürdüğü buruşuk bir kâğıt parçası. İz: ${plan.raid.trace}.`,
        });
      }
      return records;
    }
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
      .map((e) => personaItem(e, ctx, plan))
      .filter((i): i is NewspaperItem => !!i),
    ...detentionNotice(state, night, ctx),
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

// Nezaret kasabada duyulur: ertesi sabahın gazetesi yazar
function detentionNotice(
  state: PersonaState,
  night: number,
  ctx: NightContext,
): NewspaperItem[] {
  if (state.detention?.day !== night) return [];
  const name = ctx.npcName(state.detention.npcId);
  return [
    {
      kind: 'NOTICE',
      headline: `${name} bir gece nezarette kaldı`,
      body: `${name} soruşturma sırasında bir geceliğine nezarete alındı ve sabah serbest bırakıldı.`,
    },
  ];
}

// Nezaret: kasaba duyar; kişi ertesi gün kırgındır (bildiği değişmez)
export function detentionPromptLines(
  state: PersonaState,
  day: number,
  npcId: string,
  ctx: Pick<NightContext, 'npcName'>,
): string[] {
  const d = state.detention;
  if (!d || day <= d.day) return [];
  if (d.npcId === npcId) {
    return [
      day === d.day + 1
        ? '- Yesterday the Inquisitor had you held overnight; you were released this morning. You are resentful, curt and cold with them today, but it changes nothing about what you know or how fear works on you.'
        : '- A few nights ago the Inquisitor had you held overnight. You have not forgotten it.',
    ];
  }
  return [
    `- The whole town knows the Inquisitor had ${ctx.npcName(d.npcId)} held overnight ${day === d.day + 1 ? 'last night' : 'a few nights ago'}.`,
  ];
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
  // Gün numarası yerine göreli zaman: Gemini denemesinde "In the night after day 2" yazınca
  // hancı "ikinci günün gecesinde" diye sayaç diliyle konuştu
  const when = (night: number) =>
    day - night <= 1
      ? 'Last night'
      : day - night === 2
        ? 'Two nights ago'
        : 'A few nights ago';
  const lines = state.happened.flatMap((e) => {
    switch (e.kind) {
      case 'THREAT_LETTER':
        return [
          `- ${when(e.night)}, someone slipped an unsigned threatening letter under the ${investigator}'s door. The whole town, you included, has heard about it; if asked, say you heard of it. Nobody knows who wrote it.`,
        ];
      case 'BREAK_IN':
        return e.locationId
          ? [
              `- ${when(e.night)}, someone broke into "${ctx.placeName(e.locationId)}"${day === e.night + 1 ? '; it is closed today' : '; it stayed closed the next day'}. The whole town, you included, has heard about it; if asked what is new, mention it. Nobody saw who did it.`,
            ]
          : [];
      case 'RAID':
        return [
          `- ${when(e.night)}, someone broke into the ${investigator}'s own home. The whole town, you included, has heard about it; if asked, say you heard of it. Nobody knows who it was.`,
        ];
      default:
        return [];
    }
  });
  const paper = paperForDay(state, day);
  const town = paper?.items.filter((i) => i.kind === 'TOWN') ?? [];
  if (town.length > 0) {
    lines.push(
      // Gemini denemesinde "kasabada ne konuşuluyor" sorusuna şüpheliler yalnızca bu küçük haberi
      // anlatıp "başka büyük bir laf yok" dedi; cinayeti ve gecenin olayını hiç anmadı
      `- Today's town paper also reports: ${town.map((i) => `"${i.headline}" (${i.body})`).join('; ')}. These are small matters. Do not bring them up yourself. If the Inquisitor asks what is new or what people are talking about, the murder${lines.length > 0 ? ' and the night events above are' : ' is'} what the whole town talks about first; add the paper's small news only after that, if at all.`,
    );
  }
  return lines;
}

// Kasaba olayları önceden sezilir: ötekiler şehir dışına çıkacak kişinin dedikodusunu duymuştur
// (NPC istemi, İngilizce; gerekçe Türkçe). Kişinin kendisi programını ownPlanLines ile bilir.
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
    // Gün numarası yerine göreli zaman: Gemini denemesinde "3. gün gideceksin, bugün 2. gün" yazınca
    // karakter "yarın buradayım" dedi ve kasabalı "üçüncü gün" diye sayaç diliyle konuştu
    const when = relativeDay(e.day - day);
    // Kişinin kendi programı ayrı bir bölümdür (ownPlanLines)
    if (e.npcId === npcId) return [];
    if (day <= e.day) {
      return [
        `- Word in town: ${ctx.npcName(e.npcId)} ${day === e.day ? 'is out of town today' : `will be out of town ${when}`} (in Turkish: "${reason}"), so "${place}" ${day === e.day ? 'is closed today' : `will be closed ${when}`}. You may mention it if it comes up (say "yarın" or "öbür gün", never a day number${day === e.day ? '; the reason is written as a plan, say it in the present or past tense: "pazara gitti"' : ''}).`,
      ];
    }
    return [];
  });
}

// Şehir dışına çıkacak kişinin kendi programı. İstemin sonunda ayrı bir bölüm olarak verilir: "kasabada
// herkesin bildikleri" arasına gömüldüğünde rahip, "beni her zaman kilisede bulursunuz" kişiliğine uyup
// tam ertesi gün şehir dışındayken "yarın buradayım" dedi.
export function ownPlanLines(
  townEvents: TownEvent[],
  day: number,
  npcId: string,
  ctx: Pick<NightContext, 'scenarioType' | 'placeName'>,
): string[] {
  return townEvents.flatMap((e): string[] => {
    if (e.kind !== 'AWAY' || e.npcId !== npcId) return [];
    const reason = reasonOf(e, ctx.scenarioType);
    const place = ctx.placeName(e.npcId);
    const diff = e.day - day;
    if (diff === 1) {
      return [
        `- TOMORROW you will be out of town for the whole day (in Turkish: "${reason}"), so "${place}" will be closed tomorrow. If the Inquisitor asks whether they can find you tomorrow or says they will come back tomorrow, the answer is NO: tell them you will be away tomorrow and why, and that you are back the day after. Say "yarın", never a day number.`,
      ];
    }
    if (diff > 1) {
      return [
        `- THE DAY AFTER TOMORROW you will be out of town for the whole day (in Turkish: "${reason}"), so "${place}" will be closed that day. Tomorrow you are here as usual. If the Inquisitor says they will come back later, asks about your plans, or the topic comes up, tell them naturally. Say "öbür gün", never a day number.`,
      ];
    }
    if (diff < 0) {
      return [
        `- ${diff === -1 ? 'Yesterday' : 'A few days ago'} you were out of town for the whole day (in Turkish: "${reason}"; it is past now, say it in the past tense) and then came back. Mention it if asked where you were.`,
      ];
    }
    return [];
  });
}

const relativeDay = (diff: number) =>
  diff <= 0 ? 'today' : diff === 1 ? 'tomorrow' : 'the day after tomorrow';

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
