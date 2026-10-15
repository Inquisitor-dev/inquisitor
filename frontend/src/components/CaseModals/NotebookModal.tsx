'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import styles from './CaseModals.module.scss';

// Soruşturma notları: yazılanlar alandan çıkınca oturuma kaydedilir
export default function NotebookModal({ onClose }: { onClose: () => void }) {
  const { sessionId, notes, setNotes } = useGameStore();
  const [localNotes, setLocalNotes] = useState(notes);

  const saveNotes = async () => {
    if (localNotes === notes || !sessionId) return;
    setNotes(localNotes);
    try {
      await api.post(`/game-sessions/${sessionId}/notes`, { notes: localNotes });
    } catch (err) {
      logger.error('Failed to save notes', err);
    }
  };

  const close = () => {
    void saveNotes();
    onClose();
  };

  // Escape ile kapanır; yazılanlar kaybolmasın diye kapatırken kaydedilir
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="Kapat">&times;</button>
        <h2 className={styles.title}>Soruşturma Notları</h2>
        <textarea
          className={styles.notesArea}
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Gözlemlerini buraya not et..."
          autoFocus
        />
      </div>
    </div>
  );
}
