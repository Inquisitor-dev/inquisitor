import sys
from PIL import Image

project_root = r"c:\Users\Enes\OneDrive\Desktop\inquisitor"

outfits = [
    "outfit_wide_brim_hat",
    "outfit_inquisitor_hood",
    "outfit_cardinal_mitre",
    "outfit_plague_mask",
    "outfit_iron_mask",
    "outfit_wooden_rosary",
    "outfit_silver_cross",
    "outfit_relic_pendant",
    "outfit_leather_coat",
    "outfit_riding_boots",
    "outfit_iron_greaves",
    "outfit_nasal_helm",
    "outfit_velvet_beret",
    "outfit_executioner_hood"
]

base_path = f"{project_root}/assets/outfits_src/base_nude_master.png"
base_img = Image.open(base_path).convert('RGBA')

w, h = base_img.size
cols = 5
rows = 3
grid_w = w * cols
grid_h = h * rows

preview = Image.new('RGBA', (grid_w, grid_h), (200, 200, 200, 255))

# Paste base nude in first cell
preview.paste(base_img, (0, 0), base_img)

# Paste outfits in other cells
for i, out_id in enumerate(outfits):
    idx = i + 1
    col = idx % cols
    row = idx // cols
    x = col * w
    y = row * h
    
    # Start with base body
    cell = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    cell.paste(base_img, (0, 0), base_img)
    
    # Overlay outfit
    layer_path = f"{project_root}/assets/outfits_src/{out_id}_master.png"
    try:
        layer = Image.open(layer_path).convert('RGBA')
        cell.paste(layer, (0, 0), layer)
    except Exception as e:
        print(f"Error loading {layer_path}: {e}")
        
    preview.paste(cell, (x, y), cell)

# Save preview
out_path = f"{project_root}/assets/outfits_src/preview_all.png"
preview.save(out_path)
print(f"Saved {out_path}")
