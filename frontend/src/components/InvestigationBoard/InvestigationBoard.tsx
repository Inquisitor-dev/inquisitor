'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { useGameStore, type EvidenceItem } from '@/store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import { outfitThumb, wearableOutfitId } from '@/config/outfits';
import { getPlayerHome } from '@/config/homeConfig';
import { showScene } from '@/components/SceneTransition/sceneStore';
import { homeScene } from '@/components/SceneTransition/scenes';
import {
  allowedStringTypes,
  evidencePhoto,
  evidenceTitle,
  newId,
  NOTE_MAX_LENGTH,
  STRING_TYPE_INFO,
  suspectInfo,
  type BoardCard,
  type BoardState,
  type BoardString,
  type BoardStringType,
} from './boardModel';
import styles from './InvestigationBoard.module.scss';

// Kayıt, son değişiklikten bu kadar sonra yapılır (sürüklerken her karede istek atılmasın)
const SAVE_DELAY_MS = 700;
// Bu kadar pikselden az kayan bir dokunuş sürükleme değil, tıklamadır
const TAP_SLOP = 6;
// Kullanım ipucu bir kez gösterilir (sadece bu tarayıcıda hatırlanır)
const HELP_SEEN_KEY = 'inquisitor-board-help-seen';

const readHelpSeen = () => {
  try {
    return localStorage.getItem(HELP_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Drag =
  | { mode: 'card'; cardId: string; startX: number; startY: number; cardX: number; cardY: number; moved: boolean }
  | { mode: 'string'; fromId: string; startX: number; startY: number; moved: boolean };

export default function InvestigationBoard() {
  const router = useRouter();
  const { sessionId, authToken, hasHydrated, scenarioType, evidence, setEvidence } = useGameStore();
  const scenario = scenarioType || 'medieval';

  const [board, setBoard] = useState<BoardState>({ cards: [], strings: [] });
  const [suspectIds, setSuspectIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [drawerOpen, setDrawerOpen] = useState(true);
  // İp çekerken imlecin panodaki yeri (piksel)
  const [pointer, setPointer] = useState<{ fromId: string; x: number; y: number } | null>(null);
  // Telefonda raptiyeye dokunup sonra başka karta dokunarak ip çekilir
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  // Türü seçilecek ya da düzenlenecek ip
  const [editingString, setEditingString] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 1, h: 1 });
  // Düşün: günde bir kez; son iç ses metni panelde gösterilir
  const [canThink, setCanThink] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thought, setThought] = useState<string | null>(null);
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const [thinkError, setThinkError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // İç ses panelinde oyuncunun giydiği karakterin yüzü görünür
  const { equippedOutfitId, ownedItemIds, hasHydrated: marketHydrated } = useMarketStore();
  const thinkerThumb = marketHydrated ? outfitThumb(wearableOutfitId(equippedOutfitId, ownedItemIds)) : null;

  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!authToken) router.push('/');
    else if (!sessionId) router.push('/menu');
  }, [hasHydrated, authToken, sessionId, router]);

  // Pano, şüpheliler ve kanıtlar sunucudan yüklenir
  useEffect(() => {
    if (!sessionId || !authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    (async () => {
      try {
        const [boardRes, evidenceRes] = await Promise.all([
          fetch(apiUrl(`/game-sessions/${sessionId}/board`), { headers }),
          fetch(apiUrl(`/game-sessions/${sessionId}/evidence`), { headers }),
        ]);
        if (evidenceRes.ok) {
          const data = await evidenceRes.json();
          setEvidence(Array.isArray(data.evidence) ? data.evidence : []);
        }
        if (boardRes.ok) {
          const data = await boardRes.json();
          setBoard(data.board ?? { cards: [], strings: [] });
          setSuspectIds(Array.isArray(data.suspects) ? data.suspects : []);
          setCanThink(Boolean(data.canThink));
          setThought(typeof data.thought === 'string' ? data.thought : null);
          if (!readHelpSeen()) setHelpOpen(true);
        }
      } catch (err) {
        console.error('Failed to load board', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [sessionId, authToken, setEvidence]);

  // Panonun ekrandaki boyutu: iplerin çizimi piksel cinsinden yapılır
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBoardSize({ w: entry.contentRect.width || 1, h: entry.contentRect.height || 1 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  // Değişiklikler gecikmeli kaydedilir
  useEffect(() => {
    if (!dirtyRef.current || !sessionId || !authToken) return;
    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setSaveStatus('saving');
      try {
        const res = await fetch(apiUrl(`/game-sessions/${sessionId}/board`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ board }),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [board, sessionId, authToken]);

  const update = useCallback((fn: (prev: BoardState) => BoardState) => {
    dirtyRef.current = true;
    setBoard(fn);
  }, []);

  const cardById = useMemo(() => new Map(board.cards.map((c) => [c.id, c])), [board.cards]);
  const evidenceById = useMemo(() => new Map(evidence.map((e) => [e.id, e])), [evidence]);

  // Çekmecede: panoya henüz asılmamış şüpheliler ve kanıtlar
  const pinnedRefs = useMemo(() => new Set(board.cards.map((c) => `${c.kind}:${c.refId}`)), [board.cards]);
  const drawerSuspects = suspectIds.filter((id) => !pinnedRefs.has(`suspect:${id}`));
  const drawerEvidence = evidence.filter((e) => !pinnedRefs.has(`evidence:${e.id}`));

  // Yeni kart panonun ortasına yakın, biraz rastgele bir yere asılır
  const pinCard = (card: Omit<BoardCard, 'id' | 'x' | 'y'>) => {
    update((prev) => ({
      ...prev,
      cards: [...prev.cards, { ...card, id: newId(), x: 30 + Math.random() * 40, y: 18 + Math.random() * 30 }],
    }));
  };

  const removeCard = (cardId: string) => {
    update((prev) => ({
      cards: prev.cards.filter((c) => c.id !== cardId),
      strings: prev.strings.filter((s) => s.from !== cardId && s.to !== cardId),
    }));
    if (pendingFrom === cardId) setPendingFrom(null);
  };

  const setNoteText = (cardId: string, text: string) => {
    update((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, text: text.slice(0, NOTE_MAX_LENGTH) } : c)),
    }));
  };

  // İki kart arasına ip çeker; aynı iki kart arasında zaten ip varsa onu düzenlemeye açar
  const connect = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const existing = board.strings.find(
      (s) => (s.from === fromId && s.to === toId) || (s.from === toId && s.to === fromId),
    );
    if (existing) {
      setEditingString(existing.id);
      return;
    }
    const a = cardById.get(fromId);
    const b = cardById.get(toId);
    if (!a || !b) return;
    const string: BoardString = { id: newId(), from: fromId, to: toId, type: 'LINK' };
    update((prev) => ({ ...prev, strings: [...prev.strings, string] }));
    // Türü seçilebilen iplerde seçim kutusu hemen açılır
    if (allowedStringTypes(a.kind, b.kind).length > 1) setEditingString(string.id);
  };

  const setStringType = (stringId: string, type: BoardStringType) => {
    update((prev) => ({
      ...prev,
      // Türü değişen ipin eski kararı geçersizdir
      strings: prev.strings.map((s) => (s.id === stringId ? { id: s.id, from: s.from, to: s.to, type } : s)),
    }));
    setEditingString(null);
  };

  const removeString = (stringId: string) => {
    update((prev) => ({ ...prev, strings: prev.strings.filter((s) => s.id !== stringId) }));
    setEditingString(null);
  };

  const toBoardPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ─── SÜRÜKLEME: kartı taşıma ya da raptiyeden ip çekme ───
  const startCardDrag = (e: ReactPointerEvent, card: BoardCard) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, textarea')) return;
    e.preventDefault();
    // Tutulan kart en öne gelir (kartlar dizideki sıraya göre üst üste çizilir)
    if (board.cards[board.cards.length - 1]?.id !== card.id) {
      update((prev) => ({ ...prev, cards: [...prev.cards.filter((c) => c.id !== card.id), card] }));
    }
    dragRef.current = { mode: 'card', cardId: card.id, startX: e.clientX, startY: e.clientY, cardX: card.x, cardY: card.y, moved: false };
  };

  const startStringDrag = (e: ReactPointerEvent, card: BoardCard) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode: 'string', fromId: card.id, startX: e.clientX, startY: e.clientY, moved: false };
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < TAP_SLOP) return;
      d.moved = true;
      if (d.mode === 'card') {
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.min(98, Math.max(2, d.cardX + ((e.clientX - d.startX) / rect.width) * 100));
        const y = Math.min(92, Math.max(2, d.cardY + ((e.clientY - d.startY) / rect.height) * 100));
        update((prev) => ({ ...prev, cards: prev.cards.map((c) => (c.id === d.cardId ? { ...c, x, y } : c)) }));
      } else {
        setPointer({ fromId: d.fromId, ...toBoardPoint(e.clientX, e.clientY) });
      }
    };
    const handleUp = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;
      if (d.mode === 'string') {
        setPointer(null);
        if (!d.moved) {
          // Raptiyeye dokunuldu: ip başlangıcı seçilir ya da bekleyen ip tamamlanır
          if (pendingFrom && pendingFrom !== d.fromId) {
            connect(pendingFrom, d.fromId);
            setPendingFrom(null);
          } else {
            setPendingFrom((cur) => (cur === d.fromId ? null : d.fromId));
          }
          return;
        }
        // İpler kartların üstünde olduğu için bırakılan noktadaki bütün katmanlara bakılır
        const el = document
          .elementsFromPoint(e.clientX, e.clientY)
          .map((node) => node.closest('[data-card-id]'))
          .find(Boolean);
        const toId = el?.getAttribute('data-card-id');
        if (toId) connect(d.fromId, toId);
      } else if (!d.moved && pendingFrom && pendingFrom !== d.cardId) {
        // Bekleyen bir ip varken karta dokunmak ipi o karta bağlar
        connect(pendingFrom, d.cardId);
        setPendingFrom(null);
      }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setEditingString(null);
      setPendingFrom(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── İPLER ───
  const pinPoint = (card: BoardCard) => ({ x: (card.x / 100) * boardSize.w, y: (card.y / 100) * boardSize.h });
  // Hafif sarkan ip: iki ucun ortasından aşağı doğru eğri
  const stringPath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2 + Math.min(60, len * 0.12);
    return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, mid: { x: cx, y: (a.y + b.y) / 2 + Math.min(60, len * 0.12) / 2 } };
  };

  const editing = editingString ? board.strings.find((s) => s.id === editingString) : null;
  const editingTypes = editing
    ? allowedStringTypes(cardById.get(editing.from)?.kind ?? 'note', cardById.get(editing.to)?.kind ?? 'note')
    : [];
  const editingMid = editing
    ? (() => {
        const a = cardById.get(editing.from);
        const b = cardById.get(editing.to);
        return a && b ? stringPath(pinPoint(a), pinPoint(b)).mid : null;
      })()
    : null;

  // Doğru bir "aklıyor" ipiyle bağlı şüpheli aklanmış sayılır
  const clearedCards = useMemo(() => {
    const set = new Set<string>();
    for (const s of board.strings) {
      if (s.type !== 'CLEARS' || s.verdict !== 'CORRECT') continue;
      for (const id of [s.from, s.to]) if (cardById.get(id)?.kind === 'suspect') set.add(id);
    }
    return set;
  }, [board.strings, cardById]);

  // ─── KARTLAR ───
  const renderCardBody = (card: BoardCard) => {
    if (card.kind === 'suspect' && card.refId) {
      const info = suspectInfo(scenario, card.refId);
      return (
        <div className={`${styles.polaroid} ${styles.suspectCard}`}>
          <div className={styles.photo} style={{ backgroundImage: info.portrait || undefined }} />
          <span className={styles.caption}>{info.name}</span>
          <span className={styles.subCaption}>{info.place}</span>
          {clearedCards.has(card.id) && <span className={styles.stamp}>AKLANDI</span>}
        </div>
      );
    }
    if (card.kind === 'evidence' && card.refId) {
      const item = evidenceById.get(card.refId);
      if (!item) return <div className={styles.paperCard}>Kanıt bulunamadı</div>;
      return renderEvidence(item);
    }
    if (card.kind === 'note') {
      return (
        <div className={styles.stickyNote}>
          <textarea
            className={styles.noteInput}
            value={card.text ?? ''}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Notunu yaz…"
            onChange={(e) => setNoteText(card.id, e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  const renderEvidence = (item: EvidenceItem) => {
    const footer = `${item.dayNumber}. gün`;
    if (item.category === 'STATEMENT') {
      const speaker = suspectInfo(scenario, item.sourceId);
      return (
        <div className={styles.paperCard}>
          <div className={styles.paperHead}>
            {speaker.portrait && <span className={styles.paperPortrait} style={{ backgroundImage: speaker.portrait }} />}
            <span>
              <span className={styles.paperKind}>{evidenceTitle(scenario, item)}</span>
              <span className={styles.paperSpeaker}>{speaker.name}</span>
            </span>
          </div>
          <p className={styles.paperText}>&ldquo;{item.text}&rdquo;</p>
          <span className={styles.cardFooter}>{footer}</span>
        </div>
      );
    }
    const photo = evidencePhoto(scenario, item);
    return (
      <div className={`${styles.polaroid} ${styles.evidenceCard}`}>
        <div className={`${styles.photo} ${photo ? '' : styles.photoEmpty}`} style={{ backgroundImage: photo ? `url(${photo})` : undefined }}>
          {!photo && <span>🔍</span>}
        </div>
        <span className={styles.evidenceKind}>{evidenceTitle(scenario, item)}</span>
        <p className={styles.evidenceText}>{item.text}</p>
        <span className={styles.cardFooter}>{footer}</span>
      </div>
    );
  };

  // İpler sunucuda değerlendirilir; dönen pano kararları (doğru/yanlış) taşır
  const handleThink = async () => {
    if (!sessionId || !authToken || thinking || !canThink) return;
    setThinking(true);
    setThinkError(null);
    setEditingString(null);
    setPendingFrom(null);
    try {
      const res = await fetch(apiUrl(`/game-sessions/${sessionId}/board/think`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ board }),
      });
      const data = await res.json();
      if (!res.ok) {
        setThinkError(data?.message ?? 'Şu an düşünemiyorsun. Birazdan tekrar dene.');
        return;
      }
      setBoard(data.board);
      setThought(data.thought);
      setCanThink(Boolean(data.canThink));
      setThoughtOpen(true);
    } catch {
      setThinkError('Şu an düşünemiyorsun. Birazdan tekrar dene.');
    } finally {
      setThinking(false);
    }
  };

  const closeHelp = () => {
    setHelpOpen(false);
    try {
      localStorage.setItem(HELP_SEEN_KEY, '1');
    } catch {
      // Depolama kapalıysa ipucu bir sonraki açılışta yine görünür
    }
  };

  const goHome = () => {
    const home = getPlayerHome(scenario);
    if (home) showScene(homeScene(home));
  };

  if (!hasHydrated || !loaded) {
    return <div className={styles.loading}>Pano hazırlanıyor…</div>;
  }

  const drawingFrom = pointer ? cardById.get(pointer.fromId) : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/home" className={styles.backBtn} onClick={goHome}>
          ← Eve Dön
        </Link>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Soruşturma Panosu</h1>
          <p className={styles.subtitle}>
            Kartları panoya as, raptiyeden raptiyeye sürükleyerek aralarına ip çek.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.saveStatus} ${saveStatus === 'error' ? styles.saveError : ''}`}>
            {saveStatus === 'saving' ? 'Kaydediliyor…' : saveStatus === 'saved' ? 'Kaydedildi' : saveStatus === 'error' ? 'Kaydedilemedi' : ''}
          </span>
          <button type="button" className={styles.helpBtn} onClick={() => setHelpOpen(true)} aria-label="Pano nasıl kullanılır">
            ?
          </button>
          {thought && !thoughtOpen && (
            <button type="button" className={styles.lastThoughtBtn} onClick={() => setThoughtOpen(true)}>
              Son Düşünce
            </button>
          )}
          <button
            type="button"
            className={styles.thinkBtn}
            onClick={handleThink}
            disabled={!canThink || thinking}
            title={canThink ? 'Panodaki ipleri gözden geçir (günde bir kez)' : 'Bugün düşündün. Yarın yeniden düşünebilirsin.'}
          >
            {thinking ? 'Düşünüyorsun…' : canThink ? 'Düşün' : 'Yarın Düşün'}
          </button>
        </div>
      </header>

      {helpOpen && (
        <div className={styles.helpOverlay} onClick={closeHelp}>
          <div className={styles.helpCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.helpTitle}>Soruşturma Panosu</h2>
            <ol className={styles.helpSteps}>
              <li>
                <strong>Kartları as.</strong>{' '}Alttaki dosyadan bir şüpheliye, kanıta ya da &ldquo;Not Ekle&rdquo;ye
                tıkla; kart panoya asılır. Kartı sürükleyerek yerini değiştir.
              </li>
              <li>
                <strong>İp çek.</strong>{' '}Bir kartın kırmızı raptiyesini başka bir karta sürükle (telefonda önce
                raptiyeye, sonra karta dokun). Sonra ipin anlamını seç: bir kanıt bir şüpheliyi{' '}
                <em>aklıyor</em> ya da <em>suçluyor</em>, iki kanıt birbirini <em>doğruluyor</em> ya da{' '}
                <em>çelişiyor</em>. Fikrini değiştirirsen ipin ortasındaki düğüme tıklayıp anlamını (rengini)
                değiştirebilir ya da ipi koparabilirsin.
              </li>
              <li>
                <strong>Düşün.</strong>{' '}Günde bir kez panona bakıp düşünebilirsin. İç sesin hangi iplerin
                tuttuğunu söyler: doğru ipler mühürlenir, aklanan şüpheliye damga basılır.
              </li>
            </ol>
            <button type="button" className={styles.thinkBtn} onClick={closeHelp}>
              Anladım
            </button>
          </div>
        </div>
      )}

      {thinkError && (
        <div className={styles.thinkError} role="alert">
          {thinkError}
          <button type="button" className={styles.linkBtn} onClick={() => setThinkError(null)}>
            Kapat
          </button>
        </div>
      )}

      {thought && thoughtOpen && (
        <aside className={styles.thoughtPanel} aria-live="polite">
          {thinkerThumb && <span className={styles.thoughtFace} style={{ backgroundImage: `url(${thinkerThumb})` }} />}
          <div className={styles.thoughtBody}>
            <span className={styles.thoughtKicker}>İç Ses</span>
            <p className={styles.thoughtText}>{thought}</p>
          </div>
          <button type="button" className={styles.thoughtClose} onClick={() => setThoughtOpen(false)} aria-label="Kapat">
            ×
          </button>
        </aside>
      )}

      <div className={styles.boardWrap}>
        <div
          className={styles.board}
          data-theme={scenario}
          ref={boardRef}
          onClick={(e) => e.target === e.currentTarget && setPendingFrom(null)}
        >
          <svg className={styles.strings} width={boardSize.w} height={boardSize.h}>
            {board.strings.map((s) => {
              const a = cardById.get(s.from);
              const b = cardById.get(s.to);
              if (!a || !b) return null;
              const { d, mid } = stringPath(pinPoint(a), pinPoint(b));
              const info = STRING_TYPE_INFO[s.type];
              return (
                <g
                  key={s.id}
                  className={`${styles.stringGroup} ${editingString === s.id ? styles.stringEditing : ''}`}
                  onClick={() => setEditingString(s.id)}
                >
                  <title>{`${info.label}: anlamını değiştirmek ya da ipi koparmak için tıkla`}</title>
                  <path d={d} className={styles.stringHit} />
                  <path
                    d={d}
                    className={`${styles.string} ${s.verdict === 'WRONG' ? styles.stringWrong : ''} ${s.verdict === 'CORRECT' ? styles.stringCorrect : ''}`}
                    stroke={info.color}
                  />
                  {/* İpin ortasındaki düğüm: tıklanınca ipin anlamı seçilir */}
                  <g transform={`translate(${mid.x} ${mid.y})`}>
                    <circle r={14} className={styles.knotHit} />
                    {/* Kararsız ipte düğüm (kalem) sadece üzerine gelince görünür; ✓ / ✗ hep görünür */}
                    <circle
                      r={s.verdict ? 11 : 8}
                      className={`${styles.stringKnot} ${s.verdict ? '' : styles.knotIdle}`}
                      fill={info.color}
                    />
                    {s.verdict ? (
                      <text className={styles.stringMark} textAnchor="middle" dy="4">
                        {s.verdict === 'CORRECT' ? '✓' : '✗'}
                      </text>
                    ) : (
                      <text className={`${styles.stringEdit} ${styles.knotIdle}`} textAnchor="middle" dy="3.5">
                        ✎
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
            {drawingFrom && pointer && (
              <path d={stringPath(pinPoint(drawingFrom), pointer).d} className={`${styles.string} ${styles.stringDraft}`} />
            )}
          </svg>

          {board.cards.map((card) => (
            <div
              key={card.id}
              data-card-id={card.id}
              className={`${styles.card} ${pendingFrom === card.id ? styles.cardPending : ''} ${pendingFrom && pendingFrom !== card.id ? styles.cardTarget : ''}`}
              style={{ left: `${card.x}%`, top: `${card.y}%` }}
              onPointerDown={(e) => startCardDrag(e, card)}
            >
              <button type="button" className={styles.removeBtn} title="Panodan kaldır" onClick={() => removeCard(card.id)}>
                ×
              </button>
              {renderCardBody(card)}
            </div>
          ))}

          {/* Raptiyeler ayrı katmanda: iplerin de üstünde kalır, ip buradan çekilir */}
          {board.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              data-card-id={card.id}
              className={`${styles.pin} ${pendingFrom === card.id ? styles.pinActive : ''}`}
              style={{ left: `${card.x}%`, top: `${card.y}%` }}
              title="İp çekmek için sürükle ya da dokun"
              aria-label="Raptiye: ip çek"
              onPointerDown={(e) => startStringDrag(e, card)}
            />
          ))}

          {board.cards.length === 0 && (
            <div className={styles.emptyHint}>
              Pano boş. Aşağıdaki dosyadan bir şüpheliye ya da kanıta tıklayıp panoya as.
            </div>
          )}

          {editing && editingMid && (
            <div
              className={styles.stringMenu}
              style={{ left: Math.min(Math.max(editingMid.x, 120), boardSize.w - 120), top: Math.min(editingMid.y + 14, boardSize.h - 60) }}
            >
              <span className={styles.stringMenuTitle}>İpin anlamı</span>
              <div className={styles.stringMenuTypes}>
                {editingTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.typeBtn} ${editing.type === type ? styles.typeBtnActive : ''}`}
                    style={{ borderColor: STRING_TYPE_INFO[type].color }}
                    title={STRING_TYPE_INFO[type].hint}
                    onClick={() => setStringType(editing.id, type)}
                  >
                    <span className={styles.typeDot} style={{ background: STRING_TYPE_INFO[type].color }} />
                    {STRING_TYPE_INFO[type].label}
                  </button>
                ))}
              </div>
              {editingTypes.length === 1 && (
                <p className={styles.stringMenuNote}>
                  Bu ip Düşün&apos;de değerlendirilmez. Renkli ip için bir şüpheliyi bir kanıta ya da iki kanıtı
                  birbirine bağla.
                </p>
              )}
              <div className={styles.stringMenuFooter}>
                <button type="button" className={styles.linkBtn} onClick={() => removeString(editing.id)}>
                  İpi kopar
                </button>
                <button type="button" className={styles.linkBtn} onClick={() => setEditingString(null)}>
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className={`${styles.drawer} ${drawerOpen ? '' : styles.drawerClosed}`}>
        <button type="button" className={styles.drawerToggle} onClick={() => setDrawerOpen((v) => !v)}>
          {drawerOpen ? 'Dosyayı Kapat ▾' : `Dosyayı Aç ▴ (${drawerSuspects.length + drawerEvidence.length})`}
        </button>
        {drawerOpen && (
          <div className={styles.drawerItems}>
            <button type="button" className={`${styles.drawerItem} ${styles.drawerNote}`} onClick={() => pinCard({ kind: 'note', text: '' })}>
              <span className={styles.drawerIcon}>📝</span>
              <span className={styles.drawerLabel}>Not Ekle</span>
            </button>
            {drawerSuspects.map((id) => {
              const info = suspectInfo(scenario, id);
              return (
                <button key={id} type="button" className={styles.drawerItem} onClick={() => pinCard({ kind: 'suspect', refId: id })}>
                  <span className={styles.drawerThumb} style={{ backgroundImage: info.portrait || undefined }} />
                  <span className={styles.drawerLabel}>{info.name}</span>
                  <span className={styles.drawerSub}>Şüpheli</span>
                </button>
              );
            })}
            {drawerEvidence.map((item) => (
              <button key={item.id} type="button" className={styles.drawerItem} onClick={() => pinCard({ kind: 'evidence', refId: item.id })}>
                <span className={styles.drawerIcon}>{item.category === 'STATEMENT' ? '🗣️' : '🔎'}</span>
                <span className={styles.drawerLabel}>{evidenceTitle(scenario, item)}</span>
                <span className={styles.drawerSub}>{item.text}</span>
              </button>
            ))}
            {drawerSuspects.length === 0 && drawerEvidence.length === 0 && (
              <span className={styles.drawerEmpty}>Dosyadaki her şey panoda. Yeni kanıt buldukça burada görünecek.</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
