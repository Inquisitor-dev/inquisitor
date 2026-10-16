# Bir Mixamo klibinin karelerini tek bir ızgara görsele render eder (kırpma aralığı seçmek ve
# parmak/el bozukluklarını denetlemek için). Eevee, önden ortografik kamera, şeffaf olmayan gri fon.
#
# Kullanım:
#   blender -b -P art/tools/clip_sheet.py -- --outfit sokak_kurdu [--clip pose] [--step 6]
#       [--range 10-90] [--hands] [--glb] [--cols 8]
#
#   --clip   source/<id>_<clip>.fbx (varsayılan pose)
#   --glb    FBX yerine export_web_model.py'nin çıktısını (web/<id>.glb) render eder: kırpma ve
#            POSE_TWEAKS uygulanmış son hâl
#   --hands  Kadraj ellere yakın (bel–diz arası, iki kat büyük)
#   --tweaks FBX'e render_character.POSE_TWEAKS uygulanır (parmak ayarını dışa aktarmadan önce görmek için)
#
# Çıktı: art/characters/<id>/render/clip_sheet_<clip>[_hands][_tweaks][_glb].png
#        Hücreler soldan sağa, yukarıdan aşağı; hangi karenin hangi hücrede olduğu konsola yazılır.
import argparse
import math
import os
import sys
import tempfile

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from render_character import (  # noqa: E402
    ROOT,
    apply_glb_materials,
    apply_pose_tweaks,
    assign_action,
    glb_materials,
    import_fbx,
    setup_lights,
    setup_render,
    take_action,
)

CELL = (240, 360)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument("--outfit", required=True)
p.add_argument("--clip", default="pose")
p.add_argument("--step", type=int, default=6)
p.add_argument("--range", default="")
p.add_argument("--cols", type=int, default=8)
p.add_argument("--hands", action="store_true")
p.add_argument("--glb", action="store_true")
p.add_argument("--tweaks", action="store_true", help="FBX'e POSE_TWEAKS uygula (dışa aktarmadan önce dene)")
args = p.parse_args(argv)

char = os.path.join(ROOT, "art", "characters", args.outfit)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
setup_render(scene)
setup_lights()
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
scene.render.film_transparent = False

if args.glb:
    bpy.ops.import_scene.gltf(filepath=os.path.join(char, "web", f"{args.outfit}.glb"))
    arm = next(o for o in scene.objects if o.type == "ARMATURE")
    for o in list(scene.objects):
        if o.type not in ("ARMATURE", "MESH"):
            bpy.data.objects.remove(o, do_unlink=True)
    action = bpy.data.actions[0]
    assign_action(arm, action)
else:
    arm, meshes = import_fbx(os.path.join(char, "source", f"{args.outfit}_{args.clip}.fbx"))
    action = take_action(arm)
    mats = glb_materials(os.path.join(char, "source", f"{args.outfit}_model.glb"), args.outfit)
    for m in meshes:
        apply_glb_materials(m, mats)
    if args.tweaks:
        apply_pose_tweaks(arm, action, args.outfit)

start, end = (int(v) for v in action.frame_range)
if args.range:
    start, end = (int(v) for v in args.range.split("-"))
frames = list(range(start, end + 1, args.step))
if frames[-1] != end:
    frames.append(end)
print(f"CLIP_RANGE {int(action.frame_range[0])}-{int(action.frame_range[1])}")
print("CELLS", " ".join(str(f) for f in frames))

# Kamera: önden ortografik; ayaklar z=0 kabul edilir, boy ilk kareden ölçülür
scene.frame_set(frames[0])
height = max((arm.matrix_world @ b.head).z for b in arm.pose.bones) * 1.08
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = "ORTHO"
scene.render.resolution_x, scene.render.resolution_y = CELL
if args.hands:
    # Bel ile diz arası, eller yanlardayken kadrajda kalır
    cam.data.ortho_scale = height * 0.55
    center_z = height * 0.42
else:
    cam.data.ortho_scale = height * 1.1
    center_z = height * 0.5
cam.location = Vector((0, -20, center_z))
cam.rotation_euler = (math.radians(90), 0, 0)

tmp = tempfile.mkdtemp(prefix="clip_sheet_")
paths = []
for f in frames:
    scene.frame_set(f)
    path = os.path.join(tmp, f"{f:04d}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    paths.append(path)

# Kareleri tek görselde birleştir (Blender'ın numpy'si ile)
import numpy as np  # noqa: E402

cols = min(args.cols, len(paths))
rows = math.ceil(len(paths) / cols)
w, h = CELL
sheet = np.zeros((rows * h, cols * w, 4), dtype=np.float32)
sheet[..., 3] = 1.0
for i, path in enumerate(paths):
    img = bpy.data.images.load(path)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    r, c = divmod(i, cols)
    # Blender pikselleri alttan başlar; satırları yukarıdan aşağı yerleştir
    y0 = (rows - 1 - r) * h
    sheet[y0 : y0 + h, c * w : (c + 1) * w] = px
    bpy.data.images.remove(img)

suffix = ("_hands" if args.hands else "") + ("_tweaks" if args.tweaks else "") + ("_glb" if args.glb else "")
out = os.path.join(char, "render", f"clip_sheet_{args.clip}{suffix}.png")
os.makedirs(os.path.dirname(out), exist_ok=True)
result = bpy.data.images.new("sheet", width=cols * w, height=rows * h, alpha=True)
result.pixels[:] = sheet.ravel()
result.filepath_raw = out
result.file_format = "PNG"
result.save()
print("SHEET_DONE", out)
