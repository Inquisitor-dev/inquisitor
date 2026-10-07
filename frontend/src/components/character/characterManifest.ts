import { useEffect, useState } from 'react';
import { outfitBasePath } from '@/config/outfits';

// Ekran koordinatlarında 8 yön (y aşağı doğru artar, "south" kameraya bakar).
// Sıra açıya göredir: 0 = doğu, saat yönünde 45'er derece.
export const DIRECTIONS = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east',
] as const;

export type Direction = (typeof DIRECTIONS)[number];

// art/tools/pack_sprites.py'nin yazdığı manifest. Sheet yolları yüklenirken mutlak URL'ye çevrilir.
export type CharacterManifest = {
  id: string;
  map: {
    frameWidth: number;
    frameHeight: number;
    // Ayakların yere bastığı noktanın karedeki pikseli
    anchorX: number;
    anchorY: number;
    pxPerMeter: number;
    // Render kamerasının yere bakış açısı (derece); haritaların çizim açısına eşit
    elevation: number;
  };
  walk: {
    frames: number;
    cycleSeconds: number;
    // Bir yürüme döngüsünde (iki adım) yerde kat edilen mesafe
    strideMeters: number;
    sheets: Record<Direction, string>;
  };
  idle: {
    frames: number;
    fps: number;
    sheets: Record<Direction, string>;
  };
  turntable?: {
    frames: number;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    src: string;
  };
  thumb?: string;
  // Menü/gardırop için idle animasyonlu 3D model (GLB). Varsa turntable yerine bu gösterilir.
  model?: string;
};

export function directionFromDelta(dx: number, dy: number): Direction {
  const index = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return DIRECTIONS[(index + 8) % 8];
}

// Ekrandaki (dx, dy) yönüne ilerlerken bir yürüme döngüsünün karede kapladığı uzunluk (kare pikseli).
// Kamera yere eğik baktığı için dikey hareket kısalır: aynı adım ekranda yukarı/aşağı daha az yol alır.
export function screenStride(manifest: CharacterManifest, dx: number, dy: number): number {
  const { pxPerMeter, elevation } = manifest.map;
  const len = Math.hypot(dx, dy) || 1;
  const foreshorten = Math.sin((elevation * Math.PI) / 180);
  return (manifest.walk.strideMeters * pxPerMeter) / Math.hypot(dx / len, dy / len / foreshorten);
}

const manifestCache = new Map<string, Promise<CharacterManifest>>();
const imageCache = new Map<string, Promise<void>>();

function loadManifest(outfitId: string): Promise<CharacterManifest> {
  let promise = manifestCache.get(outfitId);
  if (!promise) {
    const base = outfitBasePath(outfitId);
    const absolute = (sheets: Record<Direction, string>) =>
      Object.fromEntries(DIRECTIONS.map((d) => [d, `${base}/${sheets[d]}`])) as Record<Direction, string>;
    promise = fetch(`${base}/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Karakter manifest'i yüklenemedi: ${outfitId}`);
        return res.json() as Promise<CharacterManifest>;
      })
      .then((m) => ({
        ...m,
        walk: { ...m.walk, sheets: absolute(m.walk.sheets) },
        idle: { ...m.idle, sheets: absolute(m.idle.sheets) },
        turntable: m.turntable && { ...m.turntable, src: `${base}/${m.turntable.src}` },
        thumb: m.thumb && `${base}/${m.thumb}`,
        model: m.model && `${base}/${m.model}`,
      }));
    // Hata kalıcı önbelleğe girmesin, sonraki denemede yeniden istensin
    promise.catch(() => manifestCache.delete(outfitId));
    manifestCache.set(outfitId, promise);
  }
  return promise;
}

function preloadImage(src: string): Promise<void> {
  let promise = imageCache.get(src);
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
    promise.catch(() => imageCache.delete(src));
    imageCache.set(src, promise);
  }
  return promise;
}

// Harita için tüm yön sheet'leri, menü için dönüş sheet'i (3D model varsa onu görüntüleyici kendisi yükler)
const imagesFor = (m: CharacterManifest, use: 'map' | 'turntable') =>
  use === 'map'
    ? [...Object.values(m.walk.sheets), ...Object.values(m.idle.sheets)]
    : m.turntable && !m.model
      ? [m.turntable.src]
      : [];

// Manifest'i ve kullanılacak görselleri yükler; hepsi hazır olunca manifest'i döndürür.
// Yön değişiminde boş kare görünmesin diye görseller önceden yüklenir.
export function useCharacterManifest(outfitId: string | null, use: 'map' | 'turntable') {
  const [loaded, setLoaded] = useState<{ key: string; manifest: CharacterManifest } | null>(null);
  const key = outfitId ? `${outfitId}:${use}` : null;

  useEffect(() => {
    if (!outfitId || !key) return;
    let cancelled = false;
    loadManifest(outfitId)
      .then(async (manifest) => {
        await Promise.all(imagesFor(manifest, use).map(preloadImage));
        if (!cancelled) setLoaded({ key, manifest });
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [outfitId, use, key]);

  return loaded && loaded.key === key ? loaded.manifest : null;
}
