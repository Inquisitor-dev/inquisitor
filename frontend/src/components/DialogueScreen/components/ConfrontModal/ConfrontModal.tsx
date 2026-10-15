import React, { useState } from 'react';
import type { EvidenceItem } from '@/store/useGameStore';
import styles from '../../NpcDialogueScreen.module.scss';

const MAX_REMARK_LENGTH = 500;

interface ConfrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcName: string;
  evidence: EvidenceItem[];
  shownEvidenceIds: string[];
  loading: boolean;
  onConfront: (item: EvidenceItem, remark: string) => void;
  evidenceSource: (item: EvidenceItem) => string;
}

// Pencere her açılışta sıfırdan kurulsun (seçim ve yazılan söz kalmasın) diye içerik ayrı bileşende
export default function ConfrontModal(props: ConfrontModalProps) {
  if (!props.isOpen) return null;
  return <ConfrontModalContent {...props} />;
}

function ConfrontModalContent({
  onClose,
  npcName,
  evidence,
  shownEvidenceIds,
  loading,
  onConfront,
  evidenceSource,
}: ConfrontModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const selected = evidence.find((item) => item.id === selectedId) ?? null;

  const submit = () => {
    if (!selected || loading) return;
    onConfront(selected, remark.trim());
  };

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
        <p className={styles.confrontIntro}>
          {npcName} karşısında hangi kanıtı ortaya koyacaksın? Aynı kanıtı aynı kişiye bir kez gösterebilirsin.
        </p>
        <div className={styles.choiceList}>
          {evidence.map((item) => {
            const alreadyShown = shownEvidenceIds.includes(item.id);
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.choiceBtn} ${isSelected ? styles.choiceBtnSelected : ''}`}
                onClick={() => setSelectedId(item.id)}
                disabled={loading || alreadyShown}
                aria-pressed={isSelected}
              >
                <div>
                  <div className={styles.choiceText}>
                    {item.category === 'ITEM' ? '🔍' : '📜'} {item.text}
                  </div>
                  <div className={styles.choiceMeta}>
                    {evidenceSource(item)}
                    {alreadyShown ? ' · Ona zaten gösterdin' : ''}
                  </div>
                </div>
                <span className={styles.choiceIcon}>{isSelected ? '✓' : '→'}</span>
              </button>
            );
          })}
        </div>

        <label className={styles.confrontRemarkLabel} htmlFor="confront-remark">
          Kanıtı gösterirken ne söyleyeceksin? <span>(isteğe bağlı)</span>
        </label>
        <textarea
          id="confront-remark"
          className={styles.confrontRemark}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          maxLength={MAX_REMARK_LENGTH}
          rows={2}
          placeholder="Örneğin: Bu leke olay yerinde bulundu. Açıklayabilir misin?"
          disabled={loading}
        />
        <div className={styles.confrontFooter}>
          <span className={styles.charCount}>
            {remark.length}/{MAX_REMARK_LENGTH}
          </span>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={submit}
            disabled={!selected || loading}
          >
            Kanıtı Göster
          </button>
        </div>
      </div>
    </div>
  );
}
