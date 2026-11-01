# Arama sahnesi üretimi

Mekân aramasının (tıkla-bul) dağınık görsellerini Gemini'ye tek parça çizdirmek yerine kodla kurar:
nesneler ayrı ayrı üretilip kesilir, boş bir yüzeyin üstüne dizilir. Böylece listedeki her nesne sahnede bir
kez bulunur, her tohumla başka bir diziliş çıkar ve kutularla piksel maskesi kendiliğinden hesaplanır
(elle işaretleme yok). Oyundaki kurallar için `backend/CLAUDE.md` (search) ve `docs/nesne-arama-tasarimi.md`.

## Klasörler

| Yol | İçerik |
|---|---|
| `istemler/` | Gemini istemleri: `sayfaN.txt` (10'ar hedef nesne), `dolgu1.txt` (kırıntı, para…), `ortu1.txt` (bez, çorap…), `masa.txt` (boş yüzey) |
| `kaynak/` | Üretilen sayfalar ve masa (`.webp`) |
| `nesneler/` | Kesilmiş saydam nesneler (`<id>.webp`) |
| `nesneler.json` | Nesne kataloğu: ad, gerçek boyut (cm), masadan yükseklik (cm), tür, sayfa |
| `cikti/` | Deneme sahneleri ve kontrol görselleri (depoya girmez) |

## Kurulum

Node 18+ ve Python 3.10+:

```bash
python -m pip install -r tools/arama-sahne/requirements.txt
```

`uret.mjs` anahtarı `GEMINI_API_KEY` ortam değişkeninden, yoksa `backend/.env`'den okur. Görsel üretimi
ücretlidir (2K görsel başına yaklaşık 0,13 $) ve aynı anahtar oyunun kotasıyla ortaktır; toplu üretim için
ayrı bir anahtar kullan.

## Akış

1. **Üret:** `node uret.mjs istemler/sayfa11.txt` → `kaynak/sayfa11.png`. Zaman aşımına uğrayan tek
   başına yeniden çalıştırılır.
2. **Kes:** sayfayı `kes.py` içindeki `SAYFALAR`'a ekle (sırayla: id, Türkçe ad, gerçek uzun kenar cm,
   masadan yükseklik cm), sonra `python kes.py sayfa11`. Yalnızca o sayfa kesilir, `.png` `.webp`'ye
   çevrilir, katalog güncellenir. `cikti/kontrol.png` bütün nesneleri gösterir; kesimi buradan kontrol et.
3. **Diz:** `python diz.py 5 80` (tohum, masa genişliği cm) → `cikti/sahne_5.webp`, kutuları gösteren
   `sahne_5_kutular.png`. Başka yüzey için `--masa <kaynak adı>`.
4. **Oyuna aktar:** `python diz.py 5 80 --oyun modern/church/static_tv` görseli
   `frontend/public/search-scenes/...` altına, maskeyi `backend/src/search/scenes/masks/` altına yazar ve
   sahne kaydını ekrana basar; kaydı `backend/src/search/scenes/<evren>-<mekân>.ts` dosyasına koy
   (`clueSpot`'u doldur, sahne `DRAFT` başlar). Ardından `npm test` (backend) `sceneProblems` ile denetler.

## İstem kuralları (denemelerden)

- **Zemin düz mor (#FF00FF), hale yok:** açık gri zeminde beyaz, gümüş ve cam nesneler zeminden
  ayrılamadı, Gemini nesnelerin çevresine ışık halesi de boyadı. Mor zemin istemi `istemler/sayfa1.txt`.
  Mor ya da pembe nesneler mor zemine konmaz; sayfa yeşil zeminle üretilmeli (kes.py henüz yalnızca moru
  arındırıyor).
- **Ayakta duran nesneler "lying on its side":** yandan çizilmiş ördek, robot, kar küresi döndürülünce
  tepeden bakan masada yapay duruyor.
- **Ad verilen her şey bir kez çizilir**, ama yazı sızabilir (çakmakta "Retro", disket etiketinde el yazısı):
  böyle nesneler listeye girmesin ya da yeniden üretilsin.
- "Troll doll" istemi Gemini'nin içerik filtresine takıldı.

## Ayarlar

- `kes.py`: `SAYDAM` (camı olan nesneler yarı saydam kesilir), `SAYFALAR`, `TUR` (dolgu ve örtü sayfaları).
- `diz.py`: `ASIL_YERLER` (kanıtın saklanabileceği nesneler ve yönlendirme metni), `DOLGU_ALT`/`DOLGU_UST`/
  `KABLO`/`ORTU` (dolgu yoğunluğu), `EN_AZ_GORUNUR` (yerleşirken korunur), `SECILIR_ISIK` ve `EN_AZ_ETKIN`
  (gölgede kalan ya da çok örtülen nesne listeye girmez).

## Bilinen eksikler

- `sayfa1` ve `sayfa5` dışındaki sayfalar gri zeminli; camlı ve beyaz nesnelerin kenarında iz kalabiliyor.
- Işık çubuğu yarı saydam olduğu için içinden mor görünüyor; yeşil zeminle yeniden üretilmeli.
- Termos, kupa, bone gibi büyük nesneler sahnede fazla yer kaplıyor.
