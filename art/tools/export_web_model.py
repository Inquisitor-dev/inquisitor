# Menü ve gardıroptaki gerçek zamanlı 3D gösterim için karakteri tarayıcıya uygun GLB'ye çevirir:
#   - Mixamo durma animasyonlu iskelet + gövde (varsayılan <id>_idle.fbx; --clip pose ile <id>_pose.fbx,
#     yani gardırop duruşu harita durma sprite'larından ayrı seçilebilir)
#   - malzemeler görselden-3D aracının orijinal modelinden (render_character.py ile aynı)
#   - yalnızca dikişsiz döngü aralığı (best_idle_loop) dışa aktarılır
#
# Kullanım:
#   blender -b -P art/tools/export_web_model.py -- --outfit engizitor [--clip pose]
#   npx @gltf-transform/cli optimize art/characters/<id>/web/<id>.glb \
#       frontend/public/characters/<id>/model.glb --compress meshopt --texture-compress webp --texture-size 2048
#
# Çıktı: art/characters/<id>/web/<id>.glb (sıkıştırılmamış ara dosya)
import argparse
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from render_character import (  # noqa: E402
    ROOT,
    apply_glb_materials,
    assign_action,
    best_idle_loop,
    glb_materials,
    import_fbx,
    take_action,
)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument("--outfit", required=True)
p.add_argument(
    "--clip",
    default="idle",
    help="Kullanılacak Mixamo klibi: source/<id>_<clip>.fbx (varsayılan idle; gardırop duruşu için pose)",
)
args = p.parse_args(argv)

src = os.path.join(ROOT, "art", "characters", args.outfit, "source")
out_dir = os.path.join(ROOT, "art", "characters", args.outfit, "web")
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30

clip_path = os.path.join(src, f"{args.outfit}_{args.clip}.fbx")
if not os.path.exists(clip_path):
    sys.exit(f"Klip bulunamadı: {clip_path}")
arm, meshes = import_fbx(clip_path)
idle_action = take_action(arm)
mats = glb_materials(os.path.join(src, f"{args.outfit}_model.glb"), args.outfit)
for m in meshes:
    apply_glb_materials(m, mats)

i_start, i_end = (int(v) for v in idle_action.frame_range)
assign_action(arm, idle_action)
loop_a, loop_b = best_idle_loop(scene, arm, i_start, i_end)
scene.frame_start, scene.frame_end = loop_a, loop_b
idle_action.name = "idle"
print(f"IDLE_LOOP {loop_a}-{loop_b}")

dst = os.path.join(out_dir, f"{args.outfit}.glb")
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="ACTIVE_ACTIONS",
    export_frame_range=True,
    export_force_sampling=True,
    export_image_format="WEBP",
    export_cameras=False,
    export_lights=False,
)
print("EXPORT_DONE", dst)
