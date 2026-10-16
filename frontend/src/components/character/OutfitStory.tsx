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

// "Yakında aktif" rozeti bir blokta yalnızca bir kez gösterilir. Tek tek karakterin yetenekleri de
// henüz yazılmamışsa (pending) rozet görünür.
function SoonBadge({ pending }: { pending?: boolean }) {
  return ABILITIES_LIVE && !pending ? null : <span className={styles.soon}>Yakında aktif</span>;
}

function AbilityCard({
  ability,
  detailed,
  clamp,
}: {
  ability: OutfitAbility;
  detailed?: boolean;
  clamp?: boolean;
}) {
  return (
    <div className={`${styles.ability} ${detailed ? styles.abilityDetailed : ''}`}>
      <div className={styles.abilityHead}>
        <Sparkles size={14} aria-hidden />
        <span className={styles.abilityName}>{ability.name}</span>
        <span className={styles.abilityUsage}>{ability.usage}</span>
      </div>
      <p className={`${styles.abilitySummary} ${clamp ? styles.clamp : ''}`}>{ability.summary}</p>
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
// compact: kartlarda (market, lobi) ilk yetenek özetiyle görünür, diğerleri ad olarak sıralanır; kart boyları eşit kalır
export default function OutfitStory({
  outfit,
  className = '',
  compact = false,
}: {
  outfit: Outfit;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const data = getOutfitStory(outfit.id);
  if (!data) return null;
  const [first, ...rest] = data.abilities;

  return (
    <div className={`${styles.block} ${className}`}>
      <div className={styles.blockHead}>
        <span className={styles.blockLabel}>{data.abilities.length > 1 ? 'Yetenekler' : 'Yetenek'}</span>
        <SoonBadge pending={data.pending} />
      </div>
      <div className={styles.abilities}>
        {compact ? (
          <>
            <AbilityCard ability={first} clamp />
            {rest.length > 0 && (
              <div className={styles.extras}>
                {rest.map((ability) => (
                  <span key={ability.name} className={styles.extraChip}>
                    + {ability.name}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          data.abilities.map((ability) => <AbilityCard key={ability.name} ability={ability} />)
        )}
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{data.abilities.length > 1 ? 'Yetenekler' : 'Yetenek'}</h3>
            <SoonBadge pending={data.pending} />
          </div>
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
