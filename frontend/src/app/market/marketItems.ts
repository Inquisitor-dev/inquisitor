// Market kataloğu. Fiyatlar oyun içi token cinsindendir.
// Satın alma backend'de doğrulanır; id'ler backend/src/market/market-catalog.ts ile aynı olmalı.

import { OUTFITS, outfitMarketId, outfitThumb } from '@/config/outfits';

export type MarketCategory = 'universe' | 'difficulty' | 'story' | 'outfit' | 'cosmetic';
export type Rarity = 'common' | 'rare' | 'legendary';

export interface MarketItem {
  id: string;
  category: MarketCategory;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  image?: string;
  // Varsayılan olarak herkeste olan içerik (ör. Ortaçağ evreni, Kolay zorluk)
  ownedByDefault?: boolean;
  tags?: string[];
  // Zorluk paketleri için
  suspects?: number;
  dangerLevel?: 1 | 2 | 3;
  // Kozmetikler için
  rarity?: Rarity;
  icon?: 'stamp' | 'mask' | 'feather' | 'flame' | 'crown' | 'eye';
  // Hazır hikayeler için
  universe?: string;
  length?: string;
  // Karakterler için: gardıroptaki kıyafet id'si, görselleri hazır değilse satın alınamaz
  outfitId?: string;
  comingSoon?: boolean;
}

export const CATEGORY_LABELS: Record<MarketCategory, { title: string; eyebrow: string; blurb: string }> = {
  universe: {
    title: 'Evrenler',
    eyebrow: 'Yeni Diyarlar',
    blurb: 'Sorgunu başka çağlara ve şehirlere taşı. Her evren kendi şüphelileri, mekânları ve yalanlarıyla gelir.',
  },
  difficulty: {
    title: 'Zorluklar',
    eyebrow: 'Rütbe Mühürleri',
    blurb: 'Daha fazla şüpheli, daha sıkı alibiler, daha derin yalanlar. Rütbeni kanıtla.',
  },
  story: {
    title: 'Hazır Hikâyeler',
    eyebrow: 'Mühürlü Dosyalar',
    blurb: 'Elle yazılmış, sabit kurgulu vakalar. Her dosyanın kendine ait bir sırrı ve unutulmaz bir sonu var.',
  },
  outfit: {
    title: 'Karakterler',
    eyebrow: 'Engizitörün Gardırobu',
    blurb: 'Lobide ve haritada seni temsil eden karakteri değiştir. Satın aldıkların gardırobuna düşer.',
  },
  cosmetic: {
    title: 'Kozmetikler',
    eyebrow: 'Engizitörün Sandığı',
    blurb: 'Mühürünü, cübbeni ve kalemini değiştir. Köylüler seni uzaktan tanısın.',
  },
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Sıradan',
  rare: 'Nadir',
  legendary: 'Efsanevi',
};

export const MARKET_ITEMS: MarketItem[] = [
  // ─── EVRENLER ────────────────────────────────────────────────
  {
    id: 'universe_medieval',
    category: 'universe',
    title: 'Ashenmoor',
    subtitle: 'Karanlık Ortaçağ',
    description: 'Engizisyon, batıl inanç ve sisli mezarlıklar. Her köylünün dualarının altında bir sır yatar.',
    price: 0,
    image: '/map/village_map.webp',
    ownedByDefault: true,
    tags: ['6 mekân', 'Başlangıç evreni'],
  },
  {
    id: 'universe_modern',
    category: 'universe',
    title: 'Oakhaven',
    subtitle: "90'lar Amerikan Kasabası",
    description: 'Karakol, video kiralama dükkanı ve açık hava sineması. Ormanın kenarındaki bu kasabada herkes birini koruyor.',
    price: 500,
    image: '/map/town_map_night.webp',
    tags: ['6 mekân', 'Polisiye'],
  },
  {
    id: 'universe_cyberpunk',
    category: 'universe',
    title: 'Neon Prime',
    subtitle: 'Distopik Cyberpunk',
    description: 'Bölge 13, hurdalıklar ve robot pazarları. Yozlaşmış şirketlerin gölgesinde hafızalar bile satılık.',
    price: 800,
    image: '/map/cyberpunk_map_night.webp',
    tags: ['6 mekân', 'Tech-noir'],
  },
  {
    id: 'universe_china',
    category: 'universe',
    title: 'Jinling',
    subtitle: 'Antik Doğu / Feodal Çin',
    description: 'Bambu korulukları, tapınaklar ve çay evleri. Hanedan entrikaları ve kadim sırlar.',
    price: 650,
    image: '/map/china_night.webp',
    tags: ['6 mekân', 'Uzak Doğu'],
  },
  {
    id: 'universe_winter',
    category: 'universe',
    title: 'Frosthold',
    subtitle: 'Kutup / Kar Fırtınası',
    description: 'Buz tutmuş göller, gözetleme kuleleri ve sığınaklar. Dondurucu soğukta saklanan sırlar.',
    price: 650,
    image: '/map/winter_night.webp',
    tags: ['6 mekân', 'Buzul Diyarı'],
  },

  // ─── ZORLUKLAR ───────────────────────────────────────────────
  {
    id: 'difficulty_easy',
    category: 'difficulty',
    title: 'Acemi Engizitör',
    subtitle: 'Kolay',
    description: 'Suçluyu bulmak için yeterli ipucu var. Şüpheliler korkak ama yalanları kolay çözülür.',
    price: 0,
    ownedByDefault: true,
    suspects: 4,
    dangerLevel: 1,
  },
  {
    id: 'difficulty_medium',
    category: 'difficulty',
    title: 'Kıdemli Engizitör',
    subtitle: 'Orta',
    description: 'Yeni bir şüpheli olaya dahil olur. İlişkiler karmaşıklaşır, yalanlar birbirini örter.',
    price: 300,
    suspects: 5,
    dangerLevel: 2,
  },
  {
    id: 'difficulty_hard',
    category: 'difficulty',
    title: 'Baş Engizitör',
    subtitle: 'Zor',
    description: 'Alibiler çakışır ve herkesin saklayacak bir şeyi vardır. Sadece en keskin sorgucular gerçeğe ulaşır.',
    price: 600,
    suspects: 6,
    dangerLevel: 3,
  },

  // ─── HAZIR HİKAYELER ─────────────────────────────────────────
  {
    id: 'story_serpents_coil',
    category: 'story',
    title: 'Yılanın Halkası',
    subtitle: 'Bir tarikat, bir zehir şişesi',
    description: 'Köyün ileri gelenleri gizli bir tarikata bağlı. Panodaki kırmızı ipler hep aynı yüze çıkıyor... ya da sana öyle gösteriliyor.',
    price: 450,
    image: '/stories/story5.webp',
    universe: 'Ashenmoor',
    length: '4 gün',
    tags: ['Öne çıkan'],
  },
  {
    id: 'story_candle_night',
    category: 'story',
    title: 'Mumun Söndüğü Gece',
    subtitle: 'Tek tanık, tek mum',
    description: 'Cinayet gecesi tavernada yanan tek mum söndüğünde bir çığlık duyuldu. Tanık konuşmaktan korkuyor.',
    price: 300,
    image: '/stories/story2.webp',
    universe: 'Ashenmoor',
    length: '3 gün',
  },
  {
    id: 'story_dungeon_confession',
    category: 'story',
    title: 'Zindandaki İtiraf',
    subtitle: 'Fazla kolay bir itiraf',
    description: 'Bir köylü suçu üstlendi ve zindanda seni bekliyor. Peki neden itiraf ettiği cinayetin ayrıntılarını bilmiyor?',
    price: 350,
    image: '/stories/story3.webp',
    universe: 'Ashenmoor',
    length: '4 gün',
  },
  {
    id: 'story_bloodied_map',
    category: 'story',
    title: 'Kanlı Harita',
    subtitle: 'Vicus Vetustus',
    description: 'Bir yolcunun cesedinin yanında bulunan haritada handa bir kan lekesi var. Harita bir sonraki kurbanı mı işaret ediyor?',
    price: 400,
    image: '/stories/story7.webp',
    universe: 'Ashenmoor',
    length: '4 gün',
  },
  {
    id: 'story_last_testament',
    category: 'story',
    title: 'Kayıp Vasiyet',
    subtitle: 'Mirası kim istedi?',
    description: 'Yaşlı tüccarın vasiyeti ölümünden bir gece önce değiştirildi. Kalemi tutan eldivenli el kime aitti?',
    price: 250,
    image: '/stories/story8.webp',
    universe: 'Ashenmoor',
    length: '3 gün',
  },

  // ─── KOZMETİKLER ─────────────────────────────────────────────
  {
    id: 'cosmetic_silver_seal',
    category: 'cosmetic',
    title: 'Gümüş Mühür Yüzük',
    subtitle: 'Mühür',
    description: 'Sorgu kayıtlarına ve hükümlerine gümüş bir mühür bas.',
    price: 200,
    rarity: 'common',
    icon: 'stamp',
  },
  {
    id: 'cosmetic_blood_quill',
    category: 'cosmetic',
    title: 'Kızıl Tüy Kalem',
    subtitle: 'Not Defteri',
    description: 'Notların koyu kırmızı mürekkeple, eski bir el yazısıyla görünür.',
    price: 350,
    rarity: 'common',
    icon: 'feather',
  },
  {
    id: 'cosmetic_all_seeing',
    category: 'cosmetic',
    title: 'Her Şeyi Gören Göz',
    subtitle: 'Sorgu Ekranı',
    description: 'Sorgu ekranına NPC korkusu arttıkça titreşen bir göz motifi ekler.',
    price: 900,
    rarity: 'rare',
    icon: 'eye',
  },
  {
    id: 'cosmetic_pyre',
    category: 'cosmetic',
    title: 'Odun Yığını',
    subtitle: 'Hüküm Efekti',
    description: 'Mahkûmu seçtiğinde hüküm ekranı alevler içinde açılır.',
    price: 1200,
    rarity: 'legendary',
    icon: 'flame',
  },

  // ─── KARAKTERLER ─────────────────────────────────────────────
  ...OUTFITS.map(
    (outfit): MarketItem => ({
      id: outfitMarketId(outfit.id),
      category: 'outfit',
      title: outfit.name,
      subtitle: outfit.title,
      description: outfit.description,
      price: outfit.price,
      image: outfitThumb(outfit.id),
      ownedByDefault: outfit.price === 0,
      rarity: outfit.rarity,
      outfitId: outfit.id,
      comingSoon: !outfit.ready,
    })
  ),
];

// ─── TOKEN PAKETLERİ (gerçek para) ────────────────────────────
// Şimdilik sadece görsel; ödeme altyapısı bağlanınca bu id'ler ürün kodu olarak kullanılabilir.

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  bonus: number;
  priceEur: number;
  highlight?: 'popular' | 'best';
  tier: 1 | 2 | 3 | 4;
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: 'pack_handful', name: 'Bir Avuç Akçe', tokens: 300, bonus: 0, priceEur: 1.99, tier: 1 },
  { id: 'pack_pouch', name: 'Deri Kese', tokens: 800, bonus: 100, priceEur: 4.99, tier: 2 },
  { id: 'pack_chest', name: 'Engizitör Sandığı', tokens: 1800, bonus: 300, priceEur: 9.99, highlight: 'popular', tier: 3 },
  { id: 'pack_treasury', name: 'Kilise Hazinesi', tokens: 4000, bonus: 1000, priceEur: 19.99, highlight: 'best', tier: 4 },
];

// Oynayarak token kazanma yolları (taslak değerler; backend'de ödül sistemi kurulunca buradan beslenebilir)
export const EARN_WAYS: { id: string; title: string; reward: string; description: string }[] = [
  { id: 'solve', title: 'Vakayı Çöz', reward: '+100', description: 'Doğru kişiyi mahkûm ettiğinde.' },
  { id: 'fast', title: 'Erken Hüküm', reward: '+50', description: 'Suçluyu ilk iki günde bulursan ek ödül.' },
  { id: 'daily', title: 'Günlük Sorgu', reward: '+20', description: 'Her gün ilk soruşturmanı tamamladığında.' },
  { id: 'community', title: 'Topluluk', reward: '+30', description: 'Yazdığın hikâye başkaları tarafından oynandıkça.' },
];

export const formatEur = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(value);
