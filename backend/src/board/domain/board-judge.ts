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
  // "İşaret eder" ipi doğru ama kanıt birden çok şüpheliye uyuyor: iç ses "yalnız onu gösteriyor" demesin
  shared?: boolean;
}

const isCrimeSceneClue = (e: BoardEvidence) =>
  e.kind === 'CLUE' && e.sourceId === 'crime_scene';

// Vaka Motoru v2: masumun cinayetle bağı (eski vakalarda yok)
const involvementOf = (facts: CaseFacts, npcId: string) =>
  facts.involvements?.find((i) => i.npcId === npcId);

// Mazeret ifadesini veren kişinin doğruladığı tamamen masumlar
const vouchedBy = (facts: CaseFacts, npcId: string) =>
  (facts.involvements ?? [])
    .filter((i) => i.kind === 'NONE' && i.aboutNpcId === npcId)
    .map((i) => i.npcId);

// Şüpheli ↔ kanıt ipinin kararı
export function judgeSuspectLink(
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
    const fits = facts.verification.witnessDescriptionFits;
    if (facts.verification.kind === 'CORROBORATION' && fits) {
      // Yanılabilen tanıklık katili adıyla göstermez: eşkâle uyan herkesi işaret eder, uymayanları aklar.
      // Yalnızca katile "doğru" deseydi pano, tanığın söylemediği adı söylemiş olurdu.
      implicates = fits.includes(suspectId);
      clears = !fits.includes(suspectId);
    } else if (facts.verification.kind === 'CORROBORATION') {
      // İzi doğrulayan kanıt katili gösterir
      implicates = isCulprit;
    } else {
      // Tuzağın kusuru, tuzakla suçlanan kişiyi aklar
      clears = implicated.includes(suspectId);
    }
  } else if (e.kind === 'CONFESSION') {
    // İtiraf, itiraf edenin kendi anlattığı mazerettir: kendisini aklamaz, çünkü katil de kırılınca yalan bir
    // mazeret anlatır (örtü hikâyesi). Masumlar bağımsız bir kanıtla aklanır (kendi mekân ipucu, eşinin
    // doğrulaması, tanık). Tamamen masum o saatte kiminle birlikte olduğunu söyler: o kişiyi aklar.
    // Silahı bilmeden verenin itirafı aleti kime verdiğini de söyler.
    const own = involvementOf(facts, e.sourceId);
    clears = own?.kind === 'NONE' && own.aboutNpcId === suspectId;
    implicates = isCulprit && own?.kind === 'UNWITTING_HELP';
  } else if (e.kind === 'TESTIMONY') {
    // Kısmi tanık o saatte birini başka yerde görmüştür: o kişiyi aklar. Son konuşanın ifadesi kimseyi
    // adıyla söylemez, hiçbir şüpheliyi aklamaz ya da işaret etmez.
    const own = involvementOf(facts, e.sourceId);
    clears = own?.kind === 'WITNESS' && own.aboutNpcId === suspectId;
  } else if (e.kind === 'ALIBI') {
    // Mazeret doğrulaması, doğrulanan tamamen masumu aklar
    clears = vouchedBy(facts, e.sourceId).includes(suspectId);
  } else if (e.kind === 'CLUE') {
    // Mekân ipucu orada yaşayanın sırrını anlatır: masumda mazeret. Katilinkinde motif ya da şüpheli bir
    // uğraş vardır ama kişiyi suçlamaz; "işaret eder" deseydi, aranan her mekân tek iple katili söylerdi.
    if (e.sourceId === suspectId) {
      clears = !isCulprit;
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
  } else if (
    pair(
      (x, y) =>
        x.kind === 'BODY' &&
        y.kind === 'CONFESSION' &&
        involvementOf(facts, y.sourceId)?.kind === 'UNWITTING_HELP',
    )
  ) {
    // Yara, bilmeden verilen aletle uyuşur: silah zinciri
    relation = 'SUPPORTS';
  } else if (
    pair(
      (x, y) =>
        x.kind === 'ALIBI' &&
        y.kind === 'CONFESSION' &&
        vouchedBy(facts, x.sourceId).includes(y.sourceId),
    )
  ) {
    // Doğrulanan masumun kendi anlattığıyla doğrulama aynı şeyi söyler
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
  const suspects = [facts.culpritId, ...facts.innocentIds];

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
      const verdict = judgeSuspectLink(string.type, suspect.refId, e, facts);
      const shared =
        string.type === 'IMPLICATES' &&
        verdict === 'CORRECT' &&
        suspects.filter(
          (id) => judgeSuspectLink('IMPLICATES', id, e, facts) === 'CORRECT',
        ).length > 1;
      judged.push({
        string,
        from,
        to,
        verdict,
        ...(shared ? { shared } : {}),
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

// Bir "Düşün"de en fazla bu kadar yeni ip değerlendirilir. Sınır olmasaydı pano tek düşünüşte bütün
// olasılıkları dener bir kâhine dönerdi (izi her şüpheliye bağlayıp kimi gösterdiğini öğrenmek gibi).
export const MAX_STRINGS_PER_THOUGHT = 3;

// Henüz karar almamış ipler arasından bu düşünüşte değerlendirilecekler (önce kurulanlar önce)
// ve sıraya kalanların sayısı. Karar almış ipler mühürlüdür, yeniden değerlendirilmez.
export function judgePending(
  board: BoardState,
  facts: CaseFacts,
  evidence: BoardEvidence[],
  limit = MAX_STRINGS_PER_THOUGHT,
): { judged: JudgedString[]; waiting: number } {
  const pending = judgeBoard(
    { cards: board.cards, strings: board.strings.filter((s) => !s.verdict) },
    facts,
    evidence,
  );
  return {
    judged: pending.slice(0, limit),
    waiting: Math.max(0, pending.length - limit),
  };
}

// Kararları panoya işler: değerlendirilen ipler kararını alır, önceki kararlar korunur.
// Değerlendirilemeyen ipler (LINK) karar taşımaz.
export function applyVerdicts(
  board: BoardState,
  judged: JudgedString[],
): BoardState {
  const verdicts = new Map(judged.map((j) => [j.string.id, j.verdict]));
  return {
    cards: board.cards,
    strings: board.strings.map((s) => {
      const verdict =
        verdicts.get(s.id) ?? (s.type === 'LINK' ? undefined : s.verdict);
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
