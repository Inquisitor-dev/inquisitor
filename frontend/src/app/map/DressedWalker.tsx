'use client';

/* eslint-disable @next/next/no-img-element -- karakter katmanları düz <img> ile üst üste bindiriliyor */
import type { CSSProperties } from 'react';
import { SLOT_Z_ORDER, getItemById, type MarketItem, type OutfitSlot } from '@/app/market/marketItems';
import type { EquippedOutfit } from '@/store/useMarketStore';
import type { Ambient, Direction } from './PixelCharacter';
import styles from './DressedWalker.module.scss';

// PROTOTİP: Lobideki katmanlı karakterin haritada yürüyen hali.
// Yürüme animasyonu üretmek yerine her katman gövde ve bacak parçalarına kırpılır ve kodla hareket ettirilir:
// önden/arkadan bacaklar sırayla kalkar, yandan kalçadan ileri-geri döner; gövde adım ritminde hafifçe zıplar.
// Batı, doğu görünümünün aynasıdır. Giyili bir kıyafetin o yön için görseli yoksa önden görünüme düşülür.

// Katman tuvali (gövde ve kıyafet PNG'leri) ve üzerindeki ölçüler
const CANVAS_W = 560;
const CANVAS_H = 760;
const FOOT_ROW = 735;
// Haritadaki boy: mevcut sprite ile aynı (~72px)
export const DRESSED_SCALE = 0.103;
// Bir yürüme döngüsünde (iki adım) ayakların ilerlediği mesafe, tuval pikseli cinsinden
const STRIDE = 430;
const MIN_CYCLE = 0.45;

export type ArtView = 'south' | 'north' | 'east';
type View = ArtView | 'west';

// Arkadan bakınca görünmeyen slotlar o yönde hiç çizilmez
const HIDDEN_SLOTS: Partial<Record<ArtView, OutfitSlot[]>> = { north: ['mask', 'necklace'] };

// Önden görünüm dosya adı sonek almaz; diğer yönler `_east`, `_north` eki alır
const viewPath = (path: string, view: ArtView) => (view === 'south' ? path : path.replace(/\.png$/, `_${view}.png`));

type Pt = [number, number];
const pct = (pts: Pt[]) =>
  `polygon(${pts.map(([x, y]) => `${((x / CANVAS_W) * 100).toFixed(2)}% ${((y / CANVAS_H) * 100).toFixed(2)}%`).join(', ')})`;

type Rig =
  | { mode: 'lift'; legA: string; legB: string; torso: string; hip: number }
  | { mode: 'swing'; legA: string; legB: string; torso: string; pivot: Pt };

// Önden/arkadan: bacaklar kasıktan biraz yukarıdan başlar; gövde parçası o bölgeyi örttüğü için bacak kalkınca
// kalçada boşluk açılmaz. Eller bacak parçasına girmez.
function liftRig(hip: number, mid: number): Rig {
  return {
    mode: 'lift',
    hip,
    legA: pct([[196, hip - 14], [mid, hip - 14], [mid, CANVAS_H], [110, CANVAS_H], [110, 545], [196, 492]]),
    legB: pct([[mid, hip - 14], [361, hip - 14], [361, 492], [450, 545], [450, CANVAS_H], [mid, CANVAS_H]]),
    torso: pct([
      [0, 0], [CANVAS_W, 0], [CANVAS_W, CANVAS_H], [450, CANVAS_H], [450, 545], [361, 492], [361, hip + 14],
      [196, hip + 14], [196, 492], [110, 545], [110, CANVAS_H], [0, CANVAS_H],
    ]),
  };
}

// Yandan: bacaklar üst üste olduğu için alt gövde iki kez çizilir (arka bacak koyu), her kopya kendi ayağını taşır.
// Eller gövde parçasında kalır ve dönen uyluğun önünde durur.
const SIDE_RIG: Rig = {
  mode: 'swing',
  pivot: [288, 362],
  // arka bacak: sağ üstteki ayak; ellerin olduğu bölgeler oyulur (gövde parçası onları statik çizer)
  legA: pct([
    [110, 360], [196, 360], [196, 448], [300, 448], [300, 360], [330, 360], [330, 434], [356, 434], [356, 360],
    [420, 360], [420, 645], [400, 645], [400, 700], [300, 694], [262, 690], [258, 645], [110, 645],
  ]),
  // ön bacak: sol alttaki ayak
  legB: pct([
    [110, 360], [196, 360], [196, 448], [300, 448], [300, 360], [330, 360], [330, 434], [356, 434], [356, 360],
    [420, 360], [420, 645], [258, 645], [262, 690], [300, 694], [400, 700], [420, 700], [420, CANVAS_H],
    [110, CANVAS_H],
  ]),
  // kalça boyunca düz alt sınır; öndeki el biraz daha aşağı iner
  torso: pct([[0, 0], [CANVAS_W, 0], [CANVAS_W, 430], [300, 430], [300, 448], [196, 448], [196, 430], [0, 430]]),
};

const RIGS: Record<ArtView, Rig> = {
  south: liftRig(446, 278),
  north: liftRig(430, 280),
  east: SIDE_RIG,
};

// Haritadaki 8 yönden çizim yönü (çaprazlarda yatay öncelikli, mevcut sprite ile aynı)
function viewFor(facing: Direction): View {
  if (facing === 'north' || facing === 'south') return facing;
  return facing.endsWith('east') ? 'east' : 'west';
}

export function dressedWalkCycle(screenSpeed: number, depthScale = 1): number {
  return Math.max(MIN_CYCLE, (STRIDE * DRESSED_SCALE * depthScale) / screenSpeed);
}

type Layer = { src: string; whole: boolean };

function equippedItems(outfit: EquippedOutfit): MarketItem[] {
  return SLOT_Z_ORDER.flatMap((slot) => {
    const item = outfit[slot] ? getItemById(outfit[slot]!) : undefined;
    return item ? [item] : [];
  });
}

// Giyili kıyafetlerin hepsinin bu yön için görseli var mı (o yönde görünmeyen slotlar sayılmaz)
function hasArt(items: MarketItem[], view: ArtView): boolean {
  if (view === 'south') return true;
  const hidden = HIDDEN_SLOTS[view] ?? [];
  return items.every((item) => !item.layer || (item.slot && hidden.includes(item.slot)) || item.views?.includes(view));
}

// Çizim sırası: gövde, saç, ayaklar, sonra slot sırasıyla kıyafetler
function buildLayers(items: MarketItem[], view: ArtView): Layer[] {
  const hidden = HIDDEN_SLOTS[view] ?? [];
  const visible = items.filter((item) => !(item.slot && hidden.includes(item.slot)));
  const hair = visible.find((item) => item.hairLayer)?.hairLayer ?? '/characters/outfits/base_hair.png';
  const layers: Layer[] = [
    { src: viewPath('/characters/outfits/base_body.png', view), whole: false },
    { src: viewPath(hair, view), whole: false },
  ];
  if (!visible.some((item) => item.hidesFeet)) {
    layers.push({ src: viewPath('/characters/outfits/base_feet.png', view), whole: false });
  }
  for (const item of visible) {
    // Uzun etekli kıyafetler bacaklarla bölünmez; altından bacaklar (ayaklar) hareket eder
    if (item.layer) layers.push({ src: viewPath(item.layer, view), whole: Boolean(item.longSkirt) });
  }
  return layers;
}

function Stack({ layers, rig, walking }: { layers: Layer[]; rig: Rig; walking: boolean }) {
  const origin =
    rig.mode === 'lift'
      ? `50% ${((rig.hip / CANVAS_H) * 100).toFixed(2)}%`
      : `${((rig.pivot[0] / CANVAS_W) * 100).toFixed(2)}% ${((rig.pivot[1] / CANVAS_H) * 100).toFixed(2)}%`;
  const legClass = (leg: 'A' | 'B') =>
    rig.mode === 'lift' ? (leg === 'A' ? styles.liftA : styles.liftB) : leg === 'A' ? styles.swingBack : styles.swingFront;
  return (
    <div className={styles.stack}>
      <div
        className={`${styles.rig} ${walking ? styles.walking : ''} ${rig.mode === 'lift' ? styles.lifting : styles.swinging}`}
        style={{ '--leg-origin': origin } as CSSProperties}
      >
        {layers.map(({ src, whole }, i) =>
          whole ? (
            <img key={`${i}:${src}`} src={src} alt="" draggable={false} className={`${styles.piece} ${styles.torso}`} />
          ) : (
            <span key={`${i}:${src}`} className={styles.group}>
              <img src={src} alt="" draggable={false} className={`${styles.piece} ${styles.leg} ${legClass('A')}`} style={{ clipPath: rig.legA }} />
              <img src={src} alt="" draggable={false} className={`${styles.piece} ${styles.leg} ${legClass('B')}`} style={{ clipPath: rig.legB }} />
              <img src={src} alt="" draggable={false} className={`${styles.piece} ${styles.torso}`} style={{ clipPath: rig.torso }} />
            </span>
          )
        )}
      </div>
    </div>
  );
}

type Props = {
  outfit: EquippedOutfit;
  x: number;
  y: number;
  facing: Direction;
  walking: boolean;
  cycle?: number;
  depthScale?: number;
  ambient?: Ambient;
};

// (x, y) ayakların bastığı nokta, harita yüzdesi cinsinden.
export default function DressedWalker({ outfit, x, y, facing, walking, cycle = 1, depthScale = 1, ambient = 'day' }: Props) {
  const items = equippedItems(outfit);
  const wanted = viewFor(facing);
  const wantedArt: ArtView = wanted === 'west' ? 'east' : wanted;
  // Kıyafetin bu yön için görseli yoksa önden görünüme düş (yarım giyinik karakter göstermemek için)
  const art: ArtView = hasArt(items, wantedArt) ? wantedArt : 'south';
  const mirrored = wanted === 'west' && art === 'east';
  const layers = buildLayers(items, art);
  const rig = RIGS[art];

  const width = CANVAS_W * DRESSED_SCALE;
  const height = CANVAS_H * DRESSED_SCALE;
  const box: CSSProperties = {
    width,
    height,
    bottom: -(CANVAS_H - FOOT_ROW) * DRESSED_SCALE,
    '--scale': DRESSED_SCALE,
    '--cycle': `${cycle}s`,
    '--foot-origin': `${(FOOT_ROW / CANVAS_H) * 100}%`,
  } as CSSProperties;
  const content = (
    <div className={mirrored ? styles.mirror : styles.plain}>
      <Stack layers={layers} rig={rig} walking={walking} />
    </div>
  );

  return (
    <div
      className={`${styles.player} ${styles[ambient]}`}
      style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${depthScale})` }}
      aria-label="Engizitör"
    >
      {/* Sol üstten gelen ışığa göre sağ alta düşen gölge: aynı katmanların yere yatırılmış silueti */}
      <div className={`${styles.box} ${styles.castShadow}`} style={box} aria-hidden>
        {content}
      </div>
      <div className={styles.contactShadow} style={{ width: width * 0.5 }} />
      <div className={`${styles.box} ${styles.sprite}`} style={box}>
        {content}
      </div>
    </div>
  );
}
