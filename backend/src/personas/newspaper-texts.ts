// Sabah gazetesinin evrene göre metinleri. Gazete her sabah gelir, gece olay olsun olmasın: gelmediği
// sabah "bu gece bir şey olmadı" diye ipucu vermesin. Sıradan haberler vakayla ilgili hiçbir şey söylemez.

export interface NewspaperTexts {
  // Gazetenin adı (ön yüz evrene göre parşömen, gazete kupürü ya da tablet olarak çizer)
  title: string;
  // Oyuncunun kasabadaki unvanı
  investigator: string;
  murder: (victim: string, place: string) => { headline: string; body: string };
  letter: { headline: string; body: string };
  breakIn: (place: string) => { headline: string; body: string };
  // Kasabanın sıradan haberleri
  fillers: { headline: string; body: string }[];
}

const MEDIEVAL: NewspaperTexts = {
  title: 'Ashenmoor Tellal İlanı',
  investigator: 'Engizitör',
  murder: (victim, place) => ({
    headline: 'Köyde kan döküldü',
    body: `${victim} dün gece ${place} civarında ölü bulundu. Köy meydanında dua edildi; Engizitör soruşturmayı üstlendi.`,
  }),
  letter: {
    headline: 'Engizitörün kapısına mektup',
    body: 'Gece Engizitörün kapısının altına imzasız bir mektup bırakılmış. Köy halkı ne yazdığını fısıldaşıyor; kimin bıraktığını bilen yok.',
  },
  breakIn: (place) => ({
    headline: `${place}: gece zorla girildi`,
    body: `Dün gece biri zorla içeri girip ortalığı dağıtmış. Sahibi bugün kapısını kimseye açmayacak.`,
  }),
  fillers: [
    {
      headline: 'Değirmende un sıkıntısı yok',
      body: 'Değirmenci, kış için ambarların dolu olduğunu duyurdu.',
    },
    {
      headline: 'Pazar yerinde tuz pahalandı',
      body: 'Kervan gecikince tuzun okkası iki akçeye çıktı.',
    },
    {
      headline: 'Kilise çanı onarılıyor',
      body: 'Çatlayan çan için köyden bağış toplanıyor.',
    },
    {
      headline: 'Kayıp keçi bulundu',
      body: 'Çiftçinin üç gündür aranan keçisi orman kıyısında otlarken bulundu.',
    },
    {
      headline: 'Yol çamur içinde',
      body: 'Yağmurlar köprü yolunu çamura boğdu; arabalar ağır ilerliyor.',
    },
  ],
};

const MODERN: NewspaperTexts = {
  title: 'Millfield Postası',
  investigator: 'dedektif',
  murder: (victim, place) => ({
    headline: 'Millfield sarsıldı',
    body: `${victim} dün gece ${place} yakınında ölü bulundu. Şerif ofisi, olayı araştırmak üzere kasabaya bir dedektif geldiğini doğruladı.`,
  }),
  letter: {
    headline: 'Dedektife tehdit mektubu',
    body: 'Kasabaya gelen dedektifin kapısının altına gece imzasız bir mektup bırakıldı. Şerif ofisi yorum yapmadı.',
  },
  breakIn: (place) => ({
    headline: `${place}: gece hırsız girdi`,
    body: `Dün gece biri zorla içeri girdi, içerisi dağıtılmış. Sahibi bugün kimseyi almayacağını söyledi.`,
  }),
  fillers: [
    {
      headline: 'Benzin fiyatı yine arttı',
      body: 'Galon fiyatı bu hafta iki sent yükseldi.',
    },
    {
      headline: 'Lise maçı ertelendi',
      body: 'Cuma akşamki maç, sahadaki onarım nedeniyle gelecek haftaya kaldı.',
    },
    {
      headline: 'Kilise kermesi cumartesi',
      body: 'Toplanan para kütüphanenin çatısı için kullanılacak.',
    },
    {
      headline: 'Ana yolda kazı çalışması',
      body: 'Su borusu onarımı nedeniyle Maple Caddesi iki gün tek şeritten geçilecek.',
    },
    {
      headline: 'Kayıp köpek aranıyor',
      body: 'Kahverengi tazı "Buster" en son tren yolu yakınında görüldü.',
    },
  ],
};

const CYBERPUNK: NewspaperTexts = {
  title: 'Neon Prime Akış Bülteni',
  investigator: 'dedektif',
  murder: (victim, place) => ({
    headline: 'Sektörde ceset bulundu',
    body: `${victim} dün gece ${place} bölgesinde ölü bulundu. Bölge güvenliği soruşturmayı bir dedektife devretti.`,
  }),
  letter: {
    headline: 'Dedektife imzasız mesaj',
    body: 'Dedektifin kapsül dairesinin kapısına gece kâğıda yazılmış imzasız bir mesaj bırakıldı. Kaynağı belirlenemedi.',
  },
  breakIn: (place) => ({
    headline: `${place}: güvenlik ihlali`,
    body: `Gece kilit sistemi kırıldı, biri girip her şeyi karıştırdı. Sahibi bugün kimseyi almıyor.`,
  }),
  fillers: [
    {
      headline: 'Asit yağmuru uyarısı',
      body: 'Öğleden sonra açık havada uzun süre kalmamanız öneriliyor.',
    },
    {
      headline: 'Metro hattında arıza',
      body: 'Doğu hattı seferleri bakım nedeniyle yirmi dakika gecikmeli.',
    },
    {
      headline: 'Sentetik pirinç fiyatı düştü',
      body: 'Yeni hasat gelince kilo fiyatı yüzde on geriledi.',
    },
    {
      headline: 'Enerji kesintisi planı',
      body: 'Alt sektörlerde gece yarısından sonra kısa kesintiler olacak.',
    },
    {
      headline: 'Neon festivali hazırlığı',
      body: 'Ana caddedeki tabelalar festival için yenileniyor.',
    },
  ],
};

const CHINA: NewspaperTexts = {
  title: 'Jinling Divan Bildirisi',
  investigator: 'müfettiş',
  murder: (victim, place) => ({
    headline: 'Şehirde bir ölüm',
    body: `${victim} dün gece ${place} civarında ölü bulundu. Vali konağı, soruşturma için bir müfettiş görevlendirdi.`,
  }),
  letter: {
    headline: 'Müfettişe imzasız mektup',
    body: 'Gece müfettişin kapısının altına mühürsüz bir mektup bırakılmış. Kimin bıraktığını gören yok.',
  },
  breakIn: (place) => ({
    headline: `${place}: gece zorla girildi`,
    body: `Dün gece biri zorla girip eşyaları karıştırmış. Sahibi bugün kimseyi kabul etmeyecek.`,
  }),
  fillers: [
    {
      headline: 'Çay kervanı geldi',
      body: 'Güneyden gelen kervan yeni hasat yeşil çay getirdi.',
    },
    {
      headline: 'Nehirde balık bol',
      body: 'Balıkçılar bu hafta ağların dolu çıktığını söylüyor.',
    },
    {
      headline: 'Tapınakta tören hazırlığı',
      body: 'Ay festivali için fenerler asılmaya başlandı.',
    },
    {
      headline: 'Pirinç fiyatı sabit',
      body: 'Divan, ambarlardaki pirinç fiyatının değişmeyeceğini bildirdi.',
    },
    {
      headline: 'Köprü onarımı',
      body: 'Doğu köprüsünün tahtaları yenileniyor; arabalar batı köprüsünü kullanmalı.',
    },
  ],
};

const WINTER: NewspaperTexts = {
  title: 'Frosthold Duyuru Tahtası',
  investigator: 'müfettiş',
  murder: (victim, place) => ({
    headline: 'Karda kan',
    body: `${victim} dün gece ${place} yakınında ölü bulundu. Muhafız karakolu soruşturmayı bir müfettişe verdi.`,
  }),
  letter: {
    headline: 'Müfettişe tehdit mektubu',
    body: 'Gece müfettişin kapısının altına imzasız bir mektup bırakılmış. Kardaki izler çabucak örtülmüş.',
  },
  breakIn: (place) => ({
    headline: `${place}: gece zorla girildi`,
    body: `Fırtınalı gecede biri zorla girip ortalığı dağıtmış. Sahibi bugün kimseyi kabul etmeyecek.`,
  }),
  fillers: [
    {
      headline: 'Geçit karla kapandı',
      body: 'Kuzey geçidi en az iki gün kapalı kalacak.',
    },
    {
      headline: 'Odun fiyatı arttı',
      body: 'Soğuk uzayınca bir kucak odun üç bakıra çıktı.',
    },
    {
      headline: 'Kurt sürüsü görüldü',
      body: 'Avcılar geceleri kasabanın dışına çıkmamayı öğütlüyor.',
    },
    {
      headline: 'Buz balıkçılığı başladı',
      body: 'Göl yeterince donduğu için ilk delikler açıldı.',
    },
    {
      headline: 'Kürk pazarı cumaya',
      body: 'Tüccarlar bu yıl tilki kürkünün bol olduğunu söylüyor.',
    },
  ],
};

export const NEWSPAPER_TEXTS: Record<string, NewspaperTexts> = {
  medieval: MEDIEVAL,
  modern: MODERN,
  cyberpunk: CYBERPUNK,
  china: CHINA,
  winter: WINTER,
};

export const newspaperTextsFor = (scenarioType: string): NewspaperTexts =>
  NEWSPAPER_TEXTS[scenarioType] ?? MEDIEVAL;
