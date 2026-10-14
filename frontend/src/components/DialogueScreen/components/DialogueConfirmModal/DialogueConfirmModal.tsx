import React from 'react';
import styles from '../../NpcDialogueScreen.module.scss';

interface DialogueConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DialogueConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
}: DialogueConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: 440 }}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p style={{ color: '#cfc5b4', margin: '14px 0 20px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            className={styles.choiceBtn}
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={onCancel}
          >
            Vazgeç
          </button>
          <button
            type="button"
            className={styles.sendBtn}
            style={{ padding: '8px 18px' }}
            onClick={onConfirm}
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
}
