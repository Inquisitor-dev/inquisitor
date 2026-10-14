import React from 'react';
import styles from '../../page.module.scss';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function SuccessModal({ isOpen, onClose, title }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.waxSeal}>✠</span>
        <h3 id="success-title" className={styles.modalTitle}>
          Vakan Konseye Ulaştı
        </h3>
        <p className={styles.modalText}>
          <strong>“{title}”</strong> başlıklı vakan incelenmek üzere arşive teslim edildi.
        </p>
        <div className={styles.processBox}>
          <h4>Bundan sonra ne olacak?</h4>
          <ol>
            <li>Vakan, yapay zekânın kullanabileceği biçimde bölümlere ayrıldı.</li>
            <li>Konsey vakayı mantık tutarlılığı ve anlatım tonu açısından inceleyecek.</li>
            <li>Onaylanırsa bir sonraki güncellemede vaka havuzuna eklenecek ve tüm oyuncular onu çözebilecek.</li>
          </ol>
        </div>
        <button
          onClick={onClose}
          className={`${styles.primaryBtn} ${styles.full}`}
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
