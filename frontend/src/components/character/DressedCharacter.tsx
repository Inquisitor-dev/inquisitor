'use client';

/* eslint-disable @next/next/no-img-element -- karakter katmanları düz <img> ile üst üste bindiriliyor */
import { useState } from 'react';
import { SLOT_Z_ORDER, getItemById } from '@/app/market/marketItems';
import type { EquippedOutfit } from '@/store/useMarketStore';
import styles from './DressedCharacter.module.scss';

// Çıplak gövde üç parçadan çizilir; kıyafetin altından taşmaması için saç ve ayaklar ayrıdır.
// Tüm parçalar ve kıyafet katmanları aynı tuvale (560x760) hizalıdır.
const BASE_BODY = '/characters/outfits/base_body.png';
const BASE_HAIR = '/characters/outfits/base_hair.png';
const BASE_FEET = '/characters/outfits/base_feet.png';

export interface DressedCharacterProps {
  outfit: EquippedOutfit;
  previewItemId?: string;
  className?: string;
}

// Tek bir kıyafet katmanı. Görsel yüklenemezse (henüz çizilmemiş olabilir) kırık ikon göstermek yerine gizlenir.
function OutfitLayer({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={styles.layer}
      onError={() => setFailed(true)}
    />
  );
}

// Çıplak engizitör gövdesi ve üzerine giyilen kıyafet katmanları.
// previewItemId verilirse o parçanın slotu geçici olarak onunla değiştirilir (deneme önizlemesi).
export default function DressedCharacter({ outfit, previewItemId, className }: DressedCharacterProps) {
  const effective: EquippedOutfit = { ...outfit };
  if (previewItemId) {
    const preview = getItemById(previewItemId);
    if (preview?.slot) effective[preview.slot] = preview.id;
  }

  const items = SLOT_Z_ORDER.flatMap((slot) => {
    const item = effective[slot] ? getItemById(effective[slot]!) : undefined;
    return item ? [{ slot, item }] : [];
  });
  const layers = items.flatMap(({ slot, item }) => (item.layer ? [{ slot, layer: item.layer }] : []));
  const hair = items.find(({ item }) => item.hairLayer)?.item.hairLayer ?? BASE_HAIR;
  const showFeet = !items.some(({ item }) => item.hidesFeet);

  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <img src={BASE_BODY} alt="Engizitör karakteri" draggable={false} className={styles.base} />
      <img key={hair} src={hair} alt="" aria-hidden draggable={false} className={styles.layer} />
      {showFeet && <img src={BASE_FEET} alt="" aria-hidden draggable={false} className={styles.layer} />}
      {layers.map(({ slot, layer }) => (
        // src değişince hata durumu sıfırlansın diye key'e katman yolu da giriyor
        <OutfitLayer key={`${slot}:${layer}`} src={layer} />
      ))}
    </span>
  );
}
