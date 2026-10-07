'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Outfit } from '@/config/outfits';
import CharacterTurntable from './CharacterTurntable';
import styles from './CharacterShowcase.module.scss';

const RARITY_LABELS: Record<Outfit['rarity'], string> = {
  common: 'Sıradan',
  rare: 'Nadir',
  legendary: 'Efsanevi',
};

type Props = {
  outfit: Outfit;
  // preview: mağazada satın almadan önce inceleme; reveal: yeni alınan karakterin tanıtım sahnesi
  mode: 'preview' | 'reveal';
  actions?: ReactNode;
  onClose: () => void;
};

// Karakteri tam ekran, büyük 3D gösterimle sunar. Tanıtım modunda kamera yaklaşır,
// ad mühür efektiyle belirir.
export default function CharacterShowcase({ outfit, mode, actions, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={`${styles.overlay} ${styles[mode]} ${styles[`rarity_${outfit.rarity}`]}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="showcase-title"
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Kapat">
          <X size={20} />
        </button>

        <div className={styles.stage}>
          <span className={styles.beam} aria-hidden />
          <span className={styles.halo} aria-hidden />
          <CharacterTurntable outfitId={outfit.id} alt={outfit.name} className={styles.model} />
          <span className={styles.floor} aria-hidden />
        </div>

        <div className={styles.info}>
          {mode === 'reveal' && (
            <span className={styles.seal} aria-hidden>
              ✠
            </span>
          )}
          <span className={styles.eyebrow}>
            {mode === 'reveal' ? 'Gardırobuna katıldı' : RARITY_LABELS[outfit.rarity]} · {outfit.title}
          </span>
          <h2 id="showcase-title" className={styles.name}>
            {outfit.name}
          </h2>
          <p className={styles.desc}>{outfit.description}</p>
          <p className={styles.lore}>{outfit.lore}</p>
          <blockquote className={styles.quote}>“{outfit.quote}”</blockquote>
          {actions && <div className={styles.actions}>{actions}</div>}
          <span className={styles.hint}>Sürükleyerek çevir</span>
        </div>
      </div>
    </div>
  );
}
