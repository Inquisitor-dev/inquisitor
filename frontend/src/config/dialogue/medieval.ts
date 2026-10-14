import type { NpcDialogueConfig } from './types';

export const MEDIEVAL_DIALOGUE: Record<string, NpcDialogueConfig> = {
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
  };
