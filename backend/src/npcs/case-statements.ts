import type { CaseFacts, Involvement } from '../scenarios/case-setup';
import {
  MotiveId,
  TIME_OF_DEATH_LABELS,
  WeaponMethod,
  WEAPONS,
} from '../scenarios/case-catalog';
import { normalizeScenarioType } from '../scenarios/scenario-config';
import { foldTurkish } from './prompt-guard';
import { NAME_TITLES } from './warrant';

// Vaka Motoru v2: cinayete bağlı sırların getirdiği ifadeler ve olay yerindeki beden incelemesi.
// Kanıt metinleri her zaman burada, vaka gerçeklerinden kurulur; yapay zekânın o anki cümlesinden alınmaz.
// Böylece Not Defteri, pano ve oyun sonu raporu vakanın gerçekleriyle tutarlı kalır.

export type LinkStatementKind = 'TESTIMONY' | 'ALIBI';

export interface LinkStatement {
  kind: LinkStatementKind;
  // İfadeyi veren karakter
  npcId: string;
  text: string;
  // Etiket unutulursa cevabın bu ifadeyi taşıdığını anlamak için
  matches: (reply: string) => boolean;
}

// Örtü kaldırılınca görülen yara (Not Defteri ve Envanter metni)
const BODY_FINDINGS: Record<WeaponMethod, string> = {
  BLADE:
    'Kurban keskin bir aletle öldürülmüş: bedeninde derin bir kesik ya da bıçak yarası var.',
  BLUNT:
    'Kurban ağır, küt bir cisimle öldürülmüş: bedeninde ezik bir darbe yarası var.',
  POISON:
    'Bedende yara yok; morarmış dudaklar, morarmış parmak uçları ve tuhaf bir koku zehirlenmeyi gösteriyor.',
  STRANGLE:
    'Kurban boğularak öldürülmüş: boynunda gergin bir şeyin bıraktığı koyu izler var.',
};

// Kurbanın son konuşmada neden huzursuz olduğu (motife göre, kimsenin adı geçmeden)
const LAST_WORDS: Record<MotiveId, string> = {
  DEBT: 'Bir borç meselesi yüzünden çok huzursuzdu.',
  JEALOUSY: 'Birinin kıskançlığından korktuğunu söyledi.',
  REVENGE: 'Geçmişte yaptığı bir şeyin hesabının sorulacağından korkuyordu.',
  SILENCE: 'Birinin sırrını bildiğini ve bunun başına dert açacağını söyledi.',
  GREED: 'Malı mülkü yüzünden birinin gözünün üzerinde olduğunu söyledi.',
  FEAR: 'Birini elindeki bir şeyle tehdit ettiğini, karşılığından korktuğunu söyledi.',
};

const weaponOf = (caseFacts: Partial<CaseFacts> | null, scenarioType: string) =>
  WEAPONS[normalizeScenarioType(scenarioType)].find(
    (w) => w.id === caseFacts?.weaponId,
  );

export function bodyFindingText(
  caseFacts: Partial<CaseFacts> | null,
  scenarioType: string,
): string | null {
  const weapon = weaponOf(caseFacts, scenarioType);
  return weapon ? BODY_FINDINGS[weapon.method] : null;
}

// Oyuncu cesedi inceliyor mu? (anlatıcı etiketi unutursa)
export function asksAboutBody(playerMessage: string): boolean {
  const text = foldTurkish(playerMessage);
  // "yarasa", "yaramaz" gibi kelimeler sayılmasın: yara yalnızca kendi başına ya da ekleriyle
  const target =
    /(\bortu|\bcesed|\bceset|\bbeden|\bgovde|\byara(\b|si|yi|lar)|\bboyn|\bboyun)/.test(
      text,
    );
  const action = /(kaldir|acip|acar|\bac|cek|incel|bak|muayene|kontrol)/.test(
    text,
  );
  return target && action;
}

// Ad eşleşmesi: unvanlar ("Kardeş", "Peder") sayılmaz
export function nameTokens(name: string): string[] {
  return foldTurkish(name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !NAME_TITLES.has(w));
}

// Metinde karakterin adı geçiyor mu (unvanlar sayılmaz). Ad kelime başında aranır, ekler serbesttir
// ("Lin'in", "Line"): kelime içinde aransaydı "Lin Feng" adı "bilinen", "gelince" gibi kelimelerde
// de bulunurdu.
export const mentions = (reply: string, name: string) => {
  const folded = foldTurkish(reply);
  return nameTokens(name).some((token) =>
    new RegExp(`(^|[^a-z0-9])${token}`).test(folded),
  );
};

const timeLabel = (caseFacts: Partial<CaseFacts> | null) =>
  caseFacts?.timeOfDeath
    ? TIME_OF_DEATH_LABELS[caseFacts.timeOfDeath].toLocaleLowerCase('tr-TR')
    : 'cinayet saatinde';

// Bir karakterin verebileceği ifadeler: kendi bağı (kısmi tanık, son konuşan) ve
// mazeretini doğruladığı tamamen masumlar. Doğrulayan kanıtın tanığı burada değildir (VERIFICATION).
export function linkStatements(
  caseFacts: Partial<CaseFacts> | null,
  npcId: string,
  nameOf: (id: string) => string,
): LinkStatement[] {
  const involvements: Involvement[] = caseFacts?.involvements ?? [];
  const placement = caseFacts?.verification?.placement;
  const verificationWitness =
    placement?.type === 'TESTIMONY' ? placement.npcId : null;
  const statements: LinkStatement[] = [];

  const own = involvements.find((i) => i.npcId === npcId);
  if (own && npcId !== verificationWitness) {
    if (own.kind === 'WITNESS' && own.aboutNpcId) {
      const about = nameOf(own.aboutNpcId);
      statements.push({
        kind: 'TESTIMONY',
        npcId,
        text: `"Cinayet saatinde (${timeLabel(caseFacts)}) ${about} olay yerinden uzaktaydı; onu kendi gözlerimle gördüm."`,
        // Adın geçmesi yetmez ("git ona sor"); o saatte onu başka yerde gördüğünü anlatmalı
        matches: (reply) =>
          mentions(reply, about) &&
          /(gord|gormus|uzak|baska (bir )?yer|disarida|oradaydi|yanimdaydi)/.test(
            foldTurkish(reply),
          ),
      });
    }
    if (own.kind === 'LAST_CONVERSATION' && caseFacts?.motive) {
      statements.push({
        kind: 'TESTIMONY',
        npcId,
        text: `"Kurbanla son konuşan bendim. ${LAST_WORDS[caseFacts.motive]}"`,
        matches: (reply) => {
          const folded = foldTurkish(reply);
          // "Sana son kez söylüyorum" sayılmaz; kurbanla son konuştuğunu ya da görüştüğünü söylemeli
          return /(en son|son kez|son defa|\bson)\s+(\w+\s+)?(konus|gorus)/.test(
            folded,
          );
        },
      });
    }
  }

  // Tamamen masumların mazeretini doğrulama: aynı kişi birden çok masum için doğrulayabilir
  const vouched = involvements.filter(
    (i) => i.kind === 'NONE' && i.aboutNpcId === npcId,
  );
  if (vouched.length > 0) {
    const names = vouched.map((i) => nameOf(i.npcId));
    statements.push({
      kind: 'ALIBI',
      npcId,
      text: `"Cinayet saatinde (${timeLabel(caseFacts)}) ${names.join(' ve ')} benimleydi."`,
      matches: (reply) => {
        const folded = foldTurkish(reply);
        return (
          names.some((name) => mentions(reply, name)) &&
          /(birlikte|benimle|beraber|yanimda)/.test(folded)
        );
      },
    });
  }
  return statements;
}

// İtiraf metni: mazeret; silahı bilmeden veren ve cesetten eşya alan, itirafında fazlasını da söyler
export function confessionText(
  caseFacts: Partial<CaseFacts> | null,
  npcId: string,
  nameOf: (id: string) => string,
  scenarioType: string,
): string {
  // Katilin "itirafı" örtü hikâyesidir: masumların itirafı gibi kaydedilir, böylece kimin kırılmadığı katili söylemez
  if (npcId === caseFacts?.culpritId && caseFacts?.culpritCover) {
    return caseFacts.culpritCover;
  }
  const alibi = caseFacts?.alibis?.[npcId] || 'Sakladığı sırrı itiraf etti.';
  const own = caseFacts?.involvements?.find((i) => i.npcId === npcId);
  if (own?.kind === 'UNWITTING_HELP' && caseFacts?.culpritId) {
    const weapon = weaponOf(caseFacts, scenarioType);
    if (weapon) {
      return `${alibi} Ayrıca: "${weapon.label} benimdi; cinayetten kısa süre önce ${nameOf(caseFacts.culpritId)} istedi, ben de verdim."`;
    }
  }
  if (own?.kind === 'SCAVENGER') {
    return `${alibi} Ayrıca: "Cesedi ilk ben buldum ve üzerinden bir eşya aldım. Ölüm ${timeLabel(caseFacts)} olmuş olmalı."`;
  }
  return alibi;
}

// Örtü hikâyesinin ilk cümlesi yer ve iş, kalanı utanılan sır. Senaryo istemi iki cümle ister ama Gemini
// bazen tek cümle yazıyor, ikisini noktalı virgülle ya da virgülle bağlıyor ("…oturuyordum, kurbanla
// aramızdaki borç…"); eski hikâyeler de öyle. O zaman ilk noktalı virgülden, yoksa ilk virgülden bölünür.
export function splitCover(cover: string): { alibi: string; secret: string } {
  const text = cover.trim();
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  if (sentences.length > 1) {
    return {
      alibi: sentences[0].trim(),
      secret: sentences.slice(1).join('').trim(),
    };
  }
  const cut = text.includes(';') ? text.indexOf(';') : text.indexOf(',');
  if (cut === -1) return { alibi: text, secret: '' };
  return {
    alibi: `${text.slice(0, cut).trim()}.`,
    secret: text.slice(cut + 1).trim(),
  };
}

// İtirafın mazeretten fazlası, yani kişinin kırılana kadar sakladığı sır: silahı bilmeden verenin ve
// cesetten eşya alanın eki. Diğerlerinde null. Katilin örtü hikâyesi burada yok: katil istemde sırrı
// kırılana kadar hiç görmez (prompt-builder). Görüp söylediğinde kaydedilseydi, ilk soruda itirafı düşen
// kişi katil olurdu (Gemini denemesi, 29 Ekim 2026).
export function confessionSecret(
  caseFacts: Partial<CaseFacts> | null,
  npcId: string,
  nameOf: (id: string) => string,
  scenarioType: string,
): string | null {
  const own = caseFacts?.involvements?.find((i) => i.npcId === npcId);
  if (own?.kind !== 'UNWITTING_HELP' && own?.kind !== 'SCAVENGER') return null;
  const extra = confessionText(caseFacts, npcId, nameOf, scenarioType)
    .replace(caseFacts?.alibis?.[npcId] ?? '', '')
    .replace(/^\s*Ayrıca:\s*/, '')
    .trim();
  return extra || null;
}

// NPC istemine giden satırlar: karakterin vakadaki payı koddan gelir; yapay zekânın yazdığı sır
// unutsa bile ifade ve itiraf vaka gerçekleriyle aynı kalır
export function linkPromptLines(
  caseFacts: Partial<CaseFacts> | null,
  npcId: string,
  nameOf: (id: string) => string,
  scenarioType: string,
  statementTag: string,
): string {
  // Hazır cümle kelimesi kelimesine kopyalanıp alakasız bir soruya eklenebiliyor (Gemini testinde görüldü):
  // ne zaman söyleneceği ve kendi sözleriyle söyleneceği açıkça yazılır
  const own = caseFacts?.involvements?.find((i) => i.npcId === npcId);
  const lines = linkStatements(caseFacts, npcId, nameOf).map((s) =>
    s.kind === 'ALIBI'
      ? `- ONLY when the Inquisitor asks where someone was that night, you confirm it in your own words (meaning: ${s.text}).`
      : `- ONLY when the Inquisitor asks about that night, the murder location or the victim, you tell this in your own words (meaning: ${s.text}).`,
  );
  // Kısmi tanık gördüğü kişiyi, o kişinin kendi anlattığı yerde gördü. Yer koddan verilir: yapay zekâ
  // yeri yazmayınca tanık "başka bir sokakta" ya da "kendi alibisini koruduğu bölgede" diyordu.
  if (
    own?.kind === 'WITNESS' &&
    own.aboutNpcId &&
    own.aboutNpcId !== caseFacts?.culpritId
  ) {
    const where = caseFacts?.alibis?.[own.aboutNpcId];
    if (where) {
      lines.push(
        `- Where exactly you saw ${nameOf(own.aboutNpcId)}: at the place described in this account of their night (retell only the place and what they were doing, in your own words): ${where}`,
      );
    }
  }
  // Son konuşan kurbanın kimden korktuğunu bilmez: "otonom bir tehdit" gibi bir tarif katili ele veriyordu
  if (own?.kind === 'LAST_CONVERSATION') {
    lines.push(
      '- You do not know who the victim was afraid of. Never describe or hint at that person: no name, job, kind (human, android, cyborg…), looks or place.',
    );
  }
  if (lines.length > 0) {
    lines.push(
      '- Never bring these up on your own or in answer to an unrelated question, and never repeat the sentence in brackets word for word.',
    );
  }
  // Tamamen masum ve onu doğrulayan aynı yeri ve aynı işi anlatsın; yoksa ikisi farklı yer uydurur
  // ve oyuncu bunu yalan sanır (Gemini testinde görüldü). Mazeret cümlesi diğer kişinin ağzından
  // yazılmış olabilir: karakter onu kendi gözünden anlatır, kelimesi kelimesine tekrarlamaz
  // (aksi hâlde başkasının "dükkânımda çorba kaynatıyordum" cümlesini kendi mazereti gibi söylüyordu).
  const partners = new Map<string, string>();
  if (own?.kind === 'NONE' && own.aboutNpcId) {
    const alibi = caseFacts?.alibis?.[npcId];
    if (alibi) partners.set(own.aboutNpcId, alibi);
  }
  for (const inv of caseFacts?.involvements ?? []) {
    if (inv.kind !== 'NONE' || inv.aboutNpcId !== npcId) continue;
    const alibi = caseFacts?.alibis?.[inv.npcId];
    if (alibi && !partners.has(inv.npcId)) partners.set(inv.npcId, alibi);
  }
  for (const [partnerId, alibi] of partners) {
    lines.push(
      `- That night you and ${nameOf(partnerId)} were together, at the same place doing the same thing. Here is that account (it may be in someone else's words; it is a summary, never a sentence to repeat): ${alibi} Tell it from your own point of view, in your own words, and only when asked about that night.`,
    );
  }
  const secret =
    own?.kind === 'UNWITTING_HELP' || own?.kind === 'SCAVENGER'
      ? confessionSecret(caseFacts, npcId, nameOf, scenarioType)
      : null;
  if (secret) {
    lines.push(
      `- You hide this until you break. Never mention it in conversation, whatever the Inquisitor says; only when the instruction at the end says you break, you also say: ${secret}`,
    );
  }
  if (lines.length === 0) return '';
  return `

YOUR PART IN THE CASE (decided by the game; never contradict it):
${lines.join('\n')}
- If and only if this reply tells one of the statements above (not the confession), end the reply with the tag [${statementTag}].`;
}
