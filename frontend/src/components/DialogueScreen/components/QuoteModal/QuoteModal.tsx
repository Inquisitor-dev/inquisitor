'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import styles from '@/features/abilities/Abilities.module.scss';

export interface QuoteOption {
  id: string;
  npcId: string;
  name: string;
  text: string;
  day: number;
}

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  // Sözün okunacağı şüpheli
  npcId: string;
  npcName: string;
  loading: boolean;
  onPick: (quote: QuoteOption) => void;
}

// Teyit (Gece Muhabiri): başka bir şüphelinin sana söylediği bir sözü seç ve bu şüpheliye oku
export default function QuoteModal({ isOpen, onClose, sessionId, npcId, npcName, loading, onPick }: QuoteModalProps) {
  const [quotes, setQuotes] = useState<QuoteOption[] | null>(null);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    let cancelled = false;
    api
      .post<{ quotes: QuoteOption[] }>('/npcs/quotes', { sessionId, npcId })
      .then((data) => {
        if (!cancelled) setQuotes(data.quotes);
      })
      .catch((err) => {
        logger.error('Failed to load quotes', err);
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
      setQuotes(null);
    };
  }, [isOpen, sessionId, npcId]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Teyit"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <p className={styles.kicker}>Günde 1 kez</p>
        <h2 className={styles.title}>Teyit</h2>
        <p className={styles.summary}>
          Birinin sana söylediği bir sözü {npcName} adlı kişiye oku. Söz gerçek olduğu için geçiştiremez. Bir soru hakkı harcar.
        </p>
        {quotes === null ? (
          <p className={styles.empty}>Sözler yükleniyor…</p>
        ) : quotes.length === 0 ? (
          <p className={styles.empty}>Başka bir şüpheliyle henüz konuşmadın; okunacak söz yok.</p>
        ) : (
          <div className={styles.targets}>
            {quotes.map((quote) => (
              <button
                key={quote.id}
                type="button"
                className={styles.target}
                disabled={loading}
                onClick={() => onPick(quote)}
              >
                <strong>{quote.name}</strong> · Gün {quote.day}
                <br />“{quote.text.length > 140 ? `${quote.text.slice(0, 140)}…` : quote.text}”
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
