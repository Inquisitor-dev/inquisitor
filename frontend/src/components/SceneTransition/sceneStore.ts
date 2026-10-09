import { create } from 'zustand';

// Geçiş ekranında gösterilen yer bilgisi
export interface Scene {
  // Küçük üst başlık (ör. "Giriyorsun", "Haritaya dönüyorsun")
  kicker: string;
  title: string;
  subtitle?: string;
  // Hedef sayfanın ana görseli; yüklenince ekranın arkasında bulanık belirir
  image?: string;
}

interface SceneTransitionState {
  scene: Scene | null;
  visible: boolean;
  // Hedef görsel(ler) yüklendi; ilerleme çizgisi dolar
  ready: boolean;
  shownAt: number;
  token: number;
}

// Ekran açıldıysa en az bu kadar kalır; yazı okunmadan kaybolmasın
const MIN_VISIBLE_MS = 900;
// Görsel yüklendikten sonra çizginin dolduğu görülsün diye kısa bekleme
const READY_HOLD_MS = 250;
// Görsel bu sürede yüklenemezse ekran yine de kapanır
const MAX_WAIT_MS = 12000;
// Hedef sayfa hiç açılmazsa (ör. ağ hatası) ekran kendiliğinden kapanır
const SAFETY_MS = 25000;

export const useSceneTransition = create<SceneTransitionState>(() => ({
  scene: null,
  visible: false,
  ready: false,
  shownAt: 0,
  token: 0,
}));

const loaded = new Set<string>();

// Görseli yükler ve çözer; hata olsa da beklemeyi bitirir
function loadImage(src: string): Promise<void> {
  if (loaded.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loaded.add(src);
      img.decode().catch(() => {}).finally(resolve);
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

function isImageCached(src: string): boolean {
  if (loaded.has(src)) return true;
  const img = new Image();
  img.src = src;
  const cached = img.complete && img.naturalWidth > 0;
  if (cached) loaded.add(src);
  return cached;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Tıklama anında ekranı açar ve hedef görseli şimdiden indirmeye başlar
export function showScene(scene: Scene) {
  const token = useSceneTransition.getState().token + 1;
  useSceneTransition.setState({ scene, visible: true, ready: false, shownAt: performance.now(), token });
  if (scene.image) void loadImage(scene.image);
  setTimeout(() => {
    if (useSceneTransition.getState().token === token) hideScene();
  }, SAFETY_MS);
}

// Kapanış animasyonu (SceneTransition.module.scss .leaving) bitince ekran DOM'dan kalkar
const LEAVE_MS = 900;

export function hideScene() {
  const { token } = useSceneTransition.getState();
  useSceneTransition.setState({ visible: false });
  setTimeout(() => {
    const state = useSceneTransition.getState();
    if (!state.visible && state.token === token) useSceneTransition.setState({ scene: null });
  }, LEAVE_MS);
}

// Hedef sayfa açılınca çağrılır: görseller yüklenene kadar ekran kalır, sonra açılır.
// Ekran açık değilse ve görseller önbellekte yoksa (ör. sayfa yenilendi) `fallback` ile açılır.
export async function revealScene(images: string[], fallback?: Scene) {
  const sources = images.filter(Boolean);
  const state = useSceneTransition.getState();
  if (!state.visible) {
    if (!fallback || sources.every(isImageCached)) return;
    showScene(fallback);
  }
  const { token, shownAt } = useSceneTransition.getState();

  await Promise.race([Promise.all(sources.map(loadImage)), wait(MAX_WAIT_MS)]);
  if (useSceneTransition.getState().token !== token) return;
  useSceneTransition.setState({ ready: true });

  await wait(Math.max(MIN_VISIBLE_MS - (performance.now() - shownAt), 0) + READY_HOLD_MS);
  if (useSceneTransition.getState().token === token) hideScene();
}
