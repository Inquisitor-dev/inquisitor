import type { CasePlan } from './case-setup';
import { DEFAULT_FEAR_THRESHOLD } from './case-catalog';

// Vakanın kanıt grafiği: oyuncunun bulabileceği her kanıt, ona nasıl ulaşıldığı ve neyi kanıtladığı.
// Çözücü (case-solver.ts) bu grafik üzerinde oyuncuyu taklit eder; metin değil yapı denetlenir.

export type ClueSource =
  | { kind: 'CRIME_SCENE' }
  // Arama izni ister
  | { kind: 'LOCATION'; locationId: string }
  // Karakterle konuşarak alınır
  | { kind: 'TESTIMONY'; npcId: string }
  // Karakterin korkusu eşiğe ulaşınca kendiliğinden düşer (yalnızca masumlar)
  | { kind: 'CONFESSION'; npcId: string };

export interface ClueNode {
  id: string;
  source: ClueSource;
  // Bu kanıta ulaşmak için elde olması gereken kanıtlar (ör. tanık izi gösterince konuşur)
  requires: string[];
  // Kanıt bir karaktere gösterilince korkusunu ne kadar artırır
  pressures: { npcId: string; amount: number }[];
  // Tek başına elediği şüpheliler (ör. bir masumun mazeret kanıtı)
  eliminates: string[];
  // Oyun sonu raporunda kanıtladığı gerçekler (silah, motif, ölüm saati)
  proves?: CaseFactKey[];
}

export type CaseFactKey = 'WEAPON' | 'MOTIVE' | 'TIME_OF_DEATH';

// Birden çok kanıtın birlikte söylediği şey (ör. iz + doğrulayan kanıt = iz gerçektir)
export interface Deduction {
  id: string;
  requires: string[];
  eliminates: string[];
  // Katili doğrudan gösteriyorsa
  identifies?: string;
}

export interface CaseGraph {
  suspects: string[];
  culpritId: string;
  clues: ClueNode[];
  deductions: Deduction[];
  // Başlangıç korkusu ve itiraf eşiği (kişiliğe göre)
  startFear: Record<string, number>;
  fearThreshold: Record<string, number>;
  warrantLimit: number;
}

export const MAX_WARRANTS_PER_CASE = 2;
// Kanıt gösterince korku artışı (npcs/fear.ts ile aynı)
const PRESSURE_IMPLICATING = 3;
const PRESSURE_DECISIVE = 7;

export const CRIME_SCENE_CLUE_ID = 'crime_scene';
export const VERIFICATION_CLUE_ID = 'verification';
export const BODY_CLUE_ID = 'body';
export const locationClueId = (locationId: string) => `location:${locationId}`;
export const confessionClueId = (npcId: string) => `confession:${npcId}`;
export const testimonyClueId = (npcId: string) => `testimony:${npcId}`;
export const alibiClueId = (npcId: string) => `alibi:${npcId}`;

// Vaka planından grafik: olay yeri izi, doğrulayan kanıt, mekân ipuçları ve itiraflar; v2 planlarında
// bunlara beden ve cinayete bağlı sırların getirdiği kanıtlar eklenir.
export function buildCaseGraph(
  plan: Pick<
    CasePlan,
    | 'culpritId'
    | 'innocentIds'
    | 'crimeSceneClue'
    | 'verification'
    | 'weaponId'
    | 'involvements'
    | 'fearThresholds'
  >,
  options: {
    startFear?: Record<string, number>;
    fearThreshold?: Record<string, number>;
    warrantLimit?: number;
  } = {},
): CaseGraph {
  const { culpritId, innocentIds, crimeSceneClue, verification } = plan;
  const suspects = [culpritId, ...innocentIds];
  const clues: ClueNode[] = [];
  const deductions: Deduction[] = [];

  clues.push({
    id: CRIME_SCENE_CLUE_ID,
    source: { kind: 'CRIME_SCENE' },
    requires: [],
    pressures: crimeSceneClue.implicatedNpcIds.map((npcId) => ({
      npcId,
      amount: PRESSURE_IMPLICATING,
    })),
    // İzin gerçek mi tuzak mı olduğu bilinmeden kimse elenemez
    eliminates: [],
  });

  const { placement } = verification;
  clues.push({
    id: VERIFICATION_CLUE_ID,
    source:
      placement.type === 'LOCATION'
        ? { kind: 'LOCATION', locationId: placement.locationId }
        : { kind: 'TESTIMONY', npcId: placement.npcId },
    // Tuzakta eşyası çalınan kişi, eşyası sorulunca konuşur: önce izi görmek gerekir
    requires:
      verification.kind === 'FLAW' && placement.type === 'TESTIMONY'
        ? [CRIME_SCENE_CLUE_ID]
        : [],
    // Doğrulayan kanıt yalnızca katili sıkıştırır
    pressures: [{ npcId: culpritId, amount: PRESSURE_IMPLICATING }],
    eliminates: [],
  });

  if (verification.kind === 'CORROBORATION') {
    // Gerçek iz doğrulanınca işaret etmediği şüpheliler elenir
    deductions.push({
      id: 'trace-is-genuine',
      requires: [CRIME_SCENE_CLUE_ID, VERIFICATION_CLUE_ID],
      eliminates: crimeSceneClue.eliminatedNpcIds,
    });
    // Katilin mekânında izle eşleşen kanıt ya da katili gören tanık katili doğrudan gösterir
    deductions.push({
      id: 'verification-points-at-culprit',
      requires:
        placement.type === 'LOCATION'
          ? [CRIME_SCENE_CLUE_ID, VERIFICATION_CLUE_ID]
          : [VERIFICATION_CLUE_ID],
      eliminates: [],
      identifies: culpritId,
    });
  } else {
    // Tuzak ortaya çıkınca suçlanmaya çalışılanlar temize çıkar
    deductions.push({
      id: 'trace-is-planted',
      requires: [CRIME_SCENE_CLUE_ID, VERIFICATION_CLUE_ID],
      eliminates: crimeSceneClue.eliminatedNpcIds,
    });
  }

  const involvements = plan.involvements ?? [];
  const kindOf = (npcId: string) =>
    involvements.find((i) => i.npcId === npcId)?.kind;
  const witnessId = placement.type === 'TESTIMONY' ? placement.npcId : null;

  // Beden: örtü kaldırılınca yaranın türü görülür (silahın ilk ipucu). Silahı bilmeden veren kişiyi
  // tedirgin eder, çünkü aletin ya da zehrin onun elinden çıktığını anlar.
  if (plan.weaponId) {
    clues.push({
      id: BODY_CLUE_ID,
      source: { kind: 'CRIME_SCENE' },
      requires: [],
      pressures: involvements
        .filter((i) => i.kind === 'UNWITTING_HELP')
        .map((i) => ({ npcId: i.npcId, amount: PRESSURE_IMPLICATING })),
      eliminates: [],
      proves: ['WEAPON'],
    });
  }

  // Her mekânın gizli ipucu orada yaşayanın sırrını anlatır. Masumun sırrı çoğunlukla mazeretidir; ama
  // cesetten eşya alanın ya da katile bilmeden alet verenin mekânındaki ipucu onu temize çıkarmaz,
  // tersine şüpheli gösterir. Doğrulayan kanıtın konduğu mekânda sır ipucu yoktur.
  const verificationLocation =
    placement.type === 'LOCATION' ? placement.locationId : null;
  for (const npcId of suspects) {
    if (npcId === verificationLocation) continue;
    const kind = kindOf(npcId);
    const clearsOwner =
      npcId !== culpritId && kind !== 'SCAVENGER' && kind !== 'UNWITTING_HELP';
    clues.push({
      id: locationClueId(npcId),
      source: { kind: 'LOCATION', locationId: npcId },
      requires: [],
      pressures: [{ npcId, amount: PRESSURE_DECISIVE }],
      eliminates: clearsOwner ? [npcId] : [],
      proves: npcId === culpritId ? ['MOTIVE'] : undefined,
    });
  }

  // Masum, korkusu eşiğe varınca sırrını itiraf eder; itirafı mazeretidir
  for (const npcId of innocentIds) {
    clues.push({
      id: confessionClueId(npcId),
      source: { kind: 'CONFESSION', npcId },
      requires: [],
      pressures: [],
      eliminates: [npcId],
      // Cesedi bulup eşya alan, ölümün ne zaman olduğunu bilir
      proves: kindOf(npcId) === 'SCAVENGER' ? ['TIME_OF_DEATH'] : undefined,
    });
  }

  // Cinayete bağlı sırların getirdiği kanıtlar (doğrulayan kanıtın tanığı kendi kanıtını zaten taşır)
  for (const inv of involvements) {
    if (inv.npcId === witnessId) continue;
    switch (inv.kind) {
      case 'WITNESS':
        // O saatte başka bir masumu başka yerde görmüştür; olay yeri sorulunca anlatır
        if (inv.aboutNpcId) {
          clues.push({
            id: testimonyClueId(inv.npcId),
            source: { kind: 'TESTIMONY', npcId: inv.npcId },
            requires: [CRIME_SCENE_CLUE_ID],
            pressures: [],
            eliminates: [inv.aboutNpcId],
            proves: ['TIME_OF_DEATH'],
          });
        }
        break;
      case 'LAST_CONVERSATION':
        // Kurbanın son konuşmada kimden korktuğunu söyler: motifi gösterir, katili sıkıştırır
        clues.push({
          id: testimonyClueId(inv.npcId),
          source: { kind: 'TESTIMONY', npcId: inv.npcId },
          requires: [],
          pressures: [{ npcId: culpritId, amount: PRESSURE_IMPLICATING }],
          eliminates: [],
          proves: ['MOTIVE'],
        });
        break;
      case 'UNWITTING_HELP':
        // İtiraf eden, aleti ya da zehri kime verdiğini söyler; yara türüyle birleşince katili gösterir
        if (plan.weaponId) {
          deductions.push({
            id: `weapon-chain:${inv.npcId}`,
            requires: [confessionClueId(inv.npcId), BODY_CLUE_ID],
            eliminates: [],
            identifies: culpritId,
          });
        }
        break;
      case 'NONE':
        // Tamamen masumun mazeretini başka biri doğrular; sorulunca rahatça anlatır
        if (inv.aboutNpcId) {
          clues.push({
            id: alibiClueId(inv.npcId),
            source: { kind: 'TESTIMONY', npcId: inv.aboutNpcId },
            requires: [],
            pressures: [],
            eliminates: [inv.npcId],
          });
        }
        break;
      default:
        // SHARED_MOTIVE ve SCAVENGER mekân ipucu ve itirafla işler (yukarıda)
        break;
    }
  }

  return {
    suspects,
    culpritId,
    clues,
    deductions,
    startFear: options.startFear ?? {},
    fearThreshold:
      options.fearThreshold ??
      Object.fromEntries(
        suspects.map((id) => [
          id,
          plan.fearThresholds?.[id] ?? DEFAULT_FEAR_THRESHOLD,
        ]),
      ),
    warrantLimit: options.warrantLimit ?? MAX_WARRANTS_PER_CASE,
  };
}
