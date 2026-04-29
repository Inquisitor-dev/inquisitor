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

  const { npcStates, updateNpcState, dialoguesUsedToday, maxDailyDialogues, incrementDialogue, setDialoguesUsed, sessionId, currentDay, setCurrentDay, notes, setNotes } =
    useGameStore();
  
  const router = useRouter();

  const npcState = npcStates[npcKey] ?? { fear: 0, lie: 5 };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true); // Başlangıçta true, veri gelene kadar
  const [localNotes, setLocalNotes] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sayfa yüklendiğinde geçmişi çek
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return; // Session ID yoksa çekme
      try {
        const res = await fetch('http://localhost:3001/npcs/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            npcId: npcKey,
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
          // Eğer geçmiş yoksa ilk varsayılan mesajı göster
          setMessages([
            {
              role: 'npc',
              text: `*${profile.name} içeri girdiğinizde gözlerini kısarak size bakıyor.*\n\n"Köyümüzde bir Engizisyoncu... Benden ne istiyorsunuz?"`,
              timestamp: new Date(),
            },
          ]);
        }

        // Eğer backend'den anlık psikolojik durum döndüyse state'i güncelle
        if (data.state) {
          updateNpcState(npcKey, data.state.fear, data.state.lie);
        }

        // Kullanılan diyalog miktarını güncelle
        if (typeof data.dialoguesUsed === 'number') {
          setDialoguesUsed(data.dialoguesUsed);
        }
        if (typeof data.currentDay === 'number') {
          setCurrentDay(data.currentDay);
        }

        // Session notlarını çek
        const sessionRes = await fetch(`http://localhost:3001/game-sessions/${sessionId}`);
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
  }, [npcKey, profile.name, sessionId, setDialoguesUsed, updateNpcState, setCurrentDay, setNotes]); // npcKey değişirse (başka sayfaya geçilirse) tekrar çalışır

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || dialoguesUsedToday >= maxDailyDialogues || !sessionId) return;

    const userMsg: Message = { role: 'player', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/npcs/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          npcId: npcKey,
          message: trimmed,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'npc', text: data.reply, timestamp: new Date() },
        ]);
        if (data.newState) {
          updateNpcState(npcKey, data.newState.fear, data.newState.lie);
        }
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: localNotes }),
        });
      } catch (err) {
        console.error('Failed to save notes', err);
      }
    }
  };

  const handleCondemn = async () => {
    if (!sessionId) return;
    const confirm = window.confirm(`Emin misin? ${profile.name} isimli köylüyü engizisyon mahkemesinde ölüme mahkum etmek üzeresin. Bu karar geri alınamaz ve soruşturmayı sonlandırır.`);
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:3001/game-sessions/${sessionId}/condemn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npcId: npcKey }),
      });
      const data = await res.json();
      router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message)}`);
    } catch (err) {
      console.error('Failed to condemn', err);
      alert('Hüküm verilirken bir hata oluştu.');
    }
  };

  const remaining = maxDailyDialogues - dialoguesUsedToday;
  const fearPct = (npcState.fear / 10) * 100;
  const liePct = (npcState.lie / 10) * 100;

  return (
    <main className={styles.main}>
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
          <span className={styles.npcIcon}>{profile.icon}</span>
          <div>
            <div className={styles.npcName}>{profile.name}</div>
            <div className={styles.npcTitle}>{profile.title}</div>
          </div>
        </div>

        <div className={styles.quota}>
          <span className={remaining < 10 ? styles.quotaLow : ''}>
            Bugün kalan sorgu hakkınız: {remaining}
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
                  {msg.role === 'player' ? 'Inquisitor' : profile.name}
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
                <div className={styles.bubbleLabel}>{profile.name}</div>
                <div className={styles.typingDots}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            {dialoguesUsedToday >= maxDailyDialogues ? (
              <div className={styles.limitReached} style={{ color: '#8A0303', textAlign: 'center', padding: '16px', fontStyle: 'italic', background: '#111', border: '1px solid #333' }}>
                Gerçek zamanlı günlük sınırınıza ulaştınız. Soruşturmaya devam etmek için yarın tekrar dönün.
              </div>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Sorunuzu sorun… Göndermek için Enter'a basın."
                  rows={2}
                  disabled={loading}
                />
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

        {/* ── Sidebar ─── */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Psikolojik Profil</div>

            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Korku Seviyesi</span>
                <span className={styles.metricVal}>{npcState.fear}/10</span>
              </div>
              <div className={styles.bar}>
                <div
                  className={`${styles.barFill} ${styles.barFear}`}
                  style={{ width: `${fearPct}%` }}
                />
              </div>
              <div className={styles.metricHint}>
                {npcState.fear >= 7
                  ? 'İtiraf etmenin eşiğinde…'
                  : npcState.fear >= 4
                  ? 'Gözle görülür biçimde huzursuz.'
                  : 'Sakinliğini koruyor. Tehlikeli.'}
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Yalan Söyleme Eğilimi</span>
                <span className={styles.metricVal}>{npcState.lie}/10</span>
              </div>
              <div className={styles.bar}>
                <div
                  className={`${styles.barFill} ${styles.barLie}`}
                  style={{ width: `${liePct}%` }}
                />
              </div>
              <div className={styles.metricHint}>
                {npcState.lie >= 7
                  ? 'Aktif olarak yalanlar dokuyor.'
                  : npcState.lie >= 4
                  ? 'Önemli detayları gizliyor.'
                  : 'İşbirliği yapmaya niyetli gibi.'}
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Engizisyoncunun Notları</div>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '120px', padding: '12px', marginTop: '8px', fontSize: '0.85rem' }}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Şüpheli davranışları buraya not et..."
            />
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Günlük Kaynak</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(dialoguesUsedToday / maxDailyDialogues) * 100}%` }}
              />
            </div>
            <p className={styles.sideHint}>Bugün {dialoguesUsedToday} / {maxDailyDialogues} sorgu hakkı kullanıldı.</p>
          </div>

          <div className={styles.sideCard} style={{ marginTop: 'auto' }}>
            <button className={`${styles.sendBtn} ${styles.condemnBtn}`} style={{ width: '100%', background: '#8A0303', color: '#fff', border: 'none', padding: '12px' }} onClick={handleCondemn}>
              BU KAFİRİ MAHKUM ET
            </button>
            <p className={styles.sideHint} style={{ textAlign: 'center', marginTop: '8px' }}>
              Nihai hükmünüz hikayenin sonunu belirler.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
