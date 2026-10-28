import React from 'react';
import {
  Gavel,
  Hourglass,
  KeyRound,
  Lightbulb,
  NotebookPen,
  Target,
  X,
} from 'lucide-react';
import styles from '../../page.module.scss';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.sheet} ${styles.guideSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.sheetClose} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <span className={styles.sheetSeal} aria-hidden>✠</span>
        <span className={styles.sheetEyebrow}>Engizitörün El Kitabı</span>
        <h2 id="guide-title" className={styles.sheetTitle}>Soruşturma Kılavuzu</h2>
        <p className={styles.sheetLead}>
          Bir cinayet işlendi ve katil hâlâ aranızda. Dört gün içinde gerçeği bul ve doğru kişiyi mahkûm et.
        </p>

        <ol className={styles.guideSteps}>
          <li className={styles.guideStep}>
            <span className={styles.guideIcon}><Target size={18} /></span>
            <div>
              <h3>Amacın</h3>
              <p>
                Sen, cinayeti çözmekle görevli bir Engizisyon müfettişisin. <strong>Dört günün</strong> var:
                şüphelileri sorgula, kanıtları topla ve süre dolmadan katili bul.
              </p>
            </div>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideIcon}><Hourglass size={18} /></span>
            <div>
              <h3>Zaman</h3>
              <p>
                Bir mekâna her girdiğinde vakit ilerler. Gece çöktüğünde herkes evine çekilir ve gün biter;
                zamanını nereye harcadığına dikkat et.
              </p>
            </div>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideIcon}><KeyRound size={18} /></span>
            <div>
              <h3>Arama İzinleri</h3>
              <p>
                Kanıtları yalnızca sorgularda değil, mekânları arayarak da bulabilirsin. Bir mekânı aramak için
                izin gerekir: Ashenmoor’da izni <strong>Peder Malachar</strong>, diğer evrenlerde karakoldaki yetkili
                verir. Bir soruşturmada genellikle en fazla iki izin alabilirsin; bazı vakalarda yetkililer üçüncüsüne de razı olur.
              </p>
            </div>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideIcon}><NotebookPen size={18} /></span>
            <div>
              <h3>Notlar</h3>
              <p>
                Şüphelilerin anlattıkları birbiriyle çelişebilir. Önemli ayrıntıları not defterine yaz; çelişkiler
                seni katile götürür.
              </p>
            </div>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideIcon}><Gavel size={18} /></span>
            <div>
              <h3>Hüküm</h3>
              <p>
                Hazır olduğunda haritadaki <strong>Hüküm Verilecek Kişiyi Seç</strong> düğmesiyle kararını ver.
                Yanlış kişiyi mahkûm edersen gerçek katil elini kolunu sallayarak dolaşmaya devam eder.
              </p>
            </div>
          </li>
        </ol>

        <div className={styles.guideTip}>
          <Lightbulb size={16} />
          <p>
            <strong>İpucu:</strong> Yalan söyleyen herkes katil değildir. Masumların da saklayacak sırları var.
          </p>
        </div>

        <button className={styles.sheetPrimary} onClick={onClose}>
          Anladım
        </button>
      </div>
    </div>
  );
}
