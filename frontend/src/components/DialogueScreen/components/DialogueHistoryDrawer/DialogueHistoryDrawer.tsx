import React from 'react';
import styles from '../../NpcDialogueScreen.module.scss';

export interface DialogueMessage {
  role: 'player' | 'npc';
  text: string;
  timestamp: Date;
}

interface DialogueHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: DialogueMessage[];
  npcName: string;
}

export default function DialogueHistoryDrawer({
  isOpen,
  onClose,
  messages,
  npcName,
}: DialogueHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.historyDrawer}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Konuşma Geçmişi</h3>
        <button
          className={styles.modalCloseBtn}
          onClick={onClose}
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
      <div className={styles.historyList}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`${styles.historyBubble} ${
              m.role === 'player' ? styles.historyPlayer : styles.historyNpc
            }`}
          >
            <div className={styles.historySpeaker}>
              {m.role === 'player' ? 'Engizitör' : npcName}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
