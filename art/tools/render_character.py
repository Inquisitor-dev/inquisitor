# Mixamo animasyonlu karakteri oyunun ihtiyaç duyduğu karelere render eder:
#   - harita: 8 yön × yürüme döngüsü, 8 yön × durma döngüsü (192×256, ayak noktası sabit)
#   - menü: 72 karelik 360° dönüş (512×640)
#   - market: 3/4 açıdan küçük görsel (512×512)
# Kareler art/characters/<id>/render/ altına PNG olarak yazılır; pack_sprites.py bunları
# frontend/public/characters/<id>/ altına sprite sheet + manifest.json olarak paketler.
#
# Kullanım:
#   blender -b -P art/tools/render_character.py -- --outfit default [--only walk,idle,turntable,thumb] [--outline]
#
# Beklenen dosyalar (art/characters/<id>/source/):
#   <id>_walk.fbx   Mixamo yürüme, "In Place", With Skin
#   <id>_idle.fbx   Mixamo durma, With Skin
#   <id>_meshy.glb  Meshy'nin orijinal modeli (malzeme/dokular buradan alınır)
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# ─── Sabitler ────────────────────────────────────────────────────────────
# Harita kamerası: haritalar kuşbakışı ~35° yukarıdan çizilmiş
MAP_ELEVATION = 35.0
MAP_FRAME = (192, 256)
# Bir metrenin harita karesinde kaç piksel tuttuğu (1,9 m karakter ≈ 185 px)
MAP_PX_PER_M = 120.0
# Ayakların yere bastığı noktanın karedeki yeri; ileri atılan ayak için altta pay bırakılır
MAP_ANCHOR = (96, 210)

WALK_FRAMES = 16
IDLE_FPS = 10
# Durma animasyonundan kesilecek döngünün süre aralığı (sn)
IDLE_LOOP_RANGE = (2.0, 4.0)

TURNTABLE_FRAMES = 72
TURNTABLE_FRAME = (512, 640)
TURNTABLE_ELEVATION = 0.0
TURNTABLE_PX_PER_M = 300.0
TURNTABLE_ANCHOR = (256, 610)

THUMB_FRAME = (512, 512)
THUMB_ELEVATION = 0.0
THUMB_YAW = 30.0
THUMB_PX_PER_M = 245.0
THUMB_ANCHOR = (256, 492)

OUTLINE_THICKNESS = 0.007

# Genel parlaklık (EV). Karakter koyu haritada kaybolmasın diye biraz açık tutulur.
EXPOSURE = 0.5

# Ekran yönleri: açı, ekranda sağdan saat yönünde (y aşağı)
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


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--outfit", required=True)
    p.add_argument("--only", default="walk,idle,turntable,thumb")
    p.add_argument("--outline", action="store_true")
    return p.parse_args(argv)


# ─── Sahne kurulumu ──────────────────────────────────────────────────────
def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    meshes = [o for o in new if o.type == "MESH"]
    return arm, meshes


def take_action(arm):
    action = arm.animation_data.action
    action.use_fake_user = True
    return action


def assign_action(arm, action):
    ad = arm.animation_data or arm.animation_data_create()
    ad.action = action
    if hasattr(ad, "action_slot") and ad.action_slot is None and len(action.slots):
        ad.action_slot = action.slots[0]


def glb_material(glb_path):
    # Meshy GLB'sinin malzemesi (renk + metal/pürüzlülük + normal) FBX gidiş-dönüşünden daha eksiksiz
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    new = [o for o in bpy.data.objects if o not in before]
    mat = next(o for o in new if o.type == "MESH").active_material
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    # Boyalı görünüm: parlama yok, metal hissi az
    bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        for name, value in (("Specular IOR Level", 0.15), ("Coat Weight", 0.0), ("Sheen Weight", 0.0)):
            if name in bsdf.inputs:
                bsdf.inputs[name].default_value = value
    return mat


def add_outline(mesh_obj):
    # Ters gövde (inverted hull) dış çizgi: arka yüzleri görünen, biraz şişirilmiş siyah kabuk
    mat = bpy.data.materials.new("Outline")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (0.02, 0.015, 0.012, 1)
    out = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
    mat.use_backface_culling = True
    mesh_obj.data.materials.append(mat)
    mod = mesh_obj.modifiers.new("Outline", "SOLIDIFY")
    mod.thickness = -OUTLINE_THICKNESS
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.use_rim = False
    mod.material_offset = len(mesh_obj.data.materials) - 1


def setup_render(scene):
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_percentage = 100
    # AgX renkleri soldurur; boyalı doku olduğu gibi kalsın
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = EXPOSURE
    scene.render.fps = 30

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.42, 0.42, 0.45, 1)
    bg.inputs["Strength"].default_value = 0.9
    scene.world = world


def add_light(name, energy, color, rot_deg):
    light = bpy.data.lights.new(name, "SUN")
    light.energy = energy
    light.color = color
    light.angle = math.radians(8)
    obj = bpy.data.objects.new(name, light)
    obj.rotation_euler = [math.radians(a) for a in rot_deg]
    bpy.context.scene.collection.objects.link(obj)
    return obj


def setup_lights():
    # Anahtar ışık sol üstten ve önden (haritalarda ışık sol üstten geliyor)
    add_light("Key", 3.2, (1.0, 0.95, 0.88), (50, 0, -35))
    # Sağdan yumuşak dolgu
    add_light("Fill", 0.8, (0.8, 0.85, 1.0), (70, 0, 60))
    # Arkadan kenar ışığı: koyu karakter koyu haritada siluetini kaybetmesin
    add_light("Rim", 2.2, (1.0, 0.8, 0.6), (60, 0, 165))


def setup_camera(scene, frame, px_per_m, anchor, elevation_deg):
    cam_data = scene.camera.data
    w, h = frame
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = max(w, h) / px_per_m
    e = math.radians(elevation_deg)
    forward = Vector((0, math.cos(e), -math.sin(e)))
    up = Vector((0, math.sin(e), math.cos(e)))
    right = Vector((1, 0, 0))
    # Dünya orijini (ayak noktası) karede `anchor` pikseline düşsün
    dx = (anchor[0] - w / 2) / px_per_m
    dy = (h / 2 - anchor[1]) / px_per_m
    target = -right * dx - up * dy
    cam = scene.camera
    cam.location = target - forward * 20
    cam.rotation_euler = (math.radians(90) - e, 0, 0)
    cam_data.clip_start = 0.1
    cam_data.clip_end = 100


def facing_yaw(screen_deg, elevation_deg):
    # Ekrandaki bakış açısını, kamera eğikliğini hesaba katarak dünya dönüşüne çevirir.
    # Karakterin önü -Y (kameraya bakar) = ekranda "south" (90°).
    a = math.radians(screen_deg)
    world = Vector((math.cos(a), -math.sin(a) / math.sin(math.radians(elevation_deg)), 0))
    world_angle = math.atan2(world.y, world.x)
    return world_angle + math.pi / 2


def render_to(scene, path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ─── Animasyon ölçümleri ─────────────────────────────────────────────────
def bone_world(arm, suffix):
    bone = next(b for b in arm.pose.bones if b.name.endswith(suffix))
    return arm.matrix_world @ bone.head


def pose_signature(arm):
    return [arm.matrix_world @ b.head for b in arm.pose.bones]


def walk_stride(scene, arm, start, end):
    # Yere basan ayağın kare başına kayması = karakterin ilerleme hızı
    speeds = []
    for f in range(start, end):
        scene.frame_set(f)
        feet = [bone_world(arm, "LeftFoot"), bone_world(arm, "RightFoot")]
        scene.frame_set(f + 1)
        feet_next = [bone_world(arm, "LeftFoot"), bone_world(arm, "RightFoot")]
        low = min(range(2), key=lambda i: feet[i].z)
        speeds.append(abs(feet_next[low].y - feet[low].y))
    speeds.sort()
    per_frame = speeds[len(speeds) // 2]
    return per_frame * (end - start)


def best_idle_loop(scene, arm, start, end):
    # Başı ve sonu birbirine en çok benzeyen aralığı bul; döngü dikişi görünmesin
    step = 30 // IDLE_FPS
    sigs = {}
    for f in range(start, end + 1, step):
        scene.frame_set(f)
        sigs[f] = pose_signature(arm)
    best = None
    lo, hi = (int(s * 30) for s in IDLE_LOOP_RANGE)
    for a in sigs:
        for length in range(lo, hi + 1, step):
            b = a + length
            if b not in sigs:
                continue
            d = sum((p - q).length for p, q in zip(sigs[a], sigs[b]))
            if best is None or d < best[0]:
                best = (d, a, b)
    return best[1], best[2]


# ─── Ana akış ────────────────────────────────────────────────────────────
def main():
    args = parse_args()
    only = set(args.only.split(","))
    src = os.path.join(ROOT, "art", "characters", args.outfit, "source")
    out = os.path.join(ROOT, "art", "characters", args.outfit, "render")
    os.makedirs(out, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    setup_render(scene)
    setup_lights()
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    scene.collection.objects.link(cam)
    scene.camera = cam

    arm, meshes = import_fbx(os.path.join(src, f"{args.outfit}_walk.fbx"))
    walk_action = take_action(arm)
    idle_arm, idle_meshes = import_fbx(os.path.join(src, f"{args.outfit}_idle.fbx"))
    idle_action = take_action(idle_arm)
    for o in [idle_arm, *idle_meshes]:
        bpy.data.objects.remove(o, do_unlink=True)

    mat = glb_material(os.path.join(src, f"{args.outfit}_meshy.glb"))
    for m in meshes:
        m.data.materials.clear()
        m.data.materials.append(mat)
        if args.outline:
            add_outline(m)

    # Karakteri bir kök boşluğa bağla; yönler kökü döndürerek alınır
    root = bpy.data.objects.new("Root", None)
    scene.collection.objects.link(root)
    arm.parent = root
    arm.matrix_parent_inverse = Matrix.Identity(4)

    meta = {"outfit": args.outfit}

    w_start, w_end = (int(v) for v in walk_action.frame_range)
    # Mixamo döngüsünde son kare ilk karenin tekrarı
    cycle = w_end - w_start
    assign_action(arm, walk_action)
    stride = walk_stride(scene, arm, w_start, w_end)
    meta["walk"] = {
        "frames": WALK_FRAMES,
        "cycleSeconds": cycle / 30,
        "strideMeters": round(stride, 4),
    }

    i_start, i_end = (int(v) for v in idle_action.frame_range)
    assign_action(arm, idle_action)
    loop_a, loop_b = best_idle_loop(scene, arm, i_start, i_end)
    idle_frames = list(range(loop_a, loop_b, 30 // IDLE_FPS))
    meta["idle"] = {"frames": len(idle_frames), "fps": IDLE_FPS, "sourceRange": [loop_a, loop_b]}

    meta["map"] = {
        "frameWidth": MAP_FRAME[0],
        "frameHeight": MAP_FRAME[1],
        "anchorX": MAP_ANCHOR[0],
        "anchorY": MAP_ANCHOR[1],
        "pxPerMeter": MAP_PX_PER_M,
        "elevation": MAP_ELEVATION,
    }

    if "walk" in only or "idle" in only:
        setup_camera(scene, MAP_FRAME, MAP_PX_PER_M, MAP_ANCHOR, MAP_ELEVATION)
        for name, screen_deg in SCREEN_DIRECTIONS.items():
            root.rotation_euler = (0, 0, facing_yaw(screen_deg, MAP_ELEVATION))
            if "walk" in only:
                assign_action(arm, walk_action)
                for i in range(WALK_FRAMES):
                    t = w_start + i * cycle / WALK_FRAMES
                    scene.frame_set(int(t), subframe=t - int(t))
                    render_to(scene, os.path.join(out, "walk", name, f"{i:03d}.png"))
            if "idle" in only:
                assign_action(arm, idle_action)
                for i, f in enumerate(idle_frames):
                    scene.frame_set(f)
                    render_to(scene, os.path.join(out, "idle", name, f"{i:03d}.png"))

    # Menü ve market: durma döngüsünün ilk pozu
    assign_action(arm, idle_action)
    scene.frame_set(loop_a)

    if "turntable" in only:
        setup_camera(scene, TURNTABLE_FRAME, TURNTABLE_PX_PER_M, TURNTABLE_ANCHOR, TURNTABLE_ELEVATION)
        for i in range(TURNTABLE_FRAMES):
            # Önden başla, karakter kendi soluna doğru (saat yönünün tersine) dönsün
            root.rotation_euler = (0, 0, math.radians(i * 360 / TURNTABLE_FRAMES))
            render_to(scene, os.path.join(out, "turntable", f"{i:03d}.png"))
        meta["turntable"] = {
            "frames": TURNTABLE_FRAMES,
            "frameWidth": TURNTABLE_FRAME[0],
            "frameHeight": TURNTABLE_FRAME[1],
        }

    if "thumb" in only:
        setup_camera(scene, THUMB_FRAME, THUMB_PX_PER_M, THUMB_ANCHOR, THUMB_ELEVATION)
        root.rotation_euler = (0, 0, math.radians(THUMB_YAW))
        render_to(scene, os.path.join(out, "thumb.png"))

    meta_path = os.path.join(out, "render.json")
    if os.path.exists(meta_path):
        with open(meta_path, encoding="utf-8") as f:
            old = json.load(f)
        old.update(meta)
        meta = old
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print("RENDER_DONE", out)


main()
