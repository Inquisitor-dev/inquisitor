export interface NpcDialogueConfig {
  name: string;
  title: string;
  portraitImage?: string;
  greeting?: string;
  suggestedQuestions?: string[];
}

export const DIALOGUE_CONFIG: Record<string, Record<string, NpcDialogueConfig>> = {
  china: {
    tavern: {
      name: 'Lin Feng',
      title: 'Çay Ustası — Altın Lotus Çay Evi',
      portraitImage: '/dialogue/china/lin_feng.webp',
      greeting:
        '*Lin Feng önündeki porselen fincana demlikten kehribar rengi çay dolduruyor. Başını kaldırıp hafifçe tebessüm ediyor.*\n\n"Altın Lotus\'a hoş geldiniz, saygıdeğer Engizitör. Çayın demi sabır ister, tıpkı hakikat gibi... Ne öğrenmek arzusundasınız?"',
      suggestedQuestions: [
        'Pazar meydanındaki cinayet hakkında ne duydun?',
        'Dün gece çay evine şüpheli kimler girdi çıktı?',
        'Bana bu kasabanın fısıltılarından ve dedikodularından bahset.',
      ],
    },
    church: {
      name: 'Komutan Zhao',
      title: 'Garnizon Komutanı — İmparatorluk Karargahı',
      portraitImage: '/dialogue/china/zhao.webp',
      greeting:
        '*Komutan Zhao ellerini harita masasına dayayarak keskin ve otoriter bakışlarını sana çeviriyor.*\n\n"Garnizonuma hoş geldin, Engizitör. İmparatorluk topraklarında düzen ve nizam esastır. Soruşturmanın ordunun onurunu lekelemesine müsaade etmem. Ne öğrenmek istiyorsun?"',
      suggestedQuestions: [
        'Cinayet gecesi muhafız devriyeleri neredeydi?',
        'Olay yeri hakkında resmi bir askeri rapor var mı?',
        'Şüphelendiğiniz yabancılar ya da isyancılar var mı?',
      ],
    },
    graveyard: {
      name: 'Keşiş Huikang',
      title: 'Kadim Tapınak Bilgesi — Atalar Dağ Tapınağı',
      portraitImage: '/dialogue/china/huikang.webp',
      greeting:
        '*Tütsü kazanından yükselen mavi dumanların arasından tespih taneleri tıkırdıyor. Keşiş Huikang gözlerini ağır ağır açıyor.*\n\n"Huzur arayan da, kan arayan da bu eşikten geçer... Rüzgâr ölümün kokusunu dağın zirvesine dek taşıdı. Söyle bakalım yabancı, kalbindeki hangi ağırlık seni ataların huzuruna getirdi?"',
      suggestedQuestions: [
        'Ruhlar ve kadim tabletler bu ölüm hakkında ne fısıldıyor?',
        'Son günlerde tapınağa sığınan ya da af dileyen oldu mu?',
        'Kurbanın geçmişine dair bildiğin sırlar var mı?',
      ],
    },
    mill: {
      name: 'Usta Guan',
      title: 'Demirci Ustası — Ejder Ocağı Atölyesi',
      portraitImage: '/dialogue/china/guan.webp',
      greeting:
        '*Usta Guan elindeki ağır çekici örsün üzerine bırakıp alnındaki teri siliyor. Kor ateşin ışığı çatık kaşlarını aydınlatıyor.*\n\n"Ocağımda iş var, laf kalabalığına vaktim yok! Buradaki her çeliği ben büktüm, her bıçağın fısıltısını bilirim. Eğer bir cinayet hançeri arıyorsan, doğru konuş da sabrımı taşırma."',
      suggestedQuestions: [
        'Cinayette kullanılan silah senin ocağından mı çıktı?',
        'Son günlerde alışılmadık bir bıçak siparişi aldın mı?',
        'Dün gece ocak civarında şüpheli birini gördün mü?',
      ],
    },
    farm: {
      name: 'Mei Teyze',
      title: 'Balıkçı ve İskele Gözcüsü — Nehir İskelesi',
      portraitImage: '/dialogue/china/mei.png',
      suggestedQuestions: [
        'Nehir boyunca kaçan ya da tekneye binen birini gördün mü?',
        'Dün gece iskelede olağandışı ne oldu?',
        'Ağlarına takılan veya suda bulduğun şüpheli bir şey var mı?',
      ],
    },
    clinic: {
      name: 'Bilgin Song',
      title: 'Saray Eczacısı ve Hekim — Song Eczanesi Köşkü',
      portraitImage: '/dialogue/china/song.webp',
      greeting:
        '*Bilgin Song havanındaki şifalı otları ezmeyi bırakıp parşömenlerin arasından sana bakıyor. İnce bir tebessümle başını eğiyor.*\n\n"Zehir ile panzehir arasındaki tek fark ölçüdür, tıpkı şüphe ile hakikat arasındaki fark gibi. Bedenlerin dili asla yalan söylemez. Hangi gizemin teşhisini arıyorsunuz?"',
      suggestedQuestions: [
        'Kurbanın bedenindeki yaralar veya zehir hakkında ne söyleyebilirsin?',
        'Son zamanlarda tehlikeli bir zehir veya tentür isteyen oldu mu?',
        'Meydandaki ceset üzerinde ne tür incelemeler yaptın?',
      ],
    },
  },
  medieval: {
    tavern: {
      name: 'Kardeş Aldric',
      title: 'Hancı — Sırların Bekçisi',
      portraitImage: '/dialogue/medieval/aldric.png',
      suggestedQuestions: [
        'Cinayet gecesi handa kimler vardı?',
        'Kurban en son kiminle tartışırken görüldü?',
        'Köyde dolaşan son dedikodular neler?',
      ],
    },
    church: {
      name: 'Peder Malachar',
      title: 'Rahip — İki Efendinin Hizmetkârı',
      portraitImage: '/dialogue/medieval/malachar.png',
      suggestedQuestions: [
        'Kurban günah çıkarmaya gelmiş miydi?',
        'Tanrı huzurunda saklanan bir sır var mı?',
        'Geceleri kilisede olduğunuz doğru mu?',
      ],
    },
    graveyard: {
      name: 'İhtiyar Silas',
      title: 'Mezarcı — Gerçeği Gömüp Saklayan',
      portraitImage: '/dialogue/medieval/silas.png',
      suggestedQuestions: [
        'Mezarlıkta gece vakti kimleri görüyorsun?',
        'Taze kazılmış mezarlar hakkında ne biliyorsun?',
        'Cinayet saatinde neredeydin?',
      ],
    },
    mill: {
      name: 'Değirmenci Giles',
      title: 'Değirmenci — Rüzgârın Sırdaşı',
      portraitImage: '/dialogue/medieval/giles.png',
      suggestedQuestions: [
        'Değirmene gece un getiren veya saklanan oldu mu?',
        'Cinayet aletine benzeyen bir eşya gördün mü?',
      ],
    },
    farm: {
      name: 'Çiftçi Edmund',
      title: 'Çiftçi — Toprağın ve Karanlığın Tanığı',
      portraitImage: '/dialogue/medieval/edmund.png',
      suggestedQuestions: [
        'Tarlalarda yabancı ayak izleri gördün mü?',
        'Gece çiftliğin yakınından geçen oldu mu?',
      ],
    },
    clinic: {
      name: 'Doktor Harland',
      title: 'Hekim — Soğuk Ellerin ve Gözlerin Sahibi',
      portraitImage: '/dialogue/medieval/harland.png',
      suggestedQuestions: [
        'Kurbanın ölüm nedeni hakkında otopsi bulgun ne?',
        'Bu yara hangi tür aletle açılmış olabilir?',
      ],
    },
  },
  cyberpunk: {
    tavern: {
      name: 'Officer Kael Voss',
      title: 'Memur — Neon Prime Karakolu',
      portraitImage: '/dialogue/cyberpunk/kael.png',
      suggestedQuestions: [
        'Vakayla ilgili polis veri tabanında ne var?',
        'Bölgedeki çeteler bu cinayet hakkında ne diyor?',
        'Güvenlik kameraları neden devre dışı kalmış?',
      ],
    },
    church: {
      name: 'Mirel Sato',
      title: 'Lokanta Sahibi — Static Spoon',
      portraitImage: '/dialogue/cyberpunk/mirel.png',
      suggestedQuestions: [
        'O gece tezgahına oturan şüpheli tipler kimlerdi?',
        'Kurban son yemeğini burada mı yedi?',
      ],
    },
    graveyard: {
      name: 'Brakk Coil',
      title: 'Siber Cerrah — Neon Prime Kliniği',
      portraitImage: '/dialogue/cyberpunk/brakk.png',
      suggestedQuestions: [
        'Kurbanın siber implantları sökülmüş mü?',
        'Son 24 saatte yara diktirmeye gelen oldu mu?',
      ],
    },
  },
  winter: {
    tavern: {
      name: 'Torstein',
      title: 'Hancı — Ocak Ateşi Hanı',
      portraitImage: '/dialogue/winter/torstein.png',
      suggestedQuestions: [
        'Fırtınada handa kimler mahsur kalmıştı?',
        'Kurban dışarı çıkmadan önce kiminle konuştu?',
      ],
    },
    church: {
      name: 'Kahin Valda',
      title: 'Yürek Ağacı Bekçisi',
      portraitImage: '/dialogue/winter/valda.png',
      suggestedQuestions: [
        'Yürek Ağacı bu ölüm hakkında ne işaret veriyor?',
        'Karda kime ait ayak izleri vardı?',
      ],
    },
  },
};

/**
 * Verilen senaryo ve NPC için en uygun portre görselini döndürür.
 * 1. Özel tanımlı portraitImage (varsa)
 * 2. Varsayılan klasör yolları: /dialogue/[scenario]/[npcKey].png
 * 3. İç mekân görseli veya klasik arka plan (fallback)
 */
export function getNpcDialoguePortrait(scenarioType: string = 'medieval', npcKey: string): string {
  const normScenario = scenarioType || 'medieval';
  const cfg = DIALOGUE_CONFIG[normScenario]?.[npcKey];

  // Özel olarak Lin Feng tanımlı
  if (normScenario === 'china' && npcKey === 'tavern') {
    return '/dialogue/china/lin_feng.webp';
  }

  if (cfg?.portraitImage) {
    return cfg.portraitImage;
  }

  // Varsayılan iç mekan veya arka plan fallback'leri
  if (normScenario === 'china') {
    const chinaFallbacks: Record<string, string> = {
      tavern: '/dialogue/china/lin_feng.webp',
      church: '/dialogue/china/zhao.webp',
      graveyard: '/dialogue/china/huikang.webp',
      mill: '/dialogue/china/guan.webp',
      clinic: '/dialogue/china/song.webp',
      farm: '/backgrounds/interior_china_farm.webp',
      crime_scene: '/backgrounds/bg_crime_scene.webp',
    };
    return chinaFallbacks[npcKey] || `/dialogue/china/${npcKey}.webp`;
  }

  if (normScenario === 'cyberpunk') {
    const cpFallbacks: Record<string, string> = {
      tavern: '/backgrounds/interior_cyberpunk_tavern.webp',
      church: '/backgrounds/interior_cyberpunk_church.webp',
      graveyard: '/backgrounds/interior_cyberpunk_graveyard.webp',
      mill: '/backgrounds/interior_cyberpunk_mill.webp',
      farm: '/backgrounds/interior_cyberpunk_farm.webp',
      clinic: '/backgrounds/interior_cyberpunk_clinic.webp',
    };
    return cpFallbacks[npcKey] || `/dialogue/cyberpunk/${npcKey}.png`;
  }

  // Medieval / fallback
  const medFallbacks: Record<string, string> = {
    tavern: '/backgrounds/bg_tavern.webp',
    church: '/backgrounds/bg_church.webp',
    graveyard: '/backgrounds/bg_graveyard.webp',
    mill: '/backgrounds/bg_mill.webp',
    farm: '/backgrounds/interior_mill_panorama.webp',
    clinic: '/backgrounds/bg_church.webp',
    crime_scene: '/backgrounds/bg_crime_scene.webp',
  };
  return medFallbacks[npcKey] || `/backgrounds/bg_${npcKey}.webp`;
}

export function getNpcDialogueSuggestedQuestions(scenarioType: string = 'medieval', npcKey: string): string[] {
  const normScenario = scenarioType || 'medieval';
  const cfg = DIALOGUE_CONFIG[normScenario]?.[npcKey];
  if (cfg?.suggestedQuestions && cfg.suggestedQuestions.length > 0) {
    return cfg.suggestedQuestions;
  }
  return [
    'Cinayet hakkında ne biliyorsun?',
    'Cinayet saatinde neredeydin?',
    'Şüphelendiğin biri veya dikkat çeken bir olay var mı?',
  ];
}

export function getNpcDialogueGreeting(scenarioType: string = 'medieval', npcKey: string): string | null {
  const normScenario = scenarioType || 'medieval';
  return DIALOGUE_CONFIG[normScenario]?.[npcKey]?.greeting || null;
}
