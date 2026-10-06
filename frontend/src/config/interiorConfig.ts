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
  particleType: 'embers' | 'dust' | 'fog';
  lightingTone: 'warm-fire' | 'cold-moon' | 'dim-amber' | 'eerie-green';
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

// İç mekânı hazırlanmış evrenler. Listede olmayan evrende iç mekân sayfası "henüz hazır değil" der.
const INTERIORS_BY_SCENARIO: Record<string, Record<string, LocationInteriorData>> = {
  medieval: MEDIEVAL_INTERIORS,
};

export function getInterior(scenarioType: string, locationId: string): LocationInteriorData | null {
  return INTERIORS_BY_SCENARIO[scenarioType]?.[locationId] ?? null;
}

export function getScenarioInteriors(scenarioType: string): LocationInteriorData[] {
  return Object.values(INTERIORS_BY_SCENARIO[scenarioType] ?? {});
}
