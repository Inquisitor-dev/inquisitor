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
| `alanlar.json` | Havuza üretilecek alanların ayarları |
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
4. **Havuza ekle:** alanı `alanlar.json`'a yaz (kanıtın yer ifadesi `clueSpot`, yüzey görseli `masa`, yüzey
   genişliği `cm`, ışık `lamba`: "x,y,en_az", lambanın yeri ve en karanlık yerin parlaklığı; `tohum_kaydir`: her alana farklı bir sayı, yoksa alanlar aynı dizilişi alır), sonra `python havuz.py modern/church/static_tv --adet 3`. Her varyant için görsel
   `frontend/public/search-scenes/<evren>/<mekân>/<alan>/v<N>.webp`, sahne kaydı ve maske
   `backend/src/search/scenes/generated/` altına yazılır, liste (`index.ts`) kendiliğinden yenilenir. Yeniden
   çalıştırınca var olan varyantlara dokunmaz, yeni tohumlarla ekler. Varyant silmek için görselini ve `.ts`
   dosyasını sil, `python havuz.py --dizin` çalıştır. Sonra `npm test` (backend) `sceneProblems` ile denetler.
5. **Yayına al:** sahneler `DRAFT` başlar, yalnızca test modunda gelir. Oynayıp beğenince dosyasında
   `status: 'READY'` yap.

## İstem kuralları (denemelerden)

- **Zemin düz mor (#FF00FF), hale yok:** açık gri zeminde beyaz, gümüş ve cam nesneler zeminden
  ayrılamadı, Gemini nesnelerin çevresine ışık halesi de boyadı. Örnek istem: `istemler/sayfa2.txt`.
  Pembe ve mor nesneler zemine karışır: istemde rengini değiştir ("faded blue scrunchie").
- **Ayakta duran nesneler "lying on its side":** yandan çizilmiş ördek, robot, kar küresi döndürülünce
  tepeden bakan masada yapay duruyor.
- **Yazı sızabilir** (fişte "CASINO", disket etiketinde el yazısı): boş olmasını açıkça iste ("blank label",
  "no print"). Sorunlu nesne için bütün sayfayı üretme: düzeltme sayfasına (`istemler/sayfa11.txt`) ekle,
  `SAYFALAR`'da eski yerini `None` yap.
- "Troll doll" istemi Gemini'nin içerik filtresine takıldı.

## Ayarlar

- `kes.py`: `SAYDAM` (camı olan nesneler yarı saydam kesilir), `TEK_PARCA` (Gemini'nin kopuk parça çizdiği
  nesnelerde en büyük parça kalır), `SAYFALAR`, `TUR` (dolgu ve örtü sayfaları).
- `diz.py`: `EN_AZ_KOYU` (lambalı sahnede fazla karanlıkta kalan nesne listeye girmez), `ASIL_YERLER` (kanıtın saklanabileceği nesneler ve yönlendirme metni), `DOLGU_ALT`/`DOLGU_UST`/
  `KABLO`/`ORTU` (dolgu yoğunluğu), `EN_AZ_GORUNUR` (yerleşirken korunur), `SECILIR_ISIK` ve `EN_AZ_ETKIN`
  (gölgede kalan ya da çok örtülen nesne listeye girmez).

## Bilinen eksikler

- `dolgu1` ve `ortu1` hâlâ gri zeminli; kesimleri temiz çıktığı için yeniden üretilmedi.
- `sayfa1` eski istemle üretildi: yandan çizilmiş birkaç nesne var (fotoğraf makinesi, küp).
