export interface InteriorHotspot {
  id: string;
  x: number; // Yüzde olarak yatay konum (0 - 100)
  y: number; // Yüzde olarak dikey konum (0 - 100)
  title: string;
  category: 'npc' | 'clue' | 'atmosphere' | 'passage';
  icon: string;
  summary: string;
  description: string;
  clueSnippet?: string;
  actionText?: string;
  actionHref?: string;
}

export interface LocationInteriorData {
  id: string;
  // Mekân seçim menüsünde görünen kısa ad
  menuLabel: string;
  name: string;
  subtitle: string;
  scenarioType: string;
  npcId?: string;
  npcName?: string;
  backgroundImage: string;
  particleType: 'embers' | 'dust' | 'fog' | 'rain';
  // neon: meşale yerine pembe-camgöbeği titreyen neon ışığı (cyberpunk)
  lightingTone: 'warm-fire' | 'cold-moon' | 'dim-amber' | 'eerie-green' | 'neon';
  initialPan: number; // Başlangıç kamera açısı (yüzde veya piksel)
  hotspots: InteriorHotspot[];
}

// İç mekânlar evrene göre ayrılır: aynı mekân id'si (ör. tavern) her evrende başka bir yerdir
const MEDIEVAL_INTERIORS: Record<string, LocationInteriorData> = {
  tavern: {
    id: 'tavern',
    menuLabel: '🍺 Taverna (Kardeş Aldric)',
    name: 'Ashenmoor Tavernası',
    subtitle: 'Karga ve Kadeh — Sırların ve Fısıltıların Sığınağı',
    scenarioType: 'medieval',
    npcId: 'tavern',
    npcName: 'Kardeş Aldric',
    backgroundImage: '/backgrounds/interior_tavern_panorama.jpg',
    particleType: 'embers',
    lightingTone: 'warm-fire',
    initialPan: -15,
    hotspots: [
      {
        id: 'aldric',
        x: 21,
        y: 52,
        title: 'Kardeş Aldric (Hancı)',
        category: 'npc',
        icon: '🍺',
        summary: 'Tezgâhın arkasında gergin bir şekilde kupa dolduran hancı.',
        description:
          'Kardeş Aldric, elleri hafifçe titreyerek müşterilerine bira dolduruyor. Bakışları sürekli kapıya ve şöminenin karanlık köşelerine kayıyor. Köydeki son olaylar hakkında bildiklerini saklamakta zorlanıyor gibi.',
        actionText: 'Aldric ile Sorguya Başla',
        actionHref: '/interact/tavern',
      },
      {
        id: 'fireplace',
        x: 88,
        y: 62,
        title: 'Büyük Taş Şömine ve Fısıldaşanlar',
        category: 'atmosphere',
        icon: '🔥',
        summary: 'Ateşin sıcaklığına sığınmış kapüşonlu köylüler.',
        description:
          'Közlerin çıtırtısı arasında fısıltılar duyuluyor: "...dün gece mezarlık tarafında parlayan meşaleler vardı... Silas yine kilisenin çanını çalmadı..." Köylüler Engizitörün gölgesini görünce aniden susuyor.',
        clueSnippet: 'Dün gece mezarlıkta meşaleler görüldüğüne dair kulak misafiri olunan bir fısıltı.',
      },
      {
        id: 'barrels',
        x: 8,
        y: 68,
        title: 'Meşe Bira Varilleri ve Gizli Bölme',
        category: 'clue',
        icon: '🛢️',
        summary: 'Tezgâhın arkasına istiflenmiş eski meşe fıçılar.',
        description:
          'En alttaki fıçının üzerinde kilise mührüne benzeyen kazınmış bir işaret var. Varillerin arkasındaki zeminde taze tebeşir tozu ve kül kalıntıları dikkat çekiyor.',
        clueSnippet: 'Hancının tezgâhının dibindeki fıçıda gizli bir işaret ve zemin kalıntıları bulundu.',
      },
      {
        id: 'stairs',
        x: 52,
        y: 42,
        title: 'Gıcırdayan Üst Kat Merdivenleri',
        category: 'passage',
        icon: '🪜',
        summary: 'Karanlık kiralık odalara çıkan ahşap merdiven.',
        description:
          'Yukarıdan ağır ayak sesleri ve tahta gıcırtıları geliyor. Hancının dediğine göre üst kattaki köşe oda iki gündür kilitli tutuluyor.',
      },
      {
        id: 'table',
        x: 63,
        y: 58,
        title: 'Gizli Müzakere Masası',
        category: 'clue',
        icon: '📜',
        summary: 'Yarım bırakılmış yemek ve mum damlalarıyla kaplı parşömen.',
        description:
          'Masada devrilmiş bir kalay kupa ve üzerinde kırmızı balmumu damlamış yırtık bir kâğıt parçası duruyor. Birisi Engizitör içeri girdiğinde aceleyle masayı terk etmiş.',
        clueSnippet: 'Masada aceleyle terk edilmiş, üzerinde kilise balmumu olan şüpheli bir not kırıntısı.',
      },
    ],
  },
  church: {
    id: 'church',
    menuLabel: '⛪ Kilise (Peder Malachar)',
    name: 'Ashenmoor Kilisesi',
    subtitle: 'Aziz Jude Bazilikası — Taş Sütunlar ve Soğuk Dualar',
    scenarioType: 'medieval',
    npcId: 'church',
    npcName: 'Peder Malachar',
    backgroundImage: '/backgrounds/interior_church_panorama.jpg',
    particleType: 'dust',
    lightingTone: 'cold-moon',
    initialPan: 0,
    hotspots: [
      {
        id: 'malachar',
        x: 26,
        y: 54,
        title: 'Peder Malachar (Kürsü)',
        category: 'npc',
        icon: '⛪',
        summary: 'Kürsünün yanında dua kitabını inceleyen din adamı.',
        description:
          'Peder Malachar soğuk gözlerle seni süzüyor. Tavırları son derece hesaplı ve eğitimli bir zekâyı ele veriyor. Kilisenin kutsal emanetlerini ve köyün günahlarını herkesten iyi bildiği aşikâr.',
        actionText: 'Malachar ile Sorguya Başla',
        actionHref: '/interact/church',
      },
      {
        id: 'altar',
        x: 50,
        y: 55,
        title: 'Kutsal Sunak ve Vitray Pencere',
        category: 'clue',
        icon: '🕯️',
        summary: 'Ayin masası ve tepedeki görkemli gül vitray.',
        description:
          'Gül pencereden süzülen solgun ay ışığı sunağın üzerindeki gümüş kadehi aydınlatıyor. Kadehin kenarında kurumuş koyu renkli bir leke var; şaraptan çok daha kıvamlı görünüyor.',
        clueSnippet: 'Sunaktaki gümüş kadehte kanı andıran kurumuş bir sıvı kalıntısı.',
      },
      {
        id: 'tapestry',
        x: 78,
        y: 45,
        title: 'Eski Kilise Duvar Halısı',
        category: 'atmosphere',
        icon: '🖼️',
        summary: 'Yüz yıllık dini dokuma ve gizli duvar çatlağı.',
        description:
          'Halının arkasında hafif bir hava akımı hissediliyor. Taş duvarda kriptaya veya yeraltı mahzenine giden gizli bir geçit olabilir.',
      },
      {
        id: 'candelabra',
        x: 93,
        y: 58,
        title: 'Devasa Döküm Şamdan',
        category: 'atmosphere',
        icon: '🕯️',
        summary: 'Onlarca eriyen balmumu mumuyla aydınlanan köşe.',
        description:
          'Balmumunun ağır kokusu kilisenin rutubetli taş kokusuna karışıyor. Şamdanın kaidesine kazınmış tuhaf bir Latince mısra göze çarpıyor.',
      },
    ],
  },
  mill: {
    id: 'mill',
    menuLabel: '⚙️ Değirmen (Giles)',
    name: 'Ashenmoor Değirmeni',
    subtitle: 'Eski Un Değirmeni — Gıcırdayan Çarklar ve Beyaz Tozlar',
    scenarioType: 'medieval',
    npcId: 'mill',
    npcName: 'Değirmenci Giles',
    backgroundImage: '/backgrounds/interior_mill_panorama.jpg',
    particleType: 'dust',
    lightingTone: 'dim-amber',
    initialPan: 10,
    hotspots: [
      {
        id: 'giles',
        x: 76,
        y: 60,
        title: 'Değirmenci Giles (Çalışma Masası)',
        category: 'npc',
        icon: '⚙️',
        summary: 'Tartıların ve defterlerin başında bekleyen unlu adam.',
        description:
          'Giles, un tozlarına bulanmış önlüğüyle tartıların arkasında duruyor. Sürekli etrafına bakınarak köyün tahıl ambarlarındaki eksilmeleri ve gece teslimatlarını gizlemeye çalışıyor.',
        actionText: 'Giles ile Sorguya Başla',
        actionHref: '/interact/mill',
      },
      {
        id: 'gears',
        x: 22,
        y: 40,
        title: 'Devasa Ahşap Değirmen Çarkları',
        category: 'atmosphere',
        icon: '⚙️',
        summary: 'Ağır ağır dönen ve inleyen ahşap dişli mekanizması.',
        description:
          'Devasa dişliler her dönüşünde ürkütücü bir gıcırtı çıkarıyor. Çarkların dişleri arasında sıkışmış koyu renkli bir kumaş parçası var.',
        clueSnippet: 'Değirmen dişlisine takılmış yırtık, pelerin kumaşına benzer bir parça.',
      },
      {
        id: 'marked_sacks',
        x: 84,
        y: 78,
        title: 'Mühürlü Çuvallar',
        category: 'clue',
        icon: '🌾',
        summary: 'Üzerine kırmızı simgeler çizilmiş tahıl çuvalları.',
        description:
          'Bu çuvalların üzerindeki işaretler standart değirmen mührü değil. Okült bir ritüele ait koruma rünlerine benziyor. İçlerinde tahıldan başka ne saklanıyor olabilir?',
        clueSnippet: 'Çuvalların üzerine kırmızı boyayla çizilmiş esrarengiz pagan rünleri.',
      },
      {
        id: 'loft_stairs',
        x: 62,
        y: 46,
        title: 'Tavan Arası Merdiveni',
        category: 'passage',
        icon: '🪜',
        summary: 'Karanlık tahıl deposuna çıkan dik basamaklar.',
        description:
          'Basamaklarda taze ayak izleri ve un saçılmış. Biri yakın zamanda yukarıya bir şeyler taşımış.',
      },
    ],
  },
  graveyard: {
    id: 'graveyard',
    menuLabel: '🪦 Mezarlık (İhtiyar Silas)',
    name: 'Ashenmoor Mezarlığı',
    subtitle: 'Sisli Kabirler — Sessizliğin ve Toprağın Şahitliği',
    scenarioType: 'medieval',
    npcId: 'graveyard',
    npcName: 'İhtiyar Silas',
    backgroundImage: '/backgrounds/interior_graveyard_panorama.png',
    particleType: 'fog',
    lightingTone: 'cold-moon',
    initialPan: 0,
    hotspots: [
      {
        id: 'silas',
        x: 48,
        y: 62,
        title: 'İhtiyar Silas (Mezarcı Kulübesi Yanı)',
        category: 'npc',
        icon: '🪦',
        summary: 'Küreğine yaslanmış, toprağı izleyen yaşlı mezarcı.',
        description:
          'Silas, kırk yıldır bu köyde ölen herkesi gömdü. Konuşurken gözlerini yerden ayırmıyor; ölülerin fısıltılarını canlıların yalanlarına tercih ettiğini söylüyor.',
        actionText: 'Silas ile Sorguya Başla',
        actionHref: '/interact/graveyard',
      },
      {
        id: 'mausoleum',
        x: 65,
        y: 38,
        title: 'Eski Aile Anıt Mezarı',
        category: 'clue',
        icon: '🏛️',
        summary: 'Kapısı aralık kalmış antik taş türbe.',
        description:
          'Türbenin demir kapısındaki kilit zorlanarak kırılmış. İçeriden taze yakılmış mum kokusu geliyor. Biri mezarları kazmadan önce burada ayin yapmış olmalı.',
        clueSnippet: 'Anıt mezarın kilidi kırılmış ve içeride yeni yakılmış balmumu kalıntıları bulundu.',
      },
      {
        id: 'open_grave',
        x: 35,
        y: 65,
        title: 'Yeni Kazılmış İsimsiz Kabir',
        category: 'clue',
        icon: '⛏️',
        summary: 'Henüz doldurulmamış çamurlu mezar çukuru.',
        description:
          'Çukurun kenarında bir kadın eldiveni ve kırılmış bir haç kolye ucu çamura batmış vaziyette yatıyor.',
        clueSnippet: 'Yeni kazılmış mezarın kenarında bulunan çamura batmış haç kolye ucu.',
      },
    ],
  },
};

// Neon Prime (cyberpunk). "Aranabilecek yer" noktaları sabit bir ipucu vermez: oyuncuyu mekânın
// aramasına yönlendirir, bulunan ipucu o vaka için üretilmiş gerçek ipucudur.
const CYBERPUNK_INTERIORS: Record<string, LocationInteriorData> = {
  tavern: {
    id: 'tavern',
    menuLabel: '🚔 Karakol (Kael Voss)',
    name: 'Neon Prime Karakolu',
    subtitle: 'Nöbetçi Masası — Arama İzinlerinin ve Bitmeyen Raporların Yeri',
    scenarioType: 'cyberpunk',
    npcId: 'tavern',
    npcName: 'Kael Voss',
    backgroundImage: '/backgrounds/interior_cyberpunk_tavern.webp',
    particleType: 'rain',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'kael',
        x: 33,
        y: 57,
        title: 'Memur Kael Voss (Nöbetçi Masası)',
        category: 'npc',
        icon: '👮',
        summary: 'Holografik dosyaların başında yorgun gözlerle bekleyen memur.',
        description:
          'Kael Voss, gözündeki implantın soluk ışığında ekrandaki dosyaları kaydırıyor. Her isteği masasına ne kadar iş açacağına göre tartıyor. Arama izinleri onun imzasından geçiyor.',
        actionText: 'Kael Voss ile Sorguya Başla',
        actionHref: '/interact/tavern',
      },
      {
        id: 'wanted_board',
        x: 9,
        y: 38,
        title: 'Aranan Afişleri ve Şehir Haritası',
        category: 'atmosphere',
        icon: '📌',
        summary: 'Solmuş afişler, işaretli bir harita ve üst üste yapıştırılmış notlar.',
        description:
          'Mantar panoda solmuş aranan afişleri, raptiyelerle işaretlenmiş bir şehir haritası ve üst üste yapıştırılmış notlar var. Bazı dosyalar çoktan kapanmış ama kimse afişleri indirmeye zahmet etmemiş.',
      },
      {
        id: 'holding_cell',
        x: 51,
        y: 52,
        title: 'Nezarethane',
        category: 'atmosphere',
        icon: '🔒',
        summary: 'Soluk camgöbeği ışık altında parmaklıkların ardındaki gözaltılar.',
        description:
          'Parmaklıkların ardında gözaltılar bekliyor. Kapının önündeki iki memur alçak sesle konuşuyor; içeriden biri dışarıdakilere bir şey fısıldamaya çalışıyor.',
      },
      {
        id: 'evidence_lockers',
        x: 64,
        y: 55,
        title: 'Delil Dolapları',
        category: 'clue',
        icon: '🗄️',
        summary: 'Sıra sıra dizilmiş numaralı metal dolaplar.',
        description:
          'Numaralı metal dolapların birkaçının kilidi zorlanmış gibi duruyor. Karakolun burasını aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/tavern',
      },
      {
        id: 'street_window',
        x: 85,
        y: 47,
        title: 'Yağmurlu Cadde',
        category: 'atmosphere',
        icon: '🌃',
        summary: 'Camın ardında neon tabelalar ve seyyar yemek tezgâhları.',
        description:
          'Neon tabelalar, seyyar yemek tezgâhları ve alçaktan uçan bir dron. Şehir, karakolun içinde olanlardan habersiz akıp gidiyor.',
      },
      {
        id: 'printer',
        x: 26,
        y: 88,
        title: 'Eski Yazıcı',
        category: 'atmosphere',
        icon: '🖨️',
        summary: 'Hâlâ kâğıtla çalışan, son çıktısı yarım kalmış bir yazıcı.',
        description:
          'Karakol yeni sistemlere geçmeyi yıllardır erteliyor. Yazıcının ağzında yarım kalmış bir rapor sallanıyor.',
      },
    ],
  },
  church: {
    id: 'church',
    menuLabel: '🍜 Lokanta (Mirel Sato)',
    name: 'Static Spoon',
    subtitle: 'Gece Boyu Açık Erişte Lokantası — Kuryelerin, Polislerin ve Uykusuzların Durağı',
    scenarioType: 'cyberpunk',
    npcId: 'church',
    npcName: 'Mirel Sato',
    backgroundImage: '/backgrounds/interior_cyberpunk_church.webp',
    particleType: 'dust',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'mirel',
        x: 18,
        y: 50,
        title: 'Mirel Sato (Tezgâh)',
        category: 'npc',
        icon: '🍜',
        summary: 'Buharın içinde kepçesiyle kazanların başında duran lokanta sahibi.',
        description:
          'Metal önkolu buharın içinde parlıyor. Kepçeyi kazana daldırırken gözü kapıdan girip çıkan herkeste. Bu tezgâhtan geçen her söz bir gün işine yarayabilir.',
        actionText: 'Mirel Sato ile Sorguya Başla',
        actionHref: '/interact/church',
      },
      {
        id: 'regulars',
        x: 44,
        y: 60,
        title: 'Tezgâhtaki Müdavimler',
        category: 'atmosphere',
        icon: '🥢',
        summary: 'Eriştelerine eğilmiş kuryeler ve gece vardiyasından çıkanlar.',
        description:
          'Konuşmalar alçak sesle yapılıyor ama yan yana oturanlar birbirinin her kelimesini duyuyor. Burada sır tutmak, erişteyi soğumadan bitirmekten zor.',
      },
      {
        id: 'kitchen_door',
        x: 53,
        y: 50,
        title: 'Mutfağa Açılan Arka Kapı',
        category: 'passage',
        icon: '🚪',
        summary: 'Aralık kapının ardında tavalar ve sokağa açılan servis çıkışı.',
        description:
          'Mutfağın arkasındaki servis çıkışı doğrudan ara sokağa açılıyor. Buradan girip çıkan birini tezgâhtakiler fark etmez.',
      },
      {
        id: 'vending_machine',
        x: 65,
        y: 44,
        title: 'Ezik Otomat',
        category: 'atmosphere',
        icon: '🥤',
        summary: 'Camı çatlamış, yarısı boş bir içecek otomatı.',
        description:
          'Biri yumruğunu camına geçirmiş; çatlak hâlâ duruyor. İçindeki içeceklerin yarısının son kullanma tarihi çoktan geçmiş.',
      },
      {
        id: 'back_booth',
        x: 85,
        y: 80,
        title: 'Arka Köşedeki Masa',
        category: 'clue',
        icon: '🍲',
        summary: 'Yarım bırakılmış bir kâse ve dağılmış yemek çubukları.',
        description:
          'Biri buradan aceleyle kalkmış. Lokantanın arka köşelerini aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/church',
      },
      {
        id: 'foggy_window',
        x: 86,
        y: 33,
        title: 'Buğulu Vitrin',
        category: 'atmosphere',
        icon: '🌧️',
        summary: 'Yağmur damlalarının arasından süzülen pembe neon.',
        description:
          'Buğulu camın ardında caddenin neon ışıkları bulanıklaşıyor. İçeriden dışarısı görünmüyor, dışarıdan da içerisi.',
      },
    ],
  },
  graveyard: {
    id: 'graveyard',
    menuLabel: '🏥 Klinik (Brakk Coil)',
    name: 'Neon Prime Kliniği',
    subtitle: 'Yeraltı Siber Cerrahisi — Faturasız Ameliyatlar, Sorusuz Hastalar',
    scenarioType: 'cyberpunk',
    npcId: 'graveyard',
    npcName: 'Brakk Coil',
    backgroundImage: '/backgrounds/interior_cyberpunk_graveyard.webp',
    particleType: 'dust',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'brakk',
        x: 70,
        y: 57,
        title: 'Brakk Coil (Çalışma Masası)',
        category: 'npc',
        icon: '🩺',
        summary: 'Masasında mekanik bir eli söken siber cerrah.',
        description:
          'Brakk, başını kaldırmadan konuşuyor; tornavidası mekanik elin eklemlerinde dolaşıyor. Burada her işlemin bir bedeli var ve Brakk kimseye güvenmiyor.',
        actionText: 'Brakk Coil ile Sorguya Başla',
        actionHref: '/interact/graveyard',
      },
      {
        id: 'bio_storage',
        x: 21,
        y: 48,
        title: 'Biyolojik Saklama Dolapları',
        category: 'clue',
        icon: '🧪',
        summary: 'Buzlu camların ardında yeşil ışıkta parlayan şişeler.',
        description:
          'Etiketsiz tüpler ve şişeler raflara dizilmiş; bazı rafların yakın zamanda boşaltıldığı belli. Kliniği aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/graveyard',
      },
      {
        id: 'surgery_chair',
        x: 56,
        y: 65,
        title: 'Ameliyat Koltuğu',
        category: 'atmosphere',
        icon: '💺',
        summary: 'Tavandan sarkan robotik kolların altındaki yıpranmış koltuk.',
        description:
          'Deri koltuk sayısız ameliyattan geçmiş. Zemindeki lekeler hiçbir zaman tam olarak temizlenmemiş.',
      },
      {
        id: 'plastic_curtain',
        x: 33,
        y: 45,
        title: 'Plastik Perdenin Ardı',
        category: 'passage',
        icon: '🚪',
        summary: 'Kutularla dolu bir arka odayı gizleyen yarı saydam perde.',
        description:
          'Perdenin ardındaki odada hastaların görmemesi gereken işler yapılıyor olmalı. İçeriden soğutucu uğultusu geliyor.',
      },
      {
        id: 'scrap_implants',
        x: 91,
        y: 86,
        title: 'Hurda İmplantlar',
        category: 'atmosphere',
        icon: '🦾',
        summary: 'Bir kasaya gelişigüzel atılmış sökülmüş robot kolları.',
        description:
          'Kullanılmış implantlar ve sökülmüş protezler üst üste yığılmış. Kimin bedeninden çıktıkları belli değil.',
      },
    ],
  },
  mill: {
    id: 'mill',
    menuLabel: '🛠️ Tamirhane (AURA-9)',
    name: 'AURA Tamirhanesi',
    subtitle: 'Siber Protez ve Robot Atölyesi — Kıvılcımlar, Lehim ve Yedek Parçalar',
    scenarioType: 'cyberpunk',
    npcId: 'mill',
    npcName: 'AURA-9',
    backgroundImage: '/backgrounds/interior_cyberpunk_mill.webp',
    particleType: 'embers',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'aura',
        x: 37,
        y: 51,
        title: 'AURA-9 (Lehim Tezgâhı)',
        category: 'npc',
        icon: '🤖',
        summary: 'Bir devre kartını lehimleyen beyaz-krom kabuklu android.',
        description:
          'AURA-9’un mavi optik sensörleri her hareketi kaydediyor. Ses tonu kibar ve ticari, ama bakışları bir makineye göre fazlasıyla dikkatli.',
        actionText: 'AURA-9 ile Sorguya Başla',
        actionHref: '/interact/mill',
      },
      {
        id: 'robot_arm',
        x: 17,
        y: 62,
        title: 'Robotik Montaj Kolu',
        category: 'atmosphere',
        icon: '🦿',
        summary: 'Masanın üzerinde kendi kendine çalışan montaj kolu.',
        description:
          'Kol, sahibine ihtiyaç duymadan vida sıkıyor. Atölyede kimse yokken de iş durmuyor.',
      },
      {
        id: 'limb_rack',
        x: 55,
        y: 42,
        title: 'Yedek Uzuv Rafı',
        category: 'atmosphere',
        icon: '🦾',
        summary: 'Kancalara asılı kollar ve raflarda dizili boş bakışlı yüzler.',
        description:
          'Bazı parçaların seri numaraları kazınarak silinmiş. Bu rafın kaçta kaçının yasal yoldan geldiğini kimse sormuyor.',
      },
      {
        id: 'circuit_table',
        x: 45,
        y: 88,
        title: 'Devre Kartı Masası',
        category: 'clue',
        icon: '💾',
        summary: 'Yarı sökülmüş kartlar ve hafıza modülleri.',
        description:
          'Masadaki hafıza modüllerinden birinin kayıtları silinmeye çalışılmış gibi. Atölyeyi aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/mill',
      },
      {
        id: 'shutter',
        x: 82,
        y: 52,
        title: 'Yarı Açık Kepenk',
        category: 'passage',
        icon: '🚪',
        summary: 'Kepengin altından görünen yağmurlu sokak.',
        description:
          'Atölyeye gece yarısı da girip çıkılabiliyor. Kepengin önündeki ıslak zeminde silik ayak izleri var.',
      },
    ],
  },
  farm: {
    id: 'farm',
    menuLabel: '🏮 Sokak Pazarı (Ash)',
    name: 'Gece Pazarı',
    subtitle: 'Neon Prime Sokak Pazarı — Hurda Teknoloji, Sokak Yemeği ve Satılık Fısıltılar',
    scenarioType: 'cyberpunk',
    npcId: 'farm',
    npcName: 'Ash',
    backgroundImage: '/backgrounds/interior_cyberpunk_farm.webp',
    particleType: 'rain',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'ash',
        x: 21,
        y: 57,
        title: 'Ash (Hurda Tezgâhı)',
        category: 'npc',
        icon: '🧥',
        summary: 'Kapüşonunun altından kalabalığı izleyen sokak satıcısı.',
        description:
          'Gözlüğü alnında, eldivenli elleri kenetli. Bu pazarda görünmez olmak bir zırh; Ash de bu zırhın ardından her şeyi görüyor.',
        actionText: 'Ash ile Sorguya Başla',
        actionHref: '/interact/farm',
      },
      {
        id: 'ash_stall',
        x: 35,
        y: 85,
        title: 'Ash’in Tezgâhı',
        category: 'clue',
        icon: '🔌',
        summary: 'Kablo yumakları, eski piller ve elden düşme devre kartları.',
        description:
          'Tezgâhtaki parçaların bazıları bir hurdaya göre fazla yeni duruyor. Tezgâhı aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/farm',
      },
      {
        id: 'wok_stall',
        x: 44,
        y: 59,
        title: 'Buharlı Wok Tezgâhı',
        category: 'atmosphere',
        icon: '🥘',
        summary: 'Devasa tavada erişte çeviren bir aşçı.',
        description:
          'Buhar neon ışıkla karışıyor; kızgın yağın sesi yakındaki konuşmaları bastırıyor.',
      },
      {
        id: 'lantern_alley',
        x: 65,
        y: 46,
        title: 'Fenerli Pazar Sokağı',
        category: 'passage',
        icon: '🏮',
        summary: 'Kâğıt fenerlerin altında ilerleyen şemsiyeli kalabalık.',
        description:
          'Bu kalabalığın içinde biri takip edilse kimse fark etmez. Sokak, şehrin daha karanlık katlarına doğru uzanıyor.',
      },
      {
        id: 'hanging_cables',
        x: 85,
        y: 40,
        title: 'Karşı Tezgâh',
        category: 'atmosphere',
        icon: '🧵',
        summary: 'Kancalardan sarkan kablolar ve tencereler.',
        description:
          'Satıcı müşterilerden çok sokağın başını izliyor. Polis geldiğinde bu tezgâhın ilk kapanan olacağı belli.',
      },
    ],
  },
  clinic: {
    id: 'clinic',
    menuLabel: '🍸 Bar (Vera Nyx)',
    name: 'Velvet Static',
    subtitle: 'Karartma Barı — Paralı Askerlerin, Aracıların ve Kaybolmak İsteyenlerin Mekânı',
    scenarioType: 'cyberpunk',
    npcId: 'clinic',
    npcName: 'Vera Nyx',
    backgroundImage: '/backgrounds/interior_cyberpunk_clinic.webp',
    particleType: 'dust',
    lightingTone: 'neon',
    initialPan: 0,
    hotspots: [
      {
        id: 'vera',
        x: 72,
        y: 48,
        title: 'Vera Nyx (Bar Tezgâhı)',
        category: 'npc',
        icon: '🍸',
        summary: 'Bir bardağı ağır ağır parlatırken salonu süzen barmen.',
        description:
          'Çene hattındaki implant neon ışıkta belli belirsiz parlıyor. Herkesle samimi konuşuyor ama kendisi hakkında hiçbir şey söylemiyor.',
        actionText: 'Vera Nyx ile Sorguya Başla',
        actionHref: '/interact/clinic',
      },
      {
        id: 'private_room',
        x: 28,
        y: 45,
        title: 'Boncuk Perdeli Özel Oda',
        category: 'passage',
        icon: '🚪',
        summary: 'Kırmızı ışıklı, alçak sesle pazarlık yapılan arka oda.',
        description:
          'Perdenin ardında birileri anlaşma yapıyor. Davetsiz girenlerin buradan nasıl çıktığını kimse hatırlamıyor.',
      },
      {
        id: 'stage',
        x: 50,
        y: 45,
        title: 'Sahne',
        category: 'atmosphere',
        icon: '🎸',
        summary: 'Sis makinesinin dumanında çalan bir grup.',
        description:
          'Müzik o kadar yüksek ki masalardaki fısıltılar kayboluyor. Burada konuşulanı ancak yan masadaki duyar.',
      },
      {
        id: 'side_booth',
        x: 9,
        y: 64,
        title: 'Yan Odadaki Masa',
        category: 'atmosphere',
        icon: '🤝',
        summary: 'Grafitili duvarın önünde pazarlık yapan iki kişi.',
        description:
          'Siber kollu iki kişi masaya eğilmiş, bir şeyin fiyatında anlaşmaya çalışıyor. Seni görünce sesleri kısılıyor.',
      },
      {
        id: 'behind_bar',
        x: 80,
        y: 72,
        title: 'Bar Tezgâhının Arkası',
        category: 'clue',
        icon: '🍾',
        summary: 'Işıklı raflar ve tezgâhın altındaki kilitli çekmeceler.',
        description:
          'Rafların arkasında içkiden fazlası saklanıyor olabilir. Barın arkasını aramak için arama izni gerekir.',
        actionText: 'Burayı Araştır',
        actionHref: '/interact/clinic',
      },
    ],
  },
};

// İç mekânı hazırlanmış evrenler. Listede olmayan evrende iç mekân sayfası "henüz hazır değil" der.
const INTERIORS_BY_SCENARIO: Record<string, Record<string, LocationInteriorData>> = {
  medieval: MEDIEVAL_INTERIORS,
  cyberpunk: CYBERPUNK_INTERIORS,
};

export function getInterior(scenarioType: string, locationId: string): LocationInteriorData | null {
  return INTERIORS_BY_SCENARIO[scenarioType]?.[locationId] ?? null;
}

export function getScenarioInteriors(scenarioType: string): LocationInteriorData[] {
  return Object.values(INTERIORS_BY_SCENARIO[scenarioType] ?? {});
}
