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
}

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
export const locationClueId = (locationId: string) => `location:${locationId}`;
export const confessionClueId = (npcId: string) => `confession:${npcId}`;

// Bugünkü (v1) vaka planından grafik: olay yeri izi, doğrulayan kanıt, mekân ipuçları ve itiraflar.
// v2'de cinayete bağlı sırlar bu grafiğe yeni kanıtlar olarak eklenecek.
export function buildCaseGraph(
  plan: Pick<
    CasePlan,
    'culpritId' | 'innocentIds' | 'crimeSceneClue' | 'verification'
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

  // Her mekânın gizli ipucu orada yaşayanın sırrını anlatır. Masumun sırrı aynı zamanda mazeretidir.
  // Doğrulayan kanıtın konduğu mekânda sır ipucu yoktur.
  const verificationLocation =
    placement.type === 'LOCATION' ? placement.locationId : null;
  for (const npcId of suspects) {
    if (npcId === verificationLocation) continue;
    const innocent = npcId !== culpritId;
    clues.push({
      id: locationClueId(npcId),
      source: { kind: 'LOCATION', locationId: npcId },
      requires: [],
      pressures: [{ npcId, amount: PRESSURE_DECISIVE }],
      eliminates: innocent ? [npcId] : [],
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
    });
  }

  return {
    suspects,
    culpritId,
    clues,
    deductions,
    startFear: options.startFear ?? {},
    fearThreshold:
      options.fearThreshold ??
      Object.fromEntries(suspects.map((id) => [id, DEFAULT_FEAR_THRESHOLD])),
    warrantLimit: options.warrantLimit ?? MAX_WARRANTS_PER_CASE,
  };
}
