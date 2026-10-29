'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, Eye, EyeOff, Lightbulb, Search, X } from 'lucide-react';
import { api, ApiError } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import { getInterior } from '@/config/interiorConfig';
import { getLocationLabel } from '@/config/locationLabels';
import type { EvidenceItem } from '@/store/slices/types';
import type {
  SearchAvailability,
  SearchClickResult,
  SearchHintResult,
  SearchStartResult,
  SearchTestSpots,
  SearchView,
} from './searchTypes';
import { useSearchPan } from './useSearchPan';
import styles from './SearchScene.module.scss';

// Tıklamanın yerinde kısa süre görünen işaret (bulundu ya da ıska)
type Mark = { key: number; x: number; y: number; kind: 'found' | 'miss' };

const MARK_MS = 900;
const FINAL_NOTICE_MS = 3500;
const formatTime = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// Mekân araması (tıkla-bul): kanıtın bulunduğu alanın dağınık sahnesinde listedeki nesneler, sonra asıl
// yer bulunur. Asıl yer bulununca mekânın ipucu Envanter'e düşer. Doğrulamayı sunucu yapar.
// areaId: iç mekânda seçilen alan; kanıt yalnızca bir alandadır (sunucunun openArea'sı), öbürleri kilitlidir
export default function SearchScene({ locationId, areaId }: { locationId: string; areaId: string | null }) {
  const { sessionId, scenarioType, hasHydrated, addEvidence, consumeWarrant, setTimeOfDay } = useGameStore();
  const scenario = scenarioType || 'medieval';
  const interior = getInterior(scenario, locationId);
  const backHref = interior ? `/interior/${locationId}` : '/map';

  const [area, setArea] = useState<string | null>(areaId);
  const [view, setView] = useState<SearchView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clue, setClue] = useState<EvidenceItem | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [hint, setHint] = useState<SearchHintResult['hint'] | null>(null);
  // Liste bitip asıl yer aramasına geçilince sahnede kısa bir duyuru çıkar
  const [finalNotice, setFinalNotice] = useState(false);
  // Test modu: işaretlemeyi denetlemek için süren denemenin kutuları (yalnızca geliştirmede, test oturumunda)
  const [testSpots, setTestSpots] = useState<SearchTestSpots | null>(null);
  const [aspectRatio, setAspectRatio] = useState(3168 / 1344);
  // Süre istemcide geri sayılır; her cevapta sunucunun değeriyle eşitlenir
  const [remaining, setRemaining] = useState(0);
  const syncedAt = useRef({ at: 0, ms: 0 });

  const running = view?.status === 'RUNNING';
  const overlayOpen = !view || view.status !== 'RUNNING';
  const { stageRef, frameW, frameH, pan, focus, isDragging, handlePointerDown, handleClickCapture } = useSearchPan(
    aspectRatio,
    overlayOpen
  );

  // Sunucunun cevabı: aramanın görünümü ve (başarısız arama vakit harcadıysa) günün vakti
  const applyView = useCallback(
    (next: SearchView, timeOfDay?: number) => {
      setView(next);
      syncedAt.current = { at: Date.now(), ms: next.remainingMs };
      setRemaining(next.remainingMs);
      if (typeof timeOfDay === 'number') setTimeOfDay(timeOfDay);
    },
    [setTimeOfDay]
  );

  const fail = (err: unknown) => {
    logger.error('Search request failed', err);
    setError(err instanceof ApiError ? err.message : 'Arama sırasında bir sorun çıktı.');
  };

  useEffect(() => {
    if (!hasHydrated || !sessionId) return;
    let cancelled = false;
    api
      .get<SearchAvailability>(`/game-sessions/${sessionId}/search/${locationId}`)
      .then((res) => {
        if (cancelled) return;
        if (!res.available) {
          setError('Bu mekânın arama sahnesi henüz hazır değil.');
          return;
        }
        // Kanıtın olmadığı alan aranmaz (iç mekân onu zaten kilitli gösterir)
        if (areaId && areaId !== res.openArea) {
          setError('Burada aranmaya değer bir şey görünmüyor.');
          return;
        }
        setArea(res.openArea);
        if (res.view) applyView(res.view, res.timeOfDay);
        else if (typeof res.timeOfDay === 'number') setTimeOfDay(res.timeOfDay);
      })
      .catch((err: unknown) => {
        if (!cancelled) fail(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, sessionId, locationId, areaId, applyView, setTimeOfDay]);

  // Geri sayım; süre dolunca sunucudan son durum okunur (başarısız sayılır)
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, syncedAt.current.ms - (Date.now() - syncedAt.current.at));
      setRemaining(left);
      if (left === 0 && sessionId) {
        window.clearInterval(timer);
        api
          .get<SearchAvailability>(`/game-sessions/${sessionId}/search/${locationId}`)
          .then((res) => res.view && applyView(res.view, res.timeOfDay))
          .catch(fail);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, sessionId, locationId, applyView]);

  const start = async () => {
    if (!sessionId || !area || busy) return;
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      const res = await api.post<SearchStartResult>(`/game-sessions/${sessionId}/search/${locationId}/start`, {
        areaId: area,
      });
      applyView(res.view, res.timeOfDay);
      setTestSpots(null);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  // Kazanılan arama sunucuda izni harcar; istemcinin izin listesi de güncellenir
  const finish = (view: SearchView, evidence: EvidenceItem[]) => {
    if (view.status === 'WON') consumeWarrant(locationId);
    if (evidence.length === 0) return;
    addEvidence(evidence);
    setClue(evidence[0]);
  };

  const addMark = (x: number, y: number, kind: Mark['kind']) => {
    const key = Date.now() + Math.random();
    setMarks((m) => [...m, { key, x, y, kind }]);
    window.setTimeout(() => setMarks((m) => m.filter((mark) => mark.key !== key)), MARK_MS);
  };

  const handleSceneClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sessionId || !running || busy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBusy(true);
    try {
      const res = await api.post<SearchClickResult>(`/game-sessions/${sessionId}/search/${locationId}/click`, {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
      if (res.outcome === 'FOUND' || res.outcome === 'FINAL_FOUND') {
        addMark(x, y, 'found');
        setHint(null);
      } else if (res.outcome === 'MISS') addMark(x, y, 'miss');
      if (view?.stage === 'LIST' && res.view.stage === 'FINAL' && res.view.status === 'RUNNING') {
        setFinalNotice(true);
        window.setTimeout(() => setFinalNotice(false), FINAL_NOTICE_MS);
      }
      applyView(res.view, res.timeOfDay);
      finish(res.view, res.evidence);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const requestHint = async () => {
    if (!sessionId || !running || busy) return;
    setBusy(true);
    try {
      const res = await api.post<SearchHintResult>(`/game-sessions/${sessionId}/search/${locationId}/hint`);
      setHint(res.hint);
      // Görselin taşan kısmındaysa daire görünüme gelsin
      focus(res.hint.x, res.hint.y);
      applyView(res.view, res.timeOfDay);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const toggleTestSpots = async () => {
    if (testSpots) {
      setTestSpots(null);
      return;
    }
    if (!sessionId || busy) return;
    try {
      setTestSpots(await api.get<SearchTestSpots>(`/game-sessions/${sessionId}/search/${locationId}/test-spots`));
    } catch (err) {
      fail(err);
    }
  };

  const testSolve = async () => {
    if (!sessionId || busy) return;
    setBusy(true);
    try {
      const res = await api.post<{ view: SearchView; evidence: EvidenceItem[] }>(
        `/game-sessions/${sessionId}/search/${locationId}/test-solve`
      );
      applyView(res.view);
      finish(res.view, res.evidence);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const locationName = interior?.name ?? getLocationLabel(locationId, scenario);
  const areaName = interior?.hotspots.find((h) => h.id === (view?.areaId ?? area))?.title;
  const placeName = areaName ? `${locationName} · ${areaName}` : locationName;
  const image = view?.image ?? interior?.backgroundImage;
  const lowTime = running && remaining < 20_000;

  return (
    <div className={styles.viewport}>
      {/* ─── ÜST ŞERİT ─── */}
      <div className={styles.topBar}>
        <Link href={backHref} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden /> <span className={styles.backText}>Aramayı bırak</span>
        </Link>
        <div className={styles.title}>
          <Search size={16} aria-hidden /> {placeName}
        </div>
        {running && view && (
          <div className={styles.tools}>
            <span className={`${styles.timer} ${lowTime ? styles.timerLow : ''}`}>
              <Clock size={16} aria-hidden /> {formatTime(remaining)}
            </span>
            <button
              type="button"
              className={styles.hintBtn}
              onClick={requestHint}
              disabled={busy || view.hintsLeft === 0}
              title="İpucu süreden yer"
            >
              <Lightbulb size={16} aria-hidden /> İpucu ({view.hintsLeft})
            </button>
            {process.env.NODE_ENV !== 'production' && (
              <>
                <button
                  type="button"
                  className={styles.hintBtn}
                  onClick={toggleTestSpots}
                  aria-pressed={testSpots !== null}
                  title="Yalnızca test modundaki oturumlarda çalışır"
                >
                  {testSpots ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />} Test: yerler
                </button>
                <button type="button" className={styles.hintBtn} onClick={testSolve} disabled={busy}>
                  Test: bitir
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── SAHNE: GÖRSEL ŞERİTLERİN ARASINI DOLDURUR, TAŞAN KISIM SÜRÜKLENİR ─── */}
      <div
        ref={stageRef}
        className={`${styles.stage} ${isDragging ? styles.dragging : ''}`}
        onPointerDown={handlePointerDown}
      >
        {image && (
          <div
            className={styles.sceneFrame}
            style={{
              width: `${frameW}px`,
              height: `${frameH}px`,
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
            }}
            onClickCapture={handleClickCapture}
            onClick={handleSceneClick}
          >
            <img
              src={image}
              alt={placeName}
              className={styles.sceneImage}
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight) setAspectRatio(naturalWidth / naturalHeight);
              }}
            />
            {hint && (
              <span
                className={styles.hint}
                style={{
                  left: `${hint.x - hint.r}%`,
                  top: `${hint.y - hint.r}%`,
                  width: `${hint.r * 2}%`,
                  height: `${hint.r * 2}%`,
                }}
              />
            )}
            {running &&
              testSpots?.targets.map((t) => (
                <span
                  key={t.id}
                  className={`${styles.testBox} ${view?.targets.find((v) => v.id === t.id)?.found ? styles.testBoxFound : ''}`}
                  style={{ left: `${t.box[0]}%`, top: `${t.box[1]}%`, width: `${t.box[2]}%`, height: `${t.box[3]}%` }}
                >
                  <span className={styles.testLabel}>{t.label}</span>
                </span>
              ))}
            {running &&
              testSpots?.finalSpots.map((f) => (
                <span
                  key={f.id}
                  className={f.current ? styles.testFinal : styles.testFinalOther}
                  style={{ left: `${f.box[0]}%`, top: `${f.box[1]}%`, width: `${f.box[2]}%`, height: `${f.box[3]}%` }}
                >
                  <span className={styles.testLabel}>{f.current ? 'Asıl yer' : f.id}</span>
                </span>
              ))}
            {marks.map((m) => (
              <span
                key={m.key}
                className={m.kind === 'found' ? styles.markFound : styles.markMiss}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {m.kind === 'found' ? <Check size={20} aria-hidden /> : <X size={20} aria-hidden />}
              </span>
            ))}
          </div>
        )}

        {finalNotice && view?.stage === 'FINAL' && (
          <div className={styles.notice} role="status">
            <strong>Bütün eşyaları buldun.</strong>
            <span>Şimdi kanıtın saklandığı yeri bul.</span>
          </div>
        )}
      </div>

      {/* ─── ALT ŞERİT: ARANACAKLAR ─── */}
      {running && view && (
        <div className={styles.tray}>
          {view.stage === 'LIST' ? (
            <ul className={styles.targets}>
              {view.targets.map((t) => (
                <li key={t.id} className={t.found ? styles.targetFound : styles.target}>
                  {t.found && <Check size={14} aria-hidden />} {t.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.finalStage}>
              <span className={styles.finalLabel}>Son adım · Kanıtın saklandığı yeri bul ve üzerine tıkla</span>
              <p className={styles.prompt}>{view.prompt}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── GİRİŞ, SONUÇ VE HATA PENCERELERİ ─── */}
      {overlayOpen && !loading && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
          <div className={styles.card}>
            {error ? (
              <>
                <h1 id="search-dialog-title" className={styles.cardTitle}>Arama yapılamıyor</h1>
                <p className={styles.cardText}>{error}</p>
                <div className={styles.actions}>
                  <Link href={backHref} className={styles.secondaryBtn}>Mekâna dön</Link>
                </div>
              </>
            ) : view?.status === 'WON' ? (
              <>
                <h1 id="search-dialog-title" className={styles.cardTitle}>Bir şey buldun</h1>
                {clue ? (
                  <blockquote className={styles.clue}>{clue.text}</blockquote>
                ) : (
                  <p className={styles.cardText}>Bu mekânda bulduğun kanıt Envanter&rsquo;inde.</p>
                )}
                <p className={styles.cardNote}>Kanıt Envanter&rsquo;ine eklendi.</p>
                <div className={styles.actions}>
                  <Link href={backHref} className={styles.secondaryBtn}>Mekâna dön</Link>
                  <Link href="/map" className={styles.primaryBtn}>Haritaya dön</Link>
                </div>
              </>
            ) : view?.status === 'FAILED' ? (
              <>
                <h1 id="search-dialog-title" className={styles.cardTitle}>Süre doldu</h1>
                <p className={styles.cardText}>
                  Aradığını bulamadan zaman tükendi ve günün bir vakti geçti. Arama iznin hâlâ geçerli; burayı
                  yeniden arayabilirsin, bu sefer başka eşyalar istenecek.
                </p>
                <div className={styles.actions}>
                  <Link href={backHref} className={styles.secondaryBtn}>Mekâna dön</Link>
                  <button type="button" className={styles.primaryBtn} onClick={start} disabled={busy}>
                    Yeniden ara
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 id="search-dialog-title" className={styles.cardTitle}>{placeName}: arama</h1>
                <p className={styles.cardText}>
                  Ortalık dağınık. Önce listedeki eşyaları bul ve üzerlerine tıkla; sonra asıl aradığın yeri
                  göreceksin. Yanlış tıklamalar süreden yer; süre biterse günün bir vakti geçer.
                </p>
                <div className={styles.actions}>
                  <Link href={backHref} className={styles.secondaryBtn}>Vazgeç</Link>
                  <button type="button" className={styles.primaryBtn} onClick={start} disabled={busy}>
                    Aramaya başla
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
