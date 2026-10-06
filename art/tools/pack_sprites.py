# render_character.py'nin ürettiği PNG kareleri oyunun kullandığı sprite sheet'lere paketler ve
# frontend/public/characters/<id>/manifest.json yazar.
#
# Kullanım (Blender değil, normal Python + Pillow):
#   python art/tools/pack_sprites.py --outfit default
import argparse
import json
import math
import os
import time

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TURNTABLE_COLUMNS = 12
WEBP_QUALITY = 90

# Ekran yönleri: açı, ekranda sağdan saat yönünde (y aşağı); render_character.py ile aynı
SCREEN_DIRECTIONS = {
    "east": 0,
    "south-east": 45,
    "south": 90,
    "south-west": 135,
    "west": 180,
    "north-west": 225,
    "north": 270,
    "north-east": 315,
}


def frames_in(folder):
    return [os.path.join(folder, f) for f in sorted(os.listdir(folder)) if f.endswith(".png")]


def save_webp(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # OneDrive senkronizasyonu dosyayı kısa süre kilitleyebilir; birkaç kez dene
    for attempt in range(10):
        try:
            img.save(path, "WEBP", quality=WEBP_QUALITY, method=6, exact=True)
            return
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(1)


def strip(paths):
    frames = [Image.open(p).convert("RGBA") for p in paths]
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * w, 0))
    return sheet


def grid(paths, columns):
    frames = [Image.open(p).convert("RGBA") for p in paths]
    w, h = frames[0].size
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGBA", (w * columns, h * rows))
    for i, f in enumerate(frames):
        sheet.paste(f, ((i % columns) * w, (i // columns) * h))
    return sheet


def screen_stride(stride_m, px_per_m, elevation_deg, screen_deg):
    # Yerde stride_m ilerleyen karakterin bu ekran yönünde kaç piksel yol aldığı
    a = math.radians(screen_deg)
    s = math.sin(math.radians(elevation_deg))
    return stride_m * px_per_m / math.hypot(math.cos(a), math.sin(a) / s)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--outfit", required=True)
    args = p.parse_args()

    render = os.path.join(ROOT, "art", "characters", args.outfit, "render")
    out = os.path.join(ROOT, "frontend", "public", "characters", args.outfit)
    with open(os.path.join(render, "render.json"), encoding="utf-8") as f:
        meta = json.load(f)

    os.makedirs(out, exist_ok=True)

    m = meta["map"]
    manifest = {
        "id": args.outfit,
        "map": m,
        "walk": {
            "frames": meta["walk"]["frames"],
            "cycleSeconds": round(meta["walk"]["cycleSeconds"], 4),
            "strideMeters": meta["walk"]["strideMeters"],
            "stridePx": {},
            "sheets": {},
        },
        "idle": {"frames": meta["idle"]["frames"], "fps": meta["idle"]["fps"], "sheets": {}},
    }

    for name, deg in SCREEN_DIRECTIONS.items():
        save_webp(strip(frames_in(os.path.join(render, "walk", name))), os.path.join(out, "walk", f"{name}.webp"))
        manifest["walk"]["sheets"][name] = f"walk/{name}.webp"
        manifest["walk"]["stridePx"][name] = round(
            screen_stride(meta["walk"]["strideMeters"], m["pxPerMeter"], m["elevation"], deg), 2
        )
        save_webp(strip(frames_in(os.path.join(render, "idle", name))), os.path.join(out, "idle", f"{name}.webp"))
        manifest["idle"]["sheets"][name] = f"idle/{name}.webp"

    if "turntable" in meta:
        t = meta["turntable"]
        save_webp(grid(frames_in(os.path.join(render, "turntable")), TURNTABLE_COLUMNS), os.path.join(out, "turntable.webp"))
        manifest["turntable"] = {**t, "columns": TURNTABLE_COLUMNS, "src": "turntable.webp"}

    if os.path.exists(os.path.join(render, "thumb.png")):
        save_webp(Image.open(os.path.join(render, "thumb.png")).convert("RGBA"), os.path.join(out, "thumb.webp"))
        manifest["thumb"] = "thumb.webp"

    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out) for f in fs)
    print(f"PACKED {out} ({total / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
