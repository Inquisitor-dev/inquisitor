'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, useRef, useCallback, type CSSProperties } from 'react';
import { getInterior } from '@/config/interiorConfig';
import { getLocationLabel } from '@/config/locationLabels';
import { getPlayerHome } from '@/config/homeConfig';
import { getNpcDialoguePortrait, DIALOGUE_CONFIG } from '@/config/dialogueConfig';
import { getMapBackground, getMapName, TIME_LABELS } from '@/config/mapBackgrounds';
import { hideScene, revealScene, showScene } from '@/components/SceneTransition/sceneStore';
import { homeScene, interiorScene } from '@/components/SceneTransition/scenes';
import { useGameStore, type EvidenceItem } from '../../store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import { findOutfit, wearableOutfitId } from '@/config/outfits';
import { useCharacterManifest } from '@/components/character/characterManifest';
import styles from './map.module.scss';
import MapCharacter from './MapCharacter';
import { getRoadNetwork, type Point, type RoadNetwork } from './roads';
import { expandPath } from './roads';
import { smoothPath } from './walkPath';
import { useFootsteps } from './useFootsteps';
import { playDoorSound } from '@/features/audio/doorSound';
import AudioSettingsPanel from '@/features/audio/AudioSettingsPanel';
import NotebookModal from '@/components/CaseModals/NotebookModal';
import InventoryModal from '@/components/CaseModals/InventoryModal';
import CondemnModal from '@/components/CaseModals/CondemnModal';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { getScenarioMapLocations } from '@/config/mapLocations';
import { SCENARIO_REGISTRY } from '@/config/scenarioRegistry';
import {
  useMapWalking,
  depthScaleAt,
  CHARACTER_REF_LAYER_SCALE,
  CHARACTER_SPRITE_SCALE,
} from './useMapWalking';

export default function MapPage() {
  const router = useRouter();
  const {
    sessionId,
    currentDay,
    timeOfDay,
    difficulty,
    scenarioType,
    dialoguesUsedToday,
    authToken,
    isAdmin,
    endDay,
    advanceTime,
    setWarrants,
    setScenarioType,
    setEvidence,
    hasHydrated,
    lastLocationId,
    setLastLocationId,
  } = useGameStore();

  // Zorluk seviyesine göre lokasyonları filtrele
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const currentDiffIdx = difficultyOrder.indexOf(difficulty);
  const baseLocations = getScenarioMapLocations(scenarioType);
  const visibleLocations = baseLocations.filter((loc: { minDifficulty?: string }) => {
    if (!loc.minDifficulty) return true;
    return difficultyOrder.indexOf(loc.minDifficulty) <= currentDiffIdx;
  });

  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);
  const [endingDay, setEndingDay] = useState(false);
  const imageLayerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCondemnModalOpen, setIsCondemnModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Evi hazırlanmış evrende oyuncu evin içine girer; diğerlerinde "Evim" penceresi açılır
  const openHome = useCallback(() => {
    playDoorSound();
    const home = getPlayerHome(scenarioType || 'medieval');
    if (!home) {
      setIsHomeModalOpen(true);
      return;
    }
    showScene(homeScene(home));
    router.push('/home');
  }, [scenarioType, router, setIsHomeModalOpen]);

  const handleLocationClick = useCallback(
    async (locId: string) => {
      if (!sessionId || timeOfDay >= 4) return;
      setLoadingLoc(locId);
      // Geçiş ekranı hemen açılır; sunucu cevabı ve mekân görseli beklenirken oyuncu nereye girdiğini görür
      const interior = getInterior(scenarioType, locId);
      showScene(
        interior
          ? interiorScene(interior)
          : {
              kicker: 'Giriyorsun',
              title: getLocationLabel(locId, scenarioType),
              image: getNpcDialoguePortrait(scenarioType, locId),
            },
      );
      try {
        await api.post(`/game-sessions/${sessionId}/advance-time`);
        advanceTime();
        router.push(interior ? `/interior/${locId}` : `/interact/${locId}`);
      } catch (err) {
        logger.error('Failed to advance time', err);
        hideScene();
        setLoadingLoc(null);
      }
    },
    [sessionId, timeOfDay, scenarioType, advanceTime, router]
  );

  const handleArrive = useCallback(
    async (locId: string) => {
      if (locId === 'home') {
        openHome();
      } else {
        await handleLocationClick(locId);
      }
    },
    [openHome, handleLocationClick]
  );

  // Oyuncu karakteri: en son girdiği mekanın kapısında, hiç girmediyse meydanda durur
  const roads = getRoadNetwork(scenarioType);
  const restNodeId = (lastLocationId && roads.doors[lastLocationId]) || roads.spawn;

  // Giyili kıyafetin karakteri tüm haritalarda kullanılır; tüm yön görselleri yüklenince görünür
  const { equippedOutfitId, ownedItemIds, hasHydrated: marketHydrated } = useMarketStore();
  const wornOutfitId = marketHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  const character = useCharacterManifest(wornOutfitId, 'map');
  const characterRarity = wornOutfitId ? findOutfit(wornOutfitId)?.rarity : undefined;

  const {
    playerFacing,
    walkingTo,
    walkPhase,
    layerScale,
    playerPos,
    characterScale,
    handleWalkToLocation,
  } = useMapWalking({
    roads,
    restNodeId,
    character,
    imageLayerRef,
    onArrive: handleArrive,
    setLastLocationId,
  });

  const roadImage = roads.image;

  // `?debugRoads`: yol ağını harita üstünde çizer, tıklanan noktanın görsel koordinatını konsola yazar
  const [debugRoads] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debugRoads');
  });

  useEffect(() => {
    if (!debugRoads || !roadImage) return;
    const logPoint = (e: MouseEvent) => {
      const rect = imageLayerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * roadImage.width);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * roadImage.height);
      const text = `{ x: ${x}, y: ${y} }`;
      logger.info('[debugRoads]', text);
      navigator.clipboard?.writeText(text).catch(() => {});
    };
    window.addEventListener('click', logPoint, true);
    return () => window.removeEventListener('click', logPoint, true);
  }, [debugRoads, roadImage]);

  // Yürürken adımlarla senkron ayak sesleri (test)
  useFootsteps(Boolean(walkingTo), walkPhase, scenarioType);

  // Harita görseli yüklenene kadar geçiş ekranı kalır (görsel önbellekteyse hiç açılmaz)
  useLayoutEffect(() => {
    if (!hasHydrated) return;
    void revealScene([getMapBackground(scenarioType, timeOfDay)], {
      kicker: `${TIME_LABELS[timeOfDay] ?? ''} · Gün ${currentDay}`,
      title: getMapName(scenarioType),
      image: getMapBackground(scenarioType, timeOfDay),
    });
  }, [hasHydrated, scenarioType, timeOfDay, currentDay]);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/');
      return;
    }

    const fetchSession = async () => {
      if (sessionId && authToken) {
        try {
          const data = await api.get<{
            scenarioType?: string;
            activeWarrants?: string[];
            usedWarrants?: string[];
          }>(`/game-sessions/${sessionId}`);

          if (data.scenarioType) {
            setScenarioType(data.scenarioType);
          }
          setWarrants(data.activeWarrants || [], data.usedWarrants || []);

          try {
            const evidenceData = await api.get<{ evidence?: EvidenceItem[] }>(`/game-sessions/${sessionId}/evidence`);
            setEvidence(Array.isArray(evidenceData.evidence) ? evidenceData.evidence : []);
          } catch {}

          // Evdeki yataktan son gün "Hükmünü Ver" ile gelinince seçim penceresi açılır
          if (new URLSearchParams(window.location.search).get('hukum') === '1') {
            setIsCondemnModalOpen(true);
            router.replace('/map');
          }
        } catch (err) {
          logger.error('Failed to load session', err);
        }
      }
    };
    if (hasHydrated) fetchSession();
  }, [authToken, router, sessionId, setScenarioType, setWarrants, setEvidence, hasHydrated]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleRetreat = async () => {
    // Notları sunucuya kaydet
    if (sessionId && authToken) {
      try {
        const notes = useGameStore.getState().notes;
        await api.post(`/game-sessions/${sessionId}/notes`, { notes });
      } catch (e) {
        logger.error('Failed to save notes', e);
      }
    }
    router.push('/menu');
  };

  const handleEndDay = async () => {
    if (!sessionId) return;

    if (currentDay >= 4) {
      setIsCondemnModalOpen(true);
      return;
    }

    setEndingDay(true);
    try {
      await api.post(`/game-sessions/${sessionId}/end-day`);
      endDay();
    } catch (err) {
      logger.error('Failed to end day', err);
    } finally {
      setEndingDay(false);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      logger.error('Failed to toggle fullscreen', err);
    }
  };

  const handleCondemn = async (npcId: string) => {
    if (!sessionId) return;

    try {
      const data = await api.post<{
        session?: { truthReveal?: string; locationClues?: Record<string, string> };
        won?: boolean;
        message?: string;
      }>(`/game-sessions/${sessionId}/condemn`, { npcId });

      if (data.session?.truthReveal) {
        useGameStore.getState().setTruthReveal(data.session.truthReveal);
      }
      if (data.session?.locationClues) {
        useGameStore.getState().setLocationClues(data.session.locationClues);
      }
      if (data.won !== undefined) {
        router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message ?? '')}`);
      }
    } catch (err) {
      logger.error('Failed to condemn', err);
    }
  };

  const isNight = timeOfDay >= 4;
  const getMapBg = () => getMapBackground(scenarioType, timeOfDay);

  const renderPlayer = (x: number, y: number, depthScale = 1) =>
    character && (
      <MapCharacter
        manifest={character}
        x={x}
        y={y}
        facing={playerFacing}
        walking={Boolean(walkingTo)}
        walkPhase={walkPhase}
        scale={CHARACTER_SPRITE_SCALE * characterScale * depthScale}
        ambient={timeOfDay <= 1 ? 'day' : timeOfDay <= 3 ? 'dusk' : 'night'}
        rarity={characterRarity}
      />
    );

  const getLocationActionText = (loc: { id: string; name: string }) => {
    if (loc.id === 'home') {
      return isNight ? 'Eve Dön (Uyu)' : 'Evime Git';
    }
    const label = getLocationLabel(loc.id, scenarioType);
    return `${label}'e Git`;
  };

  const scenarioName =
    SCENARIO_REGISTRY[scenarioType as keyof typeof SCENARIO_REGISTRY]?.name ?? 'Ashenmoor Köyü';

  return (
    <main className={styles.main}>
      <div className={`${styles.vignette} ${isNight ? styles.nightVignette : ''}`} />

      {/* Header overlay */}
      <header className={styles.header}>
        <button onClick={handleRetreat} className={styles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kaydet ve Çık
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>{scenarioName}</h1>
          <p className={styles.pageSub}>{TIME_LABELS[timeOfDay]} — Gün {currentDay}</p>
        </div>
        <div className={styles.sessionInfo}>
          <div className={styles.stats}>
            <span className={styles.sessionDot} />
            <span className={styles.limitText}>
              Soru Hakkı: {isAdmin ? 'Sınırsız' : `${30 - dialoguesUsedToday}/30`}
            </span>
          </div>
        </div>
      </header>

      {/* Interactive Map */}
      <div 
        className={styles.mapContainer}
        style={{ backgroundImage: `url(${getMapBg()})` }}
      >
        {visibleLocations.map((loc) => {
          const isAvailable = (loc.available && !isNight && !walkingTo) || (loc.id === 'home' && !walkingTo);
          const npcPortrait = loc.id !== 'home' ? getNpcDialoguePortrait(scenarioType, loc.id) : null;
          const npcConfig = DIALOGUE_CONFIG[scenarioType]?.[loc.id];

          return (
            <div 
              key={loc.id}
              className={`${styles.invisibleButton} ${!isAvailable ? styles.locked : ''}`}
              style={{
                top: loc.top,
                left: loc.left,
                width: loc.width,
                height: loc.height,
              }}
              onClick={() => isAvailable && handleWalkToLocation(loc.id)}
            >
              <div
                className={`${styles.label} ${scenarioType === 'cyberpunk' && loc.id === 'mill' ? styles.multiLineLabel : ''}`}
              >
                {npcPortrait ? (
                  <div className={styles.labelAvatarWrap}>
                    <img
                      src={npcPortrait}
                      alt={loc.name}
                      className={styles.labelAvatar}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <span className={styles.icon}>{loc.icon}</span>
                )}
                <div className={styles.labelTextCol}>
                  <span className={styles.labelTextAction}>
                    {walkingTo === loc.id || loadingLoc === loc.id ? 'Gidiliyor...' : getLocationActionText(loc)}
                  </span>
                  {npcConfig?.name && !walkingTo && !loadingLoc && (
                    <span className={styles.labelTextNpc}>{npcConfig.name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Oyuncu karakteri */}
        {roadImage ? (
          // Görselle aynı oranda ve `cover` ile aynı şekilde yerleşen katman: piksel koordinatları her ekranda görsele oturur
          <div className={styles.imageViewport}>
            <div
              ref={imageLayerRef}
              className={styles.imageLayer}
              style={{ '--map-aspect': roadImage.width / roadImage.height } as CSSProperties}
            >
              {debugRoads && <RoadDebugOverlay roads={roads} image={roadImage} />}
              {renderPlayer(
                (playerPos.x / roadImage.width) * 100,
                (playerPos.y / roadImage.height) * 100,
                (depthScaleAt(playerPos.y, roadImage.height) * layerScale) / CHARACTER_REF_LAYER_SCALE
              )}
            </div>
          </div>
        ) : (
          renderPlayer(playerPos.x, playerPos.y)
        )}
      </div>

      {/* Action Bar (Bant) */}
      <footer className={styles.actionBar}>
        <div className={styles.actionGroup}>
          <Link href="/interior/tavern" className={styles.iconBtn} title="Mekanların İçini 360° İncele">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" />
            </svg>
            <span>Mekan Keşfi</span>
          </Link>
          <button className={styles.iconBtn} onClick={handleToggleFullscreen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {isFullscreen ? (
                <>
                  <path d="M9 15H5V19" />
                  <path d="M15 9H19V5" />
                  <path d="M5 15L10 10" />
                  <path d="M19 9L14 14" />
                </>
              ) : (
                <>
                  <path d="M9 3H5V7" />
                  <path d="M15 21H19V17" />
                  <path d="M5 7L10 12" />
                  <path d="M19 17L14 12" />
                </>
              )}
            </svg>
            <span>{isFullscreen ? 'Cik' : 'Tam Ekran'}</span>
          </button>
          <button className={styles.iconBtn} onClick={() => setIsNotebookOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Notlar</span>
          </button>
          <button className={styles.iconBtn} onClick={() => setIsInventoryOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Envanter</span>
          </button>
          <button className={styles.iconBtn} onClick={() => setIsAudioSettingsOpen(true)} title="Ses Ayarları">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Ayarlar</span>
          </button>
        </div>

        {/* Central Condemn Button */}
        <div className={styles.condemnCenter}>
          <button 
            className={styles.mainCondemnBtn}
            onClick={() => setIsCondemnModalOpen(true)}
          >
            <span className={styles.icon}>⚖️</span>
            <span className={styles.btnText}>MAHKUMU SEÇ</span>
          </button>
        </div>

        <div className={styles.actionGroup}>
          {currentDay === 1 && !isNight && (
            <button 
              onClick={() => handleLocationClick('crime_scene')}
              className={styles.crimeSceneBarBtn}
            >
              <span className={styles.icon}>🩸</span>
              <span className={styles.btnText}>Cinayet Mahalli</span>
            </button>
          )}

          <button 
            onClick={() => setIsHomeModalOpen(true)}
            className={`${styles.homeBarBtn} ${isNight ? styles.homeNightGlow : ''}`}
          >
            <span className={styles.icon}>🏡</span>
            <span className={styles.btnText}>{isNight ? 'Eve Dön (Dinlen)' : 'Evim'}</span>
          </button>
        </div>
      </footer>

      {/* Home Modal */}
      {isHomeModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            playDoorSound();
            setIsHomeModalOpen(false);
          }}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => {
                playDoorSound();
                setIsHomeModalOpen(false);
              }}
            >
              &times;
            </button>
            <h2 className={styles.modalTitle}>🏡 Evim (Engizisyoncu Odası)</h2>
            <p className={styles.modalMessage}>
              Köydeki ikametgahındasın. Kapıyı kilitleyip dinlenebilir, günü tamamlayabilir,
              soruşturma notlarını inceleyebilir veya envanterindeki delilleri gözden geçirebilirsin.
            </p>
            <div className={styles.homeActionList}>
              <button
                className={`${styles.homeActionBtn} ${styles.homeActionSleep}`}
                onClick={() => {
                  setIsHomeModalOpen(false);
                  handleEndDay();
                }}
                disabled={endingDay}
              >
                <span className={styles.homeActionIcon}>🛌</span>
                <div className={styles.homeActionInfo}>
                  <span className={styles.homeActionTitle}>Dinlen & Günü Bitir</span>
                  <span className={styles.homeActionDesc}>
                    {isNight ? 'Geceyi uykuda geçir ve bir sonraki güne başla.' : 'Günü erken sonlandırıp dinlen.'}
                  </span>
                </div>
              </button>
              <button
                className={styles.homeActionBtn}
                onClick={() => {
                  setIsHomeModalOpen(false);
                  setIsNotebookOpen(true);
                }}
              >
                <span className={styles.homeActionIcon}>📖</span>
                <div className={styles.homeActionInfo}>
                  <span className={styles.homeActionTitle}>Soruşturma Notları</span>
                  <span className={styles.homeActionDesc}>Köy halkından aldığın ifadeleri ve gözlemlerini oku.</span>
                </div>
              </button>
              <button
                className={styles.homeActionBtn}
                onClick={() => {
                  setIsHomeModalOpen(false);
                  setIsInventoryOpen(true);
                }}
              >
                <span className={styles.homeActionIcon}>🎒</span>
                <div className={styles.homeActionInfo}>
                  <span className={styles.homeActionTitle}>Envanter ve Deliller</span>
                  <span className={styles.homeActionDesc}>Bulduğun fiziksel kanıtları ve arama izinlerini incele.</span>
                </div>
              </button>
              <button
                className={styles.homeActionBtn}
                onClick={() => {
                  setIsHomeModalOpen(false);
                  setIsAudioSettingsOpen(true);
                }}
              >
                <span className={styles.homeActionIcon}>⚙️</span>
                <div className={styles.homeActionInfo}>
                  <span className={styles.homeActionTitle}>Ses Ayarları</span>
                  <span className={styles.homeActionDesc}>Yürüme, kapı ve müzik ses seviyelerini ayarla.</span>
                </div>
              </button>
              <button
                className={styles.homeActionBtn}
                onClick={() => {
                  playDoorSound();
                  setIsHomeModalOpen(false);
                }}
              >
                <span className={styles.homeActionIcon}>🚪</span>
                <div className={styles.homeActionInfo}>
                  <span className={styles.homeActionTitle}>Dışarı Çık</span>
                  <span className={styles.homeActionDesc}>Köy sokaklarına geri dön.</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notebook Modal */}
      {isNotebookOpen && <NotebookModal onClose={() => setIsNotebookOpen(false)} />}

      {/* Inventory Modal */}
      {isInventoryOpen && <InventoryModal onClose={() => setIsInventoryOpen(false)} />}

      {/* Condemn Selection Modal */}
      <CondemnModal
        isOpen={isCondemnModalOpen}
        onClose={() => setIsCondemnModalOpen(false)}
        scenarioType={scenarioType}
        difficulty={difficulty}
        onConfirmCondemn={handleCondemn}
      />

      {/* Audio Settings Modal */}
      {isAudioSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAudioSettingsOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setIsAudioSettingsOpen(false)}
              aria-label="Kapat"
            >
              &times;
            </button>
            <h2 className={styles.modalTitle}>⚙️ Ses Ayarları</h2>
            <AudioSettingsPanel />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                className={styles.modalConfirm}
                onClick={() => setIsAudioSettingsOpen(false)}
                style={{ width: '120px' }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Geliştirici aracı: yol ağını ve düğümleri haritanın üstünde gösterir
function RoadDebugOverlay({
  roads,
  image,
}: {
  roads: RoadNetwork;
  image: { width: number; height: number };
}) {
  return (
    <svg
      className={styles.roadDebug}
      viewBox={`0 0 ${image.width} ${image.height}`}
      preserveAspectRatio="none"
    >
      {roads.edges.map(([a, b]) => (
        <polyline
          key={`${a}-${b}`}
          points={smoothPath(expandPath(roads, [a, b]), 6)
            .map((p: Point) => `${p.x},${p.y}`)
            .join(' ')}
        />
      ))}
      {Object.entries(roads.nodes).map(([id, p]) => (
        <g key={id}>
          <circle cx={p.x} cy={p.y} r={9} />
          <text x={p.x + 14} y={p.y + 6}>
            {id}
          </text>
        </g>
      ))}
    </svg>
  );
}
