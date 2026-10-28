// Küçük wildcard'lar (Vaka Motoru v2, docs/wildcard-tasarimi.md): vakanın ayarını değiştiren, kodla
// seçilen ve çözücüden geçen çeşniler. Metinlerin hepsi koddan gelir; yapay zekâ çağrılmaz.
import type { CaseGraph } from './case-graph';
import {
  BODY_CLUE_ID,
  CRIME_SCENE_CLUE_ID,
  alibiClueId,
  confessionClueId,
  locationClueId,
  testimonyClueId,
} from './case-graph';
import type { MotiveId } from './case-catalog';

type Rng = () => number;

export type WildcardKind =
  // Bir şüpheli 3. sabah kasabadan ayrılır, sonra sorgulanamaz (katil olamaz)
  | 'LEFT'
  // Bir gün bayram ya da yasak yüzünden sabah kaybedilir (iki zaman dilimi)
  | 'SHORT_DAY'
  // Doğrulanmamış bir söylenti dolaşır; hedefi katil dahil herkes olabilir
  | 'RUMOR'
  // Doğrulayan tanık, belli bir kanıt kendisine gösterilmeden konuşmaz
  | 'RELUCTANT'
  // Bedenin üstünde motifi gösteren, kimseyi anmayan bir not
  | 'VICTIM_NOTE'
  // Vakada üçüncü bir arama izni
  | 'EXTRA_WARRANT';

export type WildcardPlan =
  | { kind: 'LEFT'; npcId: string; day: number; reasonIndex: number }
  | { kind: 'SHORT_DAY'; day: number; reasonIndex: number }
  | { kind: 'RUMOR'; npcId: string; day: number; rumorIndex: number }
  | { kind: 'RELUCTANT'; npcId: string; requires: 'CRIME_SCENE' | 'BODY' }
  | { kind: 'VICTIM_NOTE' }
  | { kind: 'EXTRA_WARRANT' };

// Vakaların yaklaşık üçte birinde bir wildcard olur
export const WILDCARD_CHANCE = 0.3;

// Zorluğa göre açık wildcard'lar: kolayda yalnızca kolaylaştıranlar, zorda yalnızca zorlaştıranlar.
// Ayrılan Tanık yalnızca ortada: ayrılan kişinin katil olamayacağı bedava bir eleme verir.
export const WILDCARDS_BY_DIFFICULTY: Record<string, WildcardKind[]> = {
  easy: ['VICTIM_NOTE', 'EXTRA_WARRANT'],
  medium: [
    'LEFT',
    'SHORT_DAY',
    'RUMOR',
    'RELUCTANT',
    'VICTIM_NOTE',
    'EXTRA_WARRANT',
  ],
  hard: ['SHORT_DAY', 'RUMOR', 'RELUCTANT'],
};

// Ayrılma sabahı: 2. gün sezdirilir, 3. ve 4. gün kişi yoktur
export const LEFT_DAY = 3;
// Kısa gün ilk ve son güne denk gelmez
export const SHORT_DAYS = [2, 3];
// Söylenti 2. sabah dolaşmaya başlar
export const RUMOR_DAY = 2;
// Kısa günün sabahı kaybedilir: gün bu zaman diliminden başlar
export const SHORT_DAY_START = 2;
export const BASE_WARRANT_LIMIT = 2;

// Ayrılma gerekçeleri (Türkçe; NPC istemine ve gazeteye girer)
export const LEFT_REASONS: Record<string, string[]> = {
  medieval: [
    'uzak bir kasabadaki hasta babasının yanına temelli dönecek',
    'kervana katılıp güneye gidecek',
  ],
  modern: [
    'eyalet dışındaki yeni işine başlamak için kasabadan taşınacak',
    'kız kardeşinin yanına yerleşmek için kasabadan ayrılacak',
  ],
  cyberpunk: [
    'şirketin yörünge istasyonuna tayin edildi, bölgeden ayrılacak',
    'sözleşmesi bitti, dış halkadaki ailesinin yanına taşınacak',
  ],
  china: [
    'başkentteki akrabasının yanına yerleşmek için yola çıkacak',
    'bir kervanla batıya, ipek yoluna gidecek',
  ],
  winter: [
    'son kervanla geçidin ötesine inecek, kışı orada geçirecek',
    'aşağı vadideki ailesinin yanına temelli dönecek',
  ],
};

// Kısa günün gerekçesi: sabah herkes bir törende ya da yasak var (Türkçe)
export const SHORT_DAY_REASONS: Record<string, string[]> = {
  medieval: [
    'Aziz günü: sabah ayini ve alay yüzünden bütün kapılar öğleye kadar kapalı',
    'Lordun habercisi geliyor: sabah bütün köy meydanda toplanacak',
  ],
  modern: [
    'Kasaba festivali: sabah geçit töreni yüzünden ana cadde öğleye kadar kapalı',
    'Eyalet valisinin ziyareti: sabah bütün dükkânlar törene kapanacak',
  ],
  cyberpunk: [
    'Şirket denetimi: sabah bütün sektörde sokağa çıkma yasağı var',
    'Şebeke bakımı: sabah metro ve kapılar öğleye kadar kapalı',
  ],
  china: [
    'Fener Bayramı hazırlığı: sabah bütün kent tapınak alayında',
    'Valinin teftişi: sabah çarşı ve dükkânlar öğleye kadar kapalı',
  ],
  winter: [
    'Kış Dönümü töreni: sabah bütün kasaba ateş başında toplanacak',
    'Tipi uyarısı: sabah kimse dışarı çıkmayacak, kapılar öğleye kadar kapalı',
  ],
};

// Söylentiler (Türkçe, kişinin adıyla başlar). Kimseyi suçlamaz, yalnızca dedikodudur.
export const RUMORS = [
  'cinayetten önceki akşam kurbanla sert bir tartışma yaşamış',
  'o gece geç saatte sokakta dolaşırken görülmüş',
  'kurbana yüklü bir borcu varmış',
  'cinayetten sonraki sabah elleri titreyerek dolaşıyormuş',
];

// Kurbanın notu motife göre (Türkçe). Kimseyi adıyla anmaz; yalnızca derdin ne olduğunu söyler.
export const VICTIM_NOTES: Record<MotiveId, string> = {
  DEBT: '“Borcunu bu hafta ödemezsen herkese anlatacağım. Bu son uyarım.”',
  JEALOUSY:
    '“Onunla görüşmeye devam edeceğim. Kıskançlığın seni hiçbir yere götürmez.”',
  REVENGE: '“O gün yaptığımı unutmadığını biliyorum. Ama özür dilemeyeceğim.”',
  SILENCE: '“Sırrını biliyorum. Susmamın bir bedeli olacak.”',
  GREED: '“Mirasın tek kuruşunu görmeyeceksin. Vasiyeti yarın değiştiriyorum.”',
  FEAR: '“Beni tehdit etmeye devam edersen yetkililere gideceğim.”',
};

const pickIndex = (length: number, rng: Rng) => Math.floor(rng() * length);
const pickFrom = <T>(items: T[], rng: Rng): T =>
  items[pickIndex(items.length, rng)];

const textsFor = (table: Record<string, string[]>, scenarioType: string) =>
  table[scenarioType] ?? table.medieval;

export const leftReason = (scenarioType: string, index: number) => {
  const reasons = textsFor(LEFT_REASONS, scenarioType);
  return reasons[index % reasons.length];
};

export const shortDayReason = (scenarioType: string, index: number) => {
  const reasons = textsFor(SHORT_DAY_REASONS, scenarioType);
  return reasons[index % reasons.length];
};

export const rumorText = (index: number) => RUMORS[index % RUMORS.length];

export interface WildcardInput {
  scenarioType: string;
  difficulty: string;
  culpritId: string;
  suspectIds: string[];
  // Vakayı taşıyan kanıtın sahibi ayrılamaz (doğrulayan kanıtın mekânı ya da tanığı)
  protectedIds: string[];
  // Doğrulayan kanıt bir tanıklıksa tanığı (Suskun Tanık yalnızca ona düşer)
  verificationWitnessId: string | null;
  hasWeapon: boolean;
  hasMotive: boolean;
  // Başka bir kapanışın (şehir dışı, kilit kırma) sahipleri ayrılamaz
  busyIds: string[];
}

// Vakaya en çok bir wildcard çeker. Çözülebilirliği değiştirenler çözücüden geçer; geçemezse wildcard
// düşer, plan yeniden çekilmez. isSound: kodun sağlam plan kuralı (case-setup.ts isGraphSound).
export function planWildcards(
  input: WildcardInput,
  graph: CaseGraph,
  isSound: (graph: CaseGraph) => boolean,
  rng: Rng = Math.random,
): WildcardPlan[] {
  if (rng() >= WILDCARD_CHANCE) return [];
  const allowed = WILDCARDS_BY_DIFFICULTY[input.difficulty] ?? [];
  const leftCandidates = input.suspectIds.filter(
    (id) =>
      id !== input.culpritId &&
      !input.protectedIds.includes(id) &&
      !input.busyIds.includes(id),
  );
  const eligible = allowed.filter((kind) => {
    switch (kind) {
      case 'LEFT':
        return leftCandidates.length > 0;
      case 'RELUCTANT':
        return !!input.verificationWitnessId;
      case 'VICTIM_NOTE':
        // Not bedenin üstünde bulunur ve motifi söyler
        return input.hasWeapon && input.hasMotive;
      default:
        return true;
    }
  });
  if (eligible.length === 0) return [];
  const kind = pickFrom(eligible, rng);

  let wildcard: WildcardPlan;
  switch (kind) {
    case 'LEFT':
      wildcard = {
        kind,
        npcId: pickFrom(leftCandidates, rng),
        day: LEFT_DAY,
        reasonIndex: pickIndex(
          textsFor(LEFT_REASONS, input.scenarioType).length,
          rng,
        ),
      };
      break;
    case 'SHORT_DAY':
      wildcard = {
        kind,
        day: pickFrom(SHORT_DAYS, rng),
        reasonIndex: pickIndex(
          textsFor(SHORT_DAY_REASONS, input.scenarioType).length,
          rng,
        ),
      };
      break;
    case 'RUMOR':
      // Hedef katil dahil herkese aynı olasılıkla düşer: söylenti kimseyi göstermez
      wildcard = {
        kind,
        npcId: pickFrom(input.suspectIds, rng),
        day: RUMOR_DAY,
        rumorIndex: pickIndex(RUMORS.length, rng),
      };
      break;
    case 'RELUCTANT':
      wildcard = {
        kind,
        npcId: input.verificationWitnessId!,
        requires: input.hasWeapon && rng() < 0.5 ? 'BODY' : 'CRIME_SCENE',
      };
      break;
    default:
      wildcard = { kind };
  }

  const checked = graphWithWildcards(graph, [wildcard]);
  return isSound(checked) ? [wildcard] : [];
}

// Wildcard'ların çözücüye etkisi. Ayrılan Tanık'ta çözücü en kötüsünü varsayar: kişinin ifadeleri,
// itirafı ve mekânı vakada hiç yokmuş gibi (oyuncu ilk iki günde onlara ulaşmamış olabilir).
export function graphWithWildcards(
  graph: CaseGraph,
  wildcards: WildcardPlan[],
): CaseGraph {
  let clues = graph.clues;
  for (const w of wildcards) {
    if (w.kind === 'LEFT') {
      const gone = new Set([
        testimonyClueId(w.npcId),
        confessionClueId(w.npcId),
        locationClueId(w.npcId),
      ]);
      clues = clues.filter(
        (c) =>
          !gone.has(c.id) &&
          !(c.source.kind === 'TESTIMONY' && c.source.npcId === w.npcId) &&
          c.id !== alibiClueId(w.npcId),
      );
    }
    if (w.kind === 'RELUCTANT') {
      const required =
        w.requires === 'BODY' ? BODY_CLUE_ID : CRIME_SCENE_CLUE_ID;
      clues = clues.map((c) =>
        c.source.kind === 'TESTIMONY' &&
        c.source.npcId === w.npcId &&
        !c.requires.includes(required)
          ? { ...c, requires: [...c.requires, required] }
          : c,
      );
    }
  }
  return { ...graph, clues };
}

export function wildcardsOf(caseFacts: unknown): WildcardPlan[] {
  const list = (caseFacts as { wildcards?: WildcardPlan[] } | null)?.wildcards;
  return Array.isArray(list) ? list : [];
}

const find = <K extends WildcardKind>(caseFacts: unknown, kind: K) =>
  wildcardsOf(caseFacts).find(
    (w): w is Extract<WildcardPlan, { kind: K }> => w.kind === kind,
  );

export const leftWildcardOf = (caseFacts: unknown) => find(caseFacts, 'LEFT');
export const shortDayOf = (caseFacts: unknown) => find(caseFacts, 'SHORT_DAY');
export const rumorOf = (caseFacts: unknown) => find(caseFacts, 'RUMOR');
export const reluctantOf = (caseFacts: unknown) => find(caseFacts, 'RELUCTANT');
export const hasVictimNote = (caseFacts: unknown) =>
  !!find(caseFacts, 'VICTIM_NOTE');

// Vakadaki arama izni sınırı (Hevesli Kadı'da bir fazla). Çözücü yine 2 izinle kurar; üçüncüsü bonustur.
export const warrantLimitOf = (caseFacts: unknown) =>
  BASE_WARRANT_LIMIT + (find(caseFacts, 'EXTRA_WARRANT') ? 1 : 0);

// Kısa günün sabahı kaybedilir
export const shortDayStart = (caseFacts: unknown, day: number) =>
  shortDayOf(caseFacts)?.day === day ? SHORT_DAY_START : 0;

// Ayrılan kişi o günden sonra kasabada değildir
export const hasLeft = (caseFacts: unknown, npcId: string, day: number) => {
  const w = leftWildcardOf(caseFacts);
  return !!w && w.npcId === npcId && day >= w.day;
};

export const victimNoteText = (motive: MotiveId | undefined) =>
  motive ? VICTIM_NOTES[motive] : null;
