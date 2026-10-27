import { BedDouble, BookOpen, Briefcase, DoorOpen, Settings, X } from 'lucide-react';
import { playDoorSound } from '@/features/audio/doorSound';
import styles from '../../map.module.scss';

interface HomeModalProps {
  isOpen: boolean;
  isNight: boolean;
  endingDay: boolean;
  onClose: () => void;
  onEndDay: () => void;
  onOpenNotebook: () => void;
  onOpenInventory: () => void;
  onOpenAudioSettings: () => void;
}

export default function HomeModal({
  isOpen,
  isNight,
  endingDay,
  onClose,
  onEndDay,
  onOpenNotebook,
  onOpenInventory,
  onOpenAudioSettings,
}: HomeModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    playDoorSound();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-label="Evim"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>
        <h2 className={styles.modalTitle}>Evim</h2>
        <p className={styles.modalMessage}>
          Kasabadaki evindesin. Kapıyı kilitleyip dinlenebilir, günü tamamlayabilir,
          soruşturma notlarını inceleyebilir veya envanterindeki delilleri gözden geçirebilirsin.
        </p>
        <div className={styles.homeActionList}>
          <button
            type="button"
            className={`${styles.homeActionBtn} ${styles.homeActionSleep}`}
            onClick={() => {
              onClose();
              onEndDay();
            }}
            disabled={endingDay}
          >
            <span className={styles.homeActionIcon}>
              <BedDouble size={22} aria-hidden />
            </span>
            <div className={styles.homeActionInfo}>
              <span className={styles.homeActionTitle}>Dinlen ve Günü Bitir</span>
              <span className={styles.homeActionDesc}>
                {isNight
                  ? 'Geceyi uykuda geçir ve bir sonraki güne başla.'
                  : 'Günü erken sonlandırıp dinlen.'}
              </span>
            </div>
          </button>
          <button
            type="button"
            className={styles.homeActionBtn}
            onClick={() => {
              onClose();
              onOpenNotebook();
            }}
          >
            <span className={styles.homeActionIcon}>
              <BookOpen size={22} aria-hidden />
            </span>
            <div className={styles.homeActionInfo}>
              <span className={styles.homeActionTitle}>Not Defteri</span>
              <span className={styles.homeActionDesc}>
                Aldığın ifadeleri ve kendi notlarını oku.
              </span>
            </div>
          </button>
          <button
            type="button"
            className={styles.homeActionBtn}
            onClick={() => {
              onClose();
              onOpenInventory();
            }}
          >
            <span className={styles.homeActionIcon}>
              <Briefcase size={22} aria-hidden />
            </span>
            <div className={styles.homeActionInfo}>
              <span className={styles.homeActionTitle}>Envanter ve Deliller</span>
              <span className={styles.homeActionDesc}>
                Bulduğun fiziksel kanıtları ve arama izinlerini incele.
              </span>
            </div>
          </button>
          <button
            type="button"
            className={styles.homeActionBtn}
            onClick={() => {
              onClose();
              onOpenAudioSettings();
            }}
          >
            <span className={styles.homeActionIcon}>
              <Settings size={22} aria-hidden />
            </span>
            <div className={styles.homeActionInfo}>
              <span className={styles.homeActionTitle}>Ses Ayarları</span>
              <span className={styles.homeActionDesc}>
                Yürüme, kapı ve müzik ses seviyelerini ayarla.
              </span>
            </div>
          </button>
          <button
            type="button"
            className={styles.homeActionBtn}
            onClick={handleClose}
          >
            <span className={styles.homeActionIcon}>
              <DoorOpen size={22} aria-hidden />
            </span>
            <div className={styles.homeActionInfo}>
              <span className={styles.homeActionTitle}>Dışarı Çık</span>
              <span className={styles.homeActionDesc}>Sokaklara geri dön.</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
