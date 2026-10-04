'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Coins,
  Crown,
  Eye,
  Feather,
  Flame,
  Gem,
  Lock,
  Map as MapIcon,
  Skull,
  Sparkles,
  Stamp,
  Users,
  VenetianMask,
  X,
} from 'lucide-react';
import styles from './page.module.scss';
import { useMarketStore } from '@/store/useMarketStore';
import {
  CATEGORY_LABELS,
  EARN_WAYS,
  MARKET_ITEMS,
  RARITY_LABELS,
  TOKEN_PACKS,
  formatEur,
  type MarketCategory,
  type MarketItem,
} from './marketItems';

type Tab = 'all' | MarketCategory | 'tokens';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'universe', label: 'Evrenler' },
  { id: 'difficulty', label: 'Zorluklar' },
  { id: 'story', label: 'Hazır Hikayeler' },
  { id: 'cosmetic', label: 'Kozmetikler' },
  { id: 'tokens', label: 'Token Al' },
];

const CATEGORY_ORDER: MarketCategory[] = ['universe', 'difficulty', 'story', 'cosmetic'];
const FEATURED_ID = 'story_serpents_coil';
const ROMAN = ['I', 'II', 'III'];

const COSMETIC_ICONS = {
  stamp: Stamp,
  mask: VenetianMask,
  feather: Feather,
  flame: Flame,
  crown: Crown,
  eye: Eye,
};

export default function MarketPage() {
  const { tokenBalance, ownedItemIds, equippedCosmeticIds, hasHydrated, purchase, toggleEquip } =
    useMarketStore();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [pendingItem, setPendingItem] = useState<MarketItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const tabsRef = useRef<HTMLElement | null>(null);

  // localStorage yüklenene kadar varsayılanları göster; sunucu çıktısıyla uyuşmazlık olmasın
  const owned = useMemo(
    () => new Set(hasHydrated ? ownedItemIds : []),
    [hasHydrated, ownedItemIds]
  );
  const equipped = hasHydrated ? equippedCosmeticIds : [];
  const isOwned = (item: MarketItem) => item.ownedByDefault || owned.has(item.id);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!pendingItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingItem]);

  const featured = MARKET_ITEMS.find((item) => item.id === FEATURED_ID)!;
  const visibleCategories: MarketCategory[] =
    activeTab === 'all' ? CATEGORY_ORDER : activeTab === 'tokens' ? [] : [activeTab];

  const goToTokens = () => {
    setPendingItem(null);
    setActiveTab('tokens');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Gerçek para ile satın alma henüz bağlı değil; sadece görsel
  const onTokenPackClick = () => {
    setToast('Ödeme sistemi yakında açılıyor. Şimdilik tokenler oynayarak kazanılıyor.');
  };

  const confirmPurchase = () => {
    if (!pendingItem) return;
    const ok = purchase(pendingItem.id, pendingItem.price);
    if (ok) setToast(`${pendingItem.title} artık senin.`);
    setPendingItem(null);
  };

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
    if (item.category === 'cosmetic' && isOwned(item)) {
      const isEquipped = equipped.includes(item.id);
      return (
        <button
          className={isEquipped ? styles.equippedBtn : styles.ghostBtn}
          onClick={() => toggleEquip(item.id)}
        >
          {isEquipped ? <><Check size={14} /> Kuşanıldı</> : 'Kuşan'}
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
      <button className={styles.buyBtn} onClick={() => setPendingItem(item)}>
        Satın Al
      </button>
    );
  };

  const renderFooter = (item: MarketItem) => (
    <div className={styles.cardFooter}>
      {isOwned(item) ? <span className={styles.priceMuted}>{item.price === 0 ? 'Ücretsiz' : 'Arşivinde'}</span> : renderPrice(item)}
      {renderAction(item)}
    </div>
  );

  const renderUniverse = (item: MarketItem) => (
    <article key={item.id} className={`${styles.card} ${styles.universeCard} ${isOwned(item) ? styles.isOwned : ''}`}>
      <div className={styles.universeImage} style={{ backgroundImage: `url('${item.image}')` }} />
      <div className={styles.universeShade} />
      <div className={styles.universeBody}>
        <span className={styles.cardEyebrow}>{item.subtitle}</span>
        <h3 className={styles.universeTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.description}</p>
        <div className={styles.tagRow}>
          {item.tags?.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
        {renderFooter(item)}
      </div>
    </article>
  );

  const renderDifficulty = (item: MarketItem) => (
    <article key={item.id} className={`${styles.card} ${styles.difficultyCard} ${styles[`danger${item.dangerLevel}`]} ${isOwned(item) ? styles.isOwned : ''}`}>
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
            className={lvl <= (item.dangerLevel ?? 1) ? styles.skullOn : styles.skullOff}
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
    <article key={item.id} className={`${styles.card} ${styles.storyCard} ${isOwned(item) ? styles.isOwned : ''}`}>
      <div className={styles.storyImageWrap}>
        <div className={styles.storyImage} style={{ backgroundImage: `url('${item.image}')` }} />
        <span className={styles.caseNumber}>Dosya No. {String(index + 1).padStart(3, '0')}</span>
        <span className={styles.waxSeal} aria-hidden>
          <Stamp size={18} />
        </span>
      </div>
      <div className={styles.storyBody}>
        <span className={styles.cardEyebrow}>{item.subtitle}</span>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <div className={styles.metaRow}>
          <span className={styles.metaInline}><MapIcon size={14} /> {item.universe}</span>
          <span className={styles.metaInline}><Clock size={14} /> {item.length}</span>
        </div>
        <p className={styles.cardDesc}>{item.description}</p>
        {renderFooter(item)}
      </div>
    </article>
  );

  const renderCosmetic = (item: MarketItem) => {
    const Icon = COSMETIC_ICONS[item.icon ?? 'stamp'];
    return (
      <article key={item.id} className={`${styles.card} ${styles.cosmeticCard} ${styles[`rarity_${item.rarity}`]} ${isOwned(item) ? styles.isOwned : ''}`}>
        <span className={styles.rarityTag}>{RARITY_LABELS[item.rarity ?? 'common']}</span>
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

  const renderCategory = (category: MarketCategory) => {
    const items = MARKET_ITEMS.filter((item) => item.category === category);
    const label = CATEGORY_LABELS[category];
    const ownedCount = items.filter(isOwned).length;
    return (
      <section key={category} className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>{label.eyebrow}</span>
            <h2 className={styles.sectionTitle}>{label.title}</h2>
          </div>
          <span className={styles.sectionCount}>{ownedCount}/{items.length} edinildi</span>
        </header>
        <p className={styles.sectionBlurb}>{label.blurb}</p>
        <div className={`${styles.grid} ${styles[`grid_${category}`]}`}>
          {category === 'universe' && items.map(renderUniverse)}
          {category === 'difficulty' && items.map(renderDifficulty)}
          {category === 'story' && items.map(renderStory)}
          {category === 'cosmetic' && items.map(renderCosmetic)}
        </div>
      </section>
    );
  };

  const pendingPrice = pendingItem?.price ?? 0;
  const shortfall = pendingPrice - tokenBalance;

  return (
    <div className={styles.container}>
      <div className={styles.vignette} />
      <span className={styles.cornerTopLeft} />
      <span className={styles.cornerTopRight} />
      <span className={styles.cornerBotLeft} />
      <span className={styles.cornerBotRight} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <Link href="/menu" className={styles.backBtn}>
            <ArrowLeft size={16} /> Lobiye Dön
          </Link>
          <button className={styles.purse} onClick={goToTokens} title="Token bakiyen · Token al">
            <span className={styles.purseIcon}><Coins size={20} /></span>
            <span className={styles.purseAmount}>{hasHydrated ? tokenBalance.toLocaleString('tr-TR') : '—'}</span>
            <span className={styles.purseLabel}>Token</span>
            <span className={styles.purseAdd}>+</span>
          </button>
        </div>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Engizisyon Hazinesi</span>
          <h1 className={styles.title}>Market</h1>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerIcon}>✠</span>
            <span className={styles.dividerLine} />
          </div>
          <p className={styles.lead}>
            Tokenlerini yeni evrenler, daha zorlu soruşturmalar, mühürlü vaka dosyaları ve
            engizitöre yakışır eşyalar için harca.
          </p>
        </header>

        {(activeTab === 'all' || activeTab === 'story') && (
          <section className={styles.featured}>
            <div className={styles.featuredImage} style={{ backgroundImage: `url('${featured.image}')` }} />
            <div className={styles.featuredShade} />
            <div className={styles.featuredBody}>
              <span className={styles.featuredBadge}><Sparkles size={14} /> Haftanın Dosyası</span>
              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <p className={styles.featuredSubtitle}>{featured.subtitle}</p>
              <p className={styles.featuredDesc}>{featured.description}</p>
              <div className={styles.featuredMeta}>
                <span className={styles.metaInline}><BookOpen size={14} /> Hazır Hikaye</span>
                <span className={styles.metaInline}><MapIcon size={14} /> {featured.universe}</span>
                <span className={styles.metaInline}><Clock size={14} /> {featured.length}</span>
              </div>
              <div className={styles.featuredActions}>
                {isOwned(featured) ? null : renderPrice(featured)}
                {renderAction(featured)}
              </div>
            </div>
          </section>
        )}

        <nav ref={tabsRef} className={styles.tabs} aria-label="Market kategorileri">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${tab.id === 'tokens' ? styles.tabTokens : ''} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {visibleCategories.map(renderCategory)}

        {(activeTab === 'all' || activeTab === 'tokens') && (
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Hazine Odası</span>
                <h2 className={styles.sectionTitle}>Token Al</h2>
              </div>
            </header>
            <p className={styles.sectionBlurb}>
              Beklemek istemiyorsan hazineyi doldur. Tokenlerin hiçbir zaman sona ermez ve
              marketteki her şeyde kullanılabilir.
            </p>

            <div className={styles.packGrid}>
              {TOKEN_PACKS.map((pack) => (
                <article
                  key={pack.id}
                  className={`${styles.pack} ${styles[`packTier${pack.tier}`]} ${pack.highlight ? styles.packHighlight : ''}`}
                >
                  {pack.highlight && (
                    <span className={styles.packRibbon}>
                      {pack.highlight === 'popular' ? 'En Popüler' : 'En İyi Değer'}
                    </span>
                  )}
                  <div className={styles.packCoins} aria-hidden>
                    {Array.from({ length: pack.tier }).map((_, i) => (
                      <span key={i} className={styles.packCoin}>
                        {pack.tier === 4 && i === 3 ? <Gem size={18} /> : <Coins size={18} />}
                      </span>
                    ))}
                  </div>
                  <h3 className={styles.packName}>{pack.name}</h3>
                  <div className={styles.packAmount}>
                    {(pack.tokens + pack.bonus).toLocaleString('tr-TR')}
                    <span>token</span>
                  </div>
                  <span className={styles.packBonus}>
                    {pack.bonus > 0 ? `${pack.tokens.toLocaleString('tr-TR')} + ${pack.bonus.toLocaleString('tr-TR')} bonus` : ' '}
                  </span>
                  <button className={styles.packBtn} onClick={onTokenPackClick}>
                    {formatEur(pack.priceEur)}
                  </button>
                </article>
              ))}
            </div>

            <p className={styles.packNote}>
              <Lock size={14} /> Ödemeler yakında güvenli ödeme sağlayıcısı üzerinden alınacak. Fiyatlara KDV dahildir.
            </p>

            <div className={styles.earnPanel}>
              <div className={styles.earnIntro}>
                <span className={styles.sectionEyebrow}>Ücretsiz Yol</span>
                <h3 className={styles.cardTitle}>Oynayarak Kazan</h3>
                <p className={styles.cardDesc}>
                  Marketteki her şey oynayarak da açılabilir. Token satın almak sadece yolu kısaltır.
                </p>
              </div>
              <ul className={styles.earnList}>
                {EARN_WAYS.map((way) => (
                  <li key={way.id} className={styles.earnItem}>
                    <span className={styles.earnReward}><Coins size={14} /> {way.reward}</span>
                    <div>
                      <strong>{way.title}</strong>
                      <span>{way.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className={styles.bottomRule}>
          <span />
          <span className={styles.bottomRuleText}>Inquisitor AI · Hazine Defteri</span>
          <span />
        </div>
      </div>

      {pendingItem && (
        <div className={styles.modalOverlay} onClick={() => setPendingItem(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={() => setPendingItem(null)} aria-label="Kapat">
              <X size={18} />
            </button>
            <span className={styles.eyebrow}>{CATEGORY_LABELS[pendingItem.category].title}</span>
            <h2 id="purchase-title" className={styles.modalTitle}>{pendingItem.title}</h2>
            <p className={styles.modalDesc}>{pendingItem.description}</p>

            <dl className={styles.ledger}>
              <div>
                <dt>Bakiye</dt>
                <dd>{tokenBalance}</dd>
              </div>
              <div>
                <dt>Bedel</dt>
                <dd className={styles.ledgerCost}>−{pendingPrice}</dd>
              </div>
              <div className={styles.ledgerTotal}>
                <dt>Kalan</dt>
                <dd>{shortfall > 0 ? '—' : tokenBalance - pendingPrice}</dd>
              </div>
            </dl>

            {shortfall > 0 && (
              <p className={styles.modalWarning}>
                Bu eşya için {shortfall} token eksiğin var.{' '}
                <button className={styles.inlineLink} onClick={goToTokens}>Token al →</button>
              </p>
            )}

            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setPendingItem(null)}>
                Vazgeç
              </button>
              <button className={styles.buyBtn} onClick={confirmPurchase} disabled={shortfall > 0}>
                Mühürle ve Satın Al
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
