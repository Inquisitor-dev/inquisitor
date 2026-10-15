import React from 'react';
import type { EvidenceItem } from '@/store/useGameStore';
import styles from '../../NpcDialogueScreen.module.scss';

interface ConfrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcName: string;
  evidence: EvidenceItem[];
  shownEvidenceIds: string[];
  loading: boolean;
  onConfront: (item: EvidenceItem) => void;
  evidenceSource: (item: EvidenceItem) => string;
}

export default function ConfrontModal({
  isOpen,
  onClose,
  npcName,
  evidence,
  shownEvidenceIds,
  loading,
  onConfront,
  evidenceSource,
}: ConfrontModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Kanıt Göster</h3>
          <button
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <p style={{ color: '#cfc5b4', fontSize: '0.88rem', marginBottom: '14px' }}>
          {npcName} karşısında hangi kanıtı ortaya koyacaksın?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {evidence.map((item) => (
            <button
              key={item.id}
              className={styles.choiceBtn}
              onClick={() => onConfront(item)}
              disabled={loading}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#f7eedd' }}>
                  {item.category === 'ITEM' ? '🔍' : '📜'} {item.text}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#8c8376', marginTop: 2 }}>
                  {evidenceSource(item)}
                  {shownEvidenceIds.includes(item.id) ? ' (Zaten Gösterildi)' : ''}
                </div>
              </div>
              <span className={styles.choiceIcon}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
