import type { CaseGraph, ClueNode } from './case-graph';
import { solveCase } from './case-solver';

// Oyun sonu "çözüm yolları": vakayı çözen en kısa kanıt zincirleri. Çözücünün bulduğu çözümden
// gereksiz her kanıt atılır (en küçük yol); sonra o yolun her kanıtı tek tek yasaklanıp başka yollar
// aranır. Sonuç yalnızca vaka bittikten sonra oyuncuya gösterilir.

export interface SolutionPath {
  // Grafikteki kanıt id'leri, elde edilme sırasıyla
  clues: string[];
  // Yolda kurulan çıkarımlar
  deductions: string[];
  // Arama izni gereken mekânlar
  warrants: string[];
  // Katil bir kanıtla mı gösterildi, yoksa geriye tek o mu kaldı
  identified: boolean;
}

export const MAX_SOLUTION_PATHS = 3;

// Önce dolaylı kanıtlar atılmaya çalışılır: kalan yol doğrudan kanıtlara dayanır
const REMOVAL_RANK: Record<ClueNode['source']['kind'], number> = {
  CONFESSION: 0,
  TESTIMONY: 1,
  LOCATION: 2,
  CRIME_SCENE: 3,
};

// Oyuncunun kanıtları elde ettiği doğal sıra (olay yeri, konuşma, arama, itiraf)
const STEP_RANK: Record<ClueNode['source']['kind'], number> = {
  CRIME_SCENE: 0,
  TESTIMONY: 1,
  LOCATION: 2,
  CONFESSION: 3,
};

function minimalPath(graph: CaseGraph, banned: string[]): SolutionPath | null {
  const removed = new Set(banned);
  if (!solveCase(graph, { removed: [...removed] }).solvable) return null;
  const order = [...graph.clues].sort(
    (a, b) => REMOVAL_RANK[a.source.kind] - REMOVAL_RANK[b.source.kind],
  );
  for (const clue of order) {
    if (removed.has(clue.id)) continue;
    removed.add(clue.id);
    if (!solveCase(graph, { removed: [...removed] }).solvable)
      removed.delete(clue.id);
  }
  const solved = solveCase(graph, { removed: [...removed] });
  const byId = new Map(graph.clues.map((c) => [c.id, c]));
  const clues = solved.clues
    .map((id) => byId.get(id)!)
    .sort((a, b) => STEP_RANK[a.source.kind] - STEP_RANK[b.source.kind])
    .map((c) => c.id);
  return {
    clues,
    deductions: solved.deductions,
    warrants: solved.warrantsUsed,
    identified: solved.identified,
  };
}

const keyOf = (path: SolutionPath) => [...path.clues].sort().join('|');

// En kısası başta olmak üzere birbirinden farklı en çok `max` çözüm yolu
export function solutionPaths(
  graph: CaseGraph,
  max = MAX_SOLUTION_PATHS,
): SolutionPath[] {
  const first = minimalPath(graph, []);
  if (!first) return [];
  const found = new Map([[keyOf(first), first]]);
  // Her kanıt yasaklanınca vakayı başka yoldan çözmek mümkün mü
  for (const id of first.clues) {
    const other = minimalPath(graph, [id]);
    if (other) found.set(keyOf(other), other);
  }
  return [...found.values()]
    .sort((a, b) => a.clues.length - b.clues.length)
    .slice(0, max);
}
