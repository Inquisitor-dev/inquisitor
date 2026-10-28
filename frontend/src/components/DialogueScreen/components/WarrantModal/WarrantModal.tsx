import React from 'react';
import { getInterior } from '@/config/interiorConfig';
import { getLocationLabel } from '@/config/locationLabels';
import { getSuspectsForScenario } from '@/config/npcProfiles';
import type { WarrantInfo } from '@/features/warrants/useWarrantInfo';
import dialogueStyles from '../../NpcDialogueScreen.module.scss';
import styles from './WarrantModal.module.scss';

interface WarrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: string;
  difficulty: string;
  issuerName: string;
  info: WarrantInfo | null;
  loading: boolean;
  onPick: (locationId: string, label: string) => void;
}

// Arama izni isteği: mekân yazıyla değil, görseliyle seçilir. Yazıyla istek "Madeni", "maden ocağını"
// gibi biçimlerde tanınmıyor, karakter de kendi kafasından reddediyordu.
export default function WarrantModal({
  isOpen,
  onClose,
  scenario,
  difficulty,
  issuerName,
  info,
  loading,
  onPick,
}: WarrantModalProps) {
  if (!isOpen) return null;

  const remaining = info?.remaining ?? 0;
  const places = getSuspectsForScenario(scenario, difficulty).map((suspect) => ({
    id: suspect.id,
    owner: suspect.name,
    label: getLocationLabel(suspect.id, scenario),
    image: getInterior(scenario, suspect.id)?.backgroundImage ?? null,
  }));

  return (
    <div
      className={dialogueStyles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Arama İzni İste"
    >
      <div className={`${dialogueStyles.modalCard} ${styles.card}`} onClick={(e) => e.stopPropagation()}>
        <div className={dialogueStyles.modalHeader}>
          <h3 className={dialogueStyles.modalTitle}>Arama İzni İste</h3>
          <button className={dialogueStyles.modalCloseBtn} onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <p className={dialogueStyles.confrontIntro}>
          {info
            ? remaining > 0
              ? `Hangi mekânı aramak istiyorsun? İzni ${issuerName} verecek. Bu vakada ${remaining} izin hakkın kaldı (toplam ${info.limit}).`
              : `Bu vakadaki ${info.limit} arama izni hakkının hepsini kullandın.`
            : 'İzin bilgisi yükleniyor...'}
        </p>
        <div className={styles.grid}>
          {places.map((place) => {
            const held = info?.active.includes(place.id) ?? false;
            const used = info?.used.includes(place.id) ?? false;
            const disabled = !info || loading || held || used || remaining === 0;
            return (
              <button
                key={place.id}
                type="button"
                className={styles.place}
                onClick={() => onPick(place.id, place.label)}
                disabled={disabled}
              >
                <span
                  className={styles.photo}
                  style={place.image ? { backgroundImage: `url(${place.image})` } : undefined}
                  aria-hidden
                />
                {(held || used) && (
                  <span className={styles.stamp}>{held ? 'İzin var' : 'Arandı'}</span>
                )}
                <span className={styles.caption}>
                  <span className={styles.label}>{place.label}</span>
                  <span className={styles.owner}>{place.owner}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
