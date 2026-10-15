'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, PenLine, X } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import {
  clamp,
  DEFAULT_TEXT_WIDTH,
  MAX_TEXT_LENGTH,
  newItemId,
  NOTEBOOK_DAYS,
  recordLabel,
  spreadCount,
  type NotebookItem,
  type NotebookPage,
  type NotebookRecord,
  type NotebookRecordItem,
  type NotebookState,
  type NotebookTextItem,
} from './notebookModel';
import styles from './Notebook.module.scss';

const SAVE_DELAY_MS = 700;
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
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  autoFocus: boolean;
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
      className={styles.textInput}
      value={value}
      rows={1}
      maxLength={MAX_TEXT_LENGTH}
      autoFocus={autoFocus}
      placeholder="Bir şeyler yaz…"
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
  const { sessionId, scenarioType, scenario, notes, setNotes } = useGameStore();
  const theme = scenarioType || 'medieval';
  const isNarrow = useMediaQuery('(max-width: 820px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [items, setItems] = useState<NotebookItem[]>([]);
  const [records, setRecords] = useState<NotebookRecord[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [spread, setSpread] = useState<number | null>(null);
  const [narrowPage, setNarrowPage] = useState<NotebookPage>('L');
  const [flip, setFlip] = useState<{ dir: 'next' | 'prev'; key: number } | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [quickNotes, setQuickNotes] = useState(notes);

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
      })
      .catch((err) => {
        logger.error('Failed to load notebook', err);
        if (!cancelled) setSpread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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
    if (reducedMotion) {
      setSpread(target);
      setNarrowPage(landing);
      return;
    }
    setFlip({ dir: target > spread ? 'next' : 'prev', key: Date.now() });
    window.setTimeout(() => {
      setSpread(target);
      setNarrowPage(landing);
    }, FLIP_MS / 2);
    window.setTimeout(() => setFlip(null), FLIP_MS);
  };

  // Telefonda tek sayfa görünür: önce sol, sonra sağ sayfa, sonra sonraki gün
  const next = () => {
    if (isNarrow && narrowPage === 'L') setNarrowPage('R');
    else goToSpread(current + 1, 'L');
  };
  const prev = () => {
    if (isNarrow && narrowPage === 'R') setNarrowPage('L');
    else goToSpread(current - 1, isNarrow ? 'R' : 'L');
  };

  // Klavye: oklarla sayfa çevrilir, Escape kapatır (yazı yazarken oklar imleci taşır)
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.tagName === 'TEXTAREA';
      if (e.key === 'Escape') close();
      else if (!typing && e.key === 'ArrowRight') next();
      else if (!typing && e.key === 'ArrowLeft') prev();
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    if (addMode && e.target === e.currentTarget) addText(page, e.clientX, e.clientY);
  };

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
        <span className={styles.stamp}>KAYIT</span>
        <span className={styles.recordMeta}>
          {recordLabel(record)} · {record.speaker}
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

  const renderDayPage = (page: NotebookPage) => {
    const day = current;
    const onPage = items.filter((item) => item.day === day && item.page === page);
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
          const record = recordFor(item.evidenceId);
          return record ? renderRecordCard(record, item) : null;
        })}
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
        addMode && current > 0 ? styles.adding : ''
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
    <div className={styles.overlay} data-theme={theme} onClick={close}>
      <div className={styles.shell} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={close} aria-label="Defteri kapat">
          <X size={18} />
        </button>

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
          <div className={styles.pages}>{visiblePages.map(renderPage)}</div>
          {!isNarrow && <div className={styles.spine} aria-hidden />}
          {flip && (
            <div
              key={flip.key}
              className={`${styles.flipSheet} ${flip.dir === 'next' ? styles.flipNext : styles.flipPrev} ${
                isNarrow ? styles.flipSingle : ''
              }`}
              aria-hidden
            />
          )}
        </div>

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
            onClick={() => (current === 0 ? goToSpread(clamp(currentDay, 1, NOTEBOOK_DAYS)) : setAddMode((v) => !v))}
            aria-pressed={addMode}
          >
            <PenLine size={15} />
            <span>{addMode ? 'Sayfada bir yere tıkla' : 'Yazı ekle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
