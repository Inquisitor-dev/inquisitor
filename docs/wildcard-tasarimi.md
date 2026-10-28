# Küçük Wildcard'lar ve Vaka Kırılmaları

Durum (28 Ekim 2026, Berke):
- **Küçük wildcard'lar: uygulandı.**
- **Vaka kırılmaları: ertelendi.** Tasarımları bölüm 4'te duruyor; sırası gelince yeniden açılacak.

Kaynak: 26 Ekim 2026 Yol Haritası raporu. Vaka Motoru v2'nin 5. adımıdır ve v3 persona altyapısının üstüne kuruldu (`docs/v3-persona-tasarimi.md`).

## Değişmeyen ilkeler

1. **Kod seçer, çözücü doğrular.** Wildcard vaka planının (`planCase` → `CasePlan.wildcards` → `caseFacts`) parçasıdır. Kime ya da hangi güne denk geleceğini kod seçer. Çözülebilirliği değiştiren wildcard çözücüden geçer (`isGraphSound`: çözülebilir, zorluğa yetecek emek, tek kritik kanıt yok).
2. **Katili ele vermez.** Seçim katil dahil herkese aynı olasılıkla düşer. Pano, korku göstergesi, yetenekler ve defter katilin adını söylemez.
3. **Yeni görsel yok.**
4. **Token maliyeti artmaz.** Bütün metinler koddan gelir (`scenarios/wildcards.ts`, `personas/wildcard-texts.ts`); Gemini çağrılmaz. NPC istemine yalnızca ilgili satırlar eklenir.
5. **Kanıt ve ifade metni koddan gelir.** İtirafı yalnızca kod kaydeder.

## 1. Zorluk ve sayı

- Vakaların yaklaşık üçte birinde (`WILDCARD_CHANCE` 0,3) **bir** wildcard olur; hiçbir vakada birden fazla olmaz.
- Wildcard persona ve kasaba olaylarından sonra, planın en sonunda çekilir (`withWildcards`). Böylece önceki rastgele seçimlerin sırası değişmez.
- Çözücüden geçemeyen wildcard düşer, plan yeniden çekilmez.
- Uygun olanlar arasından eşit olasılıkla seçilir.

| Zorluk | Açık wildcard'lar (`WILDCARDS_BY_DIFFICULTY`) |
|---|---|
| Kolay | Kurbanın Notu, Hevesli Kadı (yalnızca kolaylaştıranlar) |
| Orta | hepsi |
| Zor | Kısa Gün, Dedikodu, Suskun Tanık (yalnızca zorlaştıranlar) |

**Ayrılan Tanık yalnızca ortada açılır.** Ayrılan kişinin katil olamayacağı oyuncuya bedava bir eleme verir.

**Hikâye paketi.** `wildcardCount` artık planın wildcard sayısıdır, `STORY_RULE_VERSION` **5** oldu: planında `wildcards` listesi (boş da olabilir) olan paket. Sürüm 4 hikâyeleri oyuna seçilmez. Havuz zaten v3'ün sonunda yeniden üretilecek.

## 2. Wildcard'lar

| Wildcard | Tür | Ne olur |
|---|---|---|
| **Ayrılan Tanık** (`LEFT`) | Zorlaştırır | Bir şüpheli 3. sabah kasabadan temelli ayrılır. |
| **Kısa Gün** (`SHORT_DAY`) | Zorlaştırır | 2. ya da 3. gün bayram veya yasak yüzünden sabah kaybedilir. |
| **Dedikodu** (`RUMOR`) | Zorlaştırır | 2. sabahtan itibaren bir şüpheli hakkında doğrulanmamış bir söylenti dolaşır. |
| **Suskun Tanık** (`RELUCTANT`) | Zorlaştırır | Doğrulayan tanık, kendisine belli bir kanıt gösterilmeden gördüğünü anlatmaz. |
| **Kurbanın Notu** (`VICTIM_NOTE`) | Kolaylaştırır | Bedenin üstünde motifi gösteren, kimseyi anmayan bir not çıkar. |
| **Hevesli Kadı** (`EXTRA_WARRANT`) | Kolaylaştırır | Vakada üçüncü bir arama izni olur. |

### Ayrılan Tanık (`LEFT`)

**Kime düşer.** Katile, vakayı taşıyan kanıtın sahibine (doğrulayan kanıtın mekânı ya da tanığı) ve başka bir kapanışın sahibine (şehir dışı, kilit kırma) düşmez.

**Çözücü.** En kötüsünü varsayar: kişinin ifadeleri, itirafı ve mekân ipucu vakada hiç yokmuş gibi çözülür (`graphWithWildcards`). Oyuncu ilk iki günde onlara ulaşmamış olabilir.

**Oyunda**
- 2. sabahın gazetesi "… kasabadan ayrılıyor" diye, 3. sabahınki "… kasabadan ayrıldı" diye duyurur.
- Kişinin kendisi ayrılacağını `YOUR SCHEDULE` bölümünde bilir (`ownWildcardPlanLines`); ötekiler dedikodusunu duyar (`wildcardPromptLines`).
- 3. günden sonra mekânı kapalıdır (`closuresOn`, sebep `LEFT`). Kişi sorgulanamaz, nezarete alınamaz, mekânı aranamaz.

### Kısa Gün (`SHORT_DAY`)

**Oyunda**
- O günün sabahı iki zaman dilimi kısa başlar: `advanceDay`, `timeOfDay`'i 2'den başlatır (`shortDayStart`). Bu, Çatı Geçişi'nin sabah kaybıyla aynı yoldur.
- Bir gün önceki ve o günün gazetesi gerekçeyi yazar (`SHORT_DAY_REASONS`, evrene göre: aziz günü, festival, şirket denetimi, fener bayramı, tipi). Kasabada herkes bunu bilir.

**Çözücü.** Değişmez; çözücü zamanı modellemiyor.

### Dedikodu (`RUMOR`)

**Kime düşer.** Hedefi katil dahil bütün şüphelilere eşit olasılıkla düşer (test: katile yaklaşık altıda bir).

**Oyunda**
- 2. sabah deftere bir olay kartı düşer (`EVENT`, kaynak `rumor`): "Kasabada bir söylenti dolaşıyor: … Doğrulanmamış bir dedikodu."
- Kart kanıt değildir: gösterilemez, panoya ve Hüküm Dosyası'na girmez, kimseyi korkutmaz.
- Hedefin istemi, katil de olsa masum da olsa aynıdır: söylentiyi küçük bir mesele diye geçiştirir.
- Ötekiler bunu "doğrulanmamış dedikodu" olarak bilir; görmüş gibi anlatmaz.

**Çözücü.** Değişmez.

### Suskun Tanık (`RELUCTANT`)

**Kime düşer.** Yalnızca doğrulayan kanıt bir tanıklıksa, o tanığa düşer.

**Hangi kanıt açar.** Kod olay yeri izini ya da (silahı olan vakada) bedeni seçer.

**Oyunda**
- O kanıt tanığa gösterilene kadar tanıklık metni isteme hiç girmez, kod da onu kaydetmez (`reluctantLock`, `verificationLocked`). Kanıtın gösterilip gösterilmediği `shownEvidenceIds`'ten bakılır.
- Tanık o gece sorulunca tedirgin olur ve ancak o kanıtı görürse konuşabileceğini söyler.
- Rüya Tabiri onu da konuşturur.

**Çözücü.** Tanıklık o kanıtı ön koşul olarak alır. İkisi de her zaman elde olduğu için vaka yine iki bağımsız yolla çözülür.

### Kurbanın Notu (`VICTIM_NOTE`)

**Kime düşer.** Yalnızca silahı ve motifi olan vakalarda çıkar.

**Oyunda**
- Olay yeri anlatıcısı örtüyü kaldırınca bedenin cebindeki notu kelimesi kelimesine okur.
- Beden kaydedildiğinde not da envantere düşer (`NOTE`, kaynak `victim`; fotoğrafı olay yerinin görseli).
- Metni motife göre koddan gelir (`VICTIM_NOTES`) ve kimseyi adıyla anmaz.
- Kimseyi korkutmaz; pano onu bir şüpheliye bağlayan ipi doğrulamaz. Hüküm Dosyası'nda motifi söyleyen dayanak kanıt sayılır.

**Çözücü.** Değişmez; bonus kanıttır.

### Hevesli Kadı (`EXTRA_WARRANT`)

**Oyunda**
- Vakanın izin sınırı 3 olur (`warrantLimitOf`). Bu sınırı izin kararı (`decideWarrants`), izin veren makamın istemi ve İz Sürme kullanır.
- İlk sabahın gazetesi "Arama izinlerinde kolaylık" diye duyurur.

**Çözücü.** Plan yine 2 izinle sağlam olmak zorundadır; üçüncü izin yalnızca bonustur.

**Bilerek dışarıda kalanlar**
- Yalancı masum: masumlar zaten sırlarını saklıyor.
- Tek arama izni: zor vakalar tek izinle plan üretemiyor.

## 3. Testler (`scenarios/wildcards.spec.ts`)

- **Plan:** her evren ve zorlukta en çok bir wildcard, türü zorluğa uygun ve plan yine `isPlanSound`. Ortada wildcard oranı %20 ile %40 arasında.
- **Ayrılan Tanık:** hiçbir zaman katil, vakayı taşıyan kanıtın sahibi ya da başka bir kapanışın sahibi değil. Çözücüden ifadesi, itirafı ve mekânı düşüyor.
- **Dedikodu:** hedefi katile de düşüyor (yaklaşık altıda bir). Kart 2. sabah düşüyor; hedefin ve ötekilerin istem satırları doğru.
- **Suskun Tanık:** yalnızca doğrulayan tanığa düşüyor. Kilit açılmadan tanıklık ne isteme giriyor ne de kaydediliyor.
- **Kurbanın Notu:** beden incelenince envantere düşüyor, wildcard'sız vakada düşmüyor.
- **Hevesli Kadı ve Kısa Gün:** izin sınırı 3, çözücü 2 izinle kuruyor; gazete duyuruyor; kısa günde sabah 2. dilimden başlıyor.

Gemini denemesi henüz yapılmadı; kota harcanmadan önce sorulacak.

## 4. Ertelenen: vaka kırılmaları

Tasarım taslağıdır, onaylanmadı ve uygulanmadı. Vakanın kurgusunu değiştirir; oyuncunun alıştığı bir kestirmeyi bozar. Kolayda yok, ortada isteğe bağlı, zorda her vakada bir tane düşünülmüştü. Plan alanı taslağı:

```ts
// CasePlan'a (case-setup.ts) eklenir; eski vakalarda yok
twist?: CaseTwist;

type CaseTwist =
  | { kind: 'EVERYONE_MOTIVE'; motiveHolders: { npcId: string; motive: MotiveId }[] }
  | { kind: 'LOCKED_ROOM'; keyHolderIds: string[]; lenderId: string }
  | { kind: 'FALSE_ALIBI'; voucherId: string; reason: 'FEAR' | 'MONEY' }
  | { kind: 'WRONG_VICTIM'; intendedId: string };
```

- Kırılma `withCaseDetails` içinde, `involvements` dağıtıldıktan sonra uygulanır ve `isPlanSound`'dan geçer.
- `toPublicSession` `caseFacts`'i zaten tümüyle gizliyor; ek bir şey gerekmez. Oyun sonunda `truthReveal` kırılmayı adıyla anlatır: "Aldric, Giles için yalan söyledi".
- Test modu (`buildTestScenario`): her kırılmanın hazır metni olur.

Sıra: **Herkesin Bir Sebebi Var → Kilitli Oda → Yalancı Kefil → Yanlış Kurban.** Her biri şu adımlarla gelir: plan alanı → çözücü kuralı → pano kuralı → NPC istem satırı → testler → Gemini denemesi (önce sorulur).

### 4.1 Herkesin Bir Sebebi Var (`EVERYONE_MOTIVE`, küçük)

**Ne olur.** Kurban birçok kişiye şantaj yapıyordu. Şüphelilerin çoğunun mekânında güçlü bir sebep çıkar; katil bunlardan biridir.

**Bozduğu kestirme.** "Motifi olan katildir." Oyuncu artık "kim yapabildi?" sorusuna bakar: o saatte kim açıktaydı, silah kimdeydi, iz kime uyuyor.

**Plan**
- `motiveHolders`: tamamen masumlar (`NONE`) dışındaki masumların hepsi. Zorda bu en az 4, ortada en az 3 kişi eder.
- Her birine katilinkinden farklı bir motif düşer. Liste sırasız saklanır, katil de içinde değildir; katilin motifi `plan.motive`'dir.
- Kurbanın mesleğine ve tanıtımına "şantajcı" yönü eklenir.

**Çözücü.** Değişmez. Motif zaten eleme yapmıyor; mekân ipucu sahibini yine mazeretiyle aklar.

**Pano.** Değişmez.

**Adalet kuralı.** Katilin motif ipucu ötekilerden ayırt edilemez.
- Sahip olanların mekân ipuçları "motif + mazeret" biçiminde yazılır. Katilinki "motif + örtü hikâyesine uyan bir iz" olur.
- Hepsi aynı uzunlukta ve aynı ağırlıktadır. Senaryo istemi bunu ister, kod da uzunluk farkını ölçer (bkz. testler).
- Bugün bir mekânda mazeret yoksa orası katilinkidir. Bu kanıta dayalı bir çıkarım ve izinle kazanılıyor, kalabilir.

**İstem.** Motif sahibine tek satır gider: "Kurban sana şantaj yapıyordu (<motif>). Bunu saklıyorsun; sıkıştırılınca kabul edersin ama cinayeti sen işlemedin." Katile ayrıca satır gitmez.

**Rapor.** Hüküm Dosyası'nın motif adımı değişmez. Doğru cevap katilin motifidir; diğer motifler yanlış seçenekler arasında yer alır.

**Yetenekler.** Hakkında Söylenenler motif dedikodusunu da toplar. Bu sorun değil, çünkü hepsinin motifi var.

### 4.2 Kilitli Oda (`LOCKED_ROOM`, orta)

**Ne olur.** Olay yerine o gece girmenin tek yolu vardı (anahtar, parola, geçit). Anahtarın sahipleri belli; vaka "kim girebilirdi?" sorusuna döner.

**Bozduğu kestirme.** "İz ve tanık yeter." Yeni bir erişim zinciri gerekir.

**Kapalı olay yerleri.** Yalnızca kapalı olay yerlerinde görülür; `crimeScenes` tanımına `enclosed: true` eklenir:

| Evren | Kapalı olay yerleri |
|---|---|
| Ortaçağ | ahır, gözcü kulesi |
| Modern | çamaşırhane, açık hava sineması |
| Cyberpunk | veri merkezi, kapsül otel |
| Çin | boyahane, lotus köşkü |
| Kış | avcı kulübesi, erzak ambarı |

Kırılma seçildiyse olay yeri bunlardan seçilir.

**Plan**
- `keyHolderIds`: anahtarı olan iki masum. Katil sahipler arasında **değildir**; asıl kırılma budur, çünkü bariz şüpheliler masumdur.
- `lenderId`: anahtar sahiplerinden biri. Anahtarını kaybettiğini ya da birine kısa süreliğine verdiğini saklar. Yeni bağ türü `ACCESS_HELP`, `UNWITTING_HELP`'in eşidir; aynı vakada ikisi birden olmaz.
- Anahtarın kopyası katilin mekânında bulunur (mekân ipucunun bir parçası).

**Çözücü**
- `body` gibi her zaman elde olan bir olay yeri gerçeği eklenir: kapı zorlanmamış.
- Bu gerçek anahtar sahiplerine `IMPLICATING` baskı yapar. Korku göstergesi iki masumda kıpırdar, katilde kıpırdamaz; katil adı geçmez.
- Yeni çıkarım `access-chain`: `confession(lender)` + `location(culprit)` → katili gösterir. Bu, bugünkü `weapon-chain`'in eşidir.
- Çözücü erişim zincirinin tek yol olmadığını `criticalPoints` ile zaten denetler.

**Pano.** Katilin mekân ipucu katile bağlanınca bugünkü gibi yargılanmaz, yani tek iple ad vermez. "Kopya anahtar" ipucu ile ödünç verenin itirafı arasındaki `SUPPORTS` ipi doğru sayılır.

**İstem**
- Ödünç verene: "Anahtarını kaybettin / X gün <yer>de bıraktın; söylemekten korkuyorsun."
- Öbür sahibe: "Anahtarın sende, kimseye vermedin."
- Katile: "Anahtarın kopyası sende; sorulursa inkâr et."

### 4.3 Yalancı Kefil (`FALSE_ALIBI`, orta–büyük)

**Ne olur.** Bir masum, korkudan ya da para için katile bilerek yalan mazeret verir. Katil doğrulanmış görünür; yalan ancak kefil kırılınca çıkar.

**Bozduğu kestirme.** "Birbirini doğrulayan iki kişi temizdir."

**Plan**
- `voucherId`: bir masum. Doğrulayan kanıtın tanığı olamaz, tamamen masum (`NONE`) da olamaz; kendi bağı kalır.
- Katilin örtü hikâyesi (`culpritCover`) kefille birlikte olduğunu söyler. Senaryo istemi ikisini uyumlu yazdırır.

**Çözücü**
- Kefilin verdiği `alibi:culprit` kanıtı hiçbir şeyi elemez.
- **Bu vakalarda çözücü hiçbir mazeret doğrulamasını eleme saymaz** (gerçek `NONE` eşlerininkiler dahil). Oyuncu hangisinin yalan olduğunu bilemez; adil çözüm onlarsız da var olmalıdır.
- Kefilin itirafı (korku eşiğinde) yalanı söyler ve kendi gerçek yerini anlatır. Yeni çıkarım `false-alibi-broken`: `confession(voucher)` → katilin mazereti düşer. Kimseyi elemez; katilin örtü hikâyesini boşa çıkarır.
- Kefili kıran kanıt: kendi mekân ipucu (o gece başka yerdeydi, `DECISIVE`) ve olay yeri izi.

**Pano**
- Bu vakalarda pano `ALIBI` iplerini **hiç yargılamaz**: "değerlendirilemez" der ve günün düşünme hakkını harcamaz. "Yanlış" demek katili söylemek olurdu.
- Kefilin itirafı ile katil lehine verdiği mazeret arasındaki `CONTRADICTS` ipi doğru sayılır. Oyuncu bu ipi ancak kefili kanıtla kırınca kurabilir.

**İstem**
- Kefile: "<Katil> için yalan söylüyorsun (<korku/para>). O gece onunla değildin, aslında <gerçek yer>. Kırılmadıkça yalanı sürdür."
- Katile: "<Kefil> senin için yalan söylüyor; mazeretin o."

**Yetenekler**
- Veri Sızdırma: `ALIBI` ipinde "değerlendirilemez" der, hak harcanmaz.
- Rüya Tabiri: kefil rüyada da yalanını anlatır (`ALIBI` ifadesi yalanın kendisidir).
- Teyit: kefilin sözü katile okunursa katil doğrular. Bu tutarlı, çünkü ikisi aynı yalanı söylüyor.

### 4.4 Yanlış Kurban (`WRONG_VICTIM`, orta)

**Ne olur.** Katil aslında şüphelilerden birini öldürmek istemişti. Karanlıkta ya da yanlış kadehte yanlış kişi öldü. Motif kurbana değil, hedeflenen kişiye karşıdır.

**Bozduğu kestirme.** "Kurbanla kimin derdi vardı?"

**Plan**
- `intendedId`: rastgele bir masum.
- Silah yöntemi `POISON`, `BLADE` ya da `BLUNT` olur; boğma yanlış kişiye denk gelmez.
- Motif hedefe karşı yazılır ve katilin mekân ipucu hedefi gösterir.

**Çözücü**
- Hedefin yeni ifadesi `testimony:intended` ("o kadeh benim içindi" / "o gece benim paltomu giymişti") `MOTIVE`'i kanıtlar, kimseyi elemez.
- Son konuşanın ifadesi bu vakada kurbanın kimseden korkmadığını söyler.
- Hedefin başlangıç korkusu 1'dir; bu hiçbir zaman katili göstermez.

**Pano.** Hedefin ifadesi ile katilin mekân ipucu arasındaki `SUPPORTS` ipi doğru sayılır. Bu motifi doğrular, suçu değil; şüpheli–kanıt ipi değişmez.

**İstem**
- Hedefe: "Ölen sen olacaktın; biri senin peşinde. Korkuyorsun ama kim olduğunu bilmiyorsun."
- Katile: "Asıl hedefin <hedef>'ti; bunu asla söyleme."

**Rapor.** Motif adımında doğru cevap hedefe karşı olan motiftir. Sonuç ekranı asıl hedefi yazar.

**v3 ile bağ.** Psikopat aynı hedefi yeniden deneyebilir. Bu sonraya kalır; şimdilik baskın hedefi oyuncudur.
