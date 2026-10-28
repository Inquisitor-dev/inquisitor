// Karakterlerin uzun hikâyeleri ve yetenekleri. Kısa hikâye ve söz `outfits.ts` içindeki `lore` / `quote` alanlarında.
// Yetenek metinleri oyuncuya gösterilir; vaka cevabını (suçlu, gerçek/tuzak ayrımı) asla ele vermemelidir.

export type OutfitAbility = {
  name: string;
  // Tek cümlelik etki
  summary: string;
  // Rozet: "Günde 1 kez", "Vaka başına 1 kez", "Pasif"
  usage: string;
  // Ayrıntılı bak penceresinde gösterilen sınırlar ve kurallar
  rules: string[];
};

export type OutfitStory = {
  abilities: OutfitAbility[];
  // Uzun hikâye, paragraf paragraf
  story: string[];
  // Yetenekleri henüz oyunda çalışmıyorsa true: kartlarda "Yakında aktif" rozeti görünür
  pending?: boolean;
};

// Yetenek sistemi oyunda çalışmaya başlayınca true yap. Kapalıyken kartlarda "Yakında" rozeti görünür.
export const ABILITIES_LIVE = true;

export const OUTFIT_STORIES: Record<string, OutfitStory> = {
  engizitor: {
    abilities: [
      {
        name: 'Sabır',
        summary: 'Her oyun gününün ilk 3 sorusu günlük soru hakkından düşmez.',
        usage: 'Pasif · her gün',
        rules: [
          'Her yeni oyun gününde ilk 3 mesaj soru hakkından sayılmaz.',
          'Kanıt gösterme (yüzleştirme) mesajları da bu üçe dahildir.',
          'Küçük bir kazançtır; ücretsiz karakterin bedeli de budur.',
        ],
      },
    ],
    story: [
      'Engizisyonun en genç sorgucusu olarak Ashenmoor’a gönderildiğinde henüz yirmi beş yaşındaydı. Haçını göğsünde, şüphesini kalbinde taşıdı; çünkü akıl hocası ona ilk gün şunu öğretmişti: itiraf, sorunun cevabı değil, sorunun başlangıcıdır.',
      'İlk idamlık davasında yanlış kişiyi mahkûm ettiğinden kuşkulanır. Elinde kesin bir kanıt yok, ama o günden beri hiçbir itirafı ilk duyduğunda kabul etmez; her cevabı bir kez daha sorar, sonra bir kez daha. Meslektaşları buna inatçılık der. O ise sabır der.',
      'Şimdi Ashenmoor’un taş sokaklarında ve loş hanlarında yeni bir cinayetin izini sürüyor. Elinde kılıç yok; yalnızca soruları, bir de bitmeyen sabrı var. Soruşturma dört gün sürecek ve ona göre dört gün, doğruyu bulmaya yetecek kadar uzun.',
    ],
  },

  engizitor_hanim: {
    abilities: [
      {
        name: 'Hakkında Söylenenler',
        summary: 'Bir şüpheli seç; öteki şüphelilerin sana onun hakkında söylediklerini defterine derler.',
        usage: 'Günde 1 kez',
        rules: [
          'Yalnızca senin zaten duyduğun cevaplara bakar; yeni bilgi üretmez.',
          'O kişinin adının geçtiği cümleler, kimin söylediğiyle birlikte notlarına eklenir.',
          'Kimse sana o kişiden söz etmediyse hakkın harcanmaz.',
          'Kimin kime kefil olduğunu, kimin kimi suçladığını yan yana görmene yarar.',
        ],
      },
    ],
    story: [
      'Küçük yaşta manastıra verildi ve yeminini kilisenin bodrumundaki arşivde etti. Yıllarca mühürlü mektupları, unutulmuş vasiyetleri ve yarım kalmış tutanakları okudu; bir yalanın mürekkebini kokusundan tanımayı orada öğrendi.',
      'Arşivde kapatamadığı bir dosya var: kendi geçmişinden eksik bir sayfa. Kimin yırttığını, neden yırttığını bilmiyor. Bu yüzden unutulan her kaydı gün yüzüne çıkarmayı kendine görev edindi; başkasının sırrını açarken aslında kendi sırrının peşinde.',
      'Ashenmoor’a engizitörün yardımcısı olarak geldi, ama çoğu zaman yalnız çalışır. Konuşmaları deftere geçirir, geceleri mum ışığında yeniden okuyup çelişkileri arar. Ona göre gerçek tozlu raflarda bekler; yapılacak tek şey üflemektir.',
    ],
  },

  sokak_kurdu: {
    abilities: [
      {
        name: 'Kulis',
        summary: 'Bir mekâna girmek zaman dilimi harcamaz.',
        usage: 'Günde 1 kez',
        rules: [
          'Gece kullanılamaz; gün içinde, bir mekâna girerken etkinleşir.',
          'Günde bir kez fazladan bir mekân ziyareti kazandırır.',
          'Tek başına bilgi vermez, yalnızca zaman kazandırır.',
        ],
      },
    ],
    story: [
      'Kimse ona dedektif demedi. Diploması yok, rozeti yok; ama mahallede bir şey kaybolduğunda ilk onun kapısı çalınır. Kayıp kedileri, çalınan bisikletleri, borç yüzünden ortadan kaybolan komşuları buldu.',
      'Gençliğinde bir çetenin çevresinde dolaştı. Ağır bir şey yapmadı ama bazı kapılarda hâlâ borcu var, bazı insanlar onu hâlâ eski hâliyle hatırlıyor. O yıllar ona dar sokakların kısa yollarını ve herkesin tanıdığı birini bulmayı öğretti; bedelini ödemeye devam ediyor.',
      'Mahallesinin haksızlığa uğramasına izin vermez. Resmî makamların bakmadığı yere o bakar, kâğıtta yazmayanı sokakta okur. Kasabadaki cinayet haberi gelince ilk işi, kimseye güvenmeden her ipucunu kendi gözüyle doğrulamak oldu.',
    ],
  },

  sis_dedektifi: {
    abilities: [
      {
        name: 'Çelişki Taraması',
        summary: 'Bir şüphelinin kendi cevapları arasındaki çelişkileri tarar ve defterine yazar.',
        usage: 'Günde 1 kez',
        rules: [
          'O kişiyle en az 2 cevap almış olmalısın.',
          'En çok 3 madde bulur, her biri kısa bir alıntıyla notlarına eklenir.',
          'Masum da suçlu da çelişebilir; çelişki, suçlu olduğu anlamına gelmez.',
          'Yalnızca senin duyduğun cevaplara bakar, gizli bilgiye erişmez.',
        ],
      },
    ],
    story: [
      'Londra’nın sisli sokaklarında on yedi davayı çözdü. Gazeteler adını yazdı, polis müfettişleri sessizce ondan yardım istedi. Cebinde atasından kalma bir saat taşır; o saat on sekizinci dosyanın açıldığı gece durdu ve o günden beri hiç kurmadı.',
      'O dosya hâlâ kapanmadı. Şüphelisi bir yakını. Kanıtlar ona işaret ediyor ama yüreği buna inanmak istemiyor; bu yüzden her ayrıntıyı iki kez kontrol eder ve yalnız söyleyenin değil, söylediğinin tutarlılığına bakar.',
      'Yeni bir vaka onu yeniden sise çıkarıyor. İnsanlar yalan söylerken çelişir; o çelişkiyi duymak için sessiz kalmayı bilir. Sis her şeyi saklar, ama ayak izlerini asla.',
    ],
  },

  sehir_dedektifi: {
    abilities: [
      {
        name: 'Muhbir',
        summary: 'Henüz aramadığın mekânlardan birinin adını fısıldar; orada işine yarayacak bir şey vardır.',
        usage: 'Günde 1 kez',
        rules: [
          'Mekânı rastgele seçer; katile ya da kilit delile yönlendirmez.',
          'Yalnızca mekânın adını söyler; delilin ne olduğunu ya da kimi işaret ettiğini söylemez.',
          'Aranmamış en az bir mekân kalmış olmalı.',
          'Arama sırasını verimli kurmana yardım eder, vakayı çözmez.',
        ],
      },
    ],
    story: [
      'Yirmi yıl boyunca şehrin en kirli dosyalarına baktı: kaçakçılık, rüşvet, kayıp tanıklar. Rozetini bir kez bile çekmeceye koymadı. Emeklilik kâğıdı masasına geldiğinde imzalamadı; sokaklar onu bırakmadı, o da sokakları.',
      'Her dosyanın bir muhbiri olduğuna inanırdı. Kendi muhbiri vurulduğundan beri kimseye tam güvenmez. Herkes bir şey saklar ve onun işi kimin daha çok terlediğine bakmaktır; yine de o gece muhbirinin son sözünü unutamıyor.',
      'Kırklı yılların yağmurlu sokaklarında, gevşek kravatı ve belindeki rozetiyle ifade toplamaya devam ediyor. Yeni vakada ilk sorusu hep aynı: kim hangi kapının ardında ne saklıyor? Önemli olan, bunlardan hangisinin cinayetle ilgili olduğunu ayıklamak.',
    ],
  },

  golge_ajan: {
    abilities: [
      {
        name: 'Sessiz Oda',
        summary: 'Seçtiğin şüphelinin o günkü konuşmalarında kaçamaklığı azalır.',
        usage: 'Günde 1 kez',
        rules: [
          'Etki o günün sonunda biter.',
          'Her şüpheliye aynı uygulanır; suçlu da masum da daha doğrudan konuşur.',
          'Kimseyi itiraf ettirmez; yalnızca daha az kaçamak cevap verirler.',
        ],
      },
    ],
    story: [
      'Hangi birime bağlı olduğunu kimse bilmiyor. Dosyasında yalnızca bir kod numarası var ve sorguya girdiğinde odadaki kameralar nedense hep arızalanıyor. Sessiz girer, cevapla çıkar; geride ne bir iz ne de bir tanık bırakır.',
      'Kod numarasının ardındaki birim artık onu tanımıyor. Görev dosyaları silindi, adı kayıtlardan çıkarıldı. Yine de görevi bırakmadı; çünkü ona göre iş tamamlanmadan çekilmek, hiç başlamamaktan kötüdür.',
      'Bu vakada resmî bir yetkisi yok. Elinde yalnızca techwear’ı, parmaksız eldivenleri ve sabrı var. İnsanlar kimsenin dinlemediğini hissettiklerinde daha açık konuşur; o da tam olarak bu hissi yaratır. “Ben burada değilim. Sen de beni görmedin.”',
    ],
  },

  kara_yargic: {
    abilities: [
      {
        name: 'Tehdit',
        summary: 'Seçtiğin şüphelinin korkusunu 2 artırır.',
        usage: 'Günde 1 kez',
        rules: [
          'Korkuyu en çok itiraf eşiğinin bir altına çıkarır; tek başına kimseyi itiraf ettiremez.',
          'İtiraf eşiği kişiden kişiye değişir (6–8); dayanıklı biri daha geç kırılır.',
          'Eşiği aşmak için yine bir delil göstermen gerekir.',
          'Kırılan herkes bir itiraf anlatır; itiraf doğru da olabilir yalan da, onu kanıtlarla sına. Aynı gün tekrar kullanılamaz.',
        ],
      },
    ],
    story: [
      'Bir zamanlar kendisi de idama mahkûm edildi. İlmik boynuna geçmeden, hücrede geçirdiği son gecelerde asıl katili buldu; bunu kimsenin yardımı olmadan, yalnızca bir mum ve eski dava kayıtlarıyla yaptı. Hüküm kaldırıldı ama gece onu bırakmadı.',
      'Kurtuluşu tek başına değildi: kendisine yardım eden birine borçlu ve o borcun ne olduğunu kimseye anlatmaz. Haksız mahkûmiyetin bir daha yaşanmaması için yargılar; ya da bedelinin ödenmesi için. Hangisi olduğunu kendisi de bilmiyor.',
      'O günden beri yalnızca karanlıkta yargılar. Diz boyu siyah paltosu ve sıkı düğmeli yakasıyla geceleri dolaşır, sorguyu güneş doğmadan bitirir. “Hüküm gün ağarmadan verilir; güneş masumları kayırır.”',
    ],
  },

  kul_avcisi: {
    abilities: [
      {
        name: 'İz Sürme',
        summary: 'Birini ikna etmeden, aramak istediğin mekân için arama izni kazanırsın.',
        usage: 'Günde 1 kez',
        rules: [
          'Henüz aranmamış bir mekân seçmelisin.',
          'Bu izin de vakadaki arama izni sınırına (çoğu vakada 2) sayılır; sınır dolduysa kullanılamaz.',
          'İzin kazanmak için yapılan diyaloğu atlamanı sağlar.',
        ],
      },
    ],
    story: [
      'Köyü yakıldığında küllerin arasından tek başına çıktı. Ailesinden ve komşularından geriye ne bir ses ne bir iz kaldı. O geceden beri ateşi kimin yaktığını arıyor; peşine düştüğü hiçbir iz soğumadı.',
      'Ateşi yakanın nerede olduğunu bilir gibi davranır, oysa bilmiyor. Bu rolü kendi korkusunu bastırmak için üstlendi ve zamanla başkaları ona inandı. Gerçeği bulamazsa bu inanç çökecek ve ona güvenenlerle birlikte kendisini de gömecek.',
      'Kızıl astarlı deri korsesi, kemerleri ve tokalı çizmeleriyle gotik taşrada iz sürer. Kül her şeyi örter ama o eşelemeyi sever; çünkü örtülenin altında hâlâ sıcak bir kor bulunabileceğine inanır.',
    ],
  },

  kizil_devre: {
    abilities: [
      {
        name: 'Veri Sızdırma',
        summary: 'Panoda seçtiğin tek bir ipin doğru ya da yanlış olduğunu anında öğrenirsin.',
        usage: 'Vaka başına 1 kez',
        rules: [
          'Panoda en az bir ip bulunmalı.',
          'O günün “Düşün” hakkı harcanır; bu yeteneğin bedelidir.',
          'Yalnızca iki kartın kendi söylediğini doğrular, suçluyu adlandırmaz.',
        ],
      },
    ],
    story: [
      'Neon Prime’ın alt katlarında doğdu, devre kartlarıyla büyüdü. Gençken bir şirketin bütün kayıtlarını tek gecede silip geriye yalnızca suçluların adını bıraktı; bu olay şehirde hâlâ efsane olarak anlatılır.',
      'Sildiği kayıtların arasında kendi ailesinin dosyası da vardı. Fark ettiğinde çok geçti. Sistemi kendi lehine hatırlatmak istedi; sistem ise onu hiç unutmadı. Ağın en karanlık köşesinde iz sürerken hâlâ o dosyayı arıyor.',
      'Kızıl devre desenli uzun ceketi ve zırhlı çizmeleriyle paralı asker olarak çalışıyor. Ona göre her bağlantı bir iptir; her ip bir gerçeği ya doğrular ya yalanlar. “Sistem unutmaz. Ben ona neyi hatırlayacağını söylerim.”',
    ],
  },

  mavi_rozet: {
    abilities: [
      {
        name: 'Nabız',
        summary: 'Tüm şüphelilerin korku düzeyini ve itiraf eşiğine kalan puanı tek seferde görürsün.',
        usage: 'Günde 1 kez',
        rules: [
          'Konuşmadığın şüpheliler de görünür.',
          'Başlangıç korkusu şüphelinin kendi yapısından gelir; kimin suçlu olduğunu belli etmez.',
          'Hangi delilin kimi işaret ettiğini göstermez.',
        ],
      },
      {
        name: 'Vizör Kilidi',
        summary: 'Seçtiğin şüphelinin korkusu gün sonunda azalmaz.',
        usage: 'Vaka başına 1 kez',
        rules: [
          'Kilit vaka boyunca o şüphelide kalır.',
          'Tek başına korku artırmaz ve itiraf ettirmez.',
          'Birkaç güne yayılan baskıyı kaybetmemene yardım eder.',
        ],
      },
    ],
    story: [
      'Neon Prime polisinde dürüst kalan son memur olduğu söylenir. Vizörü, yalan söyleyenin nabzını ölçer; yıllarca bu aygıta güvenerek yüzlerce sorgu yürüttü. Rozeti mavi ışık saçar ve şehirdeki herkes o ışığın ne anlama geldiğini bilir.',
      'Vizörün ölçümü bir kez yanlış çıktı ve masum biri bedelini ödedi. O günden beri aygıta tamamen inanmıyor ama inanmayı seçiyor; çünkü dürüstlüğün hâlâ mümkün olduğunu kanıtlamak zorunda. Hatasını kimseye anlatmadı.',
      'Bu vakada mavi ışıklı taktik yeleği, vizörü ve kemerindeki tabancayla şüphelilerin karşısına çıkıyor. Kimin ne kadar baskı altında olduğunu görebilir; ama baskının kimi yıktığını, yıkılanın suçlu mu masum mu olduğunu ölçemez. “Rozetim mavi ışık saçıyor. Sen de bana karşı dürüst ol.”',
    ],
  },

  neon_kuzgun: {
    abilities: [
      {
        name: 'Çatı Geçişi',
        summary: 'Geceleyin, normalde kapalı olan bir mekâna girip konuşma ya da arama yaparsın.',
        usage: 'Günde 1 kez',
        rules: [
          'Gece (günün son dilimi) tek bir mekân için kullanılır.',
          'Mekânı aramak için yine arama izni gerekir.',
          'Bedel: ertesi sabahın ilk zaman dilimini kaybedersin.',
          'Soruşturmanın son gecesinde kullanılamaz; o gece nihai hükmündür.',
        ],
      },
    ],
    story: [
      'Bölge 13’ün çatılarında yaşar, şehre yukarıdan bakar. Neon tabelaların arasında dolaşan bir gölgedir; hiçbir kapıdan girmez, hiçbir ekranda görünmez. Kuzgunlar gibi parlayan her şeyi toplar, özellikle de sırları.',
      'Topladığı sırların bir kısmı onu avlayanlara ait. Hangisinin kime ait olduğunu kendisi de bilir ama bedelini ertelemeyi tercih ediyor. Her sır bir koz, her koz bir borç; hesabın bir gün çatıdan kendisini bulacağını biliyor.',
      'Kızıl ışıklı zırhlı derisi, kemerleri ve kayışlarıyla geceleri çalışır. Gündüz kapalı olan kapılar ona gece açılır, ama her gece bir sabahı götürür. “Bu şehirde ışık yalan söyler. Gölge söylemez.”',
    ],
  },

  yesim_hekim: {
    abilities: [
      {
        name: 'İkinci Nefes',
        summary: 'Vakadaki ilk yanlış hükmün seni kaybettirmez; mahkûm ettiğin kişinin masum olduğu anlaşılır ve soruşturma sürer.',
        usage: 'Vaka başına 1 kez',
        rules: [
          'Yanlış kişiyi mahkûm edersen vaka bitmez; o kişinin masum olduğu açıklanır ve gün kapanır.',
          'Hüküm son günde verildiyse sana bir gün daha tanınır.',
          'İkinci hükümle çözülen vakanın ödülü ve puanı yarıya iner, hızlı çözüm bonusu verilmez.',
        ],
      },
    ],
    story: [
      'Jinling sarayının en genç başhekimiydi. Bir bahar sabahı imparatorun çayındaki acı kokuyu herkesten önce fark etti; üç gün üç gece başında bekledi ve onu ölümden döndürdü. Saray onu ödüllendirdi, ama zehri kimin koyduğunu sormayı unuttu.',
      'O soruyu kendisi hiç unutmadı. Şüphelendiği kişiyi bir kez suçladı ve yanıldı; masum bir hizmetkâr sürgüne gönderildi. Bu yüzden artık hiçbir hükmü tek bakışta vermez. Ona göre ilk teşhis bir tahmindir; gerçek, ikinci bakışta görünür.',
      'Şimdi yaşlı elleriyle saraydan uzakta, sıradan cinayetlerin peşinde. Nabız tutar, göz bebeklerine bakar, susan ağızların ardındaki korkuyu okur. Yanılırsa durmaz; nefesini toplar ve yeniden başlar. “Ceset bir kez susar. Ben ikinci kez dinlerim.”',
    ],
  },

  kar_kahini: {
    abilities: [
      {
        name: 'Rüya Tabiri',
        summary: 'O gün, o gece hakkında anlatacak bir şeyi olan herkes, onunla konuştuğunda kimse sormadan anlatır.',
        usage: 'Günde 1 kez',
        rules: [
          'Etki gün sonuna kadar sürer; kimin anlatacağını söylemez.',
          'Tanıklar, kurbanla son konuşan ve birinin mazeretini doğrulayanlar anlatır; sırrını kimse söylemez.',
          'Anlatılanlar defterine kayıt kartı olarak eklenir. Gece kullanılamaz.',
          'Anlatılabilecek her şey zaten defterindeyse kullanılamaz; hakkın harcanmaz.',
        ],
      },
    ],
    story: [
      'Frosthold’un ak ağaç korusunda, buz tutmuş havuzun başında büyüdü. Kâhinler ona rüyaları yorumlamayı öğretti; kale komutanı bile sefere çıkmadan önce onun kapısını çalardı.',
      'Bir gece rüyasında surun dibinde yatan bir adam gördü. Sabah koştuğunda adam oradaydı, buzun içinde. Kimse ona inanmadı; bazıları onu cadılıkla suçladı. O ise rüyanın bir uyarı değil, bir tanıklık olduğunu anladı: ölüleri herkes görür, ama gördüklerini anlatmaya cesaret edenler azdır.',
      'Şimdi suskun tanıkların peşinde. Ona göre her cinayetin bir de gören gözü vardır; o göz susar, çünkü korkar. Kâhin o korkuyu rüyada çözer ve sabah olunca tanık, kimse sormadan konuşur. “Gözünü kapat. Tanık, uyuyanlara konuşur.”',
    ],
  },

  ayaz_izcisi: {
    abilities: [
      {
        name: 'Keskin Göz',
        summary: 'Arama iznin olan bir mekânı seç; oradaki gizli ipucu aramana gerek kalmadan defterine geçer.',
        usage: 'Günde 1 kez',
        rules: [
          'Yalnızca arama iznin olan mekânlarda kullanılır; izin bu kullanımla harcanır. Gece kullanılamaz.',
          'Doğru noktayı tahmin etmen ya da mesaj yazman gerekmez; ipucu defterine kanıt olarak eklenir.',
          'Arama izni vermez; o mekânda normal aramanın vereceğinden fazlasını göstermez.',
        ],
      },
    ],
    story: [
      'Güneyden, sıcak bir liman şehrinden geldi; Frosthold’a ilk vardığında karı hiç görmemişti. Kale onu gülerek karşıladı. Bir kış sonra surun en dış nöbetini ondan başka kimse tutamıyordu.',
      'Kar fırtınasında kaybolan bir devriyeyi tek başına buldu; izleri rüzgâr silmeden okumuştu. Ama devriyenin komutanı geri dönmedi ve gözcü, kardaki izlerin bir değil iki kişiye ait olduğunu hâlâ kimseye anlatamadı.',
      'Şimdi suskunluğunu soruşturmaya taşıyor. Bir odaya girdiğinde konuşmaz; yerinden oynamış bir tabure, tozu silinmiş bir raf, yeni çakılmış bir çivi ona her şeyi anlatır. Aradığını bulmak için iki kez bakmasına gerek yok. “Kar her şeyi örter. Ama hiçbir şeyi silmez.”',
    ],
  },

  gece_muhabiri: {
    abilities: [
      {
        name: 'Teyit',
        summary: 'Bir şüphelinin sana söylediği bir sözü başka bir şüpheliye okursun; söz gerçek olduğu için geçiştiremez, karşılık vermek zorundadır.',
        usage: 'Günde 1 kez',
        rules: [
          'Yalnızca bir şüphelinin sana gerçekten söylediği cevaplardan seçebilirsin.',
          'Sözü sahibine değil, başka bir şüpheliye okursun; bu bir soru hakkı harcar.',
          'Korkuyu değiştirmez; cevap senin duyduğun konuşmalara dayanır.',
        ],
      },
    ],
    story: [
      'Millfield Gazetesi’nin gece vardiyasına staj için girdi ve bir daha çıkmadı. Kasabada herkesin uyuduğu saatlerde polis telsizini dinler, karakolun önünde sabahlar, kimsenin sormadığı soruları sorar.',
      'İlk büyük haberi bir yangındı. Polis dosyayı kaza diye kapattı; o ise üç tanığın birbirini yalanlayan ifadelerini yan yana koyup manşete taşıdı. Kovuldu. Bir hafta sonra kundakçı yakalandı ve geri çağrıldı. O günden beri kural tek: söylenen her söz kayda geçer, kayda geçen her söz sahibine geri okunur.',
      'Şimdi Millfield’de yeni bir cinayet var ve o, not defteriyle yine en önde. Kimseyi suçlamaz; yalnızca birinin söylediğini ötekine okur ve yüzlerindeki değişimi fotoğraflar. “Kim ne dedi, bende kayıtlı. İnkâr etmek istersen buyur.”',
    ],
  },

  ak_turna: {
    abilities: [
      {
        name: 'Derin Tefekkür',
        summary: 'Panoda Düşün’ü günde bir yerine iki kez kullanabilirsin.',
        usage: 'Pasif · her gün',
        rules: [
          'Her oyun günü iki kez düşünebilirsin.',
          'Değerlendirilecek ip yoksa hakkın harcanmaz.',
          'Düşünmek ipleri değerlendirir, suçlunun adını asla söylemez.',
        ],
      },
    ],
    story: [
      'Jinling’in dağ tapınağına bebekken bırakıldı. Keşişler ona yürümeden önce okumayı öğretti; çocukluğu kütüphanenin serin taşları arasında, turnaların her yıl aynı gün dönüşünü kayda geçirerek geçti.',
      'Bir kış turnalar dönmedi. Herkes kötü bir alamet dedi; o ise kayıtları baştan okudu ve göç yolundaki bataklığın kurutulduğunu buldu. O günden beri bir soruya cevap aramadan önce soruyu tartar: acele eden akıl, çoğu zaman yanlış kapıyı çalar.',
      'Tapınaktan ilk kez bir cinayet için indi. Kimseyi suçlamaz, kimseyi aklamaz; önce ipleri tek tek tartar, sonra bir kez daha. Onun için düşünmek bir mola değil, yürümenin ta kendisi. “Su durulunca dibi görünür.”',
    ],
  },
};

export const getOutfitStory = (id: string): OutfitStory | undefined => OUTFIT_STORIES[id];
