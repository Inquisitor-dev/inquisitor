# Gemini'nin tek parça çizdiği sahneleri oyuna ekler: elle çizilmiş kutulardan SAM ile piksel maskesi çıkarır.
# Kullanım: python maske.py tek_parca/<sahne>.json [model]   -> görsel, scenes/generated/<sahne>.ts, cikti/maske_<sahne>.png
# Sahne listesi kendiliğinden yenilenir (yalnızca liste için: python maske.py --dizin). Kontrol görselinde şekli kötü çıkan nesneyi düzelt ya da listeden çıkar.
# Bağımlılıklar requirements.txt'te (ultralytics ve torch ~1 GB; ayrı bir ortama kur).
# Sahne dosyası: gorsel (kaynak/ altında), evren, mekan, alan, varyant, yer, nesneler, asil. Her nesnede kutu [x, y, g, y]
# (görselin yüzdesi); iki parçalı nesnede (bir çift paten) "parcalar": [[...], [...]] kutuların her biri ayrı işlenir.
import base64
import gzip
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

KOK = Path(__file__).parent
DEPO = KOK.parents[1]
URETILEN = DEPO / "backend/src/search/scenes/generated"


def dizin():
    """generated/index.ts: üretilmiş bütün sahne dosyalarını listeler."""
    dosyalar = sorted(p.stem for p in URETILEN.glob("*.ts") if p.stem != "index")
    satirlar = [f"import {{ SCENE as SCENE_{i} }} from './{d}';" for i, d in enumerate(dosyalar)]
    (URETILEN / "index.ts").write_text(
        "import type { SearchSceneDef } from '../../search-scene';\n"
        + "".join(x + "\n" for x in satirlar)
        + "\n// tools/arama-sahne/maske.py üretir; elle düzenleme\n"
        + "export const GENERATED_SCENES: SearchSceneDef[] = [\n"
        + "".join(f"  SCENE_{i},\n" for i in range(len(dosyalar)))
        + "];\n",
        encoding="utf-8",
    )
    print(f"havuzda {len(dosyalar)} üretilmiş sahne")


if sys.argv[1] == "--dizin":
    dizin()
    sys.exit()

from ultralytics import SAM  # yalnızca maske üretirken gerekir, ağır

tanim_yolu = Path(sys.argv[1])
if not tanim_yolu.is_absolute():
    tanim_yolu = KOK / tanim_yolu
T = json.loads(tanim_yolu.read_text(encoding="utf-8"))
ad = f"{T['evren']}-{T['mekan']}-{T['alan']}-{T['varyant']}"

im = Image.open(KOK / "kaynak" / T["gorsel"]).convert("RGB")
W, H = im.size
hepsi = T["nesneler"] + T["asil"]
ids = [n["id"] for n in hepsi]

# Her parça için bir kutu; aynı nesnenin parçaları sonra birleşir
kutular, sahip = [], []
for i, n in enumerate(hepsi):
    for x, y, g, y2 in n.get("parcalar", [n["kutu"]]):
        kutular.append([x * W / 100, y * H / 100, (x + g) * W / 100, (y + y2) * H / 100])
        sahip.append(i)
sonuc = SAM(sys.argv[2] if len(sys.argv) > 2 else "mobile_sam.pt")(np.asarray(im)[:, :, ::-1], bboxes=kutular, device="cpu", verbose=False)[0]
parcalar = sonuc.masks.data.cpu().numpy().astype(bool)
maskeler = np.zeros((len(hepsi), H, W), bool)
for p, i in zip(parcalar, sahip):
    maskeler[i] |= p

# Üst üste binince küçük nesne önde sayılır: büyükten küçüğe yazılır
kimlik = np.zeros((H, W), np.uint8)
for i in sorted(range(len(hepsi)), key=lambda i: -maskeler[i].sum()):
    kimlik[maskeler[i]] = i + 1

gorsel_yolu = f"/search-scenes/{T['evren']}/{T['mekan']}/{T['alan']}/{T['varyant']}.webp"
hedef = DEPO / "frontend/public" / gorsel_yolu.lstrip("/")
hedef.parent.mkdir(parents=True, exist_ok=True)
im.save(hedef, quality=85, method=4)

kucuk = kimlik[2::4, 2::4]
veri = base64.b64encode(gzip.compress(kucuk.tobytes(), 9, mtime=0)).decode()
metin = lambda v: json.dumps(v, ensure_ascii=False)
nesne_satir = "\n".join(f"    {{ id: {metin(n['id'])}, label: {metin(n['ad'])}, box: {n['kutu']} }}," for n in T["nesneler"])
asil_satir = "\n".join(f"    {{ id: {metin(n['id'])}, box: {n['kutu']}, prompt: {metin(n['yonlendirme'])} }}," for n in T["asil"])
(DEPO / f"backend/src/search/scenes/generated/{ad}.ts").write_text(
    f"""import type {{ SearchSceneDef }} from '../../search-scene';

// Görsel Gemini'nin tek parça çizimi; kutular elle, maske SAM ile (tools/arama-sahne/maske.py, {tanim_yolu.name}); elle düzenleme
export const SCENE: SearchSceneDef = {{
  universe: {metin(T['evren'])},
  locationId: {metin(T['mekan'])},
  areaId: {metin(T['alan'])},
  variant: {metin(T['varyant'])},
  clueSpot: {metin(T['yer'])},
  image: {metin(gorsel_yolu)},
  status: 'DRAFT',
  objects: [
{nesne_satir}
  ],
  finalSpots: [
{asil_satir}
  ],
  mask: {{
    width: {kucuk.shape[1]},
    height: {kucuk.shape[0]},
    ids: {metin(ids)},
    data: '{veri}',
  }},
}};
""",
    encoding="utf-8",
)

# Kontrol görseli: maskeler renkli, kutular çerçeveli; asıl yerler kırmızı çerçeve
rng = np.random.default_rng(3)
renk = rng.integers(70, 255, (len(hepsi) + 1, 3)).astype(np.float32)
taban = np.asarray(im).astype(np.float32)
arr = taban * 0.5
for i in range(len(hepsi)):
    m = kimlik == i + 1
    arr[m] = taban[m] * 0.55 + renk[i + 1] * 0.45
c = Image.fromarray(arr.astype(np.uint8))
d = ImageDraw.Draw(c)
f = ImageFont.truetype("arial.ttf", 22)
for i, n in enumerate(hepsi):
    x, y, g, y2 = n["kutu"]
    r = [x * W / 100, y * H / 100, (x + g) * W / 100, (y + y2) * H / 100]
    d.rectangle(r, outline=(255, 70, 70) if n in T["asil"] else (255, 255, 255), width=2)
    d.text((r[0] + 3, r[1] + 2), n["id"], fill=(255, 255, 0), font=f)
(KOK / "cikti").mkdir(exist_ok=True)
c.save(KOK / "cikti" / f"maske_{ad}.png")

# Görünen alanı çok küçük kalan nesneler tıklanması zor: gözle bakılmalı
az = [f"{hepsi[i]['id']} %{100 * (kimlik == i + 1).sum() / max(1, maskeler[i].sum()):.0f}" for i in range(len(hepsi)) if (kimlik == i + 1).sum() < 0.5 * maskeler[i].sum()]
dizin()
print(f"{ad}: {len(T['nesneler'])} nesne, {len(T['asil'])} asıl yer | maske {len(veri) // 1024} KB | önü kapanan: {', '.join(az) or 'yok'}")
