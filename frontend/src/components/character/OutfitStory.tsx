'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Sparkles, X } from 'lucide-react';
import type { Outfit } from '@/config/outfits';
import { ABILITIES_LIVE, getOutfitStory, type OutfitAbility } from '@/config/outfitStories';
import styles from './OutfitStory.module.scss';

const RARITY_LABELS: Record<Outfit['rarity'], string> = {
  common: 'Sıradan',
  rare: 'Nadir',
  legendary: 'Efsanevi',
};

function AbilityCard({ ability, detailed }: { ability: OutfitAbility; detailed?: boolean }) {
  return (
    <div className={`${styles.ability} ${detailed ? styles.abilityDetailed : ''}`}>
      <div className={styles.abilityHead}>
        <Sparkles size={14} aria-hidden />
        <span className={styles.abilityName}>{ability.name}</span>
        <span className={styles.abilityUsage}>{ability.usage}</span>
        {!ABILITIES_LIVE && <span className={styles.soon}>Yakında aktif</span>}
      </div>
      <p className={styles.abilitySummary}>{ability.summary}</p>
      {detailed && (
        <ul className={styles.rules}>
          {ability.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Karakterin yetenekleri (kısa görünüm) ve "Detaylı Bak" düğmesi. Market, gardırop ve menüde kullanılır.
export default function OutfitStory({ outfit, className = '' }: { outfit: Outfit; className?: string }) {
  const [open, setOpen] = useState(false);
  const data = getOutfitStory(outfit.id);
  if (!data) return null;

  return (
    <div className={`${styles.block} ${className}`}>
      <div className={styles.abilities}>
        {data.abilities.map((ability) => (
          <AbilityCard key={ability.name} ability={ability} />
        ))}
      </div>
      <button type="button" className={styles.moreBtn} onClick={() => setOpen(true)}>
        <BookOpen size={14} /> Detaylı Bak
      </button>
      {open && <StoryModal outfit={outfit} onClose={() => setOpen(false)} />}
    </div>
  );
}

function StoryModal({ outfit, onClose }: { outfit: Outfit; onClose: () => void }) {
  const data = getOutfitStory(outfit.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Altta açık bir sahne (mağaza önizlemesi) varsa o da kapanmasın
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  if (!data) return null;

  // Üst katmanlardaki dönüşümler `fixed` konumu bozmasın diye body'ye taşınır
  return createPortal(
    <div
      className={`${styles.overlay} ${styles[`rarity_${outfit.rarity}`]}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`story-${outfit.id}`}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        <header className={styles.header}>
          <span className={styles.eyebrow}>
            {RARITY_LABELS[outfit.rarity]} · {outfit.title}
          </span>
          <h2 id={`story-${outfit.id}`} className={styles.title}>
            {outfit.name}
          </h2>
          <blockquote className={styles.quote}>“{outfit.quote}”</blockquote>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{data.abilities.length > 1 ? 'Yetenekler' : 'Yetenek'}</h3>
          {data.abilities.map((ability) => (
            <AbilityCard key={ability.name} ability={ability} detailed />
          ))}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Hikâye</h3>
          {data.story.map((paragraph) => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </section>
      </div>
    </div>,
    document.body,
  );
}
