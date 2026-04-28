'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import styles from './map.module.scss';

const locations = [
  {
    id: 'tavern',
    name: 'The Tavern',
    subtitle: 'Where secrets are drowned in wine.',
    icon: '🍺',
    description:
      'Locals gather here at dusk. Loosened tongues and shadowed corners — the perfect hunting ground for contradictions.',
    available: true,
  },
  {
    id: 'church',
    name: 'The Church',
    subtitle: 'God watches, but so do you.',
    icon: '⛪',
    description:
      "The priest holds the village's conscience. But who confesses to the Inquisitor?",
    available: true,
  },
  {
    id: 'graveyard',
    name: 'The Graveyard',
    subtitle: 'The dead do not lie. The living do.',
    icon: '🪦',
    description:
      'Strange rites were reported at midnight. The gravedigger knows what he buried — and what walked away.',
    available: true,
  },
  {
    id: 'mill',
    name: 'The Mill',
    subtitle: 'Industry masks iniquity.',
    icon: '⚙️',
    description:
      'The miller deals in grain — and rumour. Follow the flour, follow the conspiracy.',
    available: false,
  },
];

export default function MapPage() {
  const { currentDay, dialoguesUsedToday, maxDailyDialogues, sessionId, endDay } = useGameStore();
  const [endingDay, setEndingDay] = useState(false);

  const handleEndDay = async () => {
    if (!sessionId) return;
    setEndingDay(true);
    try {
      await fetch(`http://localhost:3001/game-sessions/${sessionId}/end-day`, {
        method: 'POST',
      });
      endDay(); // Zustand state'i güncelle
    } catch (err) {
      console.error('Failed to end day', err);
    } finally {
      setEndingDay(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.vignette} />

      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retreat
        </Link>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Village of Ashenmoor</h1>
          <p className={styles.pageSub}>Choose your location — Choose your prey.</p>
        </div>
        <div className={styles.sessionInfo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div>
            <span className={styles.sessionDot} />
            <span>Day {currentDay}</span>
            <span style={{ marginLeft: '12px', opacity: 0.7 }}>
              Dialogues: {maxDailyDialogues - dialoguesUsedToday}/{maxDailyDialogues}
            </span>
          </div>
          <button 
            onClick={handleEndDay} 
            disabled={endingDay}
            style={{
              background: 'transparent',
              border: '1px solid #8A0303',
              color: '#8A0303',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              letterSpacing: '1px'
            }}
          >
            {endingDay ? 'Resting...' : 'End Day'}
          </button>
        </div>
      </header>

      {/* Map grid */}
      <div className={styles.mapWrapper}>
        <div className={styles.mapDecor}>
          <div className={styles.mapDecorLine} />
          <div className={styles.mapDecorText}>ANNO DOMINI MCCXII</div>
          <div className={styles.mapDecorLine} />
        </div>

        <div className={styles.locations}>
          {locations.map((loc) => {
            // Tüm kart tek bir Link — available ise navigate eder
            const CardWrapper = loc.available
              ? ({ children }: { children: React.ReactNode }) => (
                  <Link href={`/interact/${loc.id}`} className={`${styles.locationCard}`}>
                    {children}
                  </Link>
                )
              : ({ children }: { children: React.ReactNode }) => (
                  <div className={`${styles.locationCard} ${styles.locked}`}>
                    {children}
                  </div>
                );

            return (
              <CardWrapper key={loc.id}>
                <div className={styles.locIcon}>{loc.icon}</div>
                <div className={styles.locContent}>
                  <h2 className={styles.locName}>{loc.name}</h2>
                  <p className={styles.locSubtitle}>{loc.subtitle}</p>
                  <p className={styles.locDesc}>{loc.description}</p>
                </div>
                <div className={styles.locFooter}>
                  {loc.available ? (
                    <span className={styles.enterBtn}>
                      Enter &amp; Interrogate
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  ) : (
                    <span className={styles.comingSoon}>Coming Soon</span>
                  )}
                </div>
                {/* Corner accents */}
                <div className={styles.cardCornerTL} />
                <div className={styles.cardCornerBR} />
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </main>
  );
}
