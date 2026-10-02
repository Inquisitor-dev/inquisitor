'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INTERIOR_LOCATIONS, InteriorHotspot } from '@/config/interiorConfig';
import { useGameStore } from '@/store/useGameStore';
import { apiUrl } from '@/config/api';
import styles from './InteriorViewer.module.scss';

interface InteriorViewerProps {
  locationId: string;
}

export default function InteriorViewer({ locationId }: InteriorViewerProps) {
  const router = useRouter();
  const locationData = INTERIOR_LOCATIONS[locationId] || INTERIOR_LOCATIONS.tavern;
  const { sessionId, authToken, notes, setNotes } = useGameStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom State
  const [panX, setPanX] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeHotspot, setActiveHotspot] = useState<InteriorHotspot | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [noteAddedFeedback, setNoteAddedFeedback] = useState<boolean>(false);
  const [compassHeading, setCompassHeading] = useState<number>(180);

  // Drag physics tracking refs
  const isDraggingRef = useRef<boolean>(false);
  const startMouseXRef = useRef<number>(0);
  const startPanXRef = useRef<number>(0);
  const lastMouseXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const totalDragDistanceRef = useRef<number>(0);

  // Bounds for panning
  const getPanBounds = useCallback(() => {
    if (!containerRef.current || !stageRef.current) {
      return { min: -1000, max: 0 };
    }
    const containerW = containerRef.current.clientWidth;
    const stageW = stageRef.current.clientWidth * zoom;
    const maxDelta = Math.max(0, stageW - containerW);
    return {
      min: -maxDelta,
      max: 0,
    };
  }, [zoom]);

  // Center view on mount
  useEffect(() => {
    if (!containerRef.current || !stageRef.current) return;
    const bounds = getPanBounds();
    const initialCenter = bounds.min / 2 + (locationData.initialPan || 0) * 10;
    setPanX(Math.max(bounds.min, Math.min(bounds.max, initialCenter)));
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
    const count = isEmbers ? 45 : 35;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (isEmbers ? 2.8 : 2) + 0.8,
      speedY: isEmbers ? -(Math.random() * 0.9 + 0.3) : Math.random() * 0.4 - 0.2,
      speedX: (Math.random() - 0.5) * 0.6,
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

  // ─── INERTIA DECAY LOOP ────────────────────────────────────────────────
  const startInertia = useCallback(() => {
    const decay = () => {
      if (Math.abs(velocityRef.current) > 0.15) {
        velocityRef.current *= 0.92;
        setPanX((prev) => {
          const bounds = getPanBounds();
          const next = prev + velocityRef.current;
          if (next > bounds.max || next < bounds.min) {
            velocityRef.current *= 0.5; // Boundary bounce absorption
            return Math.max(bounds.min, Math.min(bounds.max, next));
          }
          return next;
        });
        animationFrameRef.current = requestAnimationFrame(decay);
      } else {
        velocityRef.current = 0;
      }
    };
    animationFrameRef.current = requestAnimationFrame(decay);
  }, [getPanBounds]);

  // Update Compass Heading based on panX
  useEffect(() => {
    const bounds = getPanBounds();
    const range = Math.abs(bounds.min - bounds.max) || 1;
    const progress = Math.abs(panX - bounds.max) / range;
    // Map to 90° (Doğu) -> 180° (Güney) -> 270° (Batı)
    const deg = Math.round(90 + progress * 180);
    setCompassHeading(deg);
  }, [panX, getPanBounds]);

  // ─── MOUSE DRAG LISTENERS ──────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeHotspot) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    isDraggingRef.current = true;
    startMouseXRef.current = e.clientX;
    startPanXRef.current = panX;
    lastMouseXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    totalDragDistanceRef.current = 0;
    setHasInteracted(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startMouseXRef.current;
    totalDragDistanceRef.current += Math.abs(e.clientX - lastMouseXRef.current);

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const instantaneousVel = ((e.clientX - lastMouseXRef.current) / dt) * 16;
    velocityRef.current = instantaneousVel;

    lastMouseXRef.current = e.clientX;
    lastTimeRef.current = now;

    const bounds = getPanBounds();
    const target = startPanXRef.current + deltaX;

    // Soft elastic resistance outside bounds
    if (target > bounds.max) {
      setPanX(bounds.max + (target - bounds.max) * 0.25);
    } else if (target < bounds.min) {
      setPanX(bounds.min + (target - bounds.min) * 0.25);
    } else {
      setPanX(target);
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startInertia();
  };

  // ─── TOUCH CONTROLS (MOBILE & TABLET) ──────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeHotspot || e.touches.length === 0) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const touch = e.touches[0];
    isDraggingRef.current = true;
    startMouseXRef.current = touch.clientX;
    startPanXRef.current = panX;
    lastMouseXRef.current = touch.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    totalDragDistanceRef.current = 0;
    setHasInteracted(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];

    const deltaX = touch.clientX - startMouseXRef.current;
    totalDragDistanceRef.current += Math.abs(touch.clientX - lastMouseXRef.current);

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    velocityRef.current = ((touch.clientX - lastMouseXRef.current) / dt) * 16;

    lastMouseXRef.current = touch.clientX;
    lastTimeRef.current = now;

    const bounds = getPanBounds();
    const target = startPanXRef.current + deltaX;
    setPanX(Math.max(bounds.min - 40, Math.min(bounds.max + 40, target)));
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startInertia();
  };

  // ─── MOUSE WHEEL ZOOM ──────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    if (activeHotspot) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => Math.max(1.0, Math.min(1.35, Number((prev + zoomDelta).toFixed(2)))));
  };

  // ─── KEYBOARD NAVIGATION (A/D or Arrows) ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeHotspot) return;
      const step = 80;
      const bounds = getPanBounds();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPanX((prev) => Math.min(bounds.max, prev + step));
        setHasInteracted(true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPanX((prev) => Math.max(bounds.min, prev - step));
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
    // Drag threshold to prevent opening when panning
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
      onWheel={handleWheel}
    >
      {/* ─── PANORAMIC STAGE ─── */}
      <div
        ref={stageRef}
        className={styles.panoramaStage}
        style={{
          transform: `translate3d(${panX}px, 0, 0) scale(${zoom})`,
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
      <div className={styles.torchFlickerOverlay} />
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
            <option value="tavern">🍺 Taverna (Kardeş Aldric)</option>
            <option value="church">⛪ Kilise (Peder Malachar)</option>
            <option value="mill">⚙️ Değirmen (Giles)</option>
            <option value="graveyard">🪦 Mezarlık (İhtiyar Silas)</option>
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
            onClick={() => setZoom((z) => Math.min(1.35, z + 0.1))}
            title="Yakınlaştır (Zoom In)"
          >
            🔍+
          </button>
          <button
            className={styles.hudIconBtn}
            onClick={() => setZoom((z) => Math.max(1.0, z - 0.1))}
            title="Uzaklaştır (Zoom Out)"
          >
            🔍-
          </button>
          <button
            className={styles.hudIconBtn}
            onClick={() => {
              setZoom(1.0);
              const bounds = getPanBounds();
              setPanX(bounds.min / 2);
            }}
            title="Açıyı Sıfırla"
          >
            ↺
          </button>
        </div>

        {!hasInteracted && (
          <div className={styles.dragHint}>
            <span className={styles.handIcon}>👈👉</span>
            <span>Etrafı incelemek için basılı tutup sağa/sola sürükleyin</span>
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
                      ? 'Şüpheli / Tanığı İnceleme'
                      : activeHotspot.category === 'clue'
                      ? 'Gizli İpucu & Kanıt'
                      : activeHotspot.category === 'passage'
                      ? 'Geçit & Merdiven'
                      : 'Mekan Gözlemi'}
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

              {activeHotspot.actionHref && (
                <Link
                  href={activeHotspot.actionHref}
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
