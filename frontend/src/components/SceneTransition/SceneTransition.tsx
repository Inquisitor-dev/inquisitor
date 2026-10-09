'use client';

import { useSceneTransition } from './sceneStore';
import styles from './SceneTransition.module.scss';

// Uzun beklemelerde (ör. sunucu uyanırken) okunacak kısa oyun ipuçları
const TIPS = [
  'Bir masuma kendi mekânından bulunan kanıtı göstermek onu itirafa zorlar.',
  'Suçlu hiçbir zaman itiraf etmez; sıkıştırıldığında yalnızca paniğe kapılır.',
  'Her mekâna girmek günün saatini ilerletir. Gece çökünce kapılar kapanır.',
  'Arama iznin olan mekânlarda gizli kanıtları kendin araştırabilirsin.',
  'İfadeler not defterine kendiliğinden yazılır; bulduğun eşyalar envanterde durur.',
  'Vaka dört gün sürer. Birini mahkûm etmeden önce ifadeleri karşılaştır.',
];

// Sayfalar arası geçiş ekranı: "Giriyorsun: …" yazısı, hedef görsel yüklenene kadar kalır,
// sonra görsel bulanıklıktan netleşerek sahneye açılır.
export default function SceneTransition() {
  const { scene, visible, ready, token } = useSceneTransition();
  if (!scene) return null;

  return (
    <div
      className={`${styles.overlay} ${visible ? '' : styles.leaving} ${ready ? styles.ready : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!ready}
    >
      {scene.image && (
        <div className={styles.backdrop} style={{ backgroundImage: `url(${scene.image})` }} aria-hidden />
      )}
      <div className={styles.vignette} aria-hidden />

      <div className={styles.content} key={token}>
        <span className={styles.seal} aria-hidden>
          ✠
        </span>
        <span className={styles.kicker}>{scene.kicker}</span>
        <h2 className={styles.title}>{scene.title}</h2>
        {scene.subtitle && <p className={styles.subtitle}>{scene.subtitle}</p>}
        <span className={styles.progress} aria-hidden>
          <span className={styles.bar} />
        </span>
      </div>

      <p className={styles.tip} key={`tip-${token}`}>
        <span className={styles.tipLabel}>İpucu</span>
        {TIPS[token % TIPS.length]}
      </p>
    </div>
  );
}
