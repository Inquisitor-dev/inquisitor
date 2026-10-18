# Inquisitor — Dış Agent Hikâye Üretimi İçin NİHAİ PROMPT İSKELETİ

## 1. Giderilen Hata, Çakışma ve Eksikler (Kod Tabanı Düzeltmeleri)

İskelet oluşturulmadan önce kod tabanında tespit edilen ve dış agent üretimini / oyun motoru çalışmasını bozacak olan **5 kritik hata ve çakışma** giderilmiştir:

1. **`modern` Haritası Şüpheli/Zorluk Sıralaması Çakışması Giderildi (`frontend/src/config/npcProfiles.ts`)**:
   - **Sorun**: Backend `modern.ts` içinde `easy` şüphelileri `['tavern', 'church', 'graveyard', 'mill']` iken, Frontend Hüküm (Condemn) ekranında `['tavern', 'farm', 'clinic', 'church']` olarak tanımlanmıştı.
   - **Çözüm**: Tüm 5 evrende zorluk dilimleri standart kanonik sıraya (`easy`: `tavern, church, graveyard, mill` | `medium`: `+ farm` | `hard`: `+ clinic`) hizalandı.
2. **Backend – Frontend Karakter İsim Dili Çakışması Giderildi (`china.ts`, `winter.ts`, `cyberpunk.ts`)**:
   - **Sorun**: Frontend'de `Komutan Zhao`, `Keşiş Huikang`, `Usta Guan`, `Mei Teyze`, `Bilgin Song`, `Kahin Valda`, `Komutan Bjorn`, `Madenci Durn`, `Muhafız Kenneth`, `Memur Kael Voss` olan isimler Backend'de İngilizce unvanlarla (`Durn the Miner`, `Commander Zhao`, `Auntie Mei` vb.) tutuluyordu. Bu durum Türkçe üretilen metinlere İngilizce unvanların sızmasına yol açıyordu.
   - **Çözüm**: Tüm evrenlerdeki NPC isimleri Türkçe kanonik unvanlarıyla birebir eşitlendi.
3. **`medieval` ve `modern` Evrenlerindeki 6 "Ölü (Ulaşılamaz) İpucu" Hatası Giderildi (`backend/src/scenarios/clues-config.ts`)**:
   - **Sorun**: `findAuthenticClues` fonksiyonu `easy` modda `3`, `medium` ve `hard` modda `4` aktif şüpheliyi işaret eden ipuçlarını seçer. Ancak `medieval` (`murekkep_lekesi`, `pazarlik_sikkesi`, `mum_lekesi`) ve `modern` (`seker_ambalaji`, `kedi_kopek_tuyu`, `ucuz_parfum`) içindeki 6 ipucu yalnızca 3'er şüpheliye (`clinic` veya `farm` dahil) bağlandığı için **hiçbir zorluk seviyesinde matematiksel olarak seçilemiyordu (ölü koddu)**.
   - **Çözüm**: Bu 6 ipucunun `associatedNpcIds` listeleri diğer evrenlerdeki gibi 4'er şüpheliye tamamlanarak tüm zorluklarda aktif hale getirildi.
4. **Etiketsiz Tanıklık Yakalayıcı (`sharesTestimony`) Hatası Giderildi (`backend/src/npcs/evidence.ts`)**:
   - **Sorun**: `culpritName` son kelimesini (`.pop()`) aldığı için `"Mei Teyze"`'de `"teyze"`, `"Durn the Miner"`'da `"miner"` kelimesini arıyor; ayrıca `FLAW` (tuzak) tanıklıklarında tanık katili bilmemesine rağmen cevabında katilin adını şart koşuyordu.
   - **Çözüm**: Unvanlar filtrelenerek çekirdek isim eşleşmesi sağlandı ve `FLAW` tanıklıklarında katil adı zorunluluğu kaldırıldı.
5. **Arama İzni (`findRequestedLocations`) 3 Harfli İsim ve Unvan Eksikliği Giderildi (`backend/src/npcs/warrant.ts`)**:
   - **Sorun**: `word.length >= 4` sınırı nedeniyle 3 harfli karakterler (`Ash`, `Mei`) adıyla istendiğinde arama izni verilemiyordu ve yeni evren unvanları (`Komutan`, `Keşiş`, `Kahin`, `Madenci` vb.) unvan filtresinde yoktu.
   - **Çözüm**: Unvan listesi tüm 5 evreni kapsayacak şekilde genişletildi ve isim sınırı `>= 3` yapıldı.

---

## 2. NİHAİ PROMPT İSKELETİ (Dış Agent İçin Kopyala-Yapıştır Master Şablon)

> **Kullanım Rehberi**:
> Dış agent'a (Claude, ChatGPT, Gemini vb.) aşağıdaki **BÖLÜM A (Ana İskelet)** metnini sabit olarak verin ve sonuna **BÖLÜM B'den seçtiğiniz Harita + Zorluk Paketini** ekleyerek istediğiniz adet (ör. 10 adet) vaka üretmesini isteyin.

````markdown
# ROL VE GÖREV TANIMI
Sen karanlık, edebi ve atmosferik bir sorgulama/dedektiflik oyunu olan **Inquisitor**'ün Baş Hikâye Yazarı (Game Master) ve Süreklilik Editörüsün.
Görevin, sana verilen **HARİTA (EVREN) VE ZORLUK PAKETİ** kurallarına %100 sadık kalarak, oyun motorunun veritabanına (`StoryPool` / `GameSession`) doğrudan kaydedilecek JSON dizisi formatında özgün cinayet vakaları üretmektir.

---

# 1. OYUN MOTORU MEKANİKLERİ VE KESİN KURALLAR

Üreteceğin JSON verisi sadece bir hikâye metni değildir; oyun motorundaki **Soruşturma Panosu Hakemi (`board-judge`)**, **Korku ve Yüzleştirme Sistemi (`fear`)**, **Kanıt Defteri (`evidence`)** ve **Mekan Anlatıcısı (`narrator`)** bu JSON alanlarını matematiksel olarak okur. Bu yüzden şu kuralların dışına çıkılması oyunu bozar:

## 1.1. Zorluk Seviyesi ve Aktif Kadro Kısıtı (STRICT CANON)
- **`easy` (Kolay)**: Sadece **4 şüpheli** (`tavern`, `church`, `graveyard`, `mill`) ve **5 mekan** (`crime_scene` + bu 4 mekan) vardır. **`farm` ve `clinic` karakterleri ve mekanları BU VAKADA YOKTUR; metinlerin hiçbir yerinde adları dahi geçemez!**
- **`medium` (Orta)**: Sadece **5 şüpheli** (`tavern`, `church`, `graveyard`, `mill`, `farm`) ve **6 mekan** (`crime_scene` + bu 5 mekan) vardır. **`clinic` karakteri ve mekanı BU VAKADA YOKTUR; metinlerin hiçbir yerinde adı dahi geçemez!**
- **`hard` (Zor)**: Tüm **6 şüpheli** (`tavern`, `church`, `graveyard`, `mill`, `farm`, `clinic`) ve **7 mekan** (`crime_scene` + bu 6 mekan) aktiftir.
- **Kanon Dışı Mekan/Kişi Yasağı**: Aktif listede yer almayan HİÇBİR yeni mekan, dükkan, sokak, mahalle, iş yeri veya yan karakter (kurban hariç) uyduramazsın! Mekanlardan bahsederken SADECE Türkçe kanonik adlarını kullan; parantez içinde İngilizce ad veya ID (`tavern`, `mill` vb.) YAZMA.

## 1.2. Olay Yeri (`crimeSceneId`) ve Cesedin Görünüşü (`crimeSceneBody` & `sceneState`)
- Cinayet, evrenin **5 olay yerinden (`crimeScenes`) seçilen birinde** işlenmiş ve ceset orada bulunmuştur. Olay yeri hiçbir şüphelinin evi veya iş yeri değildir.
- Sorgucu (oyuncu) olay yerine geldiğinde ceset yerde yatmaktadır ve üzeri evrenin sabit örtüsüyle (**`crimeSceneBody`**) örtülüdür.
- **KRİTİK**: Cesedi bulanlar örtmüştür, **KATİL ÖRTMEMİŞTİR!** Asla katilin cesedi bu örtüyle sardığını/gizlediğini yazma ve cesedi asılı, oturur veya ayakta tasvir etme.
- **`sceneState` (`"MESSY"` | `"TIDY"`)**: Olay yerinin görünüşü ipucunun gerçekliğinden bağımsızdır (`MESSY` = dağınık, boğuşma izleri var; `TIDY` = düzenli, boğuşma izi yok, her şey yerli yerinde).
  - `locationClues.crime_scene` cümlesi olay yerinin bu görünüşünü (`MESSY` veya `TIDY`) ve olay yerindeki fiziksel ipucunu anlatmalıdır.
  - `truthReveal` paragrafı olay yerinin neden dağınık veya düzenli göründüğünü hikâyeye yedirmelidir.

## 1.3. Cinayet Tarzı (`murderStyle`) ve Olay Yeri İpucu (`crimeSceneClue`) Matematiği
Olay yeri ipucu tek başına katili buldurmaz; yalnızca şüpheli havuzunu daraltır:

### A) `murderStyle: "HURRIED"` (Panik/Ani Cinayet — Gerçek İz: `authentic: true`)
- Katil panikle olay yerinde **gerçek bir iz** bırakmıştır.
- Harita/Zorluk paketindeki **"GEÇERLİ GERÇEK İPUÇLARI TABLOSU"** içinden katili (`culpritId`) kapsayan bir `poolClueId` seçilir.
- `implicatedNpcIds`: Tabloda o ipucu için belirtilen şüpheli ID listesi (Easy'de 3, Medium'da 4, Hard'da 4 kişi; katil her zaman içindedir).
- `eliminatedNpcIds`: Aktif şüphelilerden `implicatedNpcIds` dışında kalanlar (Easy'de 1, Medium'da 1, Hard'da 2 masum kişi).
- `locationClues.crime_scene`: Seçilen `poolClueText` içindeki nesneyi/izi ve anlamını değiştirmeden, olay yerinin görünüşüyle (`MESSY`/`TIDY`) ve olay yerindeki tam konumuyla birlikte **tek, doğal bir Türkçe cümle** olarak yazılır ("olay yerinde" kelimesini tekrar etme).

### B) `murderStyle: "PLANNED"` (Planlı Cinayet — Tuzak İz: `authentic: false`)
- Katil cinayeti önceden planlamış ve masum şüpheli(ler)i suçlu göstermek için olay yerine **sahte/çalınmış bir eşya veya iz** bırakmıştır.
- `poolClueId: null`, `poolClueText: null`.
- `implicatedNpcIds` ve `eliminatedNpcIds` (Birebir aynı dizidir):
  - `easy` ve `medium` zorlukta: Masumlar (`innocentIds`) arasından seçilen **1 kişi** (`["<framedId>"]`).
  - `hard` zorlukta: Masumlar (`innocentIds`) arasından seçilen **2 kişi** (`["<framedId1>", "<framedId2>"]`).
- `locationClues.crime_scene`: Olay yerinin görünüşüyle (`MESSY`/`TIDY`) birlikte, yalnızca suçlanan bu masum kişi(ler)e ait olabilecek (onların ürettiği, kullandığı veya sahip olduğu) somut bir nesneyi ve olay yerindeki tam konumunu anlatan **tek, doğal bir Türkçe cümle** olarak yazılır.

## 1.4. Doğrulayıcı Kanıt (`verification` & `verificationText`) Kuralları
Olay yerindeki izin gerçek mi (`CORROBORATION`) yoksa tuzak mı (`FLAW`) olduğunu kanıtlayan ikinci kanıttır:

### Durum 1: `murderStyle === "HURRIED"` ise -> `verification.kind = "CORROBORATION"`
İki yerleşim (`placement`) seçeneğinden biri seçilir:
1. **`{ "type": "LOCATION", "locationId": "<culpritId>" }` (Katilin Mekanında Fiziksel Kanıt)**:
   - Katilin kendi mekanındaki ipucu (`locationClues[culpritId]`), normal sır ipucu YERİNE olay yerindeki izle eşleşen fiziksel bir kanıt olmalıdır (ör. aynı malzemenin devamı, lekeli eşya, kırık parçanın eşi).
2. **`{ "type": "TESTIMONY", "npcId": "<witnessInnocentId>" }` (Masum Tanık İfadesi)**:
   - Masumlardan biri (`witnessInnocentId`), katili olay yerindeki izle veya cinayet gecesi olay yeriyle ilişkilendiren somut bir şey görmüştür.
   - Bu masumun `npcPrompts[witnessInnocentId]` metnine ne gördüğü açıkça yazılmalı ve *"Sorgucu olay yerindeki izi veya cinayet gecesini sorduğunda bunu paylaş"* talimatı eklenmelidir.
   - **ÇOK ÖNEMLİ**: Bu durumda `verificationText` cümlesinde **katilin kanonik adı** ve gördüğü somut detaylar açıkça geçmelidir (Oyun motoru kelime kökü ve katil adı eşleşmesi yapmaktadır).

### Durum 2: `murderStyle === "PLANNED"` ise -> `verification.kind = "FLAW"`
Üç yerleşim (`placement`) seçeneğinden biri seçilir (`framed[0]` = `implicatedNpcIds[0]`):
1. **`{ "type": "LOCATION", "locationId": "<framed[0]>" }` (Suçlanan Masumun Mekanında Çalınma İzi)**:
   - `locationClues[framed[0]]` metni, normal sır ipucu YERİNE, olay yerine bırakılan tuzak eşyanın cinayetten kısa süre önce buradan çalındığını/alındığını kanıtlayan fiziksel bir iz olmalıdır (ör. kırık kilit, boş kalan askı/kanca, zorlanmış çekmece).
2. **`{ "type": "TESTIMONY", "npcId": "<framed[0]>" }` (Suçlanan Masumun Kendi Tanıklığı)**:
   - Suçlanan masum (`framed[0]`), olay yerine bırakılan eşyasının cinayetten kısa süre önce kaybolduğunu/çalındığını fark etmiştir. `npcPrompts[framed[0]]` içinde bu belirtilmeli ve eşya sorulduğunda söylemesi istenmelidir.
3. **`{ "type": "TESTIMONY", "npcId": "<otherInnocentId>" }` (Başka Bir Masumun Tanıklığı)**:
   - Suçlanmayan başka bir masum (`otherInnocentId`), cinayetten kısa süre önce bir karaltının `framed[0]`'ın mekanından o eşyayı aldığını görmüştür (ancak yüzünü seçememiştir, katilin kim olduğunu BİLMEZ!). `npcPrompts[otherInnocentId]` içinde bu belirtilmelidir.

## 1.5. Masumların Sırları, Mazeretleri (`alibis`) ve Mekan İpuçları (`locationClues`)
- **Her Masumun Sırrı = Mazereti (`alibis`)**: Her masum şüpheli cinayet saatinde utanç verici, yasa dışı veya gizli bir iş peşindedir. Bu sır onları ilk bakışta şüpheli gösterir AMA itiraf ettiklerinde cinayet saatinde başka yerde olduklarını kanıtlayarak onları temize çıkarır.
- **Masumların Mekan İpuçları (`locationClues[innocentId]`)**:
  - Eğer `verification.placement` o mekana (`LOCATION`) konulmadıysa, masumun mekanındaki ipucu **kesinlikle o masumun kendi sırrının/mazeretinin (`alibis[innocentId]`) fiziksel kanıtı** olmalıdır!
  - **YASAK**: Masum birinin mekanına ASLA kurbanın bir eşyasını, kanı, cinayet silahını veya katili/başka bir NPC'yi işaret eden bir ipucu koyma!
- **Katilin Mekan İpucu (`locationClues[culpritId]`)**:
  - Eğer `verification.placement` katilin mekanında değilse, katilin mekanındaki ipucu cinayetin doğrudan kanıtı değil; **katilin kurbana olan kinini, borcunu, sırrını veya cinayet motivasyonunu** gösteren fiziksel bir nesne olmalıdır.
- **İç Mekan Arama Noktaları (Hotspot) Uyumu**:
  - Her mekanın ipucu (`locationClues[locationId]`), pakette o mekan için belirtilen **[İç Mekan Arama Noktası]** içinde veya hemen yanında bulunan somut bir nesne/iz olarak, **tek bir Türkçe cümleyle** yazılmalıdır.

---

# 2. ALAN BAZLI YAZIM KURALLARI

1. **`scenario` (Türkçe)**:
   - Oyuncuya vaka başında gösterilen karanlık, edebi gizem kancası (3-5 cümle).
   - Cesedin hangi olay yerinde (`crimeScene.label`) bulunduğunu belirtebilir.
   - **KESİN YASAKLAR**: Kurbanın adını ASLA yazma ("kurban", "ceset", "talihsiz beden" de). Olay yerinin dağınık (`MESSY`) veya düzenli (`TIDY`) olduğunu ASLA yazma. Cinayetin panikle mi planlı mı işlendiğini, olay yeri ipucunu veya tuzak olup olmadığını ASLA yazma.
2. **`truthReveal` (Türkçe)**:
   - Oyun sonunda gösterilen **tek, uzun, edebi ve atmosferik bir Türkçe paragraf**.
   - Şunların tamamını çelişkisiz açıklamalıdır: Kurbanın tam adı ve mesleği, katilin kim olduğu ve motivasyonu, cinayetin olay yerinde (`crimeScene.label`) nasıl işlendiği, olay yerinin neden dağınık (`MESSY`) veya düzenli (`TIDY`) göründüğü, olay yeri ipucunun gerçek mi tuzak mı olduğu, `verificationText` kanıtının bunu nasıl doğruladığı ve her bir masumun o gece gerçekte ne sakladığı (`alibis` ve mekan ipuçları).
   - İçinde tek bir İngilizce kelime veya oyun terimi (`tidy`, `messy`, `hurried`, `planned`, `clue` vb.) geçmemelidir.
3. **`victim` (Türkçe)**: `{ "name": "Evrene uygun tam isim", "profession": "Türkçe meslek (aktif şüphelilerin mesleğiyle çakışmayan)" }`.
4. **`verificationText` (Türkçe)**: Doğrulayıcı kanıtı olgu olarak ifade eden **tek bir net Türkçe cümle** (Örn: *"Değirmenci Giles'ın çalışma masasının arkasında, olay yerindeki izle birebir örtüşen taze çamur bulaşmış ağır iş çizmeleri saklanmaktadır."* veya *"Kardeş Aldric, cinayet gecesi İhtiyar Silas'ın ayaklarında çamurlu çizmelerle Köy Kuyusu yönünden koşarak döndüğünü görmüştür."*).
5. **`alibis` (Türkçe)**: Sadece masumların (`innocentIds`) anahtarlarını içeren obje. Katil (`culpritId`) bu objede YER ALMAZ. Her masum için cinayet saatinde nerede olduğunu ve hangi gizli işi yaptığını belirten **tek bir Türkçe cümle**.
6. **`npcPrompts` (İngilizce veya Türkçe)**: Aktif tüm şüphelilerin (`easy`: 4, `medium`: 5, `hard`: 6) anahtarlarını içeren obje. Karakterin adını, mesleğini ve mekanını değiştirmeden; katil için suçu nasıl işlediğini ve nasıl inkar edeceğini, masumlar için gizli mazeretlerini (`alibis`) ve varsa tanıklıklarını (`TESTIMONY`) ikinci tekil şahısla (`"You are..."` / `"Sen..."`) anlatan gizli rol talimatı.
7. **`locationClues` (Türkçe)**: `crime_scene` + aktif tüm şüpheli mekanlarının (`easy`: 5, `medium`: 6, `hard`: 7) anahtarlarını içeren obje. Her biri **tek bir Türkçe cümle** olmalı; somut nesneyi ve mekan içindeki tam fiziksel yeri belirtmelidir.

---

# 3. KESİN JSON ÇIKTI ŞEMASI

Yanıt olarak SADECE geçerli bir JSON dizisi (`[ ... ]`) döndür. Her bir vaka objesi aşağıdaki yapıda olmalıdır (`caseFacts` içindeki `crimeSceneClueText`, `verificationText`, `victim`, `alibis` alanları üst seviyedeki karşılıklarıyla birebir aynı olmalıdır):

```json
[
  {
    "scenarioType": "<medieval | modern | cyberpunk | china | winter>",
    "difficulty": "<easy | medium | hard>",
    "culpritId": "<aktif_supheli_id>",
    "crimeSceneId": "<evren_olay_yeri_id>",
    "scenario": "Karanlık, edebi Türkçe giriş metni (kurban adı ve olay yeri detayı/ipucu içermez)...",
    "truthReveal": "Tüm gerçeği, olay yeri durumunu, doğrulayıcı kanıtı ve tüm masumların sırlarını açıklayan tek uzun Türkçe paragraf...",
    "victim": {
      "name": "Kurbanın Tam Adı",
      "profession": "Kurbanın Mesleği"
    },
    "verificationText": "Doğrulayıcı kanıtı bildiren tek Türkçe cümle.",
    "alibis": {
      "<masum_id_1>": "Masum 1'in cinayet saatindeki gizli işi ve mazereti (tek Türkçe cümle).",
      "<masum_id_2>": "Masum 2'nin cinayet saatindeki gizli işi ve mazereti (tek Türkçe cümle)."
    },
    "npcPrompts": {
      "<supheli_id_1>": "Şüpheli 1 için detaylı gizli rol, sır, mazeret ve varsa tanıklık talimatı...",
      "<supheli_id_2>": "Şüpheli 2 için detaylı gizli rol, sır, mazeret ve varsa tanıklık talimatı..."
    },
    "locationClues": {
      "crime_scene": "Olay yerinin görünüşünü (dağınık/düzenli) ve olay yeri ipucunu tam konumuyla anlatan tek Türkçe cümle.",
      "<supheli_id_1>": "Mekan 1'in iç mekan arama noktasında saklı somut ipucunu anlatan tek Türkçe cümle."
    },
    "caseFacts": {
      "version": 1,
      "culpritId": "<culpritId ile aynı>",
      "innocentIds": ["<masum_id_1>", "<masum_id_2>", "..."],
      "murderStyle": "<HURRIED | PLANNED>",
      "sceneState": "<MESSY | TIDY>",
      "crimeSceneId": "<crimeSceneId ile aynı>",
      "crimeSceneClue": {
        "authentic": true,
        "poolClueId": "<HURRIED ise tablodaki id, PLANNED ise null>",
        "poolClueText": "<HURRIED ise tablodaki sabit metin, PLANNED ise null>",
        "implicatedNpcIds": ["<işaret edilen şüpheli id'leri>"],
        "eliminatedNpcIds": ["<elenen şüpheli id'leri>"]
      },
      "verification": {
        "kind": "<HURRIED ise CORROBORATION, PLANNED ise FLAW>",
        "placement": {
          "type": "<LOCATION veya TESTIMONY>",
          "locationId": "<sadece type LOCATION ise mekan id, değilse bu alanı sil>",
          "npcId": "<sadece type TESTIMONY ise tanık id, değilse bu alanı sil>"
        }
      },
      "crimeSceneClueText": "<locationClues.crime_scene ile birebir aynı>",
      "verificationText": "<üstteki verificationText ile birebir aynı>",
      "victim": {
        "name": "<victim.name ile birebir aynı>",
        "profession": "<victim.profession ile birebir aynı>"
      },
      "alibis": {
        "<masum_id_1>": "<üstteki alibis ile birebir aynı>"
      }
    }
  }
]
```
````

---

## 3. BÖLÜM B: 5 HARİTA × 3 ZORLUK KANONİK VERİ VE İPUCU PAKETLERİ

Dış agent'a yukarıdaki **Ana İskelet** ile birlikte hangi harita ve zorluk için üretim yaptıracaksanız, aşağıdan ilgili haritanın bloğunu ve zorluk tablosunu kopyalayıp promptun sonuna ekleyin:

---

### HARİTA 1: `medieval` — Ashenmoor (Ortaçağ Karanlık Köyü)
- **`scenarioType`**: `"medieval"`
- **`settingLabel`**: `"Ashenmoor"`
- **`worldDescription`**: Karanlık Ortaçağ köyü Ashenmoor.
- **`styleInstruction`**: Grimdark Ortaçağ fantezisi veya tarihsel dedektiflik romanı (Umberto Eco - Gülün Adı) atmosferinde; meşaleler, parşömenler, kilise çanları, çamur, hurafe ve engizisyon korkusu.
- **`crimeSceneBody` (Ceset Örtüsü)**: `"kaba keten bir örtü (a coarse linen sheet)"`
- **Olay Yerleri (`crimeScenes` - Her vakada 1 tanesini seç)**:
  1. `"well"` -> **Köy Kuyusu** *(Ahşap çıkrıklı eski taş köy kuyusunun etrafındaki küçük taş döşeli meydan)*
  2. `"bridge"` -> **Taş Köprü** *(Köyün kenarındaki karanlık nehrin üzerindeki yosun tutmuş taş kemerli köprü)*
  3. `"forest_path"` -> **Orman Patikası** *(Köyün dışındaki karanlık çam ormanından geçen dar, çamurlu patika)*
  4. `"watchtower"` -> **Yıkık Gözcü Kulesi** *(Çatısı çökmüş terk edilmiş taş gözcü kulesinin yıkık zemin katı)*
  5. `"stable"` -> **Terk Edilmiş Ahır** *(Boş bölmeleri ve duvarlarında eski aletler olan terk edilmiş ahşap ahır)*
- **Kanonik Şüpheliler, Mekanlar ve İç Mekan Arama Noktaları**:
  - **[Easy / Medium / Hard Ortak — İlk 4 Şüpheli ve Mekan]**:
    1. `"tavern"` -> Mekan: **Taverna** | Karakter: **Kardeş Aldric** *(50'lerinde tıknaz, kırmızı yüzlü hancı; köy dedikodularını bilir)* | **İç Mekan Arama Noktası**: *Meşe Fıçılar ve Tezgâh Arkası (tezgâh kenarındaki eski meşe bira fıçıları ve varillerin arkasındaki zemin)*
    2. `"church"` -> Mekan: **Kilise** | Karakter: **Peder Malachar** *(Keskin bakışlı, eğitimli ve politik olarak kurnaz köy rahibi — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Gotik Duvar Halısı ve Gizli Duvar Nişi (sağ duvardaki antik dini halı ve arkasındaki taş oyuk)*
    3. `"graveyard"` -> Mekan: **Mezarlık** | Karakter: **İhtiyar Silas** *(Her cenazeyi hatırlayan, tekinsiz ve sıkıştırılınca manikleşen yaşlı mezarcı)* | **İç Mekan Arama Noktası**: *Türbenin Parmaklıklı Demir Kapısı (antik aile anıt mezarının zincirli demir parmaklıklı kapısı ve içi)*
    4. `"mill"` -> Mekan: **Değirmen** | Karakter: **Değirmenci Giles** *(İri yarı, açgözlü, suçu zayıflara atmaya çalışan değirmenci)* | **İç Mekan Arama Noktası**: *Hesap Masası ve Fener (tezgâhın kilitli çekmecesi, defter ve yanındaki un çuvalları)*
  - **[Sadece `medium` ve `hard` Zorlukta Eklenen 5. Şüpheli ve Mekan]**:
    5. `"farm"` -> Mekan: **Çiftlik** | Karakter: **Çiftçi Edmund** *(Yabancılara güvenmeyen, ailesini ve toprağını korumak için gerçeği büken sert çiftçi)* | **İç Mekan Arama Noktası**: *Ahşap Sandık ve Fıçılar (sol taraftaki varillerin yanına bırakılmış kilitli oyma sandık ve saman balyaları)*
  - **[Sadece `hard` Zorlukta Eklenen 6. Şüpheli ve Mekan]**:
    6. `"clinic"` -> Mekan: **Revir** | Karakter: **Doktor Harland** *(Hurafeden çok akla değer veren, mesafeli ve sır saklayan köy hekimi)* | **İç Mekan Arama Noktası**: *Hekim Tezgâhı ve İlaç Şişeleri (havanlar, hassas terazi, tıp defteri ve ecza rafları)*

#### `medieval` — Zorluğa Göre Geçerli Gerçek İpuçları (`murderStyle: "HURRIED"` İçin Zorunlu Tablo)
| Zorluk | `poolClueId` | `poolClueText` | `implicatedNpcIds` (Katil bu listede olmalı!) | `eliminatedNpcIds` |
| :--- | :--- | :--- | :--- | :--- |
| **`easy`** | `camurlu_cizme_izi` | `"Yerde çamurlu, şekli bozulmuş kaba bir çizme izi."` | `["graveyard", "mill", "tavern"]` | `["church"]` |
| **`easy`** | `murekkep_lekesi` | `"Yerde kurumuş birkaç damla siyah mürekkep lekesi."` | `["church", "mill", "tavern"]` | `["graveyard"]` |
| **`easy`** | `kuvvetli_bitki_kokusu` | `"Olay yerinde burna çalınan kuvvetli, ezilmiş yaban otları ve keskin bir bitki kokusu."` | `["tavern", "church", "graveyard"]` | `["mill"]` |
| **`easy`** | `kalin_is_eldiveni_yirtigi` | `"Kurbana yakın bir yerde, kalın deriden kopmuş, yağ bağlamış ufak bir parça."` | `["graveyard", "mill", "tavern"]` | `["church"]` |
| **`easy`** | `mum_lekesi` | `"Yere damlamış, karanlıkta çalışan birine ait olduğu belli olan eritilmiş sarı mum damlaları."` | `["church", "graveyard", "mill"]` | `["tavern"]` |
| **`easy`** | `ic_yagi_mesale` | `"Taşların üzerinde sönmüş bir meşale sapı ve etrafa damlamış, donmuş iç yağı kalıntısı."` | `["church", "tavern", "graveyard"]` | `["mill"]` |
| **`medium`** | `camurlu_cizme_izi` | `"Yerde çamurlu, şekli bozulmuş kaba bir çizme izi."` | `["graveyard", "mill", "farm", "tavern"]` | `["church"]` |
| **`medium`** | `kalin_is_eldiveni_yirtigi` | `"Kurbana yakın bir yerde, kalın deriden kopmuş, yağ bağlamış ufak bir parça."` | `["graveyard", "mill", "farm", "tavern"]` | `["church"]` |
| **`medium`** | `ic_yagi_mesale` | `"Taşların üzerinde sönmüş bir meşale sapı ve etrafa damlamış, donmuş iç yağı kalıntısı."` | `["church", "tavern", "graveyard", "farm"]` | `["mill"]` |
| **`hard`** | `camurlu_cizme_izi` | `"Yerde çamurlu, şekli bozulmuş kaba bir çizme izi."` | `["graveyard", "mill", "farm", "tavern"]` | `["church", "clinic"]` |
| **`hard`** | `murekkep_lekesi` | `"Yerde kurumuş birkaç damla siyah mürekkep lekesi."` | `["church", "clinic", "mill", "tavern"]` | `["graveyard", "farm"]` |
| **`hard`** | `kuvvetli_bitki_kokusu` | `"Olay yerinde burna çalınan kuvvetli, ezilmiş yaban otları ve keskin bir bitki kokusu."` | `["tavern", "church", "graveyard", "clinic"]` | `["mill", "farm"]` |
| **`hard`** | `kalin_is_eldiveni_yirtigi` | `"Kurbana yakın bir yerde, kalın deriden kopmuş, yağ bağlamış ufak bir parça."` | `["graveyard", "mill", "farm", "tavern"]` | `["church", "clinic"]` |
| **`hard`** | `kan_veya_hayvan_lekesi` | `"Yerdeki cinayet kanına karışmış, çok daha önceden kurumuş hayvan veya et lekesi taşıyan ufak bir çaput."` | `["graveyard", "farm", "clinic", "tavern"]` | `["church", "mill"]` |
| **`hard`** | `pazarlik_sikkesi` | `"Cesedin altında yuvarlanmış, üstünde tuhaf diş izleri olan aşınmış bir bakır sikke."` | `["tavern", "mill", "clinic", "farm"]` | `["church", "graveyard"]` |
| **`hard`** | `mum_lekesi` | `"Yere damlamış, karanlıkta çalışan birine ait olduğu belli olan eritilmiş sarı mum damlaları."` | `["church", "clinic", "graveyard", "mill"]` | `["tavern", "farm"]` |
| **`hard`** | `ic_yagi_mesale` | `"Taşların üzerinde sönmüş bir meşale sapı ve etrafa damlamış, donmuş iç yağı kalıntısı."` | `["church", "tavern", "graveyard", "farm"]` | `["mill", "clinic"]` |

---

### HARİTA 2: `modern` — Millfield, Kentucky (1994)
- **`scenarioType`**: `"modern"`
- **`settingLabel`**: `"Millfield, Kentucky (1994)"`
- **`worldDescription`**: 1994 yılında Amerika'nın tekinsiz küçük kasabası Millfield, Kentucky (Twin Peaks / Stephen King atmosferi).
- **`styleInstruction`**: 90'lar true-crime gerilimi ve küçük kasaba gizemi; VHS kasetler, açık hava sineması, ankesörlü telefonlar, telsizler, benzin istasyonu ve güler yüzlerin ardındaki karanlık kasaba sırları.
- **`crimeSceneBody` (Ceset Örtüsü)**: `"düz beyaz bir çarşaf, etrafında numaralı delil işaretleri ve polis bandı (a plain white sheet, with numbered evidence markers and police tape around it)"`
- **Olay Yerleri (`crimeScenes` - Her vakada 1 tanesini seç)**:
  1. `"laundromat"` -> **Çamaşırhane** *(Sıra sıra çamaşır makinelerinin olduğu 24 saat açık küçük çamaşırhane)*
  2. `"bleachers"` -> **Lise Tribünleri** *(Lise Amerikan futbolu sahasının metal tribünlerinin altındaki boşluk)*
  3. `"rail_crossing"` -> **Tren Geçidi** *(Kasabanın kenarındaki kırsal demiryolu geçidi)*
  4. `"lake_dock"` -> **Göl İskelesi** *(Kasaba dışındaki gölde bulunan eski ahşap kayık iskelesi)*
  5. `"drive_in"` -> **Kapanmış Açık Hava Sineması** *(Terk edilmiş açık hava sinemasının geniş otopark alanı)*
- **Kanonik Şüpheliler, Mekanlar ve İç Mekan Arama Noktaları**:
  - **[Easy / Medium / Hard Ortak — İlk 4 Şüpheli ve Mekan]**:
    1. `"tavern"` -> Mekan: **Karakol** | Karakter: **Şerif Dale Cooper** *(Kasabanın sakin otoritesi, kasabayı skandaldan korumaya çalışan şerif — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Dava Dosyaları (masanın üzerinde üst üste yığılmış sarı dosyalar ve kilitli silah dolabı yanı)*
    2. `"church"` -> Mekan: **Hotel** | Karakter: **Gerald** *(Kimin geç saatte arka merdivenden çıktığını bilen nazik otel müdürü)* | **İç Mekan Arama Noktası**: *Anahtar Dolabı (resepsiyon arkasındaki oda numaralı anahtar kancaları ve misafir defteri)*
    3. `"graveyard"` -> Mekan: **Video Oyuncusu** | Karakter: **Randy Kowalski** *(Herkesin gece alışkanlıklarını bilen geveze Pixel Arcade oyun salonu sahibi)* | **İç Mekan Arama Noktası**: *Boncuk Perdeli Arka Oda (salonun en dibindeki depoya açılan boncuk perdeli arka oda)*
    4. `"mill"` -> Mekan: **Lokanta** | Karakter: **Donna Perkins** *(The Maple Cafe & Diner'ın her müşteriyi ve geçen arabaları izleyen garson/sahibi)* | **İç Mekan Arama Noktası**: *Sipariş Fişleri (mutfak penceresindeki askıda sallanan saatli sipariş fişleri ve tezgâh arkası)*
  - **[Sadece `medium` ve `hard` Zorlukta Eklenen 5. Şüpheli ve Mekan]**:
    5. `"farm"` -> Mekan: **Petrol İstasyonu** | Karakter: **Earl Hutchins** *(Gece duran araçların plakalarını ve veresiye defterini tutan yağlı tulumlu pompacı)* | **İç Mekan Arama Noktası**: *Plaka Defteri (tezgâhtaki panoda tutulan araç kayıtları ve arka depo kapısı)*
  - **[Sadece `hard` Zorlukta Eklenen 6. Şüpheli ve Mekan]**:
    6. `"clinic"` -> Mekan: **Bar** | Karakter: **David** *(David's Bar'ın gece kavgalarını ve fısıltılarını dinleyen barmeni)* | **İç Mekan Arama Noktası**: *Arka Depo (kapısı aralık bırakılmış depo odasındaki raflar)*

#### `modern` — Zorluğa Göre Geçerli Gerçek İpuçları (`murderStyle: "HURRIED"` İçin Zorunlu Tablo)
| Zorluk | `poolClueId` | `poolClueText` | `implicatedNpcIds` (Katil bu listede olmalı!) | `eliminatedNpcIds` |
| :--- | :--- | :--- | :--- | :--- |
| **`easy`** | `kahve_lekesi` | `"Yerdeki tozun üzerine sıçramış, karton bardaktan döküldüğü anlaşılan kurumuş kahve lekeleri."` | `["tavern", "church", "mill"]` | `["graveyard"]` |
| **`easy`** | `seker_ambalaji` | `"Yerde buruşturulup atılmış, kasaba bakkalında satılan ucuz bir şekerleme ambalajı."` | `["graveyard", "mill", "church"]` | `["tavern"]` |
| **`easy`** | `kedi_kopek_tuyu` | `"Kurbanın parmaklarına takılmış, kısa ve sert hayvan tüyleri."` | `["tavern", "graveyard", "church"]` | `["mill"]` |
| **`easy`** | `ucuz_parfum` | `"Odaya sinmiş, ter kokusunu bastırmak için bolca sıkılmış ucuz, geniz yakan bir kolonya/parfüm kokusu."` | `["church", "mill", "graveyard"]` | `["tavern"]` |
| **`easy`** | `kaset_seridi` | `"Kurbanın ayakkabısına dolanmış, kopmuş parlak siyah bir kaset şeridi parçası."` | `["graveyard", "tavern", "mill"]` | `["church"]` |
| **`medium`** | `kahve_lekesi` | `"Yerdeki tozun üzerine sıçramış, karton bardaktan döküldüğü anlaşılan kurumuş kahve lekeleri."` | `["tavern", "church", "mill", "farm"]` | `["graveyard"]` |
| **`medium`** | `seker_ambalaji` | `"Yerde buruşturulup atılmış, kasaba bakkalında satılan ucuz bir şekerleme ambalajı."` | `["graveyard", "mill", "farm", "church"]` | `["tavern"]` |
| **`medium`** | `kaset_seridi` | `"Kurbanın ayakkabısına dolanmış, kopmuş parlak siyah bir kaset şeridi parçası."` | `["graveyard", "tavern", "mill", "farm"]` | `["church"]` |
| **`hard`** | `sigara_izmariti` | `"Yerde ezilmiş, yarısına kadar içilmiş ucuz marka bir sigara izmariti."` | `["tavern", "graveyard", "farm", "clinic"]` | `["church", "mill"]` |
| **`hard`** | `kahve_lekesi` | `"Yerdeki tozun üzerine sıçramış, karton bardaktan döküldüğü anlaşılan kurumuş kahve lekeleri."` | `["tavern", "church", "mill", "farm"]` | `["graveyard", "clinic"]` |
| **`hard`** | `motor_yagi_lekesi` | `"Kurbanın ceketine sürtülmüş, zift gibi koyu ve ağır kokan bir motor yağı lekesi."` | `["graveyard", "mill", "farm", "clinic"]` | `["tavern", "church"]` |
| **`hard`** | `seker_ambalaji` | `"Yerde buruşturulup atılmış, kasaba bakkalında satılan ucuz bir şekerleme ambalajı."` | `["graveyard", "mill", "farm", "church"]` | `["tavern", "clinic"]` |
| **`hard`** | `kedi_kopek_tuyu` | `"Kurbanın parmaklarına takılmış, kısa ve sert hayvan tüyleri."` | `["tavern", "graveyard", "clinic", "church"]` | `["mill", "farm"]` |
| **`hard`** | `ucuz_parfum` | `"Odaya sinmiş, ter kokusunu bastırmak için bolca sıkılmış ucuz, geniz yakan bir kolonya/parfüm kokusu."` | `["church", "mill", "clinic", "graveyard"]` | `["tavern", "farm"]` |
| **`hard`** | `kaset_seridi` | `"Kurbanın ayakkabısına dolanmış, kopmuş parlak siyah bir kaset şeridi parçası."` | `["graveyard", "tavern", "mill", "farm"]` | `["church", "clinic"]` |

---

### HARİTA 3: `cyberpunk` — Neon Prime
- **`scenarioType`**: `"cyberpunk"`
- **`settingLabel`**: `"Neon Prime"`
- **`worldDescription`**: Neon ışıklarla aydınlanan distopik siberpunk mega-şehri Neon Prime.
- **`styleInstruction`**: Karanlık tech-noir cyberpunk gerilimi; siber-implantlar, krediler, neon tabelalar, sentetikler, yeraltı klinikleri, veri simsarları ve mega-şirketler.
- **`crimeSceneBody` (Ceset Örtüsü)**: `"holografik polis bariyerinin ardında mühürlü siyah bir ceset torbası (a sealed black body bag, behind a holographic police barrier)"`
- **Olay Yerleri (`crimeScenes` - Her vakada 1 tanesini seç)**:
  1. `"rooftop"` -> **Çatı Katı** *(Neon reklam panoları ve havalandırma üniteleri arasındaki yüksek bir gökdelen çatısı)*
  2. `"metro"` -> **Metro Peronu** *(Boş bir maglev metro istasyonu peronu)*
  3. `"back_alley"` -> **Neon Arka Sokak** *(Çöp konteynerleri ve buhar tüten mazgallarla dolu dar arka sokak)*
  4. `"data_center"` -> **Terk Edilmiş Veri Merkezi** *(Karanlık sunucu kabinleriyle dolu terk edilmiş veri merkezi)*
  5. `"capsule_hotel"` -> **Kapsül Otel Koridoru** *(Uyku kapsülleriyle dizili dar kapsül otel koridoru)*
- **Kanonik Şüpheliler, Mekanlar ve İç Mekan Arama Noktaları**:
  - **[Easy / Medium / Hard Ortak — İlk 4 Şüpheli ve Mekan]**:
    1. `"tavern"` -> Mekan: **Karakol** | Karakter: **Memur Kael Voss** *(Evrak ve bürokrasi altında ezilmiş yorgun nöbetçi masa memuru — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Delil Dolapları (sıra sıra dizilmiş numaralı metal delil dolapları)*
    2. `"church"` -> Mekan: **Lokanta** | Karakter: **Mirel Sato** *(Gece boyu açık erişte lokantası Static Spoon'un her şeyi duyan pratik sahibi)* | **İç Mekan Arama Noktası**: *Arka Köşedeki Masa (yarım bırakılmış kâselerin olduğu arka köşe masa ve mutfak çıkışı yanı)*
    3. `"graveyard"` -> Mekan: **Klinik** | Karakter: **Brakk Coil** *(Yeraltı siber-cerrahı; kimseye güvenmeyen sert klinik hekimi)* | **İç Mekan Arama Noktası**: *Biyolojik Saklama Dolapları (buzlu camların ardında yeşil ışıkta parlayan etiketsiz tüpler ve şişeler)*
    4. `"mill"` -> Mekan: **Tamirhane** | Karakter: **AURA-9** *(Siber-protez ve robotik atölyesini işleten otonom teknisyen android)* | **İç Mekan Arama Noktası**: *Devre Kartı Masası (yarı sökülmüş devre kartları ve hafıza modülleri masası)*
  - **[Sadece `medium` ve `hard` Zorlukta Eklenen 5. Şüpheli ve Mekan]**:
    5. `"farm"` -> Mekan: **Sokak Pazarı** | Karakter: **Ash** *(Gece pazarında hurda teknoloji satan sokak muhbiri)* | **İç Mekan Arama Noktası**: *Ash’in Tezgâhı (kablo yumakları, eski piller ve elden düşme devre kartları tezgâhı)*
  - **[Sadece `hard` Zorlukta Eklenen 6. Şüpheli ve Mekan]**:
    6. `"clinic"` -> Mekan: **Bar** | Karakter: **Vera Nyx** *(Velvet Static karartma barının soğukkanlı ve okunması imkansız barmeni)* | **İç Mekan Arama Noktası**: *Bar Tezgâhının Arkası (ışıklı raflar ve tezgâhın altındaki kilitli çekmeceler)*

#### `cyberpunk` — Zorluğa Göre Geçerli Gerçek İpuçları (`murderStyle: "HURRIED"` İçin Zorunlu Tablo)
| Zorluk | `poolClueId` | `poolClueText` | `implicatedNpcIds` (Katil bu listede olmalı!) | `eliminatedNpcIds` |
| :--- | :--- | :--- | :--- | :--- |
| **`easy`** | `yanik_kablo` | `"Yerde parçalanmış, ucu kararmış ufak bir bakır kablo yığını."` | `["church", "graveyard", "mill"]` | `["tavern"]` |
| **`easy`** | `ucuz_neon_tozu` | `"Kurbanın kıyafetine bulaşmış, alt sokaklarda satılan parlamaya devam eden sentetik neon tozu."` | `["tavern", "church", "graveyard"]` | `["mill"]` |
| **`easy`** | `sentetik_yag` | `"Yere damlamış, mavi renkte parlayan birkaç damla sentetik eklem yağı."` | `["tavern", "graveyard", "mill"]` | `["church"]` |
| **`easy`** | `kimyasal_yanik_izi` | `"Olay yerinde bırakılmış ayak izinin kenarında asidik, yeri eritmiş küçük bir kimyasal kalıntısı."` | `["tavern", "church", "graveyard"]` | `["mill"]` |
| **`easy`** | `kacak_veri_cipi` | `"Yerde ezilmiş, içindeki hafıza birimi çoktan yanmış isimsiz bir veri diski parçası."` | `["church", "graveyard", "mill"]` | `["tavern"]` |
| **`easy`** | `muhur_bandi` | `"Olay yerinin kenarına sürüklenmiş, üzerinde yarım kalmış bir barkod olan parlak bir mühür bandı parçası."` | `["tavern", "graveyard", "mill"]` | `["church"]` |
| **`medium`** | `yanik_kablo` | `"Yerde parçalanmış, ucu kararmış ufak bir bakır kablo yığını."` | `["church", "graveyard", "mill", "farm"]` | `["tavern"]` |
| **`medium`** | `kacak_veri_cipi` | `"Yerde ezilmiş, içindeki hafıza birimi çoktan yanmış isimsiz bir veri diski parçası."` | `["church", "graveyard", "mill", "farm"]` | `["tavern"]` |
| **`medium`** | `muhur_bandi` | `"Olay yerinin kenarına sürüklenmiş, üzerinde yarım kalmış bir barkod olan parlak bir mühür bandı parçası."` | `["tavern", "graveyard", "mill", "farm"]` | `["church"]` |
| **`hard`** | `yanik_kablo` | `"Yerde parçalanmış, ucu kararmış ufak bir bakır kablo yığını."` | `["church", "graveyard", "mill", "farm"]` | `["tavern", "clinic"]` |
| **`hard`** | `ucuz_neon_tozu` | `"Kurbanın kıyafetine bulaşmış, alt sokaklarda satılan parlamaya devam eden sentetik neon tozu."` | `["tavern", "church", "graveyard", "clinic"]` | `["mill", "farm"]` |
| **`hard`** | `sentetik_yag` | `"Yere damlamış, mavi renkte parlayan birkaç damla sentetik eklem yağı."` | `["tavern", "graveyard", "mill", "clinic"]` | `["church", "farm"]` |
| **`hard`** | `enerji_icecegi_kapagi` | `"Köşede yuvarlanmış, şehirde çok tüketilen bir uyarıcı sıvının paslı metal kapağı."` | `["tavern", "church", "farm", "clinic"]` | `["graveyard", "mill"]` |
| **`hard`** | `kimyasal_yanik_izi` | `"Olay yerinde bırakılmış ayak izinin kenarında asidik, yeri eritmiş küçük bir kimyasal kalıntısı."` | `["tavern", "church", "graveyard", "clinic"]` | `["mill", "farm"]` |
| **`hard`** | `kacak_veri_cipi` | `"Yerde ezilmiş, içindeki hafıza birimi çoktan yanmış isimsiz bir veri diski parçası."` | `["church", "graveyard", "mill", "farm"]` | `["tavern", "clinic"]` |
| **`hard`** | `muhur_bandi` | `"Olay yerinin kenarına sürüklenmiş, üzerinde yarım kalmış bir barkod olan parlak bir mühür bandı parçası."` | `["tavern", "graveyard", "mill", "farm"]` | `["church", "clinic"]` |

---

### HARİTA 4: `china` — Jinling (Hanedan Dönemi)
- **`scenarioType`**: `"china"`
- **`settingLabel`**: `"Jinling (Hanedan Dönemi)"`
- **`worldDescription`**: İmparatorluk Hanedanı döneminde antik Çin şehri Jinling; süslü köşkler, çay evleri, bambu koruları ve kadim tapınaklar.
- **`styleInstruction`**: Yargıç Dee (Judge Dee) tarzı tarihsel Çin dedektiflik gizemi ve wuxia gerilimi; saray adabı, çay seremonileri, imparatorluk mühürleri, tütsü, yeşim taşı ve dövüş onuru.
- **`crimeSceneBody` (Ceset Örtüsü)**: `"düz beyaz bir yas örtüsü (a plain white mourning cloth)"`
- **Olay Yerleri (`crimeScenes` - Her vakada 1 tanesini seç)**:
  1. `"market_square"` -> **Pazar Meydanı** *(Ahşap tezgâhlar ve kâğıt fenerlerle dolu merkez pazar meydanı)*
  2. `"canal_bridge"` -> **Kanal Köprüsü** *(Bağlı kayıkların olduğu dar bir kanal üzerindeki kavisli taş köprü)*
  3. `"bamboo_grove"` -> **Bambu Korusu** *(Dar taş patikalı sık bambu korusu)*
  4. `"dye_workshop"` -> **İpek Boyahanesi** *(Boya kazanları ve asılı ipek kumaşlarla dolu ipek boyahanesi avlusu)*
  5. `"lotus_pavilion"` -> **Lotus Köşkü** *(Bir bahçedeki nilüfer göletinin kenarında bulunan küçük ahşap köşk)*
- **Kanonik Şüpheliler, Mekanlar ve İç Mekan Arama Noktaları**:
  - **[Easy / Medium / Hard Ortak — İlk 4 Şüpheli ve Mekan]**:
    1. `"tavern"` -> Mekan: **Çay Evi & Han** | Karakter: **Lin Feng** *(Altın Lotus Çay Evi'nin her bilginin değerini hesaplayan kurnaz sahibi)* | **İç Mekan Arama Noktası**: *Arka Odanın Kapısı (avluya açılan yarı aralık sürgülü kapı ve çay tezgâhı arkasındaki kilitli dolap)*
    2. `"church"` -> Mekan: **Muhafız Karargahı** | Karakter: **Komutan Zhao** *(İmparatorluk onur koduna bağlı, sert garnizon komutanı — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Savaş Haritası Masası (açılmış devriye haritası, balmumu mühürler ve fırça takımı)*
    3. `"graveyard"` -> Mekan: **Kadim Tapınak** | Karakter: **Keşiş Huikang** *(Tütsü kazanlarını ve ata ruhu tabletlerini bekleyen bilge keşiş)* | **İç Mekan Arama Noktası**: *Ata Ruhu Tabletleri (mumlarla çevrili ahşap ruh tabletleri ve bronz tütsü kazanı)*
    4. `"mill"` -> Mekan: **Demirci Ocağı** | Karakter: **Usta Guan** *(Bölgedeki her silahı tanıyan öfkeli ve gür sesli silah demircisi)* | **İç Mekan Arama Noktası**: *Bitmiş Kılıçların Rafı (duvara dizilmiş kılıçlar/bıçaklar rafı ve taş ocak yanı)*
  - **[Sadece `medium` ve `hard` Zorlukta Eklenen 5. Şüpheli ve Mekan]**:
    5. `"farm"` -> Mekan: **Balıkçı İskelesi** | Karakter: **Mei Teyze** *(Nehir kıyısından geçen her şeyi gören ama yabancılara saf görünen yaşlı balıkçı kadın)* | **İç Mekan Arama Noktası**: *Bağlı Kayıklar (iskeleye bağlanmış ahşap kayıklar ve balık sepetleri)*
  - **[Sadece `hard` Zorlukta Eklenen 6. Şüpheli ve Mekan]**:
    6. `"clinic"` -> Mekan: **Şifacı & Baharatçı** | Karakter: **Bilgin Song** *(Yasaklı deneylerini klinik metinlerin ardına gizleyen saray hekimi ve zehir uzmanı)* | **İç Mekan Arama Noktası**: *İlaç Çekmeceleri (duvarı baştan sona kaplayan yüzlerce küçük şifalı ot ve ilaç çekmecesi)*

#### `china` — Zorluğa Göre Geçerli Gerçek İpuçları (`murderStyle: "HURRIED"` İçin Zorunlu Tablo)
| Zorluk | `poolClueId` | `poolClueText` | `implicatedNpcIds` (Katil bu listede olmalı!) | `eliminatedNpcIds` |
| :--- | :--- | :--- | :--- | :--- |
| **`easy`** | `yesim_tasi_parcasi` | `"Yerde kırılmış, üzerinde imparatorluk oymaları bulunan ince bir yeşim taşı parçası."` | `["church", "tavern", "graveyard"]` | `["mill"]` |
| **`easy`** | `demirci_curufu` | `"Yerdeki çamura bulanmış, dövülmüş çelikten kopan küçük siyah demir ve kömür parçacıkları."` | `["mill", "tavern", "church"]` | `["graveyard"]` |
| **`easy`** | `zehirli_toz_sisesi` | `"Taşların arasına saklanmış, tıp bilginlerinin kullandığı küçük porselen bir merhem şişesi."` | `["tavern", "graveyard", "mill"]` | `["church"]` |
| **`easy`** | `ipek_kumas_yirtigi` | `"Kurbanın tırnakları arasına sıkışmış, ejderha işlemeli pahalı kırmızı ipek kumaş parçası."` | `["church", "graveyard", "mill"]` | `["tavern"]` |
| **`easy`** | `muhur_mumu` | `"Yere damlamış, üzerinde resmi bürokrasi mührü izi taşıyan kırmızı balmumu damlaları."` | `["church", "tavern", "mill"]` | `["graveyard"]` |
| **`medium`** | `yesim_tasi_parcasi` | `"Yerde kırılmış, üzerinde imparatorluk oymaları bulunan ince bir yeşim taşı parçası."` | `["church", "tavern", "graveyard", "farm"]` | `["mill"]` |
| **`medium`** | `demirci_curufu` | `"Yerdeki çamura bulanmış, dövülmüş çelikten kopan küçük siyah demir ve kömür parçacıkları."` | `["mill", "tavern", "church", "farm"]` | `["graveyard"]` |
| **`medium`** | `muhur_mumu` | `"Yere damlamış, üzerinde resmi bürokrasi mührü izi taşıyan kırmızı balmumu damlaları."` | `["church", "tavern", "mill", "farm"]` | `["graveyard"]` |
| **`hard`** | `yesim_tasi_parcasi` | `"Yerde kırılmış, üzerinde imparatorluk oymaları bulunan ince bir yeşim taşı parçası."` | `["church", "tavern", "graveyard", "farm"]` | `["mill", "clinic"]` |
| **`hard`** | `demirci_curufu` | `"Yerdeki çamura bulanmış, dövülmüş çelikten kopan küçük siyah demir ve kömür parçacıkları."` | `["mill", "tavern", "church", "farm"]` | `["graveyard", "clinic"]` |
| **`hard`** | `zehirli_toz_sisesi` | `"Taşların arasına saklanmış, tıp bilginlerinin kullandığı küçük porselen bir merhem şişesi."` | `["clinic", "tavern", "graveyard", "mill"]` | `["church", "farm"]` |
| **`hard`** | `nadir_cay_yapraklari` | `"Cesedin yakınına dökülmüş, sadece saray erkanının tükettiği kurutulmuş altın lotus çay yaprakları."` | `["tavern", "church", "clinic", "farm"]` | `["graveyard", "mill"]` |
| **`hard`** | `ipek_kumas_yirtigi` | `"Kurbanın tırnakları arasına sıkışmış, ejderha işlemeli pahalı kırmızı ipek kumaş parçası."` | `["church", "graveyard", "mill", "clinic"]` | `["tavern", "farm"]` |
| **`hard`** | `kokulu_tutsun_kulleri` | `"Kurbanın omzuna dökülmüş, dağ tapınağında yakılan sandal ağacı tütsüsünün taze külü."` | `["graveyard", "mill", "farm", "clinic"]` | `["tavern", "church"]` |
| **`hard`** | `muhur_mumu` | `"Yere damlamış, üzerinde resmi bürokrasi mührü izi taşıyan kırmızı balmumu damlaları."` | `["church", "tavern", "mill", "farm"]` | `["graveyard", "clinic"]` |

---

### HARİTA 5: `winter` — Frosthold (Kuzey Kış Kalesi)
- **`scenarioType`**: `"winter"`
- **`settingLabel`**: `"Frosthold"`
- **`worldDescription`**: Buz uçurumları ve donmuş ormanlarla çevrili, karlar altındaki kuzey kalesi Frosthold.
- **`styleInstruction`**: Dondurucu kuzey hayatta kalma gizemi ve karanlık gotik fantezi; keskin soğuk, kurt postları, ocak ateşleri, kar fırtınası, donmuş izler ve kuşatma paranoyası.
- **`crimeSceneBody` (Ceset Örtüsü)**: `"üzerine kar serpinti düşmüş ağır gri bir kürk battaniye (a heavy grey fur blanket dusted with snow)"`
- **Olay Yerleri (`crimeScenes` - Her vakada 1 tanesini seç)**:
  1. `"frozen_pass"` -> **Donmuş Geçit** *(Buzlu uçurumlar arasındaki rüzgârlı dar dağ geçidi)*
  2. `"frozen_lake"` -> **Buzlu Göl** *(Karanlık çam ağaçlarıyla çevrili donmuş gölün kıyısı)*
  3. `"hunter_hut"` -> **Avcı Kulübesi** *(Surların dışındaki küçük kütük avcı kulübesi)*
  4. `"standing_stones"` -> **Taş Dikitler** *(Karlı bir tepenin üzerindeki kadim dikili taşlar çemberi)*
  5. `"storehouse"` -> **Erzak Ambarı** *(Fıçılar, tahıl çuvalları ve kurutulmuş etlerle dolu ahşap erzak ambarı)*
- **Kanonik Şüpheliler, Mekanlar ve İç Mekan Arama Noktaları**:
  - **[Easy / Medium / Hard Ortak — İlk 4 Şüpheli ve Mekan]**:
    1. `"tavern"` -> Mekan: **Kış Hanı** | Karakter: **Torstein** *(Ocak Ateşi Hanı'nın fırtınadan önce kimin geldiğini bilen sakallı hancısı)* | **İç Mekan Arama Noktası**: *Bira Fıçıları (tezgâhın arkasına istiflenmiş meşe bira fıçıları)*
    2. `"church"` -> Mekan: **Kutsal Yürek Ağacı** | Karakter: **Kahin Valda** *(Kadim ağacın kan kırmızı yapraklarındaki alametleri okuyan gizemli bekçi — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Köklerdeki Adaklar (kutsal ağacın köklerindeki mumlar, kemikler ve küçük adaklar)*
    3. `"graveyard"` -> Mekan: **Gözcü Kalesi** | Karakter: **Komutan Bjorn** *(Kurt postlarına sarınmış, demir disiplinli kale komutanı — Arama İzni Makamı)* | **İç Mekan Arama Noktası**: *Savaş Masası (oyma harita ve üzerinde dizili ahşap nöbet figürleri masası)*
    4. `"mill"` -> Mekan: **Terk Edilmiş Maden** | Karakter: **Madenci Durn** *(Donmuş tünellerde kaçak eşya saklayan kaba ve şüpheci maden ustabaşısı)* | **İç Mekan Arama Noktası**: *Göçmüş Yan Tünel (kayalar ve kırık kirişlerle yarı kapanmış yan tünel ve sandıklar)*
  - **[Sadece `medium` ve `hard` Zorlukta Eklenen 5. Şüpheli ve Mekan]**:
    5. `"farm"` -> Mekan: **Sur** | Karakter: **Einar** *(Yüksek taş sur kapısında dondurucu rüzgârda nöbet tutan keskin gözlü okçu)* | **İç Mekan Arama Noktası**: *Kapı Makarası (ağır sur kapısını açan zincirli makara ve yanındaki sadaklar)*
  - **[Sadece `hard` Zorlukta Eklenen 6. Şüpheli ve Mekan]**:
    6. `"clinic"` -> Mekan: **İnfaz Meydanı** | Karakter: **Muhafız Kenneth** *(Darağacını ve askeri yargı avlusunu yöneten acımasız meydan çavuşu)* | **İç Mekan Arama Noktası**: *Yargı Defteri (yargı kürsüsündeki kalın deri ciltli defter ve demir kafesler yanı)*

#### `winter` — Zorluğa Göre Geçerli Gerçek İpuçları (`murderStyle: "HURRIED"` İçin Zorunlu Tablo)
| Zorluk | `poolClueId` | `poolClueText` | `implicatedNpcIds` (Katil bu listede olmalı!) | `eliminatedNpcIds` |
| :--- | :--- | :--- | :--- | :--- |
| **`easy`** | `baharatli_sicak_sarap_kokusu` | `"Olay yerindeki soğuk havada asılı kalmış, han ocağında kaynatılan karanfilli sıcak şarap kokusu."` | `["tavern", "church", "graveyard"]` | `["mill"]` |
| **`easy`** | `madenci_fitili` | `"Karda çiğnenmiş, ucu yanık kükürt kokan eski bir maden fitili parçası."` | `["mill", "tavern", "church"]` | `["graveyard"]` |
| **`easy`** | `zincir_halkasi` | `"Buzların arasına düşmüş, infaz muhafızlarının prangalarından kopmuş soğuk demir bir halka."` | `["tavern", "graveyard", "mill"]` | `["church"]` |
| **`easy`** | `kirmizi_agac_yapragi` | `"Cesedin avucunda sıkılmış, kutsal yürek ağacına ait kan kırmızı donmuş bir yaprak."` | `["church", "graveyard", "mill"]` | `["tavern"]` |
| **`easy`** | `avci_ok_ucu` | `"Karın içine saplanmış, yivli avcı yaylarına uygun çentikli kemik bir ok ucu."` | `["tavern", "church", "mill"]` | `["graveyard"]` |
| **`medium`** | `baharatli_sicak_sarap_kokusu` | `"Olay yerindeki soğuk havada asılı kalmış, han ocağında kaynatılan karanfilli sıcak şarap kokusu."` | `["tavern", "church", "graveyard", "farm"]` | `["mill"]` |
| **`medium`** | `madenci_fitili` | `"Karda çiğnenmiş, ucu yanık kükürt kokan eski bir maden fitili parçası."` | `["mill", "tavern", "church", "farm"]` | `["graveyard"]` |
| **`medium`** | `avci_ok_ucu` | `"Karın içine saplanmış, yivli avcı yaylarına uygun çentikli kemik bir ok ucu."` | `["farm", "tavern", "church", "mill"]` | `["graveyard"]` |
| **`hard`** | `baharatli_sicak_sarap_kokusu` | `"Olay yerindeki soğuk havada asılı kalmış, han ocağında kaynatılan karanfilli sıcak şarap kokusu."` | `["tavern", "church", "graveyard", "farm"]` | `["mill", "clinic"]` |
| **`hard`** | `madenci_fitili` | `"Karda çiğnenmiş, ucu yanık kükürt kokan eski bir maden fitili parçası."` | `["mill", "tavern", "church", "farm"]` | `["graveyard", "clinic"]` |
| **`hard`** | `zincir_halkasi` | `"Buzların arasına düşmüş, infaz muhafızlarının prangalarından kopmuş soğuk demir bir halka."` | `["clinic", "tavern", "graveyard", "mill"]` | `["church", "farm"]` |
| **`hard`** | `kurt_kurku_kil` | `"Kurbanın ceketine takılmış, kalın gri bir kurt kürkünden dökülmüş sert kıllar."` | `["graveyard", "mill", "farm", "clinic"]` | `["tavern", "church"]` |
| **`hard`** | `kirmizi_agac_yapragi` | `"Cesedin avucunda sıkılmış, kutsal yürek ağacına ait kan kırmızı donmuş bir yaprak."` | `["church", "graveyard", "mill", "clinic"]` | `["tavern", "farm"]` |
| **`hard`** | `donmus_kanli_kar` | `"Ayak izlerinin yanında donmuş, kurbanınkinden farklı birine ait damlamış kan pıhtısı."` | `["tavern", "church", "clinic", "farm"]` | `["graveyard", "mill"]` |
| **`hard`** | `avci_ok_ucu` | `"Karın içine saplanmış, yivli avcı yaylarına uygun çentikli kemik bir ok ucu."` | `["farm", "tavern", "church", "mill"]` | `["graveyard", "clinic"]` |

---

## 4. Dış Agent'a Verilecek Örnek Komut (Prompt Sonuna Eklenecek Görev Satırı)

Yukarıdaki **Bölüm 2 (Ana İskelet)** + **Bölüm 3'ten seçtiğiniz Harita/Zorluk Bloğunu** yapıştırdıktan sonra en alta şu komutu eklemeniz yeterlidir:

```markdown
# ÜRETİM KOMUTU
Yukarıdaki kurallara ve `{{SCENARIO_TYPE}}` haritasının `{{DIFFICULTY}}` zorluk seviyesine uygun olarak **10 adet birbirinden tamamen farklı, özgün cinayet vakası** üret.
- 10 vakanın 6 tanesi `murderStyle: "HURRIED"`, 4 tanesi `murderStyle: "PLANNED"` olsun.
- `sceneState` (`"MESSY"` ve `"TIDY"`) yarı yarıya dağılsın ve cinayet tarzından bağımsız olsun.
- Katil (`culpritId`) ve Olay Yeri (`crimeSceneId`) 10 vaka boyunca tüm aktif şüphelilere ve 5 olay yerine dengeli dağılsın; aynı katil veya olay yeri üst üste tekrar etmesin.
- `verification.placement.type` (`"LOCATION"` ve `"TESTIMONY"`) vakalar arasında dengeli dağılsın.
Sadece geçerli JSON dizisi (`[ ... ]`) döndür.
```
