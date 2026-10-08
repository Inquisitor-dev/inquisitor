'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getInterior,
  getScenarioInteriors,
  InteriorHotspot,
  LocationInteriorData,
} from '@/config/interiorConfig';
import { useGameStore } from '@/store/useGameStore';
import { apiUrl } from '@/config/api';
import styles from './InteriorViewer.module.scss';

// Sürüklerken görselin kenarı en fazla bu kadar aşılabilir (lastik efekti)
const OVERSCROLL = 40;
// Görsel yüksekliğinin ekran yüksekliğine oranı: dikeyde de biraz gezinme payı bırakır
const FRAME_HEIGHT_RATIO = 1.15;

interface InteriorViewerProps {
  locationId: string;
}

export default function InteriorViewer({ locationId }: InteriorViewerProps) {
  const { scenarioType, hasHydrated } = useGameStore();
  // Kayıtlı evren yüklenmeden önce varsayılan evrenin mekânı bir an görünmesin
  if (!hasHydrated) return <div className={styles.unavailable} />;

  const scenario = scenarioType || 'medieval';
  const locationData = getInterior(scenario, locationId);
  if (!locationData) {
    return (
      <div className={styles.unavailable}>
        <div className={styles.unavailableCard}>
          <h1 className={styles.unavailableTitle}>Bu mekânın içi henüz hazır değil</h1>
          <p className={styles.unavailableText}>
            Bu evrenin iç mekânları üzerinde çalışılıyor. Sorgunu mekânın kendisinden sürdürebilirsin.
          </p>
          <div className={styles.unavailableActions}>
            <Link href="/map" className={styles.backBtn}>
              Haritaya Dön
            </Link>
            {locationId !== 'crime_scene' && (
              <Link href={`/interact/${locationId}`} className={styles.actionBtn}>
                Mekâna Dön
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <InteriorScene
      key={`${scenario}-${locationId}`}
      locationId={locationId}
      locationData={locationData}
      scenarioInteriors={getScenarioInteriors(scenario)}
    />
  );
}

// Bilinen başlangıç en-boy oranı (ilk render anında layout shift'i engeller)
function getKnownAspectRatio(url: string): number {
  if (url.includes('cyberpunk') || url.includes('china') || url.includes('winter') || url.includes('modern')) return 3168 / 1344;
  if (url.includes('graveyard')) return 2816 / 1536;
  return 1376 / 768;
}

function InteriorScene({
  locationId,
  locationData,
  scenarioInteriors,
}: {
  locationId: string;
  locationData: LocationInteriorData;
  scenarioInteriors: LocationInteriorData[];
}) {
  const router = useRouter();
  const { sessionId, authToken, notes, setNotes, inventory } = useGameStore();

  // Sabit ipucu metni olmayan "ipucu" noktası, vakanın gerçek ipucunun aranabileceği bir yerdir
  const isSearchSpot = (hotspot: InteriorHotspot) => hotspot.category === 'clue' && !hotspot.clueSnippet;
  const hasWarrant = inventory?.activeWarrants?.includes(locationData.id) ?? false;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Görsel ekranı boşluksuz doldurur (zoom yok); ekrandan taşan kısım sürüklenerek gezilir
  const [aspectRatio, setAspectRatio] = useState<number>(() =>
    getKnownAspectRatio(locationData.backgroundImage)
  );
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window === 'undefined' ? 1920 : window.innerWidth,
    h: typeof window === 'undefined' ? 1080 : window.innerHeight,
  }));
  // Görsel her iki eksende de ekrandan taşar (yükseklik ekranın %115'i, en az esneme payı kadar):
  // böylece yukarı-aşağı da biraz gezilir ve kenara çekince siyah yerine görselin kenarı görünür
  const frameH = Math.max(
    viewport.h * FRAME_HEIGHT_RATIO,
    viewport.h + 2 * OVERSCROLL,
    (viewport.w + 2 * OVERSCROLL) / aspectRatio
  );
  const frameW = frameH * aspectRatio;
  // Sürüklerken kenarı bu kadar aşabilir (lastik efekti). Sınırlar bu pay kadar içeride tutulur;
  // esneme görselin ekran dışında kalan kenarından yapılır, siyah boşluk görünmez.
  const edgeX = Math.min(OVERSCROLL, (frameW - viewport.w) / 2);
  const edgeY = Math.min(OVERSCROLL, (frameH - viewport.h) / 2);
  const bounds = {
    minX: -(frameW - viewport.w) + edgeX,
    maxX: -edgeX,
    minY: -(frameH - viewport.h) + edgeY,
    maxY: -edgeY,
  };
  const [pan, setPan] = useState<{ x: number; y: number } | null>(null);
  // `stretch`: sürüklerken esnemeye izin verir. Esneme her eksende o eksende gizli kalan pay kadardır;
  // görsel bir eksende ekrana tam sığıyorsa (gizli pay 0) o eksende hiç esnemez, siyah boşluk açılmaz.
  const clampPan = useCallback(
    (p: { x: number; y: number }, stretch = false) => {
      const slackX = stretch ? edgeX : 0;
      const slackY = stretch ? edgeY : 0;
      return {
        x: Math.max(bounds.minX - slackX, Math.min(bounds.maxX + slackX, p.x)),
        y: Math.max(bounds.minY - slackY, Math.min(bounds.maxY + slackY, p.y)),
      };
    },
    [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, edgeX, edgeY]
  );
  // İlk açılışta ve ekran boyutu değişince sahne ortalanır
  // Açılışta yatayda ortalı, dikeyde biraz aşağı bakar: zemin ve masalar görünür
  const centered = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: bounds.maxY + (bounds.minY - bounds.maxY) * 0.45,
  };
  const currentPan = pan ?? centered;
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: number; lastX: number; lastY: number; lastT: number; vx: number; vy: number } | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<InteriorHotspot | null>(null);
  const [noteAddedFeedback, setNoteAddedFeedback] = useState<boolean>(false);

  // Görsel yüklendiğinde gerçek en-boy oranını güncelle (tüm harita ve gelecekteki mekanlar için evrensel uyum)
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // ─── AMBİYANS PARÇACIK MOTORU (Uçuşan Közler, Yağmur ve Toz) ───────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const isEmbers = locationData.particleType === 'embers';
    const isRain = locationData.particleType === 'rain';
    // Kar: yavaş düşen, sağa sola salınan yumuşak taneler (açık hava sahneleri)
    const isSnow = locationData.particleType === 'snow';
    const count = isRain ? 90 : isSnow ? 80 : isEmbers ? 45 : 35;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: isRain
        ? Math.random() * 12 + 10
        : isSnow
        ? Math.random() * 2 + 1.2
        : Math.random() * (isEmbers ? 2.8 : 2) + 0.8,
      speedY: isRain
        ? Math.random() * 6 + 9
        : isSnow
        ? Math.random() + 0.6
        : isEmbers
        ? -(Math.random() * 0.9 + 0.3)
        : Math.random() * 0.4 - 0.2,
      speedX: isRain ? -1.2 : isSnow ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + (isSnow ? Math.sin(p.pulse) * 0.3 : 0);
        p.pulse += 0.03;

        if (isEmbers && p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (!isEmbers) {
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const currentOpacity = Math.max(
          0.1,
          Math.min(0.85, p.opacity + Math.sin(p.pulse) * 0.25)
        );

        if (isRain) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size);
          ctx.strokeStyle = `rgba(170, 220, 255, ${currentOpacity * 0.35})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (isSnow) {
          ctx.fillStyle = `rgba(245, 250, 255, ${currentOpacity * 0.8})`;
          ctx.shadowBlur = 0;
        } else if (isEmbers) {
          ctx.fillStyle = `rgba(255, ${Math.floor(140 + Math.sin(p.pulse) * 40)}, 40, ${currentOpacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 120, 20, 0.6)';
        } else {
          ctx.fillStyle = `rgba(232, 220, 196, ${currentOpacity * 0.5})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [locationData]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setPan(null);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => () => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
  }, []);

  // Bırakınca hız azalarak kayar; sınırın dışına taşmışsa yaylanarak yumuşakça geri döner
  const startInertia = (from: { x: number; y: number }, vx: number, vy: number) => {
    let p = { ...from };
    let v = { x: vx, y: vy };
    const step = () => {
      v = { x: v.x * 0.92, y: v.y * 0.92 };
      p = clampPan({ x: p.x + v.x, y: p.y + v.y }, true);
      const target = clampPan(p);
      const outX = target.x - p.x;
      const outY = target.y - p.y;
      // Sınır dışındaki eksende hız sönümlenir ve görüntü her karede kalan mesafenin bir kısmı kadar içeri çekilir
      if (outX !== 0) v.x *= 0.5;
      if (outY !== 0) v.y *= 0.5;
      p = { x: p.x + outX * 0.18, y: p.y + outY * 0.18 };
      const settled = Math.hypot(v.x, v.y) < 0.3 && Math.hypot(outX, outY) < 0.5;
      if (settled) {
        setPan(target);
        inertiaRef.current = null;
        return;
      }
      setPan(p);
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeHotspot || e.button !== 0) return;
    // Üst ve alt çubuktaki buton, menü ve bağlantılar sürükleme başlatmaz
    if ((e.target as HTMLElement).closest('header, footer')) return;
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    const now = performance.now();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY, panX: currentPan.x, panY: currentPan.y,
      moved: 0, lastX: e.clientX, lastY: e.clientY, lastT: now, vx: 0, vy: 0,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.vx = ((e.clientX - d.lastX) / dt) * 16;
      d.vy = ((e.clientY - d.lastY) / dt) * 16;
      d.moved += Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      setPan(clampPan({ x: d.panX + e.clientX - d.startX, y: d.panY + e.clientY - d.startY }, true));
    };
    const handleUp = () => {
      const d = dragRef.current;
      setIsDragging(false);
      if (!d) return;
      const from = { x: d.panX + d.lastX - d.startX, y: d.panY + d.lastY - d.startY };
      startInertia(clampPan(from, true), d.vx, d.vy);
      // Tıklama olayı bu kareden sonra geldiği için sürükleme bilgisi bir an korunur
      setTimeout(() => {
        dragRef.current = null;
      }, 0);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
    // startInertia her render'da yeniden oluşur; sürükleme boyunca son hâli yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, clampPan]);

  // Sürüklemenin sonunda bir noktanın üstünde bırakılırsa inceleme penceresi açılmaz
  const handleHotspotsClickCapture = (e: React.MouseEvent) => {
    if ((dragRef.current?.moved ?? 0) > 6) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Ok tuşlarıyla etrafa bakma
  useEffect(() => {
    const handleArrows = (e: KeyboardEvent) => {
      if (activeHotspot) return;
      const step = 80;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const d = delta[e.key];
      if (!d) return;
      e.preventDefault();
      setPan((prev) => clampPan({ x: (prev ?? centered).x + d[0], y: (prev ?? centered).y + d[1] }));
    };
    window.addEventListener('keydown', handleArrows);
    return () => window.removeEventListener('keydown', handleArrows);
  });

  // ESC tuşu ile açık inceleme modalini kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveHotspot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // İnceleme noktasına tıklama
  const handleHotspotClick = (hotspot: InteriorHotspot) => {
    setActiveHotspot(hotspot);
    setNoteAddedFeedback(false);
  };

  // İnceleme notunu deftere ekleme
  const handleAddClueToNotebook = async (snippet: string) => {
    const updatedNotes = notes ? `${notes}\n[${locationData.name} İpucu] ${snippet}` : `[${locationData.name} İpucu] ${snippet}`;
    setNotes(updatedNotes);
    setNoteAddedFeedback(true);

    if (sessionId) {
      try {
        await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes: updatedNotes }),
        });
      } catch (err) {
        console.error('Failed to sync note', err);
      }
    }
  };

  return (
    <div
      className={`${styles.viewportContainer} ${isDragging ? styles.dragging : ''}`}
      onPointerDown={handlePointerDown}
    >
      {/* ─── ARKA PLAN AMBİYANS IŞIĞI (SİYAH BOŞLUKLARI DOĞAL DOLDURUR) ─── */}
      <div
        className={styles.ambientBackdrop}
        style={{ backgroundImage: `url(${locationData.backgroundImage})` }}
      />

      {/* ─── MEKÂN SAHNESİ: EKRANI DOLDURUR, TAŞAN KISIM SÜRÜKLENEREK GEZİLİR ─── */}
      <div className={styles.sceneWrapper}>
        <div
          className={styles.sceneFrame}
          style={{
            width: `${frameW}px`,
            height: `${frameH}px`,
            transform: `translate3d(${currentPan.x}px, ${currentPan.y}px, 0)`,
          }}
        >
          <img
            src={locationData.backgroundImage}
            alt={locationData.name}
            className={styles.sceneImage}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* ─── ETKİLEŞİMLİ NOKTALAR KATMANI (GÖRSELE TAM HİZALANIR) ─── */}
          <div className={styles.hotspotsLayer} onClickCapture={handleHotspotsClickCapture}>
            {locationData.hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                className={styles.hotspotPin}
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                }}
                onClick={() => handleHotspotClick(hotspot)}
                title={hotspot.title}
              >
                <div className={styles.pinBeacon}>
                  <span>{hotspot.icon}</span>
                </div>
                <div className={styles.pinLabel}>
                  <span>{hotspot.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ATMOSFERİK IŞIK VE PARÇACIKLAR ─── */}
      <div className={styles.vignetteOverlay} />
      <div
        className={
          locationData.lightingTone === 'neon' ? styles.neonFlickerOverlay : styles.torchFlickerOverlay
        }
      />
      <canvas ref={canvasRef} className={styles.dustCanvas} />

      {/* ─── ÜST BAŞLIK & NAVİGASYON ─── */}
      <header className={styles.topHud}>
        <div className={styles.hudGroup}>
          <Link href="/map" className={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Haritaya Dön
          </Link>

          <select
            className={styles.locationDropdown}
            value={locationId}
            onChange={(e) => router.push(`/interior/${e.target.value}`)}
          >
            {scenarioInteriors.map((interior) => (
              <option key={interior.id} value={interior.id}>
                {interior.menuLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Mekân Başlık ve Açıklaması */}
        <div className={styles.locationHeader}>
          <h1 className={styles.locationTitle}>{locationData.name}</h1>
          <p className={styles.locationSubtitle}>{locationData.subtitle}</p>
        </div>

        <div className={styles.hudGroup}>
          {locationData.npcId && (
            <Link href={`/interact/${locationData.npcId}`} className={styles.actionBtn}>
              <span>🗣️</span>
              {locationData.npcName} ile Sorgu
            </Link>
          )}
        </div>
      </header>

      {/* ─── ALT BİLGİ VE İPUCU ÇUBUĞU ─── */}
      <footer className={styles.bottomHud}>
        <div className={styles.sceneBadge}>
          <span className={styles.badgeDot} />
          <span>Mekân Keşfi • Sürükleyerek etrafa bak, incelemek istediğin noktaya tıkla</span>
        </div>

        <div className={styles.hotspotsCount}>
          <span>📍 {locationData.hotspots.length} İnceleme Noktası</span>
        </div>
      </footer>

      {/* ─── İNCELEME DOSYASI (MODAL) ─── */}
      {activeHotspot && (
        <div
          className={styles.inspectionModalOverlay}
          onClick={() => setActiveHotspot(null)}
        >
          <div
            className={styles.inspectionCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrapper}>
                <div className={styles.cardIcon}>{activeHotspot.icon}</div>
                <div>
                  <div className={styles.cardCategory}>
                    {activeHotspot.category === 'npc'
                      ? 'Şüpheli ya da Tanık'
                      : isSearchSpot(activeHotspot)
                      ? 'Aranabilecek Yer'
                      : activeHotspot.category === 'clue'
                      ? 'Gizli İpucu ve Kanıt'
                      : activeHotspot.category === 'passage'
                      ? 'Geçit ve Merdiven'
                      : 'Mekân Gözlemi'}
                  </div>
                  <h3 className={styles.cardTitle}>{activeHotspot.title}</h3>
                </div>
              </div>

              <button
                className={styles.closeBtn}
                onClick={() => setActiveHotspot(null)}
                title="Kapat"
              >
                ✕
              </button>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.cardDescription}>{activeHotspot.description}</p>

              {activeHotspot.clueSnippet && (
                <div className={styles.clueBox}>
                  <div className={styles.clueTitle}>Mühürlü İnceleme Notu:</div>
                  <div className={styles.clueText}>&ldquo;{activeHotspot.clueSnippet}&rdquo;</div>
                </div>
              )}

              {isSearchSpot(activeHotspot) && (
                <div className={styles.clueBox}>
                  <div className={styles.clueTitle}>{hasWarrant ? 'Arama iznin var' : 'Arama iznin yok'}</div>
                  <div className={styles.clueText}>
                    {hasWarrant
                      ? 'Bu mekânı araştırabilirsin. Neyi, nerede aradığını anlat; bulduğun kanıt Envanter’ine düşer.'
                      : 'Burayı araştırmak için önce bu mekân için arama izni almalısın.'}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.cardFooter}>
              {activeHotspot.clueSnippet && (
                <button
                  className={styles.noteBtn}
                  onClick={() => handleAddClueToNotebook(activeHotspot.clueSnippet!)}
                  disabled={noteAddedFeedback}
                >
                  {noteAddedFeedback ? '✓ Notlara Eklendi' : '📝 Deftere Not Al'}
                </button>
              )}

              {activeHotspot.actionHref && (!isSearchSpot(activeHotspot) || hasWarrant) && (
                <Link
                  href={
                    isSearchSpot(activeHotspot)
                      ? `${activeHotspot.actionHref}?ara=1`
                      : activeHotspot.actionHref
                  }
                  className={styles.actionBtn}
                >
                  {activeHotspot.actionText || 'İlerle'} →
                </Link>
              )}

              <button
                className={styles.noteBtn}
                onClick={() => setActiveHotspot(null)}
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
