# Market, gardırop ve menü kartlarındaki karakter görselini (thumb.webp) vitrin kalitesinde render eder:
#   - export_web_model.py'nin GLB'si (idle pozu, orijinal malzemeler); o yoksa görselden-3D aracının
#     iskeletsiz modeli (<id>_model.glb, A-poz) — Mixamo'dan önce "Yakında" kartı için
#   - Cycles + denoise, perspektif (85 mm) kamera, hafif alttan bakış
#   - sıcak anahtar ışık + iki renkli kenar ışığı (menüdeki 3D gösterimle aynı düzen)
#   - 2 kat çözünürlükte render, küçültülerek keskinleştirilir
#
# Kullanım:
#   blender -b -P art/tools/render_showcase.py -- --outfit engizitor
#
# Çıktı: art/characters/<id>/render/thumb.png  (pack_sprites.py bunu thumb.webp yapar)
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

SIZE = 512
SUPERSAMPLE = 2
SAMPLES = 160
# Karakter kameraya 3/4 dönük (derece, sola doğru)
YAW = 28.0
LENS_MM = 85.0
# Kamera yüksekliği ve bakış noktası, boyun oranı olarak
CAMERA_HEIGHT = 0.42
LOOK_AT = 0.52
# Karenin üstünde ve altında bırakılan pay (kare boyunun oranı)
MARGIN = 0.04
EXPOSURE = 0.0

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument("--outfit", required=True)
args = p.parse_args(argv)

char_dir = os.path.join(ROOT, "art", "characters", args.outfit)
src = os.path.join(char_dir, "web", f"{args.outfit}.glb")
if not os.path.exists(src):
    src = os.path.join(char_dir, "source", f"{args.outfit}_model.glb")
out = os.path.join(char_dir, "render", "thumb.png")
if not os.path.exists(src):
    sys.exit(f"Model bulunamadı: {src}")
print("SOURCE", src)


def setup_render(scene):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for backend in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
            try:
                prefs.compute_device_type = backend
            except TypeError:
                continue
            prefs.get_devices()
            if any(d.type == backend for d in prefs.devices):
                for d in prefs.devices:
                    d.use = d.type == backend
                scene.cycles.device = "GPU"
                print("CYCLES_DEVICE", backend)
                break
    except Exception as err:  # GPU yoksa CPU ile devam
        print("CYCLES_DEVICE CPU", err)
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = SIZE * SUPERSAMPLE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # Menüdeki 3D gösterimle (three.js NeutralToneMapping) aynı ton eşleme; AgX boyalı dokuyu soldurur
    try:
        scene.view_settings.view_transform = "Khronos PBR Neutral"
    except TypeError:
        scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    print("VIEW", scene.view_settings.view_transform)
    scene.view_settings.exposure = EXPOSURE

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    # Koyu, sıcak ortam: metaller ve gölgeler simsiyah kalmasın
    bg.inputs["Color"].default_value = (0.32, 0.22, 0.16, 1)
    bg.inputs["Strength"].default_value = 0.12
    scene.world = world


def add_area(name, energy, color, location, size, target):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = energy
    light.color = color
    light.size = size
    obj = bpy.data.objects.new(name, light)
    obj.location = location
    direction = Vector(target) - Vector(location)
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(obj)


def setup_lights(height):
    h = height
    mid = (0, 0, h * 0.55)
    # Karakterin önü -Y (kameraya bakar). Anahtar: sol ön üst, büyük ve sıcak
    add_area("Key", 480 * h * h, (1.0, 0.88, 0.74), (-2.0 * h, -2.2 * h, 1.7 * h), 0.9 * h, mid)
    # Sağ önden soğuk, zayıf dolgu
    add_area("Fill", 60 * h * h, (0.78, 0.85, 1.0), (2.4 * h, -2.0 * h, 0.9 * h), 2.0 * h, mid)
    # Arkadan kenar ışıkları: sol kızıl, sağ mum sarısı (menüdeki 3D gösterimle aynı)
    add_area("RimRed", 1400 * h * h, (1.0, 0.22, 0.12), (-1.6 * h, 1.8 * h, 1.2 * h), 0.8 * h, mid)
    add_area("RimGold", 1100 * h * h, (1.0, 0.72, 0.38), (1.7 * h, 1.6 * h, 1.4 * h), 0.8 * h, mid)
    # Tepeden saç/şapka ışığı
    add_area("Top", 50 * h * h, (1.0, 0.92, 0.8), (0, 0.4 * h, 2.2 * h), 1.0 * h, (0, 0, h))


def deformed_bounds(objs):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    lo = Vector((math.inf,) * 3)
    hi = Vector((-math.inf,) * 3)
    for o in objs:
        ev = o.evaluated_get(depsgraph)
        mesh = ev.to_mesh()
        for v in mesh.vertices:
            w = ev.matrix_world @ v.co
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
        ev.to_mesh_clear()
    return lo, hi


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
setup_render(scene)

bpy.ops.import_scene.gltf(filepath=src)
arm = next((o for o in scene.objects if o.type == "ARMATURE"), None)
if arm:
    meshes = [o for o in scene.objects if o.type == "MESH" and o.parent == arm]
    # glTF içe aktarıcısının kemik gösterimi için eklediği küre vb. sahneden çıksın
    for o in list(scene.objects):
        if o is not arm and o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    roots = [arm]
else:
    meshes = [o for o in scene.objects if o.type == "MESH"]
    roots = [o for o in scene.objects if o.parent is None]
if bpy.data.actions:
    scene.frame_set(int(bpy.data.actions[0].frame_range[0]))

# Karakteri bir kök boşluğa bağla, 3/4 açıya döndür, ayakları z=0'a ve ortaya oturt
root = bpy.data.objects.new("Root", None)
scene.collection.objects.link(root)
for o in roots:
    o.parent = root
root.rotation_euler = (0, 0, math.radians(YAW))
bpy.context.view_layer.update()
lo, hi = deformed_bounds(meshes)
root.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
bpy.context.view_layer.update()
height = hi.z - lo.z
print(f"HEIGHT {height:.3f}")

setup_lights(height)

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = LENS_MM
cam_data.sensor_fit = "VERTICAL"
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
# Kamera uzaklığı: boy + pay dikey görüş açısına sığsın
fov = 2 * math.atan(cam_data.sensor_height / 2 / LENS_MM)
span = height * (1 + 2 * MARGIN)
distance = span / 2 / math.tan(fov / 2)
cam.location = (0, -distance, height * CAMERA_HEIGHT)
look = Vector((0, 0, height * LOOK_AT))
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
cam_data.clip_start = 0.01
cam_data.clip_end = distance * 4

os.makedirs(os.path.dirname(out), exist_ok=True)
big = out.replace(".png", "_big.png")
scene.render.filepath = big
bpy.ops.render.render(write_still=True)

# Küçültme: Blender'ın ölçekleyicisi yerine Pillow (Lanczos) daha keskin; Blender Python'unda yoksa olduğu gibi bırak
try:
    from PIL import Image

    Image.open(big).resize((SIZE, SIZE), Image.LANCZOS).save(out)
    os.remove(big)
except ImportError:
    img = bpy.data.images.load(big)
    img.scale(SIZE, SIZE)
    img.save(filepath=out)
    os.remove(big)
print("SHOWCASE_DONE", out)
