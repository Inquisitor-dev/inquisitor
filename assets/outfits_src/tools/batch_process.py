import os
import sys

project_root = r"c:\Users\Enes\OneDrive\Desktop\inquisitor"
raw_dir = r"C:\Users\Enes\.gemini\antigravity\brain\329d82cf-f59c-4141-bd57-182499862043"

outfits = {
    "outfit_wide_brim_hat": "outfit_wide_brim_hat_raw_1791134296897.jpg",
    "outfit_inquisitor_hood": "outfit_inquisitor_hood_raw_1791134443842.jpg",
    "outfit_cardinal_mitre": "outfit_cardinal_mitre_raw_1791134459921.jpg",
    "outfit_plague_mask": "outfit_plague_mask_raw_1791134471567.jpg",
    "outfit_iron_mask": "outfit_iron_mask_raw_1791134483676.jpg",
    "outfit_wooden_rosary": "outfit_wooden_rosary_raw_1791134506646.jpg",
    "outfit_silver_cross": "outfit_silver_cross_raw_1791134520186.jpg",
    "outfit_relic_pendant": "outfit_relic_pendant_raw_1791134530614.jpg",
    "outfit_leather_coat": "outfit_leather_coat_raw_1791134542809.jpg",
    "outfit_riding_boots": "outfit_riding_boots_raw_1791134553609.jpg",
    "outfit_iron_greaves": "outfit_iron_greaves_raw_1791134570462.jpg"
}

base_path = f"{project_root}/assets/outfits_src/base_nude_master.png"

for out_id, raw_name in outfits.items():
    raw_path = f"{raw_dir}/{raw_name}"
    print(f"Processing {out_id}...")
    # Call the processing script
    cmd = f'python "{project_root}/assets/outfits_src/tools/process_outfit.py" "{base_path}" "{raw_path}" "{out_id}" "{project_root}"'
    os.system(cmd)

print("Batch processing complete.")
