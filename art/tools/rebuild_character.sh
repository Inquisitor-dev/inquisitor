#!/usr/bin/env bash
# Bir karakterin oyun varlıklarını baştan üretir (Blender + gltf-transform + Pillow gerekir).
#
# Kullanım (repo kökünden, Git Bash):
#   art/tools/rebuild_character.sh <id> [--pose] [--sprites]
#
#   --pose     Gardırop/menü 3D modelini source/<id>_pose.fbx klibiyle üretir (varsayılan <id>_idle.fbx).
#              Harita sprite'ları (yürüme/durma) idle klibinden üretilmeye devam eder.
#   --sprites  Harita yürüme/durma + turntable sprite'larını da yeniden render eder (karakter başına ~5 dk)
#              ve manifest.json'u yeniden paketler. Malzeme ayarı (OUTFIT_TWEAKS) veya yürüme/durma klibi
#              değiştiyse gerekir; yalnızca duruş değiştiyse gerekmez.
#
# Her çalıştırmada: web GLB → sıkıştırma (frontend/public/characters/<id>/model.glb) → thumb + portrait → paketleme.
# BLENDER ortam değişkeniyle Blender yolu verilebilir.
set -euo pipefail

ID="${1:-}"
[ -n "$ID" ] || { sed -n 2,14p "$0"; exit 1; }
shift
CLIP=idle
SPRITES=0
for arg in "$@"; do
  case "$arg" in
    --pose) CLIP=pose ;;
    --sprites) SPRITES=1 ;;
    *) echo "Bilinmeyen seçenek: $arg"; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BLENDER="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.2/blender.exe}"
CHAR="$ROOT/art/characters/$ID"
PUBLIC="$ROOT/frontend/public/characters/$ID"
[ -d "$CHAR/source" ] || { echo "Karakter klasörü yok: $CHAR/source"; exit 1; }
[ -f "$CHAR/source/${ID}_${CLIP}.fbx" ] || { echo "Klip yok: $CHAR/source/${ID}_${CLIP}.fbx"; exit 1; }

echo "[1/5] Web GLB ($CLIP klibi)"
"$BLENDER" -b -P "$ROOT/art/tools/export_web_model.py" -- --outfit "$ID" --clip "$CLIP" | grep -E "IDLE_LOOP|EXPORT_DONE|Traceback|Klip"

echo "[2/5] GLB sıkıştırma"
(cd "$ROOT" && npx --yes @gltf-transform/cli optimize "art/characters/$ID/web/$ID.glb" "frontend/public/characters/$ID/model.glb" \
  --compress meshopt --texture-compress webp --texture-size 2048 2>&1 | tail -1)

echo "[3/5] Thumb + portrait"
"$BLENDER" -b -P "$ROOT/art/tools/render_showcase.py" -- --outfit "$ID" | grep -E "SHOWCASE_DONE|Traceback"
"$BLENDER" -b -P "$ROOT/art/tools/render_showcase.py" -- --outfit "$ID" --portrait | grep -E "SHOWCASE_DONE|Traceback"

if [ "$SPRITES" = 1 ]; then
  echo "[4/5] Sprite render (yürüme, durma, turntable)"
  "$BLENDER" -b -P "$ROOT/art/tools/render_character.py" -- --outfit "$ID" --only walk,idle,turntable | grep -E "Traceback|Error:" || true
else
  echo "[4/5] Sprite render atlandı (--sprites ile açılır)"
fi

echo "[5/5] Paketleme"
(cd "$ROOT" && python art/tools/pack_sprites.py --outfit "$ID")
# pack_sprites yalnızca anahtar sırasını değiştirdiyse manifest'i geri al (gereksiz diff olmasın)
(cd "$ROOT" && PYTHONIOENCODING=utf-8 python -I - "$ID" <<'PY'
import json, subprocess, sys
p = f"frontend/public/characters/{sys.argv[1]}/manifest.json"
try:
    old = json.loads(subprocess.check_output(["git", "show", f"HEAD:{p}"]))
except Exception:
    sys.exit(0)
if old == json.load(open(p, encoding="utf-8")):
    subprocess.run(["git", "checkout", "--", p], check=True)
    print("manifest.json değişmedi")
PY
)
echo "Bitti: $PUBLIC"
