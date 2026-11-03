# Raf yüzeyi denemesi: önden çizilmiş nesneleri raf tahtalarının üstüne dizer. diz.py'den ayrıdır, oyuna yazmaz;
# görünüm beğenilirse yüzey türü olarak diz.py'ye taşınır.
# Kullanım: python raf_dene.py [tohum] [raf genişliği cm]   -> cikti/raf_<tohum>.webp
# Masadan farkları: nesneler dik durur ve tabanları tahtaya oturur, arka sıra ön sıranın arkasında kalır,
# gölge tahtaya ve arka panele düşer, her rafın üstü üst tahtanın gölgesinde kalır.
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

KOK = Path(__file__).parent
TOHUM = int(sys.argv[1]) if len(sys.argv) > 1 else 1
RAF_CM = float(sys.argv[2]) if len(sys.argv) > 2 else 60
RAF_SAYISI = 3
TAHTA = 46  # raf tahtasının görünen üst yüzeyi (px)
ON_KENAR = 20  # tahtanın ön yüzü (px)
ARKA_OLCEK, ARKA_KOYULUK = 0.85, 0.78

rng = random.Random(TOHUM)


def raf_ciz():
    """Geçici raf: masa görselinin ahşabından kodla. Kredi gelince Gemini'nin boş raf görseli bunun yerini alır."""
    ahsap = Image.open(KOK / "kaynak" / "masa.webp").convert("RGB")
    W, H = ahsap.size
    panel = np.asarray(ahsap.filter(ImageFilter.GaussianBlur(6)), np.float32) * 0.42
    tuval = Image.fromarray(panel.astype(np.uint8))
    tabanlar = [round((i + 1) * H / RAF_SAYISI) - ON_KENAR - 4 for i in range(RAF_SAYISI)]
    for t in tabanlar:
        ust = ahsap.crop((0, t - TAHTA, W, t)).point(lambda v: min(255, int(v * 1.05)))
        tuval.paste(ust, (0, t - TAHTA))
        on = ahsap.crop((0, t, W, t + ON_KENAR)).point(lambda v: int(v * 0.55))
        tuval.paste(on, (0, t))
    return tuval, tabanlar


tuval, tabanlar = raf_ciz()
W, H = tuval.size
px_cm = W / RAF_CM
aciklik = H / RAF_SAYISI - TAHTA - ON_KENAR - 12  # bir rafa sığan en büyük nesne yüksekliği
katalog = [n for n in json.loads((KOK / "nesneler.json").read_text(encoding="utf-8")) if n["tur"] == "on"]
rng.shuffle(katalog)


def hazirla(n, olcek):
    o = Image.open(KOK / "nesneler" / f"{n['id']}.webp").convert("RGBA")
    hedef = n["cm"] * px_cm * olcek * rng.uniform(0.92, 1.05)
    k = hedef / max(o.size)
    if o.height * k > aciklik * olcek:  # üst rafa çarpmasın
        k = aciklik * olcek / o.height
    o = o.resize((max(1, round(o.width * k)), max(1, round(o.height * k))), Image.LANCZOS)
    # dik durur: hafif eğiklik, arada bir yaslanmış gibi
    aci = rng.uniform(-3, 3) if rng.random() < 0.85 else rng.choice([-1, 1]) * rng.uniform(6, 11)
    o = o.rotate(aci, Image.BICUBIC, expand=True)
    return o.crop(o.getbbox())


def bas(o, x, taban, koyuluk):
    """Nesneyi tabanı tahtaya gelecek şekilde basar; önce arka panele düşen gölge ve tahtadaki temas gölgesi."""
    y = taban - o.height
    alfa = o.split()[3]
    # panele düşen yumuşak gölge (ışık sol üstten)
    pay = 60
    genis = Image.new("L", (o.width + 2 * pay, o.height + 2 * pay))
    genis.paste(alfa, (pay, pay))
    g = genis.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.45))
    k = Image.new("RGBA", genis.size, (14, 8, 3, 0))
    k.putalpha(g)
    tuval.paste(k, (x - pay + 18, y - pay + 6), k)
    # tahtadaki temas gölgesi: tabanın altına yatay koyu leke
    temas = Image.new("L", (o.width + 80, 60))
    ImageDraw.Draw(temas).ellipse([30, 22, o.width + 60, 44], fill=170)
    temas = temas.filter(ImageFilter.GaussianBlur(7))
    k = Image.new("RGBA", temas.size, (10, 5, 2, 0))
    k.putalpha(temas)
    tuval.paste(k, (x - 30, taban - 34), k)
    r = np.asarray(o, np.float32).copy()
    r[..., :3] *= koyuluk
    o = Image.fromarray(np.clip(r, 0, 255).astype(np.uint8), "RGBA")
    tuval.paste(o, (x, y), o)


def sira_diz(nesneler, taban, olcek, koyuluk):
    """Bir sıra: nesneleri raf boyunca yayar, sığmazsa birbirine biraz bindirir."""
    if not nesneler:
        return
    gorseller = [hazirla(n, olcek) for n in nesneler]
    bosluk = (W - sum(o.width for o in gorseller)) / len(gorseller)
    x = bosluk / 2 + rng.uniform(-30, 30)
    for o in gorseller:
        bas(o, round(x), taban, koyuluk)
        x += o.width + bosluk + rng.uniform(-0.25, 0.25) * min(o.width, 200)


# Nesneleri raflara dağıt: her rafta arka sıra önce çizilir, ön sıra onu örter
for i, taban in enumerate(tabanlar):
    raftaki = katalog[i::RAF_SAYISI]
    orta = len(raftaki) // 2
    sira_diz(raftaki[:orta], taban - TAHTA + 10, ARKA_OLCEK, ARKA_KOYULUK)
    sira_diz(raftaki[orta:], taban - 6, 1.0, 1.0)

# Son dokunuş: her rafın üstü üst tahtanın gölgesinde (nesnelerin üstüne de biner), ışık soldan
dizi = np.asarray(tuval, np.float32)
karanlik = np.ones(H, np.float32)
for y0 in [0] + [t + ON_KENAR for t in tabanlar[:-1]]:
    for y in range(y0, min(H, y0 + 170)):
        karanlik[y] = min(karanlik[y], 0.62 + 0.38 * (y - y0) / 170)
isik = np.linspace(1.08, 0.82, W, dtype=np.float32)[None, :, None]
dizi = dizi * karanlik[:, None, None] * isik
dizi = dizi * 0.92 + np.array([255, 200, 140], np.float32) * 0.08 * (dizi.mean(-1, keepdims=True) / 255)
(KOK / "cikti").mkdir(exist_ok=True)
Image.fromarray(np.clip(dizi, 0, 255).astype(np.uint8)).save(KOK / "cikti" / f"raf_{TOHUM}.webp", quality=88)
print(f"raf_{TOHUM}: {len(katalog)} nesne, {RAF_SAYISI} raf")
