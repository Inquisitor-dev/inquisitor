import type { CaseFacts } from '../../scenarios/case-setup';
import type {
  BoardCard,
  BoardEvidence,
  BoardState,
  BoardString,
  BoardVerdict,
} from './board.types';

export interface JudgedString {
  string: BoardString;
  from: BoardCard;
  to: BoardCard;
  verdict: BoardVerdict;
}

const isCrimeSceneClue = (e: BoardEvidence) =>
  e.kind === 'CLUE' && e.sourceId === 'crime_scene';

// Şüpheli ↔ kanıt ipinin kararı
function judgeSuspectLink(
  type: 'CLEARS' | 'IMPLICATES',
  suspectId: string,
  e: BoardEvidence,
  facts: CaseFacts,
): BoardVerdict {
  const implicated = facts.crimeSceneClue.implicatedNpcIds;
  const isCulprit = suspectId === facts.culpritId;
  let clears = false;
  let implicates = false;

  if (isCrimeSceneClue(e)) {
    // İzin işaret ettiği kişiler; izin gerçek mi tuzak mı olduğu burada söylenmez
    implicates = implicated.includes(suspectId);
    clears = !implicated.includes(suspectId);
  } else if (e.kind === 'VERIFICATION') {
    if (facts.verification.kind === 'CORROBORATION') {
      // İzi doğrulayan kanıt katili gösterir
      implicates = isCulprit;
    } else {
      // Tuzağın kusuru, tuzakla suçlanan kişiyi aklar
      clears = implicated.includes(suspectId);
    }
  } else if (e.kind === 'CONFESSION') {
    // İtiraf, itiraf edenin mazeretidir
    clears = e.sourceId === suspectId;
  } else if (e.kind === 'CLUE') {
    // Mekân ipucu orada yaşayanın sırrını anlatır: masumda mazeret, katilde kapanmayan bir açık
    if (e.sourceId === suspectId) {
      clears = !isCulprit;
      implicates = isCulprit;
    }
  }

  return (type === 'CLEARS' ? clears : implicates) ? 'CORRECT' : 'WRONG';
}

// Kanıt ↔ kanıt ipinin kararı (sıra önemsiz)
function judgeEvidenceLink(
  type: 'SUPPORTS' | 'CONTRADICTS',
  a: BoardEvidence,
  b: BoardEvidence,
  facts: CaseFacts,
): BoardVerdict {
  const implicated = facts.crimeSceneClue.implicatedNpcIds;
  const pair = (test: (x: BoardEvidence, y: BoardEvidence) => boolean) =>
    test(a, b) || test(b, a);
  let relation: 'SUPPORTS' | 'CONTRADICTS' | null = null;

  if (pair((x, y) => isCrimeSceneClue(x) && y.kind === 'VERIFICATION')) {
    // Doğrulayan kanıt izi ya doğrular ya da tuzak olduğunu gösterir
    relation =
      facts.verification.kind === 'CORROBORATION' ? 'SUPPORTS' : 'CONTRADICTS';
  } else if (pair((x, y) => isCrimeSceneClue(x) && y.kind === 'CONFESSION')) {
    // İzin gösterdiği birinin mazereti izle çelişir, göstermediği birininki uyuşur
    const confession = a.kind === 'CONFESSION' ? a : b;
    relation = implicated.includes(confession.sourceId)
      ? 'CONTRADICTS'
      : 'SUPPORTS';
  } else if (
    pair(
      (x, y) =>
        x.kind === 'CONFESSION' &&
        y.kind === 'CLUE' &&
        !isCrimeSceneClue(y) &&
        y.sourceId === x.sourceId,
    )
  ) {
    // Kişinin itirafı kendi mekânındaki ipucuyla aynı sırrı anlatır
    relation = 'SUPPORTS';
  } else if (
    facts.verification.kind === 'FLAW' &&
    pair(
      (x, y) =>
        x.kind === 'VERIFICATION' &&
        y.kind === 'CONFESSION' &&
        implicated.includes(y.sourceId),
    )
  ) {
    // Tuzağın kusuru, suçlanan kişinin mazeretini destekler
    relation = 'SUPPORTS';
  }

  return relation === type ? 'CORRECT' : 'WRONG';
}

// Panodaki değerlendirilebilir iplerin hepsine karar verir
export function judgeBoard(
  board: BoardState,
  facts: CaseFacts,
  evidence: BoardEvidence[],
): JudgedString[] {
  const cards = new Map(board.cards.map((card) => [card.id, card]));
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));
  const judged: JudgedString[] = [];

  for (const string of board.strings) {
    const from = cards.get(string.from);
    const to = cards.get(string.to);
    if (!from || !to || string.type === 'LINK') continue;

    if (string.type === 'CLEARS' || string.type === 'IMPLICATES') {
      const suspect =
        from.kind === 'suspect' ? from : to.kind === 'suspect' ? to : null;
      const evCard =
        from.kind === 'evidence' ? from : to.kind === 'evidence' ? to : null;
      const e = evCard?.refId ? evidenceById.get(evCard.refId) : undefined;
      if (!suspect?.refId || !e) continue;
      judged.push({
        string,
        from,
        to,
        verdict: judgeSuspectLink(string.type, suspect.refId, e, facts),
      });
    } else {
      const a = from.refId ? evidenceById.get(from.refId) : undefined;
      const b = to.refId ? evidenceById.get(to.refId) : undefined;
      if (from.kind !== 'evidence' || to.kind !== 'evidence' || !a || !b)
        continue;
      judged.push({
        string,
        from,
        to,
        verdict: judgeEvidenceLink(string.type, a, b, facts),
      });
    }
  }
  return judged;
}

// Kararları panoya işler: değerlendirilen ipler kararını alır, diğerlerinin eski kararı silinir
export function applyVerdicts(
  board: BoardState,
  judged: JudgedString[],
): BoardState {
  const verdicts = new Map(judged.map((j) => [j.string.id, j.verdict]));
  return {
    cards: board.cards,
    strings: board.strings.map((s) => {
      const verdict = verdicts.get(s.id);
      const rest: BoardString = {
        id: s.id,
        from: s.from,
        to: s.to,
        type: s.type,
      };
      return verdict ? { ...rest, verdict } : rest;
    }),
  };
}
