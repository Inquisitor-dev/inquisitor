import React from 'react';
import type { EvidenceItem } from '@/store/useGameStore';
import {
  evidenceTitle,
  suspectInfo,
  type BoardCard,
} from '../../boardModel';
import styles from '../../InvestigationBoard.module.scss';

interface BoardDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  drawerSuspects: string[];
  drawerEvidence: EvidenceItem[];
  scenario: string;
  onPinCard: (card: Pick<BoardCard, 'kind'> & Partial<BoardCard>) => void;
}

export default function BoardDrawer({
  drawerOpen,
  setDrawerOpen,
  drawerSuspects,
  drawerEvidence,
  scenario,
  onPinCard,
}: BoardDrawerProps) {
  return (
    <section className={`${styles.drawer} ${drawerOpen ? '' : styles.drawerClosed}`}>
      <button
        type="button"
        className={styles.drawerToggle}
        onClick={() => setDrawerOpen((v) => !v)}
      >
        {drawerOpen
          ? 'Dosyayı Kapat ▾'
          : `Dosyayı Aç ▴ (${drawerSuspects.length + drawerEvidence.length})`}
      </button>
      {drawerOpen && (
        <div className={styles.drawerItems}>
          <button
            type="button"
            className={`${styles.drawerItem} ${styles.drawerNote}`}
            onClick={() => onPinCard({ kind: 'note', text: '' })}
          >
            <span className={styles.drawerIcon}>📝</span>
            <span className={styles.drawerLabel}>Not Ekle</span>
          </button>
          {drawerSuspects.map((id) => {
            const info = suspectInfo(scenario, id);
            return (
              <button
                key={id}
                type="button"
                className={styles.drawerItem}
                onClick={() => onPinCard({ kind: 'suspect', refId: id })}
              >
                <span
                  className={styles.drawerThumb}
                  style={{ backgroundImage: info.portrait || undefined }}
                />
                <span className={styles.drawerLabel}>{info.name}</span>
                <span className={styles.drawerSub}>Şüpheli</span>
              </button>
            );
          })}
          {drawerEvidence.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.drawerItem}
              onClick={() => onPinCard({ kind: 'evidence', refId: item.id })}
            >
              <span className={styles.drawerIcon}>
                {item.category === 'STATEMENT' ? '🗣️' : '🔎'}
              </span>
              <span className={styles.drawerLabel}>
                {evidenceTitle(scenario, item)}
              </span>
              <span className={styles.drawerSub}>{item.text}</span>
            </button>
          ))}
          {drawerSuspects.length === 0 && drawerEvidence.length === 0 && (
            <span className={styles.drawerEmpty}>
              Dosyadaki her şey panoda. Yeni kanıt buldukça burada görünecek.
            </span>
          )}
        </div>
      )}
    </section>
  );
}
