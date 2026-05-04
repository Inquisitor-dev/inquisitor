'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import styles from './page.module.scss';

export default function HomePage() {
  const router = useRouter();
  const { setSessionId, setScenario, authToken, logout } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Token yoksa login'e yönlendir
  useEffect(() => {
    if (!authToken) {
      router.push('/login');
    }
  }, [authToken, router]);

  const handleStart = async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/game-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.status === 401) {
        logout();
        router.push('/login');
        return;
      }
      
      if (res.status === 403) {
        setError(data.message || 'Günlük soruşturma limitine ulaştınız.');
        setLoading(false);
        return;
      }

      if (data.id) {
        setSessionId(data.id);
        if (data.scenario) {
          setScenario(data.scenario);
        }
        router.push('/map');
      } else {
        setError(data.message || 'Yapay zeka şu an meşgul veya bir hata oluştu. Lütfen biraz bekleyip tekrar deneyin.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to start session', err);
      setError('Sunucuya bağlanılamadı. Backend servisinin çalıştığından emin olun.');
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
          <button 
            onClick={() => setIsHowToPlayOpen(true)} 
            className={styles.btnSecondary} 
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
          >
            <span>Nasıl Oynanır?</span>
          </button>
          {error && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(138,3,3,0.15)', border: '1px solid rgba(138,3,3,0.4)', color: '#e07070', fontSize: '0.85rem', lineHeight: 1.5, textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}
          <div className={styles.sessionNote}>
            Ücretsiz Sürüm · Günlük 30 diyalog hakkı
          </div>
        </div>

        {/* Bottom ornamental rule */}
        <div className={styles.bottomRule}>
          <span />
          <span className={styles.bottomRuleText}>Inquisitor AI · Est. MCCXII</span>
          <span />
        </div>
      </div>

      {/* How To Play Modal */}
      {isHowToPlayOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHowToPlayOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsHowToPlayOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Soruşturma Kılavuzu</h2>
            
            <div className={styles.modalScroll}>
              <section className={styles.guideSection}>
                <h3>👁️ Temel Amaç</h3>
                <p>Ashenmoor köyünde işlenen gizemli bir cinayeti çözmekle görevli bir Engizisyon müfettişisin. 3 günün var. Bu süre zarfında doğru kişiyi ölüme mahkum etmeli veya gerçeği ortaya çıkarmalısın.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>⏳ Zaman ve Diyalog</h3>
                <p>Her gün sınırlı sayıda (10) diyalog hakkın bulunur. Bir köylüyle her konuştuğunda vakit ilerler (Sabah, Öğlen, İkindi, Akşam). Gece olduğunda herkes evine çekilir ve gün biter.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>📜 Arama İzinleri</h3>
                <p>Köylüleri sadece sorgulayarak değil, mekanlarını arayarak da kanıt bulabilirsin. Ancak bir mekanı aramak için <strong>Peder Malachar'dan</strong> arama izni almalısın. Peder, sadece yeterli şüphe uyandıran kanıtlar sunduğunda sana bu yetkiyi verecektir.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>📝 Not Tutma</h3>
                <p>Köylülerin söyledikleri çelişkili olabilir. Önemli ipuçlarını not defterine kaydet. Bu notlar veritabanına işlenir ve soruşturman boyunca sana rehberlik eder.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>⚖️ Nihai Hüküm</h3>
                <p>İstediğin an haritadaki "MAHKUMU SEÇ" butonuna basarak birini suçlayabilirsin. Ancak unutma: Yanlış kişiyi asarsan gerçek katil aramızda dolaşmaya devam eder ve soruşturman başarısız sayılır.</p>
              </section>

              <div className={styles.guideTip}>
                <strong>İpucu:</strong> Köylülerin korku ve yalan seviyelerini analiz et. Bazen sessizlik, en büyük itiraftır.
              </div>
            </div>

            <button className={styles.modalActionBtn} onClick={() => setIsHowToPlayOpen(false)}>
              Anladım, Müfettiş.
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
