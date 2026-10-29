# Mekân araması: tıkla-bul

Arama izni alınan mekân, anlatıcıyla konuşarak değil, mekânın dağınık hâlinin görselinde nesne arayarak aranır.

## Neden tıkla-bul, neden liste

- Mekân aramak gözle bir şey aramaktır; oyun bunu doğrudan yaptırır, kural öğretmek gerekmez.
- Tek nesneyi bulmak (Waldo gibi) bizde iyi çalışmaz:
  - ikinci vakada yeri ezberlenir;
  - yapay zekâ görsellerinde hedefi bilerek gizleyemeyiz;
  - takılan oyuncunun ara ilerlemesi yoktur;
  - zorluk ayarlanamaz.
- Liste tarzı (8–10 nesne) bunları çözer:
  - bir sahnede 25–30 nesne işaretlenir, her aramada farklı bir kısmı sorulur;
  - ilerleme hissi verir;
  - zorluk nesne sayısı, süre ve ceza ile ayarlanır.
- **Waldo anı:** Liste bitince tek bir asıl yer aranır: gevşek tahta, yeni taş, gizli bölme. Kanıt oradan çıkar. Ekran geçişi açıkça söyler (sahnede kısa bir duyuru, alt şeritte "Son adım · Kanıtın saklandığı yeri bul ve üzerine tıkla") ve yönlendirme yeri tarif eder. Asıl yer her sahnede birkaç adaydan biri olarak tohumla seçilir, o da ezberlenmez.

## Kurallar

- **Kanıt koddan gelir.** Asıl yer bulununca mekânın ipucu kaydedilir (`locationClues`). Doğrulayan kanıt o mekândaysa o kaydedilir. Kanıtın kendisi görselde çizili değildir, sonunda kart olarak çıkar.
- **Cevap sızmaz.** Sahne, liste uzunluğu, süre ve cezalar yalnızca evrene, mekâna ve zorluğa bağlıdır, vakaya hiç bağlı değildir. Katilin mekânı ötekilerden zor ya da farklı olmaz.
- **Hile yok.** Nesnelerin yerleri istemciye gitmez; her tıklamayı sunucu denetler.
- **Görselin her yeri ulaşılabilir.** Görsel üst şerit ile nesne listesinin arasındaki alanda durur; şeritler görselin üstüne binmez. Açılışta bu alanı siyah şerit bırakmadan doldurur; ekranın oranı farklıysa taşan kısım sürüklenerek görülür, kaydırma sınırı tam görselin kenarıdır. Yakınlaştırma yoktur (Berke'nin kararı: görsel zaten sığıyor, siyah şerit yok). Bu yüzden görseller ekran oranına göre yeniden üretilmez; 16:9 yeterli.
- **Kanıt kaybedilmez.** Süre dolarsa arama yeniden denenebilir; çözücü her mekânın ipucunun alınabildiğini varsayar.
- **Başarısız aramanın bedeli:** Süre biterse (yanlış tıklamalar ya da ipuçları bitirse de) günün bir vakti geçer. Bu, her denemede bir kez olur; gece son vakittir, ötesine geçmez. Günü yine oyuncu kapatır.
- **Arama alanları:** Mekânın bütünü değil, içindeki alanlar aranır (tezgâh arkası, ocak başı…). Her alan iç mekân görselindeki bir tıklama noktasıdır.
- **Kanıt tek bir alandadır.** Vaka planı (kod) her mekân için kanıtın alanını rastgele seçer (`CasePlan.searchAreas`) ve hikâye istemi kanıtı oraya yazdırır; böylece "tezgâhın alt rafında bir mektup" diye yazılan kanıt merdiven altında çıkmaz. Yalnızca o alan aranabilir, öbür alanlar "aranmaya değer bir şey yok" der. Süre dolarsa aynı alan yeni bir listeyle yeniden aranır; kazanınca mekân aranmış olur. Seçim vakaya bakmaz: katilin mekânındaki alan ötekilerden farklı seçilmez. Her vakada başka alan açık olduğundan oyun tekrar etmez (Berke'nin kararı, 2026-10-29).
- **Test modu:** "Test: yerler" süren denemenin kutularını gösterir (aranacaklar yeşil, asıl yer kırmızı); işaretlemeyi denetlemek içindir, yalnızca test oturumunda çalışır.
- **Sahnesi olmayan mekân** eski yolla, anlatıcıyla aranır. Mobil (donduruldu) her zaman böyle arar.

## Zorluk

| | Nesne | Süre | Yanlış tıklama | İpucu |
|---|---|---|---|---|
| Kolay | 6 | 3 dk | −5 sn | 2 (−15 sn) |
| Orta | 8 | 2,5 dk | −8 sn | 1 (−15 sn) |
| Zor | 10 | 2 dk | −10 sn | 1 (−20 sn) |

İpucu, bulunmamış bir nesnenin çevresine kesikli bir daire çizer; tam yerini vermez.

## İçerik üretimi

- Her arama alanının yakından, çok dağınık bir görseli olur: `frontend/public/search-scenes/<evren>/<mekân>/<alan>.webp` (alan = hotspot id'si). Görsel iç mekân görseli referans alınarak üretilir: aynı yer, aynı malzeme, aynı ışık, yalnızca yakından.
- Neden alan: bütün salonu gösteren geniş çekimde Gemini eşyaları ayrık yerleştirip boş zemin bırakıyor, arama fazla kolay oluyordu (Ashenmoor Tavernası denemeleri, 2026-10-29).
- Mekân başına 3–4 alan; avize, pencere, çatı gibi aranmayacak noktalarda yalnızca açıklama kalır. Önce Ashenmoor. Görsel istemleri `docs/nesne-arama-gorselleri.md` belgesindedir.
- **İşaretleme:**
  - `/dev/scene-editor` aracında görselin üstüne kutular çizilir ve her nesneye Türkçe bir ad verilir;
  - en az 10, tercihen 25–30 nesne ve 2–3 asıl yer;
  - araç `backend/src/search/scenes/<evren>.ts` için kodu üretir.
- **Nesne seçimi:** Aranacak nesneler ve asıl yerler Gemini'ye söylenmez; istemde adı geçen eşyayı Gemini ön plana koyuyor ve en kolay bulunan şey o oluyor. İstem yalnızca dağınıklığı tarif eder, aranacakları işaretlerken görselden biz seçeriz: küçük, kısmen örtülü, çevresine karışan eşyalar. Göze batanlar ve sahnede birden çok kopyası olanlar listeye girmez. Nesneler tek anlamlı adlandırılır ("kalay kupa" görselde gerçekten kupa olmalı); birbirine benzeyen iki nesne aynı sahnede listeye girmez. Ayrıntılar `docs/nesne-arama-gorselleri.md`'de.
- **Durum:** Sahne `DRAFT` olarak eklenir; o hâliyle yalnızca test modunda açılır. Oynanıp beğenilince `READY` yapılır.

## Şimdiki durum

- **Altyapı hazır:**
  - backend: `src/search/`, `GameSession.searchState`;
  - frontend: `/search/[locationId]?alan=<alan>` ekranı, iç mekânda alan başına "Burayı ara" ve `/dev/scene-editor` aracı (evren, mekân, alan seçilir).
- **Ashenmoor Tavernası:** dört alanın (`barrels`, `fireplace`, `table`, `stairs`) görselleri ve işaretlemesi hazır, 13–20 nesne ve 3 asıl yer. Durumları `DRAFT`, yalnızca test modunda açılır; oynanıp beğenilince `READY` yapılacak.
- **Üst üste binen kutular:** iki aranan nesnenin kutusu çakışırsa tıklama küçük kutuya sayılır; büyük eşyanın kutusu içindeki küçük eşyayı yutmaz. Kutusu komşularını da içine alan çapraz uzun eşyalar (kaval, yay) listeye alınmaz.

## Açık kararlar

1. **Biçimler:** Silüet modu (adı yerine nesnenin silüeti) ve karanlık mod (fenerle arama) zorluk seviyelerine bağlanabilir. Silüet modu için nesnelerin kesilmiş görselleri gerekir.
2. **Çözüm yolları metni:** "Arama izni al ve X mekânını ara." metni sahnesi olan mekânlarda "… ara ve gizli nesneleri bul" olabilir.
