import cv2
import numpy as np
import os
import glob
from rembg import remove, new_session
from PIL import Image

def align_image(base_bgr, base_alpha, gen_bgr):
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
    aligned = align_image(base_bgr, base_alpha, raw_img)
    rgb = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    session = new_session('u2net')
    out = remove(pil_img, session=session)
    subject_alpha = np.array(out)[:, :, 3]
    _, subject_mask = cv2.threshold(subject_alpha, 127, 255, cv2.THRESH_BINARY)
    
    b_bgr = base_bgr.copy()
    b_bgr[base_alpha == 0] = (255,255,255)
    d_bgr_white = aligned.copy()
    d_bgr_white[subject_mask == 0] = (255,255,255)
    
    b_lab = cv2.cvtColor(b_bgr, cv2.COLOR_BGR2LAB)
    d_lab = cv2.cvtColor(d_bgr_white, cv2.COLOR_BGR2LAB)
    diff = cv2.absdiff(b_lab, d_lab)
    diff_sum = np.sum(diff, axis=2)
    diff_sum[subject_mask == 0] = 0
    
    mask = np.zeros_like(diff_sum, dtype=np.uint8)
    
    if "hat" in item_id:
        mask[diff_sum > 15] = 255
        mask[500:, :] = 0 # strict limit way below the hat
        # Erase the face (under the hat)
        mask[200:500, 450:650] = 0
    elif "hood" in item_id:
        mask[diff_sum > 20] = 255
        # Erase face strictly
        mask[150:350, 480:640] = 0 
        mask[800:, :] = 0 # Allow drape, cut off far below chest
    elif "mitre" in item_id:
        mask[diff_sum > 15] = 255
        mask[150:350, 450:670] = 0
        mask[600:, :] = 0
    elif "plague_mask" in item_id or "iron_mask" in item_id:
        mask[diff_sum > 15] = 255
        mask[:100, :] = 0
        mask[450:, :] = 0
        mask[:, :400] = 0
        mask[:, 720:] = 0
        # For iron mask specifically, erase eyes/nose if any
        if "iron" in item_id:
            mask[:250, 450:670] = 0
    elif "coat" in item_id:
        mask[diff_sum > 30] = 255
        mask[:300, :] = 0
        mask[1300:, :] = 0
        # Hands usually at x<350 or x>750, y>700
        mask[700:, :300] = 0
        mask[700:, 800:] = 0
    elif "boots" in item_id or "greaves" in item_id:
        mask[diff_sum > 25] = 255
        mask[:900, :] = 0
        
    # Remove thin slivers of skin/pants (edges)
    mask = cv2.erode(mask, np.ones((5,5), np.uint8), iterations=1)
    
    # Clean up small components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    clean_mask = np.zeros_like(mask)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= 1000:
            clean_mask[labels == i] = 255
            
    # Restore the edges we eroded
    clean_mask = cv2.dilate(clean_mask, np.ones((5,5), np.uint8), iterations=1)
            
    if "coat" in item_id:
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, np.ones((15,15), np.uint8))
        
    clean_mask = cv2.GaussianBlur(clean_mask, (5,5), 0)
    _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
    
    final = np.zeros((aligned.shape[0], aligned.shape[1], 4), dtype=np.uint8)
    final[:,:,:3] = aligned
    final[:,:,3] = clean_mask
    
    cv2.imwrite(f"assets/outfits_src/{item_id}_master.png", final)
    print(f"Refined {item_id}")
    
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
            if t in filename: item_id = t; break
        if item_id: process_item(item_id, raw_path, b_bgr, b_alpha)
