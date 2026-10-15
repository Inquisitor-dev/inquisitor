import React from 'react';
import { X } from 'lucide-react';
import styles from '../../page.module.scss';
import { CATEGORY_LABELS, type MarketItem } from '../../marketItems';

interface PurchaseModalProps {
  pendingItem: MarketItem | null;
  tokenBalance: number;
  onClose: () => void;
  onConfirm: () => void;
  onGoToTokens: () => void;
}

export default function PurchaseModal({
  pendingItem,
  tokenBalance,
  onClose,
  onConfirm,
  onGoToTokens,
}: PurchaseModalProps) {
  if (!pendingItem) return null;

  const pendingPrice = pendingItem.price;
  const shortfall = pendingPrice - tokenBalance;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <span className={styles.eyebrow}>{CATEGORY_LABELS[pendingItem.category].title}</span>
        <h2 id="purchase-title" className={styles.modalTitle}>{pendingItem.title}</h2>
        <p className={styles.modalDesc}>{pendingItem.description}</p>

        <dl className={styles.ledger}>
          <div>
            <dt>Bakiye</dt>
            <dd>{tokenBalance}</dd>
          </div>
          <div>
            <dt>Bedel</dt>
            <dd className={styles.ledgerCost}>−{pendingPrice}</dd>
          </div>
          <div className={styles.ledgerTotal}>
            <dt>Kalan</dt>
            <dd>{shortfall > 0 ? '—' : tokenBalance - pendingPrice}</dd>
          </div>
        </dl>

        {shortfall > 0 && (
          <p className={styles.modalWarning}>
            Bu eşya için {shortfall} token eksiğin var.{' '}
            <button type="button" className={styles.inlineLink} onClick={onGoToTokens}>
              Token al →
            </button>
          </p>
        )}

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className={styles.buyBtn}
            onClick={onConfirm}
            disabled={shortfall > 0}
          >
            Mühürle ve Satın Al
          </button>
        </div>
      </div>
    </div>
  );
}
