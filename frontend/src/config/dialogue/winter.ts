import type { NpcDialogueConfig } from './types';

export const WINTER_DIALOGUE: Record<string, NpcDialogueConfig> = {
    tavern: {
      name: 'Torstein',
      title: 'Hancı — Ocak Ateşi Hanı',
      portraitImage: '/dialogue/winter/tavern.png',
      greeting:
        '*Torstein elindeki tahta maşrapaya ocakta kaynayan baharatlı biradan dolduruyor. Örgülü sakalının altından dumanlar tüten ocağa ve sonra sana bakıyor.*\n\n"Ocak Ateşi Hanı\'na hoş geldin, Engizitör. Dışarıdaki tipi dağ geçidini kapattığından beri kimse bu vadiden çıkamadı. Bir maşraba sıcak bira al da donmuş kemiklerin ısınsın. Ne sormaya geldin?"',
      suggestedQuestions: [
        'Fırtına bastırmadan önce hana kimler sığındı?',
        'Kurban son görüldüğünde handa kiminle oturuyordu?',
        'Gece yarısı handan gizlice çıkan birini fark ettin mi?',
      ],
    },
    church: {
      name: 'Kahin Valda',
      title: 'Kutsal Yürek Ağacı Bekçisi & Kahin',
      portraitImage: '/dialogue/winter/church.png',
      greeting:
        '*Kemik beyazı gövdesine rünler oyulmuş Yürek Ağacı\'nın köklerinde kemik tılsımlar tıkırdıyor. Kukuletalı yaşlı kadın gözlerini ağır ağır sana çeviriyor.*\n\n"Kan karın üzerine damladığında, kadim tanrılar sessiz kalmaz... Rüzgâr ölümün soğuk nefesini dağlardan getirdi. Söyle bakalım yabancı, kalbindeki buz hangi hakikati arıyor?"',
      suggestedQuestions: [
        'Yürek Ağacı ve kadim rünler bu ölüm hakkında ne fısıldıyor?',
        'Kutsal korulukta veya donmuş gölet çevresinde kime ait ayak izleri vardı?',
        'Kurban buraya adak adamaya veya günah çıkarmaya gelmiş miydi?',
      ],
    },
    graveyard: {
      name: 'Komutan Bjorn',
      title: 'Kale Muhafızı & Kastellan — Gözcü Kalesi',
      portraitImage: '/dialogue/winter/graveyard.png',
      greeting:
        '*Zincir zırhının üzerine attığı kalın kurt postunu düzeltip elini savaş masasının kenarına dayıyor. Yüzündeki eski savaş yarası meşale ışığında geriliyor.*\n\n"Gözcü Kalesi\'nde laf kalabalığına yer yok, Engizitör. Fırtına bizi dış dünyadan kesti, askerlerimin morali pamuk ipliğine bağlı. Kaleme sızan bir hain ya da katil varsa onu bul; ama ordumun nizamını bozma. Raporun ne?"',
      suggestedQuestions: [
        'Cinayet gecesi nöbet çizelgesinde olağandışı bir durum var mıydı?',
        'Kaledeki silah raflarından kaybolan balta veya mızrak oldu mu?',
        'Garnizonda kurbana kin besleyen veya tehdit eden askerler var mı?',
      ],
    },
    mill: {
      name: 'Madenci Durn',
      title: 'Ustabaşı — Terk Edilmiş Demir Madeni',
      portraitImage: '/dialogue/winter/mill.png',
      greeting:
        '*Durn elindeki feneri kaldırıp buz sarkıtlarıyla kaplı karanlık tünelden dışarı adım atıyor. Omzundaki paslı kazmayı yere vurup çatık kaşlarla sana bakıyor.*\n\n"Maden terk edildi dedilerse sana ne diye buraya burnunu sokuyorsun? Bu tüneller yabancıları sevmez, bir adım yanlış atarsan derin bir kuyuya yuvarlanırsın. Neyin peşindesin?"',
      suggestedQuestions: [
        'Maden tünellerinde kaleden veya geçitten gizlice geçen birini gördün mü?',
        'Terk edilmiş tünellerde saklanan kaçak eşyalar veya aletler var mı?',
        'Cinayet aletine benzeyen demir bir maden kazması veya çekici kayıp mı?',
      ],
    },
    farm: {
      name: 'Einar',
      title: 'Sur Nöbetçisi & Okçu — Frosthold Sur Kapısı',
      portraitImage: '/dialogue/winter/farm.png',
      greeting:
        '*Dondurucu fırtınanın savurduğu kar taneleri pelerininin üzerine yığılmış. Parmakları yayının kirişinde, gözlerini donmuş geçitten ayırmadan konuşuyor.*\n\n"Sur kapısında durmak donmak demektir yabancı... Ama gözümü bir an bile kırpmam. Bu surdan izinsiz ne bir kuş uçar ne bir adam geçer. Geçitte gördüklerimi mi soracaksın?"',
      suggestedQuestions: [
        'Cinayet saatinde donmuş geçitte veya sur dibinde hareketlilik oldu mu?',
        'Gece vakti sur kapısının açıldığını veya zincirinin oynatıldığını gördün mü?',
        'Ok sadaklarındaki eksik oklar hakkında ne biliyorsun?',
      ],
    },
    clinic: {
      name: 'Muhafız Kenneth',
      title: 'Yargı & İnfaz Meydanı Çavuşu',
      portraitImage: '/dialogue/winter/clinic.png',
      greeting:
        '*Darağaçlarının ve demir kafeslerin gölgesindeki yargı kürsüsünde kalın deri defteri kapatıyor. Soğuk, çelik grisi gözlerini sana dikiyor.*\n\n"Adalet bu vadide kar kadar soğuk, darağacının ipi kadar kesindir Engizitör. Bu garnizonu isyandan ve kaostan koruyan tek şey korkudur. Suçluyu bulduğunda bana getir, cezasını bizzat infaz edeyim. Kimi itham ediyorsun?"',
      suggestedQuestions: [
        'Yargı defterinden koparılan sayfada kimin davası yazılıydı?',
        'Cinayet mahallinde bulunan izler infaz meydanındaki mahkumlardan birine mi ait?',
        'Son günlerde idamdan veya kırbaçtan kurtulmak için kaçan biri oldu mu?',
      ],
    },
  };
