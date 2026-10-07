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
  // Gardıropta ve tanıtım sahnesinde gösterilen kısa geçmiş ve karakterin ağzından bir söz
  lore: string;
  quote: string;
};

export const DEFAULT_OUTFIT_ID = 'engizitor';

// Karakter id'leri gardıroptaki adlarla değiştirildi; tarayıcıda kayıtlı eski id'ler yenilerine çevrilir
// (backend'deki LEGACY_ITEM_IDS ile aynı eşleme).
export const LEGACY_OUTFIT_IDS: Record<string, string> = {
  default: 'engizitor',
  dedektif: 'sis_dedektifi',
  china_girl: 'jinling_golgesi',
  fantastic_girl: 'kizil_yemin',
  cyber_girl: 'neon_kuzgun',
  cyber_man: 'krom_serif',
};

// Yeni karakterler listenin başında.
export const OUTFITS: Outfit[] = [
  {
    id: 'engizitor_hanim',
    name: 'Engizitör Hanım',
    title: 'Varsayılan',
    description: 'Dişli tokalı korse, kızıl işlemeli kısa palto ve bağcıklı çizmeler. Soruşturmaya o da hazır.',
    price: 0,
    rarity: 'common',
    ready: true,
    lore: 'Manastırda yetişti, yeminini kilisenin bodrumundaki arşivde verdi. Mühürlü mektupları kimseden hızlı okur; bir yalanın mürekkebini bile tanır.',
    quote: 'Gerçek tozlu raflarda bekler. Ben sadece üflerim.',
  },
  {
    id: 'sehir_dedektifi',
    name: 'Şehir Dedektifi',
    title: 'Kırklı Yıllar',
    description: 'Kahverengi deri ceket, gevşek kravat ve belinde rozet. Yağmurlu sokaklarda ifade toplar.',
    price: 700,
    rarity: 'rare',
    ready: true,
    lore: 'Yirmi yıl boyunca şehrin en kirli dosyalarına baktı, rozetini bir kez bile çekmeceye koymadı. Emekliliği reddetti; sokaklar onu bırakmadı.',
    quote: 'Herkes bir şey saklar. Ben sadece kimin daha çok terlediğine bakarım.',
  },
  {
    id: 'sokak_kurdu',
    name: 'Sokak Kurdu',
    title: 'Günümüz Dedektifi',
    description: 'Fötr şapka, eskimiş ceket ve kot. Kimseye güvenmez, her ipucunu kendisi doğrular.',
    price: 500,
    rarity: 'common',
    ready: true,
    lore: 'Kimse ona dedektif demedi; diploması yok, rozeti yok. Ama mahalleli kayıp bir şey ararsa önce onun kapısını çalar.',
    quote: 'Kâğıtta yazmayanı ben sokakta okurum.',
  },
  {
    id: 'golge_ajan',
    name: 'Gölge Ajan',
    title: 'Taktik Birim',
    description: 'Siyah techwear, kargo pantolon ve parmaksız eldivenler. Sessiz girer, cevapla çıkar.',
    price: 700,
    rarity: 'rare',
    ready: true,
    lore: 'Hangi birime bağlı olduğunu kimse bilmiyor, dosyasında yalnızca bir kod numarası var. Sorguya girdiğinde odadaki kameralar nedense hep arızalanır.',
    quote: 'Ben burada değilim. Sen de beni görmedin.',
  },
  {
    id: 'kara_yargic',
    name: 'Kara Yargıç',
    title: 'Gece Avcısı',
    description: 'Diz boyu siyah deri palto ve sıkı düğmeli yaka. Hükmünü karanlık çökmeden verir.',
    price: 900,
    rarity: 'rare',
    ready: true,
    lore: 'Bir zamanlar kendisi de idama mahkûm edildi; ilmik boynuna geçmeden asıl katili buldu. O günden beri yalnızca karanlıkta yargılar.',
    quote: 'Hüküm gün ağarmadan verilir; güneş masumları kayırır.',
  },
  {
    id: 'kul_avcisi',
    name: 'Kül Avcısı',
    title: 'Gotik Avcı',
    description: 'Kızıl astarlı deri korse, kemerler ve tokalı çizmeler. İzini sürdüğü kaçamaz.',
    price: 900,
    rarity: 'rare',
    ready: true,
    lore: 'Köyü yakıldığında küllerin arasından tek başına çıktı. O geceden beri ateşi kimin yaktığını arıyor; peşine düştüğü hiçbir iz soğumadı.',
    quote: 'Kül her şeyi örter. Ama ben eşelemeyi severim.',
  },
  {
    id: 'kizil_lotus',
    name: 'Kızıl Lotus',
    title: 'Jinling Suikastçısı',
    description: 'Siyah ipek qipao üzerinde kızıl çiçekler, saçında altın tarak. Zarafeti en keskin silahıdır.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
    lore: 'Jinling sarayında çay döken bir hizmetkâr sanılırdı. Saray muhafızlarından üçü düştüğünde herkes onun kim olduğunu öğrendi.',
    quote: 'Lotus çamurda açar; ben de en temiz yalanın içinde.',
  },
  {
    id: 'kizil_devre',
    name: 'Kızıl Devre',
    title: 'Neon Prime Paralı Askeri',
    description: 'Kızıl devre desenli uzun ceket ve zırhlı çizmeler. Ağın en karanlık köşesinde iz sürer.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
    lore: "Neon Prime'ın alt katlarında doğdu, devre kartlarıyla büyüdü. Bir şirketin bütün kayıtlarını tek gecede silip geriye yalnızca suçluların adını bıraktı.",
    quote: 'Sistem unutmaz. Ben ona neyi hatırlayacağını söylerim.',
  },
  {
    id: 'mavi_rozet',
    name: 'Mavi Rozet',
    title: 'Neon Prime Polisi',
    description: 'Mavi ışıklı taktik yelek, vizör ve kemerde tabanca. Şehrin kayıtları onun elinde.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
    lore: 'Neon Prime polisinde dürüst kalan son memur olduğu söyleniyor. Vizörü yalan söyleyenin nabzını ölçer; o da buna inanmayı seçmiş.',
    quote: 'Rozetim mavi ışık saçıyor. Sen de bana karşı dürüst ol.',
  },
  {
    id: DEFAULT_OUTFIT_ID,
    name: 'Engizitör',
    title: 'Varsayılan',
    description: 'Geniş kenarlı şapka, kızıl atkı ve göğsünde haç. Her soruşturma onunla başlar.',
    price: 0,
    rarity: 'common',
    ready: true,
    lore: "Engizisyonun en genç sorgucusu olarak Ashenmoor'a gönderildi. Haçı göğsünde, şüphesi kalbinde taşır; hiçbir itirafı ilk duyduğunda kabul etmez.",
    quote: 'Tanrı affeder. Ben önce sorarım.',
  },
  {
    id: 'sis_dedektifi',
    name: 'Sis Dedektifi',
    title: 'Viktorya Dönemi',
    description: 'Uzun palto, fötr şapka ve cebinde saat. Sisli sokaklarda hiçbir ayrıntı gözünden kaçmaz.',
    price: 700,
    rarity: 'rare',
    ready: true,
    lore: 'Londra sisinde on yedi davayı çözdü, birini hiç kapatmadı. Cebindeki saat o gece durdu ve o günden beri hiç kurmadı.',
    quote: 'Sis her şeyi saklar; ama ayak izlerini asla.',
  },
  {
    id: 'jinling_golgesi',
    name: 'Jinling Gölgesi',
    title: 'Doğu Saray Muhafızı',
    description: 'Erik çiçeği desenli ipek, altın püsküller. Tapınak avlusunda adımları duyulmaz.',
    price: 900,
    rarity: 'rare',
    ready: true,
    lore: 'İmparatorluk ailesinin gölge muhafızıydı. Saray yandığında hanedanın son sırrıyla birlikte ortadan kayboldu.',
    quote: 'Rüzgâr nereden eserse essin, erik çiçeği yerini bilir.',
  },
  {
    id: 'kizil_yemin',
    name: 'Kızıl Yemin',
    title: 'Diyar Avcısı',
    description: 'Deri korse, işlemeli kolluklar ve dize kadar çizmeler. Verdiği sözü kılıcıyla tutar.',
    price: 900,
    rarity: 'rare',
    ready: true,
    lore: 'Diyarların sınırında bir yemin etti: kardeşinin katilini bulmadan kılıcını kınına sokmayacak. Kılıç hâlâ kınının dışında.',
    quote: 'Yeminim kızıl; ya kanla ya gerçekle silinir.',
  },
  {
    id: 'neon_kuzgun',
    name: 'Neon Kuzgun',
    title: 'Bölge 13 Ajanı',
    description: 'Kızıl ışıklı zırhlı deri, kemer ve kayışlar. Neon sokaklarda iz bırakmadan dolaşır.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
    lore: "Bölge 13'ün çatılarında yaşar, şehre yukarıdan bakar. Kuzgunlar gibi parlayan her şeyi toplar; özellikle de sırları.",
    quote: 'Bu şehirde ışık yalan söyler. Gölge söylemez.',
  },
  {
    id: 'krom_serif',
    name: 'Krom Şerif',
    title: 'Neon Prime Kanun Adamı',
    description: 'Işıklı trençkot, krom eldivenler ve kovboy şapkası. Şehrin kanunu ondan sorulur.',
    price: 1200,
    rarity: 'legendary',
    ready: true,
    lore: "Neon Prime'a çölden geldi, eski usul adaleti yanında getirdi. Krom eldivenleriyle sıktığı el bir daha yalan yazamaz.",
    quote: 'Kasabada tek bir kanun var. O da benim.',
  },
];

export const outfitBasePath = (id: string) => `/characters/${id}`;

export const outfitThumb = (id: string) => `${outfitBasePath(id)}/thumb.webp`;

// Baş-omuz portresi (diyalog ekranı, menü)
export const outfitPortrait = (id: string) => `${outfitBasePath(id)}/portrait.webp`;

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
