'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import styles from './page.module.scss';

export default function HomePage() {
  const router = useRouter();
  const { setSessionId } = useGameStore();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/game-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user-001' }) // Geçici
      });
      const data = await res.json();
      
      if (data.id) {
        setSessionId(data.id);
        router.push('/map');
      } else {
        console.error('Failed to create session, missing ID:', data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to start session', err);
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* Vignette overlay */}
      <div className={styles.vignette} />

      {/* Animated background candles / particles */}
      <div className={styles.particles}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      {/* Header corner ornaments */}
      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerTopRight} />
      <div className={styles.cornerBotLeft} />
      <div className={styles.cornerBotRight} />

      {/* Hero content */}
      <div className={styles.hero}>
        {/* Seal / Crown logo */}
        <div className={styles.seal}>
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sealSvg}>
            <circle cx="60" cy="60" r="55" stroke="#8A0303" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="60" cy="60" r="45" stroke="#8A0303" strokeWidth="0.5" opacity="0.5"/>
            {/* Cross */}
            <line x1="60" y1="20" x2="60" y2="100" stroke="#8A0303" strokeWidth="1.5"/>
            <line x1="20" y1="60" x2="100" y2="60" stroke="#8A0303" strokeWidth="1.5"/>
            {/* Diamond ornaments */}
            <rect x="56" y="56" width="8" height="8" fill="#8A0303" transform="rotate(45 60 60)"/>
            <rect x="56" y="16" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 20)"/>
            <rect x="56" y="96" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 100)"/>
            <rect x="16" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 20 60)"/>
            <rect x="96" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 100 60)"/>
          </svg>
        </div>

        <div className={styles.eyebrow}>— ANNO DOMINI MCCXII —</div>

        <h1 className={styles.title}>The Inquisitor</h1>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerIcon}>✦</span>
          <span className={styles.dividerLine} />
        </div>

        <p className={styles.lead}>
          Bu köyde kimse göründüğü gibi değil.
        </p>

        <p className={styles.description}>
          Bu hikayenin kahramanı sen değilsin. Yetki, sabır ve soğuk kanlılıkla donanmış bir şekilde — yapay zeka tarafından yönetilen köylüleri sorgula, yalanlarını ortaya çıkar, gizli ittifakları çöz ve nihai hükmünü ver.
        </p>

        <div className={styles.slogan}>Dinle · Analiz Et · Hüküm Ver</div>

        <div className={styles.cta}>
          <button onClick={handleStart} disabled={loading} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? (
              <span>Ashenmoor'a giden araba hazırlanıyor...</span>
            ) : (
              <>
                <span>Soruşturmaya Başla</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
          <div className={styles.sessionNote}>
            Ücretsiz Sürüm · Günlük 40 diyalog hakkı
          </div>
        </div>

        {/* Bottom ornamental rule */}
        <div className={styles.bottomRule}>
          <span />
          <span className={styles.bottomRuleText}>Inquisitor AI · Est. MCCXII</span>
          <span />
        </div>
      </div>
    </main>
  );
}
