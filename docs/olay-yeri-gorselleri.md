# Olay Yeri Görselleri — Çizim İstemleri

Her evrende 5 olay yeri var. Her olay yeri için **2 görsel** gerekiyor: **düzenli** (`_tidy`) ve **dağınık** (`_messy`). Toplamda 5 evren × 5 mekân × 2 = **50 görsel**.

Neden iki görsel? Vaka kodla planlanırken olay yerinin görünümü de seçiliyor (`caseFacts.sceneState`: MESSY/TIDY). Oyuncu bunu olay yerinde görüp kendisi yorumlamalı, o yüzden resim de bu görünüme uymalı.

## Genel kurallar

- **Boyut:** 1672×941 (16:9). Mevcut diyalog arka planlarıyla aynı. Daha büyük üretilirse oranı bozmadan küçültülür.
- **Tarz:** mevcut diyalog görselleriyle aynı. Sinematik, fotogerçekçi, karanlık ve loş ışık, film karesi.
- **Kompozisyon (önemli):** sohbet penceresi ekranın alt %45'ini kapatıyor.
  - Beden karenin **ortasında**, yüksekliğin yaklaşık **%35–50**'si arasında, orta planda olmalı.
  - Kamera göz hizasının biraz üstünde ve hafifçe aşağı bakmalı.
  - Alt kısım sadece zemin olmalı; önemli bir ayrıntı oraya konmamalı.
- **Beden:** her evrende aynı tarif kullanılır, tutarlılık için değiştirilmez.
  - Yüzüstü yatar, baştan ayağa örtülüdür, örtünün altındaki şekil belirsizdir.
  - Görünmemesi gerekenler: yüz, el, saç, kan, yara, silah, takı.
- **Canlı insan yok.** Sahnede başka karakter olmasın.
- **Yazı yok.** Yapay zekâ yazıları bozuk çiziyor; şerit ve tabelalar okunamaz olmalı.

### Üretim yöntemi

1. Önce **düzenli** hali üret (aşağıdaki istem).
2. Beğenilen görseli aracın **düzenleme / image-to-image** özelliğine ver ve "Dağınık hali" istemini uygula. Kamera, ışık ve beden aynı kalmalı, sadece eşyalar devrilmeli. İki görsel ayrı ayrı sıfırdan üretilirse oyunda aynı yer gibi durmazlar.
3. Dosya adı: `frontend/public/crime-scenes/<evren>/<mekan-id>_tidy.webp` ve `..._messy.webp`. WebP kalite 85 yeterli.

### Her istemin sonuna eklenecek negatif istem

Aracın negatif istem alanı varsa oraya, yoksa istemin sonuna `Avoid:` ile ekle:

```
visible face, hands, fingers, hair, blood, blood pool, gore, wounds, weapon, knife, rope, noose, jewelry, dress, skirt, high heels, living people, bystanders, readable text, letters, watermark, logo, cartoon, illustration, 3d render
```

---

## Ortaçağ — Ashenmoor (`medieval`)

**Beden tarifi:** `a lifeless body lying face down on the ground, completely covered from head to ankles by a coarse, undyed, dirt-smudged linen sheet; the shape beneath is shapeless and ambiguous; only the toes of two plain, worn, dark leather boots stick out from under the sheet`

**Ortak tarz:** `cinematic photorealistic film still, dark medieval village, 16:9, slightly elevated camera looking down, the covered body lies in the mid-ground at the center of the frame, lower part of the frame is empty ground, moody low-key lighting, high detail, muted earthy colors`

| id | Ad | Düzenli hali (istemin sahne kısmı) | Dağınık hali (düzenleme istemi) |
|---|---|---|---|
| `well` | Köy Kuyusu | `a small cobbled village square around an old stone well with a wooden winch and a hanging bucket, timber houses with shuttered windows, dusk, cold blue light with a few warm lantern glows, a wooden bucket standing neatly by the well` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the bucket knocked over and spilled water on the cobbles, the winch rope tangled, a broken clay jug, a toppled wooden bench` |
| `bridge` | Taş Köprü | `an old moss-covered stone arch bridge over a dark slow river, mist over the water, bare trees, late evening, a lantern resting upright on the bridge parapet, the covered body lies on the bridge deck` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the lantern fallen and cracked, scattered stones knocked from the parapet, a torn sack spilling grain, muddy scuff marks` |
| `forest_path` | Orman Patikası | `a narrow muddy forest path between tall dark pines, thick fog, roots across the path, a fallen log neatly at the side, grey morning light filtering through the trees` | `same image, same camera, same lighting, same covered body; add signs of a struggle: snapped branches, a torn basket with spilled mushrooms and herbs, churned mud and deep scuff marks, a dropped walking stick` |
| `watchtower` | Yıkık Gözcü Kulesi | `inside the ruined ground floor of an old stone watchtower, collapsed roof showing a cloudy sky, ivy on the walls, a cold fire pit with neatly stacked firewood, pale overcast light` | `same image, same camera, same lighting, same covered body; add signs of a struggle: scattered firewood, an overturned iron pot with ash spilled, a fallen wooden ladder, loose stones on the floor` |
| `stable` | Terk Edilmiş Ahır | `an abandoned wooden stable with empty stalls, straw on the floor, rusty tools hung neatly on the wall, shafts of dusty light through gaps in the planks` | `same image, same camera, same lighting, same covered body; add signs of a struggle: tools fallen from the wall, a broken stall gate, straw kicked around, an overturned feed trough` |

## Modern — Millfield, Kentucky 1994 (`modern`)

**Beden tarifi:** `a lifeless body lying face down, completely covered from head to ankles by a plain white sheet; the shape beneath is shapeless and ambiguous; only the toes of two plain, worn black work boots stick out; small yellow numbered evidence markers on the ground nearby; yellow police tape in the background without readable text`

**Ortak tarz:** `cinematic photorealistic film still, small American town in 1994, 90s crime drama look, 16:9, slightly elevated camera looking down, the covered body lies in the mid-ground at the center of the frame, lower part of the frame is empty ground, moody night lighting with a faint red and blue police light glow, high detail, film grain`

| id | Ad | Düzenli hali | Dağınık hali |
|---|---|---|---|
| `laundromat` | Çamaşırhane | `inside a small 90s laundromat at night, rows of washing machines, buzzing fluorescent lights, plastic chairs in a neat row, folded laundry on a table` | `same image, same camera, same lighting, same covered body; add signs of a struggle: an overturned laundry basket with clothes scattered, a knocked over plastic chair, spilled detergent powder, a dented machine door hanging open` |
| `bleachers` | Lise Tribünleri | `under the metal bleachers of a small-town high school football field at night, stadium lights in the distance, gravel and weeds, a closed thermos and a folded blanket set neatly on a bench` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the thermos spilled, the blanket thrown on the gravel, crushed soda cans, a bent railing` |
| `rail_crossing` | Tren Geçidi | `a rural railroad crossing at night, crossbuck sign and warning lights, gravel ballast and rails, tall grass, a pickup truck parked neatly far in the background` | `same image, same camera, same lighting, same covered body; add signs of a struggle: shattered glass on the gravel, a dropped flashlight still glowing, deep tire skid marks, a torn jacket on the rails` |
| `lake_dock` | Göl İskelesi | `an old wooden boat dock on a misty lake at dawn, a small rowboat tied up, fishing rods leaning neatly against a post, a tackle box closed` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the tackle box spilled open with lures scattered, a fishing rod snapped, a broken plank, the rowboat drifting with a loose rope` |
| `drive_in` | Kapanmış Açık Hava Sineması | `an abandoned drive-in movie theater lot at night, a large blank weathered screen, rusty speaker poles, cracked asphalt with weeds, a projection booth with a dim light` | `same image, same camera, same lighting, same covered body; add signs of a struggle: a speaker pole knocked over with its cable torn, broken glass, scattered popcorn boxes and paper, an open car door in the background` |

## Cyberpunk — Neon Prime (`cyberpunk`)

**Beden tarifi:** `a lifeless body lying on the ground inside a closed matte black body bag, zipped shut, with a small glowing orange seal tag on the zipper; nothing of the body is visible; a holographic police barrier line glows in the background without readable text`

**Ortak tarz:** `cinematic photorealistic film still, dense cyberpunk megacity, 16:9, slightly elevated camera looking down, the body bag lies in the mid-ground at the center of the frame, lower part of the frame is empty wet ground, neon magenta and cyan reflections, rain haze, high detail`

| id | Ad | Düzenli hali | Dağınık hali |
|---|---|---|---|
| `rooftop` | Çatı Katı | `a high-rise rooftop at night among huge neon billboards, humming air conditioning units, puddles on the roof, a drone landing pad, cables neatly bundled` | `same image, same camera, same lighting, same body bag; add signs of a struggle: a crashed delivery drone in pieces, cables torn and sparking, a knocked over metal crate, shattered glass in the puddles` |
| `metro` | Metro Peronu | `an empty maglev metro platform late at night, flickering holographic timetables without readable text, tiled walls, a vending machine glowing, benches in a neat row` | `same image, same camera, same lighting, same body bag; add signs of a struggle: the vending machine smashed with cans rolling, a bench torn from its bolts, shattered holo-panel, scattered transit cards` |
| `back_alley` | Neon Arka Sokak | `a narrow back alley between towering buildings, neon signs without readable text, steaming vents, dumpsters closed and lined up, rain dripping from fire escapes` | `same image, same camera, same lighting, same body bag; add signs of a struggle: a dumpster tipped over with trash spilled, broken neon tube on the ground, a dented metal door, scattered cyberware parts` |
| `data_center` | Terk Edilmiş Veri Merkezi | `an abandoned data center, long rows of dark server racks, a few blinking status lights, cold blue emergency lighting, cables neatly routed overhead` | `same image, same camera, same lighting, same body bag; add signs of a struggle: a server rack toppled, cables ripped out and hanging, shattered drive bays, sparks on the floor` |
| `capsule_hotel` | Kapsül Otel Koridoru | `a narrow capsule hotel corridor, two stacked rows of sleeping pods with soft blue lights, closed pod doors, a polished floor, a small shoe rack neatly filled` | `same image, same camera, same lighting, same body bag; add signs of a struggle: a pod door torn open and hanging, shoes scattered, a cracked control panel sparking, a pillow and blanket thrown on the floor` |

## Çin — Jinling, Hanedan Dönemi (`china`)

**Beden tarifi:** `a lifeless body lying face down on the ground, completely covered from head to ankles by a plain white mourning cloth; the shape beneath is shapeless and ambiguous; only the toes of two plain black cloth shoes stick out`

**Ortak tarz:** `cinematic photorealistic film still, ancient Chinese dynasty city, wuxia film look, 16:9, slightly elevated camera looking down, the covered body lies in the mid-ground at the center of the frame, lower part of the frame is empty ground, moody dusk lighting with warm paper lantern glow, high detail`

| id | Ad | Düzenli hali | Dağınık hali |
|---|---|---|---|
| `market_square` | Pazar Meydanı | `a closed market square at dusk, wooden stalls with folded cloth awnings, red paper lanterns, stone paving, baskets stacked neatly` | `same image, same camera, same lighting, same covered body; add signs of a struggle: a stall overturned, baskets spilled with vegetables and fruit, a torn lantern on the ground, scattered coins` |
| `canal_bridge` | Kanal Köprüsü | `a curved stone bridge over a narrow canal, willow branches hanging, moored wooden boats, lantern reflections on the water, misty evening` | `same image, same camera, same lighting, same covered body; add signs of a struggle: a broken lantern floating in the water, a snapped oar, a torn parasol, scuff marks on the stone` |
| `bamboo_grove` | Bambu Korusu | `a dense bamboo grove with a narrow stone path, fog, pale green light, a small stone lantern standing upright` | `same image, same camera, same lighting, same covered body; add signs of a struggle: several bamboo stalks snapped, the stone lantern knocked over, a dropped straw hat, trampled leaves` |
| `dye_workshop` | İpek Boyahanesi | `the courtyard of a silk dyeing workshop, long strips of indigo and crimson silk hanging on bamboo poles, large wooden dye vats, wet stone floor` | `same image, same camera, same lighting, same covered body; add signs of a struggle: silk strips torn down and lying in puddles, a dye vat tipped over with dark indigo dye spilled (not red), a broken bamboo pole` |
| `lotus_pavilion` | Lotus Köşkü | `a small wooden pavilion in an imperial garden beside a lotus pond, curved roof, red pillars, a stone table with a tea set arranged neatly, evening` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the tea set smashed on the floor, a stool overturned, a torn silk fan, scattered lotus petals` |

## Kış — Frosthold (`winter`)

**Beden tarifi:** `a lifeless body lying face down, completely covered from head to ankles by a heavy grey fur blanket dusted with fresh snow; the shape beneath is shapeless and ambiguous; only the toes of two plain fur-lined boots stick out`

**Ortak tarz:** `cinematic photorealistic film still, harsh northern frontier, viking and nordic look, 16:9, slightly elevated camera looking down, the covered body lies in the mid-ground at the center of the frame, lower part of the frame is empty snow, cold blue light, drifting snow, high detail`

| id | Ad | Düzenli hali | Dağınık hali |
|---|---|---|---|
| `frozen_pass` | Donmuş Geçit | `a narrow windswept mountain pass between icy cliffs, deep snow, a single line of footprints, pale overcast light` | `same image, same camera, same lighting, same covered body; add signs of a struggle: churned snow with many trampled footprints, a broken spear shaft (no blade), a torn travel pack with supplies scattered` |
| `frozen_lake` | Buzlu Göl | `the edge of a frozen lake surrounded by dark pines, cracked ice near the shore, a small ice-fishing hole with a wooden stool beside it, twilight` | `same image, same camera, same lighting, same covered body; add signs of a struggle: the stool overturned, cracks spreading in the ice, a dropped fishing line and net, scattered fish on the snow` |
| `hunter_hut` | Avcı Kulübesi | `inside a small log hunter's hut, a cold hearth, pelts hung neatly on the walls, snow drifting in through the open door, a wooden table with tools in order` | `same image, same camera, same lighting, same covered body; add signs of a struggle: pelts torn from the walls, the table overturned, tools scattered, the door hanging off one hinge` |
| `standing_stones` | Taş Dikitler | `a circle of ancient standing stones on a snowy hilltop, carved runes without readable text, a cold wind, low grey clouds` | `same image, same camera, same lighting, same covered body; add signs of a struggle: a toppled offering bowl, scattered bones and antlers from an offering, a fallen torch, trampled snow` |
| `storehouse` | Erzak Ambarı | `inside a timber storehouse, barrels and sacks of grain stacked neatly, dried meat hanging from beams, thin light through the gaps, frost on the walls` | `same image, same camera, same lighting, same covered body; add signs of a struggle: barrels knocked over and rolled, a sack split with grain spilled, dried meat fallen from the beams, a broken lantern` |

---

## Kontrol listesi (her görsel için)

- [ ] Yüz, el, saç, kan ve silah görünmüyor.
- [ ] Bedenin cinsiyeti anlaşılmıyor.
- [ ] Beden karenin ortasında ve alt %45'in üstünde.
- [ ] Canlı insan ya da okunur yazı yok.
- [ ] Düzenli ve dağınık hal aynı kamera açısında; yan yana konunca aynı yer gibi duruyor.
