# Görselden-3D aracından (Meshy, Tripo...) gelen GLB'yi Mixamo'ya yüklemeye hazırlar:
#   - modeli istenen boya ölçekler (render 1 m = sabit piksel varsaydığı için boy doğru olmalı)
#   - ayakları z=0'a oturtur, gövdeyi orijinde ortalar
#   - üçgen sayısını düşürür, büyük dokuları küçültür (Mixamo ağır dosyalarda zorlanır)
#   - dokuları gömülü FBX çıkarır
#
# Kullanım:
#   blender -b -P art/tools/prepare_model.py -- --outfit <id> [--height 1.70] [--tris 50000] [--texture 2048]
#
# Girdi:  art/characters/<id>/source/<id>_model.glb
# Çıktı:  art/characters/<id>/source/<id>_mixamo.fbx (+ inceleme için .blend)
import argparse
import os
import sys

import bpy
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Bu aralığın dışındaki boy büyük ihtimalle yanlış ölçektir (ör. 0,98 m)
PLAUSIBLE_HEIGHT = (1.4, 2.2)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument("--outfit", required=True)
p.add_argument("--height", type=float, help="Karakterin şapka/saç dahil boyu (m). Verilmezse model boyu korunur.")
p.add_argument("--tris", type=int, default=50_000, help="Hedef üçgen sayısı")
p.add_argument("--texture", type=int, default=2048, help="Dokuların en büyük kenarı (px)")
args = p.parse_args(argv)

src_dir = os.path.join(ROOT, "art", "characters", args.outfit, "source")
src = os.path.join(src_dir, f"{args.outfit}_model.glb")
dst = os.path.join(src_dir, f"{args.outfit}_mixamo.fbx")
if not os.path.exists(src):
    sys.exit(f"Model bulunamadı: {src}")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in bpy.context.scene.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Boy: istenirse ölçekle, değilse makul olup olmadığını kontrol et
pts = [Vector(c) for c in body.bound_box]
height = max(p.z for p in pts) - min(p.z for p in pts)
if args.height:
    body.data.transform(Matrix.Scale(args.height / height, 4))
    print(f"HEIGHT {height:.3f} m -> {args.height:.3f} m")
elif not PLAUSIBLE_HEIGHT[0] <= height <= PLAUSIBLE_HEIGHT[1]:
    print(f"UYARI: model boyu {height:.3f} m, ölçek yanlış olabilir. --height ile düzelt.")

# Ayaklar zeminde, gövde ortada
pts = [Vector(c) for c in body.bound_box]
min_z = min(p.z for p in pts)
cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2
cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
body.data.transform(Matrix.Translation((-cx, -cy, -min_z)))
body.data.update()

body.data.calc_loop_triangles()
tris = len(body.data.loop_triangles)
if tris > args.tris:
    mod = body.modifiers.new("decimate", "DECIMATE")
    mod.ratio = args.tris / tris
    bpy.ops.object.modifier_apply(modifier=mod.name)
body.data.calc_loop_triangles()
print(f"TRIS {tris} -> {len(body.data.loop_triangles)}")

# Büyük dokuları küçült ve küçültülmüş hâlini pakete göm (FBX'e bu gömülür)
for img in bpy.data.images:
    w, h = img.size
    if max(w, h) > args.texture:
        s = args.texture / max(w, h)
        img.scale(max(1, round(w * s)), max(1, round(h * s)))
        img.pack()
        print(f"TEXTURE {img.name}: {w}x{h} -> {img.size[0]}x{img.size[1]}")

print("DIMS", tuple(round(v, 3) for v in body.dimensions))

body.name = "Character"
bpy.ops.export_scene.fbx(
    filepath=dst,
    use_selection=True,
    path_mode="COPY",
    embed_textures=True,
    apply_unit_scale=True,
    axis_forward="-Z",
    axis_up="Y",
)
bpy.ops.wm.save_as_mainfile(filepath=dst.rsplit(".", 1)[0] + ".blend")
print(f"EXPORTED {dst} ({os.path.getsize(dst) / 1024 / 1024:.1f} MB)")
