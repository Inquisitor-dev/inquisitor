'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { useGameStore } from '@/store/useGameStore';
import styles from './page.module.scss';

export default function HomePage() {
  const router = useRouter();
  const {
    setSessionId,
    setScenario,
    setCurrentDay,
    setTimeOfDay,
    setNotes,
    setWarrants,
    setDifficulty,
    setScenarioType,
    setTruthReveal,
    setLocationClues,
    authToken,
    userEmail,
    isAdmin,
    logout,
    hasHydrated,
    isPremium,
  } = useGameStore();

  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Seçili aktif oyun parametreleri
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [selectedStory, setSelectedStory] = useState<string>('medieval');
  
  // Modaldaki geçici seçim parametreleri
  const [tempDifficulty, setTempDifficulty] = useState<string>('easy');
  const [tempStory, setTempStory] = useState<string>('medieval');

  // Yapay zekasız test modu: sunucuda açıksa menüde ayrı bir düğme görünür
  const [testModeAvailable, setTestModeAvailable] = useState(false);
  const [isTestModeStart, setIsTestModeStart] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  // Müzik ayarları hesaptan yüklenene kadar çalma: yoksa kısılmış ses bir an varsayılan seviyede patlar
  const [audioSettingsLoaded, setAudioSettingsLoaded] = useState(false);
  const saveAudioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accountSummary, setAccountSummary] = useState<null | {
    email: string;
    isAdmin: boolean;
    isPremium: boolean;
    dailySessionCount: number;
    dailyMessageCount: number;
    maxSessionsPerDay: number;
    maxMessagesPerDay: number;
  }>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ses seviyesi ve sessiz ayarı hesapta saklanır; menüye her girişte oradan okunur
  useEffect(() => {
    if (!hasHydrated || !authToken) return;
    let cancelled = false;

    const loadAudioSettings = async () => {
      try {
        const res = await fetch(apiUrl('/auth/audio-settings'), {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (typeof data.musicVolume === 'number') setVolume(data.musicVolume);
          if (typeof data.musicMuted === 'boolean') setIsMuted(data.musicMuted);
        }
      } catch (err) {
        console.error('Failed to load audio settings', err);
      } finally {
        if (!cancelled) setAudioSettingsLoaded(true);
      }
    };

    void loadAudioSettings();
    return () => {
      cancelled = true;
    };
  }, [authToken, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !authToken) return;
    let cancelled = false;
    fetch(apiUrl('/game-sessions/test-mode'), {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.enabled) setTestModeAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authToken, hasHydrated]);

  const saveAudioSettings = (settings: { musicVolume?: number; musicMuted?: boolean }) => {
    if (!authToken) return;
    // Kaydırıcı sürüklenirken her adımda istek atmamak için kısa bir gecikmeyle kaydedilir
    if (saveAudioTimer.current) clearTimeout(saveAudioTimer.current);
    saveAudioTimer.current = setTimeout(() => {
      fetch(apiUrl('/auth/audio-settings'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(settings),
      }).catch((err) => console.error('Failed to save audio settings', err));
    }, 400);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    saveAudioSettings({ musicVolume: value, musicMuted: isMuted });
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    saveAudioSettings({ musicVolume: volume, musicMuted: next });
  };

  useEffect(() => {
    if (!audioSettingsLoaded) return;
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Main_Soundtrack.mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = volume;

    if (isMuted || volume === 0) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.log('Audio play failed:', err));
    }
  }, [audioSettingsLoaded, isMuted, volume]);

  useEffect(() => {
    return () => {
      if (saveAudioTimer.current) clearTimeout(saveAudioTimer.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/login');
    }
  }, [authToken, hasHydrated, router]);

  useEffect(() => {
    if (!hasHydrated) return;

    setTruthReveal(null);
    setLocationClues(null);
  }, [hasHydrated, setLocationClues, setTruthReveal]);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!authToken) return;

      try {
        const res = await fetch(apiUrl('/game-sessions/active'), {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        });
        const data = await res.json();
        setActiveSession(data.session ?? null);
      } catch (err) {
        console.error('Failed to check active session', err);
      } finally {
        setCheckingSession(false);
      }
    };

    if (hasHydrated && authToken) {
      void checkActiveSession();
    } else if (hasHydrated) {
      setCheckingSession(false);
    }
  }, [authToken, hasHydrated]);

  useEffect(() => {
    const fetchAccountSummary = async () => {
      if (!isSettingsOpen || !authToken) return;

      try {
        const res = await fetch(apiUrl('/auth/me'), {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok) {
          setAccountSummary(data);
        }
      } catch (err) {
        console.error('Failed to load account summary', err);
      }
    };

    void fetchAccountSummary();
  }, [authToken, isSettingsOpen]);

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
      setTruthReveal(null);
      setLocationClues(null);
      setWarrants(activeSession.activeWarrants || [], activeSession.usedWarrants || []);
      router.push('/map');
    } catch (err) {
      console.error('Failed to resume session', err);
      setResumeLoading(false);
    }
  };

  const startWithDifficultyAndScenario = async (
    difficulty: string,
    scenarioType: string,
    testMode = isTestModeStart,
  ) => {
    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/game-sessions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ difficulty, scenarioType, testMode }),
      });
      const data = await res.json();

      if (res.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (res.status === 403) {
        setError(data.message || 'Gunluk sorusturma limitine ulastiniz.');
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
        setTruthReveal(null);
        setLocationClues(null);
        router.push('/map');
        setLoading(false);
      } else {
        setError(
          data.message ||
            'Yapay zeka su an mesgul veya bir hata olustu. Lutfen biraz bekleyip tekrar deneyin.',
        );
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to start session', err);
      setError('Sunucuya baglanilamadi. Backend servisinin calistigindan emin olun.');
      setLoading(false);
    }
  };

  const handleStart = () => {
    setIsTestModeStart(false);
    void startWithDifficultyAndScenario(selectedDifficulty, selectedStory);
  };

  const handleConfigModalOpen = () => {
    setTempDifficulty(selectedDifficulty);
    setTempStory(selectedStory);
    setIsConfigModalOpen(true);
  };

  const handleConfigSave = () => {
    setSelectedDifficulty(tempDifficulty);
    setSelectedStory(tempStory);
    setIsConfigModalOpen(false);
  };

  const DIFFICULTY_DETAILS: Record<string, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
  };

  const STORY_DETAILS: Record<string, { title: string; badge: string; desc: string }> = {
    medieval: {
      title: 'Medieval Era - Ashenmoor',
      badge: 'Varsayılan Hikaye',
      desc: 'Engizisyon, batıl inanç ve karanlık sırlar. Standart karanlık fantezi deneyimi.'
    },
    modern: {
      title: '90\'lar Amerikan Kasabası',
      badge: 'Satın Alındı',
      desc: 'Oakhaven. Yerel polis, cinayet dedektifleri ve şüpheli kasabalılar.'
    },
    cyberpunk: {
      title: 'Distopik Cyberpunk',
      badge: 'Satın Alındı',
      desc: 'Neon Prime. Yozlaşmış mega şirketler, siber geliştirmeler ve tech-noir.'
    }
  };

  const effectiveIsAdmin = accountSummary?.isAdmin ?? isAdmin;
  const effectiveIsPremium = accountSummary?.isPremium ?? isPremium;
  const effectiveEmail = accountSummary?.email ?? userEmail ?? '-';
  const fallbackMaxSessions = effectiveIsAdmin ? 999 : effectiveIsPremium ? 5 : 2;
  const fallbackMaxMessages = effectiveIsAdmin ? 999 : effectiveIsPremium ? 100 : 30;

  return (
    <main className={styles.main}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <img src="/logo/favicon.png" alt="Inquisitor Logo" className={styles.logo} />
          <span className={styles.navTitle}>The Inquisitor</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.currency}>
            <span className={styles.currencyIcon}>🪙</span>
            <span>100</span>
          </div>
          <button
            className={styles.settingsBtn}
            onClick={() => setIsSettingsOpen(true)}
            title="Ayarlar"
            aria-label="Ayarlar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M19.4 15A1 1 0 0 0 19.6 16.1L19.65 16.15A1 1 0 0 1 19.65 17.56L17.56 19.65A1 1 0 0 1 16.15 19.65L16.1 19.6A1 1 0 0 0 15 19.4A1 1 0 0 0 14.4 20.32V20.5A1 1 0 0 1 13.4 21.5H10.6A1 1 0 0 1 9.6 20.5V20.32A1 1 0 0 0 9 19.4A1 1 0 0 0 7.9 19.6L7.85 19.65A1 1 0 0 1 6.44 19.65L4.35 17.56A1 1 0 0 1 4.35 16.15L4.4 16.1A1 1 0 0 0 4.6 15A1 1 0 0 0 3.68 14.4H3.5A1 1 0 0 1 2.5 13.4V10.6A1 1 0 0 1 3.5 9.6H3.68A1 1 0 0 0 4.6 9A1 1 0 0 0 4.4 7.9L4.35 7.85A1 1 0 0 1 4.35 6.44L6.44 4.35A1 1 0 0 1 7.85 4.35L7.9 4.4A1 1 0 0 0 9 4.6A1 1 0 0 0 9.6 3.68V3.5A1 1 0 0 1 10.6 2.5H13.4A1 1 0 0 1 14.4 3.5V3.68A1 1 0 0 0 15 4.6A1 1 0 0 0 16.1 4.4L16.15 4.35A1 1 0 0 1 17.56 4.35L19.65 6.44A1 1 0 0 1 19.65 7.85L19.6 7.9A1 1 0 0 0 19.4 9A1 1 0 0 0 20.32 9.6H20.5A1 1 0 0 1 21.5 10.6V13.4A1 1 0 0 1 20.5 14.4H20.32A1 1 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </nav>

      <div className={styles.vignette} />

      <div className={styles.particles}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerTopRight} />
      <div className={styles.cornerBotLeft} />
      <div className={styles.cornerBotRight} />

      <div className={styles.layoutContainer}>
        {/* SOL KOLON: KARAKTER & LEADERBOARD */}
        <div className={styles.leftCol}>
          <div className={styles.characterPanel}>
            <div className={styles.characterDisplay}>
              <img 
                src="/characters/inquisitor2/idle/south.png" 
                alt="Inquisitor Character" 
                className={styles.characterSprite}
              />
            </div>
            <div className={styles.characterInfo}>
              <h2>Çaylak Engizitör</h2>
              <p>Varsayılan Kıyafetler (Ücretsiz)</p>
            </div>
          </div>
          
          <div className={styles.leaderboardPanel}>
            <h3 className={styles.leaderboardTitle}>Engizitör Sıralaması</h3>
            <div className={styles.leaderboardList}>
              <div className={styles.leaderboardItem}>
                <span className={styles.lbRank}>1</span>
                <span className={styles.lbName}>---</span>
                <span className={styles.lbScore}>0</span>
              </div>
              <div className={styles.leaderboardItem}>
                <span className={styles.lbRank}>2</span>
                <span className={styles.lbName}>---</span>
                <span className={styles.lbScore}>0</span>
              </div>
              <div className={styles.leaderboardItem}>
                <span className={styles.lbRank}>3</span>
                <span className={styles.lbName}>---</span>
                <span className={styles.lbScore}>0</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: HİKAYE VE MENÜ */}
        <div className={styles.rightCol}>
          <div className={styles.storyPanel}>
            <div className={styles.seal}>
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sealSvg}>
                <circle cx="60" cy="60" r="55" stroke="#8A0303" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx="60" cy="60" r="45" stroke="#8A0303" strokeWidth="0.5" opacity="0.5" />
                <line x1="60" y1="20" x2="60" y2="100" stroke="#8A0303" strokeWidth="1.5" />
                <line x1="20" y1="60" x2="100" y2="60" stroke="#8A0303" strokeWidth="1.5" />
                <rect x="56" y="56" width="8" height="8" fill="#8A0303" transform="rotate(45 60 60)" />
                <rect x="56" y="16" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 20)" />
                <rect x="56" y="96" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 60 100)" />
                <rect x="16" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 20 60)" />
                <rect x="96" y="56" width="8" height="8" fill="none" stroke="#8A0303" strokeWidth="1" transform="rotate(45 100 60)" />
              </svg>
            </div>

            <div className={styles.eyebrow}>- ANNO DOMINI MCCXII -</div>
            <h1 className={styles.title}>The Inquisitor</h1>
            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerIcon}>*</span>
              <span className={styles.dividerLine} />
            </div>

            {/* Seçili Hikaye Kartı */}
            <div className={styles.activeStoryCard}>
              <h3 className={styles.storyName}>{STORY_DETAILS[selectedStory]?.title}</h3>
              <span className={styles.difficultyBadge}>{DIFFICULTY_DETAILS[selectedDifficulty]} Zorluk &bull; {STORY_DETAILS[selectedStory]?.badge}</span>
              <p className={styles.storyDesc}>{STORY_DETAILS[selectedStory]?.desc}</p>
              
              <div className={styles.storyCta}>
                {activeSession && !checkingSession && (
                  <button onClick={handleResume} disabled={resumeLoading} className={styles.btnPrimary}>
                    {resumeLoading ? 'Dönülüyor...' : `Soruşturmaya Devam Et (Gün ${activeSession.currentDay})`}
                  </button>
                )}
                <button onClick={handleStart} disabled={loading} className={styles.btnPrimary}>
                  {loading ? 'Hazırlanıyor...' : (activeSession ? 'Yeni Soruşturma Başlat' : 'Soruşturmaya Başla')}
                </button>
                <button className={styles.btnSecondary} onClick={handleConfigModalOpen}>
                  Hikaye & Zorluk Değiştir
                </button>
              </div>
              
              {testModeAvailable && (
                <button onClick={() => { setIsTestModeStart(true); void startWithDifficultyAndScenario(selectedDifficulty, selectedStory, true); }} className={styles.btnSecondary} style={{ width: '100%', marginTop: '12px', borderStyle: 'dashed' }}>
                  Test Modu (Yapay Zekasız)
                </button>
              )}
            </div>

            {/* Alt Menüler (Market & Community) */}
            <div className={styles.bottomNavGroup}>
              <button className={styles.navBtnMarket} onClick={() => router.push('/market')}>
                <span className={styles.navIcon}>🪙</span>
                Market (Hikaye & Kozmetik)
              </button>
              <button className={styles.navBtnCommunity} onClick={() => router.push('/community')}>
                <span className={styles.navIcon}>📜</span>
                Community (Kendi Hikayeni Oluştur)
              </button>
            </div>

            <div className={styles.bottomRule}>
              <span />
              <span className={styles.bottomRuleText}>Inquisitor AI · Est. MCCXII</span>
              <span />
            </div>
          </div>
        </div>
      </div>

      {isHowToPlayOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHowToPlayOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsHowToPlayOpen(false)}>
              &times;
            </button>
            <h2 className={styles.modalTitle}>Sorusturma Kilavuzu</h2>

            <div className={styles.modalScroll}>
              <section className={styles.guideSection}>
                <h3>Temel Amac</h3>
                <p>
                  Ashenmoor koyunde islenen gizemli bir cinayeti cozmekle gorevli bir
                  Engizisyon mufettisisin. 4 gunun var. Bu sure zarfinda dogru kisiyi
                  olume mahkum etmeli ve gercegi ortaya cikarmalisin.
                </p>
              </section>

              <section className={styles.guideSection}>
                <h3>Zaman Yonetimi</h3>
                <p>
                  Bir mekana her girdiginde vakit ilerler. Gece oldugunda herkes evine
                  cekilir ve gun biter.
                </p>
              </section>

              <section className={styles.guideSection}>
                <h3>Arama Izinleri</h3>
                <p>
                  Koyluleri sadece sorgulayarak degil, mekanlarini arayarak da kanit
                  bulabilirsin. Ama bir mekani aramak icin Peder Malachar'dan arama izni
                  almalisin.
                </p>
              </section>

              <section className={styles.guideSection}>
                <h3>Not Tutma</h3>
                <p>
                  Koylulerin soyledikleri celiskili olabilir. Onemli ipuclarini not
                  defterine kaydet.
                </p>
              </section>

              <section className={styles.guideSection}>
                <h3>Nihai Hukum</h3>
                <p>
                  Istedigin an haritadaki Mahkumu Sec butonuna basarak birini suclayabilirsin.
                  Yanlis kisiyi asarsan gercek katil aramizda dolasmaya devam eder.
                </p>
              </section>

              <div className={styles.guideTip}>
                <strong>Ipuucu:</strong> Her yalan soyleyen koylu katil olmayabilir.
              </div>
            </div>

            <button className={styles.modalActionBtn} onClick={() => setIsHowToPlayOpen(false)}>
              Anladim.
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div className={`${styles.modalContent} ${styles.settingsModal}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsSettingsOpen(false)}>
              &times;
            </button>
            <h2 className={styles.modalTitle}>Ayarlar</h2>

            <div className={styles.settingsBody}>
              <div className={styles.settingsSection}>
                <div className={styles.settingsLabel}>Hesap Detaylari</div>
                <div className={styles.accountCard}>
                  <div className={styles.accountRow}>
                    <span>E-posta</span>
                    <strong>{effectiveEmail}</strong>
                  </div>
                  <div className={styles.accountRow}>
                    <span>Plan</span>
                    <strong>
                      {effectiveIsAdmin
                        ? 'Admin'
                        : effectiveIsPremium
                          ? 'Premium'
                          : 'Ucretsiz'}
                    </strong>
                  </div>
                  <div className={styles.accountRow}>
                    <span>Kalan Oturum</span>
                    <strong>
                      {accountSummary
                        ? `${Math.max(0, accountSummary.maxSessionsPerDay - accountSummary.dailySessionCount)} / ${accountSummary.maxSessionsPerDay === 999 ? 'Sinirsiz' : accountSummary.maxSessionsPerDay}`
                        : effectiveIsAdmin
                          ? 'Sinirsiz / Sinirsiz'
                          : `${fallbackMaxSessions} / ${fallbackMaxSessions}`}
                    </strong>
                  </div>
                  <div className={styles.accountRow}>
                    <span>Kalan Diyalog</span>
                    <strong>
                      {accountSummary
                        ? `${Math.max(0, accountSummary.maxMessagesPerDay - accountSummary.dailyMessageCount)} / ${accountSummary.maxMessagesPerDay === 999 ? 'Sinirsiz' : accountSummary.maxMessagesPerDay}`
                        : effectiveIsAdmin
                          ? 'Sinirsiz / Sinirsiz'
                          : `${fallbackMaxMessages} / ${fallbackMaxMessages}`}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={styles.settingsSection}>
                <div className={styles.settingsLabel}>Ana Menu Muzigi</div>
                <div className={styles.soundControls}>
                  <div className={styles.volumeWrapper}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className={styles.volumeSlider}
                    />
                  </div>
                  <button
                    className={styles.muteBtn}
                    onClick={handleMuteToggle}
                    title={isMuted ? 'Sesi Ac' : 'Sesi Kapat'}
                  >
                    {isMuted || volume === 0 ? 'MUTE' : 'SOUND'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className={styles.settingsLogoutBtn}
              >
                Hesaptan Cikis Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfigModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsConfigModalOpen(false)}>
          <div className={`${styles.modalContent} ${styles.configModalContent}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsConfigModalOpen(false)}>
              &times;
            </button>
            <h2 className={styles.modalTitle} style={{ textAlign: 'center' }}>
              Maceranı Şekillendir
            </h2>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#E8DCC4', marginBottom: '12px', borderBottom: '1px solid rgba(138, 3, 3, 0.3)', paddingBottom: '8px' }}>
                1. Hikaye Evreni
              </h3>
              <div className={styles.selectionList} style={{ marginTop: '12px' }}>
                <button
                  onClick={() => setTempStory('medieval')}
                  className={`${styles.selectionBtn} ${styles.scenarioMedieval} ${tempStory === 'medieval' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Klasik Ortaçağ</span>
                  </div>
                  <p>Ashenmoor Köyü. Engizisyon, batıl inanç ve karanlık sırlar.</p>
                </button>

                <button
                  onClick={() => setTempStory('modern')}
                  className={`${styles.selectionBtn} ${styles.scenarioModern} ${tempStory === 'modern' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>90'lar Amerikan Kasabası</span>
                  </div>
                  <p>Oakhaven. Yerel polis, cinayet dedektifleri ve şüpheli kasabalılar.</p>
                </button>

                <button
                  onClick={() => setTempStory('cyberpunk')}
                  className={`${styles.selectionBtn} ${styles.scenarioCyberpunk} ${tempStory === 'cyberpunk' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Distopik Cyberpunk</span>
                  </div>
                  <p>Neon Prime. Yozlaşmış mega şirketler, siber geliştirmeler ve tech-noir bilimkurgu.</p>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ color: '#E8DCC4', marginBottom: '12px', borderBottom: '1px solid rgba(138, 3, 3, 0.3)', paddingBottom: '8px' }}>
                2. Zorluk Seviyesi
              </h3>
              <div className={styles.selectionList} style={{ marginTop: '12px' }}>
                <button
                  onClick={() => setTempDifficulty('easy')}
                  className={`${styles.selectionBtn} ${styles.difficultyEasy} ${tempDifficulty === 'easy' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Kolay</span>
                    <span>4 Şüpheli</span>
                  </div>
                  <p>Hancı, Peder, Mezarcı ve Değirmenci. Standart soruşturma deneyimi.</p>
                </button>

                <button
                  onClick={() => setTempDifficulty('medium')}
                  className={`${styles.selectionBtn} ${styles.difficultyMedium} ${tempDifficulty === 'medium' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Orta</span>
                    <span>5 Şüpheli</span>
                  </div>
                  <p>+ Çiftçi Edmund. Artan şüpheli sayısıyla daha karmaşık ilişkiler.</p>
                </button>

                <button
                  onClick={() => setTempDifficulty('hard')}
                  className={`${styles.selectionBtn} ${styles.difficultyHard} ${tempDifficulty === 'hard' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Zor</span>
                    <span>6 Şüpheli</span>
                  </div>
                  <p>+ Doktor. Kalabalıklaşan şüpheli listesiyle en karmaşık hikaye.</p>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button className={styles.modalActionBtn} style={{ width: '100%' }} onClick={handleConfigSave}>
                Seçimleri Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
