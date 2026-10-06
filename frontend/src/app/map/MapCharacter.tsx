import type { CSSProperties } from 'react';
import type { CharacterManifest, Direction } from '@/components/character/characterManifest';
import styles from './MapCharacter.module.scss';

// Haritanın günün saatine göre ışığı; karakter aynı ışık altındaymış gibi renklendirilir
export type Ambient = 'day' | 'dusk' | 'night';

type Props = {
  manifest: CharacterManifest;
  // Ayakların bastığı nokta, harita katmanının yüzdesi cinsinden
  x: number;
  y: number;
  facing: Direction;
  walking: boolean;
  // Yürürken kat edilen döngü sayısı (kesirli). Kare bundan seçilir, böylece adımlar
  // hızlanma/yavaşlama dahil karakterin ilerleyişine birebir oturur ve ayak kaymaz.
  walkPhase: number;
  // Kare pikseli başına ekran pikseli
  scale: number;
  ambient?: Ambient;
};

export default function MapCharacter({ manifest, x, y, facing, walking, walkPhase, scale, ambient = 'day' }: Props) {
  const { frameWidth, frameHeight, anchorX, anchorY } = manifest.map;
  const width = frameWidth * scale;
  const height = frameHeight * scale;
  const anim = walking ? manifest.walk : manifest.idle;
  const sheetWidth = width * anim.frames;

  const frameStyle: CSSProperties = {
    width,
    height,
    // Karedeki ayak noktası tam (x, y)'ye otursun
    left: -anchorX * scale,
    top: -anchorY * scale,
    transformOrigin: `${anchorX * scale}px ${anchorY * scale}px`,
    backgroundImage: `url(${anim.sheets[facing]})`,
    backgroundSize: `${sheetWidth}px ${height}px`,
  };

  if (walking) {
    const frames = manifest.walk.frames;
    const frame = ((Math.floor(walkPhase * frames) % frames) + frames) % frames;
    frameStyle.backgroundPositionX = -frame * width;
  } else {
    Object.assign(frameStyle, {
      '--sheet-width': `${sheetWidth}px`,
      '--frames': manifest.idle.frames,
      '--duration': `${manifest.idle.frames / manifest.idle.fps}s`,
    });
  }
  const frameClass = walking ? '' : styles.idle;

  return (
    <div className={`${styles.player} ${styles[ambient]}`} style={{ left: `${x}%`, top: `${y}%` }}>
      {/* Sol üstten gelen harita ışığına göre sağ alta düşen gölge: aynı karenin yere yatırılmış silueti */}
      <div className={`${styles.castShadow} ${frameClass}`} style={frameStyle} />
      <div className={styles.contactShadow} style={{ width: width * 0.32, height: width * 0.07 }} />
      <div className={`${styles.sprite} ${frameClass}`} style={frameStyle} />
    </div>
  );
}
