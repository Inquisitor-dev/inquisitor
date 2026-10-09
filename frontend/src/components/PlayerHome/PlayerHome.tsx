'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { getPlayerHome, type HomeActionId, type HomeSpot, type PlayerHomeData } from '@/config/homeConfig';
import { wearableOutfitId } from '@/config/outfits';
import { useCharacterManifest } from '@/components/character/characterManifest';
import { useScenePan } from '@/components/InteriorViewer/useScenePan';
import { useAmbientParticles } from '@/components/InteriorViewer/useAmbientParticles';
import { revealScene, showScene } from '@/components/SceneTransition/sceneStore';
import { homeScene, mapScene } from '@/components/SceneTransition/scenes';
import NotebookModal from '@/components/CaseModals/NotebookModal';
import InventoryModal from '@/components/CaseModals/InventoryModal';
import { useGameStore } from '@/store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import sceneStyles from '@/components/InteriorViewer/InteriorViewer.module.scss';
import styles from './PlayerHome.module.scss';

// Ev görselleri iç mekânlarla aynı 21:9 oranında üretilir
const HOME_ASPECT_RATIO = 3168 / 1344;
// 360° görselinden kullanılan kare: karakter kameraya ~20° yan döner
const CHARACTER_FRAME = 4;
// Ayakların, 360° karesinin yüksekliğine oranla bastığı nokta
const FEET_ANCHOR = 0.94;
const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];
const ROMAN = ['I', 'II', 'III', 'IV'];
// Son gün bitince oyun biter; yatak hüküm ekranına götürür
const LAST_DAY = 4;
// İşlev düğmesinin ekran kenarlarından uzak durduğu pay (yarım genişlik / üst-alt çubuklar)
const ACTION_HALF_WIDTH = 160;
const ACTION_TOP_MARGIN = 110;
const ACTION_BOTTOM_MARGIN = 90;

type OpenPanel = 'notes' | 'inventory' | 'board' | null;

export default function PlayerHome() {
  const router = useRouter();
  const { scenarioType, sessionId, authToken, hasHydrated } = useGameStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!authToken) router.push('/');
    else if (!sessionId) router.push('/menu');
  }, [hasHydrated, authToken, sessionId, router]);

  if (!hasHydrated) return <div className={sceneStyles.unavailable} />;

  const home = getPlayerHome(scenarioType || 'medieval');
  if (!home) {
    return (
      <div className={sceneStyles.unavailable}>
        <div className={sceneStyles.unavailableCard}>
          <h1 className={sceneStyles.unavailableTitle}>Bu evrende evin henüz hazır değil</h1>
          <p className={sceneStyles.unavailableText}>
            Dinlenmek, notlarını ve envanterini görmek için haritadaki evine tıklayabilirsin.
          </p>
          <div className={sceneStyles.unavailableActions}>
            <Link href="/map" className={sceneStyles.backBtn}>
              Haritaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <HomeScene key={home.scenarioType} home={home} />;
}

function HomeScene({ home }: { home: PlayerHomeData }) {
  const router = useRouter();
  const {
    sessionId,
    authToken,
    currentDay,
    timeOfDay,
    endDay,
    setWarrants,
    setEvidence,
    setScenarioType,
    scenarioType,
  } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [activeSpot, setActiveSpot] = useState<HomeActionId | null>(null);
  const [endingDay, setEndingDay] = useState(false);
  // Uyuyunca ekran kararır ve yeni günün adı görünür
  const [dawnDay, setDawnDay] = useState<number | null>(null);

  const { viewport, frameW, frameH, currentPan, isDragging, handlePointerDown, handleClickCapture } = useScenePan(
    HOME_ASPECT_RATIO,
    openPanel !== null,
    // Dar ekranda (telefon) oda sığmaz; açılışta karakter ortada görünür
    home.character.x / 100
  );
  useAmbientParticles(canvasRef, home.particleType);

  // Ev görseli yüklenene kadar geçiş ekranı kalır
  useLayoutEffect(() => {
    void revealScene([home.backgroundImage], homeScene(home));
  }, [home]);

  const goToMap = (kicker?: string) => showScene(mapScene(scenarioType, timeOfDay, currentDay, kicker));

  // Gardıropta giyilen karakter evde de görünür
  const { equippedOutfitId, ownedItemIds, hasHydrated: marketHydrated } = useMarketStore();
  const outfitId = marketHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  const character = useCharacterManifest(outfitId, 'turntable');

  // Haritadaki gibi arama izinleri ve kanıtlar sunucudan tazelenir
  useEffect(() => {
    if (!sessionId || !authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    (async () => {
      try {
        const res = await fetch(apiUrl(`/game-sessions/${sessionId}`), { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (data.scenarioType) setScenarioType(data.scenarioType);
        setWarrants(data.activeWarrants || [], data.usedWarrants || []);
        const evidenceRes = await fetch(apiUrl(`/game-sessions/${sessionId}/evidence`), { headers });
        if (evidenceRes.ok) {
          const evidenceData = await evidenceRes.json();
          setEvidence(Array.isArray(evidenceData.evidence) ? evidenceData.evidence : []);
        }
      } catch (err) {
        console.error('Failed to refresh session', err);
      }
    })();
  }, [sessionId, authToken, setScenarioType, setWarrants, setEvidence]);

  useEffect(() => {
    if (dawnDay === null) return;
    const timer = setTimeout(() => setDawnDay(null), 2600);
    return () => clearTimeout(timer);
  }, [dawnDay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setActiveSpot(null);
      // Not defteri ve envanter kendi Escape'ini dinler (not defteri kapanırken kaydeder)
      setOpenPanel((cur) => (cur === 'board' ? null : cur));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLastDay = currentDay >= LAST_DAY;
  const isNight = timeOfDay >= 4;

  const handleSleep = async () => {
    if (!sessionId || endingDay) return;
    // Son günün sonunda uyunmaz: hüküm haritadaki seçim penceresinden verilir
    if (isLastDay) {
      goToMap('Hüküm vakti');
      router.push('/map?hukum=1');
      return;
    }
    setEndingDay(true);
    try {
      const res = await fetch(apiUrl(`/game-sessions/${sessionId}/end-day`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error(`end-day ${res.status}`);
      endDay();
      setActiveSpot(null);
      setDawnDay(currentDay + 1);
    } catch (err) {
      console.error('Failed to end day', err);
    } finally {
      setEndingDay(false);
    }
  };

  const actions: Record<HomeActionId, { icon: string; label: string; desc: string; run: () => void }> = {
    bed: isLastDay
      ? {
          icon: '⚖️',
          label: 'Hükmünü Ver',
          desc: 'Soruşturmanın son günü. Suçluyu seçme vakti geldi.',
          run: handleSleep,
        }
      : {
          icon: '🛌',
          label: endingDay ? 'Uykuya dalıyorsun…' : 'Dinlen & Günü Bitir',
          desc: isNight ? 'Geceyi uykuda geçir ve bir sonraki güne başla.' : 'Günü erken sonlandırıp dinlen.',
          run: handleSleep,
        },
    desk: {
      icon: '📖',
      label: 'Soruşturma Notları',
      desc: 'Aldığın ifadeleri ve gözlemlerini oku.',
      run: () => setOpenPanel('notes'),
    },
    chest: {
      icon: '🎒',
      label: 'Envanter ve Deliller',
      desc: 'Bulduğun kanıtları ve arama izinlerini incele.',
      run: () => setOpenPanel('inventory'),
    },
    board: {
      icon: '📌',
      label: 'Soruşturma Panosu',
      desc: 'Kanıtları ve ifadeleri panoya iğnele, aralarına ip ger.',
      run: () => setOpenPanel('board'),
    },
    door: {
      icon: '🚪',
      label: 'Dışarı Çık',
      desc: 'Sokaklara geri dön.',
      run: () => {
        goToMap();
        router.push('/map');
      },
    },
  };

  // Karakter, ayakları evin belirlenen noktasına basacak şekilde yerleştirilir
  const turntable = character?.turntable;
  const characterH = frameH * home.character.height;
  const characterW = turntable ? (characterH * turntable.frameWidth) / turntable.frameHeight : 0;
  const characterStyle: CSSProperties | undefined = turntable && {
    width: `${characterW}px`,
    height: `${characterH}px`,
    left: `calc(${home.character.x}% - ${characterW / 2}px)`,
    top: `calc(${home.character.y}% - ${characterH * FEET_ANCHOR}px)`,
    backgroundImage: `url(${turntable.src})`,
    filter: home.characterFilter,
    backgroundSize: `${turntable.columns * 100}% ${Math.ceil(turntable.frames / turntable.columns) * 100}%`,
    backgroundPosition: `${((CHARACTER_FRAME % turntable.columns) / (turntable.columns - 1)) * 100}% ${
      (Math.floor(CHARACTER_FRAME / turntable.columns) / Math.max(Math.ceil(turntable.frames / turntable.columns) - 1, 1)) * 100
    }%`,
  };

  // İşlev düğmesi eşyanın ekranda görünen kısmının ortasına konur ve ekranın içinde tutulur
  // (ör. yatağın yarısı ekranın solunda kalsa da düğme görünür)
  const actionPosition = (spot: HomeSpot) => {
    const sx = (spot.left / 100) * frameW + currentPan.x;
    const sy = (spot.top / 100) * frameH + currentPan.y;
    const sw = (spot.width / 100) * frameW;
    const sh = (spot.height / 100) * frameH;
    const clamp = (v: number, min: number, max: number) => (min > max ? (min + max) / 2 : Math.max(min, Math.min(max, v)));
    const cx = (Math.max(sx, 0) + Math.min(sx + sw, viewport.w)) / 2;
    const cy = (Math.max(sy, 0) + Math.min(sy + sh, viewport.h)) / 2;
    return {
      left: `${clamp(cx, ACTION_HALF_WIDTH, viewport.w - ACTION_HALF_WIDTH) - sx}px`,
      top: `${clamp(cy, ACTION_TOP_MARGIN, viewport.h - ACTION_BOTTOM_MARGIN) - sy}px`,
    };
  };

  const renderSpot = (spot: HomeSpot) => {
    const action = actions[spot.action];
    const active = activeSpot === spot.action;
    return (
      <div
        key={spot.action}
        className={`${styles.spot} ${active ? styles.spotActive : ''}`}
        style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
        onMouseEnter={() => setActiveSpot(spot.action)}
        onMouseLeave={() => setActiveSpot((cur) => (cur === spot.action ? null : cur))}
        // Dokunmatik ekranda ilk dokunuş seçeneği gösterir
        onClick={() => setActiveSpot(spot.action)}
      >
        <span className={styles.spotHint} aria-hidden>
          {action.icon}
        </span>
        <span className={styles.spotTitle}>{spot.title}</span>
        <button
          type="button"
          className={styles.spotAction}
          style={active ? actionPosition(spot) : undefined}
          tabIndex={active ? 0 : -1}
          disabled={spot.action === 'bed' && endingDay}
          onClick={(e) => {
            e.stopPropagation();
            action.run();
          }}
        >
          <span className={styles.spotActionIcon}>{action.icon}</span>
          <span className={styles.spotActionText}>
            <span className={styles.spotActionLabel}>{action.label}</span>
            <span className={styles.spotActionDesc}>{action.desc}</span>
          </span>
        </button>
      </div>
    );
  };

  return (
    <div
      className={`${sceneStyles.viewportContainer} ${isDragging ? sceneStyles.dragging : ''}`}
      onPointerDown={handlePointerDown}
    >
      <div className={sceneStyles.ambientBackdrop} style={{ backgroundImage: `url(${home.backgroundImage})` }} />

      <div className={sceneStyles.sceneWrapper}>
        <div
          className={sceneStyles.sceneFrame}
          style={{
            width: `${frameW}px`,
            height: `${frameH}px`,
            transform: `translate3d(${currentPan.x}px, ${currentPan.y}px, 0)`,
          }}
        >
          <img src={home.backgroundImage} alt={home.name} className={sceneStyles.sceneImage} draggable={false} />

          {characterStyle && (
            <>
              <div
                className={styles.characterShadow}
                style={{
                  left: `${home.character.x}%`,
                  top: `${home.character.y}%`,
                  width: `${characterW * 0.55}px`,
                  height: `${characterW * 0.12}px`,
                }}
              />
              <div className={styles.character} style={characterStyle} role="img" aria-label="Karakterin" />
            </>
          )}

          <div className={styles.spotsLayer} onClickCapture={handleClickCapture}>
            {home.spots.map(renderSpot)}
          </div>
        </div>
      </div>

      <div className={sceneStyles.vignetteOverlay} />
      <div className={home.lightingTone === 'neon' ? sceneStyles.neonFlickerOverlay : sceneStyles.torchFlickerOverlay} />
      <canvas ref={canvasRef} className={sceneStyles.dustCanvas} />

      <header className={sceneStyles.topHud}>
        <div className={sceneStyles.hudGroup}>
          <Link href="/map" className={sceneStyles.backBtn} onClick={() => goToMap()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Haritaya Dön
          </Link>
        </div>

        <div className={sceneStyles.locationHeader}>
          <h1 className={sceneStyles.locationTitle}>{home.name}</h1>
          <p className={sceneStyles.locationSubtitle}>{home.subtitle}</p>
        </div>

        <div className={sceneStyles.hudGroup}>
          <span className={styles.dayBadge}>
            <span className={styles.dayRoman}>{ROMAN[currentDay - 1] ?? currentDay}</span>
            {currentDay}. Gün · {TIME_LABELS[timeOfDay] ?? ''}
          </span>
        </div>
      </header>

      <footer className={sceneStyles.bottomHud}>
        <div className={sceneStyles.sceneBadge}>
          <span className={sceneStyles.badgeDot} />
          <span className={styles.hintPointer}>Evin • Eşyaların üzerine gel, yapmak istediğini seç</span>
          <span className={styles.hintTouch}>Evin • Sürükleyerek etrafa bak, eşyalara dokun</span>
        </div>
      </footer>

      {openPanel === 'notes' && <NotebookModal onClose={() => setOpenPanel(null)} />}
      {openPanel === 'inventory' && <InventoryModal onClose={() => setOpenPanel(null)} />}
      {openPanel === 'board' && (
        <div className={styles.boardOverlay} onClick={() => setOpenPanel(null)}>
          <div className={styles.boardCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.boardClose} onClick={() => setOpenPanel(null)} aria-label="Kapat">
              &times;
            </button>
            <span className={styles.boardIcon}>📌</span>
            <h2 className={styles.boardTitle}>Soruşturma Panosu</h2>
            <p className={styles.boardText}>
              Yakında topladığın kanıtların görsellerini ve tanık ifadelerini bu panoya iğneleyip aralarına kırmızı
              ip gerebileceksin. Şimdilik notlarını yazı masasından, kanıtlarını sandıktan inceleyebilirsin.
            </p>
          </div>
        </div>
      )}

      {dawnDay !== null && (
        <div className={styles.dawn} aria-live="polite">
          <span className={styles.dawnRoman}>{ROMAN[dawnDay - 1] ?? dawnDay}</span>
          <span className={styles.dawnText}>{dawnDay}. Gün · Sabah</span>
        </div>
      )}
    </div>
  );
}
