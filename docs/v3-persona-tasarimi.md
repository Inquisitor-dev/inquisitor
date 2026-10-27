# v3 Tasarımı: Katil Personaları, Kasaba Olayları ve Gece Baskını

Durum: **onaylandı** (27 Ekim 2026, Berke; persona alanı ondan sorumlu). Bu belge `v3_Tasarim_Belgesi_Psikopat_ve_Baskin.pdf`'in yerini alır; PDF'teki "mekân kilitleme" ve sabit gece sırası artık geçerli değil.

## Değişmeyen ilkeler

- **Kod karar verir, çözücü doğrular.** Bütün gece planı vaka başında kodla kurulur ve çözücüden geçer; vaka her olayla birlikte de çözülebilir olmalı.
- **Aksiyon katili ele vermez.** Saldırgan görünmez, bıraktığı her iz katil dahil 2–3 şüpheliye uyar, kasabada herkes olayı duyar.
- **Oyuncunun emeği çalınmaz.** Kaybedilen her şeyin yerine çözücünün onayladığı başka bir yol kalır.
- **Para maliyeti artmaz.** Olay metinleri senaryoyla birlikte (tek çağrı) ya da koddan gelir; baskın tamamen hazır metindir.
- **Kasaba yaşıyor gibi hissettirmeli.** Planlı olaylar önceden sezilir; sürprizler sonradan açıklanır.

## 1. İki katman: kasaba olayları ve katil hamleleri

| | Kasaba olayları | Katil hamleleri |
|---|---|---|
| Örnek | Dükkân sahibi bir günlüğüne şehir dışında, fırtına, panayır | Tehdit mektubu, gece baskını, dükkân kundaklama / kilit kırma |
| Önceden belli mi? | **Evet.** İlgili NPC sorulunca ya da konu açılınca söyler, diğerleri dedikodu olarak bahseder, bir önceki günün gazetesinde yazar | **Hayır.** Sürprizdir |
| Sonradan | Olduğu gibi yaşanır | Gazete yazar, etkilenen NPC ertesi gün ne olduğunu anlatır |
| Kime bağlı? | Personadan bağımsız, her vakada olabilir | Personaya bağlı |

- Planlı olaylar vaka başında seçilir. İlgili NPC'nin istemine baştan bir satır girer, örneğin: "2. gün ailenizi ziyarete gideceksin; sorulursa ya da konu açılırsa söyle." Diğer NPC'lerin istemine "kasabada konuşulanlar" satırı eklenir.
- Kapanan mekân son güne denk gelmez ve vakayı çözen iki bağımsız yoldan birini kesmez; bunu kod kontrol eder.
- Fırtına ve diğer wildcard'lar aynı altyapıya oturur; ayrı belgeyle gelecek.

## 2. Persona altyapısı

- **Dağılım:** Kolayda persona yok. Ortada ve zorda %50 Psikopat, %50 sıradan katil (`NONE`). Yeni personalar geldikçe pay bölünür.
- **Gizlilik:** Oyuncu personayı bilmez; başına gelenlerden tahmin eder. `toPublicSession` personayı hiç döndürmez; olay planı vaka bitene kadar gizlidir.
- **Aksiyon havuzu, sabit sıra yok:** Her personanın bir aksiyon havuzu vardır. Her aksiyonun olabileceği geceler tanımlıdır (ör. tehdit mektubu en geç 2. gece, baskın en erken 2. gece). Vaka başında havuzdan **1–3 aksiyon** çekilir; bazı geceler boş geçer. Böylece ne katil ne de persona her vakada aynı davranır.
- **Son gece hamle yok.** İkinci Nefes vakayı 5. güne uzatırsa ek gece de son gece sayılır.
- **Hikâye havuzu:** Persona ve gece planı hikâyeyle birlikte saklanır; kural sürümü **4** olur. Sürüm 3 hikâyeleri oyuna seçilmez, havuz yeniden üretilir.

### Gece akışı

1. Oyuncu yatağa gidince gün kapanır (`endDay`). Bu adım o gecenin olaylarını işler ve sonucu `GameSession.personaState`'e yazar. Baskın gecesiyse gün kapanmadan baskın başlar.
2. **Her sabah bir gazete gelir**, olay olsun olmasın. İçinde 2–3 kısa haber olur: varsa katilin hamlesi, yaklaşan kasaba olayları, sıradan kasaba haberleri. Gazetenin her gün gelmesi, "gazete gelmedi" bilgisinin kendi başına ipucu olmasını önler.
   - Biçim: Ortaçağ, Çin ve Kış'ta parşömen ilan; modernde gazete kupürü; cyberpunk'ta tablet ekranı. Hepsi CSS ile yapılır, görsel gerekmez.
3. Olay, deftere o günün sayfasına **olay kartı** olarak düşer.
4. **Herkes duyar:** Olay `publicCaseFacts`'e bir satır olarak eklenir; böylece katilin olaydan haberdar olması onu ayırmaz. Katilin istemine "dün gece bunu sen yaptın; sen açmadıkça söz etme" satırı eklenir.

## 3. Psikopat

Dedektife takıntılı bir katil. Aksiyon havuzu:

| Aksiyon | Olabileceği geceler | Etkisi | Katili ele vermemek için |
|---|---|---|---|
| Tehdit mektubu | 1–2 | Gerilim; mektuptaki iz (mürekkep, koku, kâğıt) bonus kanıttır. Mektup bir sonraki hamleyi ima edebilir. | İz katil dahil 2–3 şüpheliye uyar |
| Dükkân kundaklama / kilit kırma | 1–2 | Bir mekân ertesi gün kapalıdır. Gazete yazar, sahibi ertesi gün ne olduğunu anlatır. | Mekân rastgele seçilir, katilinki de olabilir; son güne denk gelmez, iki bağımsız yoldan birini kesmez |
| Gece baskını | 2–3 | Bkz. bölüm 4 | Saldırgan görünmez, iz birkaç kişiye uyar |

- **Mektup metni:** Gemini vaka başında senaryoyla birlikte yazar. Korkutucu ve tehditkâr olur, ama küfür, ağır hakaret ya da açık şiddet tasviri içermez. Kod yasaklı kelimeleri tarar; geçemezse koddan hazır metin kullanılır.
- **Hırsızlık** ayrı bir gece değildir; yalnızca baskının kötü sonucudur.
- **Yeni kanıt türleri:** `LETTER` ve `RAID_TRACE`. Pano ve çözücü bunları eşkâl tanığı gibi yargılar (uyduğu herkesi gösterir). Bunlar bonus izdir; Hüküm Dosyası'nda **dayanak kanıt sayılmaz**.

## 4. Gece baskını

Baskın gecesi oyuncu yatağa gidince sabaha geçmeden bir sahne açılır. Ekranda o anki oda, karanlık bir ışık, anlatıcının metni ve 3–5 aksiyon düğmesi vardır. Kod küçük bir durum tutar, her aksiyon durumu değiştirir ve sonucu durumdan kod hesaplar. Gemini çağrılmaz; metinlerin hepsi hazırdır (5 evren, her birinde yaklaşık 40 kısa metin).

- **Odalar:** yatak odası (başlangıç), mutfak, koridor, kapı önü.
- **Durum:** oyuncunun odası, ışık (karanlık / lamba), elindeki (hiçbir şey / bıçak / tabanca), ses (0–3), saldırganın odası ve hâli, tur (en çok 6 aksiyon; süre dolunca saldırgan sessizce gider).
- **Aksiyonlar:**
  - Her odada: başka odaya geç, dinle, seslen, saklan.
  - Yatak odası: lambayı yak, pencereden bak.
  - Mutfak: bıçak al, arka kapıyı kilitle.
  - Kapı önü: karanlığa bak, peşinden git.
- **Saldırganın davranışı:** Başlangıç odası vaka başında seçilir. Ses 2'yi geçerse oyuncuya doğru gelir. Işık açıksa ve oyuncu silahlıysa kaçar. Karanlıkta silahsız oyuncu onun odasına girerse saldırır. Kötü sonuca giden her yolun önünde bir uyarı vardır ("kapının arkasından bir nefes sesi…").
- **Karakter dalları:** Mavi Rozet "silahını çek" seçeneğini alır. Kar Kâhini saldırganın hangi odada olduğunu rüyasında önceden görür.

| Sonuç | Nasıl olur? | Ne olur? |
|---|---|---|
| İyi | Işık açıkken silahla karşılaşmak ya da dinleyip doğru anda seslenmek | Saldırgan kaçar; kapı önünde katil dahil 2–3 şüpheliye uyan bir iz bırakır. İz deftere ve panoya düşer |
| Nötr | Saklanmak ya da süre dolana kadar ses çıkarmamak | Saldırgan gider |
| Kötü | Karanlıkta silahsız onun odasına girmek ya da uyarıyı görmezden gelmek | Bayılırsın: ertesi sabahın ilk dilimini kaybedersin, bu vakanın ödülünden %20 kesilir (akçe bakiyesine dokunulmaz), çözücünün onayladığı bir kanıt çalınır |
| Ölüm | Yalnızca zorda: iki kötü seçim üst üste ve görmezden gelinen iki uyarı | Vaka kaybedilir |

- **Çalınan kanıt:** Yalnızca çıkarıldığında vaka hâlâ çözülebiliyorsa çalınır. Defterdeki kaydı "çalındı" damgasıyla kalır, ama artık gösterilemez ve panoya iğnelenemez.
- **Çatı Geçişi gecesi:** Oyuncu evde olmadığı için baskın olmaz. Eve dönünce evi aranmış bulur: ödülden %10 kesilir, kanıt çalınmaz (kanıtlar oyuncunun üstündedir), gazete yazar.
- **Baskın yarıda kalırsa:** Baskın bitmeden ertesi gün başlamaz; oyuncu sahneden çıkarsa kaldığı yerden devam eder.

## 5. Nezaret

Oyuncu oyun boyunca **bir kez** bir şüpheliyi bir geceliğine nezarete aldırabilir.

- Nezarete alınan katilse o gece hamle yapamaz; hamle iptal olmaz, sonraki uygun geceye kayar. Masumsa o gecenin kasaba olayına katılamaz.
- Kişinin mekânı günün kalanında kapanır, oyuncu oraya giremez. Ertesi sabah kişi çıkar ve mekânını açar. Ertesi gün oyuncuya kırgındır: korkusu bir artar ama soğuk davranır.
- Son gün kullanılamaz. Kasaba olayı duyar ve gazete yazar.
- **Turnusol sorunu ve hafifletmeleri:** O gece bir olay olursa nezaretteki kişi kesinlikle masumdur; olmazsa şüphe artar. Bunu şunlar yumuşatır:
  - Personanın gizli olması: vakaların yarısında gece olayı hiç yoktur, kolayda hiç yoktur.
  - Değişken aksiyon sayısı (1–3) ve boş geceler.
  - Her sabah gelen gazete.
  - Ertelenen hamle.
- Nezaret diyalog ekranından verilir ("Nezarete Al", onaylı). Persona altyapısından **sonra** eklendi. Masumların kendi eylemleri ("kaçma", "dükkân kapatma") geldikçe anlam kazanır.

## 6. Görseller

Her evren için aynı evin dört odası üretilir: yeni yatak/çalışma odası, mutfak, koridor, kapı önü. Toplam **20 görsel**; istemleri `docs/ev-odalari-gorselleri.md`'de. Yeni yatak odası bugünkü ev ekranının yerini alır.

Hepsi gündüz ışığında üretilir; gece etkisi CSS ile verilir. Mektup ve gazete için görsel gerekmez. Görseller beklenmez: motor ve baskın, bugünkü ev görseli yer tutucu olarak kullanılarak oynanabilir.

## 7. Uygulama sırası

| Sıra | İş | Görsel gerekir mi? |
|---|---|---|
| 1 ✓ | Persona altyapısı: plan alanları, aksiyon havuzu ve gece pencereleri, gece olaylarının işlenmesi, sabah gazetesi, olay kartı, `publicCaseFacts` satırı | Hayır |
| 2 ✓ | Kasaba olayları (planlı kapanış ve önceden sezdirme) ve Psikopatın mektubu ile kundaklaması | Hayır |
| 3 ✓ | Baskın motoru (saf durum makinesi, `raid-engine.ts`) ve `POST /game-sessions/:id/raid/act`; bütün yolların testleri | Hayır |
| 4 ✓ | Baskın sahnesi, yer tutucu odalarla | Hayır |
| 5 ✓ | Karakter dalları (Mavi Rozet, Kar Kâhini) ve Çatı Geçişi kuralı | Hayır |
| 6 ✓ | Nezaret | Hayır |
| 7 ✓ | Görseller gelince gerçek odalar ve evin yeni yerleşimi | Evet |
| 8 ✓ | Gemini ile oyun denemeleri; hikâye havuzu kural sürümü 4 | Hayır |

## 8. Gemini denemesi (28 Ekim 2026)

Zor bir kış vakası (Psikopat, 2. gece mektup) gerçek Gemini ile dört gün oynandı. Kundaklamayı ve baskını da aynı vakada görmek için yerel veritabanındaki plana 1. gece kundaklama ve 3. gece baskın eklendi. Bulunan ve düzeltilenler:

- "Kasabada ne konuşuluyor?" sorusuna şüpheliler yalnızca gazetenin sıradan haberini anlatıp "başka büyük bir laf yok" dedi; cinayeti ve gecenin kundaklamasını anmadı. Artık sıradan haber "küçük bir konu" olarak verilir, önce cinayet ve gece olayları anlatılır; kundaklama da mektup ve baskın gibi "bütün kasaba duydu" diye yazılır.
- Gece satırları gün numarası veriyordu ("In the night after day 2"); hancı "ikinci günün gecesinde" diye sayaç diliyle konuştu. Artık göreli: "dün gece", "iki gece önce", "birkaç gece önce".
- Hancı kasaba haberlerini anlatınca duyulmamış tanıklığı deftere düştü: "Donmuş Geçit", "gecenin bir yarısı", "birinin", "dolaşıyor" tanıklıkla 4 kök paylaşıyordu. Her konuşmada geçen genel kökler (`COMMON_STEMS`, `npcs/evidence.ts`) artık sayılmaz.
- Kundaklama metinleri mekân adına ek ve "kapısı" getiriyordu ("Sur gece kırıldı", "Kutsal Yürek Ağacı kapısı"). Gazete, olay kartı ve kapanış mesajı artık "Mekân: gece zorla girildi" biçiminde, her adla çalışır.
- Kış gazetesi mektubun kapıya "çivilendiğini" ve "kulübe kapısını" yazıyordu; olay kartı ve istemler "kapının altına bırakıldı" diyor. Çin ve kış gazeteleri de artık öyle.
- Mektup kış evreninde "dedektif" diye hitap etti ve "stop digging"i "bu kazı işi" diye çevirdi; şüpheliler de oyuncuya kimi "müfettiş", kimi "dedektif" dedi. Mektup istemi ve NPC istemi artık evrenin unvanını verir (`newspaperTextsFor(...).investigator`).
- Baskında ışık yanarken saldırganla silahsız karşılaşınca metin "Karanlıkta biri üstüne atılıyor" diyordu; boğuşma ve bayılma metinleri artık ışıktan bağımsız.
- Baskın sahnesi: kısa ekranda eylem paneli oda başlığının üstüne biniyordu (artık akışta, gerekirse sayfa kayar); kapı önünde lamba yanınca bütün sokak gündüz gibi aydınlanıyordu (dışarıda gece örtüsü koyu kalır).

Doğru çalışanlar: mektup izi kod havuzundan ve üç şüpheliye uyuyor; katil gece olaylarını kendiliğinden açmıyor; nezarete alınan ertesi gün kırgın; gazete baskını ve nezareti yazıyor; kapanan mekânla konuşma engelleniyor. Hikâye havuzu kural sürümü 4 zaten etkin.
