// Gardıroptaki karakterler. Her biri baştan sona tek bir görsel setidir (parça parça giydirme yok).
// Görseller art/tools/ ile üretilir ve `public/characters/<id>/` altına manifest.json + sprite sheet olarak konur.
// Satın alma backend'de `outfit_<id>` market eşyasıyla tutulur (backend/src/market/market-catalog.ts).

import type { Rarity } from '@/app/market/marketItems';

export type Outfit = {
  id: string;
  name: string;
  // Kartlarda adın üstündeki kısa tanım
  title: string;
  description: string;
  price: number;
  rarity: Rarity;
  // Görselleri (yürüme, durma, 360°) üretilip pakete konduysa true. Hazır olmayan karakter
  // satın alınamaz ve giyilemez; gardıropta "Yakında" olarak görünür.
  ready: boolean;
};

export const DEFAULT_OUTFIT_ID = 'default';

// Yeni karakterler listenin başında. Görselleri (Mixamo + render) hazırlanana kadar ready: false.
export const OUTFITS: Outfit[] = [
  {
    id: 'default_woman',
    name: 'Engizitör Hanım',
    title: 'Varsayılan',
    description: 'Dişli tokalı korse, kızıl işlemeli kısa palto ve bağcıklı çizmeler. Soruşturmaya o da hazır.',
    price: 0,
    rarity: 'common',
    ready: false,
  },
  {
    id: 'amerikan_dedektif',
    name: 'Şehir Dedektifi',
    title: 'Kırklı Yıllar',
    description: 'Kahverengi deri ceket, gevşek kravat ve belinde rozet. Yağmurlu sokaklarda ifade toplar.',
    price: 700,
    rarity: 'rare',
    ready: false,
  },
  {
    id: 'modern_man',
    name: 'Sokak Kurdu',
    title: 'Günümüz Dedektifi',
    description: 'Fötr şapka, eskimiş ceket ve kot. Kimseye güvenmez, her ipucunu kendisi doğrular.',
    price: 500,
    rarity: 'common',
    ready: false,
  },
  {
    id: 'modern_woman',
    name: 'Gölge Ajan',
    title: 'Taktik Birim',
    description: 'Siyah techwear, kargo pantolon ve parmaksız eldivenler. Sessiz girer, cevapla çıkar.',
    price: 700,
    rarity: 'rare',
    ready: false,
  },
  {
    id: 'got_man',
    name: 'Kara Yargıç',
    title: 'Gece Avcısı',
    description: 'Diz boyu siyah deri palto ve sıkı düğmeli yaka. Hükmünü karanlık çökmeden verir.',
    price: 900,
    rarity: 'rare',
    ready: false,
  },
  {
    id: 'gotik_kadin',
    name: 'Kül Avcısı',
    title: 'Gotik Avcı',
    description: 'Kızıl astarlı deri korse, kemerler ve tokalı çizmeler. İzini sürdüğü kaçamaz.',
    price: 900,
    rarity: 'rare',
    ready: false,
  },
  {
    id: 'yeni_china_girl',
    name: 'Kızıl Lotus',
    title: 'Jinling Suikastçısı',
    description: 'Siyah ipek qipao üzerinde kızıl çiçekler, saçında altın tarak. Zarafeti en keskin silahıdır.',
    price: 1200,
    rarity: 'legendary',
    ready: false,
  },
  {
    id: 'cyber_girl_new',
    name: 'Kızıl Devre',
    title: 'Neon Prime Paralı Askeri',
    description: 'Kızıl devre desenli uzun ceket ve zırhlı çizmeler. Ağın en karanlık köşesinde iz sürer.',
    price: 1200,
    rarity: 'legendary',
    ready: false,
  },
  {
    id: 'cyber_man_new',
    name: 'Mavi Rozet',
    title: 'Neon Prime Polisi',
    description: 'Mavi ışıklı taktik yelek, vizör ve kemerde tabanca. Şehrin kayıtları onun elinde.',
    price: 1200,
    rarity: 'legendary',
    ready: false,
  },
  {
    id: DEFAULT_OUTFIT_ID,
    name: 'Engizitör',
    title: 'Varsayılan',
    description: 'Geniş kenarlı şapka, kızıl atkı ve göğsünde haç. Her soruşturma onunla başlar.',
    price: 0,
    rarity: 'common',
    ready: true,
  },
  {
    id: 'dedektif',
    name: 'Sis Dedektifi',
    title: 'Viktorya Dönemi',
    description: 'Uzun palto, fötr şapka ve cebinde saat. Sisli sokaklarda hiçbir ayrıntı gözünden kaçmaz.',
    price: 700,
    rarity: 'rare',
    ready: true,
  },
  {
    id: 'china_girl',
    name: 'Jinling Gölgesi',
    title: 'Doğu Saray Muhafızı',
    description: 'Erik çiçeği desenli ipek, altın püsküller. Tapınak avlusunda adımları duyulmaz.',
    price: 900,
    rarity: 'rare',
    ready: true,
  },
  {
    id: 'fantastic_girl',
    name: 'Kızıl Yemin',
    title: 'Diyar Avcısı',
    description: 'Deri korse, işlemeli kolluklar ve dize kadar çizmeler. Verdiği sözü kılıcıyla tutar.',
    price: 900,
    rarity: 'rare',
    ready: true,
  },
  {
    id: 'cyber_girl',
    name: 'Neon Kuzgun',
    title: 'Bölge 13 Ajanı',
    description: 'Kızıl ışıklı zırhlı deri, kemer ve kayışlar. Neon sokaklarda iz bırakmadan dolaşır.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
  },
  {
    id: 'cyber_man',
    name: 'Krom Şerif',
    title: 'Neon Prime Kanun Adamı',
    description: 'Işıklı trençkot, krom eldivenler ve kovboy şapkası. Şehrin kanunu ondan sorulur.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
  },
];

export const outfitBasePath = (id: string) => `/characters/${id}`;

export const outfitThumb = (id: string) => `${outfitBasePath(id)}/thumb.webp`;

// Backend market eşyası id'si
export const outfitMarketId = (id: string) => `outfit_${id}`;

export const findOutfit = (id: string) => OUTFITS.find((o) => o.id === id);

export const ownsOutfit = (outfit: Outfit, ownedItemIds: string[]) =>
  outfit.price === 0 || ownedItemIds.includes(outfitMarketId(outfit.id));

// Giyilebilir kıyafet: sahip olunan ve görselleri hazır olan. Değilse varsayılana düşer
// (ör. kayıtlı kıyafet başka cihazda alınmış ya da henüz paketlenmemiş).
export function wearableOutfitId(equippedId: string, ownedItemIds: string[]): string {
  const outfit = findOutfit(equippedId);
  return outfit && outfit.ready && ownsOutfit(outfit, ownedItemIds) ? outfit.id : DEFAULT_OUTFIT_ID;
}
