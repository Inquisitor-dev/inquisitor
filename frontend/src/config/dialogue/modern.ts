import type { NpcDialogueConfig } from './types';

export const MODERN_DIALOGUE: Record<string, NpcDialogueConfig> = {
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
    portraitImage: '/dialogue/modern/farm.png?v=2',
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
};
