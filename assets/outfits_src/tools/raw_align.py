"""Antigravity'nin ürettiği ham giydirilmiş görseli (gri zemin) çıplak gövdeye hizalar.

align_raw(path) -> (rgba 560x760 hizalanmış görsel, uygulanan (ölçek, dx, dy))
Arka plan köşelerden taşma dolgusuyla silinir; hizalama, kafa ve kollarda gövdeyle olan renk
farkını en aza indiren ölçek/kaydırma aranarak yapılır.
"""
from collections import deque

import numpy as np
from PIL import Image

OUT = 'frontend/public/characters/outfits/'
W, H = 560, 760


def remove_bg(rgb, tol=18):
    h, w, _ = rgb.shape
    ref = np.median(np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]), axis=0)
    close = (np.abs(rgb.astype(int) - ref).max(axis=2) < tol)
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if close[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if close[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and close[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    return np.dstack([rgb, alpha])


_cache = {}


def place(raw_rgba, s, dx, dy):
    key = (id(raw_rgba), round(s, 6))
    if key not in _cache:
        im = Image.fromarray(raw_rgba)
        _cache.clear()
        _cache[key] = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    im = _cache[key]
    canvas = Image.new('RGBA', (W, H))
    canvas.paste(im, (int(round((W - im.width) / 2 + dx)), int(round((H - im.height) / 2 + dy))))
    return np.array(canvas)


def align_raw(path):
    raw = remove_bg(np.array(Image.open(path).convert('RGB')))
    base = np.array(Image.open(OUT + 'base_nude.png').convert('RGBA')).astype(int)
    ra = raw[:, :, 3] > 0
    rows = np.nonzero(ra.any(axis=1))[0]
    brows = np.nonzero((base[:, :, 3] > 0).any(axis=1))[0]
    # kaba ölçek: kafa tepesinden el bileklerine kadar boy (ayaklar kıyafete göre değişebilir)
    s0 = (brows.max() - brows.min()) / (rows.max() - rows.min())
    # karşılaştırma bölgesi: kafa ve üst kollar (kıyafetlerin çoğu buralara dokunmaz)
    region = np.zeros((H, W), bool)
    region[20:150, 170:390] = True
    best = None
    for s in np.arange(s0 * 0.94, s0 * 1.06, s0 * 0.01):
        for dx in range(-24, 25, 3):
            for dy in range(-30, 31, 3):
                p = place(raw, s, dx, dy).astype(int)
                m = region & (p[:, :, 3] > 0) & (base[:, :, 3] > 0)
                if m.sum() < 2000:
                    continue
                err = np.abs(p[:, :, :3] - base[:, :, :3])[m].mean() + 40 * (1 - m.sum() / region.sum())
                if best is None or err < best[0]:
                    best = (err, s, dx, dy)
    _, s, dx, dy = best
    # ince ayar
    for ddx in (-2, -1, 0, 1, 2):
        for ddy in (-2, -1, 0, 1, 2):
            p = place(raw, s, dx + ddx, dy + ddy).astype(int)
            m = region & (p[:, :, 3] > 0) & (base[:, :, 3] > 0)
            err = np.abs(p[:, :, :3] - base[:, :, :3])[m].mean() + 40 * (1 - m.sum() / region.sum())
            if err < best[0]:
                best = (err, s, dx + ddx, dy + ddy)
    _, s, dx, dy = best
    return place(raw, s, dx, dy), (s, dx, dy, best[0])


def widen_to_body(layer, y0, y1, max_px=14, margin=3):
    """Gövde kıyafetinin omuz/kol bölgesini satır satır, çıplak gövdeyi örtecek kadar genişletir.

    Sadece her satırın dış bandı esnetilir (nakış/düğme gibi iç ayrıntılar bozulmaz).
    """
    body = np.array(Image.open(OUT + 'base_body.png').convert('RGBA'))
    src = layer.astype(float)
    out = src.copy()
    rows = {}
    for y in range(y0, y1):
        b = np.nonzero(body[y, :, 3] > 0)[0]
        r = np.nonzero(layer[y, :, 3] > 40)[0]
        if len(b) == 0 or len(r) < 10 or (r.max() - r.min()) < 0.7 * (b.max() - b.min()):
            continue
        rows[y] = (min(max(r.min() - (b.min() - margin), 0), max_px),
                   min(max((b.max() + margin) - r.max(), 0), max_px), r.min(), r.max())
    if not rows:
        return layer
    ys = sorted(rows)
    sm = lambda v, k=7: np.convolve(np.pad(v, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid')
    fade = np.clip((y1 - np.array(ys)) / 25, 0, 1)
    left = sm(np.array([rows[y][0] for y in ys], float)) * fade
    right = sm(np.array([rows[y][1] for y in ys], float)) * fade
    xs = np.arange(W, dtype=float)
    for i, y in enumerate(ys):
        _, _, rl, rr = rows[y]
        band = 0.35 * (rr - rl) / 2
        il, ir = rl + band, rr - band
        nl, nr = rl - left[i], rr + right[i]
        sx = xs.copy()
        m = xs < il
        sx[m] = il - (il - xs[m]) * (il - rl) / max(il - nl, 1e-6)
        m = xs > ir
        sx[m] = ir + (xs[m] - ir) * (rr - ir) / max(nr - ir, 1e-6)
        for ch in range(4):
            out[y, :, ch] = np.interp(sx, xs, src[y, :, ch])
    out = out.clip(0, 255).astype(np.uint8)
    # esnetmeden kalan 1-2 piksellik yatay çizgileri at (dikey açma)
    a = out[y0:y0 + 50, :, 3] > 40
    er = a.copy()
    er[1:-1] = a[1:-1] & a[:-2] & a[2:]
    op = er.copy()
    op[1:-1] = er[1:-1] | er[:-2] | er[2:]
    out[y0:y0 + 50, :, 3] = np.where(a & ~op, 0, out[y0:y0 + 50, :, 3])
    return out
