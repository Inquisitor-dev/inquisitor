'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Coins,
  Crown,
  Gavel,
  Hourglass,
  KeyRound,
  Lightbulb,
  LogOut,
  Maximize,
  Minimize,
  NotebookPen,
  ScrollText,
  Settings,
  Shirt,
  Skull,
  Store,
  Target,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { apiUrl } from '@/config/api';
import { useGameStore } from '@/store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import styles from './page.module.scss';

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};

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

  const { tokenBalance, hasHydrated: marketHydrated } = useMarketStore();

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

  // Tam ekran: F11 ile aynı işi görür. Esc ile çıkıldığında da düğme güncel kalsın diye olay dinlenir.
  // Tam ekranı desteklemeyen tarayıcılarda (ör. iPhone Safari) düğme hiç gösterilmez.
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const canFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch((err) => {
        console.error('Tam ekrana geçilemedi', err);
      });
    }
  };

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
      router.push('/');
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
        router.push('/');
        return;
      }

      if (res.status === 403) {
        setError(data.message || 'Bugünkü soruşturma hakkın doldu.');
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
            'Yapay zekâ şu an meşgul ya da bir hata oluştu. Biraz bekleyip tekrar dene.',
        );
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to start session', err);
      setError('Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.');
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

  const DIFFICULTY_DETAILS: Record<string, { label: string; level: number; suspects: number }> = {
    easy: { label: 'Kolay', level: 1, suspects: 4 },
    medium: { label: 'Orta', level: 2, suspects: 5 },
    hard: { label: 'Zor', level: 3, suspects: 6 },
  };

  const STORY_DETAILS: Record<string, { title: string; era: string; desc: string }> = {
    medieval: {
      title: 'Ashenmoor',
      era: 'Karanlık Ortaçağ',
      desc: 'Engizisyon, batıl inanç ve sisli mezarlıklar. Her köylünün dualarının altında bir sır yatar.',
    },
    modern: {
      title: 'Oakhaven',
      era: "90'lar Amerikan Kasabası",
      desc: 'Yerel polis, cinayet dedektifleri ve ormanın kenarında birbirini koruyan şüpheli kasabalılar.',
    },
    cyberpunk: {
      title: 'Neon Prime',
      era: 'Distopik Cyberpunk',
      desc: 'Yozlaşmış mega şirketler, siber geliştirmeler ve hafızaların bile satılık olduğu tech-noir bir şehir.',
    },
  };

  const story = STORY_DETAILS[selectedStory] ?? STORY_DETAILS.medieval;
  const difficulty = DIFFICULTY_DETAILS[selectedDifficulty] ?? DIFFICULTY_DETAILS.easy;
  const inquisitorName = userEmail ? userEmail.split('@')[0] : 'Engizitör';

  const effectiveIsAdmin = accountSummary?.isAdmin ?? isAdmin;
  const effectiveIsPremium = accountSummary?.isPremium ?? isPremium;
  const effectiveEmail = accountSummary?.email ?? userEmail ?? '-';
  const fallbackMaxSessions = effectiveIsAdmin ? 999 : effectiveIsPremium ? 5 : 2;
  const fallbackMaxMessages = effectiveIsAdmin ? 999 : effectiveIsPremium ? 100 : 30;

  const getMapImage = (story: string) => {
    switch (story) {
      case 'modern': return '/map/town_map_night.png';
      case 'cyberpunk': return '/map/cyberpunk_map_night.png';
      case 'medieval':
      default: return '/map/village_map.png';
    }
  };

  return (
    <main className={styles.main}>
      <div
        key={selectedStory}
        className={styles.dynamicBg}
        style={{ backgroundImage: `url('${getMapImage(selectedStory)}')` }}
      />
      <div className={styles.bgShade} />

      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <img src="/logo/favicon.png" alt="" className={styles.logo} />
          <span className={styles.navTitle}>The Inquisitor</span>
        </div>

        <div className={styles.navLinks}>
          <Link href="/market" className={styles.navLink}>
            <Store size={16} /> Market
          </Link>
          <Link href="/community" className={styles.navLink}>
            <Users size={16} /> Topluluk
          </Link>
          <button className={styles.navLink} onClick={() => setIsHowToPlayOpen(true)}>
            <BookOpen size={16} /> Nasıl Oynanır
          </button>
        </div>

        <div className={styles.navRight}>
          <Link href="/market" className={styles.currency} title="Token bakiyen · Markete git">
            <span className={styles.currencyIcon}><Coins size={15} /></span>
            <span>{marketHydrated ? tokenBalance.toLocaleString('tr-TR') : '—'}</span>
          </Link>
          {canFullscreen && (
            <button
              className={styles.settingsBtn}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          )}
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

      <div className={styles.lobby}>
        {/* KARAKTER */}
        <section className={`${styles.panel} ${styles.characterPanel}`}>
          <span className={styles.panelEyebrow}>Engizitör</span>
          <div className={styles.characterStage}>
            <span className={styles.characterHalo} />
            <img
              src="/characters/inquisitor2/idle/south.png"
              alt="Engizitör karakteri"
              className={styles.characterSprite}
            />
            <span className={styles.characterPedestal} />
          </div>
          <h2 className={styles.characterName}>{inquisitorName}</h2>
          <span className={styles.characterRank}>Çaylak Engizitör</span>
          <Link href="/market" className={styles.wardrobeBtn}>
            <Shirt size={15} /> Gardırop
          </Link>
        </section>

        {/* AKTİF DOSYA */}
        <section className={styles.casePanel}>
          <span className={styles.caseSeal} aria-hidden>✠</span>
          <span className={styles.caseEyebrow}>{story.era}</span>
          <h1 className={styles.caseTitle}>{story.title}</h1>

          <div className={styles.caseMeta}>
            <span className={styles.metaChip}>
              {[1, 2, 3].map((lvl) => (
                <Skull
                  key={lvl}
                  size={14}
                  className={lvl <= difficulty.level ? styles.skullOn : styles.skullOff}
                />
              ))}
              {difficulty.label} Zorluk
            </span>
            <span className={styles.metaChip}>
              <Users size={14} /> {difficulty.suspects} Şüpheli
            </span>
          </div>

          <p className={styles.caseDesc}>{story.desc}</p>

          <div className={styles.caseActions}>
            {activeSession && !checkingSession && (
              <button onClick={handleResume} disabled={resumeLoading} className={styles.btnPrimary}>
                {resumeLoading ? 'Dönülüyor...' : `Soruşturmaya Devam Et · Gün ${activeSession.currentDay}`}
              </button>
            )}
            <button
              onClick={handleStart}
              disabled={loading}
              className={activeSession ? styles.btnSecondary : styles.btnPrimary}
            >
              {loading ? 'Dosya Hazırlanıyor...' : activeSession ? 'Yeni Soruşturma Başlat' : 'Soruşturmaya Başla'}
            </button>
            <button className={styles.btnGhost} onClick={handleConfigModalOpen}>
              <ScrollText size={15} /> Evren ve Zorluğu Değiştir
            </button>
            {testModeAvailable && (
              <button
                onClick={() => { setIsTestModeStart(true); void startWithDifficultyAndScenario(selectedDifficulty, selectedStory, true); }}
                className={`${styles.btnGhost} ${styles.btnDashed}`}
              >
                Test Modu (Yapay Zekasız)
              </button>
            )}
          </div>

          {error && <p className={styles.caseError} role="alert">{error}</p>}
        </section>

        {/* Dar ekranlarda navbar bağlantıları gizlenir; burada gösterilir */}
        <nav className={styles.quickLinks} aria-label="Hızlı bağlantılar">
          <Link href="/market" className={styles.quickLink}>
            <Store size={18} /> Market
          </Link>
          <Link href="/community" className={styles.quickLink}>
            <Users size={18} /> Topluluk
          </Link>
          <button className={styles.quickLink} onClick={() => setIsHowToPlayOpen(true)}>
            <BookOpen size={18} /> Kılavuz
          </button>
        </nav>

        {/* SIRALAMA */}
        <section className={`${styles.panel} ${styles.leaderboardPanel}`}>
          <header className={styles.leaderboardHeader}>
            <Crown size={18} />
            <h3 className={styles.leaderboardTitle}>Engizitör Sıralaması</h3>
          </header>
          <ol className={styles.leaderboardList}>
            {[1, 2, 3, 4, 5].map((rank) => (
              <li key={rank} className={`${styles.leaderboardItem} ${rank <= 3 ? styles[`podium${rank}`] : ''}`}>
                <span className={styles.lbRank}>{rank}</span>
                <span className={styles.lbName}>—</span>
                <span className={styles.lbScore}>0</span>
              </li>
            ))}
          </ol>
          <div className={styles.lbSelf}>
            <span className={styles.lbRank}>—</span>
            <span className={styles.lbName}>{inquisitorName} <em>(sen)</em></span>
            <span className={styles.lbScore}>0</span>
          </div>
          <p className={styles.lbNote}>İlk sezon yakında başlıyor. Çözdüğün her vaka seni üst sıralara taşıyacak.</p>
        </section>
      </div>

      <div className={styles.footerRule}>
        <span />
        <span className={styles.footerRuleText} lang="en">Inquisitor AI · Est. MCCXII</span>
        <span />
      </div>

      {isHowToPlayOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHowToPlayOpen(false)}>
          <div
            className={`${styles.sheet} ${styles.guideSheet}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.sheetClose} onClick={() => setIsHowToPlayOpen(false)} aria-label="Kapat">
              <X size={18} />
            </button>
            <span className={styles.sheetSeal} aria-hidden>✠</span>
            <span className={styles.sheetEyebrow}>Engizitörün El Kitabı</span>
            <h2 id="guide-title" className={styles.sheetTitle}>Soruşturma Kılavuzu</h2>
            <p className={styles.sheetLead}>
              Bir cinayet işlendi ve katil hâlâ aranızda. Dört gün içinde gerçeği bul ve doğru kişiyi mahkûm et.
            </p>

            <ol className={styles.guideSteps}>
              <li className={styles.guideStep}>
                <span className={styles.guideIcon}><Target size={18} /></span>
                <div>
                  <h3>Amacın</h3>
                  <p>
                    Sen, cinayeti çözmekle görevli bir Engizisyon müfettişisin. <strong>Dört günün</strong> var:
                    şüphelileri sorgula, kanıtları topla ve süre dolmadan katili bul.
                  </p>
                </div>
              </li>
              <li className={styles.guideStep}>
                <span className={styles.guideIcon}><Hourglass size={18} /></span>
                <div>
                  <h3>Zaman</h3>
                  <p>
                    Bir mekâna her girdiğinde vakit ilerler. Gece çöktüğünde herkes evine çekilir ve gün biter;
                    zamanını nereye harcadığına dikkat et.
                  </p>
                </div>
              </li>
              <li className={styles.guideStep}>
                <span className={styles.guideIcon}><KeyRound size={18} /></span>
                <div>
                  <h3>Arama İzinleri</h3>
                  <p>
                    Kanıtları yalnızca sorgularda değil, mekânları arayarak da bulabilirsin. Bir mekânı aramak için
                    izin gerekir: Ashenmoor’da izni <strong>Peder Malachar</strong>, diğer evrenlerde karakoldaki yetkili
                    verir. Bir soruşturmada en fazla iki izin alabilirsin.
                  </p>
                </div>
              </li>
              <li className={styles.guideStep}>
                <span className={styles.guideIcon}><NotebookPen size={18} /></span>
                <div>
                  <h3>Notlar</h3>
                  <p>
                    Şüphelilerin anlattıkları birbiriyle çelişebilir. Önemli ayrıntıları not defterine yaz; çelişkiler
                    seni katile götürür.
                  </p>
                </div>
              </li>
              <li className={styles.guideStep}>
                <span className={styles.guideIcon}><Gavel size={18} /></span>
                <div>
                  <h3>Hüküm</h3>
                  <p>
                    Hazır olduğunda haritadaki <strong>Hüküm Verilecek Kişiyi Seç</strong> düğmesiyle kararını ver.
                    Yanlış kişiyi mahkûm edersen gerçek katil elini kolunu sallayarak dolaşmaya devam eder.
                  </p>
                </div>
              </li>
            </ol>

            <div className={styles.guideTip}>
              <Lightbulb size={16} />
              <p>
                <strong>İpucu:</strong> Yalan söyleyen herkes katil değildir. Masumların da saklayacak sırları var.
              </p>
            </div>

            <button className={styles.sheetPrimary} onClick={() => setIsHowToPlayOpen(false)}>
              Anladım
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div
            className={`${styles.sheet} ${styles.settingsSheet}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.sheetClose} onClick={() => setIsSettingsOpen(false)} aria-label="Kapat">
              <X size={18} />
            </button>
            <span className={styles.sheetSeal} aria-hidden><Settings size={20} /></span>
            <span className={styles.sheetEyebrow}>Hesap ve Tercihler</span>
            <h2 id="settings-title" className={styles.sheetTitle}>Ayarlar</h2>

            <section className={styles.settingsBlock}>
              <h3 className={styles.blockLabel}>Hesap</h3>
              <div className={styles.profileRow}>
                <span className={styles.profileAvatar}>{(effectiveEmail[0] ?? '?').toUpperCase()}</span>
                <div className={styles.profileText}>
                  <strong>{inquisitorName}</strong>
                  <span>{effectiveEmail}</span>
                </div>
                <span className={styles.planBadge}>
                  {effectiveIsAdmin ? 'Admin' : effectiveIsPremium ? 'Premium' : 'Ücretsiz'}
                </span>
              </div>

              <div className={styles.quotaGrid}>
                {[
                  {
                    label: 'Bugün kalan soruşturma',
                    used: accountSummary?.dailySessionCount,
                    max: accountSummary?.maxSessionsPerDay ?? fallbackMaxSessions,
                  },
                  {
                    label: 'Bugün kalan diyalog',
                    used: accountSummary?.dailyMessageCount,
                    max: accountSummary?.maxMessagesPerDay ?? fallbackMaxMessages,
                  },
                ].map((quota) => {
                  const unlimited = effectiveIsAdmin || quota.max === 999;
                  const remaining = Math.max(0, quota.max - (quota.used ?? 0));
                  return (
                    <div key={quota.label} className={styles.quotaTile}>
                      <span className={styles.quotaLabel}>{quota.label}</span>
                      <span className={styles.quotaValue}>
                        {unlimited ? 'Sınırsız' : (
                          <>
                            {remaining}
                            <small> / {quota.max}</small>
                          </>
                        )}
                      </span>
                      {!unlimited && (
                        <span className={styles.quotaBar}>
                          <span style={{ width: `${(remaining / quota.max) * 100}%` }} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.settingsBlock}>
              <h3 className={styles.blockLabel}>Ana Menü Müziği</h3>
              <div className={styles.soundRow}>
                <button
                  className={styles.muteToggle}
                  onClick={handleMuteToggle}
                  title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
                  aria-label={isMuted ? 'Sesi aç' : 'Sesi kapat'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className={styles.volumeSlider}
                  style={{ '--fill': `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                  aria-label="Müzik sesi"
                />
                <span className={styles.volumeValue}>
                  {isMuted ? 'Kapalı' : `%${Math.round(volume * 100)}`}
                </span>
              </div>
            </section>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className={styles.logoutBtn}
            >
              <LogOut size={16} /> Çıkış Yap
            </button>
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
                1. Evren
              </h3>
              <div className={styles.selectionList} style={{ marginTop: '12px' }}>
                <button
                  onClick={() => setTempStory('medieval')}
                  className={`${styles.selectionBtn} ${styles.scenarioMedieval} ${tempStory === 'medieval' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Ashenmoor</span>
                  </div>
                  <p>Karanlık Ortaçağ. Engizisyon, batıl inanç ve karanlık sırlar.</p>
                </button>

                <button
                  onClick={() => setTempStory('modern')}
                  className={`${styles.selectionBtn} ${styles.scenarioModern} ${tempStory === 'modern' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Oakhaven</span>
                  </div>
                  <p>{"90'lar Amerikan kasabası. Yerel polis, cinayet dedektifleri ve şüpheli kasabalılar."}</p>
                </button>

                <button
                  onClick={() => setTempStory('cyberpunk')}
                  className={`${styles.selectionBtn} ${styles.scenarioCyberpunk} ${tempStory === 'cyberpunk' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Neon Prime</span>
                  </div>
                  <p>Distopik cyberpunk. Yozlaşmış mega şirketler, siber geliştirmeler ve tech-noir bilimkurgu.</p>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ color: '#E8DCC4', marginBottom: '12px', borderBottom: '1px solid rgba(138, 3, 3, 0.3)', paddingBottom: '8px' }}>
                2. Zorluk
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
                  <p>Dört şüpheliyle klasik bir soruşturma. İlk vaka için ideal.</p>
                </button>

                <button
                  onClick={() => setTempDifficulty('medium')}
                  className={`${styles.selectionBtn} ${styles.difficultyMedium} ${tempDifficulty === 'medium' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Orta</span>
                    <span>5 Şüpheli</span>
                  </div>
                  <p>Beşinci bir şüpheli olaya karışır; ilişkiler ve yalanlar karmaşıklaşır.</p>
                </button>

                <button
                  onClick={() => setTempDifficulty('hard')}
                  className={`${styles.selectionBtn} ${styles.difficultyHard} ${tempDifficulty === 'hard' ? styles.activeSelection : ''}`}
                >
                  <div>
                    <span>Zor</span>
                    <span>6 Şüpheli</span>
                  </div>
                  <p>Altı şüpheli ve çakışan tanıklıklar. En karmaşık hikâye.</p>
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
