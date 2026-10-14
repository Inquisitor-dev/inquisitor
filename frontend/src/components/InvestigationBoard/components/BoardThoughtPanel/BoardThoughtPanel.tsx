import React from 'react';
import styles from '../../InvestigationBoard.module.scss';

interface BoardThoughtPanelProps {
  thought: string | null;
  isOpen: boolean;
  onClose: () => void;
  thinkerThumb: string | null;
}

export default function BoardThoughtPanel({
  thought,
  isOpen,
  onClose,
  thinkerThumb,
}: BoardThoughtPanelProps) {
  if (!thought || !isOpen) return null;

  return (
    <aside className={styles.thoughtPanel} aria-live="polite">
      {thinkerThumb && (
        <span
          className={styles.thoughtFace}
          style={{ backgroundImage: `url(${thinkerThumb})` }}
        />
      )}
      <div className={styles.thoughtBody}>
        <span className={styles.thoughtKicker}>İç Ses</span>
        <p className={styles.thoughtText}>{thought}</p>
      </div>
      <button
        type="button"
        className={styles.thoughtClose}
        onClick={onClose}
        aria-label="Kapat"
      >
        ×
      </button>
    </aside>
  );
}
