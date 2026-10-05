import sys
import cv2
import numpy as np
from PIL import Image

def remove_gray_background(img_cv):
    bgr = np.ascontiguousarray(img_cv[:,:,:3])
    mask = np.zeros((bgr.shape[0]+2, bgr.shape[1]+2), np.uint8)
    diff = (10, 10, 10)
    for y in [0, bgr.shape[0]-1]:
        for x in [0, bgr.shape[1]-1]:
            cv2.floodFill(bgr, mask, (x,y), (0,255,0), diff, diff, cv2.FLOODFILL_MASK_ONLY)
            
    bg_mask = mask[1:-1, 1:-1]
    bg_mask = cv2.GaussianBlur(bg_mask, (3,3), 0)
    _, bg_mask = cv2.threshold(bg_mask, 127, 255, cv2.THRESH_BINARY)
    
    alpha = img_cv[:,:,3]
    alpha[bg_mask == 1] = 0
    img_cv[:,:,3] = alpha
    return img_cv

def process_outfit(base_path, gen_path, output_id, project_root):
    base_img_pil = Image.open(base_path).convert('RGBA')
    gen_img_pil = Image.open(gen_path).convert('RGBA')
    
    base_cv = cv2.cvtColor(np.array(base_img_pil), cv2.COLOR_RGBA2BGRA)
    gen_cv = cv2.cvtColor(np.array(gen_img_pil), cv2.COLOR_RGBA2BGRA)
    
    gen_cv = remove_gray_background(gen_cv)
    
    base_bgr = base_cv[:, :, :3]
    base_alpha = base_cv[:, :, 3]
    gen_bgr = gen_cv[:, :, :3]
    gen_alpha = gen_cv[:, :, 3]
    
    orb = cv2.ORB_create(5000)
    
    base_gray = cv2.cvtColor(base_bgr, cv2.COLOR_BGR2GRAY)
    gen_gray = cv2.cvtColor(gen_bgr, cv2.COLOR_BGR2GRAY)
    
    base_gray = cv2.bitwise_and(base_gray, base_gray, mask=base_alpha)
    gen_gray = cv2.bitwise_and(gen_gray, gen_gray, mask=gen_alpha)
    
    kp1, des1 = orb.detectAndCompute(gen_gray, None)
    kp2, des2 = orb.detectAndCompute(base_gray, None)
    
    if des1 is None or des2 is None:
        print("Not enough features to align!")
        sys.exit(1)
        
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
        
    matrix, inliers = cv2.estimateAffinePartial2D(points1, points2, method=cv2.RANSAC)
    
    if matrix is None:
        print("Alignment failed!")
        sys.exit(1)
        
    h, w = base_alpha.shape
    aligned_gen_cv = cv2.warpAffine(gen_cv, matrix, (w, h), borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))
    aligned_gen_bgr = aligned_gen_cv[:, :, :3]
    aligned_gen_alpha = aligned_gen_cv[:, :, 3]
    
    diff = cv2.absdiff(base_bgr, aligned_gen_bgr)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    _, mask_diff = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)
    
    new_regions = cv2.bitwise_and(aligned_gen_alpha, cv2.bitwise_not(base_alpha))
    
    combined_mask = cv2.bitwise_or(mask_diff, new_regions)
    combined_mask = cv2.bitwise_and(combined_mask, aligned_gen_alpha)
    
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    clean_mask = np.zeros_like(mask)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= 400:
            clean_mask[labels == i] = 255
            
    clean_mask = cv2.GaussianBlur(clean_mask, (5,5), 0)
    _, clean_mask = cv2.threshold(clean_mask, 127, 255, cv2.THRESH_BINARY)
    
    final_alpha = cv2.bitwise_and(aligned_gen_alpha, clean_mask)
    aligned_gen_cv[:, :, 3] = final_alpha
    
    out_master = f"{project_root}/assets/outfits_src/{output_id}_master.png"
    cv2.imwrite(out_master, aligned_gen_cv)
    
    out_img_pil = Image.fromarray(cv2.cvtColor(aligned_gen_cv, cv2.COLOR_BGRA2RGBA))
    
    out_web_img = out_img_pil.resize((560, 760), Image.Resampling.LANCZOS)
    out_web = f"{project_root}/frontend/public/characters/outfits/{output_id}.png"
    out_web_img.save(out_web)
    
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
        out_thumb = f"{project_root}/frontend/public/characters/outfits/{output_id}_thumb.png"
        thumb.save(out_thumb)
    else:
        print(f"Warning: No bounding box found for {output_id}")

if __name__ == '__main__':
    process_outfit(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
