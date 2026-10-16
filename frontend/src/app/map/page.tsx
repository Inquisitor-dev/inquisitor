'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, type CSSProperties } from 'react';
import { getInterior } from '@/config/interiorConfig';
import { getLocationLabel } from '@/config/locationLabels';
import { getPlayerHome } from '@/config/homeConfig';
import { getNpcDialoguePortrait, DIALOGUE_CONFIG } from '@/config/dialogueConfig';
import { getCrimeSceneImage, getCrimeSceneLabel } from '@/config/crimeScenes';
import { getMapBackground, getMapName, TIME_LABELS } from '@/config/mapBackgrounds';
import { hideScene, revealScene, showScene } from '@/components/SceneTransition/sceneStore';
import { homeScene, interiorScene } from '@/components/SceneTransition/scenes';
import { useGameStore, type EvidenceItem } from '../../store/useGameStore';
import type { CrimeSceneInfo } from '@/store/slices/types';
import { useMarketStore } from '@/store/useMarketStore';
import { findOutfit, wearableOutfitId } from '@/config/outfits';
import { useCharacterManifest } from '@/components/character/characterManifest';
import styles from './map.module.scss';
import MapCharacter from './MapCharacter';
import { getRoadNetwork } from './roads';

import { useFootsteps } from './useFootsteps';
import { playDoorSound } from '@/features/audio/doorSound';
import NotebookModal from '@/components/CaseModals/NotebookModal';
import InventoryModal from '@/components/CaseModals/InventoryModal';
import CondemnModal from '@/components/CaseModals/CondemnModal';
import MapActionBar from './components/MapActionBar/MapActionBar';
import HomeModal from './components/HomeModal/HomeModal';
import AudioSettingsModal from './components/AudioSettingsModal/AudioSettingsModal';
import RoadDebugOverlay from './components/RoadDebugOverlay/RoadDebugOverlay';

import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { getScenarioMapLocations } from '@/config/mapLocations';
import { SCENARIO_REGISTRY } from '@/config/scenarioRegistry';
import { getSuspectsForScenario } from '@/config/npcProfiles';
import { useAbilities } from '@/features/abilities/useAbilities';
import AbilityControls, {
  AbilityOutcome,
  abilityErrorMessage,
  type AbilityOutcomeProps,
} from '@/features/abilities/AbilityControls';
import type { AbilityId, AbilityInfo } from '@/features/abilities/abilityTypes';
import abilityStyles from '@/features/abilities/Abilities.module.scss';

// Haritada gösterilen yetenekler (Veri Sızdırma panoda)
const MAP_ABILITIES: AbilityId[] = [
  'patience',
  'backstage',
  'rooftop',
  'informant',
  'tracking',
  'pulse',
  'visor_lock',
  'threat',
  'quiet_room',
  'archive_summary',
  'contradiction_scan',
];
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
    setTimeOfDay,
    setNotes,
    addWarrant,
    setWarrants,
    setScenarioType,
    setEvidence,
    hasHydrated,
    lastLocationId,
    setLastLocationId,
    inventory,
    crimeScene,
    setCrimeScene,
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

  // Karakter yetenekleri. Kulis ve Çatı Geçişi önce "kurulur", bir mekâna girilince kullanılır.
  const abilities = useAbilities(sessionId);
  const { activate: activateAbility, abilityState } = abilities;
  const [armedAbility, setArmedAbility] = useState<AbilityInfo | null>(null);
  const [abilityOutcome, setAbilityOutcome] = useState<AbilityOutcomeProps | null>(null);
  // Çatı Geçişi'yle bu gece girilen mekâna tekrar girilebilir
  const rooftopLocationId =
    abilityState.rooftop?.day === currentDay ? abilityState.rooftop.locationId : null;
  const canEnterAtNight = (locId: string) =>
    armedAbility?.id === 'rooftop' || rooftopLocationId === locId;

  const handleLocationClick = useCallback(
    async (locId: string) => {
      const isNightEntry = timeOfDay >= 4;
      const viaRooftop = isNightEntry && (armedAbility?.id === 'rooftop' || rooftopLocationId === locId);
      if (!sessionId || (isNightEntry && !viaRooftop)) return;
      const viaBackstage = armedAbility?.id === 'backstage' && locId !== 'crime_scene';
      setLoadingLoc(locId);
      // Geçiş ekranı hemen açılır; sunucu cevabı ve mekân görseli beklenirken oyuncu nereye girdiğini görür
      const interior = getInterior(scenarioType, locId);
      showScene(
        interior
          ? interiorScene(interior)
          : {
              kicker: 'Giriyorsun',
              title:
                (locId === 'crime_scene' && getCrimeSceneLabel(scenarioType, crimeScene)) ||
                getLocationLabel(locId, scenarioType),
              image:
                (locId === 'crime_scene' && getCrimeSceneImage(scenarioType, crimeScene)) ||
                getNpcDialoguePortrait(scenarioType, locId),
            },
      );
      try {
        if (viaRooftop) {
          // Çatı Geçişi zaman ilerletmez; bedeli ertesi sabahtır
          if (rooftopLocationId !== locId) await activateAbility({ abilityId: 'rooftop', locationId: locId });
          setArmedAbility(null);
        } else if (viaBackstage) {
          // Kulis: bu giriş zaman dilimi harcamaz
          await activateAbility({ abilityId: 'backstage', locationId: locId });
          setArmedAbility(null);
        } else {
          await api.post(`/game-sessions/${sessionId}/advance-time`);
          advanceTime();
        }
        router.push(interior ? `/interior/${locId}` : `/interact/${locId}`);
      } catch (err) {
        logger.error('Failed to enter location', err);
        hideScene();
        setLoadingLoc(null);
        if (viaRooftop || viaBackstage) {
          setArmedAbility(null);
          setAbilityOutcome({
            ability: { name: viaRooftop ? 'Çatı Geçişi' : 'Kulis' },
            error: abilityErrorMessage(err),
            onClose: () => setAbilityOutcome(null),
          });
        }
      }
    },
    [sessionId, timeOfDay, scenarioType, crimeScene, advanceTime, router, armedAbility, rooftopLocationId, activateAbility, setArmedAbility]
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
            crimeScene?: CrimeSceneInfo | null;
          }>(`/game-sessions/${sessionId}`);

          if (data.scenarioType) {
            setScenarioType(data.scenarioType);
          }
          setCrimeScene(data.crimeScene ?? null);
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
  }, [authToken, router, sessionId, setScenarioType, setCrimeScene, setWarrants, setEvidence, hasHydrated]);

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
      const data = await api.post<{ timeOfDay?: number }>(`/game-sessions/${sessionId}/end-day`);
      endDay();
      // Çatı Geçişi'nin bedeli: gün sabahsız başlayabilir
      if (typeof data.timeOfDay === 'number') setTimeOfDay(data.timeOfDay);
      setArmedAbility(null);
      abilities.refresh();
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

  // Yetenek hedefleri: vakadaki şüpheliler ve İz Sürme için henüz izni olmayan mekânlar
  const suspectOptions = getSuspectsForScenario(scenarioType, difficulty).map((s) => ({ id: s.id, label: s.name }));
  const trackingOptions = visibleLocations
    .filter(
      (loc) =>
        loc.id !== 'home' &&
        loc.id !== 'crime_scene' &&
        !inventory.activeWarrants.includes(loc.id) &&
        !inventory.usedWarrants.includes(loc.id),
    )
    .map((loc) => ({ id: loc.id, label: getLocationLabel(loc.id, scenarioType) }));

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
          const isAvailable =
            (loc.available && (!isNight || canEnterAtNight(loc.id)) && !walkingTo) || (loc.id === 'home' && !walkingTo);
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

      {armedAbility && (
        <p className={abilityStyles.armedHint} role="status">
          {armedAbility.id === 'rooftop'
            ? 'Çatı Geçişi hazır: gece girmek istediğin mekâna tıkla. Yarın sabahı kaybedeceksin.'
            : 'Kulis hazır: gireceğin mekân zaman harcatmaz.'}
        </p>
      )}

      <AbilityControls
        abilities={abilities}
        only={MAP_ABILITIES}
        suspects={suspectOptions}
        locations={trackingOptions}
        armedId={armedAbility?.id ?? null}
        onArm={setArmedAbility}
        onResult={(ability, result) => {
          if (result.notes !== undefined) setNotes(result.notes);
          if (ability.id === 'tracking' && result.locationId) addWarrant(result.locationId);
        }}
      />

      {abilityOutcome && <AbilityOutcome {...abilityOutcome} />}

      <MapActionBar
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onOpenCondemn={() => setIsCondemnModalOpen(true)}
        onOpenHomeModal={() => setIsHomeModalOpen(true)}
        onGoToCrimeScene={() => handleLocationClick('crime_scene')}
        showCrimeSceneButton={currentDay === 1 && !isNight}
        isNight={isNight}
      />

      <HomeModal
        isOpen={isHomeModalOpen}
        isNight={isNight}
        endingDay={endingDay}
        onClose={() => setIsHomeModalOpen(false)}
        onEndDay={handleEndDay}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
      />


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

      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />
    </main>
  );
}

