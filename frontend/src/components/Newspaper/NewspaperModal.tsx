'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Newspaper } from '@/features/newspaper/useMorningPaper';
import styles from './NewspaperModal.module.scss';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Gazetenin evrene göre biçimi: modernde gazete kupürü, cyberpunk'ta tablet, diğerlerinde parşömen ilan
const FORMAT: Record<string, 'clipping' | 'tablet' | 'parchment'> = {
  modern: 'clipping',
  cyberpunk: 'tablet',
};

interface NewspaperModalProps {
  paper: Newspaper;
  scenarioType: string;
  onClose: () => void;
}

export default function NewspaperModal({ paper, scenarioType, onClose }: NewspaperModalProps) {
  const format = FORMAT[scenarioType] ?? 'parchment';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [lead, ...rest] = paper.items;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <article
        className={`${styles.paper} ${styles[format]}`}
        data-theme={scenarioType}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newspaper-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        <header className={styles.masthead}>
          <p className={styles.edition}>
            {format === 'tablet' ? 'Sabah akışı' : 'Sabah baskısı'} · {ROMAN[paper.day] ?? paper.day}. gün
          </p>
          <h2 id="newspaper-title" className={styles.title}>
            {paper.title}
          </h2>
        </header>

        {lead && (
          <section
            className={`${styles.lead} ${lead.kind === 'MURDER' || lead.kind === 'PERSONA' ? styles.leadAlarm : ''}`}
          >
            <h3 className={styles.leadHeadline}>{lead.headline}</h3>
            <p className={styles.leadBody}>{lead.body}</p>
          </section>
        )}

        {rest.length > 0 && (
          <div className={styles.columns}>
            {rest.map((item) => (
              <section key={item.headline} className={styles.item}>
                <h4 className={styles.itemHeadline}>{item.headline}</h4>
                <p className={styles.itemBody}>{item.body}</p>
              </section>
            ))}
          </div>
        )}

        <footer className={styles.footer}>
          <button type="button" className={styles.done} onClick={onClose}>
            {format === 'tablet' ? 'Akışı kapat' : 'Okudum'}
          </button>
        </footer>
      </article>
    </div>
  );
}
