# Hikâye hakemi

Hikâye havuzuna girecek bir vaka, insan onayından önce hakemden geçer. Hakem iki parçadır:

1. **Kod kontrolü** (bedava, her zaman çalışır): metinlerde iç kimlik var mı, Türkçe karakterleri eksik yazılmış sık kelimeler (cunku, icin, seyin…) var mı, rol metninde itiraf talimatı ("Sorguda bunu itiraf edeceksin", kesin hata) kalmış mı, bir mazeret gecenin başka bir vaktini mi söylüyor (ölüm akşam, mazerette "gece yarısı tütsüleri"; şüphe)?
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

`backend/src/stories/review-fixtures.ts`: kurallara uyan temiz bir Ortaçağ vakası, bulgu vermemesi gereken üç temiz çeşidi (cesedin örtüsü ve ipucunda geçmeyen silah, mazerette sabah yapılacak bir iş, mazeretiyle uyuşan kısmi tanık) ve tek bir hatayla bozulmuş on iki kopya (her kategoriden; ekip testlerinde ve pilotta görülen kaymaların aynısı). Temiz vakalarda bulgu çıkmamalı; her bozuk vakada beklenen kategoride bir bulgu çıkmalı. Birim testleri kod kontrolünü bu setle ölçer; yapay zekâ hakemi gerçek Gemini ile ölçülür.

## Deneme komutu

`backend/` içinde (Gemini anahtarı gerekir; token kullanımı veritabanına değil komutun raporuna yazılır):

| Komut | Ne yapar? |
|---|---|
| `npm run stories:review -- --fixtures [--repeat 3] [--only clean,truth-extra-item] [--verbose]` | Deneme setini hakemden geçirir; yakalama ve yanlış alarm oranını yazar. |
| `npm run stories:review -- --generate 5 [--universe winter] [--difficulty hard]` | Oyundaki yoldan vaka üretir (`planCase` + `generateSessionScenario`) ve hakemden geçirir; veritabanı gerekmez. |
| `npm run stories:review -- --sessions 5` | Yerel veritabanındaki son Vaka Motoru v2 vakalarını hakemden geçirir. |
| `npm run stories:review -- --stories b178ba2b,8d38be6d` | Havuzdaki hikâyeleri bugünkü hakemden yeniden geçirir ve kayıtlı kararla yan yana yazar; kayıt değişmez. Hakem ayarı değişince eski bulguları yeniden ölçmek için. |
| `--out sonuc.json` | Bütün sonuçları dosyaya yazar. |

## Havuzu doldurma

`npm run stories:generate -- --per-bucket 2` (backend/, yerel veritabanında `Story` tablosu gerekir: `npm run prisma:push`):

1. Hikâye oyundaki yoldan üretilir (`generateStoryPackage`: plan, çözücü, Gemini, onarımlar).
2. `validateStoryPackage` ile kod doğrulaması; kalırsa hakeme gönderilmez.
3. Hakem.
4. `Story` tablosuna kayıt: doğrulamadan kalan ya da hakemin kesin hata bulduğu hikâye `REJECTED`, diğerleri `DRAFT` (hakem geçirse de insan onayı bekler). `reviewResults`: doğrulama, hakem, token maliyeti.

Kovalar (evren × zorluk) sırayla birer birer doldurulur ve var olan reddedilmemiş hikâyeler sayılır: komut kesilirse yeniden çalıştırınca kaldığı yerden devam eder. Token bütçesi (`--max-tokens`, varsayılan 300.000) dolunca ya da art arda 3 üretim hatasında durur. `--dry-run` veritabanına dokunmadan dener. Deneme: bir Ortaçağ/kolay hikâye ~9.200 üretim + ~3.700 hakem = ~12.900 token.

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

## Pilottan sonra ayar (23 Ekim 2026)

Pilotun 15 hikâyesinde hakemin yanıldığı üç yer düzeltildi:

| Pilottaki hata | Ayar | Yeniden ölçüm (`--stories`) |
|---|---|---|
| Haksız ret (Çin-zor): "sabah teslim edilecek kılıçları dövüyordu" ölüm saatiyle çelişki sayıldı | Çalışma kâğıdında yalnızca planlanan ya da gelecekteki bir işi söyleyen saat atlanır | Kesin hata kalktı |
| Gereksiz şüphe: cesedin örtüsü (modern-zor) ve cinayet aleti (cyberpunk-orta) ipuçlarında geçmiyor | İkisi "bildirme" listesinde; gerçek metnindeki kanıtlar arasında sayılmaz | İki hikâyede de bildirilmedi |
| Kaçırılan: kısmi tanığın gördüğü yer kişinin mazeretiyle uyuşmuyor (cyberpunk-orta) | Kadroda kısmi tanığın kimi gördüğü yazılır; çalışma kâğıdına `sightings` satırı | 3/3 denemede yakalandı |
| Kaçırılan: mazerette ölüm saatiyle çelişen saat (Çin-zor, "gece yarısı tütsüleri", ölüm akşam) | Kâğıtta üç gece vakti ayrı sayılır; hakem yine kaçırdı (3/3), kod kontrolü eklendi | Kod yakalıyor (şüphe) |

İstem uzayınca hakem rol metnindeki itiraf talimatını ara sıra atladı (main'de 3/3, ayardan sonra 2/4); bu kontrol de koda taşındı (`findConfessionInstructions`, üretimdeki `removeConfessionInstructions` ile aynı kural).

Deneme seti (16 vaka, 1 tur): bozuk vakaların 12/12'si yakalandı, temiz vakalarda yanlış alarm 0/4; hakem ortalama ~3.700 token.

## İnsan onayı

`npm run stories:approve` (backend/):

| Komut | Ne yapar? |
|---|---|
| `-- --list [--status DRAFT\|REJECTED\|APPROVED\|all]` | Hikâyeleri kod doğrulaması, hakem kararı, bulgu sayısı ve verilen kararla listeler (varsayılan: onay bekleyen taslaklar). |
| `-- --show <id>` | Hikâyeyi okunur halde gösterir: vaka gerçekleri, oyuncunun okuyacağı metinler, her karakterin rolü ve mazereti, mekân ipuçları, doğrulayan kanıt, kodun ve hakemin notları, maliyet. |
| `-- --approve <id> [--note ".."]` | Onaylar; hikâye havuzda oynanabilir olur. Hakemin reddettiği hikâye yalnızca `--force` ile onaylanır; kod doğrulamasından kalan hiçbir zaman onaylanmaz. |
| `-- --reject <id> --note ".."` | Reddeder (not zorunlu); onaylı hikâyeyi de havuzdan çeker. |
| `-- --stats` | Kovaların durumu (evren × zorluk × taslak/onaylı/reddedilen). |

`<id>` yerine listedeki ilk 8 karakter yeter. Karar (durum, kişi, not, zaman) `reviewResults.decision`'a yazılır. Oyun yalnızca onaylı hikâyeleri seçer (`STORY_POOL_ENABLED=true`).

## Havuzu ekiple paylaşma

Havuzun ortak kaydı repo'dur: her hikâye `backend/stories/<evren>/<zorluk>/<id>.json` dosyasıdır (içerik, durum, hakem ve onay kaydı). Kod: `backend/prisma/story-sync.ts`, `backend/src/stories/story-files.ts`.

| Kim | Ne yapar? |
|---|---|
| Üreten ve onaylayan (Enes) | `stories:generate` ve `stories:approve` sonrası `npm run stories:export`, ardından `backend/stories` için branch + PR |
| Ekip | main'i çekince `npm run stories:import` (önce `prisma:push`; `-- --dry-run` yalnızca ne olacağını gösterir) |
| Canlı ortam | Aynı `stories:import`, canlı `DATABASE_URL` ile |

Hikâyeler kimlikle eşleşir. İçe aktarım yeni hikâyeyi ekler, dosyası daha yeni olanı günceller; yerelde dosyadan daha yeni kayıt (dışa aktarılmamış bir karar) ezilmez. İki yönde de hiçbir şey silinmez. Değişmeyen hikâye dışa aktarımda fark üretmez. 16 pilot hikâye ~200 KB tutuyor.

## Onay kuralları (Faz 0 kararı, 22–23 Ekim 2026)

- **Hakemin geçme eşiği:** kesin hata (`CERTAIN`) varsa red, yalnızca şüphe (`DOUBT`) varsa ya da hakem çalışmadıysa insana, bulgu yoksa geçer. Kararı kod verir (`decideStoryReview`).
- **Onaylayan:** Enes. Hikâyeleri okur ve bir kısmını oynar; gerekirse ikinci bir kişi eklenir.
- Hakemin geçirdiği (`PASS`) hikâye de insan onayından geçmeden havuza girmez.
- "Kimse kendi ürettiği hikâyeyi onaylamaz" kuralı 23 Ekim'de kaldırıldı: üretim de Enes'e geçti ve hikâyeyi Gemini yazıyor.
