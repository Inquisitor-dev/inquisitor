import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock,
  Coins,
  Crown,
  Eye,
  Feather,
  Flame,
  Map as MapIcon,
  Shirt,
  Skull,
  Stamp,
  Users,
  VenetianMask,
} from 'lucide-react';
import styles from '../../page.module.scss';
import {
  CATEGORY_LABELS,
  RARITY_LABELS,
  type MarketCategory,
  type MarketItem,
} from '../../marketItems';

const ROMAN = ['I', 'II', 'III'];

const COSMETIC_ICONS = {
  stamp: Stamp,
  mask: VenetianMask,
  feather: Feather,
  flame: Flame,
  crown: Crown,
  eye: Eye,
};

function OutfitPortrait({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Shirt size={44} strokeWidth={1.3} />;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

interface MarketCategorySectionProps {
  category: MarketCategory;
  items: MarketItem[];
  isOwned: (item: MarketItem) => boolean;
  wornOutfitId: string | null;
  equippedCosmetics: string[];
  tokenBalance: number;
  hasHydrated: boolean;
  onSetPendingItem: (item: MarketItem) => void;
  onSetPreviewItem: (item: MarketItem) => void;
  onEquipOutfit: (outfitId: string) => void;
  onToggleEquip: (itemId: string) => void;
}

export default function MarketCategorySection({
  category,
  items,
  isOwned,
  wornOutfitId,
  equippedCosmetics,
  tokenBalance,
  hasHydrated,
  onSetPendingItem,
  onSetPreviewItem,
  onEquipOutfit,
  onToggleEquip,
}: MarketCategorySectionProps) {
  const label = CATEGORY_LABELS[category];
  const ownedCount = items.filter(isOwned).length;

  const renderPrice = (item: MarketItem) => {
    const affordable = !hasHydrated || tokenBalance >= item.price;
    return (
      <span className={`${styles.price} ${affordable ? '' : styles.priceShort}`}>
        <Coins size={16} strokeWidth={2} />
        {item.price}
      </span>
    );
  };

  const renderAction = (item: MarketItem) => {
    if (item.category === 'outfit') {
      if (item.comingSoon) {
        return (
          <span className={styles.soonTag}>
            <Clock size={14} /> Yakında
          </span>
        );
      }
      if (isOwned(item) && item.outfitId) {
        const isWorn = wornOutfitId === item.outfitId;
        const outfitId = item.outfitId;
        return (
          <button
            type="button"
            className={isWorn ? styles.equippedBtn : styles.ghostBtn}
            onClick={() => onEquipOutfit(outfitId)}
            disabled={isWorn}
          >
            {isWorn ? (
              <>
                <Check size={14} /> Giyili
              </>
            ) : (
              'Giy'
            )}
          </button>
        );
      }
    }
    if (item.category === 'cosmetic' && isOwned(item)) {
      const isEquipped = equippedCosmetics.includes(item.id);
      return (
        <button
          type="button"
          className={isEquipped ? styles.equippedBtn : styles.ghostBtn}
          onClick={() => onToggleEquip(item.id)}
        >
          {isEquipped ? (
            <>
              <Check size={14} /> Kuşanıldı
            </>
          ) : (
            'Kuşan'
          )}
        </button>
      );
    }
    if (isOwned(item)) {
      return (
        <span className={styles.ownedTag}>
          <Check size={14} /> {item.ownedByDefault ? 'Varsayılan' : 'Sahipsin'}
        </span>
      );
    }
    return (
      <button
        type="button"
        className={styles.buyBtn}
        onClick={() => onSetPendingItem(item)}
      >
        Satın Al
      </button>
    );
  };

  const renderFooter = (item: MarketItem) => (
    <div className={styles.cardFooter}>
      {isOwned(item) ? (
        <span className={styles.priceMuted}>
          {item.price === 0
            ? 'Ücretsiz'
            : item.category === 'outfit'
              ? 'Gardırobunda'
              : 'Arşivinde'}
        </span>
      ) : (
        renderPrice(item)
      )}
      {renderAction(item)}
    </div>
  );

  const renderUniverse = (item: MarketItem) => (
    <article
      key={item.id}
      className={`${styles.card} ${styles.universeCard} ${isOwned(item) ? styles.isOwned : ''}`}
    >
      <div
        className={styles.universeImage}
        style={{ backgroundImage: `url('${item.image}')` }}
      />
      <div className={styles.universeShade} />
      <div className={styles.universeBody}>
        <span className={styles.cardEyebrow}>{item.subtitle}</span>
        <h3 className={styles.universeTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.description}</p>
        <div className={styles.tagRow}>
          {item.tags?.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        {renderFooter(item)}
      </div>
    </article>
  );

  const renderDifficulty = (item: MarketItem) => (
    <article
      key={item.id}
      className={`${styles.card} ${styles.difficultyCard} ${styles[`danger${item.dangerLevel}`]} ${isOwned(item) ? styles.isOwned : ''}`}
    >
      <div className={styles.rankSeal}>
        <span>{ROMAN[(item.dangerLevel ?? 1) - 1]}</span>
      </div>
      <span className={styles.cardEyebrow}>{item.subtitle} Zorluk</span>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <div className={styles.dangerRow}>
        {[1, 2, 3].map((lvl) => (
          <Skull
            key={lvl}
            size={18}
            className={
              lvl <= (item.dangerLevel ?? 1) ? styles.skullOn : styles.skullOff
            }
          />
        ))}
        <span className={styles.metaInline}>
          <Users size={14} /> {item.suspects} şüpheli
        </span>
      </div>
      <p className={styles.cardDesc}>{item.description}</p>
      {renderFooter(item)}
    </article>
  );

  const renderStory = (item: MarketItem, index: number) => (
    <article
      key={item.id}
      className={`${styles.card} ${styles.storyCard} ${isOwned(item) ? styles.isOwned : ''}`}
    >
      <div className={styles.storyImageWrap}>
        <div
          className={styles.storyImage}
          style={{ backgroundImage: `url('${item.image}')` }}
        />
        <span className={styles.caseNumber}>
          Dosya No. {String(index + 1).padStart(3, '0')}
        </span>
        <span className={styles.waxSeal} aria-hidden>
          <Stamp size={18} />
        </span>
      </div>
      <div className={styles.storyBody}>
        <span className={styles.cardEyebrow}>{item.subtitle}</span>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <div className={styles.metaRow}>
          <span className={styles.metaInline}>
            <MapIcon size={14} /> {item.universe}
          </span>
          <span className={styles.metaInline}>
            <Clock size={14} /> {item.length}
          </span>
        </div>
        <p className={styles.cardDesc}>{item.description}</p>
        {renderFooter(item)}
      </div>
    </article>
  );

  const renderCosmetic = (item: MarketItem) => {
    const Icon = COSMETIC_ICONS[item.icon ?? 'stamp'];
    return (
      <article
        key={item.id}
        className={`${styles.card} ${styles.cosmeticCard} ${styles[`rarity_${item.rarity}`]} ${isOwned(item) ? styles.isOwned : ''}`}
      >
        <span className={styles.rarityTag}>
          {RARITY_LABELS[item.rarity ?? 'common']}
        </span>
        <div className={styles.cosmeticFrame}>
          <Icon size={40} strokeWidth={1.4} />
        </div>
        <span className={styles.cardEyebrow}>{item.subtitle}</span>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.description}</p>
        {renderFooter(item)}
      </article>
    );
  };

  const renderOutfit = (item: MarketItem) => (
    <article
      key={item.id}
      className={`${styles.card} ${styles.outfitCard} ${styles[`rarity_${item.rarity}`]} ${isOwned(item) ? styles.isOwned : ''} ${item.comingSoon ? styles.isSoon : ''}`}
    >
      <span className={styles.rarityTag}>
        {RARITY_LABELS[item.rarity ?? 'common']}
      </span>
      {item.comingSoon ? (
        <div className={styles.outfitPortrait}>
          <OutfitPortrait src={item.image} alt={item.title} />
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.outfitPortrait} ${styles.outfitPortraitButton}`}
          onClick={() => onSetPreviewItem(item)}
          aria-label={`${item.title} karakterini 3D incele`}
        >
          <OutfitPortrait src={item.image} alt={item.title} />
          <span className={styles.inspectTag}>
            <Eye size={13} /> 3D İncele
          </span>
        </button>
      )}
      <span className={styles.cardEyebrow}>{item.subtitle}</span>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <p className={styles.cardDesc}>{item.description}</p>
      {renderFooter(item)}
      {isOwned(item) && !item.comingSoon && (
        <Link href="/wardrobe" className={styles.wardrobeLink}>
          <Shirt size={14} /> Gardıropta 360° İncele
        </Link>
      )}
    </article>
  );

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>{label.eyebrow}</span>
          <h2 className={styles.sectionTitle}>{label.title}</h2>
        </div>
        <span className={styles.sectionCount}>
          {ownedCount}/{items.length} edinildi
        </span>
      </header>
      <p className={styles.sectionBlurb}>{label.blurb}</p>
      <div className={`${styles.grid} ${styles[`grid_${category}`]}`}>
        {category === 'universe' && items.map(renderUniverse)}
        {category === 'difficulty' && items.map(renderDifficulty)}
        {category === 'story' && items.map(renderStory)}
        {category === 'outfit' && items.map(renderOutfit)}
        {category === 'cosmetic' && items.map(renderCosmetic)}
      </div>
    </section>
  );
}
