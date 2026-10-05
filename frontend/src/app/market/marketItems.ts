// Market kataloğu. Fiyatlar oyun içi token cinsindendir.
// Şimdilik istemcide tutuluyor; satın alma backend'e bağlandığında buradaki id'ler kullanılmalı.

export type MarketCategory = 'universe' | 'difficulty' | 'story' | 'cosmetic' | 'outfit';
export type Rarity = 'common' | 'rare' | 'legendary';

// Kıyafet slotları. Her slotta aynı anda en fazla bir parça giyilebilir.
export type OutfitSlot = 'hat' | 'mask' | 'necklace' | 'body' | 'shoes';

export const SLOT_LABELS: Record<OutfitSlot, string> = {
  hat: 'Şapka',
  mask: 'Maske',
  necklace: 'Kolye',
  body: 'Kıyafet',
  shoes: 'Ayakkabı',
};

// Katmanların çizim sırası (alttan üste). Karakterin üstüne bu sırayla bindirilir.
export const SLOT_Z_ORDER: OutfitSlot[] = ['shoes', 'body', 'necklace', 'mask', 'hat'];

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
  // Kıyafetler için: hangi slota giyildiği, karakterin üstüne bindirilen katman (112x152 şeffaf PNG)
  // ve kart/gardırop küçük görseli (yoksa katman görseli kullanılır)
  slot?: OutfitSlot;
  layer?: string;
  thumb?: string;
  // Katmanlar gövdeden piksel silemediği için, eşyanın altından taşacak gövde parçaları değiştirilir:
  // hairLayer → bu kafa eşyası giyilince çizilecek kırpılmış saç, hidesFeet → çıplak ayaklar çizilmez
  hairLayer?: string;
  hidesFeet?: boolean;
}

export const CATEGORY_LABELS: Record<MarketCategory, { title: string; eyebrow: string; blurb: string }> = {
  universe: {
    title: 'Evrenler',
    eyebrow: 'Yeni Diyarlar',
    blurb: 'Sorgunu başka çağlara ve şehirlere taşı. Her evren kendi şüphelileri, mekanları ve yalanlarıyla gelir.',
  },
  difficulty: {
    title: 'Zorluklar',
    eyebrow: 'Rütbe Mühürleri',
    blurb: 'Daha fazla şüpheli, daha sıkı alibiler, daha derin yalanlar. Rütbeni kanıtla.',
  },
  story: {
    title: 'Hazır Hikayeler',
    eyebrow: 'Mühürlü Dosyalar',
    blurb: 'Elle yazılmış, sabit kurgulu vakalar. Her dosyanın kendine ait bir sırrı ve unutulmaz bir sonu var.',
  },
  outfit: {
    title: 'Kıyafetler',
    eyebrow: 'Engizitörün Dolabı',
    blurb: 'Şapkadan çizmeye, engizitörünü baştan giydir. Satın aldıkların gardırobuna düşer, lobide üstünde görünür.',
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
    image: '/map/village_map.png',
    ownedByDefault: true,
    tags: ['6 mekan', 'Başlangıç evreni'],
  },
  {
    id: 'universe_modern',
    category: 'universe',
    title: 'Oakhaven',
    subtitle: "90'lar Amerikan Kasabası",
    description: 'Karakol, video kiralama dükkanı ve açık hava sineması. Ormanın kenarındaki bu kasabada herkes birini koruyor.',
    price: 500,
    image: '/map/town_map_night.png',
    tags: ['6 mekan', 'Polisiye'],
  },
  {
    id: 'universe_cyberpunk',
    category: 'universe',
    title: 'Neon Prime',
    subtitle: 'Distopik Cyberpunk',
    description: 'Bölge 13, hurdalıklar ve robot pazarları. Yozlaşmış şirketlerin gölgesinde hafızalar bile satılık.',
    price: 800,
    image: '/map/cyberpunk_map_night.png',
    tags: ['6 mekan', 'Tech-noir'],
  },

  // ─── ZORLUKLAR ───────────────────────────────────────────────
  {
    id: 'difficulty_easy',
    category: 'difficulty',
    title: 'Acemi Engizitör',
    subtitle: 'Kolay',
    description: 'Suçluyu bulmak için yeterli ipucu. Köylüler korkak ama yalanları kolay çözülür.',
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
    image: '/stories/story5.jpg',
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
    image: '/stories/story2.jpg',
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
    image: '/stories/story3.jpg',
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
    image: '/stories/story7.jpg',
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
    image: '/stories/story8.jpg',
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
    description: 'Mahkumu seçtiğinde hüküm ekranı alevler içinde açılır.',
    price: 1200,
    rarity: 'legendary',
    icon: 'flame',
  },

  // ─── KIYAFETLER ──────────────────────────────────────────────
  {
    id: 'outfit_wide_brim_hat',
    category: 'outfit',
    title: 'Geniş Kenarlı Şapka',
    subtitle: SLOT_LABELS.hat,
    description: 'Kara keçe şapka; gölgesi yüzünü saklar, bakışın kalır.',
    price: 250,
    rarity: 'common',
    slot: 'hat',
    layer: '/characters/outfits/outfit_wide_brim_hat.png',
    thumb: '/characters/outfits/outfit_wide_brim_hat_thumb.png',
    hairLayer: '/characters/outfits/outfit_wide_brim_hat_hair.png',
  },
  {
    id: 'outfit_inquisitor_hood',
    category: 'outfit',
    title: 'Engizitör Kukuletası',
    subtitle: SLOT_LABELS.hat,
    description: 'Kaba yünden kukuleta. Köylüler arkandan fısıldaşır.',
    price: 400,
    rarity: 'rare',
    slot: 'hat',
    layer: '/characters/outfits/outfit_inquisitor_hood.png',
    thumb: '/characters/outfits/outfit_inquisitor_hood_thumb.png',
    hairLayer: '/characters/outfits/outfit_inquisitor_hood_hair.png',
  },
  {
    id: 'outfit_cardinal_mitre',
    category: 'outfit',
    title: 'Kardinal Taç Şapkası',
    subtitle: SLOT_LABELS.hat,
    description: 'Altın işlemeli yüksek taç. Hükmün tartışılmaz.',
    price: 1100,
    rarity: 'legendary',
    slot: 'hat',
    layer: '/characters/outfits/outfit_cardinal_mitre.png',
    thumb: '/characters/outfits/outfit_cardinal_mitre_thumb.png',
    hairLayer: '/characters/outfits/outfit_cardinal_mitre_hair.png',
  },
  {
    id: 'outfit_plague_mask',
    category: 'outfit',
    title: 'Veba Doktoru Maskesi',
    subtitle: SLOT_LABELS.mask,
    description: 'İkonik gagalı veba doktoru maskesi. Lobide karakterinin yüzünde.',
    price: 1500,
    rarity: 'legendary',
    slot: 'mask',
    layer: '/characters/outfits/outfit_plague_mask.png',
    thumb: '/characters/outfits/outfit_plague_mask_thumb.png',
  },
  {
    id: 'outfit_iron_mask',
    category: 'outfit',
    title: 'Demir Yarım Maske',
    subtitle: SLOT_LABELS.mask,
    description: 'Ağzı ve çeneyi örten paslı demir. Sesin boğuk ve soğuk çıkar.',
    price: 500,
    rarity: 'rare',
    slot: 'mask',
    layer: '/characters/outfits/outfit_iron_mask.png',
    thumb: '/characters/outfits/outfit_iron_mask_thumb.png',
  },
  {
    id: 'outfit_wooden_rosary',
    category: 'outfit',
    title: 'Ahşap Tespih',
    subtitle: SLOT_LABELS.necklace,
    description: 'Sade ahşap boncuklar. Her düğümde bir dua, her duada bir şüphe.',
    price: 150,
    rarity: 'common',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_wooden_rosary.png',
    thumb: '/characters/outfits/outfit_wooden_rosary_thumb.png',
  },
  {
    id: 'outfit_silver_cross',
    category: 'outfit',
    title: 'Gümüş Haç Kolye',
    subtitle: SLOT_LABELS.necklace,
    description: 'Ağır gümüş haç. Günahkârlar ona bakamaz.',
    price: 450,
    rarity: 'rare',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_silver_cross.png',
    thumb: '/characters/outfits/outfit_silver_cross_thumb.png',
  },
  {
    id: 'outfit_relic_pendant',
    category: 'outfit',
    title: 'Kutsal Emanet Madalyonu',
    subtitle: SLOT_LABELS.necklace,
    description: 'İçinde bir azizin kemiği olduğu söylenen madalyon.',
    price: 900,
    rarity: 'legendary',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_relic_pendant.png',
    thumb: '/characters/outfits/outfit_relic_pendant_thumb.png',
  },
  {
    id: 'outfit_scarlet_robe',
    category: 'outfit',
    title: 'Kardinal Cübbesi',
    subtitle: SLOT_LABELS.body,
    description: 'Kızıl işlemeli cübbe. Lobi karakterin artık uzaktan tanınır.',
    price: 600,
    rarity: 'rare',
    slot: 'body',
    layer: '/characters/outfits/outfit_scarlet_robe.png',
    thumb: '/characters/outfits/outfit_scarlet_robe_thumb.png',
  },
  {
    id: 'outfit_leather_coat',
    category: 'outfit',
    title: 'Deri Seyyah Paltosu',
    subtitle: SLOT_LABELS.body,
    description: 'Yağmur ve kan tutmayan uzun deri palto.',
    price: 350,
    rarity: 'common',
    slot: 'body',
    layer: '/characters/outfits/outfit_leather_coat.png',
    thumb: '/characters/outfits/outfit_leather_coat_thumb.png',
  },
  {
    id: 'outfit_riding_boots',
    category: 'outfit',
    title: 'Binici Çizmeleri',
    subtitle: SLOT_LABELS.shoes,
    description: 'Diz boyu deri çizmeler. Çamurlu köy yollarına hazır.',
    price: 200,
    rarity: 'common',
    slot: 'shoes',
    layer: '/characters/outfits/outfit_riding_boots.png',
    thumb: '/characters/outfits/outfit_riding_boots_thumb.png',
    hidesFeet: true,
  },
  {
    id: 'outfit_iron_greaves',
    category: 'outfit',
    title: 'Demir Tozluklu Çizme',
    subtitle: SLOT_LABELS.shoes,
    description: 'Adımların taş zeminde yankılanır; herkes geldiğini duyar.',
    price: 700,
    rarity: 'rare',
    slot: 'shoes',
    layer: '/characters/outfits/outfit_iron_greaves.png',
    thumb: '/characters/outfits/outfit_iron_greaves_thumb.png',
    hidesFeet: true,
  },
  {
    id: 'outfit_nasal_helm',
    category: 'outfit',
    title: 'Burunluklu Demir Miğfer',
    subtitle: SLOT_LABELS.hat,
    description: 'Haçlı seferlerinden kalma, burun siperli dövme demir miğfer.',
    price: 550,
    rarity: 'rare',
    slot: 'hat',
    layer: '/characters/outfits/outfit_nasal_helm.png',
    thumb: '/characters/outfits/outfit_nasal_helm_thumb.png',
    hairLayer: '/characters/outfits/outfit_nasal_helm_hair.png',
  },
  {
    id: 'outfit_velvet_beret',
    category: 'outfit',
    title: 'Kadife Bere',
    subtitle: SLOT_LABELS.hat,
    description: 'Tüy süslü bordo kadife bere. Kasabada kibar bir sorgucu.',
    price: 220,
    rarity: 'common',
    slot: 'hat',
    layer: '/characters/outfits/outfit_velvet_beret.png',
    thumb: '/characters/outfits/outfit_velvet_beret_thumb.png',
    hairLayer: '/characters/outfits/outfit_velvet_beret_hair.png',
  },
  {
    id: 'outfit_black_zucchetto',
    category: 'outfit',
    title: 'Siyah Takke',
    subtitle: SLOT_LABELS.hat,
    description: 'Din adamlarının sade siyah takkesi. Alçakgönüllü ama ürkütücü.',
    price: 180,
    rarity: 'common',
    slot: 'hat',
    layer: '/characters/outfits/outfit_black_zucchetto.png',
    thumb: '/characters/outfits/outfit_black_zucchetto_thumb.png',
  },
  {
    id: 'outfit_executioner_hood',
    category: 'outfit',
    title: 'Cellat Başlığı',
    subtitle: SLOT_LABELS.mask,
    description: 'Göz delikli kara bez başlık. Hüküm verildiğinde yüzün görünmez.',
    price: 1300,
    rarity: 'legendary',
    slot: 'mask',
    layer: '/characters/outfits/outfit_executioner_hood.png',
    thumb: '/characters/outfits/outfit_executioner_hood_thumb.png',
    hairLayer: '/characters/outfits/outfit_executioner_hood_hair.png',
  },
  {
    id: 'outfit_venetian_mask',
    category: 'outfit',
    title: 'Altın Göz Maskesi',
    subtitle: SLOT_LABELS.mask,
    description: 'Altın varaklı Venedik maskesi. Kimin sorguladığını kimse bilmez.',
    price: 650,
    rarity: 'rare',
    slot: 'mask',
    layer: '/characters/outfits/outfit_venetian_mask.png',
    thumb: '/characters/outfits/outfit_venetian_mask_thumb.png',
  },
  {
    id: 'outfit_cloth_scarf',
    category: 'outfit',
    title: 'Yüz Örtüsü',
    subtitle: SLOT_LABELS.mask,
    description: 'Burnu ve ağzı örten eski bez. Vebalı köylerde şart.',
    price: 200,
    rarity: 'common',
    slot: 'mask',
    layer: '/characters/outfits/outfit_cloth_scarf.png',
    thumb: '/characters/outfits/outfit_cloth_scarf_thumb.png',
  },
  {
    id: 'outfit_iron_chain',
    category: 'outfit',
    title: 'Demir Zincir',
    subtitle: SLOT_LABELS.necklace,
    description: 'Göğse sarkan kalın demir halkalı zincir. Tövbenin ağırlığı.',
    price: 160,
    rarity: 'common',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_iron_chain.png',
    thumb: '/characters/outfits/outfit_iron_chain_thumb.png',
  },
  {
    id: 'outfit_bone_amulet',
    category: 'outfit',
    title: 'Kemik Muska',
    subtitle: SLOT_LABELS.necklace,
    description: 'İpe dizilmiş kemik ve diş parçaları. Batıl inancın kanıtı mı, koruyucu mu?',
    price: 420,
    rarity: 'rare',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_bone_amulet.png',
    thumb: '/characters/outfits/outfit_bone_amulet_thumb.png',
  },
  {
    id: 'outfit_inquisitor_seal',
    category: 'outfit',
    title: 'Engizisyon Mührü',
    subtitle: SLOT_LABELS.necklace,
    description: 'Ağır altın zincirde engizisyonun büyük mührü. Kapılar ardına kadar açılır.',
    price: 1000,
    rarity: 'legendary',
    slot: 'necklace',
    layer: '/characters/outfits/outfit_inquisitor_seal.png',
    thumb: '/characters/outfits/outfit_inquisitor_seal_thumb.png',
  },
  {
    id: 'outfit_black_cassock',
    category: 'outfit',
    title: 'Siyah Cüppe',
    subtitle: SLOT_LABELS.body,
    description: 'Boğazdan ayak bileğine düğmeli sade siyah cüppe.',
    price: 400,
    rarity: 'common',
    slot: 'body',
    layer: '/characters/outfits/outfit_black_cassock.png',
    thumb: '/characters/outfits/outfit_black_cassock_thumb.png',
  },
  {
    id: 'outfit_crusader_tabard',
    category: 'outfit',
    title: 'Haçlı Tabardı',
    subtitle: SLOT_LABELS.body,
    description: 'Zincir zırhın üstüne giyilen, kızıl haçlı beyaz tabard.',
    price: 850,
    rarity: 'rare',
    slot: 'body',
    layer: '/characters/outfits/outfit_crusader_tabard.png',
    thumb: '/characters/outfits/outfit_crusader_tabard_thumb.png',
  },
  {
    id: 'outfit_plague_doctor_coat',
    category: 'outfit',
    title: 'Veba Doktoru Paltosu',
    subtitle: SLOT_LABELS.body,
    description: 'Yere değen mumlu siyah deri palto. Veba maskesiyle tam takım.',
    price: 1400,
    rarity: 'legendary',
    slot: 'body',
    layer: '/characters/outfits/outfit_plague_doctor_coat.png',
    thumb: '/characters/outfits/outfit_plague_doctor_coat_thumb.png',
  },
  {
    id: 'outfit_leather_sandals',
    category: 'outfit',
    title: 'Deri Sandalet',
    subtitle: SLOT_LABELS.shoes,
    description: 'Keşişlerin çapraz bağlı deri sandaletleri.',
    price: 120,
    rarity: 'common',
    slot: 'shoes',
    layer: '/characters/outfits/outfit_leather_sandals.png',
    thumb: '/characters/outfits/outfit_leather_sandals_thumb.png',
  },
  {
    id: 'outfit_poulaines',
    category: 'outfit',
    title: 'Sivri Burunlu Ayakkabı',
    subtitle: SLOT_LABELS.shoes,
    description: 'Ucu kıvrık, sivri burunlu soylu ayakkabısı.',
    price: 380,
    rarity: 'rare',
    slot: 'shoes',
    layer: '/characters/outfits/outfit_poulaines.png',
    thumb: '/characters/outfits/outfit_poulaines_thumb.png',
  },
];

export const getItemById = (id: string) => MARKET_ITEMS.find((item) => item.id === id);

export const getOutfitItems = () => MARKET_ITEMS.filter((item) => item.category === 'outfit');

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
  { id: 'solve', title: 'Vakayı Çöz', reward: '+100', description: 'Doğru kişiyi mahkum ettiğinde.' },
  { id: 'fast', title: 'Erken Hüküm', reward: '+50', description: 'Suçluyu ilk iki günde bulursan ek ödül.' },
  { id: 'daily', title: 'Günlük Sorgu', reward: '+20', description: 'Her gün ilk soruşturmanı tamamladığında.' },
  { id: 'community', title: 'Topluluk', reward: '+30', description: 'Yazdığın hikaye başkaları tarafından oynandıkça.' },
];

export const formatEur = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(value);
