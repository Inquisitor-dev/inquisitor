import styles from './PlayerCharacter.module.scss';

type Props = {
  x: number;
  y: number;
  facing: 'left' | 'right';
  walking: boolean;
};

// Oyuncunun engizisyoncu karakteri. (x, y) ayakların bastığı nokta, harita yüzdesi cinsinden.
export default function PlayerCharacter({ x, y, facing, walking }: Props) {
  return (
    <div
      className={`${styles.player} ${walking ? styles.walking : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <svg
        className={`${styles.figure} ${facing === 'left' ? styles.facingLeft : ''}`}
        viewBox="0 0 40 64"
        aria-hidden="true"
      >
        <ellipse className={styles.shadow} cx="20" cy="62" rx="10" ry="2.5" />

        <g className={styles.body}>
          {/* Arkadaki kol ve bacak */}
          <g className={`${styles.limb} ${styles.armBack}`}>
            <path d="M18 23 L17 36 L20.5 36 L21.5 23 Z" fill="#1e1410" />
            <circle cx="18.8" cy="37" r="1.8" fill="#c9966d" />
          </g>
          <g className={`${styles.limb} ${styles.legBack}`}>
            <rect x="17.5" y="40" width="4" height="17" rx="1.5" fill="#1b1714" />
            <path d="M17 56 h6 a2 2 0 0 1 2 2 v1.5 h-8 Z" fill="#0f0c0a" />
          </g>
          <g className={`${styles.limb} ${styles.legFront}`}>
            <rect x="18.5" y="40" width="4" height="17" rx="1.5" fill="#26201b" />
            <path d="M18 56 h6 a2 2 0 0 1 2 2 v1.5 h-8 Z" fill="#14100d" />
          </g>

          {/* Uzun pelerinli palto */}
          <path
            d="M14 21 Q20 18.5 26 21 L28.5 46 Q24 49 20 48.5 Q15.5 49 11.5 46 Z"
            fill="#2c1e17"
          />
          <path d="M20 21 L20.8 48.5 Q24 49 28.5 46 L26 21 Q23 19.8 20 21 Z" fill="#3a2a20" />
          <rect x="13.2" y="33" width="14.6" height="2" fill="#120c09" />
          <rect x="19.3" y="32.6" width="2.6" height="2.8" rx="0.4" fill="#b08d57" />
          {/* Kırmızı atkı */}
          <path d="M15 20.5 Q20 23.5 25 20.5 L25 22.5 Q20 25.5 15 22.5 Z" fill="#8A0303" />
          <path d="M22.5 22.5 L24.5 30 L22 29.5 L21 23.5 Z" fill="#6d0202" />

          {/* Kafa ve şapka */}
          <path d="M18 18 h4 v3 h-4 Z" fill="#b5835c" />
          <ellipse cx="20" cy="15" rx="4.6" ry="5" fill="#d9a77c" />
          <path d="M15.4 12 Q14.8 17.5 17.3 19.5 L18 12 Z" fill="#2a1a12" />
          <ellipse cx="23.4" cy="15.3" rx="0.6" ry="0.8" fill="#1a1210" />
          <path d="M21.5 18.2 q1.5 0.6 2.6 -0.2" stroke="#8c5f40" strokeWidth="0.6" fill="none" />
          <ellipse cx="20" cy="11" rx="11" ry="2.4" fill="#16100d" />
          <path d="M14.5 11 L15.5 3.5 Q20 2 24.5 3.5 L25.5 11 Z" fill="#1f1713" />
          <rect x="15" y="8.6" width="10" height="1.6" fill="#8A0303" />

          {/* Öndeki kol */}
          <g className={`${styles.limb} ${styles.armFront}`}>
            <path d="M19 22.5 L19.5 36 L23 36 L23.5 22.5 Z" fill="#3a2a20" />
            <circle cx="21.3" cy="37" r="1.9" fill="#d9a77c" />
          </g>
        </g>
      </svg>
    </div>
  );
}
