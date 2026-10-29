# Arama alanı görseli istemi: püf noktaları

Bu belge, The Inquisitor'ın "mekân araması" (nesne bulma) sahneleri için Gemini'de görsel ürettirirken
Ashenmoor (ortaçağ) denemelerinde öğrenilenleri toplar. Yeni bir sohbette bu belgeyi okuyan Claude, öbür
evrenlerin (modern, kış, Çin, siberpunk) istemlerini aynı kalıpla yazabilir. Ayrıntılı oyun tasarımı için
`docs/nesne-arama-tasarimi.md`, hazır ortaçağ istemleri için `docs/nesne-arama-gorselleri.md`.

## 1. Görselin işi ne

- Oyuncu, mekânın içindeki bir **arama alanını** (tezgâh arkası, ocak rafı, masa üstü…) seçer ve o alanın
  çok dağınık bir görselinde listedeki nesneleri bulur; sonra tek bir "asıl yer"i bulur, kanıt oradan çıkar.
- Görsel **yalnızca dağınıklık** sağlar. Aranacak nesneleri ve asıl yeri görseli ürettikten sonra biz seçer,
  kutularla işaretleriz. Bu yüzden istemde **hiçbir hedef nesne ya da gizli yer adı geçmez**.
- Zorluk görselin kendisinden gelir: eşyalar küçük, iç içe, birbirine benzer renklerde olmalı. Göze batan,
  tek başına duran eşya oyunu bozar.

## 2. İstem kalıbı

Her istem dört parçadan oluşur, İngilizce yazılır, parçalar boş satırla ayrılır.

1. **Evren tarzı** (tek paragraf, her istemde aynı). Ortaçağ örneği:
   `A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.`
   Dışarısı için ışığı değiştir: `…cold blue moonlight mixed with the warm glow of a lantern, deep shadows…`
2. **Kare:** tek, büyük ama dar bir yüzey; kamera tam karşıdan ya da tam tepeden bakar.
3. **Hikâye ve yoğunluk:** yerin neden bu kadar dolu ve dağınık olduğu, boş yer kalmadığı, nesne sayısı.
4. **Çeşitlilik:** her eşyanın başka bir şey olduğu, malzemeler; eşya adı yok.

Sonuna sabit bir `No people, no hands. Highest resolution, 16:9.` ve bir `Avoid:` listesi gelir.

### Tam şablon

```
<EVREN TARZI PARAGRAFI>

<KARE: aşağıdaki "Kare tarifleri"nden biri>

<HİKÂYE: Bu yer neden dolu. "The whole <yüzey> is buried: things piled on top of each other, tipped over, lying at random angles. Not a single bit of bare <malzeme> is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.">

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. <Bir ip/zincir/bez örneği: "A rope runs through the pile, a cloth is thrown over part of it">, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: <MALZEME LİSTESİ: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur…>.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, <YÜZEYE ÖZEL YASAKLAR>, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```

## 3. Kare tarifleri (en önemli karar)

Geniş çekim işe yaramaz. "Üç metre geriden, eşyalar küçük görünsün" yazınca Gemini her seferinde salona açıldı,
boş zemin ve düzgün raflar çıktı. İşe yarayan: **tek bir yüzey bütün kareyi kenardan kenara doldurur;
tavan, zemin ve oda görünmez.** Eşyaların küçük görünmesi için yüzeyin büyüklüğünü **sayıyla ya da "çok büyük"
diyerek** söyle ("six rows of shelves, five sections", "Because the table is so big, every object on it looks small"),
kamerayı geri çekme.

| Yüzey | Kamera | Not |
|---|---|---|
| Masa, tezgâh, sunak, sedir, sandık içi, lahit, ocak taşlığı | **Tam tepeden** ("directly down from above… Flat view, no perspective") | **En iyi çalışan açı.** Perspektif olmadığı için boşluk bırakacak yer kalmaz. |
| Raf, dolap, alet/baca duvarı | Tam karşıdan ("straight frontal view"), üst ve alt kenar rafları keser | "Altı sıra raf, beş bölme" gibi sayı ver. Duvar ve taş görünmesin diye "every gap is filled" de. |
| Yığın (merdiven altı, çuval yığını, samanlık zemini) | Yukarıdan, dik açıyla ("looking down at a steep angle") | "No open floor", "only a few … show at the top edge". |

Her kare tarifine şunları ekle: `fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no room.`

## 4. İyi sonuç veren ilkeler

1. **İç mekân görselini referans olarak yükleme.** Gemini odanın sakin, düzenli hâlini de taklit ediyor; kaos
   gelmiyor. Tarzı yazıyla (1. parça) tarif et. Alanlar dar kare olduğu için tutarlılık kaybı küçük.
2. **Hedef nesne adı verme.** Adı geçen eşyayı Gemini ön plana, ışığa ve boş zemine koyuyor; aranacaklar en
   kolay bulunan şeyler oluyor. Yalnızca malzemeleri say.
3. **Hem çeşitlilik hem iç içe geçme iste.** Yalnızca "her eşya farklı" dersen Gemini her birini ayrı bölmeye
   koyar (vitrin). Yalnızca "kalabalık" dersen aynı kupa, tas, şişe tekrar eder. İkisini birden yaz: "jammed
   together in tangled piles, every object touching and partly covering two or three others".
4. **Bir hikâye ver.** "The innkeeper has thrown everything travellers left behind for years" gibi bir neden,
   dağınıklığı doğal ve yoğun yapıyor. Eşyalar için tür listesi yerine hikâye yaz.
5. **Her şey "pile" ve "tipped over"**: sıra, simetri, dizili, sergi sözlerini hem yaz hem Avoid'a ekle.
6. **Çözünürlüğü Gemini'de sabitleme**: 16:9 yeterli, 2752×1536 çıkıyor. Büyütme gerekmez.
7. **Tek seferde üret.** Aynı görsel üstünde arka arkaya düzenleme yaptırma; her turda küçülüp bulanıklaşıyor.
   Beğenmezsen istemi düzeltip yeni sohbette yeniden üret.
8. **Karanlık ya da gölgeli sahnede ışığı açıkça iste**: `Bright warm golden daylight lights the whole loft evenly: no deep shadows, no dark corners, every object is clearly visible and sharp, even in the corners`.
   Ve Avoid'a `dark, gloomy, deep shadows, low contrast` ekle. (Samanlık ilk denemede nesneler seçilemeyecek kadar karanlık çıktı.)

## 5. Yasaklar ve neden

- **Yazı** (`readable text, writing, letters`): okunur yazı ("Document") çıkabiliyor; oyunda yersiz durur.
- **Mühürlü zarf, mektup, el yazılı kâğıt** (`sealed envelopes`): oyuncu bunları kanıt sanır. Kanıt görselde
  çizilmez, sonunda kart olarak çıkar. Görselde çıkarsa listeye ya da asıl yerlere koyma.
- **Kan** (`blood`): Gemini pelerin ve sargılara kan lekesi koyabiliyor.
- **İnsan, el** (`people, hands`): İç mekân görselleri kullanılmadığı için nadiren çıkar; yine de yaz.
- **İskelet, kafatası, vücut** (türbe, lahit için): `skeletons, skulls, bones of a body`.
- **Geniş çekim** (`wide shot, room view, visible floor, visible ceiling, open floor`): karenin salona açılmasını önler.
- **Yüzeye özel**: raflarda `rows of jars, rows of bottles, one object per compartment, visible stone wall, empty shelf space`;
  masalarda `perspective view, visible floor, bare table surface`; yığınlarda `neat stacks, empty space`.

## 6. Kabul ölçütü (görseli beğenmeden önce)

- 16:9, en az 2000 piksel genişlik. İndirme düğmesiyle kaydet; ekran görüntüsü ya da panoya kopyalama
  1024 piksellik önizleme verir.
- Karenin her köşesi dolu; zemin, tavan, taş duvar ya da boş raf görünmüyor.
- Eşyalar sıralı değil, yığın hâlinde; çoğu yarım görünüyor.
- Yakından bakınca seçilebilen **en az 15, tercihen 25–30 tekil eşya** var. Aynı eşyadan çok olanlar (kupa,
  mum, şişe, anahtar) dikkat dağıtıcı olarak kalır, listeye girmez.
- Okunur yazı, mühürlü zarf, kan, insan yok.
- Çok karanlık köşe yok.

Birkaç tekrar (iki çizme, üç miğfer) sorun değil. Gemini'ye "ikinciyi sil" diye düzenleme yaptırma; görsel küçülür.

## 7. Sorun giderme

| Belirti | Çare |
|---|---|
| Kare salona açıldı, boş zemin var | Kamerayı daralt: tek yüzey, kenardan kenara; Avoid'a `wide shot, room view, open floor`. Mümkünse tepeden bakış. |
| Raflar düzenli, eşyalar sıralı | Raf yerine yığın ya da masa üstü kullan; "overloaded far beyond its capacity", "pushed in front of each other three deep". |
| Eşyalar tek tek sergilenmiş, aralarında duvar görünüyor | "NOT laid out one by one" paragrafını ekle; Avoid'a `objects displayed separately, one object per compartment, museum display`. |
| Aynı kupa, tas, şişe tekrar ediyor | "Every single object is a different kind of thing" ve malzeme listesi; Avoid'a `repeated objects, matching sets`. Kalanı listeye alma. |
| Çok karanlık | Işığı açıkça iste, Avoid'a `dark, gloomy, deep shadows`. |
| Sıralı kavanoz ya da şişe (ecza, bar) | Avoid'a `rows of jars, rows of bottles, matching jars`; "most things are not containers at all but instruments, curiosities and belongings". |
| Eskiden iyi olan ocak/raf bu sefer kötü | Rastgele değişiyor; aynı istemi bir kez daha dene, olmazsa tepeden bakan bir yüzeye (ocak taşlığı) çevir. |
| Gemini küçük çıktı verdi (1024 px) | Pro/Thinking modelinde üret, görseli büyütüp indirme düğmesiyle kaydet. |

## 8. Yeni bir evren ya da mekân için iş akışı

1. `frontend/src/config/interiors/<evren>.ts` içindeki mekânın tıklama noktalarını (hotspot) oku.
2. **Aranabilir alanları seç** (mekân başına 3–4): NPC olmayan ve yakından bir yüzeyi olan noktalar.
   Aranmayanlar: avize, pencere, çatı kirişi, kapı, tavandan sarkan otlar (hepsi aynı demetler olur),
   gül pencere, dişliler gibi tek bir yüzey olmayanlar.
3. **Kare türünü seç** (3. bölüm): masa/tezgâh/sunak gibi yatay yüzeyler tepeden; raf ve duvar karşıdan; yığınlar yukarıdan.
4. İstemi şablona göre yaz. Hikâyeyi mekâna uydur (rahip adakları unutur, değirmenci masayı hiç toplamaz).
5. Gemini'de **yeni sohbette, görsel yüklemeden** üret. Beğenilenleri `arama-mekanlari` gibi bir klasöre indir.
6. Dosyayı `frontend/public/search-scenes/<evren>/<mekân>/<alan>.webp` olarak kaydet (WebP, kalite 85). Alan
   adı hotspot id'sidir.
7. **İşaretle** (`/dev/scene-editor` ya da görselin üstüne kutu çizerek): 12–22 aranacak nesne ve 3 asıl yer.
   - Aranacaklar küçük, kısmen örtülü ya da çevresine karışan eşyalar. Göze batanları, birden çok kopyası olanları
     (kupa, mum, çizme, anahtar, aynı tür şişe), mühürlü zarfları ve el yazılı kâğıtları listeye alma.
   - Adlar kısa ve tek anlamlı Türkçe: "Bakır testi", "Büyük makas".
   - Asıl yerler içine bir şey saklanabilecek görünen bir ayrıntı: sandık, çuval, bandaj yığını, kürk altı,
     çömlek içi. Yönlendirme yeri tarif eder: `Kanıt sağ üstteki sandıkta olabilir.` Görselde seçilmeyen
     ayrıntı yazma.
   - Nesne ve asıl yer kimlikleri sahne içinde benzersiz olmalı, ASCII (`kemik_duduk`, `hac`).
8. Sahneyi `backend/src/search/scenes/<evren>-<mekân>.ts` dosyasına `DRAFT` olarak yaz ve `scenes/index.ts`
   içine ekle. Her alan için `clueSpot` ifadesini (`tezgâh arkasındaki raflarda`) yaz; hikâye istemi kanıtı oraya yazdırır.
9. Test modunda yeni oyun aç (envanter bütün mekânların iznini taşır), "Test: yerler" ile kutuları denetle,
   "Test: bitir" ile akışı kısa kes. Oynayıp beğenince sahneyi `READY` yap.

## 9. Örnek: tek bir istem

Bu istem tavernanın masa alanını üretti (tepeden bakış, tam kalıp):

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of two huge heavy plank tables pushed together in a medieval tavern. The table tops fill the entire frame from edge to edge; the edges of the image cut through the tables. No floor, no benches, no room. Flat view, no perspective. Because the tables are so big, every object on them looks small. Candle light from a few candle stubs among the mess.

This is the morning after a wild feast and a brawl, when every guest fled and left their things behind. The whole table surface is buried: things piled on top of each other, knocked over, lying at random angles, spilled food and drink between them. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A cloak is thrown over part of the mess, a string runs through it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, food.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, sets of plates, matching cups, set table, objects laid out separately, perspective view, visible floor, visible benches, room view, neatly arranged, symmetric composition, still life, evenly spaced objects, bare table surface, large objects, people, readable text, watermark, cartoon.
```
