'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import styles from './map.module.scss';

const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];

// Geçici koordinatlar (Kullanıcı yönlendirmesiyle düzeltilecek)
const locations = [
  {
    id: 'church',
    name: 'Kilise',
    icon: '⛪',
    top: '15%',
    left: '40%',
    width: '15%',
    height: '25%',
    available: true,
  },
  {
    id: 'mill',
    name: 'Değirmen',
    icon: '⚙️',
    top: '30%',
    left: '15%',
    width: '12%',
    height: '20%',
    available: true,
  },
  {
    id: 'tavern',
    name: 'Taverna',
    icon: '🍺',
    top: '55%',
    left: '25%',
    width: '18%',
    height: '20%',
    available: true,
  },
  {
    id: 'graveyard',
    name: 'Mezarlık',
    icon: '🪦',
    top: '40%',
    left: '65%',
    width: '20%',
    height: '25%',
    available: true,
  },
  {
    id: 'crime_scene',
    name: 'Cinayet Mahalli',
    icon: '🩸',
    top: '75%',
    left: '45%',
    width: '15%',
    height: '15%',
    available: true,
  },
];

export default function MapPage() {
  const router = useRouter();
  const { sessionId, currentDay, timeOfDay, dialoguesUsedToday, authToken, isAdmin, reset, endDay, advanceTime, setWarrant } = useGameStore();
  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);
  const [endingDay, setEndingDay] = useState(false);

  useEffect(() => {
    if (!authToken) router.push('/login');

    const fetchSession = async () => {
      if (sessionId) {
        try {
          const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const data = await res.json();
          setWarrant(data.issuedWarrant, data.isWarrantUsed);
        } catch(e) {}
      }
    };
    fetchSession();
  }, [authToken, router, sessionId, setWarrant]);

  const handleRetreat = () => {
    reset();
    router.push('/');
  };

  const handleEndDay = async () => {
    if (!sessionId) return;
    
    if (currentDay >= 3) {
      setEndingDay(true);
      try {
        const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}/timeout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.session && data.session.truthReveal) {
          useGameStore.getState().setTruthReveal(data.session.truthReveal);
        }
        if (data.session && data.session.locationClues) {
          useGameStore.getState().setLocationClues(data.session.locationClues);
        }
        router.push('/result?won=false&reason=timeout');
      } catch (err) {
        console.error('Failed to handle timeout', err);
      } finally {
        setEndingDay(false);
      }
      return;
    }

    setEndingDay(true);
    try {
      await fetch(`http://localhost:3001/game-sessions/${sessionId}/end-day`, {
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
      await fetch(`http://localhost:3001/game-sessions/${sessionId}/advance-time`, {
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

  const isNight = timeOfDay >= 4;

  return (
    <main className={styles.main}>
      <div className={`${styles.vignette} ${isNight ? styles.nightVignette : ''}`} />

      {/* Header overlay */}
      <header className={styles.header}>
        <button onClick={handleRetreat} className={styles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Geri Çekil
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Ashenmoor Köyü</h1>
          <p className={styles.pageSub}>Mekanını seç — Avını seç.</p>
        </div>
        <div className={styles.sessionInfo}>
          <div className={styles.stats}>
            <span className={styles.sessionDot} />
            <span>{currentDay}. Gün - {TIME_LABELS[timeOfDay]}</span>
            <span className={styles.limitText}>
              Limit: {isAdmin ? 'Sınırsız' : `${30 - dialoguesUsedToday}/30`}
            </span>
          </div>
          <button 
            onClick={handleEndDay} 
            disabled={endingDay}
            className={styles.endDayBtn}
          >
            {endingDay ? 'Dinleniliyor...' : 'Günü Bitir'}
          </button>
        </div>
      </header>

      {/* Interactive Map */}
      <div className={`${styles.mapContainer} ${isNight ? styles.nightMap : ''}`}>
        {locations.map((loc) => {
          const isCrimeSceneLocked = loc.id === 'crime_scene' && currentDay !== 1;
          const isAvailable = loc.available && !isCrimeSceneLocked && !isNight;

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
              onClick={() => isAvailable && handleLocationClick(loc.id)}
            >
              <div className={styles.label}>
                <span className={styles.icon}>{loc.icon}</span>
                {loadingLoc === loc.id ? 'Gidiliyor...' : loc.name}
                {!isAvailable && (
                  <span className={styles.lockedText}>
                    ({isNight ? 'Gece' : 'Kapalı'})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
