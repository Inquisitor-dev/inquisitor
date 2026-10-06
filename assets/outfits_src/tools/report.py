import cv2
import numpy as np

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

print("| Item | Opaque % | Status |")
print("|---|---|---|")
for item in outfits:
    path = f"assets/outfits_src/{item}_master.png"
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        print(f"| {item} | ERROR | Failed |")
        continue
    
    alpha = img[:,:,3]
    total_pixels = alpha.size
    opaque_pixels = np.count_nonzero(alpha > 0)
    percentage = (opaque_pixels / total_pixels) * 100
    
    status = "OK"
    if "coat" in item or "cassock" in item or "robe" in item:
        if percentage > 35: status = "FAIL (>35%)"
    else:
        if percentage > 12: status = "FAIL (>12%)"
        
    print(f"| {item} | {percentage:.2f}% | {status} |")
