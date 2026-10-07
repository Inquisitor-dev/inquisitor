'use client';

import React, { useState, useRef, useEffect } from 'react';
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

// Bilinen başlangıç en-boy oranı (ilk render anında layout shift'i engeller)
function getKnownAspectRatio(url: string): number {
  if (url.includes('cyberpunk')) return 3168 / 1344;
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

  // Sabit ve tam görüntü: hiçbir şekilde zoom yapılmaz, en-boy oranı korunarak ekrana sığdırılır
  const [aspectRatio, setAspectRatio] = useState<number>(() =>
    getKnownAspectRatio(locationData.backgroundImage)
  );
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
    <div className={styles.viewportContainer}>
      {/* ─── ARKA PLAN AMBİYANS IŞIĞI (SİYAH BOŞLUKLARI DOĞAL DOLDURUR) ─── */}
      <div
        className={styles.ambientBackdrop}
        style={{ backgroundImage: `url(${locationData.backgroundImage})` }}
      />

      {/* ─── EVRENSEL SABİT MEKÂN SAHNESİ (ZOOMSUZ, KAYMASIZ, TAM GÖRÜNTÜ) ─── */}
      <div className={styles.sceneWrapper}>
        <div
          className={styles.sceneFrame}
          style={
            {
              '--scene-aspect-ratio': aspectRatio,
              aspectRatio: `${aspectRatio}`,
            } as React.CSSProperties
          }
        >
          <img
            src={locationData.backgroundImage}
            alt={locationData.name}
            className={styles.sceneImage}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* ─── ETKİLEŞİMLİ NOKTALAR KATMANI (GÖRSELE TAM HİZALANIR) ─── */}
          <div className={styles.hotspotsLayer}>
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
          <span>Mekân Keşfi • İncelemek istediğin noktaya tıkla</span>
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
