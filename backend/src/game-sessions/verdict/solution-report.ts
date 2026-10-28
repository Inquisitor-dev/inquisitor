import type { CaseFacts } from '../../scenarios/case-setup';
import {
  buildCaseGraph,
  BODY_CLUE_ID,
  CRIME_SCENE_CLUE_ID,
  VERIFICATION_CLUE_ID,
  alibiClueId,
  confessionClueId,
  locationClueId,
  testimonyClueId,
  type CaseGraph,
  type ClueNode,
} from '../../scenarios/case-graph';
import { solutionPaths } from '../../scenarios/solution-paths';
import { reluctantOf, warrantLimitOf } from '../../scenarios/wildcards';

// Sonuç ekranının "çözüm yolları": vakayı çözen kanıt zincirleri, oyuncunun bulduklarıyla işaretli.
// Metinler koddan gelir; yalnızca vaka bittikten sonra (WON/LOST) gönderilir.

export interface SolutionStep {
  clueId: string;
  // Kanıtın adı ve nasıl elde edildiği
  label: string;
  how: string;
  // Tek başına akladığı şüpheliler
  clears: string[];
  // Oyuncu bu vakada bu kanıtı buldu mu
  found: boolean;
}

export interface DescribedSolutionPath {
  steps: SolutionStep[];
  // Kanıtların birlikte söyledikleri
  conclusions: string[];
  // Yolun son cümlesi: katil nasıl ortaya çıkar
  finale: string;
  warrants: number;
  found: number;
  completed: boolean;
}

export interface SolutionReport {
  paths: DescribedSolutionPath[];
}

type EvidenceRef = { kind: string; sourceId: string };

// Oyuncunun bulduğu bir kanıtın grafikteki karşılığı (evidence.ts kayıt kuralları)
export function graphClueIdsOf(e: EvidenceRef, facts: CaseFacts): string[] {
  switch (e.kind) {
    case 'CLUE':
      return [
        e.sourceId === 'crime_scene'
          ? CRIME_SCENE_CLUE_ID
          : locationClueId(e.sourceId),
      ];
    case 'VERIFICATION':
      return [VERIFICATION_CLUE_ID];
    case 'BODY':
      return [BODY_CLUE_ID];
    case 'CONFESSION':
      return [confessionClueId(e.sourceId)];
    case 'TESTIMONY':
      return [testimonyClueId(e.sourceId)];
    case 'ALIBI':
      // Mazereti anlatan kişi kaydın kaynağıdır; grafik kanıtı aklanan kişinin adıyla tutar
      return (facts.involvements ?? [])
        .filter((i) => i.kind === 'NONE' && i.aboutNpcId === e.sourceId)
        .map((i) => alibiClueId(i.npcId));
    default:
      return [];
  }
}

export interface SolutionReportInput {
  facts: CaseFacts;
  evidence: EvidenceRef[];
  nameOf: (npcId: string) => string;
  placeOf: (locationId: string) => string;
}

const list = (names: string[]) => names.join(', ');

export function buildSolutionReport({
  facts,
  evidence,
  nameOf,
  placeOf,
}: SolutionReportInput): SolutionReport {
  // Eski vakaların planı yoktur
  if (!facts?.culpritId || !facts.verification || !facts.crimeSceneClue)
    return { paths: [] };
  const graph = buildCaseGraph(facts, {
    warrantLimit: warrantLimitOf(facts),
  });
  const owned = new Set(evidence.flatMap((e) => graphClueIdsOf(e, facts)));
  const byId = new Map(graph.clues.map((c) => [c.id, c]));
  const culprit = nameOf(facts.culpritId);

  const paths = solutionPaths(graph).map((path) => {
    const inPath = new Set(path.clues);
    const steps = path.clues.map((id) => {
      const clue = byId.get(id)!;
      return {
        clueId: id,
        ...describeClue(clue, graph, inPath, facts, nameOf, placeOf),
        clears: clue.eliminates.map(nameOf),
        found: owned.has(id),
      };
    });
    const conclusions = path.deductions.flatMap((id) => {
      const text = describeDeduction(id, graph, nameOf, culprit);
      return text ? [text] : [];
    });
    const found = steps.filter((s) => s.found).length;
    return {
      steps,
      conclusions,
      finale: path.identified
        ? `Kanıtlar doğrudan ${culprit} kişisini gösterir.`
        : `Geriye yalnızca ${culprit} kalır.`,
      warrants: path.warrants.length,
      found,
      completed: found === steps.length,
    };
  });
  return { paths };
}

function describeClue(
  clue: ClueNode,
  graph: CaseGraph,
  inPath: Set<string>,
  facts: CaseFacts,
  nameOf: (id: string) => string,
  placeOf: (id: string) => string,
): { label: string; how: string } {
  const labelOf = (id: string) => {
    const c = graph.clues.find((x) => x.id === id);
    return c
      ? describeClue(c, graph, inPath, facts, nameOf, placeOf).label
      : id;
  };
  const source = clue.source;
  // Konuşmadan önce gerekenler: Suskun Tanık beklediği kanıt gösterilince konuşur, öbürleri
  // olay yerini görmüş birine anlatır
  const talk = (npcId: string, ask: string) => {
    const npc = nameOf(npcId);
    const reluctant = reluctantOf(facts);
    if (clue.id === VERIFICATION_CLUE_ID && reluctant?.npcId === npcId) {
      const awaited =
        reluctant.requires === 'BODY' ? BODY_CLUE_ID : CRIME_SCENE_CLUE_ID;
      return `${npc} ile konuş; ${ask} ve ona şunu göster: ${labelOf(awaited)}.`;
    }
    return clue.requires.length
      ? `Önce şunu bul: ${list(clue.requires.map(labelOf))}. Sonra ${npc} ile konuş, ${ask}.`
      : `${npc} ile konuş, ${ask}.`;
  };
  if (clue.id === CRIME_SCENE_CLUE_ID)
    return { label: 'Olay yerindeki iz', how: 'Olay yerine bak.' };
  if (clue.id === BODY_CLUE_ID)
    return {
      label: 'Örtünün altındaki yara',
      how: 'Olay yerinde bedeni incele.',
    };
  if (clue.id === VERIFICATION_CLUE_ID) {
    if (source.kind === 'LOCATION')
      return {
        label: `${placeOf(source.locationId)}: izi doğrulayan kanıt`,
        how: `Arama izni al ve ${placeOf(source.locationId)} mekânını ara.`,
      };
    if (source.kind === 'TESTIMONY')
      return {
        label: `${nameOf(source.npcId)}: o gece gördükleri`,
        how: talk(source.npcId, 'o geceyi sor'),
      };
  }
  switch (source.kind) {
    case 'LOCATION':
      return {
        label: `${placeOf(source.locationId)}: gizli ipucu`,
        how: `Arama izni al ve ${placeOf(source.locationId)} mekânını ara.`,
      };
    case 'CONFESSION': {
      // Yoldaki hangi kanıtlar onu korkutur
      const pressing = graph.clues
        .filter(
          (c) =>
            inPath.has(c.id) &&
            c.pressures.some((p) => p.npcId === source.npcId),
        )
        .map((c) => labelOf(c.id));
      return {
        label: `${nameOf(source.npcId)}: itiraf`,
        how: pressing.length
          ? `Ona kanıt gösterip korkusunu eşiğe çıkar (${list(pressing)}).`
          : 'Ona kanıt gösterip korkusunu eşiğe çıkar.',
      };
    }
    case 'TESTIMONY': {
      const npc = nameOf(source.npcId);
      if (clue.id.startsWith('alibi:')) {
        const cleared = nameOf(clue.id.slice('alibi:'.length));
        return {
          label: `${npc}: ${cleared} ile birlikteydi`,
          how: talk(source.npcId, 'o geceyi sor'),
        };
      }
      const kind = facts.involvements?.find(
        (i) => i.npcId === source.npcId,
      )?.kind;
      return {
        label:
          kind === 'LAST_CONVERSATION'
            ? `${npc}: kurbanla son konuşma`
            : `${npc}: o gece gördükleri`,
        how: talk(
          source.npcId,
          kind === 'LAST_CONVERSATION' ? 'kurbanı sor' : 'olay yerini sor',
        ),
      };
    }
    default:
      return { label: clue.id, how: '' };
  }
}

function describeDeduction(
  id: string,
  graph: CaseGraph,
  nameOf: (id: string) => string,
  culprit: string,
): string | null {
  const d = graph.deductions.find((x) => x.id === id);
  if (!d) return null;
  const cleared = list(d.eliminates.map(nameOf));
  if (id === 'trace-is-genuine')
    return cleared
      ? `Doğrulayan kanıt izin gerçek olduğunu gösterir; ize uymayanlar aklanır: ${cleared}.`
      : 'Doğrulayan kanıt izin gerçek olduğunu gösterir.';
  if (id === 'trace-is-planted')
    return cleared
      ? `Doğrulayan kanıt izin kurulmuş bir tuzak olduğunu gösterir; suçlanmak istenenler aklanır: ${cleared}.`
      : 'Doğrulayan kanıt izin kurulmuş bir tuzak olduğunu gösterir.';
  if (id === 'witness-description')
    return cleared ? `Tanığın tarifine uymayanlar aklanır: ${cleared}.` : null;
  if (id === 'verification-points-at-culprit')
    return d.requires.includes(CRIME_SCENE_CLUE_ID)
      ? `Doğrulayan kanıt izle eşleşir ve ${culprit} kişisini gösterir.`
      : `Doğrulayan kanıt ${culprit} kişisini gösterir.`;
  if (id.startsWith('weapon-chain:')) {
    const helper = nameOf(id.slice('weapon-chain:'.length));
    return `${helper} aleti kime verdiğini söyler; yara bu aletle uyuşur ve ${culprit} kişisini gösterir.`;
  }
  return cleared ? `Aklananlar: ${cleared}.` : null;
}
