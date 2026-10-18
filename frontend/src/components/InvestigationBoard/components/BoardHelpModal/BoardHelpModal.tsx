import React from 'react';
import styles from '../../InvestigationBoard.module.scss';

interface BoardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardHelpModal({ isOpen, onClose }: BoardHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.helpOverlay} onClick={onClose}>
      <div className={styles.helpCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.helpTitle}>Soruşturma Panosu</h2>
        <ol className={styles.helpSteps}>
          <li>
            <strong>Kartları as.</strong> Alttaki dosyadan bir şüpheliye, kanıta ya da &ldquo;Not Ekle&rdquo;ye
            tıkla; kart panoya asılır. Kartı sürükleyerek yerini değiştir.
          </li>
          <li>
            <strong>İp çek.</strong> Bir kartın kırmızı raptiyesini başka bir karta sürükle (telefonda önce
            raptiyeye, sonra karta dokun). Sonra ipin anlamını seç: bir kanıt bir şüpheliyi{' '}
            <em>aklıyor</em> ya da <em>suçluyor</em>, iki kanıt birbirini <em>doğruluyor</em> ya da{' '}
            <em>çelişiyor</em>. Fikrini değiştirirsen ipin ortasındaki düğüme tıklayıp anlamını (rengini)
            değiştirebilir ya da ipi koparabilirsin.
          </li>
          <li>
            <strong>Düşün.</strong> Günde bir kez panona bakıp düşünebilirsin. Her seferinde henüz
            tartmadığın en fazla üç ipe bakarsın; önce kurduğun ipler önce gelir, kalanlar sonraki düşünüşe
            kalır. İç sesin hangi iplerin tuttuğunu söyler: tartılan ipler mühürlenir, aklanan şüpheliye damga
            basılır. Hangi bağları tartacağını iyi seç.
          </li>
        </ol>
        <button type="button" className={styles.thinkBtn} onClick={onClose}>
          Anladım
        </button>
      </div>
    </div>
  );
}
