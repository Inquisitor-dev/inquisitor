import type { CSSProperties } from 'react';
import styles from './PixelCharacter.module.scss';

// Ekran koordinatlarında 8 yön (y aşağı doğru artar, "south" kameraya bakar).
export type Direction =
  | 'south'
  | 'south-east'
  | 'east'
  | 'north-east'
  | 'north'
  | 'north-west'
  | 'west'
  | 'south-west';

type WalkDirection = 'south' | 'east' | 'north' | 'west';

// Karakter sprite ayarları.
// Durma pozları yön başına tek kare, yürüme şeritleri yön başına tek satırlık yatay şerittir.
// Tüm görsellerde ayakların en alt satırı `footRow` pikselinde hizalıdır.
// Durma pozu verilmeyen yönler (çaprazlar) en yakın ana yönün pozunu kullanır.
export type CharacterSprite = {
  idle: Partial<Record<Direction, string>> & Record<WalkDirection, string>;
  // Her yönün yürüme şeridi ve şeritteki kare sayısı (bir tam döngü = iki adım)
  walk: Record<WalkDirection, { src: string; frames: number }>;
  frameWidth: number;
  frameHeight: number;
  footRow: number;
  // Ekrana çizim ölçeği. Pixel-art için tam sayı olmalı; boyalı sprite'lar 2x yoğunlukta
  // hazırlanıp 0.5 ile çizilir, böylece yüksek çözünürlüklü ekranlarda da net kalır.
  scale: number;
  pixelated: boolean;
  // Bir yürüme döngüsünde (iki adım) ayakların ilerlediği mesafe, sprite pikseli cinsinden.
  // Döngü süresi yürüme hızına bağlanır, böylece ayaklar zeminde kaymaz.
  strideLength: number;
  // En kısa döngü süresi (sn). Daha sık adım koşu gibi göründüğü için hız artınca adım sıklaşmaz.
  minCycle: number;
};

const INQUISITOR_BASE = '/characters/inquisitor2';
const DIRECTIONS: Direction[] = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east',
];
const MAIN_DIRECTIONS: WalkDirection[] = ['south', 'east', 'north', 'west'];

// Görseller ChatGPT ile üretilen inquistorv2 pozlarından hazırlanır (112x152 kare).
// Yürüme şeritleri yerinde yürüme videolarından çıkarılan 12'şer karedir; batı, doğunun aynalanmış halidir.
export const MEDIEVAL_SPRITE: CharacterSprite = {
  idle: Object.fromEntries(
    MAIN_DIRECTIONS.map((dir) => [dir, `${INQUISITOR_BASE}/idle/${dir}.png`])
  ) as Record<WalkDirection, string>,
  walk: {
    south: { src: `${INQUISITOR_BASE}/walk/south.png`, frames: 12 },
    north: { src: `${INQUISITOR_BASE}/walk/north.png`, frames: 12 },
    east: { src: `${INQUISITOR_BASE}/walk/east.png`, frames: 12 },
    west: { src: `${INQUISITOR_BASE}/walk/west.png`, frames: 12 },
  },
  frameWidth: 112,
  frameHeight: 152,
  footRow: 147,
  scale: 0.5,
  pixelated: false,
  strideLength: 90,
  minCycle: 0.45,
};

export function spriteUrls(sprite: CharacterSprite): string[] {
  return [...Object.values(sprite.idle), ...Object.values(sprite.walk).map((w) => w.src)];
}

// Hareket vektöründen 8 yönlü bakış yönü
export function directionFromDelta(dx: number, dy: number): Direction {
  const angle = Math.atan2(dy, dx);
  const index = Math.round(angle / (Math.PI / 4));
  return DIRECTIONS[(index + 8) % 8];
}

// Çapraz yönlerin yürüme animasyonu yok; en yakın ana yönü kullan (yatay öncelikli)
function walkDirection(dir: Direction): WalkDirection {
  if (dir === 'north' || dir === 'south') return dir;
  return dir.endsWith('east') ? 'east' : 'west';
}

// Verilen ekran hızında (px/sn) ayakların zeminde kaymaması için bir yürüme döngüsünün süresi (sn)
export function walkCycle(sprite: CharacterSprite, screenSpeed: number, depthScale = 1): number {
  const strideOnScreen = sprite.strideLength * sprite.scale * depthScale;
  return Math.max(sprite.minCycle, strideOnScreen / screenSpeed);
}

// Haritanın günün saatine göre ışığı; karakter aynı ışık altındaymış gibi renklendirilir
export type Ambient = 'day' | 'dusk' | 'night';

type Props = {
  sprite: CharacterSprite;
  x: number;
  y: number;
  facing: Direction;
  walking: boolean;
  cycle?: number; // Yürüme döngüsü süresi (sn)
  depthScale?: number; // Perspektif: haritada uzaktayken (yukarıda) karakter biraz küçülür
  ambient?: Ambient;
};

// (x, y) ayakların bastığı nokta, harita yüzdesi cinsinden.
export default function PixelCharacter({
  sprite,
  x,
  y,
  facing,
  walking,
  cycle = 1,
  depthScale = 1,
  ambient = 'day',
}: Props) {
  const width = sprite.frameWidth * sprite.scale;
  const height = sprite.frameHeight * sprite.scale;
  const footOffset = (sprite.frameHeight - 1 - sprite.footRow) * sprite.scale;
  const walkSheet = sprite.walk[walkDirection(facing)];
  const sheetWidth = width * walkSheet.frames;

  const frameStyle: CSSProperties = walking
    ? ({
        width,
        height,
        bottom: -footOffset,
        backgroundImage: `url(${walkSheet.src})`,
        backgroundSize: `${sheetWidth}px ${height}px`,
        '--sheet-width': `${sheetWidth}px`,
        '--frames': walkSheet.frames,
        '--cycle': `${cycle}s`,
        '--foot-offset': `${footOffset}px`,
      } as CSSProperties)
    : ({
        width,
        height,
        bottom: -footOffset,
        backgroundImage: `url(${sprite.idle[facing] ?? sprite.idle[walkDirection(facing)]})`,
        backgroundSize: `${width}px ${height}px`,
        '--foot-offset': `${footOffset}px`,
      } as CSSProperties);
  const frameClass = walking ? styles.animated : '';

  return (
    <div
      className={`${styles.player} ${styles[ambient]} ${sprite.pixelated ? styles.pixelated : styles.painted}`}
      style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${depthScale})` }}
    >
      {/* Sol üstten gelen harita ışığına göre sağ alta düşen gölge: aynı karenin yere yatırılmış silueti */}
      <div className={`${styles.castShadow} ${frameClass}`} style={frameStyle} />
      <div className={styles.contactShadow} style={{ width: width * 0.5 }} />
      <div className={`${styles.sprite} ${frameClass}`} style={frameStyle} />
    </div>
  );
}
