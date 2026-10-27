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

**Ortak tarz:** `detailed cinematic semi-realistic digital painting, interior of a hunter's log cabin in a snowbound northern town, thick log walls, furs and antlers, iron fittings, cold blue light outside and warm amber light inside, frosted windows, eye-level wide panoramic shot, 2.36:1`

| Oda | İstem (sahne kısmı) |
|---|---|
| `bedroom` | `a log cabin bedroom-study: a bed covered with heavy furs on the left, an investigation board with pinned notes and red strings on the log wall, a frosted window, a writing desk with a lantern and maps on the right, an iron-bound chest, a closed inner plank door on the far right leading to a hallway` |
| `kitchen` | `a log cabin kitchen: a cast-iron stove with a kettle in the middle, a heavy wooden table with a knife drawer on the left, dried meat and herbs hanging from the beams, a snow-dusted back door with a wooden bar on the right, a small frosted window` |
| `hallway` | `a narrow log cabin hallway: fur coats and snowshoes hanging on pegs, a bench with boots, doors to the bedroom and kitchen, the heavy front door with an iron latch at the end, worn creaking floorboards with melted snow` |
| `doorstep` | `outside the cabin at the front door: snow-covered wooden steps, a lantern by the door, deep snow in the yard, pine trees and a path into the dark forest, fresh untouched snow that would hold footprints` |

---

## Görseller gelince (kod tarafı)

- `frontend/src/config/homeConfig.ts`: yeni yatak odasının görseli, nesne alanları (`spots`) ve karakterin durduğu nokta beş evren için yeniden ayarlanır.
- Baskın sahnesi odaları bu dosyalardan okur. Görsel yoksa yer tutucu olarak yatak odası (bugünkü ev görseli) gösterilir.
