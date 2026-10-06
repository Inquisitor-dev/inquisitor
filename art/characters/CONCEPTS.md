# Karakter Konseptleri

Gardıropta 5 tam kıyafet var: 1 varsayılan + 4 satın alınabilir. Her kıyafet baştan sona tek bir görsel setidir; parça parça giydirme yok.
Akış: Gemini referans görseli → görselden 3D → Mixamo (iskelet + yürüme/durma) → Blender render → `frontend/public/characters/<id>/`.

Karakter listesi henüz belirlenmedi.

## Tasarım kuralları

- Etek, palto ve tunik en fazla diz hizasında bitsin, yırtmaçlı olsun. Yere kadar uzanan kumaş yürürken bacaklarla bölünür.
- Elde nesne olmasın. Gerekirse kemere asılı olsun.
- Uçuşan pelerin ve atkı olmasın. Kısa, sert omuz pelerini sorun değil.
- Tek baskın renk ve tek vurgu rengi kullanılsın. Karakter haritada ~80 px boyunda görünür.
- Bütün karakterler aynı vücut oranında olsun; aynı iskelet ve animasyon hepsine oturur.

## Gemini referans görselleri

- Her karakter için 3 görsel: `<id>_front.png`, `<id>_back.png`, `<id>_side.png` (sol profil). Klasör: `art/characters/<id>/ref/`.
- En-boy oranı 2:3 dikey (en az 1024×1536). Tam boy, ortalanmış; karakter yüksekliğin ~%85'ini kaplar.
- A-poz (kollar gövdeden 30–40° açık), düz açık gri arka plan (`#D9D9D9`), düz ve gölgesiz ışık.

## Oyun içi çıktı (Blender render)

- Harita: 8 yön × 12 kare yürüme, 8 yön × 8 kare durma; kare 192×256 px.
- Menü 360°: 72 kare, kare 512×640 px.
- Market kartı: 512×512 px, 3/4 açı.
