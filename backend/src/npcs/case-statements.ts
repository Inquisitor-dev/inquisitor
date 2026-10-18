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
  const target = /(ortu|cesed|ceset|beden|govde|yara|boyn|boyun)/.test(text);
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

const mentions = (reply: string, name: string) => {
  const folded = foldTurkish(reply);
  return nameTokens(name).some((token) => folded.includes(token));
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
        matches: (reply) => mentions(reply, about),
      });
    }
    if (own.kind === 'LAST_CONVERSATION' && caseFacts?.motive) {
      statements.push({
        kind: 'TESTIMONY',
        npcId,
        text: `"Kurbanla son konuşan bendim. ${LAST_WORDS[caseFacts.motive]}"`,
        matches: (reply) => {
          const folded = foldTurkish(reply);
          return (
            /\bson\b|en son/.test(folded) && /(konus|gorus|soyle)/.test(folded)
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

// NPC istemine giden satırlar: karakterin vakadaki payı koddan gelir; yapay zekânın yazdığı sır
// unutsa bile ifade ve itiraf vaka gerçekleriyle aynı kalır
export function linkPromptLines(
  caseFacts: Partial<CaseFacts> | null,
  npcId: string,
  nameOf: (id: string) => string,
  scenarioType: string,
  statementTag: string,
): string {
  const lines = linkStatements(caseFacts, npcId, nameOf).map((s) =>
    s.kind === 'ALIBI'
      ? `- When asked where people were that night, you confirm in your own words: ${s.text}`
      : `- When the Inquisitor asks about the murder location, the victim or that night, you tell in your own words: ${s.text}`,
  );
  const own = caseFacts?.involvements?.find((i) => i.npcId === npcId);
  if (own?.kind === 'UNWITTING_HELP' || own?.kind === 'SCAVENGER') {
    const extra = confessionText(
      caseFacts,
      npcId,
      nameOf,
      scenarioType,
    ).replace(caseFacts?.alibis?.[npcId] ?? '', '');
    lines.push(
      `- You hide this until you break. If you ever confess, you also say:${extra.replace(/^\s*Ayrıca:/, '')}`,
    );
  }
  if (lines.length === 0) return '';
  return `

YOUR PART IN THE CASE (decided by the game; never contradict it):
${lines.join('\n')}
- If and only if this reply tells one of the statements above (not the confession), end the reply with the tag [${statementTag}].`;
}
