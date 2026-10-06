# Meshy'den gelen GLB'yi Mixamo'ya yüklemeye hazırlar:
# ayakları z=0'a oturtur, gövdeyi orijinde ortalar, poligon sayısını düşürür, dokuları gömülü FBX çıkarır.
#
# Kullanım:
#   blender -b -P art/tools/prepare_model.py -- art/characters/<id>/source/<id>_meshy.glb art/characters/<id>/source/<id>_mixamo.fbx [hedef_üçgen]
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
src, dst = argv[0], argv[1]
target_tris = int(argv[2]) if len(argv) > 2 else 50_000

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

# Ayaklar zeminde, gövde ortada
pts = [Vector(c) for c in body.bound_box]
min_z = min(p.z for p in pts)
cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2
cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
body.data.transform(__import__("mathutils").Matrix.Translation((-cx, -cy, -min_z)))
body.data.update()

body.data.calc_loop_triangles()
tris = len(body.data.loop_triangles)
if tris > target_tris:
    mod = body.modifiers.new("decimate", "DECIMATE")
    mod.ratio = target_tris / tris
    bpy.ops.object.modifier_apply(modifier=mod.name)
body.data.calc_loop_triangles()
print(f"TRIS {tris} -> {len(body.data.loop_triangles)}")
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
print("EXPORTED", dst)
