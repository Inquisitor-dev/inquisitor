'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, Coins, Lock, MoveHorizontal, Shirt, X } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useMarketStore } from '@/store/useMarketStore';
import CharacterTurntable from '@/components/character/CharacterTurntable';
import CharacterShowcase from '@/components/character/CharacterShowcase';
import {
  OUTFITS,
  findOutfit,
  outfitMarketId,
  outfitThumb,
  ownsOutfit,
  wearableOutfitId,
  type Outfit,
} from '@/config/outfits';
import { RARITY_LABELS } from '../market/marketItems';
import styles from './page.module.scss';

export default function WardrobePage() {
  const { authToken } = useGameStore();
  const {
    tokenBalance,
    ownedItemIds,
    equippedOutfitId,
    hasHydrated,
    fetchMarketData,
    purchaseServer,
    purchase,
    equipOutfit,
  } = useMarketStore();

  const owned = hasHydrated ? ownedItemIds : [];
  const wornId = hasHydrated ? wearableOutfitId(equippedOutfitId, ownedItemIds) : null;
  // Önizlenen karakter; seçilmediyse giyili olan
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previewId = selectedId ?? wornId;
  const preview = previewId ? findOutfit(previewId) : undefined;

  const [pending, setPending] = useState<Outfit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Satın alma sonrası tanıtım sahnesi
  const [revealed, setRevealed] = useState<Outfit | null>(null);

  useEffect(() => {
    if (authToken) fetchMarketData(authToken);
  }, [authToken, fetchMarketData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  const isOwned = (outfit: Outfit) => ownsOutfit(outfit, owned);

  const confirmPurchase = async () => {
    if (!pending) return;
    if (authToken) {
      setIsProcessing(true);
      const res = await purchaseServer(outfitMarketId(pending.id), authToken);
      setIsProcessing(false);
      if (res.success) setRevealed(pending);
      else setToast(res.message || 'Satın alma başarısız oldu.');
    } else {
      const ok = purchase(outfitMarketId(pending.id), pending.price);
      if (ok) setRevealed(pending);
      else setToast('Yetersiz bakiye.');
    }
    setPending(null);
  };

  const renderAction = (outfit: Outfit) => {
    if (!outfit.ready) {
      return (
        <span className={styles.soon}>
          <Clock size={15} /> Yakında
        </span>
      );
    }
    if (isOwned(outfit)) {
      const isWorn = wornId === outfit.id;
      return (
        <button
          className={isWorn ? styles.wornBtn : styles.equipBtn}
          onClick={() => {
            equipOutfit(outfit.id);
            setToast(`${outfit.name} giyildi. Lobide ve haritada artık bu karakterle görüneceksin.`);
          }}
          disabled={isWorn}
        >
          {isWorn ? <><Check size={15} /> Giyili</> : <><Shirt size={15} /> Giy</>}
        </button>
      );
    }
    return (
      <button className={styles.buyBtn} onClick={() => setPending(outfit)}>
        <Coins size={15} /> {outfit.price} · Satın Al
      </button>
    );
  };

  const shortfall = pending ? pending.price - tokenBalance : 0;

  return (
    <div className={styles.container}>
      <div className={styles.vignette} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <Link href="/menu" className={styles.backBtn}>
            <ArrowLeft size={16} /> Lobiye Dön
          </Link>
          <Link href="/market" className={styles.purse} title="Token bakiyen · Market">
            <Coins size={18} />
            <span>{hasHydrated ? tokenBalance.toLocaleString('tr-TR') : '—'}</span>
          </Link>
        </div>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Engizitörün Gardırobu</span>
          <h1 className={styles.title}>Gardırop</h1>
          <div className={styles.divider}>
            <span />
            <span className={styles.dividerIcon}>✠</span>
            <span />
          </div>
        </header>

        <div className={styles.layout}>
          {/* Önizleme sahnesi */}
          <section className={`${styles.stagePanel} ${preview ? styles[`rarity_${preview.rarity}`] : ''}`}>
            <div className={styles.stage}>
              <span className={styles.halo} />
              {preview?.ready ? (
                <CharacterTurntable
                  key={preview.id}
                  outfitId={preview.id}
                  alt={preview.name}
                  className={styles.turntable}
                />
              ) : preview ? (
                <img src={outfitThumb(preview.id)} alt={preview.name} className={styles.stillPreview} />
              ) : null}
              <span className={styles.pedestal} />
            </div>

            {preview && (
              <div className={styles.details}>
                <span className={styles.rarity}>{RARITY_LABELS[preview.rarity]}</span>
                <span className={styles.detailsEyebrow}>{preview.title}</span>
                <h2 className={styles.detailsName}>{preview.name}</h2>
                <p className={styles.detailsDesc}>{preview.description}</p>
                <p className={styles.detailsLore}>{preview.lore}</p>
                <blockquote className={styles.detailsQuote}>“{preview.quote}”</blockquote>
                <div className={styles.detailsActions}>
                  {renderAction(preview)}
                  {preview.ready && (
                    <span className={styles.dragHint}>
                      <MoveHorizontal size={14} /> Sürükleyerek çevir
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Karakter listesi */}
          <section className={styles.listPanel} aria-label="Karakterler">
            <div className={styles.listHeader}>
              <h2>Karakterler</h2>
              <span>
                {OUTFITS.filter(isOwned).length}/{OUTFITS.length} edinildi
              </span>
            </div>
            <div className={styles.grid}>
              {OUTFITS.map((outfit) => {
                const own = isOwned(outfit);
                const worn = wornId === outfit.id;
                return (
                  <button
                    key={outfit.id}
                    className={`${styles.tile} ${styles[`rarity_${outfit.rarity}`]} ${previewId === outfit.id ? styles.tileActive : ''} ${!outfit.ready ? styles.tileSoon : ''}`}
                    onClick={() => setSelectedId(outfit.id)}
                    aria-pressed={previewId === outfit.id}
                  >
                    <span className={styles.tileImage}>
                      <img src={outfitThumb(outfit.id)} alt="" loading="lazy" />
                    </span>
                    <span className={styles.tileName}>{outfit.name}</span>
                    <span className={styles.tileState}>
                      {worn ? (
                        <><Check size={12} /> Giyili</>
                      ) : !outfit.ready ? (
                        <><Clock size={12} /> Yakında</>
                      ) : own ? (
                        'Gardırobunda'
                      ) : (
                        <><Lock size={12} /> {outfit.price}</>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {pending && (
        <div className={styles.modalOverlay} onClick={() => setPending(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wardrobe-purchase-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={() => setPending(null)} aria-label="Kapat">
              <X size={18} />
            </button>
            <span className={styles.eyebrow}>Karakter</span>
            <h2 id="wardrobe-purchase-title" className={styles.modalTitle}>{pending.name}</h2>
            <dl className={styles.ledger}>
              <div>
                <dt>Bakiye</dt>
                <dd>{tokenBalance}</dd>
              </div>
              <div>
                <dt>Bedel</dt>
                <dd className={styles.ledgerCost}>−{pending.price}</dd>
              </div>
              <div className={styles.ledgerTotal}>
                <dt>Kalan</dt>
                <dd>{shortfall > 0 ? '—' : tokenBalance - pending.price}</dd>
              </div>
            </dl>
            {shortfall > 0 && (
              <p className={styles.modalWarning}>
                Bu karakter için {shortfall} token eksiğin var.{' '}
                <Link href="/market" className={styles.inlineLink}>Token al →</Link>
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setPending(null)}>
                Vazgeç
              </button>
              <button className={styles.buyBtn} onClick={confirmPurchase} disabled={shortfall > 0 || isProcessing}>
                Mühürle ve Satın Al
              </button>
            </div>
          </div>
        </div>
      )}

      {revealed && (
        <CharacterShowcase
          outfit={revealed}
          mode="reveal"
          onClose={() => setRevealed(null)}
          actions={
            <>
              <button
                className={styles.buyBtn}
                onClick={() => {
                  equipOutfit(revealed.id);
                  setSelectedId(revealed.id);
                  setRevealed(null);
                  setToast(`${revealed.name} giyildi. Lobide ve haritada artık bu karakterle görüneceksin.`);
                }}
              >
                <Shirt size={15} /> Hemen Giy
              </button>
              <button className={styles.ghostBtn} onClick={() => setRevealed(null)}>
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
