'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../../store/useGameStore';
import styles from './interact.module.scss';

interface Message {
  role: 'player' | 'npc';
  text: string;
  timestamp: Date;
}

const NPC_PROFILES: Record<string, { name: string; title: string; icon: string }> = {
  tavern: {
    name: 'Brother Aldric',
    title: 'The Innkeeper — Keeper of Secrets',
    icon: '🍺',
  },
  church: {
    name: 'Father Malachar',
    title: 'The Priest — Servant of Two Masters',
    icon: '⛪',
  },
  graveyard: {
    name: 'Old Silas',
    title: 'The Gravedigger — He Who Buries the Truth',
    icon: '🪦',
  },
};

const PLACEHOLDER_SESSION_ID = 'demo-session-001';

export default function InteractPage({ params }: { params: Promise<{ npcId: string }> }) {
  // Next.js 15+: params is a Promise, must be unwrapped with React.use()
  const { npcId } = use(params);
  const npcKey = npcId;
  const profile = NPC_PROFILES[npcKey] ?? {
    name: 'Unknown Villager',
    title: 'A shadow at the edge of the village',
    icon: '👤',
  };

  const { npcStates, updateNpcState, dialoguesUsedToday, maxDailyDialogues, incrementDialogue, setDialoguesUsed, sessionId, currentDay, setCurrentDay } =
    useGameStore();

  const npcState = npcStates[npcKey] ?? { fear: 0, lie: 5 };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true); // Başlangıçta true, veri gelene kadar
  const bottomRef = useRef<HTMLDivElement>(null);

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
              text: `*${profile.name} looks up as you enter, eyes narrowing.*\n\n"An Inquisitor in our village... What do you want from me?"`,
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
      } catch (err) {
        console.error('History fetch error:', err);
        // Hata olursa varsayılan mesajla başla
        setMessages([
          {
            role: 'npc',
            text: `*${profile.name} looks up as you enter, eyes narrowing.*\n\n"An Inquisitor in our village... What do you want from me?"`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [npcKey, profile.name, sessionId, setDialoguesUsed, updateNpcState, setCurrentDay]); // npcKey değişirse (başka sayfaya geçilirse) tekrar çalışır

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
            text: '*The villager stares at you in silence, refusing to speak.*',
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          text: '*A strange silence falls over the room… (Server unreachable — ensure backend is running on port 3001 and your GROQ_API_KEY is set.)*',
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
          Map
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
            {remaining} dialogues left today
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
                It is getting late. You must return to the village map and end the day.
              </div>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your question… Press Enter to send."
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
            <div className={styles.sideTitle}>Psychological Profile</div>

            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Fear Level</span>
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
                  ? 'On the verge of confession…'
                  : npcState.fear >= 4
                  ? 'Visibly unsettled.'
                  : 'Composed. Dangerous.'}
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Deception Tendency</span>
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
                  ? 'Actively weaving lies.'
                  : npcState.lie >= 4
                  ? 'Omitting key details.'
                  : 'Seems cooperative.'}
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Inquisitor's Notes</div>
            <p className={styles.sideHint}>
              Look for inconsistencies across multiple sessions. Fear rises under pressure — watch for sudden spikes.
            </p>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Session</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(dialoguesUsedToday / maxDailyDialogues) * 100}%` }}
              />
            </div>
            <p className={styles.sideHint}>{dialoguesUsedToday} / {maxDailyDialogues} dialogues used today.</p>
          </div>

          <div className={styles.sideCard} style={{ marginTop: 'auto' }}>
            <button className={`${styles.sendBtn} ${styles.condemnBtn}`} style={{ width: '100%', background: '#8A0303', color: '#fff', border: 'none', padding: '12px' }} onClick={() => alert('Phase 6: Condemn mechanic coming soon!')}>
              CONDEMN THIS HERETIC
            </button>
            <p className={styles.sideHint} style={{ textAlign: 'center', marginTop: '8px' }}>
              Final judgement ends the session.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
