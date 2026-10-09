'use client';

import { useEffect } from 'react';
import { getLocationLabel } from '@/config/locationLabels';
import { useGameStore } from '@/store/useGameStore';
import styles from './CaseModals.module.scss';

// Envanter: bulunan fiziksel kanıtlar ve arama izinleri
export default function InventoryModal({ onClose }: { onClose: () => void }) {
  const { inventory, evidence, scenarioType } = useGameStore();
  const evidenceItems = evidence.filter((item) => item.category === 'ITEM');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isEmpty =
    evidenceItems.length === 0 && inventory.activeWarrants.length === 0 && inventory.usedWarrants.length === 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">&times;</button>
        <h2 className={styles.title}>Envanter</h2>
        <div className={styles.inventoryList}>
          {isEmpty && <p className={styles.empty}>Henüz bir eşyan yok.</p>}
          {evidenceItems.map((item) => (
            <div key={item.id} className={`${styles.inventoryItem} ${styles.evidenceItem}`}>
              <span className={styles.itemName}>{item.text}</span>
              <span className={styles.evidenceSource}>
                {getLocationLabel(item.sourceId, scenarioType)} · {item.dayNumber}. gün
              </span>
            </div>
          ))}
          {inventory.activeWarrants.map((w, idx) => (
            <div key={`active-${idx}`} className={styles.inventoryItem}>
              <span className={styles.itemIcon}>📜</span>
              <span className={styles.itemName}>Arama İzni</span>
              <span className={styles.warrantPlace}>{getLocationLabel(w, scenarioType)}</span>
              <span>(Hazır)</span>
            </div>
          ))}
          {inventory.usedWarrants.map((w, idx) => (
            <div key={`used-${idx}`} className={`${styles.inventoryItem} ${styles.usedItem}`}>
              <span className={styles.itemIcon}>📜</span>
              <span className={styles.itemName}>Arama İzni</span>
              <span className={styles.warrantPlace}>{getLocationLabel(w, scenarioType)}</span>
              <span>(Kullanıldı)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
