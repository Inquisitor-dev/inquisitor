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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 2D Pan State. Yakınlaştırma yok: görsel kenarlarında siyah boşluk açıyordu
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [activeHotspot, setActiveHotspot] = useState<InteriorHotspot | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [noteAddedFeedback, setNoteAddedFeedback] = useState<boolean>(false);
  const [compassHeading, setCompassHeading] = useState<number>(180);

  // Drag physics tracking refs
  const isDraggingRef = useRef<boolean>(false);
  const startMouseXRef = useRef<number>(0);
  const startMouseYRef = useRef<number>(0);
  const startPanXRef = useRef<number>(0);
  const startPanYRef = useRef<number>(0);
  const lastMouseXRef = useRef<number>(0);
  const lastMouseYRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityXRef = useRef<number>(0);
  const velocityYRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const totalDragDistanceRef = useRef<number>(0);

  // Compute 2D Bounds for panning
  const getPanBounds = useCallback(() => {
    if (!containerRef.current || !stageRef.current) {
      return { minX: -1000, maxX: 0, minY: -300, maxY: 0 };
    }
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const stageW = stageRef.current.clientWidth;
    const stageH = stageRef.current.clientHeight;

    const maxDeltaX = Math.max(0, stageW - containerW);
    const maxDeltaY = Math.max(0, stageH - containerH);

    return {
      minX: -maxDeltaX,
      maxX: 0,
      minY: -maxDeltaY,
      maxY: 0,
    };
  }, []);

  // Center & frame view comfortably on mount
  useEffect(() => {
    if (!containerRef.current || !stageRef.current) return;
    const bounds = getPanBounds();
    const initialCenterX = bounds.minX / 2 + (locationData.initialPan || 0) * 10;
    // Initial Y: frame slightly towards the bottom so the floor and tables are naturally visible!
    const initialY = bounds.minY * 0.45;

    setPanX(Math.max(bounds.minX, Math.min(bounds.maxX, initialCenterX)));
    setPanY(Math.max(bounds.minY, Math.min(bounds.maxY, initialY)));
  }, [locationData, getPanBounds]);

  // ─── AMBIENT PARTICLE ENGINE (Floating Embers & Dust) ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const isEmbers = locationData.particleType === 'embers';
    // Yağmur: neon ışığında parlayan ince, eğik damlalar
    const isRain = locationData.particleType === 'rain';
    const count = isRain ? 90 : isEmbers ? 45 : 35;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: isRain ? Math.random() * 12 + 10 : Math.random() * (isEmbers ? 2.8 : 2) + 0.8,
      speedY: isRain
        ? Math.random() * 6 + 9
        : isEmbers
        ? -(Math.random() * 0.9 + 0.3)
        : Math.random() * 0.4 - 0.2,
      speedX: isRain ? -1.2 : (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
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
        if (isEmbers) {
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

  // ─── 2D INERTIA DECAY LOOP ─────────────────────────────────────────────
  const startInertia = useCallback(() => {
    const decay = () => {
      const vx = velocityXRef.current;
      const vy = velocityYRef.current;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (speed > 0.15) {
        velocityXRef.current *= 0.91;
        velocityYRef.current *= 0.91;

        const bounds = getPanBounds();

        setPanX((prev) => {
          const next = prev + velocityXRef.current;
          if (next > bounds.maxX || next < bounds.minX) {
            velocityXRef.current *= 0.4;
            return Math.max(bounds.minX, Math.min(bounds.maxX, next));
          }
          return next;
        });

        setPanY((prev) => {
          const next = prev + velocityYRef.current;
          if (next > bounds.maxY || next < bounds.minY) {
            velocityYRef.current *= 0.4;
            return Math.max(bounds.minY, Math.min(bounds.maxY, next));
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(decay);
      } else {
        velocityXRef.current = 0;
        velocityYRef.current = 0;
      }
    };
    animationFrameRef.current = requestAnimationFrame(decay);
  }, [getPanBounds]);

  // Update Compass Heading based on panX
  useEffect(() => {
    const bounds = getPanBounds();
    const range = Math.abs(bounds.minX - bounds.maxX) || 1;
    const progress = Math.abs(panX - bounds.maxX) / range;
    const deg = Math.round(90 + progress * 180);
    setCompassHeading(deg);
  }, [panX, getPanBounds]);

  // ─── MOUSE DRAG LISTENERS (2D LOOK AROUND) ──────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeHotspot) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    isDraggingRef.current = true;
    startMouseXRef.current = e.clientX;
    startMouseYRef.current = e.clientY;
    startPanXRef.current = panX;
    startPanYRef.current = panY;
    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    totalDragDistanceRef.current = 0;
    setHasInteracted(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startMouseXRef.current;
    const deltaY = e.clientY - startMouseYRef.current;
    totalDragDistanceRef.current += Math.hypot(
      e.clientX - lastMouseXRef.current,
      e.clientY - lastMouseYRef.current
    );

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    velocityXRef.current = ((e.clientX - lastMouseXRef.current) / dt) * 16;
    velocityYRef.current = ((e.clientY - lastMouseYRef.current) / dt) * 16;

    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
    lastTimeRef.current = now;

    const bounds = getPanBounds();
    const targetX = startPanXRef.current + deltaX;
    const targetY = startPanYRef.current + deltaY;

    // Apply with boundary clamping & subtle elastic resistance
    setPanX(Math.max(bounds.minX - 40, Math.min(bounds.maxX + 40, targetX)));
    setPanY(Math.max(bounds.minY - 30, Math.min(bounds.maxY + 30, targetY)));
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startInertia();
  };

  // ─── TOUCH CONTROLS (2D MOBILE & TABLET) ────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeHotspot || e.touches.length === 0) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const touch = e.touches[0];
    isDraggingRef.current = true;
    startMouseXRef.current = touch.clientX;
    startMouseYRef.current = touch.clientY;
    startPanXRef.current = panX;
    startPanYRef.current = panY;
    lastMouseXRef.current = touch.clientX;
    lastMouseYRef.current = touch.clientY;
    lastTimeRef.current = performance.now();
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    totalDragDistanceRef.current = 0;
    setHasInteracted(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];

    const deltaX = touch.clientX - startMouseXRef.current;
    const deltaY = touch.clientY - startMouseYRef.current;
    totalDragDistanceRef.current += Math.hypot(
      touch.clientX - lastMouseXRef.current,
      touch.clientY - lastMouseYRef.current
    );

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    velocityXRef.current = ((touch.clientX - lastMouseXRef.current) / dt) * 16;
    velocityYRef.current = ((touch.clientY - lastMouseYRef.current) / dt) * 16;

    lastMouseXRef.current = touch.clientX;
    lastMouseYRef.current = touch.clientY;
    lastTimeRef.current = now;

    const bounds = getPanBounds();
    const targetX = startPanXRef.current + deltaX;
    const targetY = startPanYRef.current + deltaY;

    setPanX(Math.max(bounds.minX - 40, Math.min(bounds.maxX + 40, targetX)));
    setPanY(Math.max(bounds.minY - 30, Math.min(bounds.maxY + 30, targetY)));
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startInertia();
  };

  // ─── KEYBOARD NAVIGATION (WASD & Arrows) ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeHotspot) return;
      const step = 70;
      const bounds = getPanBounds();

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPanX((prev) => Math.min(bounds.maxX, prev + step));
        setHasInteracted(true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPanX((prev) => Math.max(bounds.minX, prev - step));
        setHasInteracted(true);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setPanY((prev) => Math.min(bounds.maxY, prev + step));
        setHasInteracted(true);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setPanY((prev) => Math.max(bounds.minY, prev - step));
        setHasInteracted(true);
      } else if (e.key === 'Escape') {
        setActiveHotspot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHotspot, getPanBounds]);

  // ─── HOTSPOT CLICK ─────────────────────────────────────────────────────
  const handleHotspotClick = (e: React.MouseEvent, hotspot: InteriorHotspot) => {
    e.stopPropagation();
    if (totalDragDistanceRef.current > 8) return;
    setActiveHotspot(hotspot);
    setNoteAddedFeedback(false);
  };

  // Add finding to Notebook
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

  const getCompassDirection = (deg: number) => {
    if (deg >= 70 && deg <= 110) return 'Doğu (E)';
    if (deg > 110 && deg < 160) return 'Güneydoğu (SE)';
    if (deg >= 160 && deg <= 200) return 'Güney (S)';
    if (deg > 200 && deg < 250) return 'Güneybatı (SW)';
    if (deg >= 250 && deg <= 290) return 'Batı (W)';
    return `${deg}°`;
  };

  return (
    <div
      ref={containerRef}
      className={styles.viewportContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── PANORAMIC STAGE (2D TRANSLATE + SCALE) ─── */}
      <div
        ref={stageRef}
        className={styles.panoramaStage}
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0)`,
        }}
      >
        <img
          src={locationData.backgroundImage}
          alt={locationData.name}
          className={styles.panoramaImage}
          draggable={false}
        />

        {/* ─── HOTSPOT PINS LAYER ─── */}
        <div className={styles.hotspotsLayer}>
          {locationData.hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className={styles.hotspotPin}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
              }}
              onClick={(e) => handleHotspotClick(e, hotspot)}
              title={hotspot.title}
            >
              <div className={styles.pinBeacon}>
                <span>{hotspot.icon}</span>
              </div>
              <div className={styles.pinLabel}>
                <span>{hotspot.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ATMOSPHERIC OVERLAYS ─── */}
      <div className={styles.vignetteOverlay} />
      <div
        className={
          locationData.lightingTone === 'neon' ? styles.neonFlickerOverlay : styles.torchFlickerOverlay
        }
      />
      <canvas ref={canvasRef} className={styles.dustCanvas} />

      {/* ─── TOP HUD ─── */}
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

        {/* Compass Ribbon & Title */}
        <div className={styles.compassRibbon}>
          <div className={styles.locationTitle}>{locationData.name}</div>
          <div className={styles.locationSubtitle}>{locationData.subtitle}</div>
          <div className={styles.compassGauge}>
            <span>🧭</span>
            <span>Açı: <strong className={styles.activeDegree}>{compassHeading}°</strong></span>
            <span>({getCompassDirection(compassHeading)})</span>
          </div>
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

      {/* ─── BOTTOM CONTROLS & HINT ─── */}
      <footer className={styles.bottomHud}>
        <div className={styles.zoomControls}>
          <button
            className={styles.hudIconBtn}
            onClick={() => {
              const bounds = getPanBounds();
              setPanX(bounds.minX / 2);
              setPanY(bounds.minY * 0.45);
            }}
            title="Açıyı Sıfırla"
          >
            ↺
          </button>
        </div>

        {!hasInteracted && (
          <div className={styles.dragHint}>
            <span className={styles.handIcon}>👈👉👆👇</span>
            <span>Etrafa bakmak için basılı tutup sürükle</span>
          </div>
        )}

        <div style={{ width: '80px' }} />
      </footer>

      {/* ─── INSPECTION DOSSIER (MODAL) ─── */}
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
