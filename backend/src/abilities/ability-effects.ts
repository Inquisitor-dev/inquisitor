import { FEAR_BREAK_THRESHOLD } from '../npcs/fear';
import { linkStatements, mentions } from '../npcs/case-statements';
import type { CaseFacts } from '../scenarios/case-setup';
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

// Hakkında Söylenenler (Engizitör Hanım): öteki şüphelilerin bir kişi hakkında oyuncuya söyledikleri.
// Yalnızca oyuncunun duyduğu cevaplara bakar; kişinin adının geçtiği cümleler alıntılanır. Eskiden
// "Arşiv Özeti" bir şüphelinin son 3 cevabını kopyalıyordu; konuşma geçmişi zaten açılabildiği için
// yeni bir şey vermiyordu.
export const ABOUT_QUOTES = 6;
const QUOTE_LENGTH = 240;

export function quotesAbout(
  replies: { npcId: string; message: string }[],
  targetName: string,
): { npcId: string; quote: string }[] {
  const seen = new Set<string>();
  const quotes: { npcId: string; quote: string }[] = [];
  for (const reply of replies) {
    const sentences = reply.message
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?…])\s+/);
    for (const sentence of sentences) {
      if (!mentions(sentence, targetName) || seen.has(sentence)) continue;
      seen.add(sentence);
      quotes.push({
        npcId: reply.npcId,
        quote:
          sentence.length > QUOTE_LENGTH
            ? `${sentence.slice(0, QUOTE_LENGTH)}…`
            : sentence,
      });
    }
  }
  return quotes.slice(-ABOUT_QUOTES);
}

// Muhbir (Şehir Dedektifi): aranmamış mekânlardan rastgele birinin adı. Vaka gerçeklerine
// bakılmaz: doğrulayan kanıt çoğu vakada katilin kendi mekânındadır, orayı söylemek katili
// ele verirdi. Her aranmamış mekânda bir ipucu olduğu için söylenen yer yine işe yarar.
export function informantLocation(params: {
  locationIds: string[];
  searched: Set<string>;
  rng?: () => number;
}): string | null {
  const { locationIds, searched } = params;
  const unsearched = locationIds.filter(
    (id) => id !== 'crime_scene' && !searched.has(id),
  );
  if (unsearched.length === 0) return null;
  const rng = params.rng ?? Math.random;
  return unsearched[Math.floor(rng() * unsearched.length)];
}

// Rüya Tabiri (Kar Kâhini): vakada henüz deftere girmemiş bir ifade kaldı mı? Rüya o gün ifadesi olan
// herkesi konuşturur: doğrulayan tanık, kısmi tanık, son konuşan, mazeret doğrulayan. Eskiden yalnızca
// doğrulayan tanığı konuşturuyordu; o gün kimse anlatmazsa oyuncu doğrulayan kanıtın bir mekânda
// (çoğu vakada katilinkinde) olduğunu öğreniyordu.
export function hasUntoldStatement(
  caseFacts: Partial<CaseFacts> | null,
  npcIds: string[],
  recorded: { kind: string; category: string; sourceId: string }[],
): boolean {
  const told = new Set(
    recorded
      .filter((e) => e.category === 'STATEMENT')
      .map((e) => `${e.kind}:${e.sourceId}`),
  );
  const placement = caseFacts?.verification?.placement;
  const expected = [
    ...(placement?.type === 'TESTIMONY'
      ? [`VERIFICATION:${placement.npcId}`]
      : []),
    ...npcIds.flatMap((id) =>
      linkStatements(caseFacts, id, (other) => other).map(
        (s) => `${s.kind}:${s.npcId}`,
      ),
    ),
  ];
  return expected.some((key) => !told.has(key));
}
