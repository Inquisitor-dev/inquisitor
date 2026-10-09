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
      portraitImage: '/dialogue/china/lin_feng.png',
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
      portraitImage: '/dialogue/china/zhao.png',
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
      portraitImage: '/dialogue/china/huikang.png',
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
      portraitImage: '/dialogue/china/guan.png',
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
      portraitImage: '/dialogue/china/song.png',
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
      portraitImage: '/dialogue/medieval/tavern.png',
      greeting:
        '*Aldric elindeki ahşap kupayı tezgahın kenarına sertçe bırakıp sana şüpheyle bakıyor.*\n\n"Tavernama hoş geldin, Engizitör. Bu topraklara senin gibi biri adım attıysa kan dökülmüş demektir. Kupa dolusu bira mı istersin, yoksa dökülen kanın hesabını sormaya mı geldin?"',
      suggestedQuestions: [
        'Cinayet gecesi handa kimler vardı?',
        'Kurban en son kiminle tartışırken görüldü?',
        'Köyde dolaşan son dedikodular neler?',
      ],
    },
    church: {
      name: 'Peder Malachar',
      title: 'Rahip — İki Efendinin Hizmetkârı',
      portraitImage: '/dialogue/medieval/church.png',
      greeting:
        '*Peder Malachar sunağın önündeki tütsü buhurdanını sallayarak ağır adımlarla sana dönüyor. Boynundaki gümüş haç loş mum ışığında parıldıyor.*\n\n"Tanrı\'nın selamı üzerine olsun, Muhterem Engizitör. Bu kutsal çatı altında günahlar itiraf edilir, sırlar ise sonsuza dek gömülür. Kiliseme hangi karanlık şüpheyi aydınlatmak için geldin?"',
      suggestedQuestions: [
        'Kurban günah çıkarmaya gelmiş miydi?',
        'Tanrı huzurunda saklanan bir sır var mı?',
        'Geceleri kilisede olduğunuz doğru mu?',
      ],
    },
    graveyard: {
      name: 'İhtiyar Silas',
      title: 'Mezarcı — Gerçeği Gömüp Saklayan',
      portraitImage: '/dialogue/medieval/graveyard.png',
      greeting:
        '*Paslı küreğini taze kazılmış çamurlu toprağa saplayıp kamburunu doğrultuyor. Çukur gözlerini sana dikip hırıltılı bir sesle kıkırdıyor.*\n\n"Hehehe... Yeni bir müşteri mi, yoksa toprağın altındakileri rahatsız etmeye gelen bir sorgucu mu? Bu mezarlık çok ceset gördü yabancı, ama hepsi sırlarıyla birlikte çürüdü. Kimi arıyorsun?"',
      suggestedQuestions: [
        'Mezarlıkta gece vakti kimleri görüyorsun?',
        'Taze kazılmış mezarlar hakkında ne biliyorsun?',
        'Cinayet saatinde neredeydin?',
      ],
    },
    mill: {
      name: 'Değirmenci Giles',
      title: 'Değirmenci — Rüzgârın Sırdaşı',
      portraitImage: '/dialogue/medieval/mill.png',
      greeting:
        '*Unla kaplı kollarını göğsünde kavuşturup arkasında dönen dev tahta dişlilere aldırmadan sana doğru bir adım atıyor.*\n\n"Değirmenimde iş başımdan aşkın Engizitör! Burada tahıl öğütülür, dedikodu değil. Eğer cinayetle ilgili bana parmak sallamaya geldiysen boşuna yorulma, dün gece çuvalların başından ayrılmadım!"',
      suggestedQuestions: [
        'Değirmene gece un getiren veya saklanan oldu mu?',
        'Cinayet aletine benzeyen bir eşya gördün mü?',
      ],
    },
    farm: {
      name: 'Çiftçi Edmund',
      title: 'Çiftçi — Toprağın ve Karanlığın Tanığı',
      portraitImage: '/dialogue/medieval/farm.png',
      greeting:
        '*Tırpanını saman balyalarının yanına bırakıp nasırlı elleriyle alnındaki teri siliyor. Çatık kaşlarıyla seni baştan aşağı süzüyor.*\n\n"Köyün belası çiftliğime kadar uzandı demek... Engizisyon buraya adalet getirmeye değil, kelle almaya gelir bilirim. Toprağımda yabancı ayak izi istemem. Çabuk söyle, ne soracaksan sor!"',
      suggestedQuestions: [
        'Tarlalarda yabancı ayak izleri gördün mü?',
        'Gece çiftliğin yakınından geçen oldu mu?',
      ],
    },
    clinic: {
      name: 'Doktor Harland',
      title: 'Hekim — Soğuk Ellerin ve Gözlerin Sahibi',
      portraitImage: '/dialogue/medieval/clinic.png',
      greeting:
        '*Kanlı neşterini pirinç bir kaba bırakıp deri önlüğünü düzeltiyor. Yüzündeki ifadesiz, cerrahi soğuklukla gözlerini sana çeviriyor.*\n\n"Engizitör... Hurafeler ve dedikodular can alır ama sadece cesetler yalan söylemez. Masamdaki beden bana çok şey anlattı. Bilimsel bir teşhis mi istiyorsun, yoksa bir şüpheli ismi mi?"',
      suggestedQuestions: [
        'Kurbanın ölüm nedeni hakkında otopsi bulgun ne?',
        'Bu yara hangi tür aletle açılmış olabilir?',
      ],
    },
  },
  cyberpunk: {
    tavern: {
      name: 'Officer Kael Voss',
      title: 'Nöbetçi Masası Memuru — Neon Prime Karakolu',
      portraitImage: '/dialogue/cyberpunk/tavern.png',
      greeting:
        '*Kael Voss, gözündeki implantın soluk mavi ışığında holografik ekranındaki dosyaları kaydırıyor. Ağır bir iç çekip sigara dumanını üfler gibi nefesini veriyor.*\n\n"Neon Prime karakoluna hoş geldin, dedektif. Masam zaten sahte kimlikler, sokak çatışmaları ve kapanmamış cinayet dosyalarıyla dolu. Buraya fazladan sorun getireceksen önce prosedüre uygun bir arama iznin olsun. Ne istiyorsun?"',
      suggestedQuestions: [
        'Vakayla ilgili polis veri tabanında ne tür kayıtlar var?',
        'Olay yerindeki güvenlik kameraları neden devre dışı bırakılmış?',
        'Bölgedeki çeteler veya mega-şirketler bu cinayet hakkında ne fısıldıyor?',
      ],
    },
    church: {
      name: 'Mirel Sato',
      title: 'Lokanta Sahibi & Şef — Static Spoon',
      portraitImage: '/dialogue/cyberpunk/church.png',
      greeting:
        '*Tezgâhtan yükselen buharın arasında metal önkolu parlıyor. Kepçeyi kaynayan erişte kazanına daldırırken gözlerini kapıdan ayırmıyor.*\n\n"Static Spoon\'da gece hiç bitmez... Kuryeler, polisler, aranan hayaletler; hepsi er ya da geç bu tezgâha oturur. Karnını doyuracaksan bir kâse al, yok soru soracaksan hızlı ol, erişteler soğuyor."',
      suggestedQuestions: [
        'Cinayet gecesi tezgâhına oturan şüpheli tipler kimlerdi?',
        'Kurban son yemeğini burada mı yedi, yanında kim vardı?',
        'Arka sokaklarda veya mutfak kapısının önünde olağandışı bir şey duydun mu?',
      ],
    },
    graveyard: {
      name: 'Brakk Coil',
      title: 'Yeraltı Siber Cerrahı — Neon Prime Kliniği',
      portraitImage: '/dialogue/cyberpunk/graveyard.png',
      greeting:
        '*Brakk Coil, başını önündeki ameliyat masasından kaldırmadan elindeki mekanik lehim aletini kenara bırakıyor. Soluk neon ışıkların altında gözlerini kısıyor.*\n\n"Faturasız iş, sorusuz hasta... Kural bu. Buraya kanayan bir siber uzuv diktirmeye gelmediysen vaktimi harcıyorsun dedektif. Her bilginin de her dikişin de bir bedeli vardır. Ne arıyorsun?"',
      suggestedQuestions: [
        'Kurbanın siber implantları veya protezleri üzerinde ne tür izler var?',
        'Son 24 saatte kliniğe kurşun veya kimyasal yanıkla gelen oldu mu?',
        'Yeraltı pazarında son zamanlarda hangi çalıntı siber donanımlar dolaşıyor?',
      ],
    },
    mill: {
      name: 'AURA-9',
      title: 'Otonom Teknisyen Android — AURA Atölyesi',
      portraitImage: '/dialogue/cyberpunk/mill.png',
      greeting:
        '*AURA-9\'un yüzeyindeki krom kaplama neon ışığı yansıtıyor. Mavi optik sensörleri odaklanıp hafif bir mekanik vınlamayla seni baştan aşağı tarıyor.*\n\n"AURA Siber Bakım ve Onarım Ünitesine hoş geldiniz. Biyolojik ve sibernetik teşhis için hizmetinizdeyim. Ancak kayıtlarım, son zamanlarda atölye çevresindeki yetkisiz veri trafiğinde bir anormallik tespit etti... Bilgi sorgusu mu talep ediyorsunuz?"',
      suggestedQuestions: [
        'Olay yerinde bulunan yanık kablo ve devre parçaları senin atölyenden mi çıktı?',
        'Son günlerde şüpheli bir robot veya sibernetik modifikasyon tamiri yaptın mı?',
        'Sokaktaki veri akışında ve güvenlik protokollerinde bir sızıntı yakaladın mı?',
      ],
    },
    farm: {
      name: 'Ash',
      title: 'Sokak Satıcısı ve Muhbir — Gece Pazarı',
      portraitImage: '/dialogue/cyberpunk/farm.png',
      greeting:
        '*Kapüşonunu biraz daha öne çekip tezgâhın altındaki hurda parçaları parmaklarının arasında çeviriyor. Kalabalığı kollayarak fısıltıyla konuşuyor.*\n\n"Şişt... Çok dikkat çekme. Bu pazarda herkes bir şey satar; kimi çalıntı çip, kimi sokak yemeği, kimi de doğru adamın adını. Sokakların gözü kulağı çoktur dedektif. Ne duymak istiyorsun?"',
      suggestedQuestions: [
        'Gece pazarında cinayet saatinde telaşla kaçan birini gördün mü?',
        'Sokakta son günlerde dolaşan kaçak çipler ve mallar hakkında ne biliyorsun?',
        'Cinayet mahallinin etrafında kimlerin dolaştığını duydun?',
      ],
    },
    clinic: {
      name: 'Vera Nyx',
      title: 'Barmen — Velvet Static Bar',
      portraitImage: '/dialogue/cyberpunk/clinic.png',
      greeting:
        '*Çene hattındaki zarif implant mor neon ışığında parıldıyor. Elindeki bardağı ağır ağır parlatırken sana doğru hafifçe eğilip gizemli bir tebessümle bakıyor.*\n\n"Velvet Static\'e herkes kaybolmak için gelir dedektif... Kimi bir içkide unutur, kimi bas seslerin ardına saklanır. İnsanlar sarhoşken çok şey anlatır ama ben sadece değerini bilene fısıldarım. Ne içersin, ya da ne öğrenmek istersin?"',
      suggestedQuestions: [
        'Cinayet gecesi barda olağandışı bir tartışma veya kavga çıktı mı?',
        'Kurban buraya sık gelir miydi, kimlerle buluşurdu?',
        'Arka odadaki özel görüşmelerde şüpheli bir anlaşmaya tanık oldun mu?',
      ],
    },
  },
  winter: {
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
  },
  modern: {
    tavern: {
      name: 'Şerif Dale Cooper',
      title: 'Polis Amiri — Karakolun Tek Kanunu',
      portraitImage: '/dialogue/modern/tavern.png',
      greeting:
        '*Elindeki fincandan buhar tüten filtre kahvesini yudumlayıp sakin ve dikkatli gözlerle seni süzüyor.*\n\n"Millfield huzurlu bir kasabadır dedektif. En azından bu sabaha kadar öyleydi... Masamdaki dosyalar kasabanın adını lekelememeli. Soruşturmanda yardımcı olurum ama Millfield\'in itibarını korumak benim görevim. Ne öğrenmek istiyorsun?"',
      suggestedQuestions: [
        'Olay yeri inceleme tutanağında kurbana dair ne yazıyor?',
        'Cinayet gecesi devriye gezen memurlar olağandışı bir şey fark etti mi?',
        'Kasabada kurbanla husumeti olan veya şüphelendiğin biri var mı?',
      ],
    },
    church: {
      name: 'Gerald',
      title: 'Otel İşletmecisi — Millfield Oteli',
      portraitImage: '/dialogue/modern/church.png',
      greeting:
        '*Yeleğindeki köstekli saate göz atıp ardından tezgâhtaki pirinç resepsiyon ziline parmağıyla hafifçe dokunuyor.*\n\n"Millfield Oteli\'ne hoş geldiniz efendim. Konuklarımızın mahremiyeti ve otelimizin huzuru bizim için her şeyden üstündür. Ancak kasabadaki o elim hadise herkesin dilinde... Size nasıl yardımcı olabilirim?"',
      suggestedQuestions: [
        'Cinayet gecesi otelde kimler konaklıyordu, şüpheli bir giriş oldu mu?',
        'Kurban son günlerde otel lobisinde veya odasında kiminle görüştü?',
        'Arka yangın merdivenlerini ya da servis kapısını kullanan biri oldu mu?',
      ],
    },
    graveyard: {
      name: 'Randy Kowalski',
      title: 'Video Oyuncusu — Pixel Arcade Salonu',
      portraitImage: '/dialogue/modern/graveyard.png',
      greeting:
        '*Atari kabinine yaslanıp elindeki jetonu havaya fırlatıp tutuyor, ağzındaki sakızı patlatarak sırıtıyor.*\n\n"Hey dedektif! Yüksek skoru kırmaya mı geldin yoksa o meşhur cinayetin dedikodusunu sormaya mı? Gençlerin ve gece kuşlarının hepsi bu salondan geçer. İnan bana, bu kasabada gözümden hiçbir şey kaçmaz!"',
      suggestedQuestions: [
        'Cinayet saatinde atari salonunda kimler vardı, tartışan oldu mu?',
        'Kurbanı veya cinayet gecesi telaşla dolaşan birini gördün mü?',
        'Kasabanın gençleri arka sokaklarda ne fısıldaşıyor?',
      ],
    },
    mill: {
      name: 'Donna Perkins',
      title: 'Lokantacı — The Maple Cafe & Diner',
      portraitImage: '/dialogue/modern/mill.png',
      greeting:
        '*Elindeki cam demlikle fincana sıcak kahve doldururken gözleri tedirginlikle kapıya kayıyor.*\n\n"Maple Diner\'a hoş geldiniz... Kusura bakmayın, biraz telaşlıyım. Sabahki cinayet haberi hepimizin kanını dondurdu. Sıcak bir vişneli turta alır mıydınız, yoksa soru sormaya mı geldiniz?"',
      suggestedQuestions: [
        'Kurban cinayetten önce lokantaya uğradı mı, kiminle oturdu?',
        'O gece localarda fısıldaşan veya telaşla hesabı ödeyip çıkan biri var mıydı?',
        'Koridordaki ankesörlü telefondan geç saatte kim arama yaptı?',
      ],
    },
    farm: {
      name: 'Earl Hutchins',
      title: 'Pompacı — Petrol İstasyonunun Bekçisi',
      portraitImage: '/dialogue/modern/farm.png',
      greeting:
        '*Yağlı iş tulumuna ellerini silip benzin pompasının yanından ağır adımlarla sana doğru geliyor.*\n\n"Kasabaya giren de çıkan da bu yoldan geçer yabancı. Kim kaç galon yakıt aldı, hangi arabanın tamponunda çamur vardı hepsini aklıma yazarım. Neyi bilmek istiyorsun?"',
      suggestedQuestions: [
        'Cinayet gecesi istasyona uğrayan yabancı plakalı bir araç var mıydı?',
        'Yol kenarındaki telefon kulübesini gece yarısı kullanan oldu mu?',
        'Kasabadan hızla ayrılan şüpheli bir kamyonet veya araba gördün mü?',
      ],
    },
    clinic: {
      name: 'David',
      title: "Barmen — David's Bar",
      portraitImage: '/dialogue/modern/clinic.png',
      greeting:
        '*Tezgâhın üzerindeki viski bardağını temiz bir bezle parlatırken alçak bir sesle mırıldanıyor.*\n\n"David\'s Bar\'da kural basittir: İçeceğini iç, hesabını öde ve başkalarının sırlarına burnunu sokma. Ama ortalıkta bir ceset varsa kural bozulur. Buradaki ahşap tezgâh çok fısıltı dinledi dedektif... Ne duymak istiyorsun?"',
      suggestedQuestions: [
        'Cinayet gecesi barda kavga eden veya sert tartışan kimlerdi?',
        'Kurban o akşam bara uğradı mı, kiminle içti?',
        'Gece yarısı apar topar hesabı ödemeden kaçar gibi çıkan biri oldu mu?',
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
    return '/dialogue/china/lin_feng.png';
  }

  if (cfg?.portraitImage) {
    return cfg.portraitImage;
  }

  // Varsayılan iç mekan veya arka plan fallback'leri
  if (normScenario === 'modern') {
    const modernFallbacks: Record<string, string> = {
      tavern: '/dialogue/modern/tavern.png',
      church: '/dialogue/modern/church.png',
      graveyard: '/dialogue/modern/graveyard.png',
      mill: '/dialogue/modern/mill.png',
      farm: '/dialogue/modern/farm.png',
      clinic: '/dialogue/modern/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return modernFallbacks[npcKey] || `/dialogue/modern/${npcKey}.png`;
  }
  if (normScenario === 'china') {
    const chinaFallbacks: Record<string, string> = {
      tavern: '/dialogue/china/lin_feng.png',
      church: '/dialogue/china/zhao.png',
      graveyard: '/dialogue/china/huikang.png',
      mill: '/dialogue/china/guan.png',
      clinic: '/dialogue/china/song.png',
      farm: '/backgrounds/interior_china_farm.webp',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return chinaFallbacks[npcKey] || `/dialogue/china/${npcKey}.png`;
  }

  if (normScenario === 'cyberpunk') {
    const cpFallbacks: Record<string, string> = {
      tavern: '/dialogue/cyberpunk/tavern.png',
      church: '/dialogue/cyberpunk/church.png',
      graveyard: '/dialogue/cyberpunk/graveyard.png',
      mill: '/dialogue/cyberpunk/mill.png',
      farm: '/dialogue/cyberpunk/farm.png',
      clinic: '/dialogue/cyberpunk/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return cpFallbacks[npcKey] || `/dialogue/cyberpunk/${npcKey}.png`;
  }

  if (normScenario === 'winter') {
    const winterFallbacks: Record<string, string> = {
      tavern: '/dialogue/winter/tavern.png',
      church: '/dialogue/winter/church.png',
      graveyard: '/dialogue/winter/graveyard.png',
      mill: '/dialogue/winter/mill.png',
      farm: '/dialogue/winter/farm.png',
      clinic: '/dialogue/winter/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return winterFallbacks[npcKey] || `/dialogue/winter/${npcKey}.png`;
  }

  // Medieval / fallback
  const medFallbacks: Record<string, string> = {
    tavern: '/dialogue/medieval/tavern.png',
    church: '/dialogue/medieval/church.png',
    graveyard: '/dialogue/medieval/graveyard.png',
    mill: '/dialogue/medieval/mill.png',
    farm: '/dialogue/medieval/farm.png',
    clinic: '/dialogue/medieval/clinic.png',
    crime_scene: '/backgrounds/bg_crime_scene.png',
  };
  return medFallbacks[npcKey] || `/dialogue/medieval/${npcKey}.png`;
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
