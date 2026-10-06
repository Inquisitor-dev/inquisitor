import cv2
import numpy as np
import os
from PIL import Image

def process_item_green(item_id, raw_path, green_path):
    base = cv2.imread('assets/outfits_src/base_nude_master.png', cv2.IMREAD_UNCHANGED)
    base_bgr = base[:, :, :3]
    base_alpha = base[:, :, 3]
    h, w = base.shape[:2]
    
    raw = cv2.imread(raw_path)
    green = cv2.imread(green_path)
    
    # 1. Align raw to base using ORB feature matching
    orb = cv2.ORB_create(5000)
    base_gray = cv2.bitwise_and(cv2.cvtColor(base_bgr, cv2.COLOR_BGR2GRAY), cv2.cvtColor(base_bgr, cv2.COLOR_BGR2GRAY), mask=base_alpha)
    raw_gray = cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY)
    
    kp1, des1 = orb.detectAndCompute(raw_gray, None)
    kp2, des2 = orb.detectAndCompute(base_gray, None)
    
    matcher = cv2.DescriptorMatcher_create(cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING)
    matches = matcher.match(des1, des2, None)
    matches = sorted(matches, key=lambda x: x.distance)
    matches = matches[:int(len(matches)*0.15)]
    
    p1 = np.float32([kp1[m.queryIdx].pt for m in matches])
    p2 = np.float32([kp2[m.trainIdx].pt for m in matches])
    matrix, _ = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC)
    
    # Warp green image to base canvas with green border
    warped_green = cv2.warpAffine(green, matrix, (w, h), borderValue=(0, 255, 0))
    
    # 2. Chroma key green
    hsv = cv2.cvtColor(warped_green, cv2.COLOR_BGR2HSV)
    green_mask = cv2.inRange(hsv, np.array([35, 70, 70]), np.array([85, 255, 255]))
    
    # Dilate green mask by 1 pixel to eat edge spill
    green_mask_dilated = cv2.dilate(green_mask, np.ones((3,3), np.uint8), iterations=1)
    alpha = cv2.bitwise_not(green_mask_dilated)
    
    # Clean small noise < 400px
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(alpha, connectivity=8)
    clean_alpha = np.zeros_like(alpha)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= 400:
            clean_alpha[labels == i] = 255
            
    # Feather edge 1px
    clean_alpha = cv2.GaussianBlur(clean_alpha, (3,3), 0)
    
    # De-spill green
    b, g, r = cv2.split(warped_green)
    max_rb = np.maximum(r, b)
    g_despill = np.where((g > max_rb) & (clean_alpha > 0), max_rb, g)
    warped_clean = cv2.merge([b, g_despill, r])
    
    out_rgba = cv2.merge([warped_clean[:,:,0], warped_clean[:,:,1], warped_clean[:,:,2], clean_alpha])
    
    # Save master (1120x1520)
    master_path = f'assets/outfits_src/{item_id}_master.png'
    cv2.imwrite(master_path, out_rgba)
    
    # Web 560x760 (LANCZOS, no crop)
    pil_rgba = Image.fromarray(cv2.cvtColor(out_rgba, cv2.COLOR_BGRA2RGBA))
    web_img = pil_rgba.resize((560, 760), Image.Resampling.LANCZOS)
    web_img.save(f'frontend/public/characters/outfits/{item_id}.png')
    
    # Thumb 256x256 (centered bbox crop, transparent)
    bbox = pil_rgba.getbbox()
    if bbox:
        cropped = pil_rgba.crop(bbox)
        thumb = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        cw, ch = cropped.size
        ratio = min(256/cw, 256/ch) * 0.9
        nw, nh = int(cw*ratio), int(ch*ratio)
        cropped = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
        thumb.paste(cropped, ((256 - nw)//2, (256 - nh)//2))
        thumb.save(f'frontend/public/characters/outfits/{item_id}_thumb.png')
        
    print(f'Successfully processed {item_id}')

if __name__ == '__main__':
    items = [
        (
            'outfit_inquisitor_hood',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_inquisitor_hood_raw_1791134443842.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_inquisitor_hood_v3_1791212212109.jpg'
        ),
        (
            'outfit_cardinal_mitre',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_cardinal_mitre_raw_1791134459921.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_cardinal_mitre_1791212275388.jpg'
        ),
        (
            'outfit_riding_boots',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_riding_boots_raw_1791134553609.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_riding_boots_1791212343992.jpg'
        ),
        (
            'outfit_wide_brim_hat',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/test_quota_check_1791211184078.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_wide_brim_hat_v2_1791212405829.jpg'
        ),
        (
            'outfit_nasal_helm',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_nasal_helm_raw_1791212471669.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_nasal_helm_1791212529391.jpg'
        ),
        (
            'outfit_velvet_beret',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_velvet_beret_raw_1791212580541.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_velvet_beret_1791212634161.jpg'
        ),
        (
            'outfit_executioner_hood',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/outfit_executioner_hood_raw_1791212679585.jpg',
            'C:/Users/Enes/.gemini/antigravity/brain/329d82cf-f59c-4141-bd57-182499862043/green_executioner_hood_1791212755049.jpg'
        )
    ]
    
    for item_id, raw_p, green_p in items:
        process_item_green(item_id, raw_p, green_p)
