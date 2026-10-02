'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { apiUrl } from '@/config/api';
import { useGameStore } from '../../store/useGameStore';
import styles from './map.module.scss';
import PlayerCharacter from './PlayerCharacter';
import PixelCharacter, {
  MEDIEVAL_SPRITE,
  directionFromDelta,
  spriteUrls,
  walkCycle,
  type Direction,
  type CharacterSprite,
} from './PixelCharacter';
import { getRoadNetwork, findPath, distance, expandPath, type Point, type RoadNetwork } from './roads';
import { smoothPath, createRoute, directionWithHysteresis } from './walkPath';

const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];

// Medieval köy konumları
const locations = [
  {
    id: 'church',
    name: 'Kilise',
    icon: '⛪',
    top: '15%',
    left: '8%',
    width: '28%',
    height: '45%',
    available: true,
  },
  {
    id: 'mill',
    name: 'Değirmen',
    icon: '⚙️',
    top: '35%',
    left: '68%',
    width: '18%',
    height: '35%',
    available: true,
  },
  {
    id: 'tavern',
    name: 'Taverna',
    icon: '🍺',
    top: '36%',
    left: '42%',
    width: '16%',
    height: '25%',
    available: true,
  },
  {
    id: 'graveyard',
    name: 'Mezarlık',
    icon: '🪦',
    top: '10%',
    left: '70%',
    width: '25%',
    height: '30%',
    available: true,
  },
  {
    id: 'farm',
    name: 'Çiftlik',
    icon: '🌾',
    top: '65%',
    left: '5%',
    width: '22%',
    height: '30%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    id: 'clinic',
    name: 'Klinik',
    icon: '🏥',
    top: '65%',
    left: '72%',
    width: '20%',
    height: '28%',
    available: true,
    minDifficulty: 'hard',
  }
];

// Modern kasaba konumları (Millfield, KY 1994 haritasına göre)
const modernLocations = [
  {
    // Karakol (Police Station) — Sol üst köşe, büyük bina
    id: 'tavern',
    name: 'Karakol',
    icon: '🚔',
    top: '8%',
    left: '8%',
    width: '28%',
    height: '45%',
    available: true,
  },
  {
    // Kaset Dükkanı (Video Rental) — Orta üst, neon tabela
    id: 'graveyard',
    name: 'Kaset Dükkanı',
    icon: '📼',
    top: '25%',
    left: '42%',
    width: '20%',
    height: '32%',
    available: true,
  },
  {
    // Kilise — Sağ üst köşe
    id: 'church',
    name: 'Kilise',
    icon: '⛪',
    top: '3%',
    left: '80%',
    width: '18%',
    height: '30%',
    available: true,
  },
  {
    // Benzinlik (Gas Station) — Orta sol alt
    id: 'farm',
    name: 'Benzinlik',
    icon: '⛽',
    top: '48%',
    left: '25%',
    width: '20%',
    height: '28%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    // Prefabrik Evler (Trailer Park) — Sağ orta
    id: 'clinic',
    name: 'Prefabrik Evler',
    icon: '🏠',
    top: '30%',
    left: '71%',
    width: '9%',
    height: '20%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    // Açık Hava Sineması (Drive-In Theater) — Alt merkez sağ
    id: 'mill',
    name: 'Açık Hava Sineması',
    icon: '🎬',
    top: '55%',
    left: '55%',
    width: '38%',
    height: '32%',
    available: true,
  },
];

const cyberpunkLocations = [
  {
    id: 'tavern',
    name: 'Polis Karakolu',
    icon: '👮',
    top: '20%',
    left: '2%',
    width: '27%',
    height: '48%',
    available: true,
  },
  {
    id: 'church',
    name: 'Lokanta',
    icon: '🍜',
    top: '40%',
    left: '45%',
    width: '12%',
    height: '18%',
    available: true,
  },
  {
    id: 'graveyard',
    name: 'Hurdalik',
    icon: '🛠️',
    top: '38%',
    left: '73%',
    width: '25%',
    height: '44%',
    available: true,
  },
  {
    id: 'mill',
    name: 'Robot Dukkani',
    icon: '🤖',
    top: '28%',
    left: '60%',
    width: '14%',
    height: '21%',
    available: true,
  },
  {
    id: 'farm',
    name: 'Kopru Alti',
    icon: '🧥',
    top: '29%',
    left: '73%',
    width: '16%',
    height: '16%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    id: 'clinic',
    name: 'Bar',
    icon: '🍸',
    top: '39%',
    left: '36%',
    width: '9%',
    height: '14%',
    available: true,
    minDifficulty: 'hard',
  },
];

// Karakterin yürüme hızı: saniyede kat edilen harita genişliği yüzdesi
const WALK_SPEED = 15;

// Piksel koordinatlı haritalarda (köy) yürüyüş ayarları, ekran pikseli cinsinden
// Karakter haritayla birlikte ölçeklenir: harita görseli bu ölçekte çizilirken sprite kendi boyundadır.
// Böylece her ekranda karakter/bina oranı ve rota süreleri aynı kalır.
const CHARACTER_REF_LAYER_SCALE = 0.6;
// Referans ölçekte, derinlik 1 iken px/sn. Adım animasyonu bu hıza birebir oturur (saniyede ~3.5 adım,
// kararlı ve biraz aceleci bir yürüyüş); gerçekçi tempo haritadaki mesafeler için fazla yavaş kalıyor.
const SCREEN_WALK_SPEED = 85;
const WALK_MAX_DURATION = 6; // sn, uzun rotalarda hız bu süreyi aşmayacak kadar artar
const WALK_ACCEL_TIME = 0.25; // sn, kalkışta tam hıza çıkma süresi
const WALK_DECEL_DISTANCE = 30; // px (referans ölçekte), varmadan önce yavaşlamaya başlanan mesafe
const WALK_LOOKAHEAD = 24; // px, bakış yönü bu kadar ilerideki noktaya göre hesaplanır

// Perspektif: görselin üst kenarında 0.82, alt kenarında 1.02 ölçek
const depthScaleAt = (y: number, imageHeight: number) => 0.82 + 0.2 * (y / imageHeight);

const getLocationLabel = (locationId: string, scenarioType: string) => {
  if (scenarioType === 'modern') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      church: 'Kilise',
      graveyard: 'Kaset Dukkani',
      mill: 'Acik Hava Sinemasi',
      farm: 'Benzinlik',
      clinic: 'Prefabrik Evler',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'cyberpunk') {
    const labels: Record<string, string> = {
      tavern: 'Polis Karakolu',
      church: 'Lokanta',
      graveyard: 'Hurdalik',
      mill: 'Robot Dukkani',
      farm: 'Kopru Alti',
      clinic: 'Bar',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlik',
    mill: 'Degirmen',
    farm: 'Ciftlik',
    clinic: 'Klinik',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};

export default function MapPage() {
  const router = useRouter();
  const { sessionId, currentDay, timeOfDay, difficulty, scenarioType, dialoguesUsedToday, authToken, isAdmin, reset, endDay, advanceTime, setWarrants, setScenarioType, notes, setNotes, inventory, hasHydrated, lastLocationId, setLastLocationId } = useGameStore();

  // Zorluk seviyesine göre lokasyonları filtrele
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const currentDiffIdx = difficultyOrder.indexOf(difficulty);
  const baseLocations =
    scenarioType === 'modern'
      ? modernLocations
      : scenarioType === 'cyberpunk'
        ? cyberpunkLocations
        : locations;
  const visibleLocations = baseLocations.filter((loc: any) => {
    if (!loc.minDifficulty) return true;
    return difficultyOrder.indexOf(loc.minDifficulty) <= currentDiffIdx;
  });
  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);
  const [endingDay, setEndingDay] = useState(false);

  // Oyuncu karakteri: en son girdiği mekanın kapısında, hiç girmediyse meydanda durur
  const roads = getRoadNetwork(scenarioType);
  const restNodeId = (lastLocationId && roads.doors[lastLocationId]) || roads.spawn;
  const [walkPos, setWalkPos] = useState<Point | null>(null);
  const [playerFacing, setPlayerFacing] = useState<Direction>('south');
  const [walkingTo, setWalkingTo] = useState<string | null>(null);
  const [walkScreenSpeed, setWalkScreenSpeed] = useState(SCREEN_WALK_SPEED);
  const walkFrame = useRef<number | null>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const playerPos = (walkingTo && walkPos) || roads.nodes[restNodeId];
  const roadImage = roads.image;

  // Harita katmanının ekrandaki ölçeği (görsel pikseli başına ekran pikseli); karakter boyu buna bağlı
  const [layerScale, setLayerScale] = useState(CHARACTER_REF_LAYER_SCALE);
  useEffect(() => {
    const layer = imageLayerRef.current;
    if (!layer || !roadImage) return;
    const observer = new ResizeObserver(() => setLayerScale(layer.offsetWidth / roadImage.width));
    observer.observe(layer);
    return () => observer.disconnect();
  }, [roadImage]);

  // `?debugRoads`: yol ağını harita üstünde çizer, tıklanan noktanın görsel koordinatını konsola yazar
  const [debugRoads, setDebugRoads] = useState(false);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debugRoads')) return;
    queueMicrotask(() => setDebugRoads(true));
  }, []);
  useEffect(() => {
    if (!debugRoads || !roadImage) return;
    const logPoint = (e: MouseEvent) => {
      const rect = imageLayerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * roadImage.width);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * roadImage.height);
      const text = `{ x: ${x}, y: ${y} }`;
      console.log('[debugRoads]', text);
      navigator.clipboard?.writeText(text).catch(() => {});
    };
    window.addEventListener('click', logPoint, true);
    return () => window.removeEventListener('click', logPoint, true);
  }, [debugRoads, roadImage]);

  useEffect(() => {
    return () => {
      if (walkFrame.current !== null) cancelAnimationFrame(walkFrame.current);
    };
  }, []);

  // Engizisyoncu sprite'ı tüm haritalarda kullanılır; görsel yüklenemezse SVG karaktere düşer
  const pixelSprite = MEDIEVAL_SPRITE;
  const [loadedSprite, setLoadedSprite] = useState<CharacterSprite | null>(null);
  const pixelSpriteReady = pixelSprite !== null && loadedSprite === pixelSprite;

  useEffect(() => {
    if (!pixelSprite) return;
    // Yön değişiminde titreme olmasın diye tüm yön görselleri baştan yüklenir
    let cancelled = false;
    Promise.all(
      spriteUrls(pixelSprite).map(
        (src) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = src;
          })
      )
    )
      .then(() => {
        if (!cancelled) setLoadedSprite(pixelSprite);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pixelSprite]);
  
  // Modal states
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCondemnModalOpen, setIsCondemnModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [localNotes, setLocalNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/login');
      return;
    }

    const fetchSession = async () => {
      if (sessionId && authToken) {
        try {
          const res = await fetch(apiUrl(`/game-sessions/${sessionId}`), {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const data = await res.json();
          if (data.scenarioType) {
            setScenarioType(data.scenarioType);
          }
          setWarrants(data.activeWarrants || [], data.usedWarrants || []);
        } catch(e) {}
      }
    };
    if (hasHydrated) fetchSession();
  }, [authToken, router, sessionId, setScenarioType, setWarrants, hasHydrated]);

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
        await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes }),
        });
      } catch (e) {
        console.error('Failed to save notes', e);
      }
    }
    router.push('/');
  };

  const handleEndDay = async () => {
    if (!sessionId) return;
    
    if (currentDay >= 4) {
      setIsCondemnModalOpen(true);
      return;
    }

    setEndingDay(true);
    try {
      await fetch(apiUrl(`/game-sessions/${sessionId}/end-day`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      endDay();
    } catch (err) {
      console.error('Failed to end day', err);
    } finally {
      setEndingDay(false);
    }
  };

  const handleLocationClick = async (locId: string) => {
    if (!sessionId || timeOfDay >= 4) return;
    setLoadingLoc(locId);
    try {
      await fetch(apiUrl(`/game-sessions/${sessionId}/advance-time`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      advanceTime();
      router.push(`/interact/${locId}`);
    } catch (err) {
      console.error('Failed to advance time', err);
      setLoadingLoc(null);
    }
  };

  // Karakteri yollar boyunca mekanın kapısına yürütür, varınca mekana girmiş sayar
  const handleWalkToLocation = (locId: string) => {
    if (walkingTo || loadingLoc) return;

    const doorId = roads.doors[locId];
    if (!doorId) {
      handleLocationClick(locId);
      return;
    }

    if (roads.image) {
      walkAlongImageRoads(locId, doorId, roads.image);
      return;
    }

    const points = findPath(roads, restNodeId, doorId).map((id) => roads.nodes[id]);
    const segmentLengths = points.slice(1).map((p, i) => distance(points[i], p));
    const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0);

    const arrive = async () => {
      walkFrame.current = null;
      setLastLocationId(locId);
      await handleLocationClick(locId);
      setWalkingTo(null);
      setWalkPos(null);
    };

    setWalkingTo(locId);
    if (totalLength === 0) {
      arrive();
      return;
    }

    let startTime: number | null = null;
    const step = (now: number) => {
      startTime ??= now;
      let travelled = ((now - startTime) / 1000) * WALK_SPEED;
      if (travelled >= totalLength) {
        setWalkPos(points[points.length - 1]);
        arrive();
        return;
      }

      let i = 0;
      while (travelled > segmentLengths[i]) {
        travelled -= segmentLengths[i];
        i++;
      }
      const from = points[i];
      const to = points[i + 1];
      const t = segmentLengths[i] === 0 ? 1 : travelled / segmentLengths[i];
      if (to.x !== from.x || to.y !== from.y) setPlayerFacing(directionFromDelta(to.x - from.x, to.y - from.y));
      setWalkPos({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
      walkFrame.current = requestAnimationFrame(step);
    };
    walkFrame.current = requestAnimationFrame(step);
  };

  // Piksel koordinatlı haritalarda yumuşatılmış yol boyunca, kalkış/varışta hızlanıp yavaşlayarak yürür
  const walkAlongImageRoads = (
    locId: string,
    doorId: string,
    image: { width: number; height: number }
  ) => {
    const points = expandPath(roads, findPath(roads, restNodeId, doorId));
    const route = createRoute(smoothPath(points, 6));
    // Bir ekran pikselinin kaç görsel pikseline denk geldiğinin tersi
    const layerScale = (imageLayerRef.current?.offsetWidth ?? window.innerWidth) / image.width;

    const arrive = async () => {
      walkFrame.current = null;
      setLastLocationId(locId);
      await handleLocationClick(locId);
      setWalkingTo(null);
      setWalkPos(null);
    };

    setWalkingTo(locId);
    if (route.length === 0) {
      arrive();
      return;
    }

    const sizeScale = layerScale / CHARACTER_REF_LAYER_SCALE;
    // Referans ölçekteki hız; ekrandaki hız karakterle birlikte sizeScale kadar büyür
    const baseSpeed = Math.max(
      SCREEN_WALK_SPEED,
      (route.length * layerScale) / sizeScale / WALK_MAX_DURATION
    );
    setWalkScreenSpeed(baseSpeed);

    const lookahead = WALK_LOOKAHEAD / layerScale;
    const firstAhead = route.pointAt(lookahead);
    let facing = directionFromDelta(firstAhead.x - points[0].x, firstAhead.y - points[0].y);
    setPlayerFacing(facing);

    let travelled = 0;
    let elapsed = 0;
    let lastTime: number | null = null;
    const step = (now: number) => {
      // Sekme arka plandan dönünce oluşan uzun boşlukta karakter ışınlanmasın diye üst sınır var
      const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 1);
      lastTime = now;
      elapsed += dt;

      const pos = route.pointAt(travelled);
      const remaining = (route.length - travelled) * layerScale;
      const ease = Math.min(
        1,
        0.35 + (0.65 * elapsed) / WALK_ACCEL_TIME,
        0.35 + (0.65 * remaining) / (WALK_DECEL_DISTANCE * sizeScale)
      );
      // Uzaktaki karakter ekranda daha yavaş ilerler, böylece adım boyu da ölçekle uyumlu kalır
      const screenSpeed = baseSpeed * sizeScale * depthScaleAt(pos.y, image.height) * ease;
      travelled += (screenSpeed / layerScale) * dt;

      if (travelled >= route.length) {
        setWalkPos(route.pointAt(route.length));
        arrive();
        return;
      }

      const next = route.pointAt(travelled);
      const ahead = route.pointAt(travelled + lookahead);
      if (Math.hypot(ahead.x - next.x, ahead.y - next.y) > 0.5) {
        facing = directionWithHysteresis(ahead.x - next.x, ahead.y - next.y, facing);
        setPlayerFacing(facing);
      }
      setWalkPos(next);
      walkFrame.current = requestAnimationFrame(step);
    };
    walkFrame.current = requestAnimationFrame(step);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen', err);
    }
  };

  const handleNotesBlur = async () => {
    if (localNotes !== notes && sessionId) {
      setNotes(localNotes);
      try {
        await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes: localNotes }),
        });
      } catch (err) {
        console.error('Failed to save notes', err);
      }
    }
  };

  const handleCondemn = async (npcId: string) => {
    if (!sessionId) return;
    
    try {
      const res = await fetch(apiUrl(`/game-sessions/${sessionId}/condemn`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ npcId }),
      });
      const data = await res.json();
      if (data.session && data.session.truthReveal) {
        useGameStore.getState().setTruthReveal(data.session.truthReveal);
      }
      if (data.session && data.session.locationClues) {
        useGameStore.getState().setLocationClues(data.session.locationClues);
      }
      if (data.won !== undefined) {
        router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message)}`);
      }
    } catch (err) {
      console.error('Failed to condemn', err);
    }
  };

  const isNight = timeOfDay >= 4;
  
  const getMapBg = () => {
    if (scenarioType === 'modern') {
      if (timeOfDay <= 1) return '/map/town_map_morning.png';
      if (timeOfDay <= 3) return '/map/town_map_sunset.png';
      return '/map/town_map_night.png';
    }
    if (scenarioType === 'cyberpunk') {
      if (timeOfDay <= 1) return '/map/cyberpunk_map_morning.png';
      if (timeOfDay <= 3) return '/map/cyberpunk_map_sunset.png';
      return '/map/cyberpunk_map_night.png';
    }
    if (timeOfDay <= 1) return '/map/village_map_morning.png';
    if (timeOfDay <= 3) return '/map/village_map_sunset.png';
    return '/map/village_map.png';
  };

  const renderPlayer = (x: number, y: number, depthScale?: number) =>
    pixelSprite && pixelSpriteReady ? (
      <PixelCharacter
        sprite={pixelSprite}
        x={x}
        y={y}
        facing={playerFacing}
        walking={Boolean(walkingTo)}
        cycle={walkCycle(pixelSprite, walkScreenSpeed)}
        depthScale={depthScale}
        ambient={timeOfDay <= 1 ? 'day' : timeOfDay <= 3 ? 'dusk' : 'night'}
      />
    ) : (
      <PlayerCharacter
        x={x}
        y={y}
        facing={playerFacing.endsWith('west') ? 'left' : 'right'}
        walking={Boolean(walkingTo)}
      />
    );

  const getLocationActionText = (loc: { id: string; name: string }) => {
    if (scenarioType === 'modern') {
      if (loc.id === 'tavern') return "Karakol'a Git";
      if (loc.id === 'church') return "Kilise'ye Git";
      if (loc.id === 'mill') return "Acik Hava Sinemasi'na Git";
      if (loc.id === 'graveyard') return "Kaset Dukkani'na Git";
      if (loc.id === 'farm') return "Benzinlige Git";
      if (loc.id === 'clinic') return "Prefabrik Evlere Git";
    } else if (scenarioType === 'cyberpunk') {
      if (loc.id === 'tavern') return "Polis Karakolu'na Git";
      if (loc.id === 'church') return "Lokantaya Git";
      if (loc.id === 'mill') return "Robot\nDukkanina Git";
      if (loc.id === 'graveyard') return "Hurdaliga Git";
      if (loc.id === 'farm') return "Kopru Altina Git";
      if (loc.id === 'clinic') return "Bara Git";
    }

    return `${loc.name}'a Git`;
  };

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
          <h1 className={styles.pageTitle}>
            {scenarioType === 'modern'
              ? 'Millfield Kasabasi'
              : scenarioType === 'cyberpunk'
                ? 'Neon Prime'
                : 'Ashenmoor Koyu'}
          </h1>
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
          const isAvailable = loc.available && !isNight && !walkingTo;

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
                <span className={styles.icon}>{loc.icon}</span>
                <span>{walkingTo === loc.id || loadingLoc === loc.id ? 'Gidiliyor...' : getLocationActionText(loc)}</span>
                {!isAvailable && (
                  <span className={styles.lockedText}>
                    ({isNight ? 'Gece' : 'Kapalı'})
                  </span>
                )}
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
            onClick={handleEndDay} 
            disabled={endingDay}
            className={styles.endDayBtn}
          >
            <span className={styles.icon}>🛌</span>
            <span className={styles.btnText}>Günü Bitir</span>
          </button>
        </div>
      </footer>

      {/* Notebook Modal */}
      {isNotebookOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNotebookOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsNotebookOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Soruşturma Notları</h2>
            <textarea 
              className={styles.notesArea} 
              value={localNotes} 
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Gözlemlerini buraya not et..."
            />
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInventoryOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsInventoryOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Envanter</h2>
            <div className={styles.inventoryList}>
              {inventory.activeWarrants.length > 0 || inventory.usedWarrants.length > 0 ? (
                <>
                  {inventory.activeWarrants.map((w, idx) => (
                    <div key={`active-${idx}`} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8A0303', fontSize: '0.75rem' }}>
                        {getLocationLabel(w, scenarioType)}
                      </span>
                      <span>(Hazır)</span>
                    </div>
                  ))}
                  {inventory.usedWarrants.map((w, idx) => (
                    <div key={`used-${idx}`} className={styles.inventoryItem} style={{ opacity: 0.6 }}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8a7f72', fontSize: '0.75rem' }}>
                        {getLocationLabel(w, scenarioType)}
                      </span>
                      <span>(Kullanıldı)</span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#8a7f72', gridColumn: '1/-1' }}>Henüz bir eşyan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Condemn Selection Modal */}
      {isCondemnModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCondemnModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsCondemnModalOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>
              {currentDay === 4 && timeOfDay === 4 ? 'Vakit Doldu: Nihai Hüküm' : 'Hüküm Verilecek Kişiyi Seç'}
            </h2>
            <p className={styles.modalSubtitle}>
              {currentDay === 4 && timeOfDay === 4 
                ? 'Soruşturma için size tanınan süre bitti. Nihai kararınız nedir?' 
                : 'Nihai kararınız hikayenin sonunu belirleyecek. Dikkatli seçin.'}
            </p>
            <div className={styles.villagerList}>
              {(() => {
                let villagers = [];
                if (scenarioType === 'modern') {
                  villagers = [
                    { id: 'tavern', name: 'Şerif Dale Cooper', icon: '🚔', role: 'Polis Amiri' },
                    { id: 'church', name: 'Papaz Gerald', icon: '⛪', role: 'Papaz' },
                    { id: 'mill', name: 'Donna', icon: '🎬', role: 'Gişe Görevlisi' },
                    { id: 'graveyard', name: 'Randy', icon: '📼', role: 'Video Kasetçi' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Earl', icon: '⛽', role: 'Pompacı' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Old Marge', icon: '🏠', role: 'Köyün Yaşlısı' });
                  }
                } else if (scenarioType === 'cyberpunk') {
                  villagers = [
                    { id: 'tavern', name: 'Officer Kael Voss', icon: '👮', role: 'Memur Bey' },
                    { id: 'church', name: 'Mirel Sato', icon: '🍜', role: 'Restoran Sahibi' },
                    { id: 'mill', name: 'AURA-9', icon: '🤖', role: 'Satici Android' },
                    { id: 'graveyard', name: 'Brakk Coil', icon: '🛠️', role: 'Hurdaci' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Ash', icon: '🧥', role: 'Dilenci' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Vera Nyx', icon: '🍸', role: 'Barmen' });
                  }
                } else {
                  villagers = [
                    { id: 'tavern', name: 'Kardeş Aldric', icon: '🍺', role: 'Hancı' },
                    { id: 'church', name: 'Peder Malachar', icon: '⛪', role: 'Rahip' },
                    { id: 'mill', name: 'Değirmenci Giles', icon: '⚙️', role: 'Değirmenci' },
                    { id: 'graveyard', name: 'İhtiyar Silas', icon: '🪦', role: 'Mezarcı' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Çiftçi Edmund', icon: '🌾', role: 'Çiftçi' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Doktor Harland', icon: '🏥', role: 'Doktor' });
                  }
                }
                return villagers;
              })().map(villager => (
                <button 
                  key={villager.id} 
                  className={styles.villagerItem}
                  onClick={() => {
                    setIsCondemnModalOpen(false);
                    setConfirmModal({
                      isOpen: true,
                      title: 'Engizisyon Hükmü',
                      message: `${villager.name} isimli köylüyü ölüme mahkum etmek istediğinizden emin misiniz? Bu karar geri alınamaz.`,
                      onConfirm: () => handleCondemn(villager.id),
                    });
                  }}
                >
                  <span className={styles.villagerIcon}>{villager.icon}</span>
                  <div className={styles.villagerInfo}>
                    <span className={styles.villagerName}>{villager.name}</span>
                    <span className={styles.villagerRole}>{villager.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{confirmModal.title}</h2>
            <p className={styles.modalMessage}>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancel} 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Vazgeç
              </button>
              <button 
                className={styles.modalConfirm} 
                onClick={confirmModal.onConfirm}
              >
                Onayla
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
            .map((p) => `${p.x},${p.y}`)
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
