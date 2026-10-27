import { LogOut, MessageSquare, Moon, Sun, SunDim, Sunrise, Sunset, type LucideIcon } from 'lucide-react';
import { TIME_LABELS } from '@/config/mapBackgrounds';
import styles from './MapHud.module.scss';

// Günün beş vakti; harita ve sahne geçişi aynı adları kullanır (TIME_LABELS)
const PHASE_ICONS: LucideIcon[] = [Sunrise, Sun, SunDim, Sunset, Moon];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const roman = (n: number) => ROMAN[n] ?? String(n);

interface MapHudProps {
  townName: string;
  timeOfDay: number;
  currentDay: number;
  lastDay: number;
  dialoguesUsed: number;
  dialoguesMax: number;
  unlimited: boolean;
  onRetreat: () => void;
}

// Haritanın üst barı: çıkış, kasabanın adı ile gün saati ve günlük soru hakkı
export default function MapHud({
  townName,
  timeOfDay,
  currentDay,
  lastDay,
  dialoguesUsed,
  dialoguesMax,
  unlimited,
  onRetreat,
}: MapHudProps) {
  const phase = Math.min(Math.max(timeOfDay, 0), TIME_LABELS.length - 1);
  const left = Math.max(dialoguesMax - dialoguesUsed, 0);
  const ratio = dialoguesMax > 0 ? left / dialoguesMax : 0;
  const lastDayToday = currentDay >= lastDay;

  return (
    <header className={styles.hud}>
      <button type="button" onClick={onRetreat} className={styles.exit}>
        <LogOut size={15} aria-hidden />
        <span>Kaydet ve Çık</span>
      </button>

      <div className={styles.center}>
        <h1 className={styles.town}>{townName}</h1>
        <div
          className={`${styles.clock} ${phase === 4 ? styles.clockNight : ''}`}
          role="status"
          aria-label={`${currentDay}. gün, ${TIME_LABELS[phase]}`}
        >
          <span className={`${styles.day} ${lastDayToday ? styles.dayLast : ''}`}>
            Gün <strong>{roman(currentDay)}</strong>
            <span className={styles.dayOf}>/ {roman(lastDay)}</span>
          </span>
          <ol className={styles.phases} aria-hidden>
            {PHASE_ICONS.map((Icon, i) => (
              <li
                key={TIME_LABELS[i]}
                className={`${styles.phase} ${i < phase ? styles.phasePast : ''} ${i === phase ? styles.phaseNow : ''}`}
                title={TIME_LABELS[i]}
              >
                <Icon size={i === phase ? 16 : 13} />
              </li>
            ))}
          </ol>
          <span className={styles.phaseLabel}>{TIME_LABELS[phase]}</span>
        </div>
      </div>

      <div
        className={`${styles.quota} ${!unlimited && ratio <= 0.2 ? styles.quotaLow : ''}`}
        title="Bugün kalan soru hakkın"
      >
        <MessageSquare size={15} aria-hidden />
        <span className={styles.quotaText}>
          <span className={styles.quotaLabel}>Soru hakkı</span>
          <strong>{unlimited ? 'Sınırsız' : `${left}/${dialoguesMax}`}</strong>
        </span>
        {!unlimited && (
          <span className={styles.meter} aria-hidden>
            <span className={styles.meterFill} style={{ width: `${ratio * 100}%` }} />
          </span>
        )}
      </div>
    </header>
  );
}
