"""Çıplak gövdeyi parçalara ayırır ve kıyafetlerin örtmesi gereken gövde parçalarını hazırlar.

Katman sistemi yalnızca piksel ekleyebildiği için, kıyafetin altından taşan saç ve ayaklar
gövdeden ayrı çizilir:
  base_body.png  -> saçsız, ayaksız gövde (her zaman çizilir)
  base_hair.png  -> saç (kafa eşyası yoksa çizilir)
  base_feet.png  -> çıplak ayaklar (ayakkabı yoksa çizilir)
  <id>_hair.png  -> o kafa eşyası giyilince çizilecek saç: eşyanın dış silüetinin dışında kalıp
                    alt kenarının üstünde olan saç pikselleri silinmiştir.
Ayrıca çizme katmanlarının üst ağzındaki siyah iç kısım şeffaflaştırılır (pantolon içeri sokulmuş görünür).

Çalıştırma (repo kökünden): python assets/outfits_src/tools/occlusion.py
Çizme ağzı temizliği her çalıştırmada tekrar aşındırmasın diye yalnızca --clean-shoes ile yapılır.
"""
from collections import deque
import os
import sys

import numpy as np
from PIL import Image

OUT = 'frontend/public/characters/outfits/'
HEAD_ITEMS = [
    'outfit_wide_brim_hat', 'outfit_inquisitor_hood', 'outfit_cardinal_mitre',
    'outfit_nasal_helm', 'outfit_velvet_beret', 'outfit_black_zucchetto',
    'outfit_executioner_hood',
]
SHOE_ITEMS = ['outfit_riding_boots', 'outfit_iron_greaves', 'outfit_poulaines']

HAIR_MAX_Y = 125   # saç bu satırın altına inmez (sakal ve kaşlar korunur)
FEET_MIN_Y = 615   # ayaklar paçanın altından başlar


def load(path):
    return np.array(Image.open(path).convert('RGBA'))


def save(arr, path):
    Image.fromarray(arr.astype(np.uint8)).save(path, optimize=True)


def fill_holes(mask):
    """Kenara bağlı olmayan boşlukları doldurur (kukuletanın yüz açıklığı gibi)."""
    h, w = mask.shape
    outside = np.zeros_like(mask)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    return ~outside


# Görünüm sonekleri: önden ('') ve diğer yönler. Batı, doğunun aynası olduğu için ayrıca üretilmez.
VIEWS = ['', '_east', '_north']


def process_view(sfx):
    path = OUT + f'base_nude{sfx}.png'
    if not os.path.exists(path):
        return
    base = load(path)
    h, w = base.shape[:2]
    r, g, b, a = [base[:, :, i].astype(int) for i in range(4)]
    lum = np.maximum(np.maximum(r, g), b)
    ys = np.arange(h)[:, None].repeat(w, axis=1)
    vis = a > 0

    # Saç: kafa bölgesindeki koyu, ten olmayan pikseller
    skin = (lum > 120) & (r - b > 45)
    hair = vis & (ys < HAIR_MAX_Y) & (lum < 150) & ~skin
    # Ayakların başladığı satır: bacakların en ince olduğu satır (ayak bileği). Bacaklar çıplak olduğu için
    # ten rengine bakmak yetmez; ayakkabı sadece bilekten aşağısını gizlemeli.
    widths = vis.sum(axis=1)
    lo, hi = 600, 680  # ayak tabanına inmeden (ayaklar dışa açık olunca alt satırlar daralır)
    feet_min = lo + int(np.argmin(widths[lo:hi])) - 4
    print(sfx or '_south', 'ayak başlangıcı (bilek)', feet_min)
    # Ayaklar: paça hizasının altındaki ten pikselleri ve tamamen alttaki her şey
    feet = vis & (ys >= feet_min)
    # kenarlardaki yarı saydam ten pikselleri de ayağa dahil olsun (2px genişlet, paça hizasının altında)
    grown = feet.copy()
    for _ in range(2):
        g2 = grown.copy()
        g2[1:] |= grown[:-1]; g2[:-1] |= grown[1:]; g2[:, 1:] |= grown[:, :-1]; g2[:, :-1] |= grown[:, 1:]
        grown = g2
    feet = feet | (grown & vis & (ys >= feet_min) & (lum > 60) & (r - b > 20))

    def part(mask):
        out = base.copy()
        out[:, :, 3] = np.where(mask, base[:, :, 3], 0)
        return out

    save(part(vis & ~hair & ~feet), OUT + f'base_body{sfx}.png')
    save(part(hair), OUT + f'base_hair{sfx}.png')
    save(part(feet), OUT + f'base_feet{sfx}.png')
    print(sfx or '_south', 'saç px', int(hair.sum()), 'ayak px', int(feet.sum()))

    for item in HEAD_ITEMS:
        path = OUT + item + f'{sfx}.png'
        if not os.path.exists(path):
            continue
        silhouette = fill_holes(load(path)[:, :, 3] > 40)
        hide = np.zeros_like(hair)
        for x in np.nonzero(silhouette.any(axis=0))[0]:
            bottom = np.nonzero(silhouette[:, x])[0].max()
            hide[:bottom, x] = True
        hide &= ~silhouette
        save(part(hair & ~hide), OUT + item + f'_hair{sfx}.png')
        print(item + sfx, 'gizlenen saç px', int((hair & hide).sum()))


def main():
    for sfx in VIEWS:
        process_view(sfx)
    ys = np.arange(760)[:, None].repeat(560, axis=1)

    for item in (SHOE_ITEMS if '--clean-shoes' in sys.argv else []):
        path = OUT + item + '.png'
        if not os.path.exists(path):
            continue
        layer = load(path)
        al = layer[:, :, 3] > 40
        rows = np.nonzero(al.any(axis=1))[0]
        top, bottom = rows.min(), rows.max()
        llum = layer[:, :, :3].max(axis=2)
        mouth = al & (llum < 40) & (ys < top + (bottom - top) * 0.25)
        layer[:, :, 3] = np.where(mouth, 0, layer[:, :, 3])
        save(layer, path)
        print(item, 'temizlenen ağız px', int(mouth.sum()))


if __name__ == '__main__':
    main()
