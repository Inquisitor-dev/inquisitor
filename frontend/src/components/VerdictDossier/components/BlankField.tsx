'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VerdictOption } from '@/features/verdict/verdictTypes';
import { shortLabel } from '../dossierTheme';
import styles from '../VerdictDossier.module.scss';

interface BlankFieldProps {
  label: string;
  options: VerdictOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
  open: boolean;
  onToggle: () => void;
  // Diğer şüphelilerde seçilen bağ el yazısı yerine kırmızı damga olarak görünür
  variant?: 'hand' | 'stamp';
}

// Formdaki boşluk: "Cinayet aleti: ______". Tıklanınca seçenekler boşluğun altında açılır, seçilen
// cevap boşluğa yazılır. Bir dropdown kadar sade, ama dosyanın kâğıdına yazılmış gibi görünür.
export default function BlankField({
  label,
  options,
  value,
  onChange,
  open,
  onToggle,
  variant = 'hand',
}: BlankFieldProps) {
  const listId = useId();
  const chosen = options.find((o) => o.id === value);

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}:</span>
      <button
        type="button"
        className={`${styles.blank} ${open ? styles.blankOpen : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
      >
        {chosen ? (
          <span className={variant === 'stamp' ? styles.blankStamp : styles.blankHand}>
            {shortLabel(chosen.label)}
          </span>
        ) : (
          <span className={styles.blankEmpty}>seç</span>
        )}
        <ChevronDown size={14} className={styles.blankChevron} aria-hidden />
      </button>
      {open && (
        <ul id={listId} className={styles.menu} role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                className={`${styles.menuItem} ${o.id === value ? styles.menuItemActive : ''}`}
                onClick={() => onChange(o.id)}
              >
                {o.label}
              </button>
            </li>
          ))}
          {chosen && (
            <li>
              <button type="button" className={styles.menuClear} onClick={() => onChange(undefined)}>
                Boş bırak
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
