# Karakter Konseptleri

Gardıropta 16 tam karakter var. Her karakter baştan sona tek bir görsel setidir; parça parça giydirme yok. Karakter listesi, adlar, nadirlikler ve fiyatlar `frontend/src/config/outfits.ts` ile aynıdır (id = klasör adı).
Akış: Gemini referans görseli → görselden 3D → Mixamo (iskelet + yürüme/durma) → Blender render → `frontend/public/characters/<id>/`.

| id | Ad | Nadirlik | Fiyat | Tema |
|---|---|---|---|---|
| `engizitor` | Engizitör | yaygın | ücretsiz | Ortaçağ / Ashenmoor |
| `engizitor_hanim` | Engizitör Hanım | yaygın | ücretsiz | Ortaçağ, kilise arşivi |
| `sokak_kurdu` | Sokak Kurdu | yaygın | 500 | Günümüz sokak dedektifi |
| `sis_dedektifi` | Sis Dedektifi | nadir | 700 | Viktorya dönemi |
| `sehir_dedektifi` | Şehir Dedektifi | nadir | 700 | Kırklı yıllar |
| `golge_ajan` | Gölge Ajan | nadir | 700 | Modern, taktik birim |
| `kara_yargic` | Kara Yargıç | nadir | 900 | Gotik, gece avcısı |
| `kul_avcisi` | Kül Avcısı | nadir | 900 | Gotik avcı |
| `kizil_devre` | Kızıl Devre | efsanevi | 1200 | Neon Prime, paralı asker |
| `mavi_rozet` | Mavi Rozet | efsanevi | 1200 | Neon Prime, polis |
| `neon_kuzgun` | Neon Kuzgun | efsanevi | 1200 | Neon Prime, Bölge 13 |
| `yesim_hekim` | Yeşim Hekim | efsanevi | 1200 | Jinling, saray hekimi |
| `kar_kahini` | Kar Kâhini | efsanevi | 1200 | Frosthold, kuzey kâhini |
| `ayaz_izcisi` | Ayaz İzcisi | nadir | 900 | Frosthold, sur gözcüsü |
| `gece_muhabiri` | Gece Muhabiri | nadir | 700 | Millfield, 90'lar muhabiri |
| `ak_turna` | Ak Turna | yaygın | 500 | Jinling, tapınak bilgini |

Oyundan çıkarılan 4 karakterin (`kizil_yemin`, `jinling_golgesi`, `krom_serif`, `kizil_lotus`) görsel dosyaları `art/` ve `frontend/public/` altında yerinde duruyor, kodda kullanılmıyor.

Yetenek ve hikâye tasarımı: yerel `KARAKTER_YETENEKLERI.md` (git dışı).

## Malzeme ayarı

Görselden-3D araçları bazı karakterlerde fazla parlak lake/vinil üretir. `art/tools/render_character.py` içindeki `OUTFIT_TWEAKS` karakter başına pürüzlülük, metal ve taban rengini bellekte düzeltir; kaynak GLB'ye dokunmaz. `render_character.py`, `export_web_model.py` ve `render_preview.py` aynı ayarı kullanır. Tanımlı olanlar: `kara_yargic` (mat, koyu kömür/kahve), `kul_avcisi`, `kizil_devre`, `engizitor_hanim` (hafif mat; renkler korunur), `mavi_rozet` (göğüs yamasındaki bozuk yazıyı dokudan siler, `erase`). `neon_kuzgun` parçalı modeldir ve pürüzlülüğü zaten sabit 0,9; parlaklığı dokuya pişmiş olduğundan bu yöntemle düzelmez.

## Yeniden üretim

`art/tools/rebuild_character.sh <id> [--pose] [--sprites]` bir karakterin web GLB'sini, thumb/portrait'ini ve (istenirse) sprite'larını baştan üretir. `--pose` gardırop duruşunu `art/characters/<id>/source/<id>_pose.fbx` klibinden alır; harita sprite'ları idle klibinden üretilmeye devam eder. Malzeme ayarı ya da yürüme/durma klibi değiştiyse `--sprites` gerekir.

## Tasarım kuralları

- Etek, palto ve tunik en fazla diz hizasında bitsin, yırtmaçlı olsun. Yere kadar uzanan kumaş yürürken bacaklarla bölünür.
- Elde nesne olmasın. Gerekirse kemere asılı olsun.
- Uçuşan pelerin ve atkı olmasın. Kısa, sert omuz pelerini sorun değil.
- Tek baskın renk ve tek vurgu rengi kullanılsın. Karakter haritada ~80 px boyunda görünür.
- Bütün karakterler aynı vücut oranında olsun; aynı iskelet ve animasyon hepsine oturur.

## Gemini referans görselleri

- Her karakter için 3 görsel: `<id>_front.png`, `<id>_back.png`, `<id>_side.png` (sol profil). Klasör: `art/characters/<id>/ref/`.
- En-boy oranı 2:3 dikey (en az 1024×1536). Tam boy, ortalanmış; karakter yüksekliğin ~%85'ini kaplar.
- A-poz (kollar gövdeden 30–40° açık) ya da T-poz, düz açık gri arka plan (`#D9D9D9`), düz ve gölgesiz ışık. Model T-poz görselden üretilirse Mixamo eklemleri daha kolay yerleştirir; arka/yan görünüm de aynı pozda olmalı.
- Kollar gövdeden ve paltodan net ayrılsın; kalçada çanta gibi kolla bacak arasında kalan eşya olmasın (görselden-3D aracı birleştirir).

## Oyun içi çıktı (Blender render)

- Harita: 8 yön × 12 kare yürüme, 8 yön × 8 kare durma; kare 192×256 px.
- Menü 360°: 72 kare, kare 512×640 px.
- Market kartı: 512×512 px, 3/4 açı.
