# Düz zeminli nesne sayfalarını (kaynak/<sayfa>.png ya da .webp) tek tek saydam nesnelere böler.
# Kullanım: python kes.py [sayfa ...]   -> nesneler/<id>.webp, nesneler.json, cikti/kontrol.png
# Sayfa adı verilmezse hepsi kesilir; verilirse yalnızca onlar yeniden kesilir, öbürleri katalogda kalır.
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

KOK = Path(__file__).parent
CIKIS = KOK / "nesneler"
CIKIS.mkdir(exist_ok=True)
(KOK / "cikti").mkdir(exist_ok=True)


def kaynak(ad):
    # uret.mjs .png kaydeder; depoya yer kazanmak için .webp girer: yeni .png ilk kesimde çevrilir
    png, webp = KOK / "kaynak" / f"{ad}.png", KOK / "kaynak" / f"{ad}.webp"
    if png.exists():
        Image.open(png).save(webp, quality=95, method=6)
        png.unlink()
    return webp

# Sayfadaki sırayla (üst sıra soldan sağa, sonra alt sıralar): id, Türkçe ad, gerçek uzun kenar (cm)
# tür: hedef = aranabilir nesne, dolgu = arada serpiştirilen ufak şey (tekrar edebilir), örtü = üstlere atılan kumaş
SAYFALAR = {
    "sayfa1": [
        ("yoyo", "Yo-yo", 9), ("zeka_kupu", "Zekâ küpü", 5.7), ("sanal_hayvan", "Sanal evcil hayvan", 8),
        ("cagri_cihazi", "Çağrı cihazı", 7), ("kasetcalar", "Kasetçalar", 16), ("tek_kullanimlik_kamera", "Tek kullanımlık kamera", 12),
        ("dijital_saat", "Dijital kol saati", 16), ("el_konsolu", "El konsolu", 15), ("disket", "Disket", 9),
        ("hesap_makinesi", "Hesap makinesi", 12),
    ],
    "sayfa2": [
        ("ayicik", "Ayıcık anahtarlık", 11), ("kar_kuresi", "Kar küresi", 9), ("toka", "Kadife toka", 9),
        ("kelebek_toka", "Kelebek toka", 6), ("gunes_gozlugu", "Neon güneş gözlüğü", 15), ("lastik_ordek", "Lastik ördek", 9),
        ("dinozor", "Oyuncak dinozor", 15), ("oyuncak_araba", "Oyuncak araba", 8), ("kurmali_robot", "Kurmalı robot", 12),
        ("mizika", "Mızıka", 10),
    ],
    "sayfa3": [
        ("pusula", "Pusula", 6), ("caki", "Çakı", 10), ("cakmak", "Çakmak", 7), ("ruj", "Ruj", 8),
        ("pudralik", "Pudralık", 8), ("asma_kilit", "Asma kilit", 7), ("at", "Satranç atı", 5),
        ("fis", "Poker fişi", 4), ("cuzdan", "Cüzdan", 11), ("donut", "Isırılmış donut", 9),
    ],
    # 4. alan: masadan yükseklik (cm), gölge için
    "sayfa4": [
        ("yay", "Yay oyuncak", 8, 5), ("zipzip", "Zıp zıp top", 5, 5), ("bilye", "Bilye", 1.8, 1.8),
        ("asker", "Oyuncak asker", 5, 1.5), ("figur", "Aksiyon figürü", 10, 2.5), ("kaleydoskop", "Kaleydoskop", 15, 4),
        ("kazu", "Kazu", 11, 2), ("duduk", "Düdük", 5, 2), ("raket", "Toplu raket", 22, 1.5), ("firildak", "Fırıldak", 20, 2),
    ],
    "sayfa5": [
        ("kumanda", "Kumanda", 18, 2), ("kaset", "Kaset", 10, 1.5), ("kartus", "Oyun kartuşu", 12, 2),
        ("cep_telefonu", "Eski cep telefonu", 20, 4), ("telsiz", "Telsiz", 18, 4), ("radyo", "Cep radyosu", 13, 3.5),
        ("kulaklik", "Kulaklık", 16, 4), ("film", "Film rulosu", 5, 3.5), ("durbun", "Dürbün", 12, 4.5),
        ("isik_cubugu", "Işık çubuğu", 15, 1.5),
    ],
    "sayfa6": [
        ("yuzuk", "Yüzük", 2.5, 1.5), ("bileklik", "Şaplak bileklik", 9, 1.5), ("kolye", "Dövme kolye", 12, 0.6),
        ("arkadaslik", "Arkadaşlık bilekliği", 9, 0.6), ("ter_bandi", "Ter bandı", 9, 3), ("okuma_gozlugu", "Okuma gözlüğü", 14, 3),
        ("yuzucu", "Yüzücü gözlüğü", 17, 3), ("firca", "Saç fırçası", 22, 4), ("tarak", "Tarak", 15, 0.6), ("oje", "Oje", 7, 3),
    ],
    "sayfa7": [
        ("dis_fircasi", "Diş fırçası", 18, 2), ("sabun", "Sabun", 9, 2.5), ("bone", "Bone", 18, 2),
        ("makara", "İplik makarası", 6, 4), ("yuksuk", "Yüksük", 2.2, 2.5), ("cengelli", "Çengelli iğne", 5, 0.4),
        ("metre", "Şerit metre", 7, 3.5), ("tornavida", "Tornavida", 18, 2.5), ("fener", "El feneri", 12, 3),
        ("zil", "Bisiklet zili", 7, 4),
    ],
    "sayfa8": [
        ("golf", "Golf topu", 4.3, 4.3), ("pinpon", "Pinpon topu", 4, 4), ("beyzbol", "Beyzbol topu", 7.4, 7.4),
        ("iskambil", "İskambil kâğıtları", 12, 1.5), ("zar", "Zar", 1.8, 1.8), ("domino", "Domino taşı", 5, 1),
        ("bozuk_para_cantasi", "Bozuk para çantası", 10, 3), ("resepsiyon_zili", "Resepsiyon zili", 8, 6),
        ("calar_saat", "Çalar saat", 13, 6), ("cep_saati", "Cep saati", 14, 1.5),
    ],
    "sayfa9": [
        ("kupa", "Kupa", 12, 9), ("kutu", "Ezik kutu", 12, 6.5), ("lolipop", "Lolipop", 12, 2),
        ("pizza", "Pizza dilimi", 15, 1.5), ("elma", "Elma koçanı", 8, 6), ("termos", "Termos", 22, 8),
        ("tirbuson", "Tirbuşon", 12, 3), ("acacak", "Şişe açacağı", 10, 0.6), ("kibrit", "Kibrit kutusu", 7, 2),
        ("kasik", "Çay kaşığı", 13, 1),
    ],
    "sayfa10": [
        ("kalemtiras", "Kalemtıraş", 3.5, 2), ("silgi", "Silgi", 5, 1.5), ("pastel", "Pastel boya", 9, 1),
        ("yapistirici", "Yapıştırıcı", 9, 2.5), ("buyutec", "Büyüteç", 15, 2), ("dolma_kalem", "Dolma kalem", 14, 1.5),
        ("fosforlu", "Fosforlu kalem", 12, 1.8), ("zimba", "Zımba", 13, 5), ("kase", "Kaşe", 5, 5), ("jak", "Jak taşı", 3.5, 3),
    ],
    "dolgu1": [
        ("misir1", "Patlamış mısır", 2.5), ("misir2", "Patlamış mısır", 2.5), ("cips", "Cips", 4),
        ("simit_kraker", "Kraker simidi", 5), ("yer_fistigi", "Yer fıstığı", 3.5), ("sam_fistigi", "Fıstık kabuğu", 2),
        ("cekirdek", "Çekirdek", 1.5), ("kurabiye", "Kurabiye parçası", 5), ("kraker", "Kraker", 5),
        ("bakir_para", "Bakır para", 2), ("gumus_para", "Gümüş para", 2.4), ("atac", "Ataç", 3),
        ("lastik", "Lastik bant", 5), ("kapak", "Şişe kapağı", 2.6), ("dugme", "Düğme", 1.8),
        ("boncuk", "Boncuk", 1.2), ("vida", "Vida", 1.5), ("seker", "Şeker", 2.2), ("ayi_jeli", "Jelibon", 2),
        ("kagit_top", "Buruşuk kâğıt", 4),
    ],
    "ortu1": [
        ("bandana", "Bandana", 26), ("pecete", "Kareli peçete", 24), ("corap", "Çorap", 24),
        ("flanel", "Flanel kumaş", 26), ("atki", "Atkı ucu", 30),
    ],
}
SUTUN = 5
TUR = {"dolgu1": "dolgu", "ortu1": "ortu"}
# Camı ya da şeffaf plastiği olan nesneler
SAYDAM = {"kar_kuresi", "buyutec", "okuma_gozlugu", "yuzucu", "kaset", "lolipop"}


def arka_plan(img):
    """Arka planı her kanal için ikinci dereceden bir yüzeyle modeller (sayfa ışığı hafif eğimli)."""
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x, y = xx / w, yy / h
    A = np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], -1).reshape(-1, 6)
    medyan = np.median(img.reshape(-1, 3), 0)
    secim = (np.abs(img - medyan).sum(-1) < 40).reshape(-1)
    model = np.zeros_like(img)
    for _ in range(2):
        for c in range(3):
            katsayi, *_ = np.linalg.lstsq(A[secim][::50], img[..., c].reshape(-1)[secim][::50], rcond=None)
            model[..., c] = (A @ katsayi).reshape(h, w)
        secim = (np.abs(img - model).sum(-1) < 18).reshape(-1)
    # köşedeki ışık parlaması ikinci dereceden yüzeye sığmıyor: nesneler dışındaki piksellerin
    # geniş bulanıklığıyla yerel arka plan çıkar (normalize evrişim)
    gri = img.mean(-1)
    kenar = np.hypot(ndi.sobel(gri, 0), ndi.sobel(gri, 1)) > 40
    nesne = ndi.binary_dilation(ndi.binary_fill_holes(ndi.binary_closing(kenar, iterations=4)), iterations=15)
    agirlik = ndi.gaussian_filter((~nesne).astype(np.float32), 40)
    for c in range(3):
        yerel = ndi.gaussian_filter(np.where(nesne, 0, img[..., c]), 40) / np.maximum(agirlik, 1e-3)
        model[..., c] = np.where(agirlik > 0.05, yerel, model[..., c])
    return model


def maske(img, model):
    fark = np.abs(img - model).sum(-1)
    # kenar (gradyan) da işe katılır: arka plana yakın renkli nesnelerin dış çizgisi kopmasın
    gri = img.mean(-1)
    gradyan = np.hypot(ndi.sobel(gri, 0), ndi.sobel(gri, 1))
    ham = ndi.binary_closing((fark > 22) | (gradyan > 60), iterations=3)
    m = ndi.binary_fill_holes(ham)
    # donut, toka, kilit halkası gibi iç boşluklar: arka plan renginde ve düz olanları yeniden aç
    delik, n = ndi.label(m & ~ham)
    for i in range(1, n + 1):
        d = delik == i
        if d.sum() > 400 and "DEBUG" in sys.argv:
            ys, xs = np.where(d)
            print(f"  delik x{xs.mean():.0f} y{ys.mean():.0f} alan {d.sum()} fark {fark[d].mean():.1f} grad {gradyan[d].mean():.1f} std {img[d].std(0).mean():.1f}")
        # cam (kar küresi, ayna) arka plana benzer ama farkı 10'un üstünde kalıyor
        if d.sum() > 400 and fark[d].mean() < 9.5 and gradyan[d].mean() < 12:
            m[d] = False
    # boşluğun tamamı düz olmasa da (kulaklık bandıyla gövde arası gibi) arka planla birebir aynı pikseller açılır
    duz = m & ~ham & (fark < 8)
    lbl, k = ndi.label(duz)
    for i, boy in enumerate(ndi.sum(duz, lbl, range(1, k + 1)), 1):
        if boy > 300:
            m[lbl == i] = False
    m = ndi.binary_opening(m, iterations=2)
    return m, fark


def isle(ad, liste):
    img = np.asarray(Image.open(kaynak(ad)).convert("RGB")).astype(np.float32)
    h, w, _ = img.shape
    model = arka_plan(img)
    m, fark = maske(img, model)
    # mor (kroma) zemin mi: beyaz, gümüş ve cam nötr gri zeminden ayrılamıyor, mordan ayrılıyor
    zemin = model.reshape(-1, 3).mean(0)
    mor = zemin[1] < 100 and min(zemin[0], zemin[2]) > 150
    morluk = np.clip(np.minimum(img[..., 0], img[..., 2]) - img[..., 1], 0, None)
    morluk_zemin = float(np.minimum(zemin[0], zemin[2]) - zemin[1])
    # birbirine yakın parçalar (anahtarlık halkası, ip) aynı nesne sayılsın
    etiket, n = ndi.label(ndi.binary_dilation(m, iterations=12))

    def parcala():
        sonuc = []
        for i, dilim in enumerate(ndi.find_objects(etiket), 1):
            if dilim is None:
                continue
            alan = (m & (etiket == i)).sum()
            if alan > 0.002 * h * w:
                sonuc.append((i, dilim, alan))
        return sonuc

    orta = lambda p: ((p[1][0].start + p[1][0].stop) / 2, (p[1][1].start + p[1][1].stop) / 2)
    parcalar = parcala()
    # beklenenden fazla parça (termos kapağı, kibrit çöpü): en küçüğü en yakın parçaya katılır
    while len(parcalar) > len(liste):
        kucuk = min(parcalar, key=lambda p: p[2])
        ky, kx = orta(kucuk)
        komsu = min((p for p in parcalar if p is not kucuk), key=lambda p: (orta(p)[0] - ky) ** 2 + (orta(p)[1] - kx) ** 2)
        etiket[etiket == kucuk[0]] = komsu[0]
        parcalar = parcala()
    parcalar = [(i, dilim) for i, dilim, _ in parcalar]
    if len(parcalar) != len(liste):
        print(f"UYARI {ad}: {len(parcalar)} parça bulundu, {len(liste)} bekleniyordu", file=sys.stderr)
    # yukarıdan aşağı sıralara böl (her sırada SUTUN parça), sonra her sırayı soldan sağa
    merkez = lambda p, ek: (p[1][ek].start + p[1][ek].stop) / 2
    parcalar.sort(key=lambda p: merkez(p, 0))
    parcalar = [q for r in range(0, len(parcalar), SUTUN) for q in sorted(parcalar[r : r + SUTUN], key=lambda p: merkez(p, 1))]
    rgb = np.asarray(Image.open(kaynak(ad)).convert("RGB"))
    sonuc = []
    for (i, dilim), bilgi in zip(parcalar, liste):
        nid, etiket_ad, cm = bilgi[:3]
        # kenardaki gri hale kalmasın diye maske 2 px içeri çekilir
        bolge = ndi.binary_erosion(m & (etiket == i), iterations=2)
        # yumuşak kenar: maskenin içine doğru 3 px geçiş, arka plana yakın kenar pikselleri saydamlaşır
        ic = ndi.distance_transform_edt(bolge)
        alfa = np.clip(ic / 3, 0, 1) * np.clip(fark / 30, 0.35, 1)
        alfa = np.where(ic > 3, 1, alfa)
        if nid in SAYDAM and mor:
            # mor zeminde camın arkası mor görünür: morluk ne kadarsa o kadar saydam (masa içinden görünür)
            alfa = np.where(bolge, np.minimum(alfa, 1 - 0.8 * morluk / max(morluk_zemin, 1)), alfa)
        elif nid in SAYDAM:
            # gri zeminde Gemini camın arkasını sayfanın grisiyle boyuyor; arka plana benzeyen renksiz cam
            # pikselleri yarı saydam olur (parlamalar opak kalır)
            doygunluk = img.max(-1) - img.min(-1)
            cam = bolge & (fark < 35) & (doygunluk < 25)
            alfa = np.where(cam, np.minimum(alfa, np.clip(0.2 + fark / 35 * 0.6, 0.2, 0.8)), alfa)
        ys, xs = np.where(bolge)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        a = alfa[y0:y1, x0:x1, None]
        # yarı saydam kenar piksellerinden arka planın rengi çıkarılır (renk arındırma)
        temiz = (img[y0:y1, x0:x1] - (1 - a) * model[y0:y1, x0:x1]) / np.maximum(a, 0.05)
        temiz = np.where(a > 0.99, img[y0:y1, x0:x1], temiz)
        if mor:
            # mor sızıntıyı temizle: yarı saydam kenarlarda ve camda kırmızı ile mavinin yeşili aşan kısmı atılır
            # kenar bandı: nesnenin dış çizgisinden 10 px içeriye kadar (morun boyaya sindiği yer); içerideki
            # gerçek mor ve pembe renklere dokunulmaz
            sizinti = np.clip(np.minimum(temiz[..., 0], temiz[..., 2]) - temiz[..., 1], 0, None)[..., None]
            r, g, b = temiz[..., 0:1], temiz[..., 1:2], temiz[..., 2:3]
            # zeminin moru: kırmızı ve mavi yeşilden çok yüksek ve birbirine yakın (gerçek mor/pembe öyle değil)
            zemin_moru = (r - g > 70) & (b - g > 70) & (np.abs(r - b) < 45)
            bant = (((a < 0.99) | (ic[y0:y1, x0:x1, None] < 10)) & (sizinti > 25)) | zemin_moru
            temiz = np.where(bant, temiz - sizinti * np.array([1, 0, 1]), temiz)
            # çok mor kenar pikseli (ışık çubuğu parlaması gibi) saydamlaşır
            kenar = (ic[y0:y1, x0:x1] < 10) | zemin_moru[..., 0]
            alfa_kes = alfa[y0:y1, x0:x1]
            alfa[y0:y1, x0:x1] = np.where(kenar, alfa_kes * (1 - np.clip((sizinti[..., 0] - 60) / 100, 0, 1)), alfa_kes)
        rgba = np.dstack([np.clip(temiz, 0, 255).astype(np.uint8), (alfa[y0:y1, x0:x1] * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(CIKIS / f"{nid}.webp", quality=90, method=6)
        sonuc.append({"id": nid, "label": etiket_ad, "cm": cm, "tur": TUR.get(ad, "hedef"), "sayfa": ad})
        if len(bilgi) > 3:
            sonuc[-1]["h"] = bilgi[3]
    return sonuc


def kontrol_sayfasi(katalog):
    """Kesilen nesneleri dama zemin üstünde yan yana gösterir."""
    hucre, sutun = 160, 18
    satir = (len(katalog) + sutun - 1) // sutun
    zemin = Image.new("RGB", (hucre * sutun, hucre * satir), (255, 0, 255))
    for k, n in enumerate(katalog):
        o = Image.open(CIKIS / f"{n['id']}.webp")
        o.thumbnail((hucre - 20, hucre - 20))
        zemin.paste(o, ((k % sutun) * hucre + 10, (k // sutun) * hucre + 10), o)
    zemin.save(KOK / "cikti" / "kontrol.png")


secili = [a for a in sys.argv[1:] if not a.startswith("-")] or list(SAYFALAR)
bilinmeyen = [a for a in secili if a not in SAYFALAR]
if bilinmeyen:
    sys.exit(f"SAYFALAR içinde yok: {', '.join(bilinmeyen)}")
katalog_yolu = KOK / "nesneler.json"
eski = json.loads(katalog_yolu.read_text(encoding="utf-8")) if katalog_yolu.exists() else []
kesilen = [n for ad in secili for n in isle(ad, SAYFALAR[ad])]
# katalog SAYFALAR sırasında kalır; yeniden kesilmeyen sayfaların kayıtları olduğu gibi durur
katalog = [n for ad in SAYFALAR for n in (kesilen if ad in secili else eski) if n.get("sayfa") == ad]
katalog_yolu.write_text(json.dumps(katalog, ensure_ascii=False, indent=1), encoding="utf-8")
kontrol_sayfasi(katalog)
print(f"{len(kesilen)} nesne kesildi, katalogda {len(katalog)} nesne")
