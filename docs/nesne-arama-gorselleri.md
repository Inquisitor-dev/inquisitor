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

### Kilise (`church`)

Aranabilir alanlar: `altar`, `pulpit`, `tapestry`, `candelabra`. Rozet pencere (`rose_window`) aranmaz.

#### Kutsal sunak ve ayin masası (`altar`)

Dosya: `search-scenes/medieval/church/altar.webp`. Kanıtın yer ifadesi (`clueSpot`): "sunağın üstünde, adakların arasında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of the huge stone altar table of a gothic village church, covered with an old embroidered altar cloth. The altar top fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no room. Flat view, no perspective. Because the altar is so big, every object on it looks small. Light from a few candle stubs among the things.

For years villagers have left offerings and belongings on the altar, and the old priest never cleared them away. The whole altar is buried under them: things piled on top of each other, knocked over, lying at random angles, wax dripped over everything. Not a single bit of bare cloth or stone is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rosary runs through the pile, a folded cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax, silver.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, room view, bare altar surface, large objects, people, readable text, watermark, cartoon.
```

#### Oymalı vaaz kürsüsü (`pulpit`)

Dosya: `search-scenes/medieval/church/pulpit.webp`. Kanıtın yer ifadesi (`clueSpot`): "vaaz kürsüsünün basamaklarının altındaki yığında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from slightly above of the foot of the tall carved wooden pulpit of a gothic church: the lowest spiral steps and the dark space under them, used as a storage corner. The steps and the heap around them fill the entire frame from edge to edge; only the carved railing shows at the top edge. No room, no open floor. Because the heap is so big, every object in it looks small. Candle light from one side, deep shadows between the objects.

This is where the sexton has stuffed everything the church no longer uses for decades, and someone has just rummaged through it in a hurry. Everything lies in a chaotic heap several layers deep on the steps and under them: things spilling out of chests and baskets, tipped over, lying at random angles. Not a single bit of bare floor is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A bell rope runs through the heap, an old vestment is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, wide shot, room view, open floor, empty space, large objects, people, readable text, watermark, cartoon.
```

#### Duvar halısının arkasındaki niş (`tapestry`)

Dosya: `search-scenes/medieval/church/tapestry.webp`. Kanıtın yer ifadesi (`clueSpot`): "duvar halısının arkasındaki taş nişin raflarında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight frontal view of a deep stone wall niche with old wooden shelves inside, hidden behind a heavy tapestry that has been pulled aside; only the edge of the tapestry hangs at the left edge of the image. The niche shelves fill the entire frame from edge to edge; the top and bottom edges cut through the shelves. No room, no floor, no ceiling. Because the niche is so big, every object in it looks small.

For generations the priests have hidden here whatever they wanted to keep out of sight. Every shelf is crammed full to bursting: things piled on top of each other, pushed in front of each other three deep, tipped over, lying at random angles, spilling over the edges, dangling from nails. Not a single bit of bare shelf board or stone is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT displayed one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A cord runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax, silver.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects displayed separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, one object per compartment, empty shelf space, visible stone wall, visible floor, visible ceiling, large objects, people, readable text, watermark, cartoon.
```

#### Ayaklı şamdanların önündeki adak masası (`candelabra`)

Dosya: `search-scenes/medieval/church/candelabra.webp`. Kanıtın yer ifadesi (`clueSpot`): "şamdanların önündeki adak masasında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight frontal view, at eye level, of a long old wooden offering table standing in front of a row of wrought-iron candle stands in the side aisle of a gothic church. The table top and the space under it fill the entire frame from edge to edge; only the candle flames glow along the top edge. No room, no floor in front. Because the table is so big, every object on it looks small.

Pilgrims leave a gift or a forgotten belonging here whenever they light a candle, and nobody has cleared the table for years. The table top and the shelf under it are crammed full: things piled on top of each other, tipped over, lying at random angles, wax dripped over everything. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT displayed one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A string of beads runs through the pile, a scarf is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects displayed separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, wide shot, room view, visible floor, bare table surface, large objects, people, readable text, watermark, cartoon.
```

### Değirmen (`mill`)

Aranabilir alanlar: `worktable`, `marked_sacks`, `grindstone`, `stairs`. Dişli mekanizması (`gears`) aranmaz.

#### Hesap masası (`worktable`)

Dosya: `search-scenes/medieval/mill/worktable.webp`. Kanıtın yer ifadesi (`clueSpot`): "değirmencinin hesap masasının üstünde".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of the miller's huge old wooden work desk. The desk top fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no room. Flat view, no perspective. Because the desk is so big, every object on it looks small. Warm light from a lantern standing among the mess.

The miller runs the whole mill from this desk and never tidies it: tools, samples, payments and his own belongings have piled up for years, and flour dust covers everything. Things lie on top of each other, knocked over, at random angles. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A string runs through the mess, an apron is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, grain, flour.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, room view, bare desk surface, large objects, people, readable text, watermark, cartoon.
```

#### İstiflenmiş un çuvalları (`marked_sacks`)

Dosya: `search-scenes/medieval/mill/marked_sacks.webp`. Kanıtın yer ifadesi (`clueSpot`): "duvar dibindeki çuval yığınının arasında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from slightly above of a huge tumbled heap of half-open grain and flour sacks against the wooden wall of a medieval mill, with all sorts of things fallen among them. The heap fills the entire frame from edge to edge; only a strip of the plank wall shows at the top edge. No room, no open floor. Because the heap is so big, every object in it looks small. Dusty shafts of warm light.

This is where farmers drop their sacks and forget whatever they brought along, and the miller shoves everything aside onto the heap. Sacks lie torn and slumped, spilling grain, and between and on top of them lies a chaotic mess of belongings, tools and odds and ends, tipped over, at random angles. Not a single bit of bare floor is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the heap, an empty sack is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, grain.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, neat stacks of sacks, wide shot, room view, open floor, empty space, large objects, people, readable text, watermark, cartoon.
```

#### Değirmen taşı ve hazne (`grindstone`)

Dosya: `search-scenes/medieval/mill/grindstone.webp`. Kanıtın yer ifadesi (`clueSpot`): "değirmen taşının çevresindeki platformda".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from above, looking down at a steep angle, at the round wooden platform around the great millstone and its hopper. The platform fills the entire frame from edge to edge; only part of the millstone shows at one edge. No room, no open floor. Because the platform is so big, every object on it looks small. Dusty warm light.

The millers leave their tools, spare parts and lunch on the platform while they work, and nothing is ever put back. The whole platform is buried: things piled on top of each other, knocked over, at random angles, all dusted with flour. Not a single bit of bare board is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the mess, a sack is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, grain, flour.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, wide shot, room view, open floor, bare platform, large objects, people, readable text, watermark, cartoon.
```

#### Tavan arası merdiveninin altı (`stairs`)

Dosya: `search-scenes/medieval/mill/stairs.webp`. Kanıtın yer ifadesi (`clueSpot`): "tavan arası merdiveninin altındaki yığında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from slightly above into the dark space under the steep wooden stairs that lead up to the grain loft of a medieval mill. The heap under the stairs fills the entire frame from edge to edge; only a few slanted stair boards show at the top edge. No room, no open floor. Because the heap is so big, every object in it looks small. Warm light from one side, deep shadows between the objects.

Everything broken, spare or forgotten in the mill ends up under these stairs, and someone has just dug through it in a hurry. Everything lies in a chaotic heap several layers deep: things spilling out of crates and baskets, tipped over, at random angles. Not a single bit of bare floor is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the heap, a blanket is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, wide shot, room view, open floor, empty space, large objects, people, readable text, watermark, cartoon.
```

### Mezarlık (`graveyard`)

Aranabilir alanlar: `lantern`, `mausoleum`, `open_grave`. Sisli yol ve çarpık taşlar (`dead_trees`) aranmaz. Dışarısı olduğu için tarz paragrafı ay ışıklıdır.

#### Mezar başındaki fener (`lantern`)

Dosya: `search-scenes/medieval/graveyard/lantern.webp`. Kanıtın yer ifadesi (`clueSpot`): "mezar başındaki adakların arasında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: rough grey stone, moss, wet earth, cold blue moonlight mixed with the warm glow of a lantern, deep shadows, muted colors, soft painterly detail.

A view from above, looking down at a steep angle, at the base of an old mossy gravestone and the grave in front of it, with an oil lantern standing among the things. The grave fills the entire frame from edge to edge; only the bottom of the gravestone shows at the top edge. No sky, no path, no other graves. Because the grave is so big, every object on it looks small.

Mourners have left offerings and keepsakes on this grave for years, and the old gravedigger never clears them. The whole grave is covered: things piled on top of each other, sunk into the moss and earth, tipped over, at random angles, wax dripped over some of them. Not a single bit of bare earth is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. Ivy runs through the pile, a shawl is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax, dried flowers, stone.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, wide shot, landscape view, visible sky, other graves, bare earth, large objects, people, readable text, watermark, cartoon.
```

#### Türbenin ortasındaki taş adak levhası (`mausoleum`)

Dosya: `search-scenes/medieval/graveyard/mausoleum.webp`. Kanıtın yer ifadesi (`clueSpot`): "türbenin ortasındaki taş adak levhasında, adakların arasında". Önceki kare (nişli duvar) her nişe ayrı bir grup koyduğu için vitrin gibi çıktı; kare tepeden bakan düz bir levhaya çevrildi.

```
A detailed semi-realistic digital painting in a dark, moody medieval style: rough grey stone, moss, wet earth, cold blue moonlight mixed with the warm glow of a lantern, deep shadows, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of a long, wide, flat stone offering slab in the middle of an old family mausoleum. The slab top fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no walls, no burial niches, no room. Flat view, no perspective. Because the slab is so big, every object on it looks small. Light from a lantern and a few candle stubs standing among the things.

For centuries the family has laid grave goods and keepsakes on this slab, and grave robbers have just rummaged through it in a hurry. The whole slab is buried: things piled on top of each other, knocked over, lying at random angles, covered with dust, cobwebs and dead leaves. Not a single bit of bare stone is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A chain runs through the pile, a torn cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, silver, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, wax, dried flowers, stone.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, visible walls, burial niches, skeletons, skulls, bones of a body, bare stone, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```

#### Yosunlu antik lahit (`open_grave`)

Dosya: `search-scenes/medieval/graveyard/open_grave.webp`. Kanıtın yer ifadesi (`clueSpot`): "devrik kapaklı lahdin içinde".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: rough grey stone, moss, wet earth, cold blue moonlight mixed with the warm glow of a lantern, deep shadows, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, into a huge ancient stone sarcophagus whose cracked lid has been pushed aside. The inside of the sarcophagus fills the entire frame from edge to edge; only a strip of the mossy rim shows along the edges. Flat view, no perspective. Because the sarcophagus is so big, every object inside looks small.

The sarcophagus holds no body any more, only centuries of grave goods that grave robbers have rummaged through and thrown back in a hurry. Everything lies in a chaotic layer several deep: things piled on top of each other, tipped over, at random angles, covered with dust and dead leaves. Not a single bit of bare stone is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A chain runs through the pile, a rotten cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, silver, stone.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible sky, landscape view, bare stone, skeletons, bones of a body, large objects, people, readable text, watermark, cartoon.
```

### Çiftlik (`farm`)

Aranabilir alanlar: `tools`, `hay_bales`, `secret_chest`, `hayloft`. Çatı kirişindeki fener (`timber_roof`) aranmaz.

#### Alet tezgâhı (`tools`)

Dosya: `search-scenes/medieval/farm/tools.webp`. Kanıtın yer ifadesi (`clueSpot`): "ahırın alet tezgâhının üstünde, aletlerin arasında". Önceki kare (alet duvarı) seyrek ve sıralı çıktı; kare tepeden bakan bir iş tezgâhına çevrildi. İç mekândaki nokta aynı kalır (`tools`).

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of a huge old wooden workbench in a medieval barn. The bench top fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no walls, no room. Flat view, no perspective. Because the bench is so big, every object on it looks small. Warm light from a lantern and a candle stub standing among the mess.

Three generations of farmers have mended, sharpened and repaired everything on this bench and never cleared it: tools, spare parts, half-finished repairs, scraps and the farmhands' belongings. Everything is piled on top of each other, knocked over, lying at random angles, covered with sawdust and straw. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the mess, a sack is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, silver, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, rusty iron, straw, sawdust.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, visible walls, room view, bare bench surface, rows of tools, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```

#### Saman balyaları (`hay_bales`)

Dosya: `search-scenes/medieval/farm/hay_bales.webp`. Kanıtın yer ifadesi (`clueSpot`): "saman balyalarının arasında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from slightly above of a huge tumbled heap of broken hay bales and loose straw in a medieval barn, with all sorts of things fallen into it. The heap fills the entire frame from edge to edge; no floor, no walls, no room. Because the heap is so big, every object in it looks small. Warm light from a lantern.

The farmhands throw whatever they carry onto the hay when they rest, and it all sinks in and is forgotten. Between and on top of the straw lies a chaotic mess of belongings, tools, food and odds and ends, half sunk into the hay, tipped over, at random angles. More than two hundred objects in total; there is no area of plain straw without objects.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the heap, a cloak is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, straw, food.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, neat bales, wide shot, room view, open floor, large areas of plain straw, large objects, people, readable text, watermark, cartoon.
```

#### Sandık ve fıçılar (`secret_chest`)

Dosya: `search-scenes/medieval/farm/secret_chest.webp`. Kanıtın yer ifadesi (`clueSpot`): "açık oyma sandığın içinde".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, into a huge old carved wooden chest whose lid stands open, with the tops of barrels around it. The inside of the chest fills the entire frame from edge to edge; only a strip of its carved rim shows along the edges. Flat view, no perspective. Because the chest is so big, every object inside looks small.

The family has thrown everything precious and everything useless into this chest for years, and someone has just turned it over in a hurry. Everything lies in a chaotic layer several deep: things piled on top of each other, tipped over, at random angles. Not a single bit of the chest's bottom is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A belt runs through the pile, a shawl is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, silver.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, room view, empty chest bottom, large objects, people, readable text, watermark, cartoon.
```

#### Arka samanlık (`hayloft`)

Dosya: `search-scenes/medieval/farm/hayloft.webp`. Kanıtın yer ifadesi (`clueSpot`): "samanlığın tahta zeminindeki yığında". Önceki kare çok karanlıktı; ışık açıkça istendi, çatı kirişleri kareden çıkarıldı.

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A view from above, looking down at a steep angle, at the wooden floor of the hayloft in the back of a medieval barn, seen from about three meters away. The loft floor fills the entire frame from edge to edge; no roof, no beams, no walls, no ladder. Because the loft is so big, every object on it looks small. Bright warm golden daylight pours through gaps in the roof and lights the whole loft evenly: no deep shadows, no dark corners, every object is clearly visible and sharp, even in the corners and edges of the frame.

The loft is where the family has stored everything they could not throw away for decades, and someone has just searched through it in a hurry. Everything lies in a chaotic heap several layers deep with loose straw: things spilling out of baskets and bundles, tipped over, lying at random angles. Not a single bit of bare floor is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the heap, a blanket is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, silver, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, straw.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, dark, gloomy, deep shadows, dark corners, low contrast, wide shot, room view, visible roof, visible beams, open floor, empty space, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```


### Revir (`clinic`)

Aranabilir alanlar: `apothecary_table`, `shelves`, `exam_cot`, `fireplace`. Tavandan sarkan otlar (`herbs`) aranmaz: hepsi birbirine benzer demetler olurdu.

#### Hekim tezgâhı (`apothecary_table`)

Dosya: `search-scenes/medieval/clinic/apothecary_table.webp`. Kanıtın yer ifadesi (`clueSpot`): "hekimin tezgâhının üstünde".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of the village physician's huge old wooden work table. The table top fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no room. Flat view, no perspective. Because the table is so big, every object on it looks small. Warm candle light from among the mess.

The physician works here day and night and never clears anything away: remedies, instruments, ingredients and patients' belongings have piled up for years. Things lie on top of each other, knocked over, at random angles, stained with tinctures. Not a single bit of bare wood is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A bandage runs through the mess, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried herbs, powders, wax.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, room view, bare table surface, large objects, people, readable text, watermark, cartoon.
```

#### Ecza dolapları (`shelves`)

Dosya: `search-scenes/medieval/clinic/shelves.webp`. Kanıtın yer ifadesi (`clueSpot`): "ecza dolabının raflarında".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight frontal view of a huge old apothecary cabinet with many small shelves and cubbyholes. The cabinet fills the entire frame from edge to edge; the top and bottom edges of the image cut through the shelves. No room, no floor, no ceiling. Because the cabinet is so big, every object in it looks small.

Generations of village healers have crammed their remedies and odd collections into this cabinet. Every shelf is crammed full to bursting: things piled on top of each other, pushed in front of each other three deep, tipped over, at random angles, spilling over the edges. Containers are few and each is completely different in shape, size, color and material; most things are not containers at all but instruments, curiosities and belongings. Not a single bit of bare shelf board is visible anywhere. More than two hundred objects in total.

The objects are NOT displayed one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A string of dried roots runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried herbs, minerals.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects displayed separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, rows of jars, rows of bottles, matching jars, one object per compartment, empty shelf space, visible floor, visible ceiling, large objects, people, readable text, watermark, cartoon.
```

#### Deri muayene sediri (`exam_cot`)

Dosya: `search-scenes/medieval/clinic/exam_cot.webp`. Kanıtın yer ifadesi (`clueSpot`): "muayene sedirinin üstünde".

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of an old leather examination cot in a stone infirmary, covered with blankets and things. The cot fills the entire frame from edge to edge; the edges of the image cut through it. No floor, no room. Flat view, no perspective. Because the cot is so big, every object on it looks small.

After a long night of tending the sick, everything has ended up on the cot: blankets, instruments, remedies and the patients' forgotten belongings, piled on top of each other, tipped over, at random angles. Not a single bit of bare leather is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A bandage runs through the pile, a blanket is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried herbs.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible floor, room view, bare leather, patient, body, large objects, people, readable text, watermark, cartoon.
```

#### Taş ocak (`fireplace`)

Dosya: `search-scenes/medieval/clinic/fireplace.webp`. Kanıtın yer ifadesi (`clueSpot`): "revirin ocak rafında". Önceki kare sıralı ve seyrek çıktı: A kareyi daraltıp taşları tamamen örtmeyi ister, B tepeden bakan ocak taşlığıdır (tepeden bakış en iyi çalışan açı).

**A (önce bunu dene):**

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A tightly cropped straight frontal view of the wooden mantel shelf and the wall just above it, at the stone chimney of a small medieval infirmary, with two more wooden shelves fixed to the stones above the mantel, all studded with nails and iron hooks. The mantel and the shelves fill the entire frame from edge to edge; only a thin strip of glowing embers shows at the very bottom edge. No room, no floor, no ceiling, no hearth opening. Because the wall is so big, every object on it looks small.

The physician brews remedies here and hangs everything to dry or to keep warm, and nothing is ever taken down. The mantel and the shelves are crammed full to bursting, and everything in between hangs from nails and hooks so densely, overlapping each other, that not a single stone of the wall can be seen. Things are piled on top of each other, tipped over, dangling over the edges. Every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A rope runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, silver, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried herbs, powders.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, bare stone, visible stone wall, objects standing in a row on the mantel, visible floor, visible ceiling, room view, wide shot, empty shelf space, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```

**B (A olmazsa):**

```
A detailed semi-realistic digital painting in a dark, moody medieval style: old dark oak wood, rough grey stone, warm flickering candle light, deep brown and amber tones, muted colors, soft painterly detail.

A straight top-down view, looking directly down from above, of the broad stone hearth platform in front of the fireplace of a small medieval infirmary. The platform fills the entire frame from edge to edge; only a thin strip of glowing embers shows along the top edge. No walls, no room. Flat view, no perspective. Because the platform is so big, every object on it looks small.

The physician heats, dries and keeps everything warm on this platform, and nothing is ever put away. The whole platform is buried: things piled on top of each other, tipped over, lying at random angles, dusted with ash. Not a single bit of bare stone is visible anywhere; every gap is filled with smaller things. More than two hundred objects in total.

The objects are NOT laid out one by one: they are jammed together in tangled piles, every object touching and partly covering two or three others, so that most objects are only half visible. A bandage runs through the pile, a cloth is thrown over part of it, small things are stuck between bigger things.

MOST IMPORTANT: this is a jumble of DIFFERENT unrelated objects, like a junk shop or a lost-and-found chest. Every single object is a different kind of thing; there are never two objects of the same kind. Objects differ in shape, size, material and color: wood, iron, brass, copper, pewter, silver, leather, cloth, clay, glass, bone, wool, straw, parchment, horn, feathers, fur, dried herbs, powders, ash.

No people, no hands. Highest resolution, 16:9.
Avoid: repeated objects, several objects of the same kind, rows of similar objects, matching sets, objects laid out separately, museum display, neatly arranged, symmetric composition, still life, evenly spaced objects, perspective view, visible walls, visible floor in front, visible stone, bare platform, large objects, people, readable text, writing, letters, sealed envelopes, blood, watermark, cartoon.
```

