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
- **Waldo anı:** Liste bitince tek bir asıl yer aranır: gevşek tahta, yeni taş, gizli bölme. Kanıt oradan çıkar. Asıl yer her sahnede birkaç adaydan biri olarak tohumla seçilir, o da ezberlenmez.

## Kurallar

- **Kanıt koddan gelir.** Asıl yer bulununca mekânın ipucu kaydedilir (`locationClues`). Doğrulayan kanıt o mekândaysa o kaydedilir. Kanıtın kendisi görselde çizili değildir, sonunda kart olarak çıkar.
- **Cevap sızmaz.** Sahne, liste uzunluğu, süre ve cezalar yalnızca evrene, mekâna ve zorluğa bağlıdır, vakaya hiç bağlı değildir. Katilin mekânı ötekilerden zor ya da farklı olmaz.
- **Hile yok.** Nesnelerin yerleri istemciye gitmez; her tıklamayı sunucu denetler.
- **Kanıt kaybedilmez.** Süre dolarsa arama yeniden denenebilir; çözücü her mekânın ipucunun alınabildiğini varsayar.
- **Başarısız aramanın bedeli:** Süre biterse (yanlış tıklamalar ya da ipuçları bitirse de) günün bir vakti geçer. Bu, her denemede bir kez olur; gece son vakittir, ötesine geçmez. Günü yine oyuncu kapatır.
- **Sahnesi olmayan mekân** eski yolla, anlatıcıyla aranır. Mobil (donduruldu) her zaman böyle arar.

## Zorluk

| | Nesne | Süre | Yanlış tıklama | İpucu |
|---|---|---|---|---|
| Kolay | 6 | 3 dk | −5 sn | 2 (−15 sn) |
| Orta | 8 | 2,5 dk | −8 sn | 1 (−15 sn) |
| Zor | 10 | 2 dk | −10 sn | 1 (−20 sn) |

İpucu, bulunmamış bir nesnenin çevresine kesikli bir daire çizer; tam yerini vermez.

## İçerik üretimi

- Her mekânın dağınık bir görseli olur: `frontend/public/search-scenes/<evren>/<mekân>.webp`. Görsel, mekânın şu anki iç görünümüyle aynı oda olmalıdır: aynı mimari, aynı ışık, aynı yerleşim. Yalnızca daha kalabalık ve dağınıktır.
- 5 evren × 6 mekân = 30 sahne. Görsel istemleri ayrı bir belgede tutulur (`docs/nesne-arama-gorselleri.md`, yazılacak).
- **İşaretleme:**
  - `/dev/scene-editor` aracında görselin üstüne kutular çizilir ve her nesneye Türkçe bir ad verilir;
  - en az 10, tercihen 25–30 nesne ve 2–3 asıl yer;
  - araç `backend/src/search/scenes/<evren>.ts` için kodu üretir.
- **Nesne seçimi:** Nesneler gözle tanınabilir ve tek anlamlı olmalı ("kalay kupa" görselde gerçekten kupa olmalı). Birbirine benzeyen iki nesne aynı sahnede listeye girmemeli.
- **Durum:** Sahne `DRAFT` olarak eklenir; o hâliyle yalnızca test modunda açılır. Oynanıp beğenilince `READY` yapılır.

## Şimdiki durum

- **Altyapı hazır:**
  - backend: `src/search/`, `GameSession.searchState`;
  - frontend: `/search/[locationId]` ekranı ve `/dev/scene-editor` aracı.
- **Taslak sahne:** Ashenmoor Tavernası için bir taslak sahne var. Gerçek dağınık görsel yerine bugünkü iç mekân görseli ve 11 nesne kullanıyor. Yalnızca test modunda açılır.

## Açık kararlar

1. **Biçimler:** Silüet modu (adı yerine nesnenin silüeti) ve karanlık mod (fenerle arama) zorluk seviyelerine bağlanabilir. Silüet modu için nesnelerin kesilmiş görselleri gerekir.
2. **Çözüm yolları metni:** "Arama izni al ve X mekânını ara." metni sahnesi olan mekânlarda "… ara ve gizli nesneleri bul" olabilir.
