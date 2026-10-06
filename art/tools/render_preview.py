# Animasyonları henüz hazır olmayan karakter için market/gardırop görseli üretir.
# Mixamo'ya yüklenen FBX'i (A-poz) render_character.py ile aynı kamera ve ışıkta çizer ve
# frontend/public/characters/<id>/thumb.webp olarak yazar. Karakter sonradan tam render edilip
# pack_sprites.py çalıştırılınca bu görsel gerçek (durma pozundaki) görselle değişir.
#
# Kullanım:
#   blender -b -P art/tools/render_preview.py -- --outfit <id>
import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
import render_character as rc  # noqa: E402


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--outfit", required=True)
    args = p.parse_args(argv)

    src = os.path.join(rc.ROOT, "art", "characters", args.outfit, "source")
    out_dir = os.path.join(rc.ROOT, "frontend", "public", "characters", args.outfit)
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    rc.setup_render(scene)
    rc.setup_lights()
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    scene.collection.objects.link(cam)
    scene.camera = cam

    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=os.path.join(src, f"{args.outfit}_mixamo.fbx"))
    meshes = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    mats = rc.glb_materials(os.path.join(src, f"{args.outfit}_model.glb"))

    root = bpy.data.objects.new("Root", None)
    scene.collection.objects.link(root)
    for m in meshes:
        rc.apply_glb_materials(m, mats)
        m.parent = root

    rc.setup_camera(scene, rc.THUMB_FRAME, rc.THUMB_PX_PER_M, rc.THUMB_ANCHOR, rc.THUMB_ELEVATION)
    root.rotation_euler = (0, 0, math.radians(rc.THUMB_YAW))
    png = os.path.join(rc.ROOT, "art", "characters", args.outfit, "preview_thumb.png")
    rc.render_to(scene, png)

    # WebP'ye Blender'ın kendi görüntü kaydıyla çevir (Pillow Blender'da yok)
    img = bpy.data.images.load(png)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 90
    img.save_render(os.path.join(out_dir, "thumb.webp"), scene=scene)
    print("PREVIEW_DONE", os.path.join(out_dir, "thumb.webp"))


main()
