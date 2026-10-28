# Tasarım gerekçeleri

CLAUDE.md dosyaları yalnızca kuralları tutar. Bir kuralın neden öyle olduğu, hangi denemede neyin görüldüğü ve ölçüm sonuçları burada durur. Persona ve gece olaylarıyla ilgili gerekçeler `docs/v3-persona-tasarimi.md` (§8–9), hikâye hakemiyle ilgili olanlar `docs/hikaye-hakemi.md` içindedir.

## Vaka üretimi (`backend/src/llm`, `scenarios`)

- **NPC rolleri ve mekân tarifleri Türkçe:** bu metinler senaryo ve NPC istemlerine girer. Pilotta Gemini İngilizce parçaları hikâyeye taşıdı ("all-night noodle restoranı"). `personaPrompt` İngilizce kalabilir, çünkü yalnızca karakterin konuşma tarzını anlatır.
- **Tamamen masum eşler zincir değil, karşılıklı:** zincir kurulduğunda (A'nın eşi B, B'nin eşi C) LLM üç kişiyi tek bir mazerette birleştirdi.
- **Kısmi tanığın gördüğü yer koddan verilir ve `dropWrongSightings`:** bir Gemini denemesinde 8 tanıktan 2'si kişiyi mazeretinde olmayan bir yerde gördüğünü söyledi ("kliniğin arka kapısı").

- **Kış vakası incelemesi (28 Ekim 2026, zor, Şehir Dedektifi):**
  - *Arama izni yazıyla istenmiyor, pencereden seçiliyor.* Yazıyla istekte "Madeni aramak için izin isitiyorum", "Madeni aramam için arama izni ver" ve "Maden ocağını" tanınmadı. Kod mekânın tam adını ("Terk Edilmiş Maden") ya da sahibinin adını arıyordu. Karar verilmeyince Bjorn, kalan hak 1/2 iken iki kez "hakkın bitti" diye uydurdu.
  - *İzin veremeyenler izni vereni söylüyor.* Kenneth "izni Einar'dan al" dedi. Einar ise "dilediğin gibi didikleyebilirsin" dedi ama hiçbir izin çıkmadı.
  - *Eşik altında söylenen sır kaydediliyor.* Bjorn korkusu 7/8'deyken itiraf cümlesini kelimesi kelimesine söyledi. Torstein kırılmadan örtü hikâyesinin tamamını anlattı. İkisi de deftere düşmedi, oyuncu duyduğu şeyi kanıt olarak kullanamadı. İstem "kırılana kadar sakla" dese de Gemini baskı altında sızdırıyor; bu yüzden kod cevabı sırla karşılaştırıyor.
  - *Olay yeri izi silahı anlatmamalı.* "Karın içine saplanmış ok ucu" izi, kurban kayışla boğulmuşken oyuncuyu "yayla öldürülmüş" sanmaya götürdü. İz metni değişti; anlatıcıya izin yarayı açan şey olmadığı söyleniyor.
  - *Tanık baskıyla ayrıntı eklemiyor.* "KONUŞ!" denince Einar, figürün "ipi ya da kirişi topladığını" uydurdu.
  - *Muhbir aynı yeri tekrar söylemiyor.* Üç kullanımda üçü de aynı mekândı (yaklaşık %3 ihtimal).
  - *Gemini denemesi (29 Ekim 2026, iki Kış/zor vakası):*
    - İzin: Bjorn yazıyla istenen izni reddetmedi, resmî talebe yönlendirdi ve kalan hakkı doğru söyledi (2/2). Pencereden istenen izni verdi. Torstein ve Einar izni kimin verdiğini doğru söyledi.
    - Tanık: Einar tanıklığını anlattı, "KONUŞ!" ve tehdit karşısında yeni ayrıntı eklemedi.
    - Olay yeri: anlatıcı yarayı ve yerdeki ok ucunu ayrı anlattı.
    - Silahı veren: Bjorn korkusu 7/8'deyken sırrını yine söyledi; bu sefer itiraf olarak kaydedildi.
    - Katil: Durn, korkusu 2/7'deyken ilk soruda örtü hikâyesini "borç" kısmıyla birlikte söyledi. Kayıt koduyla bu itiraf olarak kaydedildi; bu da ilk soruda itirafı düşenin katil olduğunu ele verirdi. Bu yüzden katilde kayıt kaldırıldı; katil kırılana kadar istemde yalnızca yer ve iş kısmını görüyor. Gemini örtü hikâyesini iki vakada da tek cümle yazdı (noktalı virgül ve virgülle). Senaryo istemi artık iki cümle istiyor; tek cümle gelirse ilk noktalı virgülden ya da virgülden bölünüyor. İkinci vakada katil Kenneth üç soruda da sırrını söylemedi.

## Yetenekler (`backend/src/abilities`)

- **Muhbir vaka bilgisine bakmaz:** doğrulayan kanıt sık sık katilin kendi mekânında durur; vaka bilgisine bakarak yer seçseydi katili gösterirdi. Bu yüzden aranmamış mekânlardan rastgele birini söyler.
- **Çelişki Taraması ölçümü (27 Ekim 2026, `npm run abilities:scan-eval`):** deneme setine yerleştirilen 5 çelişkinin 5'ini yakaladı. Yerel veritabanındaki gerçek konuşmalarda bulguların yaklaşık yarısı gerçek çelişkiydi. Katiller masumlardan daha sık işaretlenmedi (%13'e karşı %29; masumlarda çoğunlukla "önce inkâr, sonra itiraf"), yani tarama katili göstermiyor.

## Arayüz (`frontend`)

- **`backdrop-filter` yok:** menünün arka planı kayıyor, 3B karakter oynuyor; her bulanık panel her karede yeniden hesaplanıyordu. Paneller artık daha opak bir arka plan kullanıyor.
- **Kor parçacıkları:** canvas `shadowBlur` yerine önceden çizilmiş bir parıltı görseli kullanılıyor; kare başına yaklaşık 3 kat daha ucuz.
- **Yetenek çipleri masaüstünde sağ altta:** alt ortadayken mekân etiketlerini (Ashenmoor'da çiftlik), sağ üstteyken mezarlığı örtüyordu.
