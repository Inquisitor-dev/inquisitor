import { Logger } from '@nestjs/common';
import { ClueDefinition, SCENARIO_CLUES } from './clues-config';
import { ScenarioConfig } from './scenario-config';
import {
  DEFAULT_FEAR_THRESHOLD,
  InvolvementKind,
  MOTIVES,
  MotiveId,
  TEMPERAMENT_THRESHOLD,
  TIMES_OF_DEATH,
  TimeOfDeath,
  WEAPONS,
} from './case-catalog';
import { buildCaseGraph } from './case-graph';
import { criticalPoints, solveCase } from './case-solver';

// Vakanın kodla belirlenen gerçekleri. Yapay zekâ bu kararları değiştirmez, sadece etraflarına
// hikâye yazar. Hüküm Dosyası ve Kanıt Defteri bu kayda göre puanlayacak/eşleştirecek.

export type MurderStyle = 'HURRIED' | 'PLANNED';
export type SceneState = 'MESSY' | 'TIDY';

// Olay yeri ipucunun ilk elemede kaç şüpheliyi eleyeceği. Tek bir ipucu vakayı çözmesin,
// sadece ilk adımı atsın diye düşük tutulur.
export const ELIMINATION_TARGET: Record<string, number> = {
  easy: 1,
  medium: 1,
  hard: 2,
};

export type EvidencePlacement =
  | { type: 'LOCATION'; locationId: string }
  | { type: 'TESTIMONY'; npcId: string };

export interface CasePlan {
  culpritId: string;
  innocentIds: string[];
  murderStyle: MurderStyle;
  // Olay yerinin görünüşü ipucunun gerçekliğinden bağımsızdır; ezberlenecek bir işaret olmasın diye
  sceneState: SceneState;
  // Cinayetin işlendiği yer: evrenin olay yerlerinden biri (universes/*.ts crimeScenes)
  crimeSceneId: string;
  crimeSceneClue: {
    authentic: boolean;
    // Gerçek izde havuzdan seçilen sabit metin; tuzakta metni yapay zekâ yazar
    poolClueId: string | null;
    poolClueText: string | null;
    // İzin işaret ettiği şüpheliler (o vakadaki şüpheliler arasından)
    implicatedNpcIds: string[];
    // İpucu doğru yorumlanınca elenen şüpheliler: gerçek izde işaret edilmeyenler,
    // tuzakta suçlu gösterilmeye çalışılanlar
    eliminatedNpcIds: string[];
  };
  // İpucunun gerçek mi tuzak mı olduğunu kanıtlayan ikinci kanıt ve nerede bulunacağı
  verification: {
    kind: 'CORROBORATION' | 'FLAW';
    placement: EvidencePlacement;
    // Yanılabilen tanıklık: tanık katili adıyla değil bir eşkâlle anlatır (ör. "deri önlüklü, aksayan biri").
    // Tarif bu şüphelilerin hepsine uyar; katil içlerindedir. Eski vakalarda yoktur (tanık katili adıyla söyler).
    witnessDescriptionFits?: string[];
  };

  // --- Vaka Motoru v2 (eski vakalarda yok) ---
  // Cinayet aleti (case-catalog.ts WEAPONS), motif ve ölüm saati: oyun sonu raporunda bu kimliklerle puanlanır
  weaponId?: string;
  motive?: MotiveId;
  timeOfDeath?: TimeOfDeath;
  // Her masumun cinayetle bağı: sırlar soruşturmaya bir parça ekler
  involvements?: Involvement[];
  // Kişiliğe göre itiraf eşiği
  fearThresholds?: Record<string, number>;
}

export interface Involvement {
  npcId: string;
  kind: InvolvementKind;
  // Bağın ilgili olduğu kişi: tanığın o saatte başka yerde gördüğü masum, bilmeden yardım edilen katil,
  // kurbanın son konuşmada korktuğunu söylediği kişi, tamamen masumun mazeretini doğrulayan kişi
  aboutNpcId?: string;
}

// Masumların kaçı tamamen masum (cinayetle hiç bağı yok)
export const FULLY_INNOCENT_COUNT: Record<string, number> = {
  easy: 1,
  medium: 1,
  hard: 2,
};

// Tanığın tarifinin uyduğu şüpheli sayısı (katil dahil)
export const WITNESS_DESCRIPTION_FITS: Record<string, number> = {
  easy: 2,
  medium: 3,
  hard: 3,
};

// Zorluğa göre en az emek: en ucuz çözüm en az bu kadar arama izni istemeli. Çözücü hangi mekânın
// aranacağını bilerek seçtiği için bu, oyuncunun gerçek emeğinin alt sınırıdır. Zorda 2 izin şartını
// hiçbir plan karşılayamıyor (her zaman tek izinlik bir yol kalıyor); zoru daha çok şüpheli, daha geniş
// eşkâl ve iki tamamen masum NPC ayırır.
export const MIN_WARRANTS: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 1,
};

// Kodla seçilen planın çözülebilir ve tek kanıta bağlı olmaması için en çok kaç kez yeniden çekileceği
export const MAX_PLAN_ATTEMPTS = 60;

type Rng = () => number;

const logger = new Logger('CasePlanner');

const pick = <T>(items: T[], rng: Rng): T =>
  items[Math.floor(rng() * items.length)];

const sample = <T>(items: T[], count: number, rng: Rng): T[] => {
  const pool = [...items];
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return result;
};

// Gerçek iz için uygun ipuçları: suçluyu da gösterir ve o vakadaki şüphelilerden
// tam olarak (şüpheli sayısı - eleme hedefi) kişiyi işaret eder
export function findAuthenticClues(
  pool: ClueDefinition[],
  activeIds: string[],
  culpritId: string,
  target: number,
): ClueDefinition[] {
  return pool.filter((clue) => {
    const implicated = clue.associatedNpcIds.filter((id) =>
      activeIds.includes(id),
    );
    return (
      implicated.includes(culpritId) &&
      implicated.length === activeIds.length - target
    );
  });
}

// Vakayı kodla planlar ve çözücüden geçirir: plan çözülemiyorsa ya da tek bir kanıta bağlıysa
// yapay zekâ çağrılmadan yeniden çekilir. Hiçbiri geçemezse en son plan döner (testler bunun olmadığını garanti eder).
export function planCase(
  scenarioConfig: ScenarioConfig,
  difficulty: string,
  rng: Rng = Math.random,
): CasePlan {
  // Cinayet tarzı bir kez seçilir ve sabit kalır: yeniden çekme, sağlam çıkması kolay olan tarzı kayırmasın
  const murderStyle: MurderStyle = rng() < 0.6 ? 'HURRIED' : 'PLANNED';
  let plan: CasePlan | null = null;
  for (let attempt = 0; attempt < MAX_PLAN_ATTEMPTS; attempt++) {
    // Önce aynı temel vaka için sırlar ve ayrıntılar yeniden çekilir, olmazsa temel vaka da yenilenir
    const base = planBaseCase(scenarioConfig, difficulty, rng, murderStyle);
    for (let detail = 0; detail < DETAIL_ATTEMPTS; detail++) {
      plan = withCaseDetails(base, scenarioConfig, difficulty, rng);
      if (isPlanSound(plan, difficulty)) return plan;
    }
  }
  // Olmamalı (testler her evren ve zorlukta sağlam plan bulunduğunu garanti eder); olursa görünür olsun
  logger.warn(
    `Sağlam plan bulunamadı (${scenarioConfig.scenarioType}/${difficulty}/${murderStyle}); son taslak kullanılıyor.`,
  );
  return plan!;
}

const DETAIL_ATTEMPTS = 8;

// Olay yeri izi ve beden her zaman elde olduğu için kritik sayılmaz; geri kalan hiçbir kanıt tek başına
// vakayı taşımamalı (en az iki bağımsız yol)
const ALWAYS_AVAILABLE = new Set(['crime_scene', 'body']);

// Sağlam plan: çözülebilir, zorluğa yetecek kadar emek ister ve tek bir kanıta bağlı değildir
export function isPlanSound(plan: CasePlan, difficulty?: string): boolean {
  const graph = buildCaseGraph(plan);
  const solution = solveCase(graph);
  if (!solution.solvable) return false;
  const minWarrants = difficulty ? (MIN_WARRANTS[difficulty] ?? 0) : 0;
  if (solution.warrantsUsed.length < minWarrants) return false;
  return criticalPoints(graph).every((id) => ALWAYS_AVAILABLE.has(id));
}

// Çözücüden geçmemiş tek bir plan taslağı (tanı ve testler için)
export function planCaseDraft(
  scenarioConfig: ScenarioConfig,
  difficulty: string,
  rng: Rng = Math.random,
): CasePlan {
  const murderStyle: MurderStyle = rng() < 0.6 ? 'HURRIED' : 'PLANNED';
  const base = planBaseCase(scenarioConfig, difficulty, rng, murderStyle);
  return withCaseDetails(base, scenarioConfig, difficulty, rng);
}

// Temel vakaya v2 ayrıntılarını ekler: silah, motif, ölüm saati, sırlar ve kişiliğe göre eşik
function withCaseDetails(
  base: CasePlan,
  scenarioConfig: ScenarioConfig,
  difficulty: string,
  rng: Rng,
): CasePlan {
  const weapons = WEAPONS[scenarioConfig.scenarioType];
  // Aceleyle işlenen cinayette katil elinin altındakini kullanır; zehir gibi hazırlık isteyenler planlıdır
  const weaponPool =
    base.murderStyle === 'HURRIED'
      ? weapons.filter((w) => w.improvised)
      : weapons;
  return {
    ...base,
    weaponId: pick(weaponPool, rng).id,
    motive: pick(MOTIVES, rng),
    timeOfDeath: pick(TIMES_OF_DEATH, rng),
    involvements: planInvolvements(base, difficulty, rng),
    fearThresholds: Object.fromEntries(
      scenarioConfig.npcDefinitions.map((npc) => [
        npc.id,
        npc.temperament
          ? TEMPERAMENT_THRESHOLD[npc.temperament]
          : DEFAULT_FEAR_THRESHOLD,
      ]),
    ),
  };
}

// Mekâna bağlı sırlar (ipucu o kişinin mekânında durur); doğrulayan kanıtın konduğu mekânda olamazlar
const LOCATION_BOUND: InvolvementKind[] = [
  'SHARED_MOTIVE',
  'UNWITTING_HELP',
  'SCAVENGER',
];
const LINKED_KINDS: InvolvementKind[] = [
  'WITNESS',
  'SHARED_MOTIVE',
  'UNWITTING_HELP',
  'SCAVENGER',
  'LAST_CONVERSATION',
];

// Masumlara cinayetle bağlı sırlar dağıtır. Doğrulayan kanıtın tanığı kendi rolünü taşır;
// kalanlardan bazıları tamamen masumdur, diğerleri birbirinden farklı birer bağ alır.
export function planInvolvements(
  plan: Pick<CasePlan, 'culpritId' | 'innocentIds' | 'verification'>,
  difficulty: string,
  rng: Rng,
): Involvement[] {
  const { culpritId, innocentIds, verification } = plan;
  const { placement } = verification;
  const result: Involvement[] = [];

  const witnessId = placement.type === 'TESTIMONY' ? placement.npcId : null;
  if (witnessId) {
    result.push({
      npcId: witnessId,
      kind: 'WITNESS',
      aboutNpcId: verification.kind === 'CORROBORATION' ? culpritId : undefined,
    });
  }

  const rest = sample(
    innocentIds.filter((id) => id !== witnessId),
    innocentIds.length,
    rng,
  );
  const noneCount = Math.min(
    FULLY_INNOCENT_COUNT[difficulty] ?? FULLY_INNOCENT_COUNT.easy,
    rest.length,
  );
  const others = (id: string) => innocentIds.filter((other) => other !== id);
  let kinds = sample(LINKED_KINDS, LINKED_KINDS.length, rng);

  // Tamamen masumun mazeretini başka bir masum doğrular ("o gece benimleydi"). İki tamamen masum
  // varsa birbirlerinin eşidir: zincir kurulursa (A, B ile; C, A ile) yapay zekâ üçünü tek mazerette
  // birleştiriyor, mazeret satırları birbiriyle çelişiyordu (oyun testinde görüldü).
  const noneIds = rest.slice(0, noneCount);
  const partnerOf = (npcId: string) =>
    noneIds.length >= 2
      ? noneIds[(noneIds.indexOf(npcId) + 1) % 2]
      : pick(others(npcId), rng);

  rest.forEach((npcId, i) => {
    if (i < noneCount) {
      result.push({ npcId, kind: 'NONE', aboutNpcId: partnerOf(npcId) });
      return;
    }
    const verificationHere =
      placement.type === 'LOCATION' && placement.locationId === npcId;
    const kind =
      kinds.find((k) => !(verificationHere && LOCATION_BOUND.includes(k))) ??
      'LAST_CONVERSATION';
    kinds = kinds.filter((k) => k !== kind);
    const aboutNpcId =
      kind === 'WITNESS'
        ? pick(others(npcId), rng)
        : kind === 'UNWITTING_HELP' || kind === 'LAST_CONVERSATION'
          ? culpritId
          : undefined;
    result.push({ npcId, kind, aboutNpcId });
  });

  return result;
}

function planBaseCase(
  scenarioConfig: ScenarioConfig,
  difficulty: string,
  rng: Rng,
  murderStyle: MurderStyle,
): CasePlan {
  const activeIds = scenarioConfig.npcDefinitions.map((npc) => npc.id);
  const target = ELIMINATION_TARGET[difficulty] ?? ELIMINATION_TARGET.easy;
  const culpritId = pick(activeIds, rng);
  const innocentIds = activeIds.filter((id) => id !== culpritId);
  const sceneState: SceneState = rng() < 0.5 ? 'MESSY' : 'TIDY';

  let crimeSceneClue: CasePlan['crimeSceneClue'];
  let verification: CasePlan['verification'];

  if (murderStyle === 'HURRIED') {
    const candidates = findAuthenticClues(
      SCENARIO_CLUES[scenarioConfig.scenarioType],
      activeIds,
      culpritId,
      target,
    );
    if (candidates.length === 0) {
      // clues-config.ts testleri her evren/zorluk/suçlu için en az bir aday olduğunu garanti eder
      throw new Error(
        `Bilgi bütçesine uyan ipucu yok: ${scenarioConfig.scenarioType}/${difficulty}/${culpritId}`,
      );
    }
    const clue = pick(candidates, rng);
    const implicated = clue.associatedNpcIds.filter((id) =>
      activeIds.includes(id),
    );
    crimeSceneClue = {
      authentic: true,
      poolClueId: clue.id,
      poolClueText: clue.clueText,
      implicatedNpcIds: implicated,
      eliminatedNpcIds: activeIds.filter((id) => !implicated.includes(id)),
    };
    // Gerçek iz, ya katilin kendi mekânında ya da bir masumun tanıklığında doğrulanır.
    // Tanık katili adıyla değil bir eşkâlle anlatır; tarif katille birlikte birkaç kişiye uyar.
    if (rng() < 0.5) {
      verification = {
        kind: 'CORROBORATION',
        placement: { type: 'LOCATION', locationId: culpritId },
      };
    } else {
      const witnessId = pick(innocentIds, rng);
      const fitsCount =
        WITNESS_DESCRIPTION_FITS[difficulty] ?? WITNESS_DESCRIPTION_FITS.easy;
      const lookalikes = sample(
        innocentIds.filter((id) => id !== witnessId),
        fitsCount - 1,
        rng,
      );
      verification = {
        kind: 'CORROBORATION',
        placement: { type: 'TESTIMONY', npcId: witnessId },
        witnessDescriptionFits: [culpritId, ...lookalikes],
      };
    }
  } else {
    // Tuzak, katilin suçlu göstermeye çalıştığı belirli kişileri işaret eder
    const framed = sample(innocentIds, target, rng);
    crimeSceneClue = {
      authentic: false,
      poolClueId: null,
      poolClueText: null,
      implicatedNpcIds: framed,
      eliminatedNpcIds: framed,
    };
    // Tuzağın kusuru: suçlanan kişi eşyasının çalındığını anlatır, eşyanın alındığı yer
    // onun mekânında bulunur ya da başka bir masum birinin onu aldığını görmüştür
    const others = innocentIds.filter((id) => !framed.includes(id));
    const options: EvidencePlacement[] = [
      { type: 'TESTIMONY', npcId: framed[0] },
      { type: 'LOCATION', locationId: framed[0] },
      ...(others.length > 0
        ? [{ type: 'TESTIMONY' as const, npcId: pick(others, rng) }]
        : []),
    ];
    verification = { kind: 'FLAW', placement: pick(options, rng) };
  }

  // En sonda seçilir: önceki kararların rastgele sırası değişmesin
  const crimeSceneId = pick(scenarioConfig.crimeScenes, rng).id;

  return {
    culpritId,
    innocentIds,
    murderStyle,
    sceneState,
    crimeSceneId,
    crimeSceneClue,
    verification,
  };
}

// Oturuma kaydedilen vaka gerçekleri: kodun planı + yapay zekânın yazdığı ayrıntılar
export interface CaseFacts extends CasePlan {
  version: 1;
  crimeSceneClueText: string;
  verificationText: string;
  victim: { name: string; profession: string };
  // Her masumun temize çıkma yolu: itiraf ettiği sır aynı zamanda mazeretidir
  alibis: Record<string, string>;
  // Yanılabilen tanıklık: tanığın gördüğü kişinin eşkâli (yapay zekâ yazar, kod uyduğu şüphelileri seçer)
  witnessDescription?: string;
  // Katilin örtü hikâyesi: korkusu eşiğe varınca "itiraf" diye anlattığı yalan mazeret ve küçük sır.
  // Eskiden yalnızca katil kırılmıyordu; kırılmayan tek kişi olması onu ele veriyordu.
  culpritCover?: string;
}

// Oturumun olay yeri id'si; olay yeri seçimi eklenmeden önce açılan vakalarda yoktur
export function crimeSceneIdOf(caseFacts: unknown): string | undefined {
  const id = (caseFacts as Partial<CaseFacts> | null)?.crimeSceneId;
  return typeof id === 'string' ? id : undefined;
}
