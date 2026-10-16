'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Map as MapIcon,
  Maximize,
  Minimize,
  Settings,
  Shirt,
  Skull,
  Store,
  Users,
} from 'lucide-react';
import { api, ApiError } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import type { CrimeSceneInfo } from '@/store/slices/types';
import { useMarketStore } from '@/store/useMarketStore';
import { MARKET_ITEMS } from '../market/marketItems';
import CharacterTurntable from '@/components/character/CharacterTurntable';
import OutfitStory from '@/components/character/OutfitStory';
import { OUTFITS, findOutfit, ownsOutfit, wearableOutfitId } from '@/config/outfits';
import { getAvatarSrc, getAvatarInfo } from '@/config/avatars';
import { showScene } from '@/components/SceneTransition/sceneStore';
import { mapScene } from '@/components/SceneTransition/scenes';
import { useAudioSettings } from '@/features/audio/useAudioSettings';
import HowToPlayModal from './components/HowToPlayModal/HowToPlayModal';
import SettingsModal from './components/SettingsModal/SettingsModal';
import ScenarioConfigModal from './components/ScenarioConfigModal/ScenarioConfigModal';
import {
  DIFFICULTY_DETAILS,
  STORY_DETAILS,
  getMapImage,
} from './components/ScenarioConfigModal/scenarioConfigData';
import styles from './page.module.scss';

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};

// GET /game-sessions/active yanıtındaki oturum (yalnızca devam etmek için gereken alanlar)
interface ActiveSession {
  id: string;
  scenarioType?: string;
  scenario?: string;
  currentDay?: number;
  timeOfDay?: number;
  notes?: string;
  difficulty?: string;
  activeWarrants?: string[];
  usedWarrants?: string[];
  lastDay?: number;
  abilityState?: { secondBreath?: { clearedNpcId?: string } };
  crimeScene?: CrimeSceneInfo | null;
}

export default function HomePage() {
  const router = useRouter();
  const {
    setSessionId,
    setScenario,
    setCurrentDay,
    setCaseProgress,
    setTimeOfDay,
    setNotes,
    setWarrants,
    setDifficulty,
    setScenarioType,
    setCrimeScene,
    setTruthReveal,
    setLocationClues,
    authToken,
    userEmail,
    username,
    avatar,
    setProfile,
    isAdmin,
    logout,
    hasHydrated,
  } = useGameStore();

  const {
    tokenBalance,
    ownedItemIds,
    equippedOutfitId,
    hasHydrated: marketHydrated,
    fetchMarketData,
    equipOutfit,
  } = useMarketStore();

  // Lobideki karakter: giyili olan, oklarla sahip olunan karakterler arasında değiştirilir
  const wornOutfitId = marketHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  const wornOutfit = wornOutfitId ? findOutfit(wornOutfitId) : undefined;
  const wardrobeOutfits = marketHydrated ? OUTFITS.filter((o) => o.ready && ownsOutfit(o, ownedItemIds)) : [];
  const cycleOutfit = (step: number) => {
    if (!wornOutfitId || wardrobeOutfits.length < 2) return;
    const index = wardrobeOutfits.findIndex((o) => o.id === wornOutfitId);
    const next = wardrobeOutfits[(index + step + wardrobeOutfits.length) % wardrobeOutfits.length];
    equipOutfit(next.id);
  };

  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Seçili aktif oyun parametreleri
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [selectedStory, setSelectedStory] = useState<string>('medieval');
  
  // Modaldaki geçici seçim parametreleri
  const [tempDifficulty, setTempDifficulty] = useState<string>('easy');
  const [tempStory, setTempStory] = useState<string>('medieval');

  // Profil düzenleme state'i
  const [editUsername, setEditUsername] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('avatar_1');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Yapay zekasız test modu: sunucuda açıksa menüde ayrı bir düğme görünür
  const [testModeAvailable, setTestModeAvailable] = useState(false);
  const [isTestModeStart, setIsTestModeStart] = useState(false);
  const [audioSettings] = useAudioSettings();

  interface AccountSummary {
    email: string;
    username?: string | null;
    avatar?: string;
    maxMessagesPerDay: number;
    maxSessionsPerDay?: number;
    dailySessionCount?: number;
    dailyMessageCount?: number;
    isAdmin?: boolean;
    score?: number;
  }

  interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    score?: number;
    avatar?: string;
    isSelf?: boolean;
  }

  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selfRankEntry, setSelfRankEntry] = useState<LeaderboardEntry | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!hasHydrated || !authToken) return;
    let cancelled = false;
    api.get<{ enabled?: boolean }>('/game-sessions/test-mode', { cache: 'no-store' })
      .then((data) => {
        if (!cancelled && data?.enabled) setTestModeAvailable(true);
      })
      .catch(() => {});

    // Backend'den pazar bakiyesi ve gerçek sıralama verilerini çek
    fetchMarketData(authToken);
    api.get<{ leaderboard?: LeaderboardEntry[]; self?: LeaderboardEntry }>('/market/leaderboard')
      .then((data) => {
        if (!cancelled && data?.leaderboard) {
          setLeaderboard(data.leaderboard);
          if (data.self) setSelfRankEntry(data.self);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authToken, hasHydrated, fetchMarketData]);

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

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Main_Soundtrack.mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = audioSettings.musicVolume;

    if (audioSettings.musicMuted || audioSettings.musicVolume === 0) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.log('Audio play failed:', err));
    }
  }, [audioSettings.musicMuted, audioSettings.musicVolume]);

  useEffect(() => {
    return () => {
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
        const data = await api.get<{ session?: ActiveSession | null }>('/game-sessions/active', {
          cache: 'no-store',
        });
        setActiveSession(data.session ?? null);
      } catch (err) {
        logger.error('Failed to check active session', err);
      } finally {
        setCheckingSession(false);
      }
    };

    if (hasHydrated && authToken) {
      void checkActiveSession();
    } else if (hasHydrated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- oturum bilgisi persist edilen store'dan hidrasyon sonrası gelir
      setCheckingSession(false);
    }
  }, [authToken, hasHydrated]);

  const fetchAccountSummary = useCallback(async () => {
    if (!authToken) return;

    try {
      const data = await api.get<AccountSummary>('/auth/me', {
        cache: 'no-store',
      });
      setAccountSummary(data);
      if (data.username || data.avatar) {
        setProfile(data.username ?? null, data.avatar || 'avatar_1');
      }
    } catch (err) {
      logger.error('Failed to load account summary', err);
    }
  }, [authToken, setProfile]);

  useEffect(() => {
    if (hasHydrated && authToken) {
      // Ayarlar açılınca da güncel hesap bilgisi çekilir
      // eslint-disable-next-line react-hooks/set-state-in-effect -- istek sonucu geldiğinde state güncellenir
      void fetchAccountSummary();
    }
  }, [authToken, hasHydrated, isSettingsOpen, fetchAccountSummary]);

  useEffect(() => {
    if (isSettingsOpen) {
      const effUser = accountSummary?.username ?? username ?? '';
      const effAv = accountSummary?.avatar ?? avatar ?? 'avatar_1';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ayarlar her açılışta ve hesap bilgisi gelince forma doldurulur
      setEditUsername(effUser);
      setEditAvatar(effAv);
      setProfileMsg(null);
    }
  }, [isSettingsOpen, accountSummary, username, avatar]);

  const handleSaveProfile = async () => {
    if (!authToken) return;
    if (editUsername.trim().length < 3) {
      setProfileMsg({ type: 'error', text: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const data = await api.patch<{ success: boolean; username: string; avatar: string }>('/auth/profile', {
        username: editUsername.trim(),
        avatar: editAvatar,
      });
      if (data.success) {
        setProfile(data.username, data.avatar);
        setAccountSummary((prev) =>
          prev ? { ...prev, username: data.username, avatar: data.avatar } : null
        );
        setProfileMsg({ type: 'success', text: 'Profil başarıyla güncellendi.' });
        api.get<{ leaderboard?: LeaderboardEntry[]; self?: LeaderboardEntry }>('/market/leaderboard')
          .then((lb) => {
            if (lb?.leaderboard) setLeaderboard(lb.leaderboard);
            if (lb?.self) setSelfRankEntry(lb.self);
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      const text = err instanceof ApiError ? err.message : 'Profil güncellenemedi.';
      setProfileMsg({ type: 'error', text });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;

    setResumeLoading(true);

    try {
      setSessionId(activeSession.id);
      if (activeSession.scenarioType) setScenarioType(activeSession.scenarioType);
      if (activeSession.scenario) setScenario(activeSession.scenario);
      if (activeSession.currentDay) setCurrentDay(activeSession.currentDay);
      const cleared = activeSession.abilityState?.secondBreath?.clearedNpcId;
      setCaseProgress(activeSession.lastDay, cleared ? [cleared] : []);
      if (activeSession.timeOfDay !== undefined) setTimeOfDay(activeSession.timeOfDay);
      if (activeSession.notes) setNotes(activeSession.notes);
      if (activeSession.difficulty) setDifficulty(activeSession.difficulty);
      setCrimeScene(activeSession.crimeScene ?? null);
      setTruthReveal(null);
      setLocationClues(null);
      setWarrants(activeSession.activeWarrants || [], activeSession.usedWarrants || []);
      showScene(
        mapScene(activeSession.scenarioType, activeSession.timeOfDay ?? 0, activeSession.currentDay ?? 1, 'Soruşturmaya dönüyorsun'),
      );
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
      const data = await api.post<{
        id: string;
        scenario?: string;
        message?: string;
        crimeScene?: CrimeSceneInfo | null;
      }>('/game-sessions', {
        difficulty,
        scenarioType,
        testMode,
        // Giyili karakter vaka boyunca kilitlenir ve yeteneklerini belirler
        characterId: wearableOutfitId(equippedOutfitId, ownedItemIds),
      });

      if (data.id) {
        setSessionId(data.id);
        setDifficulty(difficulty);
        setScenarioType(scenarioType);
        setCrimeScene(data.crimeScene ?? null);
        if (data.scenario) {
          setScenario(data.scenario);
        }
        setTruthReveal(null);
        setLocationClues(null);
        showScene(mapScene(scenarioType, 0, 1, 'Soruşturma başlıyor'));
        router.push('/map');
      } else {
        setError(
          data.message ||
            'Yapay zekâ şu an meşgul ya da bir hata oluştu. Biraz bekleyip tekrar dene.',
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          logout();
          router.push('/');
          return;
        }
        if (err.status === 403) {
          setError(err.message || 'Bugünkü soruşturma hakkın doldu.');
          return;
        }
        setError(err.message);
      } else {
        logger.error('Failed to start session', err);
        setError('Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setIsTestModeStart(false);
    void startWithDifficultyAndScenario(selectedDifficulty, selectedStory);
  };

  useEffect(() => {
    if (!isConfigModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsConfigModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isConfigModalOpen]);

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

  const story = STORY_DETAILS[selectedStory] ?? STORY_DETAILS.medieval;
  const difficulty = DIFFICULTY_DETAILS[selectedDifficulty] ?? DIFFICULTY_DETAILS.easy;

  const effectiveIsAdmin = accountSummary?.isAdmin ?? isAdmin;
  const effectiveEmail = accountSummary?.email ?? userEmail ?? '-';
  const effectiveUsername = accountSummary?.username ?? username;
  const effectiveAvatar = accountSummary?.avatar ?? avatar ?? 'avatar_1';
  const inquisitorName = effectiveUsername || (userEmail ? userEmail.split('@')[0] : 'Engizitör');
  const fallbackMaxSessions = effectiveIsAdmin ? 999 : 5;
  const fallbackMaxMessages = effectiveIsAdmin ? 999 : 100;

  // Hesapta açık olanlar: varsayılanlar (Ashenmoor, Kolay), markette satın alınanlar ve admin
  const unlocksEverything = effectiveIsAdmin;
  const ownsMarketItem = (itemId: string) => marketHydrated && ownedItemIds.includes(itemId);
  const ownsUniverse = (id: string) =>
    id === 'medieval' || unlocksEverything || ownsMarketItem(`universe_${id}`);
  const ownsDifficulty = (id: string) =>
    id === 'easy' || unlocksEverything || ownsMarketItem(`difficulty_${id}`);
  const getUnlockPrice = (itemId: string) => MARKET_ITEMS.find((item) => item.id === itemId)?.price ?? '—';

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
          <div className={`${styles.characterStage} ${wornOutfit ? styles[`stage_${wornOutfit.rarity}`] : ''}`}>
            <span className={styles.characterHalo} />
            <CharacterTurntable
              outfitId={wornOutfitId}
              alt={wornOutfit?.name ?? 'Engizitör karakteri'}
              className={styles.characterSprite}
            />
            <span className={styles.characterPedestal} />
            {wornOutfit?.rarity === 'legendary' && (
              // Efsanevi karakterin ayaklarından yükselen kıvılcımlar
              <span className={styles.sparks} aria-hidden>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} style={{ '--i': i } as React.CSSProperties} />
                ))}
              </span>
            )}
            {wardrobeOutfits.length > 1 && (
              <>
                <button
                  className={`${styles.outfitArrow} ${styles.outfitArrowPrev}`}
                  onClick={() => cycleOutfit(-1)}
                  aria-label="Önceki karakter"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className={`${styles.outfitArrow} ${styles.outfitArrowNext}`}
                  onClick={() => cycleOutfit(1)}
                  aria-label="Sonraki karakter"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          {wornOutfit && (
            <span className={styles.outfitLabel}>
              {wornOutfit.name}
              {wardrobeOutfits.length > 1 && (
                <em>
                  {wardrobeOutfits.findIndex((o) => o.id === wornOutfit.id) + 1}/{wardrobeOutfits.length}
                </em>
              )}
            </span>
          )}
          {wornOutfit && (
            <div className={styles.outfitStory}>
              <p className={styles.outfitLore}>{wornOutfit.lore}</p>
              <OutfitStory outfit={wornOutfit} compact />
            </div>
          )}
          {/* Oyuncu kimliği: avatar, ad ve rütbe tek satırda; karakterin (kıyafetin) bilgisinden ayrı */}
          <div className={styles.identity}>
            <img src={getAvatarSrc(effectiveAvatar)} alt="Avatar" className={styles.identityAvatar} />
            <div className={styles.identityText}>
              <h2 className={styles.characterName}>{inquisitorName}</h2>
              <span className={styles.characterRank}>{getAvatarInfo(effectiveAvatar).role}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{
                background: 'rgba(218, 165, 32, 0.08)',
                border: '1px solid rgba(218, 165, 32, 0.3)',
                color: '#e8dcc4',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              <Settings size={13} /> Avatar & İsim
            </button>
            <Link href="/wardrobe" className={styles.wardrobeBtn}>
              <Shirt size={15} /> Gardırop
            </Link>
          </div>
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
            <button className={styles.loadoutBtn} onClick={handleConfigModalOpen} aria-label="Evren ve zorluğu değiştir">
              <span className={styles.loadoutItem}>
                <MapIcon size={16} />
                <span>
                  <small>Evren</small>
                  <strong>{story.title}</strong>
                </span>
              </span>
              <span className={styles.loadoutDivider} />
              <span className={styles.loadoutItem}>
                <Skull size={16} />
                <span>
                  <small>Zorluk</small>
                  <strong>{difficulty.label}</strong>
                </span>
              </span>
              <span className={styles.loadoutAction}>
                Değiştir <ChevronRight size={15} />
              </span>
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
            {(leaderboard.length > 0
              ? leaderboard.slice(0, 5)
              : [1, 2, 3, 4, 5].map((rank) => ({
                  rank,
                  name: '—',
                  score: 0,
                  userId: String(rank),
                  avatar: 'avatar_1',
                }))
            ).map((entry) => (
              <li
                key={entry.rank}
                className={`${styles.leaderboardItem} ${entry.rank <= 3 ? styles[`podium${entry.rank}`] : ''}`}
              >
                <span className={styles.lbRank}>{entry.rank}</span>
                <span className={styles.lbName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={getAvatarSrc(entry.avatar)}
                    alt=""
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '1px solid rgba(218, 165, 32, 0.4)',
                      flexShrink: 0,
                      objectFit: 'cover',
                    }}
                  />
                  <span>{entry.name}</span>
                </span>
                <span className={styles.lbScore}>{entry.score}</span>
              </li>
            ))}
          </ol>
          <div className={styles.lbSelf}>
            <span className={styles.lbRank}>{selfRankEntry?.rank ?? '—'}</span>
            <span className={styles.lbName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={getAvatarSrc(selfRankEntry?.avatar ?? effectiveAvatar)}
                alt=""
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: '1.5px solid #daa520',
                  flexShrink: 0,
                  objectFit: 'cover',
                }}
              />
              <span>{selfRankEntry?.name ?? `${inquisitorName} (sen)`}</span>
            </span>
            <span className={styles.lbScore}>{selfRankEntry?.score ?? accountSummary?.score ?? 0}</span>
          </div>
          <p className={styles.lbNote}>Çözülen her vaka dedektiflik puanını artırır ve seni üst sıralara taşır.</p>
        </section>
      </div>

      <div className={styles.footerRule}>
        <span />
        <span className={styles.footerRuleText} lang="en">Inquisitor AI · Est. MCCXII</span>
        <span />
      </div>

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        effectiveAvatar={effectiveAvatar}
        inquisitorName={inquisitorName}
        effectiveEmail={effectiveEmail}
        effectiveIsAdmin={effectiveIsAdmin}
        editAvatar={editAvatar}
        setEditAvatar={setEditAvatar}
        editUsername={editUsername}
        setEditUsername={setEditUsername}
        onSaveProfile={handleSaveProfile}
        profileSaving={profileSaving}
        profileMsg={profileMsg}
        tokenBalance={tokenBalance}
        accountSummary={accountSummary}
        fallbackMaxSessions={fallbackMaxSessions}
        fallbackMaxMessages={fallbackMaxMessages}
        onLogout={() => {
          logout();
          router.push('/');
        }}
      />

      <ScenarioConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        tempDifficulty={tempDifficulty}
        setTempDifficulty={setTempDifficulty}
        tempStory={tempStory}
        setTempStory={setTempStory}
        onSave={handleConfigSave}
        ownsUniverse={ownsUniverse}
        ownsDifficulty={ownsDifficulty}
        getUnlockPrice={getUnlockPrice}
      />
    </main>
  );
}
