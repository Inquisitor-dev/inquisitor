# Oyuncunun Evi: Oda Görselleri (Çizim İstemleri)

Gece baskını için oyuncunun evi dört odadan oluşuyor: **yatak/çalışma odası**, **mutfak**, **koridor** ve **kapı önü**. Her evren için dört görsel gerekiyor: 5 evren × 4 oda = **20 görsel**. Kararlar `docs/v3-persona-tasarimi.md`'de.

Yeni yatak odası bugünkü ev görselinin yerini alır. Bugünkü görsel tek odalı bir kulübe gibi duruyor; kapısı doğrudan dışarı açılıyor. Dört oda aynı evin parçaları gibi görünmeli.

## Genel kurallar

- **Boyut:** 3168×1344 (yaklaşık 2.36:1, geniş panorama). Bugünkü ev görselleriyle aynı. Oran bozulmamalı; ekran görseli yana kaydırıyor.
- **Tarz:** bugünkü ev görselleriyle aynı. Ayrıntılı, sinematik, yarı fotogerçekçi dijital resim; göz hizasında, karşıdan çekilmiş geniş iç mekân çekimi.
- **Işık:** **gündüz** ya da loş akşam ışığı. Gece etkisi (karanlık, lamba ışığı) oyunda CSS ile verilir; görseli gece üretmek gerekmez.
- **İnsan yok.** Oyuncunun karakteri oyunda ayrıca çiziliyor.
- **Okunabilir yazı yok.** Pano kâğıtları ve tabelalar okunamaz olmalı.
- **Zemin:** karenin alt %20'si zemin olmalı; karakter oraya basacak.

### Üretim yöntemi

1. Önce evrenin **yatak odasını** üret.
2. Beğenilen yatak odasını aracın **referans görsel** (image-to-image ya da stil referansı) özelliğine verip diğer üç odayı onunla üret. Malzeme, renk ve ışık aynı kalmalı; ayrı ayrı sıfırdan üretilen odalar aynı ev gibi durmuyor.
3. Dosya adları: `frontend/public/backgrounds/home_<evren>_<oda>.webp`. Oda adları: `bedroom`, `kitchen`, `hallway`, `doorstep`. WebP kalite 85 yeterli.

### Her istemin sonuna eklenecek negatif istem

```
people, person, character, figure, face, readable text, letters, words, watermark, logo, blood, gore, weapon on display, cartoon, anime, flat illustration, fisheye, extreme wide angle distortion
```

### Odaların içeriği (bütün evrenlerde aynı iskelet)

| Oda | Mutlaka bulunacaklar | Yerleşim |
|---|---|---|
| Yatak odası | Yatak (sol), soruşturma panosu (kâğıtlar ve kırmızı iplerle, sol-orta), pencere (orta), çalışma masası ve sandalye (sağ-orta), sandık (sağ), lamba ya da mum (yatağın yanında), koridora açılan iç kapı (en sağ) | Bugünkü ev görseliyle aynı düzen; nesnelerin ekrandaki yerleri az değişsin |
| Mutfak | Ocak ya da fırın (orta), bıçak çekmecesi olan tezgâh (sol), arka kapı (sağ), küçük bir pencere | Arka kapı belirgin olmalı |
| Koridor | Dar bir geçit, iki yanda kapılar (yatak odası, mutfak), dış kapıya giden yol, asılı palto ya da portmanto, merdiven ya da gıcırdayan döşeme hissi | Derinliği olan, ortadan uzaklaşan bir geçit |
| Kapı önü | Evin dışı: ön kapı ve basamaklar, avlu ya da sokak, karanlığa uzanan bir yol | Kaçan saldırganın izi burada bulunacak; zemin (çamur, kar, ıslak taş) iz tutacak kadar belirgin |

---

## Ortaçağ: Ashenmoor (`medieval`)

**Ortak tarz:** `detailed cinematic semi-realistic digital painting, interior of a small medieval timber-and-stone cottage at the edge of a village graveyard, rough wooden beams, thatched roof underside, stone walls, worn plank floor, warm muted earthy colors, soft daylight through small windows, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `a cozy cramped bedroom-study: a wooden bed with a fur blanket on the left, a large investigation board with pinned sketches and red strings on the wall, a stone fireplace with an iron pot in the middle, a small window, a writing desk with candles, books and a chair on the right, an old iron-bound chest, a closed inner wooden door on the far right leading to a hallway` |
| `kitchen` | `a small medieval cottage kitchen: a stone hearth with a cooking fire and hanging pots in the middle, a wooden worktable with a drawer of knives on the left, herbs and garlic hanging from the beams, a heavy back door with an iron latch on the right, a small shuttered window` |
| `hallway` | `a narrow cottage hallway with a creaking plank floor, a steep wooden ladder-staircase to the loft, a cloak and hat hanging on wooden pegs, two inner doors on the sides, the heavy front door at the end, a candle in a wall niche` |
| `doorstep` | `outside the cottage at the front door: worn stone steps, a muddy yard with a picket fence, a lantern hanging by the door, a path leading into the misty village graveyard and dark trees, soft mud that would hold footprints` |

## Modern: Millfield, Kentucky 1994 (`modern`)

**Ortak tarz:** `detailed cinematic semi-realistic digital painting, interior of a small rented house in a 1994 American small town, wood paneling, patterned wallpaper, worn carpet and linoleum, 90s furniture, warm desaturated colors, soft afternoon light through blinds, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `a small bedroom used as a home office: an unmade bed on the left, a cork investigation board with photos, newspaper clippings and red string, a window with blinds, a desk with a typewriter, a lamp and file folders on the right, a metal footlocker, a closed inner door on the far right leading to a hallway` |
| `kitchen` | `a small 90s kitchen: an old gas stove in the middle, a counter with a knife drawer on the left, a fridge with magnets, a back door with a small window and a chain lock on the right, a wall phone with a coiled cord` |
| `hallway` | `a narrow carpeted hallway with wood paneling, coats hanging on a coat rack, framed photos on the wall, doors to the bedroom and kitchen on the sides, the front door with a frosted glass pane at the end, a squeaky floorboard look` |
| `doorstep` | `outside the house at the front door: a small wooden porch with a screen door, a porch light, a lawn and a gravel driveway, a quiet street with a sodium street lamp, damp grass and soft dirt that would hold footprints` |

## Cyberpunk: Neon Prime (`cyberpunk`)

**Ortak tarz:** `detailed cinematic semi-realistic digital painting, interior of a cramped capsule apartment in a rainy neon megacity, metal panels, exposed cables and pipes, LED strips, teal and magenta accents, soft grey daylight through rain-streaked glass, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `a capsule bedroom-office: a recessed bunk bed with warm LED trim on the left, a wall-mounted investigation board with photos and red strings, a large rain-streaked window with the city outside, a desk with several monitors and a chair on the right, a metal equipment case, a sliding inner door on the far right leading to a corridor` |
| `kitchen` | `a tiny capsule kitchen: an induction cooktop and a noodle cooker in the middle, a steel counter with a magnetic knife strip and a drawer on the left, a vending-style food dispenser, a narrow service door with a keypad on the right, flickering neon through a small window` |
| `hallway` | `a narrow metal corridor inside the apartment: cable bundles along the ceiling, a coat hanging on a hook, sliding doors to the bedroom and kitchen, the armored front door with a keypad at the end, grated floor panels` |
| `doorstep` | `outside the apartment door in a wet back alley: a metal stair landing, holographic signs without readable text, puddles reflecting neon, steam from vents, an alley disappearing into darkness, wet grime that would hold footprints` |

## Çin: Jinling (`china`)

**Ortak tarz:** `detailed cinematic semi-realistic digital painting, interior of a traditional Chinese courtyard house, dark wooden lattice screens, paper windows, red lacquer accents, stone floor tiles, hanging lanterns, warm muted colors, soft daylight through paper screens, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `an inspector's bedroom-study: a low wooden bed with silk covers on the left, an investigation board of pinned paper notes and red threads on a wooden frame, a round lattice window, a writing desk with brushes, ink stone and scrolls on the right, a lacquered chest, a sliding lattice door on the far right leading to a veranda corridor` |
| `kitchen` | `a traditional kitchen: a brick stove with a large wok and steaming bamboo baskets in the middle, a wooden chopping table with a cleaver drawer on the left, hanging dried herbs and peppers, a back door to a narrow yard on the right, a paper window` |
| `hallway` | `a covered wooden veranda corridor along the inner courtyard: lattice doors to the rooms, a robe hanging on a stand, red lanterns, the courtyard garden visible through the railing, the front gate at the end, creaking wooden boards` |
| `doorstep` | `outside the house at the front gate: stone steps, a red gate with lanterns, a narrow lane with grey brick walls, a willow tree, packed earth and wet stone that would hold footprints` |

## Kış: Frosthold (`winter`)

İlk istemler ("hunter's log cabin") modern bir av kulübesi çağrıştırdı; görseller tüfek, mont ve kar ayakkabısıyla geldi. Bu sürümde çağ en başta söyleniyor (erken ortaçağ, kuzey hanedanı), ev ahşap kulübe yerine bir kale kasabasındaki taş ve kalın kereste evi, ve modern eşyalar negatif isteme açıkça yazıldı. Bilinen bir dizinin adını isteme yazma; araç onun sahnelerini kopyalamaya çalışır ya da isteği reddeder. Havayı tarif etmek yeter.

**Ortak tarz:** `early medieval northern Europe, around the 10th century, no modern objects. Detailed cinematic semi-realistic digital painting, interior of a stern stone-and-timber house inside the walls of a grim northern castle town in endless winter, rough grey stone walls, massive dark oak beams blackened by smoke, wolf and bear pelts, heavy hand-forged iron, woven wool tapestries, tallow candles and iron braziers, a cold grey-blue light through small deep-set windows with wooden shutters, warm firelight inside, austere, harsh and solemn mood, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `a lord's investigator's bedchamber and study: a heavy carved wooden bed piled with wolf pelts and wool blankets on the left, a large wooden board on the stone wall with pinned parchment sketches and red threads, a deep stone fireplace with a low fire in the middle, a small deep-set window with open wooden shutters and snow on the sill, a rough oak writing table with tallow candles, a quill, parchment rolls and a wax seal on the right, a wooden stool, an iron-bound oak chest, a closed heavy plank door with iron straps on the far right leading to a passage` |
| `kitchen` | `a medieval stone kitchen: a wide open hearth with a fire, an iron cauldron on a chain and a spit in the middle, a long scarred oak table with a drawer of plain iron knives on the left, salted meat, dried fish and herbs hanging from the smoke-black beams, clay jugs, wooden bowls and a bread trough, a low heavy back door barred with a thick wooden beam on the right, snow drifted against it, a narrow shuttered window` |
| `hallway` | `a narrow stone passage inside the house: a hooded wool cloak lined with fur and a leather belt hanging on wooden pegs, a wooden bench with worn leather boots, an iron candle sconce on the wall, heavy plank doors to the bedchamber and kitchen on the sides, a steep stone stair going up, the massive iron-banded front door with a crossbar at the end, uneven flagstones wet with melted snow` |
| `doorstep` | `outside the house at the front door inside a snowbound medieval castle town: worn stone steps under a small timber porch, an iron lantern with a candle hanging by the door, a narrow lane of grey stone houses with steep snow-laden roofs, the dark castle wall and a square tower in the distance, smoke rising from chimneys, a few bare trees, fresh deep snow on the lane that would hold footprints` |

**Kış için ek negatif istem** (genel negatif istemin sonuna ekle):

```
rifle, gun, musket, firearm, modern jacket, parka, puffer coat, zipper, snowshoes, skis, ski poles, glass light bulb, electric lamp, kerosene lantern, oil lamp with glass chimney, plastic, metal stove, cast-iron stove, log cabin, hunting lodge, cowboy, 19th century, modern furniture, sofa, armchair, photograph, framed picture
```

---

## Kod tarafı (yapıldı)

- 20 görsel `frontend/public/backgrounds/home_<evren>_<oda>.webp` olarak eklendi (WebP kalite 85); eski tek odalı `home_<evren>.webp` görselleri kaldırıldı.
- `frontend/src/config/homeConfig.ts`: ev ekranı yatak odası görselini kullanıyor; nesne alanları (`spots`) ve karakterin durduğu nokta beş evren için yeni görsellere göre ayarlandı. Bir odanın görseli `getHomeRoomImage(evren, oda)` ile alınır.
- Baskın sahnesi (`components/RaidScene`) her odayı kendi görseliyle gösteriyor; gece etkisi CSS ile veriliyor.
