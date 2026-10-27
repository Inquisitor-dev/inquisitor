import { CaseFacts } from '../scenarios/case-setup';
import { foldTurkish } from './prompt-guard';
import {
  asksAboutBody,
  bodyFindingText,
  confessionText,
  linkStatements,
} from './case-statements';

// Kanıt Defteri: yapay zekâ bir ipucunu verdiğinde ya da bir karakter itiraf ettiğinde cevabına
// gizli bir etiket ekler (arama iznindeki [GRANT_WARRANT] gibi). Sunucu etiketi kanıta çevirir,
// oyuncu etiketi hiç görmez. Kanıt metni o anki cümleden değil, vaka kurulumunda kaydedilen
// resmi metinden alınır; böylece defter her zaman vakanın gerçekleriyle tutarlıdır.

// BODY: örtü altındaki yara; TESTIMONY: cinayete bağlı sırrın ifadesi (kısmi tanık, son konuşan);
// ALIBI: tamamen masumun mazeretini doğrulayan ifade (Vaka Motoru v2)
export type EvidenceKind =
  | 'CLUE'
  | 'VERIFICATION'
  | 'CONFESSION'
  | 'BODY'
  | 'TESTIMONY'
  | 'ALIBI'
  // Gece olayının defterdeki kartı (v3 personaları); kanıt değildir
  | 'EVENT'
  // Psikopatın kapının altına bıraktığı mektup; izi katil dahil birkaç kişiye uyar
  | 'LETTER'
  // Baskında kaçan saldırganın kapı önünde düşürdüğü iz (aynı kural)
  | 'RAID_TRACE';
// ITEM: mekânda bulunan fiziksel nesne, Envanter'de görünür.
// STATEMENT: bir karakterin ifadesi, Not defterine otomatik yazılır.
// EVENT: gece olayının kartı; defterde görünür ama gösterilemez, panoya ve Hüküm Dosyası'na girmez.
export type EvidenceCategory = 'ITEM' | 'STATEMENT' | 'EVENT';

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
  // Karakter vakadaki payını (kısmi tanıklık, son konuşma, mazeret doğrulama) anlattı
  statement: 'STATEMENT_GIVEN',
  // Olay yeri anlatıcısı örtü altındaki bedeni anlattı
  body: 'BODY_EXAMINED',
} as const;

const TAG_PATTERN =
  /\[\s*(CLUE_FOUND|CONFESSED|EVIDENCE_REVEALED|STATEMENT_GIVEN|BODY_EXAMINED)\s*\]/gi;

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

import { NAME_TITLES } from './warrant';

// Yapay zekâ tanıklığı anlatıp etiketi unutabiliyor (gerçek Gemini denemesinde görüldü). Bu yüzden
// tanığın cevabı kayıtlı tanıklığın somut ayrıntılarını (ve doğrulama tanıklığında katilin adını) içeriyorsa da kanıt sayılır.
export function sharesTestimony(params: {
  reply: string;
  verificationText: string;
  witnessName: string;
  culpritName: string;
}): boolean {
  const { reply, verificationText, witnessName, culpritName } = params;
  const foldedReply = foldTurkish(reply);
  const foldedVerification = foldTurkish(verificationText);

  const culpritTokens = foldTurkish(culpritName)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !NAME_TITLES.has(w));

  // Eğer resmi verificationText katilin adını içeriyorsa (CORROBORATION), cevabın da katilin adını anması şarttır.
  // Tuzak kusuru (FLAW) tanıklığında ise tanık katili bilmez; eşyanın çalındığını anlatır.
  const verificationMentionsCulprit =
    culpritTokens.length === 0 ||
    culpritTokens.some((token) => foldedVerification.includes(token));

  if (verificationMentionsCulprit) {
    if (
      culpritTokens.length === 0 ||
      !culpritTokens.some((token) => foldedReply.includes(token))
    ) {
      return false;
    }
  }

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
  // Oyuncunun mesajı ve evren: beden incelemesi ve v2 ifadeleri için (isteğe bağlı)
  playerMessage?: string;
  scenarioType?: string;
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

  // Olay yeri anlatıcısı örtü altındaki bedeni anlattı: yaranın türü (silahın ilk ipucu)
  if (locationId === 'crime_scene') {
    const finding = bodyFindingText(caseFacts, params.scenarioType ?? '');
    const examined =
      tags.has(EVIDENCE_TAG.body) ||
      (!!params.playerMessage && asksAboutBody(params.playerMessage));
    if (finding && examined) {
      drafts.push({
        kind: 'BODY',
        category: 'ITEM',
        sourceId: 'crime_scene',
        text: finding,
      });
    }
  }

  if (npcId) {
    const nameOf = params.nameOf ?? ((id: string) => id);
    // Masumun itirafı mazeretidir; katilinki örtü hikâyesidir (yalan bir mazeret). Örtü hikâyesi olmayan
    // eski vakalarda katil kırılmaz, itirafı da kaydedilmez.
    const canConfess = npcId !== culpritId || !!caseFacts?.culpritCover;
    if (tags.has(EVIDENCE_TAG.confession) && canConfess) {
      drafts.push({
        kind: 'CONFESSION',
        category: 'STATEMENT',
        sourceId: npcId,
        text: confessionText(
          caseFacts,
          npcId,
          nameOf,
          params.scenarioType ?? '',
        ),
      });
    }
    // Cinayete bağlı sırların ifadeleri. Karakterin tek ifadesi varsa etiket yeter; birden çoksa
    // hangisini anlattığı cevabın içeriğinden anlaşılır.
    const statements = linkStatements(caseFacts, npcId, nameOf);
    const tagged = tags.has(EVIDENCE_TAG.statement);
    for (const statement of statements) {
      const told =
        (tagged && statements.length === 1) ||
        (!!params.reply && statement.matches(params.reply));
      if (told) {
        drafts.push({
          kind: statement.kind,
          category: 'STATEMENT',
          sourceId: npcId,
          text: statement.text,
        });
      }
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
