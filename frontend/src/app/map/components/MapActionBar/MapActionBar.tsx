import React from 'react';
import Link from 'next/link';
import styles from '../../map.module.scss';

interface MapActionBarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenNotebook: () => void;
  onOpenInventory: () => void;
  onOpenAudioSettings: () => void;
  onOpenCondemn: () => void;
  onOpenHomeModal: () => void;
  onGoToCrimeScene: () => void;
  showCrimeSceneButton: boolean;
  isNight: boolean;
}

export default function MapActionBar({
  isFullscreen,
  onToggleFullscreen,
  onOpenNotebook,
  onOpenInventory,
  onOpenAudioSettings,
  onOpenCondemn,
  onOpenHomeModal,
  onGoToCrimeScene,
  showCrimeSceneButton,
  isNight,
}: MapActionBarProps) {
  return (
    <footer className={styles.actionBar}>
      <div className={styles.actionGroup}>
        <Link
          href="/interior/tavern"
          className={styles.iconBtn}
          title="Mekanların İçini 360° İncele"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
          <span>Mekan Keşfi</span>
        </Link>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleFullscreen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {isFullscreen ? (
              <>
                <path d="M9 15H5V19" />
                <path d="M15 9H19V5" />
                <path d="M5 15L10 10" />
                <path d="M19 9L14 14" />
              </>
            ) : (
              <>
                <path d="M9 3H5V7" />
                <path d="M15 21H19V17" />
                <path d="M5 7L10 12" />
                <path d="M19 17L14 12" />
              </>
            )}
          </svg>
          <span>{isFullscreen ? 'Cik' : 'Tam Ekran'}</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotebook}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Notlar</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenInventory}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Envanter</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenAudioSettings}
          title="Ses Ayarları"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Ayarlar</span>
        </button>
      </div>

      {/* Central Condemn Button */}
      <div className={styles.condemnCenter}>
        <button
          type="button"
          className={styles.mainCondemnBtn}
          onClick={onOpenCondemn}
        >
          <span className={styles.icon}>⚖️</span>
          <span className={styles.btnText}>MAHKUMU SEÇ</span>
        </button>
      </div>

      <div className={styles.actionGroup}>
        {showCrimeSceneButton && (
          <button
            type="button"
            onClick={onGoToCrimeScene}
            className={styles.crimeSceneBarBtn}
          >
            <span className={styles.icon}>🩸</span>
            <span className={styles.btnText}>Cinayet Mahalli</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenHomeModal}
          className={`${styles.homeBarBtn} ${isNight ? styles.homeNightGlow : ''}`}
        >
          <span className={styles.icon}>🏡</span>
          <span className={styles.btnText}>{isNight ? 'Eve Dön (Dinlen)' : 'Evim'}</span>
        </button>
      </div>
    </footer>
  );
}
