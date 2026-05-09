'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import styles from './map.module.scss';
import AmbientAudio from '../../components/AmbientAudio';

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
    id: 'farm',
    name: 'Çiftlik',
    icon: '🌾',
    top: '65%',
    left: '5%',
    width: '22%',
    height: '30%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    id: 'clinic',
    name: 'Klinik',
    icon: '🏥',
    top: '65%',
    left: '72%',
    width: '20%',
    height: '28%',
    available: true,
    minDifficulty: 'hard',
  }
];

// Modern kasaba konumları (Millfield, KY 1994 haritasına göre)
const modernLocations = [
  {
    // Karakol (Police Station) — Sol üst köşe, büyük bina
    id: 'tavern',
    name: 'Karakol',
    icon: '🚔',
    top: '3%',
    left: '1%',
    width: '28%',
    height: '45%',
    available: true,
  },
  {
    // Kaset Dükkanı (Video Rental) — Orta üst, neon tabela
    id: 'graveyard',
    name: 'Kaset Dükkanı',
    icon: '📼',
    top: '5%',
    left: '29%',
    width: '20%',
    height: '32%',
    available: true,
  },
  {
    // Kilise — Sağ üst köşe
    id: 'church',
    name: 'Kilise',
    icon: '⛪',
    top: '3%',
    left: '80%',
    width: '18%',
    height: '30%',
    available: true,
  },
  {
    // Benzinlik (Gas Station) — Orta sol alt
    id: 'farm',
    name: 'Benzinlik',
    icon: '⛽',
    top: '42%',
    left: '10%',
    width: '20%',
    height: '28%',
    available: true,
    minDifficulty: 'medium',
  },
  {
    // Prefabrik Evler (Trailer Park) — Sağ orta
    id: 'clinic',
    name: 'Prefabrik Evler',
    icon: '🏠',
    top: '28%',
    left: '68%',
    width: '28%',
    height: '38%',
    available: true,
    minDifficulty: 'hard',
  },
  {
    // Açık Hava Sineması (Drive-In Theater) — Alt merkez sağ
    id: 'mill',
    name: 'Açık Hava Sineması',
    icon: '🎬',
    top: '65%',
    left: '36%',
    width: '38%',
    height: '32%',
    available: true,
  },
];

export default function MapPage() {
  const router = useRouter();
  const { sessionId, currentDay, timeOfDay, difficulty, scenarioType, dialoguesUsedToday, authToken, isAdmin, reset, endDay, advanceTime, setWarrants, notes, setNotes, inventory, hasHydrated } = useGameStore();

  // Zorluk seviyesine göre lokasyonları filtrele
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const currentDiffIdx = difficultyOrder.indexOf(difficulty);
  const baseLocations = scenarioType === 'modern' ? modernLocations : locations;
  const visibleLocations = baseLocations.filter((loc: any) => {
    if (!loc.minDifficulty) return true;
    return difficultyOrder.indexOf(loc.minDifficulty) <= currentDiffIdx;
  });
  const [loadingLoc, setLoadingLoc] = useState<string | null>(null);
  const [endingDay, setEndingDay] = useState(false);
  
  // Modal states
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
  const [localNotes, setLocalNotes] = useState('');

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/login');
      return;
    }

    const fetchSession = async () => {
      if (sessionId && authToken) {
        try {
          const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const data = await res.json();
          setWarrants(data.activeWarrants || [], data.usedWarrants || []);
        } catch(e) {}
      }
    };
    if (hasHydrated) fetchSession();
  }, [authToken, router, sessionId, setWarrants, hasHydrated]);

  const handleRetreat = async () => {
    // Notları sunucuya kaydet
    if (sessionId && authToken) {
      try {
        const notes = useGameStore.getState().notes;
        await fetch(`http://localhost:3001/game-sessions/${sessionId}/notes`, {
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
    router.push('/');
  };

  const handleEndDay = async () => {
    if (!sessionId) return;
    
    if (currentDay >= 4) {
      setIsCondemnModalOpen(true);
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

  const handleNotesBlur = async () => {
    if (localNotes !== notes && sessionId) {
      setNotes(localNotes);
      try {
        await fetch(`http://localhost:3001/game-sessions/${sessionId}/notes`, {
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
      const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}/condemn`, {
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
      router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message)}`);
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
    if (timeOfDay <= 1) return '/map/village_map_morning.png';
    if (timeOfDay <= 3) return '/map/village_map_sunset.png';
    return '/map/village_map.png';
  };

  return (
    <main className={styles.main}>
      <AmbientAudio timeOfDay={timeOfDay} type="map" />
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
            {scenarioType === 'modern' ? 'Millfield Kasabası' : 'Ashenmoor Köyü'}
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
                {loadingLoc === loc.id ? 'Gidiliyor...' : `${(() => {
                  if (scenarioType === 'modern') {
                    if (loc.id === 'tavern') return 'Karakol';
                    if (loc.id === 'church') return 'Kilise';
                    if (loc.id === 'mill') return 'Açık Hava Sineması';
                    if (loc.id === 'graveyard') return 'Kaset Dükkanı';
                    if (loc.id === 'farm') return 'Benzinlik';
                    if (loc.id === 'clinic') return 'Prefabrik Evler';
                  } else if (scenarioType === 'cyberpunk') {
                    if (loc.id === 'tavern') return 'Neon Bar';
                    if (loc.id === 'church') return 'Tarikat Merkezi';
                    if (loc.id === 'mill') return 'Üretim Tesisi';
                    if (loc.id === 'graveyard') return 'Veri Çöplüğü';
                    if (loc.id === 'farm') return 'Hidroponik';
                    if (loc.id === 'clinic') return 'Ripperdoc';
                  }
                  return loc.name; // default medieval
                })()}'a Git`}
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

        {/* Central Condemn Button */}
        <div className={styles.condemnCenter}>
          <button 
            className={styles.mainCondemnBtn}
            onClick={() => setIsCondemnModalOpen(true)}
          >
            MAHKUMU SEÇ
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
              {inventory.activeWarrants.length > 0 || inventory.usedWarrants.length > 0 ? (
                <>
                  {inventory.activeWarrants.map((w, idx) => (
                    <div key={`active-${idx}`} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8A0303', fontSize: '0.75rem' }}>
                        {(() => {
                          if (scenarioType === 'modern') {
                            return w === 'church' ? 'Kilise' : w === 'tavern' ? 'Bar' : w === 'mill' ? 'Fabrika' : w === 'graveyard' ? 'Mezarlık' : w === 'farm' ? 'Çiftlik' : w === 'clinic' ? 'Klinik' : w.toUpperCase();
                          } else if (scenarioType === 'cyberpunk') {
                            return w === 'church' ? 'Tarikat Merkezi' : w === 'tavern' ? 'Neon Bar' : w === 'mill' ? 'Üretim Tesisi' : w === 'graveyard' ? 'Veri Çöplüğü' : w === 'farm' ? 'Hidroponik' : w === 'clinic' ? 'Ripperdoc' : w.toUpperCase();
                          }
                          return w === 'church' ? 'Kilise' : w === 'tavern' ? 'Taverna' : w === 'mill' ? 'Değirmen' : w === 'graveyard' ? 'Mezarlık' : w === 'farm' ? 'Çiftlik' : w === 'clinic' ? 'Klinik' : w.toUpperCase();
                        })()}
                      </span>
                      <span>(Hazır)</span>
                    </div>
                  ))}
                  {inventory.usedWarrants.map((w, idx) => (
                    <div key={`used-${idx}`} className={styles.inventoryItem} style={{ opacity: 0.6 }}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8a7f72', fontSize: '0.75rem' }}>
                        {(() => {
                          if (scenarioType === 'modern') {
                            return w === 'church' ? 'Kilise' : w === 'tavern' ? 'Bar' : w === 'mill' ? 'Fabrika' : w === 'graveyard' ? 'Mezarlık' : w === 'farm' ? 'Çiftlik' : w === 'clinic' ? 'Klinik' : w.toUpperCase();
                          } else if (scenarioType === 'cyberpunk') {
                            return w === 'church' ? 'Tarikat Merkezi' : w === 'tavern' ? 'Neon Bar' : w === 'mill' ? 'Üretim Tesisi' : w === 'graveyard' ? 'Veri Çöplüğü' : w === 'farm' ? 'Hidroponik' : w === 'clinic' ? 'Ripperdoc' : w.toUpperCase();
                          }
                          return w === 'church' ? 'Kilise' : w === 'tavern' ? 'Taverna' : w === 'mill' ? 'Değirmen' : w === 'graveyard' ? 'Mezarlık' : w === 'farm' ? 'Çiftlik' : w === 'clinic' ? 'Klinik' : w.toUpperCase();
                        })()}
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
                    { id: 'church', name: 'Papaz Gerald', icon: '⛪', role: 'Papaz' },
                    { id: 'mill', name: 'Donna', icon: '🎬', role: 'Gişe Görevlisi' },
                    { id: 'graveyard', name: 'Randy', icon: '📼', role: 'Video Kasetçi' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Earl', icon: '⛽', role: 'Pompacı' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Old Marge', icon: '🏠', role: 'Köyün Yaşlısı' });
                  }
                } else if (scenarioType === 'cyberpunk') {
                  villagers = [
                    { id: 'tavern', name: 'Aldric', icon: '🥃', role: 'Neon-Barmen' },
                    { id: 'church', name: 'Malachar', icon: '🔌', role: 'Tarikat Lideri' },
                    { id: 'mill', name: 'Giles', icon: '🏭', role: 'Ustabaşı' },
                    { id: 'graveyard', name: 'Silas', icon: '💀', role: 'Veri Çöpçüsü' },
                  ];
                  if (difficulty === 'medium' || difficulty === 'hard') {
                    villagers.push({ id: 'farm', name: 'Edmund', icon: '🧪', role: 'Hidroponik Çiftçi' });
                  }
                  if (difficulty === 'hard') {
                    villagers.push({ id: 'clinic', name: 'Doc Harland', icon: '💉', role: 'Ripperdoc' });
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
