'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  GripVertical,
  HelpCircle,
  Paperclip,
  PenLine,
  PenTool,
  Undo2,
  X,
} from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { playPageTurnSound } from '@/features/audio/pageSound';
import { useGameStore, type EvidenceItem } from '@/store/useGameStore';
import EvidencePolaroid from '@/components/EvidencePolaroid/EvidencePolaroid';
import { evidencePhoto, evidenceTitle } from '@/components/InvestigationBoard/boardModel';
import {
  clamp,
  DEFAULT_TEXT_WIDTH,
  MAX_CAPTION_LENGTH,
  MAX_TEXT_LENGTH,
  newItemId,
  NOTEBOOK_DAYS,
  PEN_COLORS,
  randomTilt,
  recordLabel,
  simplifyStroke,
  spreadCount,
  strokeHit,
  strokePath,
  type PenColor,
  type NotebookItem,
  type NotebookPage,
  type NotebookPhotoItem,
  type NotebookRecord,
  type NotebookRecordItem,
  type NotebookState,
  type NotebookStrokeItem,
  type NotebookTextItem,
} from './notebookModel';
import styles from './Notebook.module.scss';

const SAVE_DELAY_MS = 700;
// Telefonda bu kadar yatay kaydırma sayfayı çevirir (piksel)
const SWIPE_DISTANCE = 60;
// Kullanım ipucu bir kez gösterilir (sadece bu tarayıcıda hatırlanır)
const HELP_SEEN_KEY = 'inquisitor-notebook-help-seen';

const readHelpSeen = () => {
  try {
    return localStorage.getItem(HELP_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
// Silginin çizgiye ne kadar yakından değmesi gerektiği (piksel)
const ERASER_RADIUS = 12;

// Kalem çizgilerinin rengi: mürekkep temanın yazı rengini izler
const PEN_STROKE: Record<PenColor, string> = {
  ink: 'var(--ink)',
  red: 'var(--pen-red)',
  blue: 'var(--pen-blue)',
};

// Geri al için: kalemle eklenen ya da silgiyle silinen çizgiler
type InkAction = { type: 'add'; id: string } | { type: 'erase'; strokes: NotebookStrokeItem[] };
const FLIP_MS = 600;

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

interface DragState {
  id: string;
  pointerId: number;
  // İşaretçinin öğenin sol üst köşesine uzaklığı (piksel)
  offsetX: number;
  offsetY: number;
}

// Yazdıkça uzayan yazı alanı
function AutoTextarea({
  value,
  onChange,
  onBlur,
  autoFocus,
  placeholder = 'Bir şeyler yaz…',
  maxLength = MAX_TEXT_LENGTH,
  className = styles.textInput,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoFocus: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      rows={1}
      maxLength={maxLength}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

// Not Defteri: iki sayfalık açık defter. İlk sayfa çifti vaka dosyası ve hızlı notlar,
// sonrakiler her oyun günü için birer sayfa çifti. Yazılar sayfaya serbestçe yerleştirilir,
// itiraf ve tanıklıklar alındıkları günün sayfasına damgalı kayıt kartı olarak düşer.
export default function Notebook({ onClose }: { onClose: () => void }) {
  const { sessionId, scenarioType, scenario, notes, setNotes, evidence, setEvidence, crimeScene } =
    useGameStore();
  const theme = scenarioType || 'medieval';
  const isNarrow = useMediaQuery('(max-width: 820px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [items, setItems] = useState<NotebookItem[]>([]);
  const [records, setRecords] = useState<NotebookRecord[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [spread, setSpread] = useState<number | null>(null);
  const [narrowPage, setNarrowPage] = useState<NotebookPage>('L');
  // Sayfa çevrilirken dönen yaprak; çevirme bitince kaldırılır, bir sonrakinde yeniden oynar
  const [flip, setFlip] = useState<{ dir: 'next' | 'prev' } | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [quickNotes, setQuickNotes] = useState(notes);
  const [helpOpen, setHelpOpen] = useState(false);
  const swipeRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  // Kanıt çekmecesi ve yapıştırılmak üzere seçilen kanıt
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [placingId, setPlacingId] = useState<string | null>(null);
  // Kalem araçları
  const [tool, setTool] = useState<'pen' | 'eraser' | null>(null);
  const [penColor, setPenColor] = useState<PenColor>('ink');
  const [penSize, setPenSize] = useState<1 | 2>(1);
  const [liveStroke, setLiveStroke] = useState<{ page: NotebookPage; points: number[] } | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const inkHistory = useRef<InkAction[]>([]);
  const drawingRef = useRef<{ page: NotebookPage; pointerId: number; points: number[] } | null>(null);
  const itemEvidence = evidence.filter((item) => item.category === 'ITEM');

  const pageRefs = useRef<Record<NotebookPage, HTMLDivElement | null>>({ L: null, R: null });
  const itemsRef = useRef(items);
  const dirtyRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Defter açılınca sunucudan yüklenir ve bugünün sayfasında açılır
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .get<{ notebook: NotebookState; records: NotebookRecord[]; currentDay: number }>(
        `/game-sessions/${sessionId}/notebook`,
      )
      .then((data) => {
        if (cancelled) return;
        setItems(data.notebook?.items ?? []);
        setRecords(data.records ?? []);
        const day = data.currentDay ?? 1;
        setCurrentDay(day);
        setSpread(clamp(day, 1, NOTEBOOK_DAYS));
        if (!readHelpSeen()) setHelpOpen(true);
      })
      .catch((err) => {
        logger.error('Failed to load notebook', err);
        if (!cancelled) setSpread(0);
      });
    // Çekmecedeki kanıt fotoğrafları için güncel kanıt listesi
    api
      .get<{ evidence?: EvidenceItem[] }>(`/game-sessions/${sessionId}/evidence`)
      .then((data) => {
        if (!cancelled && Array.isArray(data?.evidence)) setEvidence(data.evidence);
      })
      .catch((err) => logger.error('Failed to load evidence', err));
    return () => {
      cancelled = true;
    };
  }, [sessionId, setEvidence]);

  const persist = useCallback(
    async (next: NotebookItem[]) => {
      if (!sessionId) return;
      dirtyRef.current = false;
      try {
        await api.put(`/game-sessions/${sessionId}/notebook`, { notebook: { items: next } });
      } catch (err) {
        logger.error('Failed to save notebook', err);
      }
    },
    [sessionId],
  );

  // Değişiklikler kısa bir beklemeden sonra kendiliğinden kaydedilir
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = window.setTimeout(() => void persist(items), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [items, persist]);

  const changeItems = (updater: (prev: NotebookItem[]) => NotebookItem[]) => {
    dirtyRef.current = true;
    setItems(updater);
  };

  const saveQuickNotes = () => {
    if (quickNotes === notes || !sessionId) return;
    setNotes(quickNotes);
    api
      .post(`/game-sessions/${sessionId}/notes`, { notes: quickNotes })
      .catch((err) => logger.error('Failed to save notes', err));
  };

  const close = () => {
    saveQuickNotes();
    if (dirtyRef.current) void persist(itemsRef.current);
    onClose();
  };

  const total = spreadCount(currentDay, items, records);
  const current = spread ?? 0;

  const goToSpread = (target: number, landing: NotebookPage = 'L') => {
    if (spread === null || flip || target < 0 || target >= total) return;
    if (target === spread) {
      setNarrowPage(landing);
      return;
    }
    setFocusId(null);
    playPageTurnSound();
    if (reducedMotion) {
      setSpread(target);
      setNarrowPage(landing);
      return;
    }
    setFlip({ dir: target > spread ? 'next' : 'prev' });
    window.setTimeout(() => {
      setSpread(target);
      setNarrowPage(landing);
    }, FLIP_MS / 2);
    window.setTimeout(() => setFlip(null), FLIP_MS);
  };

  // Telefonda tek sayfa görünür: önce sol, sonra sağ sayfa, sonra sonraki gün
  const next = () => {
    if (isNarrow && narrowPage === 'L') {
      playPageTurnSound();
      setNarrowPage('R');
    } else goToSpread(current + 1, 'L');
  };
  const prev = () => {
    if (isNarrow && narrowPage === 'R') {
      playPageTurnSound();
      setNarrowPage('L');
    } else goToSpread(current - 1, isNarrow ? 'R' : 'L');
  };

  const closeHelp = () => {
    setHelpOpen(false);
    try {
      localStorage.setItem(HELP_SEEN_KEY, '1');
    } catch {
      // Tarayıcı kaydı engellerse ipucu bir sonraki açılışta yeniden çıkar
    }
  };

  // Telefonda boş sayfa üzerinde yana kaydırınca sayfa çevrilir
  const onSwipeStart = (e: React.PointerEvent) => {
    if (!isNarrow || tool || addMode || placingId) return;
    if (!(e.target as HTMLElement).className?.toString().includes('page')) return;
    swipeRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  };
  const onSwipeEnd = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.pointerId !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next();
    else prev();
  };

  // ─── Öğeler ───
  const pointOnPage = (page: NotebookPage, clientX: number, clientY: number) => {
    const rect = pageRefs.current[page]?.getBoundingClientRect();
    if (!rect) return { x: 10, y: 20 };
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 92),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 92),
    };
  };

  const addText = (page: NotebookPage, clientX?: number, clientY?: number) => {
    if (current < 1) return;
    const point =
      clientX === undefined || clientY === undefined
        ? { x: 10, y: 22 }
        : pointOnPage(page, clientX, clientY);
    const item: NotebookTextItem = {
      id: newItemId(),
      kind: 'text',
      day: current,
      page,
      x: point.x,
      y: point.y,
      w: Math.min(DEFAULT_TEXT_WIDTH, 100 - point.x),
      text: '',
    };
    // Boş yazı kaydedilmez; oyuncu yazmaya başlayınca kayıt tetiklenir
    setItems((prev) => [...prev, item]);
    setFocusId(item.id);
    setAddMode(false);
  };

  const addPhoto = (page: NotebookPage, clientX: number, clientY: number) => {
    if (!placingId || current < 1) return;
    const point = pointOnPage(page, clientX, clientY);
    const item: NotebookPhotoItem = {
      id: newItemId(),
      kind: 'photo',
      day: current,
      page,
      x: clamp(point.x - 6, 0, 70),
      y: clamp(point.y - 6, 0, 80),
      evidenceId: placingId,
      caption: '',
      rot: randomTilt(),
    };
    changeItems((prev) => [...prev, item]);
    setPlacingId(null);
  };

  // Çekmeceden bir kanıt seçilir; vaka dosyasındaysan bugünün sayfasına geçilir
  const choosePhoto = (evidenceId: string) => {
    setAddMode(false);
    setTool(null);
    setPlacingId((selected) => (selected === evidenceId ? null : evidenceId));
    if (current === 0) goToSpread(clamp(currentDay, 1, NOTEBOOK_DAYS));
  };

  const updateCaption = (id: string, caption: string) =>
    changeItems((prev) =>
      prev.map((item) => (item.id === id && item.kind === 'photo' ? { ...item, caption } : item)),
    );

  const updateText = (id: string, text: string) =>
    changeItems((prev) =>
      prev.map((item) => (item.id === id && item.kind === 'text' ? { ...item, text } : item)),
    );

  const removeItem = (id: string) => changeItems((prev) => prev.filter((item) => item.id !== id));

  const blurText = (id: string) => {
    setFocusId((focused) => (focused === id ? null : focused));
    const item = itemsRef.current.find((i) => i.id === id);
    if (item?.kind === 'text' && !item.text.trim()) removeItem(id);
  };

  const onPageClick = (page: NotebookPage, e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (placingId) addPhoto(page, e.clientX, e.clientY);
    else if (addMode) addText(page, e.clientX, e.clientY);
  };

  // ─── Kalem ───
  const pushInk = (action: InkAction) => {
    inkHistory.current.push(action);
    setUndoCount(inkHistory.current.length);
  };

  const undoInk = () => {
    const action = inkHistory.current.pop();
    setUndoCount(inkHistory.current.length);
    if (!action) return;
    if (action.type === 'add') changeItems((prev) => prev.filter((item) => item.id !== action.id));
    else changeItems((prev) => [...prev, ...action.strokes]);
  };

  const chooseTool = (next: 'pen' | 'eraser' | null) => {
    setAddMode(false);
    setPlacingId(null);
    setTool(next);
    if (next && current === 0) goToSpread(clamp(currentDay, 1, NOTEBOOK_DAYS));
  };

  const eraseAt = (page: NotebookPage, clientX: number, clientY: number) => {
    const rect = pageRefs.current[page]?.getBoundingClientRect();
    if (!rect) return;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const hit = itemsRef.current.filter(
      (item): item is NotebookStrokeItem =>
        item.kind === 'stroke' &&
        item.day === current &&
        item.page === page &&
        strokeHit(item.points, px, py, rect.width, rect.height, ERASER_RADIUS),
    );
    if (hit.length === 0) return;
    const ids = new Set(hit.map((s) => s.id));
    itemsRef.current = itemsRef.current.filter((item) => !ids.has(item.id));
    changeItems((prev) => prev.filter((item) => !ids.has(item.id)));
    pushInk({ type: 'erase', strokes: hit });
  };

  const onInkDown = (page: NotebookPage, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'eraser') {
      drawingRef.current = { page, pointerId: e.pointerId, points: [] };
      eraseAt(page, e.clientX, e.clientY);
      return;
    }
    const point = pointOnPage(page, e.clientX, e.clientY);
    drawingRef.current = { page, pointerId: e.pointerId, points: [point.x, point.y] };
    setLiveStroke({ page, points: [point.x, point.y] });
  };

  const onInkMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drawing = drawingRef.current;
    if (!drawing || drawing.pointerId !== e.pointerId) return;
    if (tool === 'eraser') {
      eraseAt(drawing.page, e.clientX, e.clientY);
      return;
    }
    const rect = pageRefs.current[drawing.page]?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    const pts = drawing.points;
    // Çok yakın noktalar eklenmez
    if (Math.hypot(x - pts[pts.length - 2], y - pts[pts.length - 1]) < 0.3) return;
    pts.push(x, y);
    setLiveStroke({ page: drawing.page, points: [...pts] });
  };

  const onInkUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drawing = drawingRef.current;
    if (!drawing || drawing.pointerId !== e.pointerId) return;
    drawingRef.current = null;
    setLiveStroke(null);
    if (tool !== 'pen') return;
    const pts = drawing.points;
    // Tek dokunuş bir nokta olarak çizilir
    const points = simplifyStroke(pts.length === 2 ? [pts[0], pts[1], pts[0] + 0.1, pts[1]] : pts);
    if (points.length < 4) return;
    const stroke: NotebookStrokeItem = {
      id: newItemId(),
      kind: 'stroke',
      day: current,
      page: drawing.page,
      color: penColor,
      size: penSize,
      points,
    };
    changeItems((prev) => [...prev, stroke]);
    pushInk({ type: 'add', id: stroke.id });
  };

  // Klavye: oklarla sayfa çevrilir, Escape kapatır (yazı yazarken oklar imleci taşır)
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.tagName === 'TEXTAREA';
      if (e.key === 'Escape') {
        if (helpOpen) closeHelp();
        else if (placingId || addMode || tool) {
          setPlacingId(null);
          setAddMode(false);
          setTool(null);
        } else close();
      } else if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoInk();
      }
      else if (!typing && e.key === 'ArrowRight') next();
      else if (!typing && e.key === 'ArrowLeft') prev();
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── Sürükleme ───
  const startDrag = (e: React.PointerEvent, id: string, element: HTMLElement | null) => {
    if (!element) return;
    e.preventDefault();
    const rect = element.getBoundingClientRect();
    setDrag({ id, pointerId: e.pointerId, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
  };

  // Sayfanın başında sıralanan kayıt kartı ilk taşındığında defterde bir yer kazanır
  const startRecordDrag = (e: React.PointerEvent, record: NotebookRecord, element: HTMLElement | null) => {
    if (!element) return;
    const existing = items.find(
      (item) => item.kind === 'record' && item.evidenceId === record.evidenceId,
    );
    if (existing) {
      startDrag(e, existing.id, element);
      return;
    }
    const pageEl = pageRefs.current.L;
    const rect = element.getBoundingClientRect();
    const pageRect = pageEl?.getBoundingClientRect();
    const item: NotebookRecordItem = {
      id: newItemId(),
      kind: 'record',
      day: record.day,
      page: 'L',
      x: pageRect ? clamp(((rect.left - pageRect.left) / pageRect.width) * 100, 0, 92) : 8,
      y: pageRect ? clamp(((rect.top - pageRect.top) / pageRect.height) * 100, 0, 92) : 16,
      evidenceId: record.evidenceId,
    };
    changeItems((prev) => [...prev, item]);
    startDrag(e, item.id, element);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      // İşaretçinin altındaki sayfa: öğe sol ve sağ sayfa arasında taşınabilir
      const left = pageRefs.current.L?.getBoundingClientRect();
      const right = pageRefs.current.R?.getBoundingClientRect();
      const page: NotebookPage | null =
        right && e.clientX >= right.left && right.width > 0 ? 'R' : left && left.width > 0 ? 'L' : null;
      const rect = page === 'R' ? right : left;
      if (!page || !rect) return;
      const x = clamp(((e.clientX - drag.offsetX - rect.left) / rect.width) * 100, 0, 92);
      const y = clamp(((e.clientY - drag.offsetY - rect.top) / rect.height) * 100, 0, 92);
      dirtyRef.current = true;
      setItems((prev) => prev.map((item) => (item.id === drag.id ? { ...item, page, x, y } : item)));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === drag.pointerId) setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag]);

  // ─── Sayfalar ───
  const recordFor = (evidenceId: string) => records.find((r) => r.evidenceId === evidenceId);

  const renderRecordCard = (record: NotebookRecord, item?: NotebookRecordItem) => (
    <div
      key={record.evidenceId}
      className={`${styles.record} ${item ? styles.placed : ''} ${drag?.id === item?.id && item ? styles.dragging : ''}`}
      style={item ? { left: `${item.x}%`, top: `${item.y}%` } : undefined}
    >
      <div
        className={styles.recordHead}
        onPointerDown={(e) => startRecordDrag(e, record, e.currentTarget.parentElement)}
        title="Sürükleyerek taşı"
      >
        <span className={styles.stamp}>{record.kind === 'EVENT' ? 'OLAY' : 'KAYIT'}</span>
        <span className={styles.recordMeta}>
          {recordLabel(record)}
          {record.speaker && ` · ${record.speaker}`}
        </span>
      </div>
      <p className={styles.recordText}>{record.text}</p>
    </div>
  );

  const renderTextItem = (item: NotebookTextItem) => (
    <div
      key={item.id}
      className={`${styles.textItem} ${drag?.id === item.id ? styles.dragging : ''}`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%` }}
    >
      <button
        type="button"
        className={styles.grip}
        aria-label="Yazıyı taşı"
        onPointerDown={(e) => startDrag(e, item.id, e.currentTarget.parentElement)}
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        className={styles.remove}
        aria-label="Yazıyı sil"
        onClick={() => removeItem(item.id)}
      >
        <X size={12} />
      </button>
      <AutoTextarea
        value={item.text}
        autoFocus={focusId === item.id}
        onChange={(text) => updateText(item.id, text)}
        onBlur={() => blurText(item.id)}
      />
    </div>
  );

  const evidenceById = new Map(evidence.map((e) => [e.id, e]));

  const renderPhotoItem = (item: NotebookPhotoItem) => {
    const source = evidenceById.get(item.evidenceId);
    if (!source) return null;
    const photo = evidencePhoto(theme, source, crimeScene);
    return (
      <div
        key={item.id}
        className={`${styles.photoItem} ${drag?.id === item.id ? styles.dragging : ''}`}
        style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rot}deg)` }}
      >
        <span className={`${styles.tape} ${styles.tapeLeft}`} aria-hidden />
        <span className={`${styles.tape} ${styles.tapeRight}`} aria-hidden />
        <button
          type="button"
          className={styles.grip}
          aria-label="Fotoğrafı taşı"
          onPointerDown={(e) => startDrag(e, item.id, e.currentTarget.parentElement)}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          className={styles.remove}
          aria-label="Fotoğrafı kaldır"
          onClick={() => removeItem(item.id)}
        >
          <X size={12} />
        </button>
        <div
          className={styles.photoImage}
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
          title={source.text}
          aria-label={source.text}
          role="img"
        />
        <span className={styles.photoTitle}>{evidenceTitle(theme, source)}</span>
        <AutoTextarea
          value={item.caption}
          autoFocus={false}
          placeholder="Not ekle…"
          maxLength={MAX_CAPTION_LENGTH}
          className={styles.photoCaption}
          onChange={(caption) => updateCaption(item.id, caption)}
        />
      </div>
    );
  };

  const renderInk = (page: NotebookPage) => {
    const strokes = items.filter(
      (item): item is NotebookStrokeItem =>
        item.kind === 'stroke' && item.day === current && item.page === page,
    );
    const live = liveStroke?.page === page ? liveStroke : null;
    return (
      <>
        <svg className={styles.inkLayer} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={strokePath(stroke.points)}
              stroke={PEN_STROKE[stroke.color]}
              strokeWidth={stroke.size === 2 ? '0.26em' : '0.13em'}
            />
          ))}
          {live && live.points.length >= 4 && (
            <path
              d={strokePath(live.points)}
              stroke={PEN_STROKE[penColor]}
              strokeWidth={penSize === 2 ? '0.26em' : '0.13em'}
            />
          )}
        </svg>
        {tool && (
          <div
            className={`${styles.drawLayer} ${tool === 'eraser' ? styles.erasing : ''}`}
            onPointerDown={(e) => onInkDown(page, e)}
            onPointerMove={onInkMove}
            onPointerUp={onInkUp}
            onPointerCancel={onInkUp}
          />
        )}
      </>
    );
  };

  const renderDayPage = (page: NotebookPage) => {
    const day = current;
    const onPage = items.filter(
      (item) => item.day === day && item.page === page && item.kind !== 'stroke',
    );
    const placedRecords = new Set(
      items.filter((item) => item.kind === 'record').map((item) => (item as NotebookRecordItem).evidenceId),
    );
    const flowRecords =
      page === 'L' ? records.filter((r) => r.day === day && !placedRecords.has(r.evidenceId)) : [];
    return (
      <>
        {page === 'L' ? (
          <h3 className={styles.dayTitle}>{day}. Gün</h3>
        ) : (
          <div className={styles.pageOrnament} aria-hidden />
        )}
        {flowRecords.length > 0 && (
          <div className={styles.recordStack}>{flowRecords.map((r) => renderRecordCard(r))}</div>
        )}
        {onPage.map((item) => {
          if (item.kind === 'text') return renderTextItem(item);
          if (item.kind === 'photo') return renderPhotoItem(item);
          if (item.kind !== 'record') return null;
          const record = recordFor(item.evidenceId);
          return record ? renderRecordCard(record, item) : null;
        })}
        {renderInk(page)}
      </>
    );
  };

  const renderCaseFile = (page: NotebookPage) =>
    page === 'L' ? (
      <>
        <h3 className={styles.dayTitle}>Vaka Dosyası</h3>
        <p className={styles.caseText}>{scenario || 'Vakanın özeti henüz yüklenmedi.'}</p>
        <p className={styles.caseHint}>
          Her gün için ayrı bir sayfa çifti var. Boş bir yere çift tıklayarak yazabilir, alınan
          ifadeleri sürükleyip istediğin yere taşıyabilirsin.
        </p>
      </>
    ) : (
      <>
        <h3 className={styles.dayTitle}>Hızlı Notlar</h3>
        <textarea
          className={styles.quickNotes}
          value={quickNotes}
          onChange={(e) => setQuickNotes(e.target.value)}
          onBlur={saveQuickNotes}
          placeholder="Aklına gelenleri buraya karala…"
        />
      </>
    );

  const renderPage = (page: NotebookPage) => (
    <div
      key={page}
      ref={(el) => {
        pageRefs.current[page] = el;
      }}
      className={`${styles.page} ${page === 'L' ? styles.pageLeft : styles.pageRight} ${
        (addMode || placingId) && current > 0 ? styles.adding : ''
      }`}
      onClick={(e) => onPageClick(page, e)}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) addText(page, e.clientX, e.clientY);
      }}
    >
      {spread === null ? null : current === 0 ? renderCaseFile(page) : renderDayPage(page)}
    </div>
  );

  const visiblePages: NotebookPage[] = isNarrow ? [narrowPage] : ['L', 'R'];
  const pageLabel = current === 0 ? 'Vaka Dosyası' : `${current}. Gün`;
  const atStart = current === 0 && (!isNarrow || narrowPage === 'L');
  const atEnd = current >= total - 1 && (!isNarrow || narrowPage === 'R');

  return (
    <div className={styles.overlay} data-theme={theme} onClick={close} role="dialog" aria-modal="true" aria-label="Not defteri">
      <div
        className={`${styles.shell} ${isDrawerOpen ? styles.withDrawer : ''} ${tool ? styles.withPen : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={close} aria-label="Defteri kapat">
          <X size={18} />
        </button>
        <button
          type="button"
          className={styles.helpBtn}
          onClick={() => setHelpOpen(true)}
          aria-label="Defter nasıl kullanılır?"
          title="Nasıl kullanılır?"
        >
          <HelpCircle size={18} />
        </button>

        {helpOpen && (
          <div className={styles.helpOverlay} onClick={closeHelp}>
            <div className={styles.helpCard} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.helpTitle}>Not Defteri</h2>
              <ol className={styles.helpSteps}>
                <li>
                  <strong>Günler.</strong> Her oyun günü için ayrı bir sayfa çifti var. Kenardaki
                  sekmelerle ya da oklarla gezin; telefonda sayfayı yana kaydır.
                </li>
                <li>
                  <strong>Yaz.</strong> Boş bir yere çift tıkla ya da &ldquo;Yazı ekle&rdquo;ye bas. Yazıyı
                  sol üstteki tutamaçtan sürükleyerek taşı.
                </li>
                <li>
                  <strong>Kayıtlar.</strong> Aldığın itiraf ve tanıklıklar o günün sayfasına damgalı
                  kart olarak kendiliğinden düşer.
                </li>
                <li>
                  <strong>Kanıt yapıştır.</strong> Bulduğun bir kanıtı seç, sayfada bir yere tıkla;
                  fotoğrafı bantlanır, altına not yazabilirsin.
                </li>
                <li>
                  <strong>Kalem.</strong> Üç renk ve iki kalınlıkla karala. Silgi bir çizgiyi tamamen
                  siler; Geri al (Ctrl+Z) son adımı geri alır.
                </li>
              </ol>
              <button type="button" className={styles.helpConfirm} onClick={closeHelp}>
                Anladım
              </button>
            </div>
          </div>
        )}

        <nav className={styles.tabs} aria-label="Defter bölümleri">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.tab} ${i === current ? styles.tabActive : ''}`}
              onClick={() => goToSpread(i)}
              aria-current={i === current ? 'page' : undefined}
            >
              {i === 0 ? 'Dosya' : `${i}. Gün`}
            </button>
          ))}
        </nav>

        <div className={`${styles.book} ${isNarrow ? styles.single : ''}`}>
          <div className={styles.cover} aria-hidden />
          <div className={styles.pages} onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd}>
            {visiblePages.map(renderPage)}
          </div>
          {!isNarrow && <div className={styles.spine} aria-hidden />}
          {flip && (
            <div
              key={flip.dir}
              className={`${styles.flipSheet} ${flip.dir === 'next' ? styles.flipNext : styles.flipPrev} ${
                isNarrow ? styles.flipSingle : ''
              }`}
              aria-hidden
            />
          )}
        </div>

        {isDrawerOpen && (
          <div className={styles.drawer}>
            <p className={styles.drawerHint}>
              {itemEvidence.length === 0
                ? 'Henüz fotoğrafı çekilecek bir kanıt bulmadın.'
                : placingId
                  ? 'Şimdi sayfada fotoğrafı yapıştıracağın yere tıkla.'
                  : 'Bir kanıt seç, sonra sayfada yapıştıracağın yere tıkla.'}
            </p>
            <div className={styles.drawerStrip}>
              {itemEvidence.map((item) => (
                <EvidencePolaroid
                  key={item.id}
                  compact
                  photo={evidencePhoto(theme, item, crimeScene)}
                  title={evidenceTitle(theme, item)}
                  text={item.text}
                  selected={placingId === item.id}
                  onClick={() => choosePhoto(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {tool && (
          <div className={styles.penBar} role="toolbar" aria-label="Kalem araçları">
            {PEN_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                className={`${styles.swatch} ${styles[`swatch_${color.id}`]} ${
                  tool === 'pen' && penColor === color.id ? styles.swatchActive : ''
                }`}
                onClick={() => {
                  setPenColor(color.id);
                  setTool('pen');
                }}
                aria-label={color.label}
                title={color.label}
              />
            ))}
            <span className={styles.penDivider} aria-hidden />
            {([1, 2] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={`${styles.sizeBtn} ${tool === 'pen' && penSize === size ? styles.toolActive : ''}`}
                onClick={() => {
                  setPenSize(size);
                  setTool('pen');
                }}
                aria-label={size === 1 ? 'İnce kalem' : 'Kalın kalem'}
                title={size === 1 ? 'İnce' : 'Kalın'}
              >
                <span className={size === 1 ? styles.dotThin : styles.dotThick} />
              </button>
            ))}
            <span className={styles.penDivider} aria-hidden />
            <button
              type="button"
              className={`${styles.toolBtn} ${tool === 'eraser' ? styles.toolActive : ''}`}
              aria-label="Silgi"
              onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
              aria-pressed={tool === 'eraser'}
            >
              <Eraser size={15} />
              <span>Silgi</span>
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              aria-label="Geri al"
              onClick={undoInk}
              disabled={undoCount === 0}
              title="Geri al (Ctrl+Z)"
            >
              <Undo2 size={15} />
              <span>Geri al</span>
            </button>
          </div>
        )}

        <div className={styles.toolbar}>
          <button type="button" className={styles.navBtn} onClick={prev} disabled={atStart} aria-label="Önceki sayfa">
            <ChevronLeft size={18} />
          </button>
          <span className={styles.pageLabel}>{pageLabel}</span>
          <button type="button" className={styles.navBtn} onClick={next} disabled={atEnd} aria-label="Sonraki sayfa">
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${addMode ? styles.toolActive : ''}`}
            aria-label="Yazı ekle"
            onClick={() => {
              setPlacingId(null);
              setTool(null);
              if (current === 0) goToSpread(clamp(currentDay, 1, NOTEBOOK_DAYS));
              else setAddMode((v) => !v);
            }}
            aria-pressed={addMode}
          >
            <PenLine size={15} />
            <span>{addMode ? 'Sayfada bir yere tıkla' : 'Yazı ekle'}</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${isDrawerOpen ? styles.toolActive : ''}`}
            aria-label="Kanıt yapıştır"
            onClick={() => {
              setIsDrawerOpen((open) => !open);
              setPlacingId(null);
            }}
            aria-expanded={isDrawerOpen}
          >
            <Paperclip size={15} />
            <span>Kanıt yapıştır</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${tool ? styles.toolActive : ''}`}
            aria-label="Kalem"
            onClick={() => chooseTool(tool ? null : 'pen')}
            aria-pressed={!!tool}
          >
            <PenTool size={15} />
            <span>Kalem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
