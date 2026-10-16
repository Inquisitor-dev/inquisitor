'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNpcDialoguePortrait } from '@/config/dialogueConfig';
import { getSuspectsForScenario, type SuspectOption } from '@/config/npcProfiles';
import styles from './CondemnModal.module.scss';

interface CondemnModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioType: string;
  difficulty: string;
  // İkinci Nefes ile masum olduğu açıklananlar listede görünmez
  excludeIds?: string[];
  onConfirmCondemn: (npcId: string) => void | Promise<void>;
}

export default function CondemnModal({
  isOpen,
  onClose,
  scenarioType,
  difficulty,
  excludeIds = [],
  onConfirmCondemn,
}: CondemnModalProps) {
  const [pendingVillager, setPendingVillager] = useState<SuspectOption | null>(null);

  const handleClose = useCallback(() => {
    setPendingVillager(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (pendingVillager) {
          setPendingVillager(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pendingVillager, handleClose]);

  if (!isOpen) return null;

  const suspects = getSuspectsForScenario(scenarioType, difficulty).filter(
    (suspect) => !excludeIds.includes(suspect.id),
  );

  const handleConfirm = async () => {
    if (!pendingVillager) return;
    const id = pendingVillager.id;
    setPendingVillager(null);
    onClose();
    await onConfirmCondemn(id);
  };

  return (
    <div className={styles.overlay} onClick={() => { if (pendingVillager) setPendingVillager(null); else handleClose(); }}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={() => { if (pendingVillager) setPendingVillager(null); else handleClose(); }}
          aria-label="Kapat"
        >
          &times;
        </button>

        {pendingVillager ? (
          <div>
            <div className={styles.confirmAvatarWrap}>
              <img
                src={getNpcDialoguePortrait(scenarioType, pendingVillager.id)}
                alt={pendingVillager.name}
                className={styles.confirmAvatar}
              />
            </div>
            <h2 className={styles.title}>Engizisyon Hükmü</h2>
            <p className={styles.modalMessage}>
              <strong>{pendingVillager.name}</strong> isimli şüpheliyi ölüme mahkum etmek istediğinizden emin misiniz? Bu karar geri alınamaz.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => setPendingVillager(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={styles.modalConfirm}
                onClick={handleConfirm}
              >
                Onayla
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className={styles.title}>Kimi Mahkum Edeceksin?</h2>
            <p className={styles.modalSubtitle}>
              Engizisyon yanılmaz... veya en azından öyle bilinmeli. Seçiminiz kaderinizi belirleyecek.
            </p>
            <div className={styles.villagerList}>
              {suspects.map((villager) => {
                const portrait = getNpcDialoguePortrait(scenarioType, villager.id);
                return (
                  <button
                    key={villager.id}
                    type="button"
                    className={styles.villagerItem}
                    onClick={() => setPendingVillager(villager)}
                  >
                    <div className={styles.villagerAvatarWrap}>
                      {portrait ? (
                        <img
                          src={portrait}
                          alt={villager.name}
                          className={styles.villagerAvatar}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className={styles.villagerIcon}>{villager.icon}</span>
                      )}
                    </div>
                    <div className={styles.villagerInfo}>
                      <span className={styles.villagerName}>{villager.name}</span>
                      <span className={styles.villagerRole}>{villager.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
