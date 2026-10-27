# Tasarım gerekçeleri

CLAUDE.md dosyaları yalnızca kuralları tutar. Bir kuralın neden öyle olduğu, hangi denemede neyin görüldüğü ve ölçüm sonuçları burada durur. Persona ve gece olaylarıyla ilgili gerekçeler `docs/v3-persona-tasarimi.md` (§8–9), hikâye hakemiyle ilgili olanlar `docs/hikaye-hakemi.md` içindedir.

## Vaka üretimi (`backend/src/llm`, `scenarios`)

- **NPC rolleri ve mekân tarifleri Türkçe:** bu metinler senaryo ve NPC istemlerine girer. Pilotta Gemini İngilizce parçaları hikâyeye taşıdı ("all-night noodle restoranı"). `personaPrompt` İngilizce kalabilir, çünkü yalnızca karakterin konuşma tarzını anlatır.
- **Tamamen masum eşler zincir değil, karşılıklı:** zincir kurulduğunda (A'nın eşi B, B'nin eşi C) LLM üç kişiyi tek bir mazerette birleştirdi.
- **Kısmi tanığın gördüğü yer koddan verilir ve `dropWrongSightings`:** bir Gemini denemesinde 8 tanıktan 2'si kişiyi mazeretinde olmayan bir yerde gördüğünü söyledi ("kliniğin arka kapısı").

## Yetenekler (`backend/src/abilities`)

- **Muhbir vaka bilgisine bakmaz:** doğrulayan kanıt sık sık katilin kendi mekânında durur; vaka bilgisine bakarak yer seçseydi katili gösterirdi. Bu yüzden aranmamış mekânlardan rastgele birini söyler.
- **Çelişki Taraması ölçümü (27 Ekim 2026, `npm run abilities:scan-eval`):** deneme setine yerleştirilen 5 çelişkinin 5'ini yakaladı. Yerel veritabanındaki gerçek konuşmalarda bulguların yaklaşık yarısı gerçek çelişkiydi. Katiller masumlardan daha sık işaretlenmedi (%13'e karşı %29; masumlarda çoğunlukla "önce inkâr, sonra itiraf"), yani tarama katili göstermiyor.

## Arayüz (`frontend`)

- **`backdrop-filter` yok:** menünün arka planı kayıyor, 3B karakter oynuyor; her bulanık panel her karede yeniden hesaplanıyordu. Paneller artık daha opak bir arka plan kullanıyor.
- **Kor parçacıkları:** canvas `shadowBlur` yerine önceden çizilmiş bir parıltı görseli kullanılıyor; kare başına yaklaşık 3 kat daha ucuz.
- **Yetenek çipleri masaüstünde sağ altta:** alt ortadayken mekân etiketlerini (Ashenmoor'da çiftlik), sağ üstteyken mezarlığı örtüyordu.
