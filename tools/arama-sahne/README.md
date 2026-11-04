# Arama sahnesi üretimi

Mekân aramasının (tıkla-bul) sahneleri: Gemini'nin tek parça çizdiği dağınık bir görsel, elle çizilmiş kutular ve kutulardan
SAM ile çıkarılan piksel maskesi. Oyundaki kurallar için `backend/CLAUDE.md` (search) ve `docs/nesne-arama-tasarimi.md`.

Nesneleri ayrı üretip kodla dizme denendi, bırakıldı: masada idare etti, rafta yapıştırma gibi durdu, görünüm de tek
parça çizimlerin gerisinde kaldı. O iş yerel `arsiv/kodla-dizme` dalında.

## Klasörler

| Yol | İçerik |
|---|---|
| `istemler/` | Sahnelerin Gemini istemleri |
| `kaynak/` | Seçilen görseller (`.webp`) |
| `tek_parca/` | Sahne tanımları: görsel, alan, yer ifadesi, nesneler ve asıl yerlerin kutuları |
| `cikti/` | Kontrol görselleri (depoya girmez) |

## Akış

1. **Üret:** Gemini uygulamasında (ücretsiz) Pro model, her istem için yeni sohbet, görsel yüklemeden; indirme düğmesiyle kaydet.
   `node uret.mjs istemler/<ad>.txt` aynı işi API ile yapar (görsel başına yaklaşık 0,13 $; anahtar `GEMINI_API_KEY` ya da
   `backend/.env`, oyunla ortaksa kredi bitince oyun da durur). Her istemden 2-3 üretip en iyisini seç.
2. **İşaretle:** görseli `kaynak/` altına koy, `tek_parca/<sahne>.json` yaz (örnek `otel_tv.json`). Yalnızca tek kopyası olan,
   adından tanınan nesneler; alan başına en az 10, tercihen 20+ hedef ve 3 asıl yer. Kutu `[x, y, genişlik, yükseklik]`, görselin yüzdesi.
3. **Maske:** ayrı bir ortama `pip install -r requirements.txt` (~1 GB), sonra `python maske.py tek_parca/<sahne>.json`. Görsel
   `frontend/public/search-scenes/...`, sahne kaydı ve maske `backend/src/search/scenes/generated/` altına yazılır, liste yenilenir.
4. **Kontrol et:** `cikti/maske_<ad>.png`. Arkasındakini alan ya da yarım kalan şekil çıkabilir: kutuyu daralt, `parcalar` ile
   ikiye böl ya da nesneyi listeden çıkar. Sonra `npm test` (backend) `sceneProblems` ile denetler.
5. **Yayına al:** sahneler `DRAFT` başlar, yalnızca test modunda gelir. Oynayıp beğenince sahne dosyasında `status: 'READY'` yap.

## İstem kuralları (denemelerden)

- **Açı:** önden raf ya da eğik açılı yığın. Tam tepeden açı üç denemede de işe yaramadı: eşyalar düzgün serildi, kopya çoğaldı.
- **Nesne adı verme, hikâye anlat.** Adlı liste düzenli vitrin verdi; "yirmi yıldır atılan eşyalar" hikâyesi dağınık, doğal sonuç verdi.
- **Yer çekimi:** "everything obeys gravity, nothing floats, no object passes through another" yaz.
- **Yazı:** "plain and blank, no writing" yaz; zarf, mektup, harita ve kâğıdı `Avoid`'a ekle (oyuncu kanıt sanar).
- Bazı eşyalar yine çift çıkar: onları listeye alma, dikkat dağıtıcı olarak kalırlar.
