'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import styles from './map.module.scss';

const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];

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
  }
];

export default function MapPage() {
  const router = useRouter();
  const { sessionId, currentDay, timeOfDay, dialoguesUsedToday, authToken, isAdmin, reset, endDay, advanceTime, setWarrant, notes, setNotes, inventory } = useGameStore();
  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);
  const [endingDay, setEndingDay] = useState(false);
  
  // Modal states
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

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
      <div className={`${styles.mapContainer} ${isNight ? styles.nightMap : ''}`}>
        {locations.map((loc) => {
          const isAvailable = loc.available && !isNight;

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
                {loadingLoc === loc.id ? 'Gidiliyor...' : `${loc.name}'e Git`}
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

      {/* Action Bar (Bant) */}
      <footer className={styles.actionBar}>
        <div className={styles.actionGroup}>
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

        <div className={styles.actionGroup}>
          {currentDay === 1 && !isNight && (
            <button 
              onClick={() => handleLocationClick('crime_scene')}
              className={styles.crimeSceneBarBtn}
            >
              <span className={styles.icon}>🩸</span>
              {loadingLoc === 'crime_scene' ? 'Gidiliyor...' : 'Cinayet Mahalli'}
            </button>
          )}
          
          <button 
            onClick={handleEndDay} 
            disabled={endingDay}
            className={styles.endDayBtn}
          >
            {endingDay ? 'Dinleniliyor...' : 'Günü Bitir'}
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
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
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
              {inventory.warrant ? (
                <div className={styles.inventoryItem}>
                  <span className={styles.itemIcon}>📜</span>
                  <span className={styles.itemName}>Arama İzni</span>
                  <span>{inventory.isWarrantUsed ? '(Kullanıldı)' : '(Hazır)'}</span>
                </div>
              ) : (
                <p style={{ color: '#8a7f72', gridColumn: '1/-1' }}>Henüz bir eşyan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
