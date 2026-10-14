import React from 'react';
import AudioSettingsPanel from '@/features/audio/AudioSettingsPanel';
import styles from '../../map.module.scss';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettingsModal({
  isOpen,
  onClose,
}: AudioSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Kapat"
        >
          &times;
        </button>
        <h2 className={styles.modalTitle}>⚙️ Ses Ayarları</h2>
        <AudioSettingsPanel />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button
            type="button"
            className={styles.modalConfirm}
            onClick={onClose}
            style={{ width: '120px' }}
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
