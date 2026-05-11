'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import styles from './page.module.scss';

export default function HomePage() {
  const router = useRouter();
  const { setSessionId, setScenario, setCurrentDay, setTimeOfDay, setNotes, setWarrants, setDifficulty, setScenarioType, authToken, logout, hasHydrated, isPremium } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio control
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Main_Soundtrack.mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = volume;

    if (isMuted || volume === 0) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
  }, [isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Token yoksa login'e yönlendir (Hidratasyon tamamlandıktan sonra)
  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/login');
    }
  }, [authToken, router, hasHydrated]);

  // Aktif oturum kontrolü
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!authToken) return;
      try {
        const res = await fetch('http://localhost:3001/game-sessions/active', {
          headers: { 'Authorization': `Bearer ${authToken}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        console.error('Failed to check active session', err);
      } finally {
        setCheckingSession(false);
      }
    };
    if (hasHydrated && authToken) {
      checkActiveSession();
    } else if (hasHydrated) {
      setCheckingSession(false);
    }
  }, [authToken, hasHydrated]);

  const handleResume = async () => {
    if (!activeSession) return;
    setResumeLoading(true);
    try {
      setSessionId(activeSession.id);
      if (activeSession.scenarioType) setScenarioType(activeSession.scenarioType);
      if (activeSession.scenario) setScenario(activeSession.scenario);
      if (activeSession.currentDay) setCurrentDay(activeSession.currentDay);
      if (activeSession.timeOfDay !== undefined) setTimeOfDay(activeSession.timeOfDay);
      if (activeSession.notes) setNotes(activeSession.notes);
      if (activeSession.difficulty) setDifficulty(activeSession.difficulty);
      setWarrants(activeSession.activeWarrants || [], activeSession.usedWarrants || []);
      router.push('/map');
    } catch (err) {
      console.error('Failed to resume session', err);
      setResumeLoading(false);
    }
  };

  const startWithDifficultyAndScenario = async (difficulty: string, scenarioType: string) => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    setIsScenarioOpen(false);
    try {
      const res = await fetch('http://localhost:3001/game-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ difficulty, scenarioType }),
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
        setDifficulty(difficulty);
        setScenarioType(scenarioType);
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

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  const handleDifficultySelect = (diff: string) => {
    setSelectedDifficulty(diff);
    setIsDifficultyOpen(false);
    setIsScenarioOpen(true);
  };

  const handleStart = () => {
    if (isPremium) {
      setIsDifficultyOpen(true);
    } else {
      startWithDifficultyAndScenario('easy', 'medieval');
    }
  };

  return (
    <main className={styles.main}>
      {/* Sound Controls */}
      <div className={styles.soundControls}>
        <div className={styles.volumeWrapper}>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>
        <button 
          className={styles.muteBtn} 
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
        >
          {isMuted || volume === 0 ? '🔇' : '🔊'}
        </button>
      </div>

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
            <circle cx="60" cy="60" r="55" stroke="#8A0303" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="60" cy="60" r="45" stroke="#8A0303" strokeWidth="0.5" opacity="0.5" />
            {/* Cross */}
            <line x1="60" y1="20" x2="60" y2="100" stroke="#8A0303" strokeWidth="1.5" />
            <line x1="20" y1="60" x2="100" y2="60" stroke="#8A0303" strokeWidth="1.5" />
            {/* Diamond ornaments */}
            <rect x="56" y="56" width="8" height="8" fill="#8A0303" transform="rotate(45 60 60)" />
            <rect x="56" y="16" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 20)" />
            <rect x="56" y="96" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 100)" />
            <rect x="16" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 20 60)" />
            <rect x="96" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 100 60)" />
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
          {activeSession && !checkingSession && (
            <button 
              onClick={handleResume} 
              disabled={resumeLoading} 
              className={styles.btnPrimary} 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                marginBottom: '12px',
                background: 'rgba(232, 220, 196, 0.08)',
                border: '1px solid rgba(232, 220, 196, 0.3)',
                color: '#E8DCC4',
              }}
            >
              {resumeLoading ? (
                <span>Soruşturmaya dönülüyor...</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Soruşturmaya Devam Et (Gün {activeSession.currentDay})</span>
                </>
              )}
            </button>
          )}
          <button onClick={handleStart} disabled={loading} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? (
              <span>Ashenmoor&apos;a giden araba hazırlanıyor...</span>
            ) : (
              <>
                <span>{activeSession ? 'Yeni Soruşturma Başlat' : 'Soruşturmaya Başla'}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className={styles.btnSecondary}
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px', borderColor: 'rgba(255,255,255,0.1)', opacity: 0.8 }}
          >
            <span>Hesaptan Çıkış Yap</span>
          </button>

          {!isPremium && (
            <button
              onClick={() => router.push('/premium')}
              className={styles.btnSecondary}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                marginTop: '12px',
                borderColor: 'rgba(218, 165, 32, 0.4)',
                color: '#DAA520',
              }}
            >
              <span>⭐ Premium'a Yükselt</span>
            </button>
          )}

          {error && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(138,3,3,0.15)', border: '1px solid rgba(138,3,3,0.4)', color: '#e07070', fontSize: '0.85rem', lineHeight: 1.5, textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}
          <div className={styles.sessionNote}>
            {isPremium ? '⭐ Premium Sürüm · Günlük 100 diyalog · 5 soruşturma hakkı' : 'Ücretsiz Sürüm · Günlük 30 diyalog hakkı'}
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
                <p>Ashenmoor köyünde işlenen gizemli bir cinayeti çözmekle görevli bir Engizisyon müfettişisin. 4 günün var. Bu süre zarfında doğru kişiyi ölüme mahkum etmeli ve gerçeği ortaya çıkarmalısın.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>⏳ Zaman Yönetimi</h3>
                <p>Bir mekana her girdiğinde vakit ilerler (Sabah, Öğlen, İkindi, Akşam). Gece olduğunda herkes evine çekilir ve gün biter.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>📜 Arama İzinleri</h3>
                <p>Köylüleri sadece sorgulayarak değil, mekanlarını arayarak da kanıt bulabilirsin. Ama bir mekanı aramak için <strong>Peder Malachar'dan</strong> arama izni almalısın. Soruşturma boyunca en fazla <strong>2 kez</strong> arama izni alma hakkın var. Peder, sadece yeterli şüphe uyandıran kanıtlar sunduğunda sana bu yetkiyi verecektir.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>📝 Not Tutma</h3>
                <p>Köylülerin söyledikleri çelişkili olabilir. Önemli ipuçlarını not defterine kaydet. Bu notlar soruşturman boyunca sana rehberlik eder.</p>
              </section>

              <section className={styles.guideSection}>
                <h3>⚖️ Nihai Hüküm</h3>
                <p>İstediğin an haritadaki "MAHKUMU SEÇ" butonuna basarak birini suçlayabilirsin. Dikkat et: Yanlış kişiyi asarsan gerçek katil aramızda dolaşmaya devam eder ve soruşturman başarısız sayılır.</p>
              </section>

              <div className={styles.guideTip}>
                <strong>İpucu:</strong> Köylüler çok farklı motivasyonlarla yalan söyleyebilirler. Her yalan söyleyen köylü katil olmayabilir.
              </div>
            </div>

            <button className={styles.modalActionBtn} onClick={() => setIsHowToPlayOpen(false)}>
              Anladım.
            </button>
          </div>
        </div>
      )}

      {/* Difficulty Selection Modal */}
      {isDifficultyOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDifficultyOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsDifficultyOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Zorluk Seviyesi Seç</h2>

            <div className={styles.selectionList}>
              {/* Kolay */}
              <button
                onClick={() => handleDifficultySelect('easy')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.difficultyEasy}`}
              >
                <div>
                  <span>🌿 Kolay</span>
                  <span>4 Şüpheli</span>
                </div>
                <p>
                  Hancı, Peder, Mezarcı ve Değirmenci. Standart soruşturma deneyimi.
                </p>
              </button>

              {/* Orta */}
              <button
                onClick={() => handleDifficultySelect('medium')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.difficultyMedium}`}
              >
                <div>
                  <span>⚔️ Orta</span>
                  <span>5 Şüpheli</span>
                </div>
                <p>
                  + Çiftçi Edmund. Artan şüpheli sayısıyla daha karmaşıklaşan ilişkiler.
                </p>
              </button>

              {/* Zor */}
              <button
                onClick={() => handleDifficultySelect('hard')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.difficultyHard}`}
              >
                <div>
                  <span>💀 Zor</span>
                  <span>6 Şüpheli</span>
                </div>
                <p>
                  + Çiftçi & Doktor. Kalabalıklaşan şüpheli listesiyle en karmaşık hikaye.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Selection Modal */}
      {isScenarioOpen && selectedDifficulty && (
        <div className={styles.modalOverlay} onClick={() => setIsScenarioOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsScenarioOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Senaryo Evreni Seç</h2>

            <div className={styles.selectionList}>
              {/* Ortaçağ (Medieval) */}
              <button
                onClick={() => startWithDifficultyAndScenario(selectedDifficulty, 'medieval')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.scenarioMedieval}`}
              >
                <div>
                  <span>🏰 Klasik Ortaçağ</span>
                </div>
                <p>
                  Ashenmoor Köyü. Engizisyon, cadı avları, batıl inançlar ve karanlık sırlar. Standart karanlık fantezi deneyimi.
                </p>
              </button>

              {/* Modern (Modern) */}
              <button
                onClick={() => startWithDifficultyAndScenario(selectedDifficulty, 'modern')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.scenarioModern}`}
              >
                <div>
                  <span>🚔 Modern Amerikan Kasabası</span>
                </div>
                <p>
                  Oakhaven. Yerel polis, cinayet dedektifleri, şüpheli kasabalılar. Gerilim dolu "True Crime" polisiyesi.
                </p>
              </button>

              {/* Cyberpunk (Cyberpunk) */}
              <button
                onClick={() => startWithDifficultyAndScenario(selectedDifficulty, 'cyberpunk')}
                disabled={loading}
                className={`${styles.selectionBtn} ${styles.scenarioCyberpunk}`}
              >
                <div>
                  <span>🌃 Distopik Cyberpunk</span>
                </div>
                <p>
                  Neon Prime Şehri. Yozlaşmış mega şirketler, siber-geliştirmeler, karanlık ara sokaklar. Tech-noir bilimkurgu.
                </p>
              </button>
            </div>

            {loading && (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '16px', fontSize: '0.85rem' }}>
                Senaryo oluşturuluyor, lütfen bekleyin...
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
