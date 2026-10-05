'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Coins, Shirt, Store, X } from 'lucide-react';
import styles from './page.module.scss';
import DressedCharacter from '@/components/character/DressedCharacter';
import { useMarketStore } from '@/store/useMarketStore';
import {
  RARITY_LABELS,
  SLOT_LABELS,
  SLOT_Z_ORDER,
  getItemById,
  getOutfitItems,
  type MarketItem,
  type OutfitSlot,
} from '../market/marketItems';

type SlotFilter = 'all' | OutfitSlot;

// Mantıksal sıra: baştan ayağa (çizim sırasının tersi)
const SLOT_ORDER: OutfitSlot[] = [...SLOT_Z_ORDER].reverse();

const FILTERS: { id: SlotFilter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  ...SLOT_ORDER.map((slot) => ({ id: slot as SlotFilter, label: SLOT_LABELS[slot] })),
];

// Küçük görsel henüz üretilmemiş olabilir; yüklenemezse ikon göster
function OutfitThumb({ item }: { item: MarketItem }) {
  const [failed, setFailed] = useState(false);
  const src = item.thumb ?? item.layer;

  if (!src || failed) {
    return (
      <span className={styles.thumbFallback} aria-hidden>
        <Shirt size={40} strokeWidth={1.3} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.thumbImg} onError={() => setFailed(true)} draggable={false} />
  );
}

export default function WardrobePage() {
  const { tokenBalance, ownedItemIds, equippedOutfit, hasHydrated, equipOutfit, unequipSlot, clearOutfit } =
    useMarketStore();

  const [activeSlot, setActiveSlot] = useState<SlotFilter>('all');
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);

  // localStorage yüklenene kadar boş göster; sunucu çıktısıyla uyuşmazlık olmasın
  const outfit = useMemo(() => (hasHydrated ? equippedOutfit : {}), [hasHydrated, equippedOutfit]);

  const ownedOutfits = useMemo(() => {
    if (!hasHydrated) return [];
    return getOutfitItems().filter((item) => ownedItemIds.includes(item.id));
  }, [hasHydrated, ownedItemIds]);

  const visibleOutfits =
    activeSlot === 'all' ? ownedOutfits : ownedOutfits.filter((item) => item.slot === activeSlot);

  const equippedCount = SLOT_ORDER.filter((slot) => outfit[slot]).length;
  const hoveredItem = hoveredId ? getItemById(hoveredId) : undefined;

  const countForSlot = (filter: SlotFilter) =>
    filter === 'all' ? ownedOutfits.length : ownedOutfits.filter((item) => item.slot === filter).length;

  const renderCard = (item: MarketItem) => {
    const slot = item.slot!;
    const isEquipped = outfit[slot] === item.id;
    const rarity = item.rarity ?? 'common';
    return (
      <article
        key={item.id}
        className={`${styles.card} ${styles[`rarity_${rarity}`]} ${isEquipped ? styles.cardEquipped : ''}`}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? undefined : prev))}
        onFocus={() => setHoveredId(item.id)}
        onBlur={() => setHoveredId((prev) => (prev === item.id ? undefined : prev))}
      >
        <span className={styles.rarityTag}>{RARITY_LABELS[rarity]}</span>
        {isEquipped && (
          <span className={styles.equippedMark} aria-hidden>
            <Check size={12} strokeWidth={3} />
          </span>
        )}
        <div className={styles.thumbFrame}>
          <OutfitThumb item={item} />
        </div>
        <span className={styles.cardEyebrow}>{SLOT_LABELS[slot]}</span>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <button
          className={isEquipped ? styles.equippedBtn : styles.wearBtn}
          onClick={() => equipOutfit(item.id, slot)}
          aria-pressed={isEquipped}
          title={isEquipped ? 'Çıkarmak için tıkla' : `${SLOT_LABELS[slot]} slotuna giy`}
        >
          {isEquipped ? (
            <>
              <Check size={14} /> Giyili
            </>
          ) : (
            'Giy'
          )}
        </button>
      </article>
    );
  };

  const renderEmpty = () => (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden>
        <Shirt size={34} strokeWidth={1.3} />
      </span>
      <h3 className={styles.emptyTitle}>Gardırobun boş</h3>
      <p className={styles.emptyText}>
        {ownedOutfits.length === 0
          ? 'Henüz hiç kıyafetin yok. Marketten aldığın parçalar burada belirir.'
          : `${SLOT_LABELS[activeSlot as OutfitSlot]} slotu için henüz bir parçan yok.`}
      </p>
      <Link href="/market?tab=outfit" className={styles.marketBtn}>
        <Store size={15} /> Kıyafetlere Göz At
      </Link>
    </div>
  );

  const renderPlaceholders = () => (
    <div className={styles.grid} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.cardPlaceholder} />
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.vignette} />
      <span className={styles.cornerTopLeft} />
      <span className={styles.cornerTopRight} />
      <span className={styles.cornerBotLeft} />
      <span className={styles.cornerBotRight} />

      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/favicon.png" alt="" className={styles.logo} />
          <span className={styles.navTitle}>The Inquisitor</span>
        </div>

        <div className={styles.navLinks}>
          <Link href="/menu" className={styles.navLink}>
            <ArrowLeft size={16} /> <span className={styles.navLinkText}>Lobiye Dön</span>
          </Link>
          <Link href="/market" className={styles.navLink}>
            <Store size={16} /> <span className={styles.navLinkText}>Market</span>
          </Link>
        </div>

        <div className={styles.navRight}>
          <Link href="/market" className={styles.currency} title="Token bakiyen · Markete git">
            <span className={styles.currencyIcon}>
              <Coins size={15} />
            </span>
            <span>{hasHydrated ? tokenBalance.toLocaleString('tr-TR') : '—'}</span>
          </Link>
        </div>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Engizitörün Dolabı</span>
          <h1 className={styles.title}>Gardırop</h1>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerIcon}>✠</span>
            <span className={styles.dividerLine} />
          </div>
          <p className={styles.lead}>
            Satın aldığın parçaları kuşan, üstünde nasıl durduğuna bak. Giydiklerin lobide de karakterinde görünür.
          </p>
        </header>

        <div className={styles.layout}>
          {/* KARAKTER ÖNİZLEME */}
          <aside className={`${styles.panel} ${styles.previewPanel}`}>
            <div className={styles.panelHead}>
              <span className={styles.panelEyebrow}>Ayna</span>
              <span className={styles.panelCount}>
                {hasHydrated ? `${equippedCount}/${SLOT_ORDER.length} giyili` : ' '}
              </span>
            </div>

            <div className={styles.stage}>
              <span className={styles.stageHalo} />
              <DressedCharacter outfit={outfit} previewItemId={hoveredId} className={styles.character} />
              <span className={styles.stagePedestal} />
            </div>

            <p className={styles.previewHint} aria-live="polite">
              {hoveredItem ? (
                <>
                  Deneniyor: <strong>{hoveredItem.title}</strong>
                </>
              ) : (
                'Denemek için bir parçanın üstüne gel.'
              )}
            </p>

            <ul className={styles.slotList}>
              {SLOT_ORDER.map((slot) => {
                const item = outfit[slot] ? getItemById(outfit[slot]!) : undefined;
                return (
                  <li key={slot} className={`${styles.slotChip} ${item ? styles.slotFilled : ''}`}>
                    <span className={styles.slotLabel}>{SLOT_LABELS[slot]}</span>
                    <span className={styles.slotValue}>{item ? item.title : 'Boş'}</span>
                    {item && (
                      <button
                        className={styles.slotRemove}
                        onClick={() => unequipSlot(slot)}
                        aria-label={`${SLOT_LABELS[slot]} çıkar`}
                        title="Çıkar"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <button className={styles.clearBtn} onClick={clearOutfit} disabled={equippedCount === 0}>
              Hepsini Çıkar
            </button>
          </aside>

          {/* SAHİP OLUNAN KIYAFETLER */}
          <section className={styles.collection}>
            <nav className={styles.tabs} aria-label="Kıyafet slotları">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`${styles.tab} ${activeSlot === filter.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveSlot(filter.id)}
                  aria-pressed={activeSlot === filter.id}
                >
                  {filter.label}
                  {hasHydrated && <span className={styles.tabCount}>{countForSlot(filter.id)}</span>}
                </button>
              ))}
            </nav>

            <div onMouseLeave={() => setHoveredId(undefined)}>
              {!hasHydrated
                ? renderPlaceholders()
                : visibleOutfits.length === 0
                  ? renderEmpty()
                  : <div className={styles.grid}>{visibleOutfits.map(renderCard)}</div>}
            </div>
          </section>
        </div>

        <div className={styles.bottomRule}>
          <span />
          <span className={styles.bottomRuleText}>Inquisitor AI · Gardırop Defteri</span>
          <span />
        </div>
      </div>
    </div>
  );
}
