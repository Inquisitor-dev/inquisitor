# Hikâye hakemi

Hikâye havuzuna girecek bir vaka, insan onayından önce hakemden geçer. Hakem iki parçadır:

1. **Kod kontrolü** (bedava, her zaman çalışır): metinlerde iç kimlik var mı?
2. **Yapay zekâ hakemi** (tek Gemini çağrısı, `STORY_REVIEW`): serbest metindeki kaymalar.

Kodu: `backend/src/stories/story-review.ts` (kontroller ve karar), `backend/src/llm/prompts/story-review-prompt.builder.ts` (istem ve cevabın okunması), `LlmService.reviewStory`.

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
- İç kimlikler her zaman `CERTAIN` sayılır.

## Deneme seti

`backend/src/stories/review-fixtures.ts`: kurallara uyan temiz bir Ortaçağ vakası ve ondan tek bir hatayla bozulmuş on kopya (her kategoriden; ekip testlerinde görülen kaymaların aynısı). Temiz vakada bulgu çıkmamalı; her bozuk vakada beklenen kategoride bir bulgu çıkmalı. Birim testleri kod kontrolünü bu setle ölçer; yapay zekâ hakeminin ölçümü gerçek Gemini ile yapılır.

## Onay kuralları (Faz 0 önerisi)

- Kesin çelişki varsa red, şüphe varsa insana.
- Hikâyeleri 1–2 kişi okur ve oynar; kimse kendi ürettiği hikâyeyi onaylamaz.
