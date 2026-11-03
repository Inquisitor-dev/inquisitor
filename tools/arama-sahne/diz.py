# Kesilmiş nesneleri boş masanın üstüne dizer; görseli ve nesne kutularını (sahne dosyası biçiminde) çıkarır.
# Katmanlar alttan üste: masaya saçılmış dolgu (kırıntı, mısır, para…), yığınlar hâlinde hedef nesneler ve
# aralarına giren kodla çizilmiş kablolar ile üstlere atılmış örtüler, en üstte biraz daha dolgu.
# Dolgu, kablo ve örtü listeye girmez; tekrar edebilirler.
# Kullanım: python diz.py [tohum] [masa genişliği cm] [--masa <kaynak adı>] [filtre]
#   -> cikti/sahne_<tohum>.webp, _kutular.png (kontrol), .ts. Oyuna aktarmak için havuz.py.
import json
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

KOK = Path(__file__).parent
DEPO = KOK.parents[1]
CIKTI = KOK / "cikti"
CIKTI.mkdir(exist_ok=True)


def secenek(ad, varsayilan=None):
    return sys.argv[sys.argv.index(ad) + 1] if ad in sys.argv else varsayilan


# seçeneklerin değerleri sıra numaralı argüman sayılmaz
_degerler = {i + 1 for i, a in enumerate(sys.argv) if a in ("--masa", "--oyun", "--varyant", "--yer", "--lamba")}
_sirali = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and i not in _degerler and a != "filtre"]
TOHUM = int(_sirali[0]) if _sirali else 1
MASA_CM = float(_sirali[1]) if len(_sirali) > 1 else 80
MASA = secenek("--masa", "masa")
# Lamba: "x,y,en_az": ışığın görseldeki yeri (0-1, görselin dışında da olabilir) ve en karanlık yerin parlaklığı
LAMBA = [float(v) for v in secenek("--lamba").split(",")] if "--lamba" in sys.argv else None
FILTRE = "filtre" in sys.argv  # sarımtırak, eski, tozlu ortak görünüm (denendi, beğenilmedi)
ADAY = 60  # her hedef nesne için denenen konum sayısı
EN_AZ_GORUNUR = 0.45  # üstüne bir şey gelince bile hedef nesnenin en az bu kadarı görünür kalmalı
CERCEVE_ICI = 0.7  # nesnenin en az bu kadarı görselin içinde kalmalı (kenarlar kesebilir)
YIGIN = 4  # eşyaların toplandığı yığın sayısı
DOLGU_ALT, DOLGU_UST, KABLO, ORTU = 170, 45, 5, 3
DOLGU = 32000  # kimlik haritasında dolgu, kablo ve örtü olmayan süs katmanı
# Görünür sayılmanın ölçütleri (kodun "görünür" dediği, gözün de seçebildiği olsun)
SECILIR_ISIK = 0.6  # üstüne düşen gölgeyle ilk parlaklığının bu oranının altına kararan piksel seçilemez
EN_AZ_PARCA = 1500  # bundan küçük görünen parçalar (kıymık) sayılmaz
EN_AZ_KOYU = 45  # lambalı sahnede görünen kısmının ortalama parlaklığı bundan azsa listeye girmez
EN_AZ_ETKIN = 0.35  # seçilebilen kısmı bundan az kalan nesne listeye girmez, dağınıklık olarak kalır

# Nesnenin masadan yüksekliği (cm): gölgenin ne kadar uzağa ve ne kadar yumuşak düşeceğini belirler
YUKSEKLIK = {
    "lastik_ordek": 8, "kar_kuresi": 8, "zeka_kupu": 5.7, "dinozor": 5, "ayicik": 5, "kurmali_robot": 4,
    "at": 4, "tek_kullanimlik_kamera": 3.5, "kasetcalar": 3, "oyuncak_araba": 3, "toka": 3, "donut": 3,
    "yoyo": 3, "gunes_gozlugu": 3, "el_konsolu": 2.5, "asma_kilit": 2, "cagri_cihazi": 2, "mizika": 2,
    "ruj": 2, "cuzdan": 1.5, "pusula": 1.5, "sanal_hayvan": 1.5, "cakmak": 1.5, "caki": 1.5,
    "hesap_makinesi": 1, "dijital_saat": 1, "pudralik": 1, "kelebek_toka": 1, "fis": 0.4, "disket": 0.3,
}
# Liste yerine "asıl yer" olacak, içine bir şey saklanabilecek nesneler
ASIL_YERLER = {"cuzdan": "cüzdanın içinde", "pudralik": "pudralığın içinde", "tek_kullanimlik_kamera": "kameranın arkasında"}

rng = random.Random(TOHUM)
masa_yolu = KOK / "kaynak" / f"{MASA}.png"
masa = Image.open(masa_yolu if masa_yolu.exists() else masa_yolu.with_suffix(".webp")).convert("RGB")
W, H = masa.size
px_cm = W / MASA_CM
katalog = json.loads((KOK / "nesneler.json").read_text(encoding="utf-8"))
hedefler = [n for n in katalog if n["tur"] == "hedef"]
dolgular = [n for n in katalog if n["tur"] == "dolgu"]
ortuler = [n for n in katalog if n["tur"] == "ortu"]

# Masadaki ışık: nesneler de aynı yerde aydınlansın, aynı yerde kararsın
parlaklik = np.asarray(masa.convert("L").filter(ImageFilter.GaussianBlur(120)), np.float32)
isik = 0.8 + 0.4 * (parlaklik - parlaklik.min()) / (np.ptp(parlaklik) + 1e-6)

tuval = masa.copy()
kimlik = np.zeros((H, W), np.int16)  # her pikselde en üstteki nesnenin sırası (0 = masa, DOLGU = süs)
ilk = np.zeros((H, W), np.float32)  # hedef nesne basıldığı anda her pikselinin parlaklığı
toplam, gorunur = {}, {}  # yalnızca hedef nesneler: görselin içindeki ve şu an görünen piksel sayısı
yiginlar = [(rng.uniform(0.15, 0.85) * W, rng.uniform(0.2, 0.8) * H) for _ in range(YIGIN)]


def hazirla(n, olcek=1.0):
    o = Image.open(KOK / "nesneler" / f"{n['id']}.webp")
    hedef = n["cm"] * px_cm * olcek * rng.uniform(0.9, 1.1)
    o = o.resize((max(1, round(o.width * hedef / max(o.size))), max(1, round(o.height * hedef / max(o.size)))), Image.LANCZOS)
    if n["tur"] == "dolgu":
        # kopyalar birbirine benzemesin: aynala, tonu ve parlaklığı biraz oynat
        if rng.random() < 0.5:
            o = o.transpose(Image.FLIP_LEFT_RIGHT)
        r = np.asarray(o, np.float32).copy()
        r[..., :3] *= np.array([rng.uniform(0.96, 1.04) for _ in range(3)], np.float32) * rng.uniform(0.85, 1.1)
        o = Image.fromarray(np.clip(r, 0, 255).astype(np.uint8), "RGBA")
    return o.rotate(rng.uniform(0, 360), Image.BICUBIC, expand=True)


DOLGU_OLCEK = 0.75  # dolgu, hedef nesnelerden göze batmasın diye biraz küçük
DOLGU_TUR_SINIRI = 14  # aynı dolgudan en fazla bu kadar
dolgu_sayisi = {}


def dolgu_sec():
    """Küçük dolgular (çekirdek, boncuk, mısır) daha sık; her türün bir üst sınırı var."""
    adaylar = [n for n in dolgular if dolgu_sayisi.get(n["id"], 0) < DOLGU_TUR_SINIRI]
    n = rng.choices(adaylar, weights=[1 / n["cm"] ** 1.5 for n in adaylar])[0]
    dolgu_sayisi[n["id"]] = dolgu_sayisi.get(n["id"], 0) + 1
    return n


def konum_sec(o, yigina=0.85):
    """Çoğunlukla bir yığının çevresine, bazen masanın herhangi bir yerine."""
    if rng.random() < yigina:
        cx, cy = rng.choice(yiginlar)
        return round(rng.gauss(cx, 0.13 * W) - o.width / 2), round(rng.gauss(cy, 0.13 * W) - o.height / 2)
    return rng.randint(-o.width // 4, W - 3 * o.width // 4), rng.randint(-o.height // 4, H - 3 * o.height // 4)


def dene(o, yigina=0.85, koru=True):
    """Bir konum dener; nesne çerçeveden taşıyorsa ya da bir hedefi fazla örtüyorsa None döner."""
    a = np.asarray(o)[..., 3] > 128
    x, y = konum_sec(o, yigina)
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + o.width, W), min(y + o.height, H)
    if x1 <= x0 or y1 <= y0:
        return None
    am = a[y0 - y : y1 - y, x0 - x : x1 - x]
    if am.sum() < CERCEVE_ICI * a.sum():
        return None
    alt = kimlik[y0:y1, x0:x1][am]
    ortulen = np.bincount(np.where(alt == DOLGU, 0, alt), minlength=len(toplam) + 1)
    if koru and any(gorunur[j] - ortulen[j] < EN_AZ_GORUNUR * toplam[j] for j in toplam if ortulen[j]):
        return None
    return x, y, (x0, y0, x1, y1), am, ortulen


def isaretle(bolge, am, deger):
    """Kimlik haritasına yazar; örtülen hedeflerin görünen piksel sayısını düşer."""
    x0, y0, x1, y1 = bolge
    alt = kimlik[y0:y1, x0:x1][am]
    sayim = np.bincount(np.where(alt == DOLGU, 0, alt), minlength=len(toplam) + 1)
    for j in toplam:
        gorunur[j] -= sayim[j]
    kimlik[y0:y1, x0:x1][am] = deger


def bas(o, x, y, h_cm):
    """Gölgeleri (ışık sol üstten) ve nesneyi tuvale basar, nesneyi masanın ışığına göre aydınlatır."""
    alfa = o.split()[3]
    pay = round((0.6 + 0.5 * h_cm) * px_cm)  # gölge bulanıklaşınca taşmasın diye kenar payı
    genis = Image.new("L", (o.width + 2 * pay, o.height + 2 * pay))
    genis.paste(alfa, (pay, pay))

    def golge(bulanik_cm, dx_cm, dy_cm, koyuluk):
        g = genis.filter(ImageFilter.GaussianBlur(max(1, bulanik_cm * px_cm))).point(lambda v: int(v * koyuluk))
        katman = Image.new("RGBA", genis.size, (18, 10, 4, 0))
        katman.putalpha(g)
        tuval.paste(katman, (x - pay + round(dx_cm * px_cm), y - pay + round(dy_cm * px_cm)), katman)

    # yükseklikle uzayıp yumuşayan düşen gölge, sonra nesnenin dibine yapışık koyu temas gölgesi
    if LAMBA:
        # gölge lambadan uzağa düşer; lambadan uzaktaki nesnenin gölgesi daha uzun
        dx, dy = (x + o.width / 2) / W - LAMBA[0], (y + o.height / 2) / W - LAMBA[1] * H / W
        uzaklik = math.hypot(dx, dy) + 1e-6
        boy = h_cm * (0.3 + 0.5 * uzaklik)
        golge(0.12 + 0.12 * h_cm, boy * dx / uzaklik, boy * dy / uzaklik, 0.55)
    else:
        golge(0.12 + 0.12 * h_cm, 0.35 * h_cm, 0.45 * h_cm, 0.5)
    golge(0.06, 0.04, 0.06, 0.7)

    if FILTRE:
        o = o.filter(ImageFilter.GaussianBlur(0.8))
    renk = np.asarray(o, np.float32).copy()
    if FILTRE:
        parlak = renk[..., :3].mean(-1, keepdims=True)
        renk[..., :3] = parlak + (renk[..., :3] - parlak) * 0.82
        renk[..., :3] = 128 + (renk[..., :3] - 128) * 0.88
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + o.width, W), min(y + o.height, H)
    yerel = np.ones(renk.shape[:2], np.float32)
    yerel[y0 - y : y1 - y, x0 - x : x1 - x] = isik[y0:y1, x0:x1]
    renk[..., :3] *= yerel[..., None]
    o = Image.fromarray(np.clip(renk, 0, 255).astype(np.uint8), "RGBA")
    tuval.paste(o, (x, y), o)


# --- Kablolar: kodla çizilir, her sahnede farklıdır --------------------------------------------------

KABLO_TURLERI = {
    # tür: (koyu kenar, ana renk, parlama, kalınlık cm)
    "siyah": ((22, 22, 25), (52, 52, 58), (150, 150, 160), 0.45),
    "gri": ((65, 65, 68), (110, 110, 115), (200, 200, 205), 0.5),
    "kulaklik": ((150, 140, 120), (210, 200, 180), (250, 246, 232), 0.28),
    "sarmal": ((120, 105, 85), (190, 175, 150), (240, 232, 215), 0.3),
    "bant": ((30, 18, 10), (85, 55, 32), (180, 140, 95), 0.38),
}


def yumusat(noktalar, kez=3):
    """Chaikin köşe kesme: kırık çizgiyi yumuşak eğriye çevirir."""
    for _ in range(kez):
        yeni = [noktalar[0]]
        for (ax, ay), (bx, by) in zip(noktalar, noktalar[1:]):
            yeni += [(0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by), (0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by)]
        noktalar = yeni + [noktalar[-1]]
    return noktalar


def kablo_ciz(tur):
    koyu, ana, parlak, kalinlik = KABLO_TURLERI[tur]
    w = kalinlik * px_cm
    cx, cy = rng.choice(yiginlar)
    x, y = cx + rng.gauss(0, 0.1 * W), cy + rng.gauss(0, 0.1 * H)
    aci, adim = rng.uniform(0, 2 * math.pi), 4 * px_cm
    yol = [(x, y)]
    for _ in range(int(rng.uniform(15, 30))):
        aci += rng.gauss(0, 0.45)
        x, y = x + math.cos(aci) * adim, y + math.sin(aci) * adim
        yol.append((x, y))
    yol = yumusat(yol)
    if tur == "sarmal":  # telefon kablosu: yolun iki yanına sık sık kıvrılır
        sik = []
        for i in range(len(yol) - 1):
            (ax, ay), (bx, by) = yol[i], yol[i + 1]
            uz = math.hypot(bx - ax, by - ay)
            nx, ny = -(by - ay) / (uz + 1e-6), (bx - ax) / (uz + 1e-6)
            for t in np.linspace(0, 1, max(2, int(uz / (0.12 * px_cm))), endpoint=False):
                s = len(sik) * 0.12 * px_cm
                genlik = 0.35 * px_cm * math.sin(s / (0.5 * px_cm) * 2 * math.pi)
                sik.append((ax + (bx - ax) * t + nx * genlik, ay + (by - ay) * t + ny * genlik))
        yol = sik
    katman = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(katman)
    d.line(yol, fill=koyu + (255,), width=max(2, round(w)), joint="curve")
    d.line(yol, fill=ana + (255,), width=max(1, round(w * 0.6)), joint="curve")
    kay = w * 0.15
    d.line([(px - kay, py - kay) for px, py in yol], fill=parlak + (200,), width=max(1, round(w * 0.2)), joint="curve")
    # uçlar: fiş ya da kulaklık başlıkları
    (ex, ey), (ox, oy) = yol[-1], yol[-6]
    if tur == "kulaklik":
        yon = math.atan2(ey - oy, ex - ox)
        for sapma in (-0.5, 0.5):
            bx, by = ex + math.cos(yon + sapma) * 3 * px_cm, ey + math.sin(yon + sapma) * 3 * px_cm
            d.line([(ex, ey), (bx, by)], fill=ana + (255,), width=max(1, round(w)))
            r = 0.75 * px_cm
            d.ellipse([bx - r, by - r, bx + r, by + r], fill=ana + (255,), outline=koyu + (255,), width=2)
            d.ellipse([bx - r * 0.45, by - r * 0.45, bx + r * 0.45, by + r * 0.45], fill=koyu + (255,))
    elif tur != "bant":
        r = w * 1.4
        d.ellipse([ex - r, ey - r, ex + r, ey + r], fill=koyu + (255,))
        d.ellipse([ex - r * 0.5 - kay, ey - r * 0.5 - kay, ex + r * 0.5 - kay, ey + r * 0.5 - kay], fill=parlak + (255,))
    return katman.filter(ImageFilter.GaussianBlur(0.6))


def kablo_bas(tur):
    katman = kablo_ciz(tur)
    am = np.asarray(katman)[..., 3] > 128
    bas(katman, 0, 0, 0.6)
    isaretle((0, 0, W, H), am, DOLGU)


# --- Dizme ------------------------------------------------------------------------------------------

# 1) Masaya saçılmış dolgu: yığınların çevresinde yoğun, aralarda seyrek
for _ in range(DOLGU_ALT):
    n = dolgu_sec()
    o = hazirla(n, DOLGU_OLCEK)
    yer = dene(o, yigina=0.7, koru=False)
    if yer:
        x, y, bolge, am, _ = yer
        bas(o, x, y, 0.8)
        isaretle(bolge, am, DOLGU)

# 2) Hedef nesneler; aralarına kablolar ve örtüler girer (biri altta kalır, biri üstte)
# asıl yerler önce konur: her sahnede bulunmaları gerekir, sona kalırsa yer bulamayabilirler
sira = [("hedef", n) for n in sorted(hedefler, key=lambda n: (n["id"] not in ASIL_YERLER, -n["cm"] * rng.uniform(0.6, 1.4)))]
for tur in rng.sample(list(KABLO_TURLERI), KABLO):
    sira.insert(rng.randint(len(sira) // 5, len(sira)), ("kablo", tur))
for n in rng.sample(ortuler, ORTU):
    sira.insert(rng.randint(len(sira) // 2, len(sira)), ("ortu", n))

yerlesen = []
for tur, n in sira:
    if tur == "kablo":
        kablo_bas(n)
        continue
    en_iyi = None
    for _ in range(ADAY):
        o = hazirla(n, 0.8 if tur == "ortu" else 1.0)
        yer = dene(o)
        if not yer:
            continue
        ortulen = yer[4]
        ustune = sum(int(ortulen[j]) for j in toplam)
        # hedef: boş masayı kapatsın ama yığına da binsin; örtü: hedeflerin üstüne düşsün
        puan = (ustune if tur == "ortu" else ortulen[0] + 0.5 * ustune) * rng.uniform(0.8, 1.0)
        if en_iyi is None or puan > en_iyi[0]:
            en_iyi = (puan, o, yer)
    if en_iyi is None:
        print(f"{n['id']} yerleşemedi", file=sys.stderr)
        continue
    _, o, (x, y, bolge, am, _) = en_iyi
    if tur == "ortu":
        bas(o, x, y, 1.5)
        isaretle(bolge, am, DOLGU)
        continue
    k = len(toplam) + 1
    isaretle(bolge, am, k)
    toplam[k] = gorunur[k] = int(am.sum())
    bas(o, x, y, n.get("h", YUKSEKLIK.get(n["id"], 1.5)))
    x0, y0, x1, y1 = bolge
    ilk[y0:y1, x0:x1][am] = np.asarray(tuval.convert("L"), np.float32)[y0:y1, x0:x1][am]
    yerlesen.append((k, n))

# 3) Üste düşmüş birkaç dolgu (hedefleri fazla örtmeden)
for _ in range(DOLGU_UST):
    n = dolgu_sec()
    for _ in range(10):
        o = hazirla(n, DOLGU_OLCEK)
        yer = dene(o, yigina=0.9)
        if yer:
            x, y, bolge, am, _ = yer
            bas(o, x, y, 0.8)
            isaretle(bolge, am, DOLGU)
            break

# Seçilebilen pikseller: en üstte olmak yetmez; sonradan düşen gölgeyle fazla kararmamış ve
# kıymık kadar küçük olmayan parçalarda olmalı. Tıklama denetimi de bu maskeyle yapılmalı.
son_L = np.asarray(tuval.convert("L"), np.float32)
secilir = np.zeros((H, W), np.int16)
for k, n in yerlesen:
    m = (kimlik == k) & (son_L >= SECILIR_ISIK * ilk)
    lbl, say = ndi.label(m)
    if say:
        boy = ndi.sum(m, lbl, range(1, say + 1))
        m = np.isin(lbl, 1 + np.nonzero(boy >= EN_AZ_PARCA)[0])
    secilir[m] = k

# Son dokunuş
dizi = np.asarray(tuval, np.float32)
yy, xx = np.mgrid[0:H, 0:W]
if LAMBA:
    # Tek lamba: ışık uzaklıkla azalır; aydınlık yer sıcak, karanlık yer soğuk. Masa ve nesneler aynı ışığı alır.
    uzaklik = np.hypot(xx / W - LAMBA[0], (yy - LAMBA[1] * H) / W)
    yakinlik = np.exp(-((uzaklik / 0.6) ** 2))[..., None].astype(np.float32)
    guc = LAMBA[2] + (1 - LAMBA[2]) * yakinlik
    renk = np.array([0.98, 0.93, 0.82], np.float32) * yakinlik + np.array([0.86, 0.90, 1.02], np.float32) * (1 - yakinlik)
    tuval = Image.fromarray(np.clip(dizi * guc * renk, 0, 255).astype(np.uint8))
else:
    vinyet = 1 - 0.25 * (((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2) / 0.5)
    dizi = dizi * 0.92 + np.array([255, 200, 140], np.float32) * 0.08 * (dizi.mean(-1, keepdims=True) / 255)
    tuval = Image.fromarray(np.clip(dizi * vinyet[..., None], 0, 255).astype(np.uint8))

ad = f"sahne_{TOHUM}" + (f"_lamba{LAMBA[2]:g}" if LAMBA else "")
tuval.save(CIKTI / f"{ad}.webp", quality=85)
# piksel sahiplik haritası: her pikselde en üstteki hedef nesnenin sırası (isabet denetimi bununla yapılabilir)
np.save(CIKTI / f"{ad}_kimlik.npy", secilir)
(CIKTI / f"{ad}_kimlik.json").write_text(json.dumps({k: n["id"] for k, n in yerlesen}, ensure_ascii=False), encoding="utf-8")
bos = (kimlik == 0).mean()


# Kutular: nesnenin görünen kısmının sınırları, görselin yüzdesi
def kutu(k):
    ys, xs = np.where(secilir == k)
    r = lambda v: round(float(v), 1)
    return [r(xs.min() / W * 100), r(ys.min() / H * 100), r((xs.max() - xs.min()) / W * 100), r((ys.max() - ys.min()) / H * 100)]


def konum(b):
    cx, cy = b[0] + b[2] / 2, b[1] + b[3] / 2
    yatay = "sol" if cx < 33 else "sağ" if cx > 67 else ""
    dikey = "üst" if cy < 33 else "alt" if cy > 67 else ""
    if yatay and dikey:
        return f"{yatay} {dikey} köşedeki"
    return f"{yatay or dikey} taraftaki" if yatay or dikey else "ortadaki"


# Karanlıkta kalan hedef: görünür pikselleri ortalamada çok koyu, oyuncudan bulması istenmez (dağınıklık olarak kalır)
koyu = set()
if LAMBA:
    L = np.asarray(tuval.convert("L"), np.float32)
    koyu = {k for k, _ in yerlesen if (secilir == k).any() and L[secilir == k].mean() < EN_AZ_KOYU}

nesneler, asil = [], []
cizim = tuval.copy()
d = ImageDraw.Draw(cizim)
gizli = []
for k, n in yerlesen:
    oran = (secilir == k).sum() / toplam[k]
    yer = ASIL_YERLER.get(n["id"])
    if (oran < EN_AZ_ETKIN or k in koyu) and not yer:
        gizli.append(n["id"])
        continue
    if not (secilir == k).any():  # asıl yer her durumda listede kalır
        secilir[kimlik == k] = k
    b = kutu(k)
    if yer:
        asil.append({"id": n["id"], "box": b, "prompt": f"Kanıt {konum(b)} {yer} olabilir."})
    else:
        nesneler.append({"id": n["id"], "label": n["label"], "box": b, "gorunur": round(oran * 100)})
    renk = (255, 40, 40) if yer else (40, 255, 80)
    d.rectangle([b[0] * W / 100, b[1] * H / 100, (b[0] + b[2]) * W / 100, (b[1] + b[3]) * H / 100], outline=renk, width=4)
    d.text((b[0] * W / 100 + 6, b[1] * H / 100 + 4), f"{n['label']} %{round(oran * 100)}", fill=renk)
cizim.save(CIKTI / f"{ad}_kutular.png")

satirlar = [f"      {{ id: '{o['id']}', label: '{o['label']}', box: {o['box']} }}, // görünen %{o['gorunur']}" for o in nesneler]
asil_satir = [f"      {{ id: '{a['id']}', box: {a['box']}, prompt: '{a['prompt']}' }}," for a in asil]
(CIKTI / f"{ad}.ts").write_text(
    "    objects: [\n" + "\n".join(satirlar) + "\n    ],\n    finalSpots: [\n" + "\n".join(asil_satir) + "\n    ],\n",
    encoding="utf-8",
)
print(f"listeye girmeyen (yeterince seçilemiyor): {', '.join(gizli) or 'yok'}")
print(f"{ad}: {len(nesneler)} hedef nesne, masanın %{bos * 100:.0f}'i boş kaldı")

# --- Oyuna aktarma (havuz.py çağırır): python diz.py <tohum> <cm> --oyun <evren>/<mekân>/<alan> --varyant v7 --yer "..."
# Görseli frontend/public'e, sahne kaydını ve piksel maskesini backend'e yazar. Maske istemciye gitmez.
if "--oyun" in sys.argv:
    import base64
    import gzip

    evren, mekan, alan = secenek("--oyun").split("/")
    varyant = secenek("--varyant", f"v{TOHUM}")
    gorsel_yolu = f"/search-scenes/{evren}/{mekan}/{alan}/{varyant}.webp"
    (DEPO / "frontend/public" / gorsel_yolu.lstrip("/")).parent.mkdir(parents=True, exist_ok=True)
    tuval.save(DEPO / "frontend/public" / gorsel_yolu.lstrip("/"), quality=85)

    # Maske: dörtte bir çözünürlük, her hücrede ortasındaki pikselin sahibi (listedeki sırası + 1)
    ids = [o["id"] for o in nesneler] + [a["id"] for a in asil]
    sira = {k: ids.index(n["id"]) + 1 for k, n in yerlesen if n["id"] in ids}
    kucuk = secilir[2::4, 2::4]
    hucre = np.zeros(kucuk.shape, np.uint8)
    for k, v in sira.items():
        hucre[kucuk == k] = v
    veri = base64.b64encode(gzip.compress(hucre.tobytes(), 9, mtime=0)).decode()

    metin = lambda v: json.dumps(v, ensure_ascii=False)
    nesne_satir = "\n".join(f"    {{ id: {metin(o['id'])}, label: {metin(o['label'])}, box: {o['box']}, visibility: {o['gorunur']} }}," for o in nesneler)
    asil_satir = "\n".join(f"    {{ id: {metin(a['id'])}, box: {a['box']}, prompt: {metin(a['prompt'])} }}," for a in asil)
    uretilen = DEPO / "backend/src/search/scenes/generated"
    uretilen.mkdir(exist_ok=True)
    (uretilen / f"{evren}-{mekan}-{alan}-{varyant}.ts").write_text(
        f"""import type {{ SearchSceneDef }} from '../../search-scene';

// tools/arama-sahne/havuz.py ile üretildi (tohum {TOHUM}, yüzey {MASA}, {MASA_CM:g} cm, lamba {secenek("--lamba", "yok")}); elle düzenleme
export const SCENE: SearchSceneDef = {{
  universe: {metin(evren)},
  locationId: {metin(mekan)},
  areaId: {metin(alan)},
  variant: {metin(varyant)},
  clueSpot: {metin(secenek("--yer", ""))},
  image: {metin(gorsel_yolu)},
  status: 'DRAFT',
  objects: [
{nesne_satir}
  ],
  finalSpots: [
{asil_satir}
  ],
  mask: {{
    width: {hucre.shape[1]},
    height: {hucre.shape[0]},
    ids: {metin(ids)},
    data: '{veri}',
  }},
}};
""",
        encoding="utf-8",
    )
    print(f"oyuna aktarıldı: {gorsel_yolu}, maske {hucre.shape[1]}x{hucre.shape[0]} ({len(veri) // 1024} KB)")
