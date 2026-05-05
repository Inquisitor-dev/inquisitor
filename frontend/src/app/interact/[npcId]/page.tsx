'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../../store/useGameStore';
import styles from './interact.module.scss';

interface Message {
  role: 'player' | 'npc';
  text: string;
  timestamp: Date;
}

const NPC_PROFILES: Record<string, { name: string; title: string; icon: string }> = {
  tavern: {
    name: 'Kardeş Aldric',
    title: 'Hancı — Sırların Bekçisi',
    icon: '🍺',
  },
  church: {
    name: 'Peder Malachar',
    title: 'Rahip — İki Efendinin Hizmetkarı',
    icon: '⛪',
  },
  graveyard: {
    name: 'İhtiyar Silas',
    title: 'Mezarcı — Gerçeği Gömüp Saklayan',
    icon: '🪦',
  },
  mill: {
    name: 'Değirmenci Giles',
    title: 'Değirmenci — Rüzgarın Sırdaşı',
    icon: '⚙️',
  },
  crime_scene: {
    name: 'Cinayet Mahalli',
    title: 'Sessiz Tanıklar...',
    icon: '🩸',
  },
};

const PLACEHOLDER_SESSION_ID = 'demo-session-001';

export default function InteractPage({ params }: { params: Promise<{ npcId: string }> }) {
  // Next.js 15+: params is a Promise, must be unwrapped with React.use()
  const { npcId } = use(params);
  const npcKey = npcId;
  const profile = NPC_PROFILES[npcKey] ?? {
    name: 'Meçhul Köylü',
    title: 'Köyün sınırlarında dolaşan bir gölge',
    icon: '👤',
  };

  const { isAdmin, npcStates, dialoguesUsedToday, maxDailyDialogues, incrementDialogue, setDialoguesUsed, sessionId, currentDay, setCurrentDay, notes, setNotes, authToken, logout, inventory, addWarrant, consumeWarrant, hasHydrated } =
    useGameStore();
  
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

  // Sayfa yüklendiğinde geçmişi çek
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return; // Session ID yoksa çekme
      setLoading(true);
      setMessages([]);
      
      try {
        const res = await fetch('http://localhost:3001/npcs/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sessionId: sessionId,
            npcId: currentNpcKey,
          }),
        });
        
        const data = await res.json();
        
        if (data.history && data.history.length > 0) {
          // Gelen geçmiş mesajlarını Message formatına çevir
          const formattedHistory = data.history.map((h: any) => ({
            role: h.role,
            text: h.text,
            timestamp: new Date(h.timestamp),
          }));
          setMessages(formattedHistory);
        } else {
          const fetchedDay = typeof data.currentDay === 'number' ? data.currentDay : 1;

          if (fetchedDay > 1 && !isInvestigating) {
            // Yeni gün! NPC'den otomatik selamlama al (token harcamadan isNewDay flag'i backend'e gidiyor)
            try {
              const greetRes = await fetch('http://localhost:3001/npcs/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: sessionId,
                  npcId: currentNpcKey,
                  message: '__NEW_DAY_GREETING__', // Özel sistem sinyali
                }),
              });
              const greetData = await greetRes.json();
              if (greetData.reply) {
                setMessages([{ role: 'npc', text: greetData.reply, timestamp: new Date() }]);
              }
            } catch {
              setMessages([{ role: 'npc', text: `*${profile.name} sizi tanıyarak başını kaldırıyor...*`, timestamp: new Date() }]);
            }
          } else {
            // 1. gün veya araştırma modu
            if (isInvestigating) {
              setMessages([
                {
                  role: 'npc',
                  text: `*[Mekan: ${profile.name}] Etrafı araştırmaya başlıyorsunuz. Sadece detaylara odaklanın...*`,
                  timestamp: new Date(),
                },
              ]);
            } else {
              setMessages([
                {
                  role: 'npc',
                  text: `*${profile.name} içeri girdiğinizde gözlerini kısarak size bakıyor.*\n\n"Köyümüzde bir Engizisyoncu... Benden ne istiyorsunuz?"`,
                  timestamp: new Date(),
                },
              ]);
            }
          }
        }

        // Kullanılan diyalog miktarını güncelle
        if (typeof data.dialoguesUsed === 'number') {
          setDialoguesUsed(data.dialoguesUsed);
        }
        if (typeof data.currentDay === 'number') {
          setCurrentDay(data.currentDay);
        }

        // Session notlarını çek
        const sessionRes = await fetch(`http://localhost:3001/game-sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setNotes(sessionData.notes || '');
        }
      } catch (err) {
        console.error('History fetch error:', err);
        // Hata olursa varsayılan mesajla başla
        setMessages([
          {
            role: 'npc',
            text: `*${profile.name} içeri girdiğinizde gözlerini kısarak size bakıyor.*\n\n"Köyümüzde bir Engizisyoncu... Benden ne istiyorsunuz?"`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentNpcKey, profile.name, sessionId, setDialoguesUsed, setCurrentDay, setNotes]); // isInvestigating (currentNpcKey) değişirse tekrar çalışır

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || (!isAdmin && dialoguesUsedToday >= 30) || !sessionId) return;

    const userMsg: Message = { role: 'player', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/npcs/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          npcId: currentNpcKey,
          message: trimmed,
        }),
      });

      const data = await res.json();

      if (data.grantedWarrants && data.grantedWarrants.length > 0) {
        data.grantedWarrants.forEach((w: string) => addWarrant(w));
        
        const locNames = data.grantedWarrants.map((w: string) => 
          w === 'tavern' ? 'Taverna' : w === 'mill' ? 'Değirmen' : w === 'graveyard' ? 'Mezarlık' : w.toUpperCase()
        ).join(' ve ');

        setConfirmModal({
          isOpen: true,
          title: 'Arama İzni Alındı',
          message: `Peder Malachar size ${locNames} için arama izni verdi. Bu izinleri kullanarak ilgili mekanları detaylıca arayabilirsiniz.`,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        });
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'npc', text: data.reply, timestamp: new Date() },
        ]);
        incrementDialogue();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'npc',
            text: '*Köylü sessizliğe bürünüp tek kelime etmeyi reddediyor.*',
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          text: '*Odaya tuhaf bir sessizlik çöküyor... (Sunucuya ulaşılamıyor — backend servisinin ayakta olduğundan emin olun.)*',
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

  const handleCondemn = () => {
    if (!sessionId) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Engizisyon Hükmü',
      message: `Emin misiniz? ${profile.name} isimli köylüyü Engizisyon mahkemesinde ölüme mahkum etmek üzeresiniz. Bu karar geri alınamaz ve soruşturmayı sonlandırır.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}/condemn`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
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

  const remaining = maxDailyDialogues - dialoguesUsedToday;

  return (
    <main className={styles.main} style={{ backgroundImage: `url('/backgrounds/bg_${npcKey}.png')` }}>
      <div className={styles.vignette} />

      {/* ── Header ─── */}
      <header className={styles.header}>
        <Link href="/map" className={styles.back}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Haritaya Dön
        </Link>

        <div className={styles.npcInfo}>
          <span className={styles.npcIcon}>{isInvestigating ? '👁️' : profile.icon}</span>
          <div>
            <div className={styles.npcName}>{isInvestigating ? 'Fiziksel Çevre' : profile.name}</div>
            <div className={styles.npcTitle}>{isInvestigating ? 'Etrafınızdaki Dünya' : profile.title}</div>
          </div>
        </div>

        <div className={styles.quota}>
          <span>
            Sorgu Hakkı: {isAdmin ? 'Sınırsız' : `${maxDailyDialogues - dialoguesUsedToday} / ${maxDailyDialogues}`}
          </span>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── Chat column ─── */}
        <div className={styles.chatColumn}>
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.bubble} ${msg.role === 'player' ? styles.player : styles.npc}`}>
                <div className={styles.bubbleLabel}>
                  {msg.role === 'player' ? 'Inquisitor' : (isInvestigating ? 'Anlatıcı' : profile.name)}
                </div>
                <div className={styles.bubbleText}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
                <div className={styles.bubbleTime}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.bubble} ${styles.npc} ${styles.typing}`}>
                <div className={styles.bubbleLabel}>{isInvestigating ? 'Anlatıcı' : profile.name}</div>
                <div className={styles.typingDots}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            {(dialoguesUsedToday >= maxDailyDialogues && !isAdmin) ? (
              <div className={styles.limitReached} style={{ color: '#8A0303', textAlign: 'center', padding: '16px', fontStyle: 'italic', background: '#111', border: '1px solid #333' }}>
                Gerçek zamanlı günlük sınırınıza ulaştınız. Soruşturmaya devam etmek için yarın tekrar dönün.
              </div>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  placeholder="Sorunuzu sorun… Göndermek için Enter'a basın."
                  rows={2}
                  disabled={loading}
                  maxLength={MAX_CHARS}
                />
                <div style={{ fontSize: '0.7rem', color: input.length >= MAX_CHARS ? '#8A0303' : '#555', textAlign: 'right', paddingRight: '50px', marginTop: '2px' }}>
                  {input.length}/{MAX_CHARS}
                </div>
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M14 8H2M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <footer className={styles.actionBar}>
        <div className={styles.actionGroup}>
          <button className={styles.iconBtn} onClick={() => setIsNotesExpanded(true)}>
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

        <div className={styles.condemnCenter}>
          <button 
            className={styles.mainCondemnBtn}
            onClick={handleCondemn}
            disabled={isInvestigating}
          >
            BU KAFİRİ MAHKUM ET
          </button>
        </div>

        <div className={styles.actionGroup}>
          {!isInvestigating ? (
            <button 
              onClick={() => {
                if (canInvestigate) setIsInvestigating(true);
                else alert('Bu mekanı araştırmak için pederden izin almalısınız.');
              }}
              disabled={!canInvestigate}
              className={styles.investigateBtn}
            >
              🔍 Mekanı Araştır
            </button>
          ) : (
            !isCrimeScene && (
              <button 
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Araştırmayı Bitir',
                    message: 'Araştırmayı sonlandırmak izninizi tüketecek ve bu mekanı bir daha araştıramayacaksınız. Emin misiniz?',
                    onConfirm: async () => {
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      consumeWarrant(npcId);
                      setIsInvestigating(false);
                      try {
                        await fetch(`http://localhost:3001/game-sessions/${sessionId}/consume-warrant`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}` 
                          },
                          body: JSON.stringify({ location: npcId })
                        });
                      } catch(e) { console.error(e); }
                    }
                  });
                }}
                className={styles.investigateBtn}
              >
                🚪 Araştırmayı Sonlandır
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Notebook Modal */}
      {isNotesExpanded && (
        <div className={styles.modalOverlay} onClick={() => setIsNotesExpanded(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsNotesExpanded(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Soruşturma Notları</h2>
            <textarea 
              className={styles.notesArea} 
              value={localNotes} 
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Gözlemlerini buraya not et..."
              autoFocus
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
              {(inventory.activeWarrants.length > 0 || inventory.usedWarrants.length > 0) ? (
                <>
                  {inventory.activeWarrants.map((w, idx) => (
                    <div key={`active-${idx}`} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8A0303', fontSize: '0.75rem' }}>
                        {w === 'church' ? 'Kilise' : w === 'tavern' ? 'Taverna' : w === 'mill' ? 'Değirmen' : w === 'graveyard' ? 'Mezarlık' : w.toUpperCase()}
                      </span>
                      <span>(Hazır)</span>
                    </div>
                  ))}
                  {inventory.usedWarrants.map((w, idx) => (
                    <div key={`used-${idx}`} className={styles.inventoryItem} style={{ opacity: 0.6 }}>
                      <span className={styles.itemIcon}>📜</span>
                      <span className={styles.itemName}>Arama İzni</span>
                      <span style={{ color: '#8a7f72', fontSize: '0.75rem' }}>
                        {w === 'church' ? 'Kilise' : w === 'tavern' ? 'Taverna' : w === 'mill' ? 'Değirmen' : w === 'graveyard' ? 'Mezarlık' : w.toUpperCase()}
                      </span>
                      <span>(Kullanıldı)</span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#8a7f72', gridColumn: '1/-1', textAlign: 'center' }}>Henüz bir eşyan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{confirmModal.title}</h2>
            <p className={styles.modalMessage}>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>İptal</button>
              <button className={styles.modalConfirm} onClick={confirmModal.onConfirm}>Onayla</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
