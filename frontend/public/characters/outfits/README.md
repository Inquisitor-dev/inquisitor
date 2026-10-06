# Kıyafet Katmanları

Marketteki `outfit` kategorisindeki eşyaların görselleri. Lobide ve gardıropta çıplak gövdenin
(`base_nude.png`) üstüne bindirilerek çizilir.

## Görsel sözleşmesi

- **Ana tuval (Photopea):** **1120x1520**, şeffaf. Çıplak gövde ve tüm kıyafetler bu tuvalde,
  birbirine hizalı hazırlanır. Ana kopyalar repo kökündeki `assets/outfits_src/` klasöründe durur
  (`base_nude_master.png` vb.).
- **Web boyutu (bu klasör):** ana tuvalin yarısı, **560x760** PNG. Tuval kırpılmaz; eşya,
  gövdeye göre durduğu konumda, etrafı şeffaf olarak kalır.
- **Arka plan:** şeffaf. Sadece eşyanın kendisi çizilir.
- **Dosya adı:** eşyanın `marketItems.ts` içindeki `id` değeri, ör. `outfit_scarlet_robe.png`.
- **Küçük görsel:** aynı ada `_thumb` eki, ör. `outfit_scarlet_robe_thumb.png`.
  256x256, şeffaf arka plan, eşya ortalanmış. Market kartında ve gardırop listesinde kullanılır;
  yoksa katman görseli gösterilir.

## Yeni bir kıyafet hazırlama

1. `assets/outfits_src/base_nude_master.png` dosyasını ChatGPT'ye ver, kıyafeti giydirmesini iste
   (poz, çerçeve ve stil aynı kalsın).
2. Sonucu Photopea'da 1120x1520 tuvale, çıplak gövdenin üstüne %50 opaklıkla hizala.
3. Katman maskesiyle sadece kıyafeti bırak, gövdeyi gizleyip tuvalin tamamını PNG olarak dışa aktar.
4. 560x760'a küçültüp bu klasöre `<id>.png` adıyla koy. Dosya adlarında çift uzantı (`.png.png`)
   olmamasına dikkat et.

## Çizim sırası

Katmanlar `marketItems.ts` içindeki `SLOT_Z_ORDER` sırasıyla (alttan üste) çizilir:

```
shoes → body → necklace → mask → hat
```

Yani şapka her şeyin, maske kolyenin, kolye kıyafetin üstünde görünür.

## Gövde parçaları ve örtme

Katmanlar gövdeden piksel silemediği için çıplak gövde üç parça çizilir: `base_body.png`
(saçsız, ayaksız), `base_hair.png` ve `base_feet.png`. `base_nude.png` sadece kaynak olarak durur.

- Kafa eşyaları `hairLayer` ile kendi kırpılmış saçını (`<id>_hair.png`) kullanır; eşyanın
  dışından taşan saç çizilmez.
- Ayağı örten ayakkabılar `hidesFeet: true` ile çıplak ayakları gizler (sandalet gizlemez).

Yeni bir kafa eşyası veya ayakkabı eklendikten sonra repo kökünden
`python assets/outfits_src/tools/occlusion.py` çalıştır (listeler scriptin başında), sonra
`marketItems.ts` kaydına `hairLayer` / `hidesFeet` alanını ekle.

## Durum

- `base_nude.png` ve `outfit_scarlet_robe*.png` gerçek çizimlerdir.
- Diğer kıyafetler düz şekillerden oluşan **geçici (placeholder)** çizimlerdir; gerçek çizimler
  aynı ad ve boyutla değiştirilebilir, kod değişikliği gerekmez.
