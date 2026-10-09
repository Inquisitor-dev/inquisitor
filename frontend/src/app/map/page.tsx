'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { apiUrl } from '@/config/api';
import { getInterior } from '@/config/interiorConfig';
import { useGameStore } from '../../store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import { findOutfit, wearableOutfitId } from '@/config/outfits';
import {
  directionFromDelta,
  screenStride,
  useCharacterManifest,
  type Direction,
} from '@/components/character/characterManifest';
import styles from './map.module.scss';
import MapCharacter from './MapCharacter';
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
    id: 'home',
    name: 'Evim',
    icon: '🏡',
    top: '56%',
    left: '6%',
    width: '17%',
    height: '25%',
    available: true,
  },
  {
    id: 'clinic',
    name: 'Revir',
    icon: '🏥',
    top: '44%',
    left: '27%',
    width: '16%',
    height: '24%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    id: 'farm',
    name: 'Çiftlik',
    icon: '🌾',
    top: '66%',
    left: '39%',
    width: '26%',
    height: '24%',
    available: true,
    minDifficulty: 'medium',
  },
];

// Modern kasaba konumları (Oakhaven / Millfield, KY 1994 haritası)
const modernLocations = [
  {
    // Petrol İstasyonu — Sol taraf, benzin pompaları ve sarı çatı
    id: 'farm',
    name: 'Petrol İstasyonu',
    icon: '⛽',
    top: '42%',
    left: '1%',
    width: '17%',
    height: '28%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    // Karakol — Petrolün sağında, tuğla bina ve bayrak
    id: 'tavern',
    name: 'Karakol',
    icon: '🚔',
    top: '25%',
    left: '17.5%',
    width: '15%',
    height: '36%',
    available: true,
  },
  {
    // Bar — Yukarıda, iki katlı ahşap "David's Bar"
    id: 'clinic',
    name: 'Bar',
    icon: '🍺',
    top: '1%',
    left: '34%',
    width: '22%',
    height: '36%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    // Evim — Barın sağ üstündeki ahşap müstakil ev
    id: 'home',
    name: 'Evim',
    icon: '🏡',
    top: '1%',
    left: '58%',
    width: '16%',
    height: '21%',
    available: true,
  },
  {
    // Hotel — Sağ üst köşe, 3 katlı ahşap otel
    id: 'church',
    name: 'Hotel',
    icon: '🏨',
    top: '7.5%',
    left: '72%',
    width: '24%',
    height: '44%',
    available: true,
  },
  {
    // Video Oyuncusu — Hotelin bir altındaki mor neon ışıklı salon (Pixel Arcade)
    id: 'graveyard',
    name: 'Video Oyuncusu',
    icon: '🎮',
    top: '44%',
    left: '62%',
    width: '20%',
    height: '29%',
    available: true,
  },
  {
    // Lokanta — En alttaki Diner / The Maple Cafe
    id: 'mill',
    name: 'Lokanta',
    icon: '🍽️',
    top: '63%',
    left: '31%',
    width: '26%',
    height: '31%',
    available: true,
  },
];

const cyberpunkLocations = [
  {
    // Evim — Sol kenarda, turuncu yatak neonlu alçak kapsül otel
    id: 'home',
    name: 'Evim',
    icon: '🏡',
    top: '40%',
    left: '0%',
    width: '16.5%',
    height: '22.5%',
    available: true,
  },
  {
    // Lokanta — Sol arka kulenin altındaki kırmızı neon erişte kâseli tezgâh
    id: 'church',
    name: 'Lokanta',
    icon: '🍜',
    top: '28.7%',
    left: '26%',
    width: '12%',
    height: '16%',
    available: true,
  },
  {
    // Tamirhane — Arka ortadaki mavi anahtar tabelalı, kepengi açık atölye
    id: 'mill',
    name: 'Tamirhane',
    icon: '🛠️',
    top: '20.6%',
    left: '34.5%',
    width: '14%',
    height: '22.4%',
    available: true,
  },
  {
    // Klinik — Sağ arka kulenin altındaki yeşil neon haçlı cam önlü klinik
    id: 'graveyard',
    name: 'Klinik',
    icon: '🏥',
    top: '27%',
    left: '55.5%',
    width: '15%',
    height: '17.5%',
    available: true,
  },
  {
    // Karakol — Sağdaki mavi kalkan tabelalı, önünde bariyerler olan bina
    id: 'tavern',
    name: 'Karakol',
    icon: '👮',
    top: '32%',
    left: '70.75%',
    width: '12.25%',
    height: '22.4%',
    available: true,
  },
  {
    // Bar — En sağdaki pembe kedi neonlu, kadife ipli kulüp (Velvet Static)
    id: 'clinic',
    name: 'Bar',
    icon: '🍸',
    top: '42%',
    left: '83%',
    width: '11%',
    height: '23.3%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    // Sokak Pazarı — Meydanın ortasındaki dört bloklu tenteli gece pazarı
    id: 'farm',
    name: 'Sokak Pazarı',
    icon: '🏮',
    top: '45%',
    left: '33%',
    width: '37%',
    height: '38%',
    available: true,
    minDifficulty: 'medium',
  },
];

const chinaLocations = [
  {
    // Evim — Sağ alttaki konut ve avlu
    id: 'home',
    name: 'Evim',
    icon: '🏡',
    top: '64%',
    left: '54%',
    width: '24%',
    height: '30%',
    available: true,
  },
  {
    // Muhafız Karargahı — Sol üst
    id: 'church',
    name: 'Muhafız Karargahı',
    icon: '🏯',
    top: '8%',
    left: '12%',
    width: '24%',
    height: '28%',
    available: true,
  },
  {
    // Çay Evi & Han — Üst orta
    id: 'tavern',
    name: 'Çay Evi & Han',
    icon: '🍵',
    top: '12%',
    left: '46%',
    width: '22%',
    height: '30%',
    available: true,
  },
  {
    // Kadim Tapınak — Sağ üst
    id: 'graveyard',
    name: 'Kadim Tapınak',
    icon: '⛩️',
    top: '10%',
    left: '74%',
    width: '20%',
    height: '28%',
    available: true,
  },
  {
    // Şifacı & Baharatçı — Sol orta
    id: 'clinic',
    name: 'Şifacı & Baharatçı',
    icon: '🌿',
    top: '38%',
    left: '8%',
    width: '20%',
    height: '28%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    // Demirci Ocağı — Sağ orta
    id: 'mill',
    name: 'Demirci Ocağı',
    icon: '⚒️',
    top: '38%',
    left: '70%',
    width: '22%',
    height: '30%',
    available: true,
  },
  {
    // Balıkçı İskelesi — Sol alt nehir kenarındaki iskele ve kayık
    id: 'farm',
    name: 'Balıkçı İskelesi',
    icon: '🎣',
    top: '72%',
    left: '3%',
    width: '25%',
    height: '25%',
    available: true,
    minDifficulty: 'medium',
  },
];

const winterLocations = [
  {
    // Evim — Ortadaki ahşap avcı kulübesi
    id: 'home',
    name: 'Evim',
    icon: '🏡',
    top: '46%',
    left: '28%',
    width: '20%',
    height: '26%',
    available: true,
  },
  {
    // Kutsal Yürek Ağacı — Sol üst
    id: 'church',
    name: 'Kutsal Yürek Ağacı',
    icon: '🍁',
    top: '5%',
    left: '6%',
    width: '24%',
    height: '32%',
    available: true,
  },
  {
    // Gözcü Kalesi — Orta üst
    id: 'graveyard',
    name: 'Gözcü Kalesi',
    icon: '🏰',
    top: '8%',
    left: '38%',
    width: '24%',
    height: '32%',
    available: true,
  },
  {
    // Sur — En sağ üstteki sur kapısı ve nöbetçi mevkii
    id: 'farm',
    name: 'Sur',
    icon: '🛡️',
    top: '1%',
    left: '74%',
    width: '25%',
    height: '33%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    // Kış Hanı — Sağ orta
    id: 'tavern',
    name: 'Kış Hanı',
    icon: '🔥',
    top: '38%',
    left: '64%',
    width: '24%',
    height: '32%',
    available: true,
  },
  {
    // Terk Edilmiş Maden — Sol alt
    id: 'mill',
    name: 'Terk Edilmiş Maden',
    icon: '⛏️',
    top: '68%',
    left: '5%',
    width: '24%',
    height: '26%',
    available: true,
  },
  {
    // İnfaz Meydanı — Sağ alt
    id: 'clinic',
    name: 'İnfaz Meydanı',
    icon: '⚔️',
    top: '68%',
    left: '60%',
    width: '26%',
    height: '28%',
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
// Referans ölçekte karakter karesinin ekrandaki ölçeği (kare pikseli başına ekran pikseli).
// 1,9 m'lik karakter karede ~185 px; 0.36 ile ekranda ~67 px boyunda görünür.
const CHARACTER_SPRITE_SCALE = 0.36;
// Referans ölçekte, derinlik 1 iken yatay yürüyüşte px/sn (saniyede ~2 adım, kararlı bir tempo).
// Dikey yürüyüşte kamera açısı yüzünden ekranda daha az yol alınır; adım temposu her yönde aynı kalır.
const SCREEN_WALK_SPEED = 75;
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
      farm: 'Petrol İstasyonu',
      clinic: 'Bar',
      home: 'Evim',
      church: 'Hotel',
      graveyard: 'Video Oyuncusu',
      mill: 'Lokanta',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'cyberpunk') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      church: 'Lokanta',
      graveyard: 'Klinik',
      mill: 'Tamirhane',
      farm: 'Sokak Pazarı',
      clinic: 'Bar',
      home: 'Evim',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'china') {
    const labels: Record<string, string> = {
      tavern: 'Çay Evi & Han',
      church: 'Muhafız Karargahı',
      graveyard: 'Kadim Tapınak',
      mill: 'Demirci Ocağı',
      farm: 'Balıkçı İskelesi',
      clinic: 'Şifacı & Baharatçı',
      home: 'Evim',
      crime_scene: 'Pazar Meydanı',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'winter') {
    const labels: Record<string, string> = {
      tavern: 'Kış Hanı',
      church: 'Kutsal Yürek Ağacı',
      graveyard: 'Gözcü Kalesi',
      mill: 'Terk Edilmiş Maden',
      farm: 'Sur',
      clinic: 'İnfaz Meydanı',
      home: 'Evim',
      crime_scene: 'Buzlu Geçit',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlik',
    mill: 'Degirmen',
    farm: 'Ciftlik',
    clinic: 'Revir',
    home: 'Evim',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};

export default function MapPage() {
  const router = useRouter();
  const { sessionId, currentDay, timeOfDay, difficulty, scenarioType, dialoguesUsedToday, authToken, isAdmin, endDay, advanceTime, setWarrants, setScenarioType, notes, setNotes, inventory, evidence, setEvidence, hasHydrated, lastLocationId, setLastLocationId } = useGameStore();
  // Envanter'de sadece fiziksel kanıtlar görünür; karakter ifadeleri Not defterindedir
  const evidenceItems = evidence.filter((item) => item.category === 'ITEM');

  // Zorluk seviyesine göre lokasyonları filtrele
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const currentDiffIdx = difficultyOrder.indexOf(difficulty);
  const baseLocations =
    scenarioType === 'modern'
      ? modernLocations
      : scenarioType === 'cyberpunk'
        ? cyberpunkLocations
        : scenarioType === 'china'
          ? chinaLocations
          : scenarioType === 'winter'
            ? winterLocations
            : locations;
  const visibleLocations = baseLocations.filter((loc: { minDifficulty?: string }) => {
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
  // Yürüme döngüsünün ilerlemesi (kesirli döngü sayısı); adım kareleri buna göre seçilir
  const [walkPhase, setWalkPhase] = useState(0);
  const walkFrame = useRef<number | null>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const playerPos = (walkingTo && walkPos) || roads.nodes[restNodeId];
  // Haritanın çizim ölçeğine göre karakter boyu (köydeki boy = 1)
  const characterScale = roads.characterScale ?? 1;
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

  // Giyili kıyafetin karakteri tüm haritalarda kullanılır; tüm yön görselleri yüklenince görünür
  const { equippedOutfitId, ownedItemIds, hasHydrated: marketHydrated } = useMarketStore();
  const wornOutfitId = marketHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  const character = useCharacterManifest(wornOutfitId, 'map');
  const characterRarity = wornOutfitId ? findOutfit(wornOutfitId)?.rarity : undefined;
  
  // Modal states
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
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
  const [localNotes, setLocalNotes] = useState(notes);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sunucudan gelen notlar (ör. yeni ifade) yerel taslağın üzerine yazılır
  const [syncedNotes, setSyncedNotes] = useState(notes);
  if (notes !== syncedNotes) {
    setSyncedNotes(notes);
    setLocalNotes(notes);
  }

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/');
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

          const evidenceRes = await fetch(apiUrl(`/game-sessions/${sessionId}/evidence`), {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (evidenceRes.ok) {
            const evidenceData = await evidenceRes.json();
            setEvidence(Array.isArray(evidenceData.evidence) ? evidenceData.evidence : []);
          }
        } catch {}
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
      // İç görünümü hazırlanmış mekânlarda oyuncuyu önce mekânın içi karşılar
      router.push(getInterior(scenarioType, locId) ? `/interior/${locId}` : `/interact/${locId}`);
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
      if (locId === 'home') {
        setIsHomeModalOpen(true);
      } else {
        handleLocationClick(locId);
      }
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
      if (locId === 'home') {
        setIsHomeModalOpen(true);
      } else {
        await handleLocationClick(locId);
      }
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
      setWalkPhase((now - startTime) / 1000 / (character?.walk.cycleSeconds ?? 1));
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
      if (locId === 'home') {
        setIsHomeModalOpen(true);
      } else {
        await handleLocationClick(locId);
      }
      setWalkingTo(null);
      setWalkPos(null);
    };

    setWalkingTo(locId);
    if (route.length === 0) {
      arrive();
      return;
    }

    // Karakterin ekrandaki boy çarpanı; hız da bununla ölçeklenir ki adım temposu her haritada aynı kalsın
    const sizeScale = (layerScale / CHARACTER_REF_LAYER_SCALE) * characterScale;
    // Referans ölçekteki hız; ekrandaki hız karakterle birlikte sizeScale kadar büyür
    const baseSpeed = Math.max(
      SCREEN_WALK_SPEED,
      (route.length * layerScale) / sizeScale / WALK_MAX_DURATION
    );

    const lookahead = WALK_LOOKAHEAD / layerScale;
    const firstAhead = route.pointAt(lookahead);
    let facing = directionFromDelta(firstAhead.x - points[0].x, firstAhead.y - points[0].y);
    setPlayerFacing(facing);

    let travelled = 0;
    let elapsed = 0;
    let phase = 0;
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
      const depth = depthScaleAt(pos.y, image.height);
      // Gidilen yöndeki adım boyu (kare pikseli); yataydaki adıma oranı ekrandaki hız çarpanıdır.
      // Böylece karakter yerde sabit hızla yürür: dikeyde ekranda yavaşlar ama adım temposu değişmez.
      const towards = route.pointAt(travelled + 2);
      const stride = character ? screenStride(character, towards.x - pos.x, towards.y - pos.y) : 0;
      const directionFactor = character ? stride / screenStride(character, 1, 0) : 1;
      // Uzaktaki karakter ekranda daha yavaş ilerler, böylece adım boyu da ölçekle uyumlu kalır
      const screenSpeed = baseSpeed * sizeScale * depth * ease * directionFactor;
      const advance = (screenSpeed / layerScale) * dt;
      travelled += advance;
      // Ekranda kat edilen yol / ekrandaki adım boyu (sizeScale ve layerScale birbirini götürür)
      if (stride > 0) {
        phase +=
          (advance * CHARACTER_REF_LAYER_SCALE) / (stride * CHARACTER_SPRITE_SCALE * characterScale * depth);
        setWalkPhase(phase);
      }

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
      if (timeOfDay <= 1) return '/map/cyberpunk_map_morning.webp';
      if (timeOfDay <= 3) return '/map/cyberpunk_map_sunset.webp';
      return '/map/cyberpunk_map_night.webp';
    }
    if (scenarioType === 'china') {
      if (timeOfDay <= 1) return '/map/china_morning.png';
      if (timeOfDay <= 3) return '/map/china_sunset.png';
      return '/map/china_night.png';
    }
    if (scenarioType === 'winter') {
      if (timeOfDay <= 1) return '/map/winter_morning.jpg';
      if (timeOfDay <= 3) return '/map/winter_sunset.jpg';
      return '/map/winter_night.jpg';
    }
    if (timeOfDay <= 1) return '/map/village_map_morning.png';
    if (timeOfDay <= 3) return '/map/village_map_sunset.png';
    return '/map/village_map.png';
  };

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

    if (scenarioType === 'modern') {
      if (loc.id === 'tavern') return "Karakol'a Git";
      if (loc.id === 'farm') return "Petrol İstasyonu'na Git";
      if (loc.id === 'clinic') return "Bar'a Git";
      if (loc.id === 'church') return "Hotel'e Git";
      if (loc.id === 'graveyard') return "Video Oyuncusu'na Git";
      if (loc.id === 'mill') return "Lokanta'ya Git";
    } else if (scenarioType === 'cyberpunk') {
      if (loc.id === 'tavern') return "Karakol'a Git";
      if (loc.id === 'church') return "Lokanta'ya Git";
      if (loc.id === 'mill') return "Tamirhane'ye Git";
      if (loc.id === 'graveyard') return "Klinik'e Git";
      if (loc.id === 'farm') return "Sokak Pazarı'na Git";
      if (loc.id === 'clinic') return "Bar'a Git";
    } else if (scenarioType === 'china') {
      if (loc.id === 'home') return "Eve Git";
      if (loc.id === 'tavern') return "Çay Evi'ne Git";
      if (loc.id === 'church') return "Karargah'a Git";
      if (loc.id === 'graveyard') return "Tapınak'a Git";
      if (loc.id === 'mill') return "Demirci'ye Git";
      if (loc.id === 'farm') return "Balıkçı İskelesi'ne Git";
      if (loc.id === 'clinic') return "Şifacı'ya Git";
    } else if (scenarioType === 'winter') {
      if (loc.id === 'home') return "Eve Git";
      if (loc.id === 'tavern') return "Kış Hanı'na Git";
      if (loc.id === 'church') return "Yürek Ağacı'na Git";
      if (loc.id === 'graveyard') return "Gözcü Kalesi'ne Git";
      if (loc.id === 'mill') return "Maden'e Git";
      if (loc.id === 'farm') return "Sur'a Git";
      if (loc.id === 'clinic') return "İnfaz Meydanı'na Git";
    }

    if (loc.id === 'clinic') return "Revir'e Git";
    if (loc.id === 'farm') return "Çiftliğe Git";
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
                : scenarioType === 'china'
                  ? 'Jinling'
                  : scenarioType === 'winter'
                    ? 'Frosthold'
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
          const isAvailable = (loc.available && !isNight && !walkingTo) || (loc.id === 'home' && !walkingTo);

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

      {/* Home Modal */}
      {isHomeModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHomeModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsHomeModalOpen(false)}>&times;</button>
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
                onClick={() => setIsHomeModalOpen(false)}
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
              {inventory.activeWarrants.length > 0 || inventory.usedWarrants.length > 0 || evidenceItems.length > 0 ? (
                <>
                  {evidenceItems.map((item) => (
                    <div key={item.id} className={`${styles.inventoryItem} ${styles.evidenceItem}`}>
                      <span className={styles.itemName}>{item.text}</span>
                      <span className={styles.evidenceSource}>
                        {getLocationLabel(item.sourceId, scenarioType)} · {item.dayNumber}. gün
                      </span>
                    </div>
                  ))}
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
                    { id: 'church', name: 'Gerald', icon: '🏨', role: 'Otel İşletmecisi' },
                    { id: 'mill', name: 'Donna', icon: '🍽️', role: 'Lokantacı' },
                    { id: 'graveyard', name: 'Randy', icon: '🎮', role: 'Video Oyuncusu' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Earl', icon: '⛽', role: 'Pompacı' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'David', icon: '🍺', role: 'Barmen' });
                  }
                } else if (scenarioType === 'cyberpunk') {
                  villagers = [
                    { id: 'tavern', name: 'Officer Kael Voss', icon: '👮', role: 'Polis Memuru' },
                    { id: 'church', name: 'Mirel Sato', icon: '🍜', role: 'Lokantacı' },
                    { id: 'mill', name: 'AURA-9', icon: '🛠️', role: 'Tamirci Android' },
                    { id: 'graveyard', name: 'Brakk Coil', icon: '🏥', role: 'Klinik Hekimi' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Ash', icon: '🏮', role: 'Pazar Satıcısı' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Vera Nyx', icon: '🍸', role: 'Barmen' });
                  }
                } else if (scenarioType === 'china') {
                  villagers = [
                    { id: 'tavern', name: 'Lin Feng', icon: '🍵', role: 'Çay Evi Sahibi' },
                    { id: 'church', name: 'Komutan Zhao', icon: '🏯', role: 'Garnizon Komutanı' },
                    { id: 'graveyard', name: 'Keşiş Huikang', icon: '⛩️', role: 'Tapınak Bilgesi' },
                    { id: 'mill', name: 'Usta Guan', icon: '⚒️', role: 'Demirci Ustası' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Mei Teyze', icon: '🎣', role: 'Balıkçı İskelesi Gözcüsü' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Bilgin Song', icon: '🌿', role: 'Saray Eczacısı' });
                  }
                } else if (scenarioType === 'winter') {
                  villagers = [
                    { id: 'tavern', name: 'Torstein', icon: '🔥', role: 'Hancı' },
                    { id: 'church', name: 'Kahin Valda', icon: '🍁', role: 'Yürek Ağacı Bekçisi' },
                    { id: 'graveyard', name: 'Komutan Bjorn', icon: '🏰', role: 'Kale Muhafızı' },
                    { id: 'mill', name: 'Madenci Durn', icon: '⛏️', role: 'Ustabaşı' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Einar', icon: '🛡️', role: 'Sur Muhafızı' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Muhafız Kenneth', icon: '⚔️', role: 'Meydan Çavuşu' });
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
