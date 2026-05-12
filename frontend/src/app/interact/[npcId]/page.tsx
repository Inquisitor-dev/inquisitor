'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { useGameStore } from '../../../store/useGameStore';
import styles from './interact.module.scss';
import AmbientAudio from '../../../components/AmbientAudio';

interface Message {
  role: 'player' | 'npc';
  text: string;
  timestamp: Date;
}

const getNpcProfile = (npcKey: string, scenarioType: string) => {
  if (scenarioType === 'modern') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Serif Dale Cooper', title: 'Polis Amiri - Karakolun Tek Kanunu', icon: '🚔' },
      church: { name: 'Papaz Gerald', title: 'Papaz - Kilisedeki Sessiz Tanik', icon: '⛪' },
      graveyard: { name: 'Randy', title: 'Video Kasetci - Herkesin Ugradigi Dukkan', icon: '📼' },
      mill: { name: 'Donna', title: 'Gise Gorevlisi - Acik Hava Sinemasinin Gozleri', icon: '🎬' },
      farm: { name: 'Earl', title: 'Pompaci - Benzinligin Sessiz Bekcisi', icon: '⛽' },
      clinic: { name: 'Old Marge', title: 'Koyun Yaslisi - Her Seyi Bilen Ama Soylemeyen', icon: '🏠' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Taniklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'cyberpunk') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Officer Kael Voss', title: 'Memur Bey - Neon Prime Karakolu', icon: '👮' },
      church: { name: 'Mirel Sato', title: 'Restoran Sahibi - Static Spoon', icon: '🍜' },
      graveyard: { name: 'Brakk Coil', title: 'Hurdaci - Coil Yard', icon: '🛠️' },
      mill: { name: 'AURA-9', title: 'Satici Android - AURA Robotics', icon: '🤖' },
      farm: { name: 'Ash', title: 'Dilenci - Kopru Alti Muhbiri', icon: '🧥' },
      clinic: { name: 'Vera Nyx', title: 'Barmen - Velvet Static', icon: '🍸' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Taniklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Kardes Aldric', title: 'Hanci - Sirlarin Bekcisi', icon: '🍺' },
      church: { name: 'Peder Malachar', title: 'Rahip - Iki Efendinin Hizmetkari', icon: '⛪' },
      graveyard: { name: 'Ihtiyar Silas', title: 'Mezarci - Gercegi Gomup Saklayan', icon: '🪦' },
      mill: { name: 'Degirmenci Giles', title: 'Degirmenci - Ruzgarin Sirdasi', icon: '⚙️' },
      farm: { name: 'Ciftci Edmund', title: 'Ciftci - Topragin ve Karanligin Tanigi', icon: '🌾' },
      clinic: { name: 'Doktor Harland', title: 'Hekim - Soguk Ellerin ve Daha Soguk Gozlerin Sahibi', icon: '🏥' },
      crime_scene: { name: 'Cinayet Mahalli', title: 'Sessiz Taniklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  }
};

const getLocationLabel = (locationId: string, scenarioType: string) => {
  if (scenarioType === 'modern') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      church: 'Kilise',
      graveyard: 'Kaset Dukkani',
      mill: 'Acik Hava Sinemasi',
      farm: 'Benzinlik',
      clinic: 'Prefabrik Evler',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'cyberpunk') {
    const labels: Record<string, string> = {
      tavern: 'Polis Karakolu',
      church: 'Lokanta',
      graveyard: 'Hurdalik',
      mill: 'Robot Dukkani',
      farm: 'Kopru Alti',
      clinic: 'Bar',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlik',
    mill: 'Degirmen',
    farm: 'Ciftlik',
    clinic: 'Klinik',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};

export default function InteractPage({ params }: { params: Promise<{ npcId: string }> }) {
  const { npcId } = use(params);
  const npcKey = npcId;
  const {
    scenarioType,
    isAdmin,
    isPremium,
    dialoguesUsedToday,
    incrementDialogue,
    setDialoguesUsed,
    sessionId,
    currentDay,
    setCurrentDay,
    timeOfDay,
    notes,
    setNotes,
    authToken,
    inventory,
    addWarrant,
    consumeWarrant,
    hasHydrated,
  } = useGameStore();

  const profile = getNpcProfile(npcKey, scenarioType || 'medieval') ?? {
    name: 'Mechul Koylu',
    title: 'Golgeler arasinda bir yabanci',
    icon: '👤',
  };

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const MAX_CHARS = 200;
  const [localNotes, setLocalNotes] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const isCrimeScene = npcKey === 'crime_scene';
  const [isInvestigating, setIsInvestigating] = useState(isCrimeScene);
  const currentNpcKey = isInvestigating ? `narrator_${npcKey}` : npcKey;
  const canInvestigate = isCrimeScene || inventory?.activeWarrants?.includes(npcKey);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/login');
    }
  }, [authToken, router, hasHydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;
      setLoading(true);
      setMessages([]);

      try {
        const res = await fetch(apiUrl('/npcs/history'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sessionId,
            npcId: currentNpcKey,
          }),
        });

        const data = await res.json();

        if (data.history && data.history.length > 0) {
          const formattedHistory = data.history.map((h: any) => ({
            role: h.role,
            text: h.text,
            timestamp: new Date(h.timestamp),
          }));
          setMessages(formattedHistory);
        } else {
          const fetchedDay = typeof data.currentDay === 'number' ? data.currentDay : 1;

          if (fetchedDay > 1 && !isInvestigating) {
            try {
              const greetRes = await fetch(apiUrl('/npcs/interact'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  npcId: currentNpcKey,
                  message: '__NEW_DAY_GREETING__',
                }),
              });
              const greetData = await greetRes.json();
              if (greetData.reply) {
                setMessages([{ role: 'npc', text: greetData.reply, timestamp: new Date() }]);
              }
            } catch {
              setMessages([{ role: 'npc', text: `*${profile.name} sizi tanir gibi basini kaldiriyor...*`, timestamp: new Date() }]);
            }
          } else if (isInvestigating) {
            setMessages([
              {
                role: 'npc',
                text: `*[Mekan: ${profile.name}] Etrafi arastirmaya basliyorsunuz. Sadece detaylara odaklanin...*`,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages([
              {
                role: 'npc',
                text: `*${profile.name} size supheyle bakiyor.*\n\n"Buraya neden geldiniz?"`,
                timestamp: new Date(),
              },
            ]);
          }
        }

        if (typeof data.dialoguesUsed === 'number') {
          setDialoguesUsed(data.dialoguesUsed);
        }
        if (typeof data.currentDay === 'number') {
          setCurrentDay(data.currentDay);
        }

        const sessionRes = await fetch(apiUrl(`/game-sessions/${sessionId}`), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setNotes(sessionData.notes || '');
        }
      } catch (err) {
        console.error('History fetch error:', err);
        setMessages([
          {
            role: 'npc',
            text: `*${profile.name} size kuskulu bir bakis atiyor.*`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentNpcKey, profile.name, sessionId, setDialoguesUsed, setCurrentDay, setNotes, authToken, isInvestigating]);

  const handleSend = async () => {
    const trimmed = input.trim();
    const maxLimit = isPremium ? 100 : 30;
    if (!trimmed || loading || (!isAdmin && dialoguesUsedToday >= maxLimit) || !sessionId) return;

    const userMsg: Message = { role: 'player', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/npcs/interact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          npcId: currentNpcKey,
          message: trimmed,
        }),
      });

      const data = await res.json();

      if (data.grantedWarrants && data.grantedWarrants.length > 0) {
        data.grantedWarrants.forEach((w: string) => addWarrant(w));
        const locNames = data.grantedWarrants
          .map((w: string) => getLocationLabel(w, scenarioType || 'medieval'))
          .join(' ve ');

        setConfirmModal({
          isOpen: true,
          title: 'Arama Izni Alindi',
          message: `${profile.name} size ${locNames} icin arama izni verdi.`,
          onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
      }

      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply, timestamp: new Date() }]);
        incrementDialogue();
      } else if (!res.ok && data.message) {
        setMessages((prev) => [...prev, { role: 'npc', text: `*[Sistem Hatasi: ${data.message}]*`, timestamp: new Date() }]);
      } else {
        setMessages((prev) => [...prev, { role: 'npc', text: '*Karsi taraf sessiz kaldi.*', timestamp: new Date() }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          text: '*Sunucuya ulasilamiyor. Backend servisinin ayakta oldugundan emin olun.*',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNotesBlur = async () => {
    if (localNotes !== notes && sessionId) {
      setNotes(localNotes);
      try {
        await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes: localNotes }),
        });
      } catch (err) {
        console.error('Failed to save notes', err);
      }
    }
  };

  const handleCondemn = () => {
    if (!sessionId) return;

    setConfirmModal({
      isOpen: true,
      title: 'Nihai Hukum',
      message: `${profile.name} isimli kisiyi mahkum etmek istediginizden emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(apiUrl(`/game-sessions/${sessionId}/condemn`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ npcId: npcKey }),
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
      },
    });
  };

  const maxDailyDialogues = isPremium ? 100 : 30;

  return (
    <main
      className={`${styles.main} ${(scenarioType === 'modern' || scenarioType === 'cyberpunk') ? styles.modernPlain : ''}`}
      style={
        (scenarioType === 'modern' || scenarioType === 'cyberpunk')
          ? { backgroundImage: 'none', backgroundColor: '#000000' }
          : { backgroundImage: `url('/backgrounds/bg_${npcKey}.png')` }
      }
    >
      <AmbientAudio timeOfDay={timeOfDay} type="interact" />
      <div className={styles.vignette} />

      <header className={styles.header}>
        <Link href="/map" className={styles.back}>
          Haritaya Don
        </Link>

        <div className={styles.npcInfo}>
          <span className={styles.npcIcon}>{isInvestigating ? '👁️' : profile.icon}</span>
          <div>
            <div className={styles.npcName}>{isInvestigating ? 'Fiziksel Cevre' : profile.name}</div>
            <div className={styles.npcTitle}>{isInvestigating ? 'Etrafinizdaki Dunya' : profile.title}</div>
          </div>
        </div>

        <div className={styles.quota}>
          Bugun kalan sorgu hakkiniz: {isAdmin ? 'Sinirsiz' : 30 - dialoguesUsedToday}
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.chatColumn}>
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.bubble} ${msg.role === 'player' ? styles.player : styles.npc}`}>
                <div className={styles.bubbleLabel}>{msg.role === 'player' ? 'Inquisitor' : isInvestigating ? 'Anlatici' : profile.name}</div>
                <div className={styles.bubbleText}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <div className={styles.bubbleTime}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.bubble} ${styles.npc} ${styles.typing}`}>
                <div className={styles.bubbleLabel}>{isInvestigating ? 'Anlatici' : profile.name}</div>
                <div className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Mobile Quick Actions Toolbar */}
          <div className={styles.mobileToolbar}>
            <button className={styles.toolBtn} onClick={() => setIsNotesExpanded(true)}>
              <span>📝</span> Notlar
            </button>
            <button className={styles.toolBtn} onClick={() => setIsInventoryOpen(true)}>
              <span>📜</span> Envanter
            </button>
            
            {!isInvestigating ? (
              <button 
                className={`${styles.toolBtn} ${canInvestigate ? styles.activeTool : ''}`}
                disabled={!canInvestigate}
                onClick={() => setIsInvestigating(true)}
              >
                <span>🔍</span> Mekanı Araştır
              </button>
            ) : (
              !isCrimeScene && (
                <button 
                  className={`${styles.toolBtn} ${styles.activeTool}`}
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Araştırmayı Bitir',
                      message: 'Araştırmayı bitirmek izninizi tüketecek. Emin misiniz?',
                      onConfirm: async () => {
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                        consumeWarrant(npcId);
                        setIsInvestigating(false);
                        try {
                          await fetch(apiUrl(`/game-sessions/${sessionId}/consume-warrant`), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({ location: npcId }),
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      },
                    });
                  }}
                >
                  <span>⏹️</span> Araştırmayı Bitir
                </button>
              )
            )}

            {!isInvestigating && (
              <button className={`${styles.toolBtn} ${styles.condemnBtn}`} onClick={handleCondemn}>
                <span>⚖️</span> Hüküm Ver
              </button>
            )}
          </div>

          <div className={styles.inputArea}>
            {dialoguesUsedToday >= maxDailyDialogues && !isAdmin ? (
              <div className={styles.limitReached}>Gunluk siniriniza ulastiniz.</div>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  placeholder="Sorunuzu sorun..."
                  rows={2}
                  disabled={loading}
                  maxLength={MAX_CHARS}
                />
                <div style={{ fontSize: '0.7rem', color: input.length >= MAX_CHARS ? '#8A0303' : '#555', textAlign: 'right', paddingRight: '50px', marginTop: '2px' }}>
                  {input.length}/{MAX_CHARS}
                </div>
                <button className={styles.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
                  Gonder
                </button>
              </>
            )}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Engizisyoncunun Notlari
              <button className={styles.expandBtn} onClick={() => setIsNotesExpanded(true)} title="Genislet">
                +
              </button>
            </div>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '120px', padding: '12px', marginTop: '8px', fontSize: '0.85rem' }}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Supheli davranislari buraya not et..."
            />
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Gunluk Kaynak</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(dialoguesUsedToday / maxDailyDialogues) * 100}%` }} />
            </div>
            <p className={styles.sideHint}>Bugun {dialoguesUsedToday} / {isAdmin ? 'Sinirsiz' : 30} sorgu hakki kullanildi.</p>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Envanter</div>
            <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '12px' }}>
              {inventory?.activeWarrants?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {inventory.activeWarrants.map((w) => (
                    <div key={w}>📜 Arama Izni: {getLocationLabel(w, scenarioType || 'medieval').toUpperCase()}</div>
                  ))}
                </div>
              ) : inventory?.usedWarrants?.length > 0 ? (
                <span style={{ color: '#8a7f72' }}>Tum izinler kullanildi.</span>
              ) : (
                'Envanter bos'
              )}
            </div>

            {!isInvestigating ? (
              <button
                onClick={() => {
                  if (canInvestigate) {
                    setIsInvestigating(true);
                  } else {
                    alert('Bu mekani arastirmak icin once arama izni almalisiniz.');
                  }
                }}
                disabled={!canInvestigate}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: canInvestigate ? '#8A0303' : 'rgba(255,255,255,0.05)',
                  color: canInvestigate ? '#fff' : '#555',
                  border: '1px solid ' + (canInvestigate ? '#a00' : '#333'),
                  cursor: canInvestigate ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  fontFamily: 'inherit',
                }}
              >
                Mekani Arastir
              </button>
            ) : (
              !isCrimeScene && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Arastirmayi Bitir',
                      message: 'Arastirmayi bitirmek izninizi tuketecek. Emin misiniz?',
                      onConfirm: async () => {
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                        consumeWarrant(npcId);
                        setIsInvestigating(false);
                        try {
                          await fetch(apiUrl(`/game-sessions/${sessionId}/consume-warrant`), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({ location: npcId }),
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#8A0303',
                    color: '#fff',
                    border: '1px solid #a00',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '1px',
                    fontFamily: 'inherit',
                  }}
                >
                  Arastirmayi Sonlandir
                </button>
              )
            )}
          </div>

          <div className={styles.sideCard} style={{ marginTop: 'auto' }}>
            <button
              className={`${styles.sendBtn} ${styles.condemnBtn}`}
              style={{
                width: '100%',
                background: isInvestigating ? '#4a0202' : '#8A0303',
                color: isInvestigating ? '#888' : '#fff',
                border: 'none',
                padding: '12px',
                cursor: isInvestigating ? 'not-allowed' : 'pointer',
                opacity: isInvestigating ? 0.5 : 1,
              }}
              onClick={handleCondemn}
              disabled={isInvestigating}
            >
              BU KAFIRI MAHKUM ET
            </button>
          </div>
        </aside>
      </div>

      {isNotesExpanded && (
        <div className={styles.notesExpandedOverlay}>
          <div className={styles.notesExpandedHeader}>
            <h2 className={styles.notesExpandedTitle}>Engizisyoncunun Notlari</h2>
            <button className={styles.closeBtn} onClick={() => setIsNotesExpanded(false)} title="Kucult">
              x
            </button>
          </div>
          <div className={styles.notesExpandedBody}>
            <textarea
              className={styles.notesExpandedTextarea}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Supheli davranislari, celiskileri ve analizlerinizi buraya not edin..."
              autoFocus
            />
          </div>
        </div>
      )}

      {isInventoryOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInventoryOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsInventoryOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Envanter</h2>
            <div className={styles.inventoryList}>
              {inventory?.activeWarrants?.length > 0 || inventory?.usedWarrants?.length > 0 ? (
                <>
                  {inventory.activeWarrants.map((w, idx) => (
                    <div key={`active-${idx}`} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}>📜</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>Arama İzni</span>
                        <span className={styles.itemLoc}>{getLocationLabel(w, scenarioType || 'medieval')}</span>
                      </div>
                      <span className={styles.itemStatus}>(Hazır)</span>
                    </div>
                  ))}
                  {inventory.usedWarrants.map((w, idx) => (
                    <div key={`used-${idx}`} className={styles.inventoryItem} style={{ opacity: 0.6 }}>
                      <span className={styles.itemIcon}>📜</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>Arama İzni</span>
                        <span className={styles.itemLoc}>{getLocationLabel(w, scenarioType || 'medieval')}</span>
                      </div>
                      <span className={styles.itemStatus}>(Kullanıldı)</span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#8a7f72', textAlign: 'center', width: '100%' }}>Henüz bir eşyan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{confirmModal.title}</h2>
            <p className={styles.modalMessage}>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
                Vazgec
              </button>
              <button className={styles.modalConfirm} onClick={confirmModal.onConfirm}>
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
