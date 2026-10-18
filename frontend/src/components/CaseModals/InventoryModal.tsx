'use client';

import { useEffect } from 'react';
import { getLocationLabel } from '@/config/locationLabels';
import { useGameStore } from '@/store/useGameStore';
import EvidencePolaroid from '@/components/EvidencePolaroid/EvidencePolaroid';
import { evidencePhoto, evidenceTitle } from '@/components/InvestigationBoard/boardModel';
import styles from './CaseModals.module.scss';

// Envanter: bulunan fiziksel kanıtların fotoğrafları ve arama izinleri
export default function InventoryModal({ onClose }: { onClose: () => void }) {
  const { inventory, evidence, scenarioType, crimeScene } = useGameStore();
  const scenario = scenarioType || 'medieval';
  const evidenceItems = evidence.filter((item) => item.category === 'ITEM');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hasWarrants = inventory.activeWarrants.length > 0 || inventory.usedWarrants.length > 0;
  const isEmpty = evidenceItems.length === 0 && !hasWarrants;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.content} ${styles.inventoryContent}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">&times;</button>
        <h2 className={styles.title}>Envanter</h2>
        {isEmpty && <p className={styles.empty}>Henüz bir eşyan yok.</p>}

        {evidenceItems.length > 0 && (
          <>
            <h3 className={styles.sectionTitle}>Kanıtlar</h3>
            <p className={styles.sectionHint}>İstersen bu fotoğrafları Not Defteri&apos;ne bantlayabilirsin.</p>
            <div className={styles.polaroidGrid}>
              {evidenceItems.map((item) => (
                <EvidencePolaroid
                  key={item.id}
                  photo={evidencePhoto(scenario, item, crimeScene)}
                  title={evidenceTitle(scenario, item)}
                  text={item.text}
                  meta={`${item.dayNumber}. gün`}
                />
              ))}
            </div>
          </>
        )}

        {hasWarrants && (
          <>
            <h3 className={styles.sectionTitle}>Arama İzinleri</h3>
            <div className={styles.inventoryList}>
              {inventory.activeWarrants.map((w, idx) => (
                <div key={`active-${idx}`} className={styles.inventoryItem}>
                  <span className={styles.itemIcon}>📜</span>
                  <span className={styles.itemName}>Arama İzni</span>
                  <span className={styles.warrantPlace}>{getLocationLabel(w, scenario)}</span>
                  <span>(Hazır)</span>
                </div>
              ))}
              {inventory.usedWarrants.map((w, idx) => (
                <div key={`used-${idx}`} className={`${styles.inventoryItem} ${styles.usedItem}`}>
                  <span className={styles.itemIcon}>📜</span>
                  <span className={styles.itemName}>Arama İzni</span>
                  <span className={styles.warrantPlace}>{getLocationLabel(w, scenario)}</span>
                  <span>(Kullanıldı)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
