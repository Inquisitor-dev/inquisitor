'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import { findOutfit, wearableOutfitId } from '@/config/outfits';
import CharacterShowcase from '@/components/character/CharacterShowcase';
import styles from './page.module.scss';
import {
  MARKET_ITEMS,
  type MarketCategory,
  type MarketItem,
  type TokenPack,
} from './marketItems';
import PurchaseModal from './components/PurchaseModal/PurchaseModal';
import TokenPacksSection from './components/TokenPacksSection/TokenPacksSection';
import FeaturedStorySection from './components/FeaturedStorySection/FeaturedStorySection';
import MarketCategorySection from './components/MarketCategorySection/MarketCategorySection';

type Tab = 'all' | MarketCategory | 'tokens';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'universe', label: 'Evrenler' },
  { id: 'difficulty', label: 'Zorluklar' },
  { id: 'story', label: 'Hazır Hikâyeler' },
  { id: 'outfit', label: 'Karakterler' },
  { id: 'cosmetic', label: 'Kozmetikler' },
  { id: 'tokens', label: 'Token Al' },
];

const CATEGORY_ORDER: MarketCategory[] = ['universe', 'difficulty', 'story', 'outfit', 'cosmetic'];
const FEATURED_ID = 'story_serpents_coil';

export default function MarketPage() {
  const { authToken } = useGameStore();
  const {
    tokenBalance,
    ownedItemIds,
    equippedCosmeticIds,
    equippedOutfitId,
    hasHydrated,
    fetchMarketData,
    purchaseServer,
    purchase,
    toggleEquip,
    equipOutfit,
    createCheckout,
    simulatePayment,
  } = useMarketStore();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [pendingItem, setPendingItem] = useState<MarketItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewItem, setPreviewItem] = useState<MarketItem | null>(null);
  const [revealOutfitId, setRevealOutfitId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (authToken) {
      fetchMarketData(authToken);
    }
  }, [authToken, fetchMarketData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const packId = urlParams.get('pack_id');
    const testSimulated = urlParams.get('test_simulated');

    if (payment === 'success') {
      if (testSimulated === '1' && packId && authToken) {
        simulatePayment(packId, authToken).then((res) => {
          if (res.success) {
            setToast('Test ödemesi başarıyla tamamlandı! Tokenler hesabına aktarıldı.');
          }
        });
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Stripe dönüş parametreleri yalnızca tarayıcıda okunabilir
        setToast('Ödeme başarıyla alındı! Tokenler hazineye aktarıldı.');
        if (authToken) fetchMarketData(authToken);
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'cancelled') {
      setToast('Ödeme işlemi iptal edildi.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [authToken, fetchMarketData, simulatePayment]);

  const owned = useMemo(
    () => new Set(hasHydrated ? ownedItemIds : []),
    [hasHydrated, ownedItemIds]
  );
  const equipped = hasHydrated ? equippedCosmeticIds : [];
  const wornOutfitId = hasHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  const isOwned = (item: MarketItem) => item.ownedByDefault || owned.has(item.id);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
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

  const onTokenPackClick = async (pack: TokenPack) => {
    if (!authToken) {
      setToast('Token satın almak için önce giriş yapmalısın.');
      return;
    }

    setIsProcessing(true);
    setToast('Ödeme sayfası hazırlanıyor...');

    const res = await createCheckout(pack.id, authToken);
    setIsProcessing(false);

    if (res.error) {
      setToast(`Hata: ${res.error}`);
      return;
    }

    if (res.checkoutUrl) {
      if (res.isSimulated) {
        setToast('Test ödemesi yapılıyor...');
        const simRes = await simulatePayment(pack.id, authToken);
        if (simRes.success) {
          setToast(`${pack.name} başarıyla satın alındı! +${pack.tokens + pack.bonus} token eklendi.`);
        } else {
          setToast(simRes.error || 'İşlem başarısız.');
        }
      } else {
        window.location.assign(res.checkoutUrl);
      }
    }
  };

  const confirmPurchase = async () => {
    if (!pendingItem) return;

    if (authToken) {
      setIsProcessing(true);
      const res = await purchaseServer(pendingItem.id, authToken);
      setIsProcessing(false);
      if (res.success) {
        if (pendingItem.outfitId) setRevealOutfitId(pendingItem.outfitId);
        else setToast(`${pendingItem.title} başarıyla mühürlendi ve satın alındı.`);
      } else {
        setToast(res.message || 'Satın alma başarısız oldu.');
      }
    } else {
      const ok = purchase(pendingItem.id, pendingItem.price);
      if (ok && pendingItem.outfitId) setRevealOutfitId(pendingItem.outfitId);
      else if (ok) setToast(`${pendingItem.title} artık senin.`);
      else setToast('Yetersiz bakiye.');
    }
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
            onClick={() => equipOutfit(outfitId)}
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
      const isEquipped = equipped.includes(item.id);
      return (
        <button
          type="button"
          className={isEquipped ? styles.equippedBtn : styles.ghostBtn}
          onClick={() => toggleEquip(item.id)}
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
        onClick={() => setPendingItem(item)}
      >
        Satın Al
      </button>
    );
  };

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
          <button
            type="button"
            className={styles.purse}
            onClick={goToTokens}
            title="Token bakiyen · Token al"
          >
            <span className={styles.purseIcon}>
              <Coins size={20} />
            </span>
            <span className={styles.purseAmount}>
              {hasHydrated ? tokenBalance.toLocaleString('tr-TR') : '—'}
            </span>
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
          <FeaturedStorySection
            featured={featured}
            isOwned={isOwned(featured)}
            priceElement={renderPrice(featured)}
            actionElement={renderAction(featured)}
          />
        )}

        <nav ref={tabsRef} className={styles.tabs} aria-label="Market kategorileri">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${tab.id === 'tokens' ? styles.tabTokens : ''} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {visibleCategories.map((cat) => (
          <MarketCategorySection
            key={cat}
            category={cat}
            items={MARKET_ITEMS.filter((item) => item.category === cat)}
            isOwned={isOwned}
            wornOutfitId={wornOutfitId}
            equippedCosmetics={equipped}
            tokenBalance={tokenBalance}
            hasHydrated={hasHydrated}
            onSetPendingItem={setPendingItem}
            onSetPreviewItem={setPreviewItem}
            onEquipOutfit={equipOutfit}
            onToggleEquip={toggleEquip}
          />
        ))}

        {(activeTab === 'all' || activeTab === 'tokens') && (
          <TokenPacksSection
            isProcessing={isProcessing}
            onTokenPackClick={onTokenPackClick}
          />
        )}

        <div className={styles.bottomRule}>
          <span />
          <span className={styles.bottomRuleText}>
            <span lang="en">Inquisitor AI</span> · Hazine Defteri
          </span>
          <span />
        </div>
      </div>

      <PurchaseModal
        pendingItem={pendingItem}
        tokenBalance={tokenBalance}
        onClose={() => setPendingItem(null)}
        onConfirm={confirmPurchase}
        onGoToTokens={goToTokens}
      />

      {previewItem?.outfitId && findOutfit(previewItem.outfitId) && (
        <CharacterShowcase
          outfit={findOutfit(previewItem.outfitId)!}
          mode="preview"
          onClose={() => setPreviewItem(null)}
          actions={
            isOwned(previewItem) ? (
              renderAction(previewItem)
            ) : (
              <>
                {renderPrice(previewItem)}
                <button
                  type="button"
                  className={styles.buyBtn}
                  onClick={() => {
                    setPendingItem(previewItem);
                    setPreviewItem(null);
                  }}
                >
                  Satın Al
                </button>
              </>
            )
          }
        />
      )}

      {revealOutfitId && findOutfit(revealOutfitId) && (
        <CharacterShowcase
          outfit={findOutfit(revealOutfitId)!}
          mode="reveal"
          onClose={() => setRevealOutfitId(null)}
          actions={
            <>
              <button
                type="button"
                className={styles.buyBtn}
                onClick={() => {
                  equipOutfit(revealOutfitId);
                  setRevealOutfitId(null);
                  setToast(`${findOutfit(revealOutfitId)!.name} giyildi.`);
                }}
              >
                Hemen Giy
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setRevealOutfitId(null)}
              >
                Sonra
              </button>
            </>
          }
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
