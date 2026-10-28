// Wildcard'ların kasabadaki yüzü (docs/wildcard-tasarimi.md): gazete duyuruları, defter kartı ve NPC
// istem satırları. Hepsi hazır metindir; yapay zekâ çağrılmaz. Gün numarası yerine göreli zaman kullanılır
// (Gemini denemesinde gün numarası verilince karakterler sayaç diliyle konuştu, v3 §8).
import {
  leftReason,
  leftWildcardOf,
  rumorOf,
  rumorText,
  shortDayOf,
  shortDayReason,
  wildcardsOf,
} from '../scenarios/wildcards';

export interface WildcardNotice {
  kind: 'NOTICE';
  headline: string;
  body: string;
}

export interface WildcardTextContext {
  scenarioType: string;
  placeName: (locationId: string) => string;
  npcName: (npcId: string) => string;
}

// "Aziz günü: sabah ayini ..." → başlık ve gövde
const splitReason = (reason: string) => {
  const [head, ...rest] = reason.split(':');
  return { head: head.trim(), tail: rest.join(':').trim() || head.trim() };
};

// O sabahın gazetesine giren wildcard duyuruları
export function wildcardNotices(
  caseFacts: unknown,
  day: number,
  ctx: WildcardTextContext,
): WildcardNotice[] {
  const notices: WildcardNotice[] = [];
  const left = leftWildcardOf(caseFacts);
  if (left) {
    const name = ctx.npcName(left.npcId);
    const place = ctx.placeName(left.npcId);
    if (left.day === day + 1) {
      notices.push({
        kind: 'NOTICE',
        headline: `${name} kasabadan ayrılıyor`,
        body: `${name} ${leftReason(ctx.scenarioType, left.reasonIndex)}. Yarın sabah yola çıkıyor; ${place} ondan sonra kapalı kalacak.`,
      });
    } else if (left.day === day) {
      notices.push({
        kind: 'NOTICE',
        headline: `${name} kasabadan ayrıldı`,
        body: `${name} bu sabah erkenden kasabadan ayrıldı; ${place} kapalı.`,
      });
    }
  }
  const short = shortDayOf(caseFacts);
  if (short && (short.day === day + 1 || short.day === day)) {
    const { head, tail } = splitReason(
      shortDayReason(ctx.scenarioType, short.reasonIndex),
    );
    notices.push({
      kind: 'NOTICE',
      headline: short.day === day ? `Bugün: ${head}` : `Yarın: ${head}`,
      body: `${short.day === day ? 'Bugün' : 'Yarın'} ${tail}.`,
    });
  }
  if (
    day === 1 &&
    wildcardsOf(caseFacts).some((w) => w.kind === 'EXTRA_WARRANT')
  ) {
    notices.push({
      kind: 'NOTICE',
      headline: 'Arama izinlerinde kolaylık',
      body: 'Yetkililer bu soruşturma için üç arama iznine kadar imza atmaya hazır.',
    });
  }
  return notices;
}

// Gecenin ardından deftere düşen wildcard kartı (söylenti 2. sabah dolaşmaya başlar)
export function wildcardNightCards(
  caseFacts: unknown,
  night: number,
  ctx: WildcardTextContext,
): { sourceId: string; text: string }[] {
  const rumor = rumorOf(caseFacts);
  if (!rumor || rumor.day !== night + 1) return [];
  return [
    {
      sourceId: 'rumor',
      text: `Kasabada bir söylenti dolaşıyor: ${ctx.npcName(rumor.npcId)} ${rumorText(rumor.rumorIndex)}. Doğrulanmamış bir dedikodu.`,
    },
  ];
}

const when = (diff: number) =>
  diff <= 0 ? 'today' : diff === 1 ? 'tomorrow' : 'the day after tomorrow';

// Kasabada herkesin bildiği wildcard'lar (NPC istemi, İngilizce; gerekçeler Türkçe)
export function wildcardPromptLines(
  caseFacts: unknown,
  day: number,
  npcId: string,
  ctx: WildcardTextContext,
): string[] {
  const lines: string[] = [];
  const left = leftWildcardOf(caseFacts);
  if (left && left.npcId !== npcId) {
    const name = ctx.npcName(left.npcId);
    const reason = leftReason(ctx.scenarioType, left.reasonIndex);
    const place = ctx.placeName(left.npcId);
    lines.push(
      day < left.day
        ? `- Word in town: ${name} is leaving town for good ${when(left.day - day)} morning (in Turkish: "${reason}"), so "${place}" will be closed after that. You may mention it if it comes up (say "yarın" or "öbür gün", never a day number).`
        : `- ${name} has left town for good (in Turkish: "${reason}"; say it in the past tense); "${place}" is closed. You may mention it if it comes up.`,
    );
  }
  const short = shortDayOf(caseFacts);
  if (short && day <= short.day) {
    const reason = shortDayReason(ctx.scenarioType, short.reasonIndex);
    lines.push(
      day === short.day
        ? `- This morning the whole town was busy (in Turkish: "${reason}"); places opened again around noon. You may mention it if it comes up.`
        : `- Everyone in town knows: ${when(short.day - day)} morning (in Turkish: "${reason}"), places stay closed until noon. You may mention it if it comes up (never a day number).`,
    );
  }
  const rumor = rumorOf(caseFacts);
  if (rumor && day >= rumor.day) {
    const text = `${ctx.npcName(rumor.npcId)} ${rumorText(rumor.rumorIndex)}`;
    // Hedefin satırı katilde de masumda da aynıdır: söylentiye verilen tepki kimseyi ayırmaz
    lines.push(
      rumor.npcId === npcId
        ? `- A rumor about you is going around town (in Turkish: "${text}"). It is exaggerated gossip. If asked, react with annoyance and explain it away briefly as a small, ordinary matter; never invent new details about the victim for it.`
        : `- Gossip going around town (unverified; in Turkish: "${text}"). You do not know whether it is true. If asked what people are talking about, you may pass it on as gossip, never as something you saw yourself.`,
    );
  }
  return lines;
}

// Ayrılacak kişinin kendi programı (YOUR SCHEDULE bölümüne girer; ownPlanLines ile aynı gerekçe)
export function ownWildcardPlanLines(
  caseFacts: unknown,
  day: number,
  npcId: string,
  ctx: WildcardTextContext,
): string[] {
  const left = leftWildcardOf(caseFacts);
  if (!left || left.npcId !== npcId || day >= left.day) return [];
  const reason = leftReason(ctx.scenarioType, left.reasonIndex);
  const diff = left.day - day;
  return [
    `- ${diff === 1 ? 'TOMORROW morning' : 'THE DAY AFTER TOMORROW, in the morning,'} you leave town for good (in Turkish: "${reason}"), so the Inquisitor cannot find you after that. If they say they will come back later or ask about your plans, tell them. Say "${diff === 1 ? 'yarın' : 'öbür gün'}", never a day number.`,
  ];
}
