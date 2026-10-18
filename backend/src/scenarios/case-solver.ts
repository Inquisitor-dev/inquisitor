import type { CaseGraph, ClueNode } from './case-graph';

// Çözülebilirlik çözücüsü: oyuncunun yapabileceği her şeyi (olay yerine bakmak, konuşmak, arama izniyle
// mekân aramak, kanıt göstererek korkutmak) taklit eder ve vakanın tek şüpheliye inip inmediğini söyler.
// Yapay zekâ çağrılmadan önce çalışır; çözülemeyen plan kodla elenir, bedava ve milisaniyeler içinde.

export interface SolveResult {
  solvable: boolean;
  // Çözüm için en az kaç ve hangi mekânlarda arama izni gerekti (çözülemezse en iyi deneme)
  warrantsUsed: string[];
  // Ulaşılan kanıtlar ve çıkarımlar
  clues: string[];
  deductions: string[];
  // Elenemeyen şüpheliler (çözülebilirse yalnızca katil)
  remaining: string[];
  // Katil, eleme yerine doğrudan bir kanıtla mı gösterildi?
  identified: boolean;
}

interface Reach {
  clues: Set<string>;
  deductions: string[];
  eliminated: Set<string>;
  identified: string | null;
}

function accessible(
  clue: ClueNode,
  have: Set<string>,
  searchable: Set<string>,
  pressure: (npcId: string) => number,
  graph: CaseGraph,
): boolean {
  if (!clue.requires.every((id) => have.has(id))) return false;
  switch (clue.source.kind) {
    case 'CRIME_SCENE':
    case 'TESTIMONY':
      return true;
    case 'LOCATION':
      return searchable.has(clue.source.locationId);
    case 'CONFESSION': {
      const { npcId } = clue.source;
      // Katil asla itiraf etmez
      if (npcId === graph.culpritId) return false;
      return pressure(npcId) >= (graph.fearThreshold[npcId] ?? Infinity);
    }
  }
}

// Verilen mekânlar aranabiliyorken oyuncunun ulaşabileceği her şey (sabit nokta)
function reach(
  graph: CaseGraph,
  searchable: Set<string>,
  removed: Set<string>,
): Reach {
  const have = new Set<string>();
  const byId = new Map(graph.clues.map((c) => [c.id, c]));
  // Her kanıt bir karaktere bir kez gösterilebilir; elimizdeki kanıtların o karaktere toplam baskısı
  const pressure = (npcId: string) =>
    (graph.startFear[npcId] ?? 0) +
    [...have].reduce((sum, id) => {
      const p = byId.get(id)?.pressures.find((x) => x.npcId === npcId);
      return sum + (p?.amount ?? 0);
    }, 0);

  let changed = true;
  while (changed) {
    changed = false;
    for (const clue of graph.clues) {
      if (have.has(clue.id) || removed.has(clue.id)) continue;
      if (accessible(clue, have, searchable, pressure, graph)) {
        have.add(clue.id);
        changed = true;
      }
    }
  }

  const eliminated = new Set<string>();
  for (const id of have)
    byId.get(id)!.eliminates.forEach((n) => eliminated.add(n));
  const deductions: string[] = [];
  let identified: string | null = null;
  for (const d of graph.deductions) {
    if (removed.has(d.id) || !d.requires.every((id) => have.has(id))) continue;
    deductions.push(d.id);
    d.eliminates.forEach((n) => eliminated.add(n));
    if (d.identifies) identified = d.identifies;
  }
  return { clues: have, deductions, eliminated, identified };
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  return items.flatMap((item, i) =>
    combinations(items.slice(i + 1), size - 1).map((rest) => [item, ...rest]),
  );
}

export function solveCase(
  graph: CaseGraph,
  options: { removed?: string[] } = {},
): SolveResult {
  const removed = new Set(options.removed ?? []);
  const locations = [
    ...new Set(
      graph.clues.flatMap((c) =>
        c.source.kind === 'LOCATION' ? [c.source.locationId] : [],
      ),
    ),
  ];

  let best: { warrants: string[]; r: Reach } | null = null;
  // Önce izinsiz, sonra 1, 2... izinle dene: ilk çözüm en az izinli olandır
  for (
    let size = 0;
    size <= Math.min(graph.warrantLimit, locations.length);
    size++
  ) {
    for (const warrants of combinations(locations, size)) {
      const r = reach(graph, new Set(warrants), removed);
      // Yanlış kişiyi gösteren ya da katili eleyen bir grafik tutarsızdır; çözüm sayılmaz
      if (r.eliminated.has(graph.culpritId)) continue;
      if (r.identified && r.identified !== graph.culpritId) continue;
      const remaining = graph.suspects.filter((s) => !r.eliminated.has(s));
      const solved = r.identified === graph.culpritId || remaining.length === 1;
      if (solved) return result(graph, warrants, r, true);
      if (
        !best ||
        remaining.length < graph.suspects.length - best.r.eliminated.size
      ) {
        best = { warrants, r };
      }
    }
  }
  return best
    ? result(graph, best.warrants, best.r, false)
    : result(
        graph,
        [],
        {
          clues: new Set(),
          deductions: [],
          eliminated: new Set(),
          identified: null,
        },
        false,
      );
}

function result(
  graph: CaseGraph,
  warrants: string[],
  r: Reach,
  solvable: boolean,
): SolveResult {
  return {
    solvable,
    warrantsUsed: warrants,
    clues: [...r.clues],
    deductions: r.deductions,
    remaining: graph.suspects.filter((s) => !r.eliminated.has(s)),
    identified: r.identified === graph.culpritId,
  };
}

// Tek başına çıkarılınca vakayı çözülemez yapan kanıt ve çıkarımlar. Boşsa vakanın
// birbirinden bağımsız en az iki çözüm yolu var demektir (V2 hedefi).
export function criticalPoints(graph: CaseGraph): string[] {
  const ids = [
    ...graph.clues.map((c) => c.id),
    ...graph.deductions.map((d) => d.id),
  ];
  const base = solveCase(graph);
  if (!base.solvable) return ids;
  // Bulunan çözümün hiç ulaşmadığı bir kanıt çıkarılsa o çözüm yine geçerlidir; yalnızca
  // çözümde elde edilenler denenir (her biri için grafiği baştan çözmek yerine)
  const used = new Set([...base.clues, ...base.deductions]);
  return ids.filter(
    (id) => used.has(id) && !solveCase(graph, { removed: [id] }).solvable,
  );
}
