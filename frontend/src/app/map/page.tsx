'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import styles from './map.module.scss';

const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];

const locations = [
  {
    id: 'tavern',
    name: 'Taverna',
    subtitle: 'Sırların şarapla boğulduğu yer.',
    icon: '🍺',
    description:
      'Yerel halk gün batımında burada toplanır. Çözülen diller ve gölgeli köşeler — çelişkileri avlamak için mükemmel bir avlanma alanı.',
    available: true,
  },
  {
    id: 'church',
    name: 'Kilise',
    subtitle: 'Tanrı izliyor, ama sen de izliyorsun.',
    icon: '⛪',
    description:
      "Rahip köyün vicdanını elinde tutar. Fakat Engizisyoncu'ya kim günah çıkaracak?",
    available: true,
  },
  {
    id: 'graveyard',
    name: 'Mezarlık',
    subtitle: 'Ölüler yalan söylemez. Diriler söyler.',
    icon: '🪦',
    description:
      'Gece yarısı garip ayinler rapor edildi. Mezarcı neyi gömdüğünü biliyor — ve neyin yürüyerek uzaklaştığını.',
    available: true,
  },
  {
    id: 'crime-scene',
    name: 'Cinayet Mahalli',
    subtitle: 'Kan kurumadan önce incele.',
    icon: '🩸',
    description:
      'Karanlık bir cinayetin işlendiği yer. Ceset yakında kaldırılacak, etraf temizlenecek. Sadece bugün inceleyebilirsin.',
    available: true,
  },
  {
    id: 'mill',
    name: 'Değirmen',
    subtitle: 'Endüstri, günahları maskeler.',
    icon: '⚙️',
    description:
      'Değirmenci unla uğraşır — ve dedikoduyla. Unu takip et, komployu bul.',
    available: false,
  },
];

export default function MapPage() {
  const router = useRouter();
  const { currentDay, timeOfDay, advanceTime, dialoguesUsedToday, maxDailyDialogues, sessionId, endDay } = useGameStore();
  const [endingDay, setEndingDay] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);

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

  const handleLocationClick = async (locId: string) => {
    if (!sessionId || timeOfDay >= 4) return;
    setLoadingLoc(locId);
    try {
      await fetch(`http://localhost:3001/game-sessions/${sessionId}/advance-time`, {
        method: 'POST',
      });
      advanceTime();
      
      if (locId === 'crime-scene') {
        router.push('/crime-scene');
      } else {
        router.push(`/interact/${locId}`);
      }
    } catch (err) {
      console.error('Failed to advance time', err);
      setLoadingLoc(null);
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
          Geri Çekil
        </Link>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Ashenmoor Köyü</h1>
          <p className={styles.pageSub}>Mekanını seç — Avını seç.</p>
        </div>
        <div className={styles.sessionInfo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div>
            <span className={styles.sessionDot} />
            <span>{currentDay}. Gün - {TIME_LABELS[timeOfDay]}</span>
            <span style={{ marginLeft: '12px', opacity: 0.7 }}>
              Limit: {maxDailyDialogues - dialoguesUsedToday}/{maxDailyDialogues}
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
            {endingDay ? 'Dinleniliyor...' : 'Günü Bitir'}
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
            const isNight = timeOfDay >= 4;
            const isCrimeSceneLocked = loc.id === 'crime-scene' && currentDay !== 1;
            const isAvailable = loc.available && !isCrimeSceneLocked;
            
            const CardWrapper = (isAvailable && !isNight)
              ? ({ children }: { children: React.ReactNode }) => (
                  <div onClick={() => handleLocationClick(loc.id)} className={`${styles.locationCard}`} style={{ cursor: 'pointer' }}>
                    {children}
                  </div>
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
                  {isAvailable ? (
                    isNight ? (
                      <span className={styles.comingSoon} style={{ color: '#8A0303' }}>Gece Oldu</span>
                    ) : (
                      <span className={styles.enterBtn}>
                        {loadingLoc === loc.id ? 'Gidiliyor...' : 'Gir ve İncele'}
                        {!loadingLoc && (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    )
                  ) : isCrimeSceneLocked ? (
                    <span className={styles.comingSoon} style={{ color: '#555' }}>Ceset Kaldırıldı</span>
                  ) : (
                    <span className={styles.comingSoon}>Yakında</span>
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
