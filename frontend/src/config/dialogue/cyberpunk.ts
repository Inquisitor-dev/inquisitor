import type { NpcDialogueConfig } from './types';

export const CYBERPUNK_DIALOGUE: Record<string, NpcDialogueConfig> = {
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
  };
