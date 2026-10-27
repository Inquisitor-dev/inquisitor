'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Hand, Moon, Skull, Sun } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore, type EvidenceItem } from '@/store/useGameStore';
import { getHomeRoomImage, type HomeRoom } from '@/config/homeConfig';
import type { RaidActResponse, RaidView } from '@/features/raid/raidTypes';
import styles from './RaidScene.module.scss';

// Her odanın kendi görseli var (docs/ev-odalari-gorselleri.md); görseller gündüz çizildi,
// gece CSS ile karartılır, kandil yanınca sıcak bir ışık halkası çıkar
const ROOM_IMAGE_KEY: Record<string, HomeRoom> = {
  BEDROOM: 'bedroom',
  KITCHEN: 'kitchen',
  HALLWAY: 'hallway',
  DOORSTEP: 'doorstep',
};

const OUTCOME_COPY: Record<string, { title: string; body: string }> = {
  GOOD: {
    title: 'Saldırgan kaçtı',
    body: 'Kapı önünde düşürdüğü izi aldın. Sabah onu envanterinde bulacaksın.',
  },
  NEUTRAL: {
    title: 'Gece geçti',
    body: 'Kim olduğunu göremeden gitti. En azından sağ salimsin.',
  },
  BAD: {
    title: 'Baygın uyandın',
    body: 'Sabahın ilk saatlerini kaybettin. Evin aranmış; bulduğun kanıtlardan biri yok. Bu vakanın ödülü de azaldı.',
  },
  DEATH: {
    title: 'Soruşturma burada bitti',
    body: 'Bu gece karanlıktan sağ çıkamadın. Katil bir kez daha gölgelerde kaldı.',
  },
};

export default function RaidScene() {
  const router = useRouter();
  const { sessionId, scenarioType, hasHydrated, endDay, setTimeOfDay, setEvidence, reset } =
    useGameStore();
  const [view, setView] = useState<RaidView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated || !sessionId) return;
    api
      .get<RaidView>(`/game-sessions/${sessionId}/raid`)
      .then((data) => {
        // Süren baskın yoksa burada işi yok
        if (!data.active && !data.outcome) router.replace('/map');
        else setView(data);
      })
      .catch((err) => {
        logger.error('Failed to load raid', err);
        router.replace('/map');
      });
  }, [hasHydrated, sessionId, router]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [view?.log?.length]);

  const actOn = async (action: string) => {
    if (!sessionId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<RaidActResponse>(`/game-sessions/${sessionId}/raid/act`, { action });
      setView(data.raid);
      if (data.raid.outcome && data.raid.outcome !== 'DEATH') {
        // Baskın bitti: gün kapandı; sabahı ve kanıtları tazele
        endDay();
        setTimeOfDay(data.session.timeOfDay);
        const ev = await api.get<{ evidence?: EvidenceItem[] } | EvidenceItem[]>(
          `/game-sessions/${sessionId}/evidence`,
        );
        setEvidence(Array.isArray(ev) ? ev : (ev.evidence ?? []));
      }
    } catch (err) {
      logger.error('Raid action failed', err);
      setError('Aksiyon yapılamadı. Bir daha dene.');
    } finally {
      setBusy(false);
    }
  };

  if (!view) return <main className={styles.scene} aria-busy="true" />;

  const outcome = view.outcome ? OUTCOME_COPY[view.outcome] : null;
  const turnsLeft = (view.maxTurns ?? 6) - (view.turn ?? 0);
  const roomImage = getHomeRoomImage(scenarioType || 'medieval', ROOM_IMAGE_KEY[view.room ?? 'BEDROOM'] ?? 'bedroom');

  return (
    <main
      className={`${styles.scene} ${view.light ? styles.lit : ''}`}
      style={{
        backgroundImage: roomImage ? `url(${roomImage})` : undefined,
      }}
    >
      <div className={styles.darkness} aria-hidden />
      {view.light && <div className={styles.lampGlow} aria-hidden />}

      <header className={styles.hud}>
        <p className={styles.kicker}>
          <Moon size={14} aria-hidden /> Gece baskını
        </p>
        <h1 className={styles.room}>{view.roomName}</h1>
        <div className={styles.status}>
          <span title="Işık">
            {view.light ? <Flame size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
            {view.light ? 'Işık yanıyor' : 'Karanlık'}
          </span>
          <span title="Elindeki">
            <Hand size={15} aria-hidden />
            {view.holding === 'KNIFE' ? 'Bıçak' : view.holding === 'GUN' ? 'Tabanca' : 'Elin boş'}
          </span>
          {!outcome && <span>{turnsLeft} hamle</span>}
        </div>
      </header>

      <section className={styles.panel} aria-live="polite">
        <div ref={logRef} className={styles.log}>
          {(view.log ?? []).map((line, i) => (
            <p key={i} className={i === (view.log?.length ?? 0) - 1 ? styles.latest : undefined}>
              {line}
            </p>
          ))}
        </div>

        {outcome ? (
          <div className={`${styles.outcome} ${styles[`outcome_${view.outcome}`] ?? ''}`}>
            <h2>
              {view.outcome === 'DEATH' ? <Skull size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
              {outcome.title}
            </h2>
            <p>{outcome.body}</p>
            {view.outcome === 'DEATH' ? (
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.push('/menu');
                }}
              >
                Menüye dön
              </button>
            ) : (
              <button type="button" onClick={() => router.push('/map')}>
                Sabaha geç
              </button>
            )}
          </div>
        ) : (
          <div className={styles.actions}>
            {(view.actions ?? []).map((a) => (
              <button key={a.id} type="button" disabled={busy} onClick={() => actOn(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>
    </main>
  );
}
