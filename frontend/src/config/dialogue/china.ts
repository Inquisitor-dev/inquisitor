import type { NpcDialogueConfig } from './types';

export const CHINA_DIALOGUE: Record<string, NpcDialogueConfig> = {
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
  };
