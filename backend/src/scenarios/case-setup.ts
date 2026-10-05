import { ClueDefinition, SCENARIO_CLUES } from './clues-config';
import { ScenarioConfig } from './scenario-config';

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
  };
}

type Rng = () => number;

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

export function planCase(
  scenarioConfig: ScenarioConfig,
  difficulty: string,
  rng: Rng = Math.random,
): CasePlan {
  const activeIds = scenarioConfig.npcDefinitions.map((npc) => npc.id);
  const target = ELIMINATION_TARGET[difficulty] ?? ELIMINATION_TARGET.easy;
  const culpritId = pick(activeIds, rng);
  const innocentIds = activeIds.filter((id) => id !== culpritId);
  const murderStyle: MurderStyle = rng() < 0.6 ? 'HURRIED' : 'PLANNED';
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
    // Gerçek iz, ya katilin kendi mekânında ya da bir masumun tanıklığında doğrulanır
    verification = {
      kind: 'CORROBORATION',
      placement:
        rng() < 0.5
          ? { type: 'LOCATION', locationId: culpritId }
          : { type: 'TESTIMONY', npcId: pick(innocentIds, rng) },
    };
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

  return {
    culpritId,
    innocentIds,
    murderStyle,
    sceneState,
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
}
