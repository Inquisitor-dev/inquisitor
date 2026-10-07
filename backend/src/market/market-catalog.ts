export interface MarketItemDef {
  id: string;
  category: 'universe' | 'difficulty' | 'story' | 'cosmetic' | 'outfit';
  title: string;
  price: number;
  ownedByDefault?: boolean;
}

export interface TokenPackDef {
  id: string;
  name: string;
  tokens: number;
  bonus: number;
  priceEur: number;
}

export const MARKET_ITEMS_CATALOG: MarketItemDef[] = [
  // Evrenler
  { id: 'universe_medieval', category: 'universe', title: 'Ashenmoor', price: 0, ownedByDefault: true },
  { id: 'universe_modern', category: 'universe', title: 'Oakhaven', price: 500 },
  { id: 'universe_cyberpunk', category: 'universe', title: 'Neon Prime', price: 800 },
  { id: 'universe_china', category: 'universe', title: 'Jinling', price: 650 },
  { id: 'universe_winter', category: 'universe', title: 'Frosthold', price: 650 },

  // Zorluklar
  { id: 'difficulty_easy', category: 'difficulty', title: 'Acemi Engizitör', price: 0, ownedByDefault: true },
  { id: 'difficulty_medium', category: 'difficulty', title: 'Kıdemli Engizitör', price: 300 },
  { id: 'difficulty_hard', category: 'difficulty', title: 'Baş Engizitör', price: 600 },

  // Hazır Hikâyeler
  { id: 'story_serpents_coil', category: 'story', title: 'Yılanın Sarmalı', price: 400 },
  { id: 'story_last_confession', category: 'story', title: 'Son İtiraf', price: 450 },
  { id: 'story_black_mill', category: 'story', title: 'Kara Değirmen', price: 500 },

  // Kozmetikler
  { id: 'cosmetic_wax_seal', category: 'cosmetic', title: 'Kızıl Balmumu Mührü', price: 200 },
  { id: 'cosmetic_raven_quill', category: 'cosmetic', title: 'Kuzgun Tüyü Kalem', price: 500 },
  { id: 'cosmetic_pyre', category: 'cosmetic', title: 'Odun Yığını', price: 1200 },

  // Karakterler (gardırop). Her biri baştan sona tam bir görünüm; id'ler frontend config/outfits.ts ile aynı.
  { id: 'outfit_engizitor', category: 'outfit', title: 'Engizitör', price: 0, ownedByDefault: true },
  { id: 'outfit_sis_dedektifi', category: 'outfit', title: 'Sis Dedektifi', price: 700 },
  { id: 'outfit_jinling_golgesi', category: 'outfit', title: 'Jinling Gölgesi', price: 900 },
  { id: 'outfit_kizil_yemin', category: 'outfit', title: 'Kızıl Yemin', price: 900 },
  { id: 'outfit_neon_kuzgun', category: 'outfit', title: 'Neon Kuzgun', price: 1200 },
  { id: 'outfit_krom_serif', category: 'outfit', title: 'Krom Şerif', price: 1200 },
  // Yeni karakterler (frontend'de görselleri hazır olana kadar "Yakında")
  { id: 'outfit_engizitor_hanim', category: 'outfit', title: 'Engizitör Hanım', price: 0, ownedByDefault: true },
  { id: 'outfit_sehir_dedektifi', category: 'outfit', title: 'Şehir Dedektifi', price: 700 },
  { id: 'outfit_sokak_kurdu', category: 'outfit', title: 'Sokak Kurdu', price: 500 },
  { id: 'outfit_golge_ajan', category: 'outfit', title: 'Gölge Ajan', price: 700 },
  { id: 'outfit_kara_yargic', category: 'outfit', title: 'Kara Yargıç', price: 900 },
  { id: 'outfit_kul_avcisi', category: 'outfit', title: 'Kül Avcısı', price: 900 },
  { id: 'outfit_kizil_lotus', category: 'outfit', title: 'Kızıl Lotus', price: 1200 },
  { id: 'outfit_kizil_devre', category: 'outfit', title: 'Kızıl Devre', price: 1200 },
  { id: 'outfit_mavi_rozet', category: 'outfit', title: 'Mavi Rozet', price: 1200 },
];

// Karakter id'leri gardıroptaki adlarla değiştirildi. Eski id'yle yapılmış satın almalar yeni id'ye sayılır.
export const LEGACY_ITEM_IDS: Record<string, string> = {
  outfit_default: 'outfit_engizitor',
  outfit_dedektif: 'outfit_sis_dedektifi',
  outfit_china_girl: 'outfit_jinling_golgesi',
  outfit_fantastic_girl: 'outfit_kizil_yemin',
  outfit_cyber_girl: 'outfit_neon_kuzgun',
  outfit_cyber_man: 'outfit_krom_serif',
};

export const canonicalItemId = (itemId: string) => LEGACY_ITEM_IDS[itemId] ?? itemId;

// Bir eşyanın veritabanında kayıtlı olabileceği bütün id'ler (güncel + eski)
export const itemIdAliases = (itemId: string) => [
  itemId,
  ...Object.keys(LEGACY_ITEM_IDS).filter((legacy) => LEGACY_ITEM_IDS[legacy] === itemId),
];

export const TOKEN_PACKS_CATALOG: TokenPackDef[] = [
  { id: 'pack_handful', name: 'Bir Avuç Akçe', tokens: 300, bonus: 0, priceEur: 1.99 },
  { id: 'pack_pouch', name: 'Deri Kese', tokens: 800, bonus: 100, priceEur: 4.99 },
  { id: 'pack_chest', name: 'Engizitör Sandığı', tokens: 1800, bonus: 300, priceEur: 9.99 },
  { id: 'pack_treasury', name: 'Kilise Hazinesi', tokens: 4000, bonus: 1000, priceEur: 19.99 },
];

export function findMarketItem(itemId: string): MarketItemDef | undefined {
  return MARKET_ITEMS_CATALOG.find((item) => item.id === itemId);
}

export function findTokenPack(packId: string): TokenPackDef | undefined {
  return TOKEN_PACKS_CATALOG.find((pack) => pack.id === packId);
}
