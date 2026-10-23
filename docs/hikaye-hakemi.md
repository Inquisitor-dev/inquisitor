# Hikâye hakemi

Hikâye havuzuna girecek bir vaka, insan onayından önce hakemden geçer. Hakem iki parçadır:

1. **Kod kontrolü** (bedava, her zaman çalışır): metinlerde iç kimlik var mı, Türkçe karakterleri eksik yazılmış sık kelimeler (cunku, icin, seyin…) var mı?
2. **Yapay zekâ hakemi** (tek Gemini çağrısı, `STORY_REVIEW`): serbest metindeki kaymalar.

Kodu: `backend/src/stories/story-review.ts` (kontroller ve karar), `backend/src/llm/prompts/story-review-prompt.builder.ts` (istem ve cevabın okunması), `LlmService.reviewStory`.

## Hakemden önce: kod doğrulaması

Üretilen her hikâye paketi (`StoryPackage`) hakeme gitmeden `validateStoryPackage` (`backend/src/stories/story-validation.ts`) ile denetlenir. Yapay zekâ çağrılmaz.

| Kontrol | Ne bakar? | Sonuç |
|---|---|---|
| Eksik alan | Vaka Motoru v2 alanları (`validateV2StoryPackage`) | hata |
| Plana uyum | Plan, gerçekler ve metinler aynı katili ve aynı silah, motif, saat, olay yerini söylüyor mu; her şüphelinin rol metni, her mekânın ipucu, her masumun mazereti ve tek bir cinayet bağı var mı; silah evrenin kataloğunda mı; tanık varsa eşkâli yazılmış mı | hata |
| Katilin erken sızması | Oyunun başında okunan vaka metni (`scenario`) kurbanın adını veriyor mu, şüphelilerden yalnızca katili mi anıyor | hata; katil ve şüphelilerin bir kısmı anılıyorsa uyarı |
| Çözücü | Plan `isPlanSound`'dan geçiyor mu: 2 arama izniyle çözülebilir, zorluğa yetecek emek, iki bağımsız yol | hata |

Hatası olan paket reddedilir, uyarısı olan insana gider. 10 gerçek üretilmiş vakanın hepsi doğrulamadan geçti.

## Girdi

Hakem bir vakayı `StoryReviewInput` olarak okur:

| Alan | Kaynağı |
|---|---|
| `scenarioType` | Evren (`medieval`, `modern`, …) |
| `facts` | Kodun vaka planı: `CaseFacts` (`scenarios/case-setup.ts`). Mazeretler, doğrulayan kanıt metni ve tanığın eşkâli de burada. |
| `scenario`, `truthReveal`, `npcPrompts`, `locationClues` | Yapay zekânın yazdığı metinler (`ScenarioDraft`) |

Hikâye paketi bu iki parçayı (`CaseFacts` ve `ScenarioDraft`) saklarsa hakem doğrudan çalışır. Bugün oynanan vakalarda aynı bilgiler `GameSession` (`caseFacts`, `truthReveal`, `locationClues`) ve `SessionNpcState.dynamicPrompt` alanlarında duruyor.

## Neye bakar?

Kesin kurallar üretim sırasında kodla onarılır (`llm.service.ts` içindeki `repair*` adımları), hakem bunları bildirmez:

- katilin mekân ipucunda kan ya da silah,
- tuzak izin suçladığı herkesi göstermesi,
- tanığın ya da masumların katilin adını söylemesi,
- tamamen masum eşlerin farklı yer söylemesi.

Hakemin baktıkları:

| Kategori | Ne arar? |
|---|---|
| `TRUTH` | Gerçek metni mazeretlerle aynı yeri, kişileri ve saati söylüyor mu? İpuçlarında olmayan bir kanıt eklemiş mi? |
| `ROLE` | Rol metninde "sıkıştırılınca itiraf et" gibi bir talimat var mı (itirafı oyun verir)? Silahı bilmeden veren, kime verdiğini biliyor mu? |
| `IMPLICIT_LEAK` | Gerçek metni ve katilin kendi rolü dışında, adı geçmeden yalnızca katili gösteren bir tarif var mı (meslek, üniforma, tür, ona özgü bir eşya)? |
| `LANGUAGE` | İngilizce kelime, oyun terimi, iç kimlik, yazım hatası, Türkçe karakter eksikliği |
| `LOGIC` | Yara silahla, saatler ölüm saatiyle, olay yeri tarifi görünüşüyle (dağınık/düzenli) uyuşuyor mu? |

Bilerek böyle olanlar da bildirilmez: tanığın eşkâlinin birkaç şüpheliye uyması (yalnızca katile uyuyorsa bildirilir), katilin rol metninde gerçeğin tamamı olması, katilin kendi mekân ipucunun motifini göstermesi.

## Çıktı ve karar

Her bulgu: kategori, kesinlik (`CERTAIN` / `DOUBT`), alan anahtarı (`truthReveal`, `npcPrompts.mill`, `locationClues.tavern`, `alibis.church` …), metinden birebir alıntı ve kısa bir Türkçe not.

- Alıntısı o alanın metninde geçmeyen bulgu atılır (hakem uyduramasın).
- **Kararı kod verir:**
  - en az bir `CERTAIN` bulgu → `REJECT`,
  - yalnızca `DOUBT` bulgu ya da hakem çalışmadı → `HUMAN` (insan bakar),
  - bulgu yok → `PASS`.
- İç kimlikler her zaman `CERTAIN`, Türkçe karakter şüphesi `DOUBT` sayılır.
- `TRUTH` bulguları hakem kesin dese de `DOUBT` sayılır: denemelerde en çok yanlış alarm veren kontrol buydu (ipucunda açıkça duran eşyayı "hiçbir yerde yok" sandı).
- Hakemin cevabı okunamazsa bir kez daha sorulur; çalışma kâğıdı bozuk olsa da sondaki bulgu listesi okunur.

## Nasıl çalışır?

Ucuz model (Flash-Lite) "bul ve yaz" denince metinleri karşılaştırmadan "sorun yok" diyordu (ilk ölçüm 4/10). İstem artık önce kısa bir **çalışma kâğıdı** doldurtuyor: her masumun mazereti ile gerçek metnindeki yeri ve saati, gerçek metnindeki kanıtların hangi ipucunda geçtiği, rol metinlerindeki talimatlar, saatler, yara ve dil. Sonra kâğıttaki her uyumsuzluk bulgu olarak yazılıyor. Kod yalnızca bulguları okur.

## Deneme seti

`backend/src/stories/review-fixtures.ts`: kurallara uyan temiz bir Ortaçağ vakası ve ondan tek bir hatayla bozulmuş on kopya (her kategoriden; ekip testlerinde görülen kaymaların aynısı). Temiz vakada bulgu çıkmamalı; her bozuk vakada beklenen kategoride bir bulgu çıkmalı. Birim testleri kod kontrolünü bu setle ölçer; yapay zekâ hakemi gerçek Gemini ile ölçülür.

## Deneme komutu

`backend/` içinde (Gemini anahtarı gerekir; token kullanımı veritabanına değil komutun raporuna yazılır):

| Komut | Ne yapar? |
|---|---|
| `npm run stories:review -- --fixtures [--repeat 3] [--only clean,truth-extra-item] [--verbose]` | Deneme setini hakemden geçirir; yakalama ve yanlış alarm oranını yazar. |
| `npm run stories:review -- --generate 5 [--universe winter] [--difficulty hard]` | Oyundaki yoldan vaka üretir (`planCase` + `generateSessionScenario`) ve hakemden geçirir; veritabanı gerekmez. |
| `npm run stories:review -- --sessions 5` | Yerel veritabanındaki son Vaka Motoru v2 vakalarını hakemden geçirir. |
| `--out sonuc.json` | Bütün sonuçları dosyaya yazar. |

## Ölçüm (22 Ekim 2026, gemini-3.5-flash-lite)

| | Sonuç |
|---|---|
| Deneme seti, 3 tur | Bozuk vakaların 27/30'u yakalandı (bir önceki 3 turda 28/30); temiz vakada yanlış alarm 0/3 |
| Kaçırılanlar | Eşkâlin yalnızca katile uyması (2/3 tur), mazeretin öğle saatini söylemesi (1/3 tur) |
| Hakem maliyeti | Hikâye başına ortalama ~3.600 token (tek çağrı) |
| Üretim maliyeti | Vaka başına ~9.000–11.000 token (senaryo + tutarlılık + onarımlar) |

10 gerçek üretilmiş vakada (5 evren, her zorluk) hakemin yakaladıkları:

- **Cyberpunk vakalarının ikisinde de** gerçek metni karakterleri iç kimlikle anıyor: `'mill' (AURA-9)`, `'tavern' (Memur Kael Voss)`. Çin vakasında da bir kez (`Lin Feng ('tavern')`).
- **Silahı bilmeden veren** karakterin rol metninde iki vakada "sıkıştırıldığında bunu itiraf edeceksin" talimatı var. Senaryo istemindeki "kırılana kadar saklar" ifadesi böyle yazılıyor olabilir.

Bu ikisi üretimde düzeltilebilir (senaryo istemi ya da yeni bir onarım adımı); hakem yakalamaya devam eder.

## Onay kuralları (Faz 0 önerisi)

- Kesin çelişki varsa red, şüphe varsa insana.
- Hikâyeleri 1–2 kişi okur ve oynar; kimse kendi ürettiği hikâyeyi onaylamaz.
