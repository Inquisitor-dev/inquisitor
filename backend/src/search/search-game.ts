// Tıkla-bul aramasının saf kuralları: hedef listesinin seçimi, tıklamanın denetimi, süre ve ipucu.
// Önce listedeki nesneler bulunur, sonra asıl yer (gizli bölme); orası bulununca kanıt çıkar.
// Hiçbir kural vakaya bakmaz: liste uzunluğu, süre ve ceza yalnızca zorluğa bağlıdır.
import type { SceneBox, SearchSceneDef } from './search-scene';

export interface SearchSettings {
  targets: number;
  timeLimitMs: number;
  // Yanlış tıklamanın süreden yediği pay
  missPenaltyMs: number;
  hints: number;
  hintPenaltyMs: number;
}

export const SEARCH_SETTINGS: Record<string, SearchSettings> = {
  easy: {
    targets: 6,
    timeLimitMs: 180_000,
    missPenaltyMs: 5_000,
    hints: 2,
    hintPenaltyMs: 15_000,
  },
  medium: {
    targets: 8,
    timeLimitMs: 150_000,
    missPenaltyMs: 8_000,
    hints: 1,
    hintPenaltyMs: 15_000,
  },
  hard: {
    targets: 10,
    timeLimitMs: 120_000,
    missPenaltyMs: 10_000,
    hints: 1,
    hintPenaltyMs: 20_000,
  },
};

export const settingsFor = (difficulty: string): SearchSettings =>
  SEARCH_SETTINGS[difficulty] ?? SEARCH_SETTINGS.easy;

// Kutunun çevresine bırakılan pay: parmakla ya da kenara yakın tıklama da sayılır
export const HIT_TOLERANCE = 1.5;

export type SearchStatus = 'RUNNING' | 'WON' | 'FAILED';

// Bir mekândaki aramanın durumu (GameSession.searchState[locationId]); istemciye ham hâli gitmez.
// Mekânda bir anda tek arama olur; deneme hangi alanda yapıldığını taşır.
export interface SearchAttempt {
  areaId: string;
  attempt: number;
  targets: string[];
  found: string[];
  finalSpotId: string;
  finalFound: boolean;
  startedAt: number;
  penaltyMs: number;
  misses: number;
  hintsUsed: number;
  status: SearchStatus;
  // Başarısız arama günün bir vaktini harcar; bir kez (search.service.ts)
  timeCharged?: boolean;
}

export type SearchState = Record<string, SearchAttempt>;

export function parseSearchState(raw: unknown): SearchState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  // Alansız eski kayıtlar (alanlardan önceki düzen) yok sayılır
  return Object.fromEntries(
    Object.entries(raw as SearchState).filter(
      ([, a]) => typeof a?.areaId === 'string',
    ),
  );
}

// Oturum, mekân ve deneme numarasından tohumlanan sayı üreteci: aynı denemede aynı liste gelir
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function startAttempt(params: {
  scene: SearchSceneDef;
  difficulty: string;
  seed: string;
  attempt: number;
  now: number;
}): SearchAttempt {
  const { scene, difficulty, attempt, now } = params;
  const rng = seededRng(`${params.seed}:${attempt}`);
  const count = Math.min(settingsFor(difficulty).targets, scene.objects.length);
  const targets = shuffled(
    scene.objects.map((o) => o.id),
    rng,
  ).slice(0, count);
  const finalSpot =
    scene.finalSpots[Math.floor(rng() * scene.finalSpots.length)];
  return {
    areaId: scene.areaId,
    attempt,
    targets,
    found: [],
    finalSpotId: finalSpot.id,
    finalFound: false,
    startedAt: now,
    penaltyMs: 0,
    misses: 0,
    hintsUsed: 0,
    status: 'RUNNING',
  };
}

export function remainingMs(
  attempt: SearchAttempt,
  difficulty: string,
  now: number,
): number {
  return Math.max(
    0,
    settingsFor(difficulty).timeLimitMs -
      (now - attempt.startedAt) -
      attempt.penaltyMs,
  );
}

// Süresi dolmuş aramayı başarısız sayar (durum her okunuşta güncellenir)
export function withExpiry(
  attempt: SearchAttempt,
  difficulty: string,
  now: number,
): SearchAttempt {
  if (attempt.status !== 'RUNNING') return attempt;
  return remainingMs(attempt, difficulty, now) > 0
    ? attempt
    : { ...attempt, status: 'FAILED' };
}

export const inBox = (box: SceneBox, x: number, y: number) =>
  x >= box[0] - HIT_TOLERANCE &&
  x <= box[0] + box[2] + HIT_TOLERANCE &&
  y >= box[1] - HIT_TOLERANCE &&
  y <= box[1] + box[3] + HIT_TOLERANCE;

export type ClickOutcome =
  | { kind: 'FOUND'; objectId: string }
  | { kind: 'FINAL_FOUND' }
  | { kind: 'ALREADY_FOUND' }
  | { kind: 'MISS' }
  | { kind: 'NOT_RUNNING' };

export function applyClick(params: {
  scene: SearchSceneDef;
  attempt: SearchAttempt;
  difficulty: string;
  x: number;
  y: number;
  now: number;
}): { attempt: SearchAttempt; outcome: ClickOutcome } {
  const { scene, difficulty, x, y, now } = params;
  const current = withExpiry(params.attempt, difficulty, now);
  if (current.status !== 'RUNNING') {
    return { attempt: current, outcome: { kind: 'NOT_RUNNING' } };
  }
  const miss = (): { attempt: SearchAttempt; outcome: ClickOutcome } => {
    const next = {
      ...current,
      misses: current.misses + 1,
      penaltyMs: current.penaltyMs + settingsFor(difficulty).missPenaltyMs,
    };
    return {
      attempt: withExpiry(next, difficulty, now),
      outcome: { kind: 'MISS' },
    };
  };

  const listDone = current.found.length >= current.targets.length;
  if (listDone) {
    const spot = scene.finalSpots.find((s) => s.id === current.finalSpotId);
    if (spot && inBox(spot.box, x, y)) {
      return {
        attempt: { ...current, finalFound: true, status: 'WON' },
        outcome: { kind: 'FINAL_FOUND' },
      };
    }
    return miss();
  }

  // Üst üste binen kutularda listedeki ve henüz bulunmamış nesne öne alınır; ikisi de öyleyse küçük kutu
  // (büyük eşyanın kutusu içindeki küçük eşyayı yutmasın)
  const area = (box: SceneBox) => box[2] * box[3];
  const hits = scene.objects
    .filter((o) => inBox(o.box, x, y))
    .sort((a, b) => area(a.box) - area(b.box));
  const target = hits.find(
    (o) => current.targets.includes(o.id) && !current.found.includes(o.id),
  );
  if (target) {
    return {
      attempt: { ...current, found: [...current.found, target.id] },
      outcome: { kind: 'FOUND', objectId: target.id },
    };
  }
  if (hits.some((o) => current.found.includes(o.id))) {
    return { attempt: current, outcome: { kind: 'ALREADY_FOUND' } };
  }
  return miss();
}

export interface SearchHint {
  // Dairenin merkezi ve yarıçapı (görselin yüzdesi); nesnenin tam kutusu verilmez
  x: number;
  y: number;
  r: number;
}

// Bulunmamış bir hedefin (liste bittiyse asıl yerin) çevresini gösterir; süreden yer
export function takeHint(params: {
  scene: SearchSceneDef;
  attempt: SearchAttempt;
  difficulty: string;
  seed: string;
  now: number;
}): { attempt: SearchAttempt; hint: SearchHint } | null {
  const { scene, difficulty, now } = params;
  const current = withExpiry(params.attempt, difficulty, now);
  const settings = settingsFor(difficulty);
  if (current.status !== 'RUNNING' || current.hintsUsed >= settings.hints)
    return null;
  const rng = seededRng(
    `${params.seed}:${current.attempt}:hint:${current.hintsUsed}`,
  );
  const listDone = current.found.length >= current.targets.length;
  const box = listDone
    ? scene.finalSpots.find((s) => s.id === current.finalSpotId)?.box
    : scene.objects.find(
        (o) =>
          o.id === current.targets.filter((t) => !current.found.includes(t))[0],
      )?.box;
  if (!box) return null;
  // Merkez kaydırılır, daire nesneyi yine de içine alır
  const r = Math.max(box[2], box[3]) / 2 + 6;
  const shift = r - Math.max(box[2], box[3]) / 2;
  const angle = rng() * Math.PI * 2;
  const hint = {
    x: box[0] + box[2] / 2 + Math.cos(angle) * shift * rng(),
    y: box[1] + box[3] / 2 + Math.sin(angle) * shift * rng(),
    r,
  };
  const next = withExpiry(
    {
      ...current,
      hintsUsed: current.hintsUsed + 1,
      penaltyMs: current.penaltyMs + settings.hintPenaltyMs,
    },
    difficulty,
    now,
  );
  return { attempt: next, hint };
}

export interface SearchView {
  locationId: string;
  areaId: string;
  image: string;
  attempt: number;
  status: SearchStatus;
  // LIST: listedeki nesneler aranıyor; FINAL: asıl yer aranıyor
  stage: 'LIST' | 'FINAL';
  targets: { id: string; label: string; found: boolean }[];
  // Asıl yerin yönlendirmesi; yalnızca FINAL aşamasında
  prompt: string | null;
  remainingMs: number;
  timeLimitMs: number;
  misses: number;
  hintsLeft: number;
}

// İstemciye giden görünüm: adlar ve ilerleme; hiçbir kutu yok
export function publicView(params: {
  scene: SearchSceneDef;
  attempt: SearchAttempt;
  difficulty: string;
  now: number;
}): SearchView {
  const { scene, difficulty, now } = params;
  const attempt = withExpiry(params.attempt, difficulty, now);
  const settings = settingsFor(difficulty);
  const listDone = attempt.found.length >= attempt.targets.length;
  return {
    locationId: scene.locationId,
    areaId: scene.areaId,
    image: scene.image,
    attempt: attempt.attempt,
    status: attempt.status,
    stage: listDone ? 'FINAL' : 'LIST',
    targets: attempt.targets.map((id) => ({
      id,
      label: scene.objects.find((o) => o.id === id)?.label ?? id,
      found: attempt.found.includes(id),
    })),
    prompt: listDone
      ? (scene.finalSpots.find((s) => s.id === attempt.finalSpotId)?.prompt ??
        null)
      : null,
    remainingMs:
      attempt.status === 'RUNNING' ? remainingMs(attempt, difficulty, now) : 0,
    timeLimitMs: settings.timeLimitMs,
    misses: attempt.misses,
    hintsLeft: Math.max(0, settings.hints - attempt.hintsUsed),
  };
}

// Sahne kayıtlarının denetimi (testlerde ve işaretleme sonrası): boş dönerse sahne kullanılabilir
export function sceneProblems(scene: SearchSceneDef): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const checkBox = (id: string, box: SceneBox) => {
    const [x, y, w, h] = box;
    if (w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > 100 || y + h > 100)
      problems.push(`${id}: kutu görselin dışında`);
  };
  for (const o of scene.objects) {
    if (ids.has(o.id)) problems.push(`${o.id}: id tekrarı`);
    ids.add(o.id);
    if (!o.label.trim()) problems.push(`${o.id}: ad boş`);
    checkBox(o.id, o.box);
  }
  for (const s of scene.finalSpots) {
    if (ids.has(s.id)) problems.push(`${s.id}: id tekrarı`);
    ids.add(s.id);
    if (!s.prompt.trim()) problems.push(`${s.id}: yönlendirme boş`);
    checkBox(s.id, s.box);
  }
  const maxTargets = Math.max(
    ...Object.values(SEARCH_SETTINGS).map((s) => s.targets),
  );
  if (scene.objects.length < maxTargets)
    problems.push(`en az ${maxTargets} nesne gerekli`);
  if (scene.finalSpots.length === 0) problems.push('asıl yer yok');
  if (!scene.clueSpot.trim())
    problems.push('kanıtın yer ifadesi (clueSpot) boş');
  return problems;
}
