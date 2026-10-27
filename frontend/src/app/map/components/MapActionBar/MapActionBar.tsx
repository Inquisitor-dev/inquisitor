import Link from 'next/link';
import {
  BookOpen,
  Briefcase,
  Compass,
  Gavel,
  Home,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import styles from './MapActionBar.module.scss';

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

// Alt bardaki tek bir araç: simge ve altında adı. Dar ekranda kısa adı gösterilir.
function Tool({
  icon: Icon,
  label,
  short,
  onClick,
  href,
  title,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  short?: string;
  onClick?: () => void;
  href?: string;
  title?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className={styles.toolIcon}>
        <Icon size={20} strokeWidth={1.6} aria-hidden />
      </span>
      <span className={styles.toolLabel}>{label}</span>
      <span className={styles.toolShort} aria-hidden>
        {short ?? label}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={`${styles.tool} ${className}`} title={title ?? label} aria-label={label}>
      {content}
    </Link>
  ) : (
    <button type="button" className={`${styles.tool} ${className}`} onClick={onClick} title={title ?? label} aria-label={label}>
      {content}
    </button>
  );
}

// Haritanın alt barı: soldaki araçlar, ortada hüküm mührü, sağda olay yeri ve ev
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
    <footer className={styles.bar}>
      <div className={styles.group}>
        <Tool
          icon={Compass}
          label="Mekân Keşfi"
          href="/interior/tavern"
          title="Mekânların içini 360° incele"
          className={styles.wideOnly}
        />
        <Tool
          icon={isFullscreen ? Minimize2 : Maximize2}
          label={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          short="Ekran"
          onClick={onToggleFullscreen}
        />
        <Tool icon={BookOpen} label="Not Defteri" short="Defter" onClick={onOpenNotebook} />
        <Tool icon={Briefcase} label="Envanter" onClick={onOpenInventory} />
        <Tool icon={Settings} label="Ayarlar" onClick={onOpenAudioSettings} title="Ses ayarları" />
      </div>

      <button type="button" className={styles.condemn} onClick={onOpenCondemn} aria-label="Mahkûmu Seç">
        <span className={styles.condemnSeal} aria-hidden>
          <Gavel size={20} strokeWidth={1.8} />
        </span>
        <span className={styles.condemnText}>Mahkûmu Seç</span>
        <span className={styles.condemnShort} aria-hidden>
          Hüküm
        </span>
      </button>

      <div className={`${styles.group} ${styles.groupEnd}`}>
        {showCrimeSceneButton && (
          <Tool icon={Search} label="Olay Yeri" onClick={onGoToCrimeScene} className={styles.crimeScene} />
        )}
        <Tool
          icon={isNight ? Moon : Home}
          label={isNight ? 'Eve Dön ve Dinlen' : 'Evim'}
          short={isNight ? 'Dinlen' : 'Evim'}
          onClick={onOpenHomeModal}
          className={`${styles.home} ${isNight ? styles.homeNight : ''}`}
        />
      </div>
    </footer>
  );
}
