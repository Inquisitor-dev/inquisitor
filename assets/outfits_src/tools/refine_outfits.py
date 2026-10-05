import cv2
import numpy as np
import os
import glob
from rembg import remove, new_session
from PIL import Image

def align_image(base_bgr, base_alpha, gen_bgr):
    # Align using ORB on RGB (where alpha > 0)
    orb = cv2.ORB_create(5000)
    
    base_gray = cv2.cvtColor(base_bgr, cv2.COLOR_BGR2GRAY)
    gen_gray = cv2.cvtColor(gen_bgr, cv2.COLOR_BGR2GRAY)
    
    base_gray = cv2.bitwise_and(base_gray, base_gray, mask=base_alpha)
    
    kp1, des1 = orb.detectAndCompute(gen_gray, None)
    kp2, des2 = orb.detectAndCompute(base_gray, None)
    
    matcher = cv2.DescriptorMatcher_create(cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING)
    matches = matcher.match(des1, des2, None)
    
    matches = sorted(matches, key=lambda x: x.distance)
    num_good_matches = int(len(matches) * 0.15)
    matches = matches[:num_good_matches]
    
    points1 = np.zeros((len(matches), 2), dtype=np.float32)
    points2 = np.zeros((len(matches), 2), dtype=np.float32)
    
    for i, match in enumerate(matches):
        points1[i, :] = kp1[match.queryIdx].pt
        points2[i, :] = kp2[match.trainIdx].pt
        
    matrix, _ = cv2.estimateAffinePartial2D(points1, points2, method=cv2.RANSAC)
    h, w = base_alpha.shape
    aligned_gen_bgr = cv2.warpAffine(gen_bgr, matrix, (w, h), borderMode=cv2.BORDER_REPLICATE)
    return aligned_gen_bgr

def process_item(item_id, raw_path, base_bgr, base_alpha):
    raw_img = cv2.imread(raw_path)
    if raw_img is None: return
    
    # 1. Align
    aligned = align_image(base_bgr, base_alpha, raw_img)
    
    # 2. Remove background using rembg
    rgb = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    session = new_session('u2net')
    out = remove(pil_img, session=session)
    subject_alpha = np.array(out)[:, :, 3]
    _, subject_mask = cv2.threshold(subject_alpha, 127, 255, cv2.THRESH_BINARY)
    
    # Create white backgrounds for difference
    b_bgr = base_bgr.copy()
    b_bgr[base_alpha == 0] = (255,255,255)
    
    d_bgr_white = aligned.copy()
    d_bgr_white[subject_mask == 0] = (255,255,255)
    
    # 3. Difference
    b_lab = cv2.cvtColor(b_bgr, cv2.COLOR_BGR2LAB)
    d_lab = cv2.cvtColor(d_bgr_white, cv2.COLOR_BGR2LAB)
    diff = cv2.absdiff(b_lab, d_lab)
    diff_sum = np.sum(diff, axis=2)
    
    # Ignore background completely
    diff_sum[subject_mask == 0] = 0
    
    mask = np.zeros_like(diff_sum, dtype=np.uint8)
    
    # --- ITEM SPECIFIC LOGIC ---
    # Convert to HSV for skin/hair filtering
    hsv = cv2.cvtColor(aligned, cv2.COLOR_BGR2HSV)
    
    # General skin tone roughly: H: 0-25, S: 30-150, V: 50-255
    # Let's create a skin mask based on base_nude
    base_hsv = cv2.cvtColor(base_bgr, cv2.COLOR_BGR2HSV)
    skin_mask_base = cv2.inRange(base_hsv, np.array([0, 30, 50]), np.array([25, 170, 255]))
    # Dilate skin mask to be safe
    skin_mask_base = cv2.dilate(skin_mask_base, np.ones((7,7), np.uint8), iterations=2)
    
    if "hat" in item_id:
        mask[diff_sum > 10] = 255
        # Hat is black, remove skin/hair explicitly
        # Erase everything below y=400 EXCEPT if it's the hat itself (black)
        # Actually, let's keep everything but aggressively remove skin mask
        mask[skin_mask_base == 255] = 0
        mask[450:, :] = 0 # strict cutoff way below the hat
        
    elif "hood" in item_id:
        mask[diff_sum > 15] = 255
        # Erase face strictly
        mask[150:350, 480:640] = 0 
        mask[800:, :] = 0 # No cut at 203 or 600, allow drape
        
    elif "mitre" in item_id:
        mask[diff_sum > 15] = 255
        # Erase face strictly
        mask[skin_mask_base == 255] = 0
        mask[150:350, 450:670] = 0
        mask[600:, :] = 0
        
    elif "plague_mask" in item_id or "iron_mask" in item_id:
        mask[diff_sum > 10] = 255
        # Erase neck/hair
        mask[:100, :] = 0
        mask[450:, :] = 0
        mask[:, :400] = 0
        mask[:, 720:] = 0
        mask[skin_mask_base == 255] = 0
        
    elif "coat" in item_id:
        mask[diff_sum > 25] = 255
        mask[:300, :] = 0 # No face/head
        mask[1300:, :] = 0 # No feet
        # Remove hands (which are skin colored)
        mask[skin_mask_base == 255] = 0
        # Remove artifacts between legs: the coat might have noise there
        mask[800:1300, 450:670] = 0 # Between legs area (rough)
        
    elif "boots" in item_id or "greaves" in item_id:
        mask[diff_sum > 20] = 255
        mask[:950, :] = 0 # Strictly below knees
        mask[skin_mask_base == 255] = 0 # No skin/feet if any
        # Remove edge pants noise by eroding slightly
        mask = cv2.erode(mask, np.ones((3,3), np.uint8), iterations=1)
        
    # Morphological operations
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    clean_mask = np.zeros_like(mask)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= 500:
            clean_mask[labels == i] = 255
            
    if "coat" in item_id:
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, np.ones((9,9), np.uint8))
        
    clean_mask = cv2.GaussianBlur(clean_mask, (3,3), 0)
    _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
    
    # 4. Save
    final = np.zeros((aligned.shape[0], aligned.shape[1], 4), dtype=np.uint8)
    final[:,:,:3] = aligned
    final[:,:,3] = clean_mask
    
    master_path = f"assets/outfits_src/{item_id}_master.png"
    cv2.imwrite(master_path, final)
    print(f"Refined {item_id}")
    
    # Resize and save web versions
    out_img_pil = Image.fromarray(cv2.cvtColor(final, cv2.COLOR_BGRA2RGBA))
    
    out_web_img = out_img_pil.resize((560, 760), Image.Resampling.LANCZOS)
    out_web_img.save(f"frontend/public/characters/outfits/{item_id}.png")
    
    bbox = out_img_pil.getbbox()
    if bbox:
        cropped = out_img_pil.crop(bbox)
        thumb = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        cw, ch = cropped.size
        
        if cw > 256 or ch > 256:
            ratio = min(256/cw, 256/ch)
            new_w, new_h = int(cw*ratio), int(ch*ratio)
            cropped = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
            cw, ch = new_w, new_h
            
        x = (256 - cw) // 2
        y = (256 - ch) // 2
        thumb.paste(cropped, (x, y))
        thumb.save(f"frontend/public/characters/outfits/{item_id}_thumb.png")

if __name__ == "__main__":
    base_path = "assets/outfits_src/base_nude_master.png"
    base_img = cv2.imread(base_path, cv2.IMREAD_UNCHANGED)
    b_bgr = base_img[:,:,:3]
    b_alpha = base_img[:,:,3]
    
    raw_dir = r"C:\Users\Enes\.gemini\antigravity\brain\329d82cf-f59c-4141-bd57-182499862043"
    raw_files = glob.glob(os.path.join(raw_dir, "*raw*.jpg"))
    
    target_items = [
        "outfit_inquisitor_hood",
        "outfit_cardinal_mitre",
        "outfit_wide_brim_hat",
        "outfit_plague_mask",
        "outfit_iron_mask",
        "outfit_leather_coat",
        "outfit_riding_boots",
        "outfit_iron_greaves"
    ]
    
    for raw_path in raw_files:
        filename = os.path.basename(raw_path)
        item_id = None
        for t in target_items:
            if t in filename:
                item_id = t
                break
        
        if item_id:
            process_item(item_id, raw_path, b_bgr, b_alpha)
