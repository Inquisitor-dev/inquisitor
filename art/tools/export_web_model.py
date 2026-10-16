# Menü ve gardıroptaki gerçek zamanlı 3D gösterim için karakteri tarayıcıya uygun GLB'ye çevirir:
#   - Mixamo animasyonlu iskelet + gövde (varsayılan <id>_idle.fbx; --clip pose ile <id>_pose.fbx,
#     yani gardırop duruşu harita durma sprite'larından ayrı seçilebilir)
#   - malzemeler görselden-3D aracının orijinal modelinden (render_character.py ile aynı)
#   - pose klibi "bir kez oynatılır": gösterim karakter öne dönünce klibi baştan sona oynatır, ilk karesi
#     tur sırasındaki dinlenme pozudur. Klibin tamamı ya da CLIP_TRIM'deki aralık dışa aktarılır.
#   - idle klibi döngüdür: yalnızca dikişsiz döngü aralığı (best_idle_loop) dışa aktarılır
#   - pic klibi (market/gardırop görseli için ayrı poz) web/<id>_pic.glb'ye yazılır,
#     render_showcase.py varsa onu kullanır; oyuna giden model.glb değişmez
#   - render_character.POSE_TWEAKS uygulanır (ör. Sokak Kurdu'nun parmakları)
#
# Kullanım:
#   blender -b -P art/tools/export_web_model.py -- --outfit engizitor [--clip pose|idle|pic] [--loop|--once]
#   npx @gltf-transform/cli optimize art/characters/<id>/web/<id>.glb \
#       frontend/public/characters/<id>/model.glb --compress meshopt --texture-compress webp --texture-size 2048
#
# Çıktı: art/characters/<id>/web/<id>.glb (sıkıştırılmamış ara dosya); pic için web/<id>_pic.glb
import argparse
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from render_character import (  # noqa: E402
    ROOT,
    apply_glb_materials,
    apply_pose_tweaks,
    assign_action,
    best_idle_loop,
    glb_materials,
    import_fbx,
    take_action,
)

# Bir kez oynatılan kliplerin kırpma aralıkları (kaynak FBX kare numaraları, iki uç dahil).
# Klip ayakta, nötr bir pozla başlamalı ve aynı poza yakın bitmeli; ilk kare tur sırasındaki duruştur.
# Aralığı seçmek için: blender -b -P art/tools/clip_sheet.py -- --outfit <id> --clip pose
CLIP_TRIM = {
    # Kollarını açıp esneme; öncesindeki uzun bekleme ve sonrası atılır (kaynak 1-345)
    ("engizitor", "pose"): (129, 249),
    # Bileğine bakıp el hareketi; sonraki öne eğilme pozları atılır (kaynak 1-401)
    ("kizil_devre", "pose"): (1, 145),
    # Kol esnetme; sondaki hareketsiz bekleme atılır (kaynak 1-267)
    ("mavi_rozet", "pose"): (1, 185),
    # Şapkayı indirip başını eğme; sonraki bacak savurma ve öne eğilme atılır (kaynak 1-318)
    ("sis_dedektifi", "pose"): (1, 73),
    # Kollarını açıp T-poza yakın esneme; öncesindeki uzun bekleme ve sonrası atılır (kaynak 1-345)
    ("ayaz_izcisi", "pose"): (109, 235),
    # Dönüp savuran poz; başlangıç duruşuna dönen son kısım korunur, sondaki bekleme atılır (kaynak 1-276)
    ("gece_muhabiri", "pose"): (1, 241),
}

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument("--outfit", required=True)
p.add_argument(
    "--clip",
    default="idle",
    help="Kullanılacak Mixamo klibi: source/<id>_<clip>.fbx (varsayılan idle; gardırop duruşu için pose)",
)
mode = p.add_mutually_exclusive_group()
mode.add_argument("--once", action="store_true", help="Klibi döngü aramadan, tamamı/kırpılmış olarak aktar")
mode.add_argument("--loop", action="store_true", help="Dikişsiz döngü aralığını aktar")
args = p.parse_args(argv)
# pose klibi varsayılan olarak bir kez oynatılır, idle döngüdür
once = args.once or (args.clip in ("pose", "pic") and not args.loop)

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
action = take_action(arm)
mats = glb_materials(os.path.join(src, f"{args.outfit}_model.glb"), args.outfit)
for m in meshes:
    apply_glb_materials(m, mats)
apply_pose_tweaks(arm, action, args.outfit)

c_start, c_end = (int(v) for v in action.frame_range)
assign_action(arm, action)
if c_end - c_start < 15:
    # Tek karelik (sabit) poz: olduğu gibi dışa aktarılır (nefes/sallanma yok)
    a, b = c_start, max(c_end, c_start + 1)
    print("STATIC_POSE")
elif once:
    a, b = CLIP_TRIM.get((args.outfit, args.clip), (c_start, c_end))
    a, b = max(a, c_start), min(b, c_end)
    print(f"ONCE_CLIP {a}-{b} ({(b - a) / 30:.1f} sn, kaynak {c_start}-{c_end})")
else:
    a, b = best_idle_loop(scene, arm, c_start, c_end)
    print(f"IDLE_LOOP {a}-{b}")
scene.frame_start, scene.frame_end = a, b
action.name = args.clip

name = f"{args.outfit}_pic.glb" if args.clip == "pic" else f"{args.outfit}.glb"
dst = os.path.join(out_dir, name)
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="ACTIVE_ACTIONS",
    export_frame_range=True,
    # Kırpılan klibin anahtarları 0. saniyeden başlasın (yoksa ilk kare başlangıç ofseti kadar bekler)
    export_anim_slide_to_zero=True,
    export_force_sampling=True,
    export_image_format="WEBP",
    export_cameras=False,
    export_lights=False,
)
print("EXPORT_DONE", dst)
