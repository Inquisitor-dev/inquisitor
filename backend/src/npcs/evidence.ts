import { CaseFacts } from '../scenarios/case-setup';
import { foldTurkish } from './prompt-guard';

// Kanıt Defteri: yapay zekâ bir ipucunu verdiğinde ya da bir karakter itiraf ettiğinde cevabına
// gizli bir etiket ekler (arama iznindeki [GRANT_WARRANT] gibi). Sunucu etiketi kanıta çevirir,
// oyuncu etiketi hiç görmez. Kanıt metni o anki cümleden değil, vaka kurulumunda kaydedilen
// resmi metinden alınır; böylece defter her zaman vakanın gerçekleriyle tutarlıdır.

export type EvidenceKind = 'CLUE' | 'VERIFICATION' | 'CONFESSION';
// ITEM: mekânda bulunan fiziksel nesne, Envanter'de görünür.
// STATEMENT: bir karakterin ifadesi, Not defterine otomatik yazılır.
export type EvidenceCategory = 'ITEM' | 'STATEMENT';

export interface EvidenceDraft {
  kind: EvidenceKind;
  category: EvidenceCategory;
  // Kanıtın kaynağı: ipucu için mekân id'si, itiraf ve tanıklık için karakter id'si
  sourceId: string;
  text: string;
}

export const EVIDENCE_TAG = {
  clue: 'CLUE_FOUND',
  confession: 'CONFESSED',
  verification: 'EVIDENCE_REVEALED',
} as const;

const TAG_PATTERN = /\[\s*(CLUE_FOUND|CONFESSED|EVIDENCE_REVEALED)\s*\]/gi;

export function extractEvidenceTags(reply: string): {
  reply: string;
  tags: Set<string>;
} {
  const tags = new Set<string>();
  const cleaned = reply
    .replace(TAG_PATTERN, (_match, tag: string) => {
      tags.add(tag.toUpperCase());
      return '';
    })
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  return { reply: cleaned, tags };
}

// Kelimelerin ilk 5 harfi: "çizmeler" ile "çizmeleriyle" aynı sayılsın
const stems = (text: string) =>
  new Set(
    foldTurkish(text)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4)
      .map((word) => word.slice(0, 5)),
  );

// Tanığın cevabı kayıtlı tanıklıkla örtüşüyorsa en az bu kadar ortak kelime kökü olmalı (adlar hariç)
const TESTIMONY_MIN_SHARED_STEMS = 4;

// Yapay zekâ tanıklığı anlatıp etiketi unutabiliyor (gerçek Gemini denemesinde görüldü). Bu yüzden
// tanığın cevabı katilin adını ve kayıtlı tanıklığın somut ayrıntılarını içeriyorsa da kanıt sayılır.
export function sharesTestimony(params: {
  reply: string;
  verificationText: string;
  witnessName: string;
  culpritName: string;
}): boolean {
  const { reply, verificationText, witnessName, culpritName } = params;
  const culpritToken = foldTurkish(culpritName)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .pop();
  if (!culpritToken || !foldTurkish(reply).includes(culpritToken)) return false;

  const nameStems = stems(`${witnessName} ${culpritName}`);
  const expected = [...stems(verificationText)].filter(
    (stem) => !nameStems.has(stem),
  );
  if (expected.length === 0) return false;
  const said = stems(reply);
  const matched = expected.filter((stem) => said.has(stem)).length;
  return matched >= Math.min(TESTIMONY_MIN_SHARED_STEMS, expected.length);
}

export function evidenceFromTags(params: {
  tags: Set<string>;
  // Konuşan karakterin id'si; anlatıcıda null
  npcId: string | null;
  // Anlatıcının aradığı mekân; karakterde null
  locationId: string | null;
  culpritId: string | null;
  caseFacts: CaseFacts | null;
  locationClues: Record<string, string>;
  // Etiket yoksa tanıklığı metinden tanımak için (isteğe bağlı)
  reply?: string;
  nameOf?: (npcId: string) => string;
}): EvidenceDraft[] {
  const { tags, npcId, locationId, culpritId, caseFacts, locationClues } =
    params;
  const placement = caseFacts?.verification.placement;
  const drafts: EvidenceDraft[] = [];

  // Anlatıcı mekânın gizli ipucunu verdi. Doğrulayan kanıt o mekâna konduysa, ipucu odur.
  if (locationId && tags.has(EVIDENCE_TAG.clue)) {
    const text = locationClues[locationId];
    if (text) {
      const isVerification =
        placement?.type === 'LOCATION' && placement.locationId === locationId;
      drafts.push({
        kind: isVerification ? 'VERIFICATION' : 'CLUE',
        category: 'ITEM',
        sourceId: locationId,
        text,
      });
    }
  }

  if (npcId) {
    // Sadece masumların itirafı kanıttır: sırları aynı zamanda mazeretleridir
    if (tags.has(EVIDENCE_TAG.confession) && npcId !== culpritId) {
      drafts.push({
        kind: 'CONFESSION',
        category: 'STATEMENT',
        sourceId: npcId,
        text: caseFacts?.alibis[npcId] || 'Sakladığı sırrı itiraf etti.',
      });
    }
    // Tanıklıkla gelen doğrulayan kanıt sadece o tanıktan alınabilir
    const isWitness =
      placement?.type === 'TESTIMONY' &&
      placement.npcId === npcId &&
      !!caseFacts?.verificationText;
    const told =
      tags.has(EVIDENCE_TAG.verification) ||
      (isWitness &&
        !!params.reply &&
        !!params.nameOf &&
        !!culpritId &&
        sharesTestimony({
          reply: params.reply,
          verificationText: caseFacts.verificationText,
          witnessName: params.nameOf(npcId),
          culpritName: params.nameOf(culpritId),
        }));
    if (isWitness && told) {
      drafts.push({
        kind: 'VERIFICATION',
        category: 'STATEMENT',
        sourceId: npcId,
        text: caseFacts.verificationText,
      });
    }
  }

  return drafts;
}
