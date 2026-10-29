# Mekân araması görselleri (Gemini istemleri)

Tıkla-bul aramasının sahneleri için istemler. Kurallar ve oyun `docs/nesne-arama-tasarimi.md`'de.

Arama bütün mekânda değil, mekânın içindeki **alanlarda** yapılır: tezgâh arkası, ocak başı, masa… Her alan, iç mekân görselindeki bir tıklama noktasının (`frontend/src/config/interiors/<evren>.ts` içindeki hotspot) çok yakından görünüşüdür: bir rafın, bir masanın üstü kadar dar bir yüzey. Oyuncu bir alanı seçer; kanıt hangi alanı seçerse seçsin aynıdır.

Mekân başına 3–4 alan. Önce Ashenmoor (6 mekân), beğenilirse öteki evrenler.

## Neden istemde hedef yok

Ashenmoor Tavernası denemelerinden çıkan dersler:

1. **Geniş çekim olmuyor.** Bütün salonu gösteren karede Gemini eşyaları ayrık yerleştirip boş zemin bırakıyor. Yakın karede raf, tezgâh ve zemin baştan sona dolabiliyor.
2. **Kare dar olmalı.** İki üç metre geriden çekilen kare her seferinde salona açıldı: raflar düzenli kaldı, aşağısı boş zemin oldu. İşe yarayan, tek bir yüzeye odaklanmak: yalnızca raflar (tam karşıdan), yalnızca masanın üstü (tam tepeden), yalnızca ocak rafı. Zemin, tavan ve salon karede görünmeyince Gemini'nin dolduracak tek şeyi eşya oluyor.
3. **Adı geçen eşya vitrine çıkıyor.** İstemde "lavta, kum saati, maske… gizle" dendiğinde Gemini bunların hepsini ön plana, ışığa ve boş zemine koydu; aranacak şeyler en kolay bulunan şeyler oldu.

4. **Referans görsel düzeni taşıyor.** İç mekân görseli yüklenince Gemini o sakin, düzenli odayı da taklit etti. Görsel yüklemeden, tarzı yazıyla tarif edince kaos geldi. Alanlar dar kare olduğu için tutarlılık kaybı az.
5. **Her eşya farklı olmalı ama sergilenmemeli.** Sıradan bir depoda aynı kupa, tas ve şişe tekrar ediyor; tek olan eşya az kalıyor. "Aynı türden iki eşya olmasın, eskici dükkânı gibi" deyince çeşitlilik geldi ama Gemini her eşyayı ayrı bölmeye koydu. "Eşyalar birbirine girmiş, her biri iki üçünü örtüyor" eklenince ikisi birlikte tuttu. Birkaç tekrar yine kalıyor; onlar listeye girmez, dikkat dağıtıcı olur.

Bu yüzden istemler **yalnızca genel dağınıklığı** tarif eder; ne aranacak nesneler ne de asıl yerler (gevşek tahta, gizli bölme) istemde geçer. Aranacakları ve asıl yerleri işaretleme sırasında görselden biz seçeriz.

## Genel kurallar

- **Aynı yer, yakından.** Alan, iç mekân görselinde görünen yerin yakın hâlidir: aynı ahşap, taş, ışık ve çizim tarzı. Tarz, evrenin bölümündeki tarz paragrafıyla yazıyla verilir; iç mekân görseli yüklenmez.
- **Dar kare:** tek bir yüzey (raf, masa üstü, ocak rafı, yığın) bütün kareyi kaplar; zemin, tavan ve oda görünmez. Kamera karşıdan ya da tepeden bakar.
- **Yoğunluk:** karede boş yüzey ve düzgün sıra kalmamalı. Eşyalar yığın hâlinde, devrik, üst üste.
- **İnsan yok,** el ya da kol da yok.
- **Yazı yok.** Kâğıtlar ve tabelalar okunamaz olmalı.
- **Kanıt çizilmez.** Kanıt sonunda kart olarak çıkar; görselde mühür, kan, mektup gibi vakaya ait bir şey olmamalı.
- **Boyut:** 16:9, en az 2000 piksel genişlik (2K yeterli).

### Üretim yöntemi

1. **Gemini uygulamasında** Pro modeliyle üret ve görseli büyütüp **indirme düğmesiyle** kaydet; ekran görüntüsü ya da kopyala-yapıştır 1024 piksellik önizlemeyi verir. Alternatif: Google AI Studio'da Nano Banana Pro, 16:9 ve 2K.
2. **Tek seferde üret.** Aynı görsel üstünde arka arkaya düzenleme yapma; her turda görsel küçülüp bulanıklaşıyor. Beğenmezsen yeni sohbette yeniden üret.
3. **Referans görsel yükleme.** Tarzı istemin ilk paragrafı verir. Bir mekânın ilk alanı beğenildikten sonra öbür alanlar arasında renk ve ışık farkı çok olursa, beğenilen görseli yalnızca tarz için ekle ("use the uploaded image only for the painting style and colors").
4. **Dosya:** `frontend/public/search-scenes/<evren>/<mekân>/<alan>.webp` (WebP kalite 85). Alan adı hotspot id'sidir.

### Görsel kabul ölçütü

Görsel şu üçünü sağlıyorsa kullanılır:
- karenin her köşesi dolu; zemin, tavan ya da salon görünmüyor;
- eşyaların çoğu düzgün sıra hâlinde değil, yığın ve devrik;
- yakından bakınca seçilebilen **en az 25 küçük, tek eşya** var (aşağıdaki seçim kurallarına uyan).

### İşaretleme: aranacakları seçmek

`/dev/scene-editor` aracında evren, mekân ve alanı seç, görseli aç, kutuları çiz.

- **Aranacak nesneler (20–25):** küçük, kısmen örtülü, gölgede ya da çevresiyle aynı renkte olanlar. Örnek: duvarda asılı makas, raftaki huni, tek bir mantar tıpa, yerdeki sikke, sepetin içindeki ekmek, kirişe asılı ot demeti.
- **Seçilmeyenler:**
  - göze batan büyük eşyalar (ön plandaki lavta, ışıktaki maske); sahnede dikkat dağıtıcı olarak kalırlar;
  - sahnede birden çok kopyası olanlar (kupa, testi, mum, fıçı); oyuncu doğru eşyaya tıklayıp ıska yer;
  - yarısından fazlası görünmeyen ya da ne olduğu yakından bakınca da anlaşılmayanlar.
- **Adlar:** kısa ve tek anlamlı Türkçe ("Asılı makas", "Mantar tıpa"). Görselde nasıl görünüyorsa öyle adlandır; "kalay kupa" görselde gerçekten kalay kupa olmalı.
- **Asıl yerler (2–3):** görselde zaten olan, içine bir şey saklanabilecek bir ayrıntı: aralık, çatlak, kapağı aralık bir sandık, tahtaların arasındaki boşluk, yığının altı. Yönlendirme yeri tarif eder: kabaca konumu ve görselde gerçekten görünen ayrıntıyı söyler, "Kanıt … olabilir." diye kurulur ("Kanıt sağda, zincirle sarılmış sandıkta olabilir."). Görselde seçilmeyen bir ayrıntı ("kilidi kırılmış") yazılmaz. Kutu, oyuncunun tıklayacağı yerin tamamını (sandığın önü, çuvalın kendisi) kaplar. Asıl yer göze batmamalı ama yönlendirmeyle bulunabilmeli.

---

## İstem kalıbı

Her istem dört parçadan oluşur:

1. **Evren tarzı:** evrenin bölümündeki tarz paragrafı, olduğu gibi.
2. **Kare:** tek, büyük ama dar bir yüzey, tam karşıdan ya da tam tepeden. Görselin kenarları yüzeyin ortasından geçer; tavan, zemin ve oda görünmez. Yüzeyin büyüklüğü sayıyla verilir ("altı sıra raf, beş bölme") ki eşyalar küçük görünsün. "Kamerayı geri çek" yazılmaz.
3. **Hikâye ve yoğunluk:** yerin neden bu kadar dolu olduğu (yıllardır unutulan eşyalar, kavga sonrası masa), eşyaların birbirine girmiş yığınlar hâlinde olduğu, boş yer kalmadığı.
4. **Çeşitlilik:** her eşyanın başka bir şey olduğu, aynı türden iki eşya olmadığı; eşya adı verilmez, malzemeler sayılır.

Sonuna aynı yasak listesi gelir.

---

## Ortaçağ: Ashenmoor (`medieval`)

**Evren tarzı:**

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.
```

### Taverna (`tavern`)

Aranabilir alanlar: `barrels`, `fireplace`, `table`, `stairs`. Avize (`chandelier`) aranmaz, yalnızca açıklaması kalır.

#### Tezgâh arkasındaki raflar (`barrels`)

Dosya: `search-scenes/medieval/tavern/barrels.webp`. Taverna'nın dört alanının görseli bu kalıpla üretildi ve işaretlendi (2026-10-29).

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight frontal view of a huge old wooden shelf wall in the storeroom of a medieval tavern: six rows of shelves, divided into five sections by vertical posts. The shelf wall fills the entire frame from edge to edge; the top and bottom edges of the image cut through the shelves. No ceiling, no floor, no room. Because the shelf wall is so big, every object on it looks small.

The storeroom is where the innkeeper has thrown everything travellers left behind for years. Every compartment is crammed full to bursting: things piled on top of each other, pushed in front of each other three deep, tipped over, lying at random angles, spilling over the edges, dangling from nails on the posts and the shelf edges. Not a single bit of bare shelf board or stone wall is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT displayed one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, stacks of plates, matching sets, objects displayed separately, one object per compartment, museum display, neatly arranged, orderly shelves, shop display, symmetric composition, still life, evenly spaced objects, empty shelf space, visible stone wall, large objects, visible floor, visible ceiling, people, readable text, watermark, cartoon.
```

#### Ortadaki masalar (`table`)

Dosya: `search-scenes/medieval/tavern/table.webp`

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of two huge heavy plank tables pushed together in a medieval tavern. The table tops fill the entire frame from edge to edge; the edges of the image cut through the tables. No floor, no benches, no room. Flat view, no perspective. Because the tables are so big, every object on them looks small. Candle light from a few candle stubs among the mess.

This is the morning after a wild feast and a brawl, when every guest fled and left their things behind. The whole table surface is buried: things piled on top of each other, knocked over, lying at random angles, spilled food and drink between them. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A cloak is thrown over part of the mess, a string runs through it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, food.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, sets of plates, matching cups, set table, objects laid out separately, perspective view, visible floor, visible benches, room view, neatly arranged, symmetric composition, still life, evenly spaced objects, bare table surface, large objects, people, readable text, watermark, cartoon.
```

#### Ocak başı (`fireplace`)

Dosya: `search-scenes/medieval/tavern/fireplace.webp`

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight frontal view of the huge stone chimney wall above the big fireplace of a medieval tavern, with a very long, wide wooden mantel shelf and two more wooden shelves fixed to the stones above it, all studded with nails and iron hooks. The chimney wall fills the entire frame from edge to edge; only a strip of the low fire glows at the very bottom edge. No room, no floor, no ceiling. Because the wall is so big, every object on it looks small.

Generations of guests have hung and left their things here to dry and forgot them. The mantel and the shelves are crammed full to bursting and the stones between them are covered with things hanging from the nails and hooks: piled on top of each other, tipped over, lying at random angles, dangling over the edges. Not a single bit of bare stone or shelf board is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT displayed one by one: they are jammed together in tangled piles and bunches, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried food.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects displayed separately, museum display, wide shot, room view, visible floor, visible ceiling, neatly arranged, symmetric composition, still life, evenly spaced objects, bare stone, empty shelf space, large objects, people, readable text, watermark, cartoon.
```

#### Merdiven altı (`stairs`)

Dosya: `search-scenes/medieval/tavern/stairs.webp`

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from above, looking down at a steep angle, into the deep storage space under a big wooden staircase in a medieval tavern, filled with a huge heap of junk around several tipped-over and emptied trunks and chests. The heap fills the entire frame from edge to edge; only a few slanted stair boards show at the top edge. No room, no open floor. Because the heap is so big, every object in it looks small. Candle light from one side, deep shadows between the objects.

This is where the innkeeper has thrown everything travellers left behind for years, and someone has just searched through it in a hurry. Everything lies in a chaotic heap several layers deep: things spilling out of the open trunks, bags and baskets, tipped over, lying at random angles. Not a single bit of bare floor is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the heap, a blanket is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, matching sets, objects laid out separately, wide shot, room view, open floor, neatly arranged, symmetric composition, still life, evenly spaced objects, empty space, large objects, people, readable text, watermark, cartoon.
```
