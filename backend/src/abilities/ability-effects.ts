import { FEAR_BREAK_THRESHOLD } from '../npcs/fear';
import { CaseFacts } from '../scenarios/case-setup';
import { AbilityState } from './abilities';

// Derin Tefekkür (Ak Turna): panoda günde 2 kez düşünülür, diğerlerinde 1
export const DEEP_REFLECTION_THOUGHTS = 2;

export const thoughtLimit = (characterId: string) =>
  characterId === 'ak_turna' ? DEEP_REFLECTION_THOUGHTS : 1;

// O gün panoda kaç kez düşünüldü
export const thoughtsToday = (
  state: AbilityState,
  boardThoughtDay: number,
  day: number,
) =>
  state.thoughts?.day === day
    ? state.thoughts.count
    : boardThoughtDay === day
      ? 1
      : 0;

export const canThinkAgain = (
  characterId: string,
  state: AbilityState,
  boardThoughtDay: number,
  day: number,
) => thoughtsToday(state, boardThoughtDay, day) < thoughtLimit(characterId);

// Rüya Tabiri (Kar Kâhini): etki o gün sürer
export const isDreamActive = (state: AbilityState, day: number) =>
  state.dreamDay === day;

// Yeteneklerin saf hesapları; veritabanına AbilitiesService ve ilgili servisler yazar.

// Sabır (Engizitör): her oyun gününün ilk 3 mesajı günlük soru hakkından düşmez
export const PATIENCE_FREE_MESSAGES = 3;

// Bu mesaj gönderilmeden önce o gün atılmış mesaj sayısına göre mesaj ücretsiz mi
export const isFreeMessage = (characterId: string, sentToday: number) =>
  characterId === 'engizitor' && sentToday < PATIENCE_FREE_MESSAGES;

// O gün soru hakkından düşen mesaj sayısı
export const chargedMessages = (characterId: string, sentToday: number) =>
  characterId === 'engizitor'
    ? Math.max(0, sentToday - PATIENCE_FREE_MESSAGES)
    : sentToday;

// Tehdit (Kara Yargıç): korku 2 artar ama tek başına itiraf eşiğine ulaşamaz. Eşik karakterin
// mizacına göre değişir (npcs/fear.ts fearThresholdOf); tavan her zaman eşiğin bir altıdır.
export const THREAT_GAIN = 2;
export const THREAT_CAP = FEAR_BREAK_THRESHOLD - 1;

export const threatenedFear = (
  current: number,
  threshold: number = FEAR_BREAK_THRESHOLD,
) => Math.max(current, Math.min(threshold - 1, current + THREAT_GAIN));

// Vizör Kilidi (Mavi Rozet): kilitli şüphelinin korkusu gece azalmaz
export const fearAfterNight = (
  npcId: string,
  fear: number,
  state: AbilityState,
) => (state.visorLockNpcId === npcId ? fear : Math.max(0, fear - 1));

// Çatı Geçişi'nin bedeli: o günün sabah dilimi kaybedilir
export const morningTimeOfDay = (state: AbilityState, day: number) =>
  state.lostMorningDay === day ? 1 : 0;

// Sessiz Oda (Gölge Ajan): o gün seçilen şüpheli daha doğrudan konuşur
export const isQuietRoom = (state: AbilityState, npcId: string, day: number) =>
  state.quietRoom?.npcId === npcId && state.quietRoom.day === day;

// Çatı Geçişi'yle o gece girilen mekâna tekrar girilebilir
export const rooftopLocation = (state: AbilityState, day: number) =>
  state.rooftop?.day === day ? state.rooftop.locationId : null;

// Nabız (Mavi Rozet): şüphelilerin korkusu ve itiraf eşiğine kalan puan
// thresholds: şüphelilerin mizaca göre itiraf eşikleri (verilmeyen 7 sayılır)
export function pulseReport(
  suspectIds: string[],
  fears: { npcId: string; currentFear: number }[],
  thresholds: Record<string, number> = {},
) {
  return suspectIds.map((npcId) => {
    const level = fears.find((f) => f.npcId === npcId)?.currentFear ?? 0;
    const threshold = thresholds[npcId] ?? FEAR_BREAK_THRESHOLD;
    return {
      npcId,
      level,
      toThreshold: Math.max(0, threshold - level),
    };
  });
}

// Arşiv Özeti (Engizitör Hanım): şüphelinin son 3 cevabı
export const ARCHIVE_QUOTES = 3;
const QUOTE_LENGTH = 240;

export function archiveQuotes(replies: string[]): string[] {
  return replies
    .map((reply) => reply.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(-ARCHIVE_QUOTES)
    .map((reply) =>
      reply.length > QUOTE_LENGTH ? `${reply.slice(0, QUOTE_LENGTH)}…` : reply,
    );
}

// Muhbir (Şehir Dedektifi): aranmamış bir mekânın adı. Doğrulayan kanıt bir mekândaysa ve
// o mekân henüz aranmadıysa orası söylenir; yoksa aranmamış mekânlardan biri.
export function informantLocation(params: {
  locationIds: string[];
  searched: Set<string>;
  caseFacts: Pick<CaseFacts, 'verification'> | null;
  verificationFound: boolean;
  rng?: () => number;
}): string | null {
  const { locationIds, searched, caseFacts, verificationFound } = params;
  const unsearched = locationIds.filter(
    (id) => id !== 'crime_scene' && !searched.has(id),
  );
  if (unsearched.length === 0) return null;

  const placement = caseFacts?.verification?.placement;
  if (
    placement?.type === 'LOCATION' &&
    !verificationFound &&
    unsearched.includes(placement.locationId)
  ) {
    return placement.locationId;
  }
  const rng = params.rng ?? Math.random;
  return unsearched[Math.floor(rng() * unsearched.length)];
}
