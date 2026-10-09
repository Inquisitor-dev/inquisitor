# ⚖️ THE INQUISITOR — Oyun Rehberi & Konsept Özeti

> *"Listen. Analyze. Condemn." (Dinle. Analiz Et. Hüküm Ver.)*

---

## 🎯 1. Oyunun Amacı ve Vizyonu

**The Inquisitor**, oyuncunun mutlak yetkili bir sorgulayıcı/engizitör rolünü üstlendiği, **Büyük Dil Modelleri (LLM)** ile çalışan dinamik bir psikolojik dedektiflik simülasyonudur.

Klasik dedektiflik oyunlarındaki sabit diyalog ağaçlarının aksine; her oturumda arka planda bağımsız bir cinayet vakası, katil, alibiler ve deliller **algoritmik olarak kurgulanır**. Yapay zeka ajanları (NPC'ler), kendi hafızalarına, gizli korku seviyelerine ve yalan söyleme eğilimlerine göre oyuncuyla doğal dilde canlı olarak konuşur.

* **Nihai Hedef:** 4 gün (zaman kısıtı) içerisinde mekanları gezmek, şüphelileri çapraz sorguya çekmek, arama izinleriyle delil toplamak ve doğru katili teşhis ederek **Nihai Hükmü (Condemn)** vermektir.

---

## 🌌 2. Beş Farklı Evren (Temalar & Atmosfer)

Oyun, oyuncuya aynı derin mekanikleri 5 farklı tematik atmosferde deneyimleme şansı sunar:

| Evren | Dönem / Atmosfer | Karakteristik Mekanlar | Örnek Karakterler |
|---|---|---|---|
| **Ashenmoor** | Klasik Ortaçağ / Karanlık Engizisyon | Kilise, Taverna, Mezarlık, Su Değirmeni, Çiftlik, Klinik | Kardeş Aldric, Peder Malachar, Değirmenci Giles |
| **Oakhaven / Millfield** | 90'lar Amerikan Kasabası (Retro Gizem) | Şerif Ofisi, Retro Diner, Motel, Benzinlik, Kereste Fabrikası | Şerif Cooper, Gerald, Donna Perkins, Randy |
| **Neon Prime** | Cyberpunk / Distopya | Polis İstasyonu, Sibernetik Klinik, Neon Bar, Veri Arşivi | Officer Voss, Mirel Sato, Brakk Coil, AURA-9 |
| **Jinling** | Kadim Doğu Hanedanlığı | Tapınak, Çay Evi, İpek Atölyesi, Eczane, Muhafız Kışlası | Bilgin Song, Lin Feng, Komutan Zhao, Mei Teyze |
| **Frosthold** | Buzul Kuzey Kalesi (Norse / Viking) | Büyük Salon, Demirhane, Maden Girişi, Şifacı Çadırı | Torstein, Kahin Valda, Komutan Bjorn, Madenci Durn |

---

## 🕹️ 3. Temel Oynanış Döngüsü (Core Gameplay Loop)

```
[Cinayet Mahalli İncelemesi] ──> [Haritada Gezinme & Mekan Keşfi (360°)]
                │                                    │
                ▼                                    ▼
[Kanıt Yüzleştirme / Korkutma] <── [Serbest Doğal Dil LLM Sorgusu]
                │                                    │
                ▼                                    ▼
[Arama İzni ile Mekan Taraması] ──> [Gece Dinlenme (Ev)] ──> [Nihai Hüküm (Condemn)]
```

### 1. 🗺️ İnteraktif Harita & Yol Ağı (A* Pathfinding)
* Oyuncu 2.5D sprite avatarı ile harita üzerindeki yolları kullanarak mekanlar arasında yürür.
* Gerçek zamanlı yol bulma (A* algoritması), akıcı kamera takibi ve mekan üzerine gelindiğinde şüpheli avatar önizlemeleri sunulur.

### 2. 🚪 360° Panoramik Mekan Keşfi (Interior Viewer)
* Mekana girildiğinde oyuncuyu 360° panoramik birinci şahıs (First-Person) oda görüntüsü karşılar.
* Fareyle sürükleyerek oda incelenir; etkileşimli nesneler (hotspotlar), gizli ipuçları ve odadaki NPC ile doğrudan temas kurulur.

### 3. 💬 Doğal Dilde Serbest Sorgu (LLM Destekli NPC'ler)
* Önceden tanımlı butonlar yerine metin kutusuna **istediğiniz soruyu yazarak** şüpheliyi sorgulayabilirsiniz.
* Karakterler geçmiş konuşmaları hatırlar, baskı altında tutarsız ifadeler verebilir veya konuyu saptırmaya çalışabilir.

### 4. 😨 Korku & Psikolojik Çözülme Sistemi (Fear System)
* Her şüphelinin 0 ile 10 arasında bir **Korku/Stres Seviyesi** vardır (`Sakin` → `Tedirgin` → `Gergin` → `Panik`).
* Kanıt gösterildiğinde veya yalanları yüzüne vurulduğunda korku puanı artar.
* **Kritik Eşik (7+):** Masum bir şüpheli köşeye sıkıştığında dayanamayıp bildiklerini veya itirafını döker. **Gerçek katil ise asla itiraf etmez;** sadece aşırı panikler ve savunmaya geçer!

### 5. 📜 Arama İzinleri (Search Warrants) & Kanıtlar
* Şüphelinin mekanını izinsiz arayamazsınız. Diyalogda ikna ederek veya baskı kurarak arama izni almanız gerekir.
* İzin alındığında mekanda **Arama Modu** açılır ve fiziksel kanıtlar (bıçak, zehir şişesi, mektup vb.) envantere eklenir.

### 6. ⏳ Zaman Sistemi & Gün Döngüsü
* Gün 5 vakitten oluşur: *Sabah, Öğle, İkindi, Akşam, Gece*.
* Her gün için belirli bir soru/sorgu kotası bulunur. Gece vakti geldiğinde sokaklar tekinsizleşir ve oyuncu uyumak için evine dönmelidir.

### 7. 🏠 Engizitörün Evi (Player Home)
* Oyuncunun kişisel güvenli alanıdır.
* **Çalışma Masası:** Toplanan notlar ve vaka özeti.
* **Sandık:** Toplanan fiziksel kanıt envanteri.
* **Yatak:** Günü bitirip bir sonraki güne geçme.
* **Gardırop:** Kostüm, maske ve cüppe yönetimi.

---

## ⚖️ 4. Vaka Mantığı ve Hüküm Verme (Condemnation)

Oyunun dedektiflik mantığı yapay zekanın rastgele uydurmasına bırakılmaz, arka planda matematiksel bir vaka kuralları çerçevesinde işletilir:

* **Cinayet Kurgusu:** Cinayet iki tarzda işlenir: *Aceleyle (Hurried - gerçek ipucu bırakılır)* veya *Planlı (Planned - sahte ipucu yerleştirilir)*.
* **Eleme Bütçesi:** Cinayet mahallindeki ilk delil, zorluk seviyesine göre şüphelilerin bir kısmını doğrudan temize çıkarır.
* **Doğrulama / Kusur (Corroboration & Flaw):** Bir şüphelinin alibisini çürüten fiziksel bir delil veya bir tanığın ifadesi mutlaka dünyada gizlidir.
* **Hüküm Ekranı:** 4. gün dolmadan oyuncu mahkemeyi kurar ve katil olduğunu düşündüğü kişiyi ölüme mahkum eder.
  * **Doğru Hüküm:** Vaka çözülür, tüm gizli gerçekler dökülür ve Token ödülü kazanılır.
  * **Yanlış Hüküm:** Masum biri asılır, gerçek katil kaçar ve soruşturma başarısızlıkla biter.

---

## 💰 5. Token Ekonomisi & Pazar Yeri

* **Oyna-Kazan:** Çözülen her başarılı vaka için **+100 Token**, ilk 2 günde hızlı çözüm için ekstra **+50 Bonus Token** verilir.
* **Pazar Yeri (Market):**
  * **Yeni Evrenler:** Oakhaven, Neon Prime, Jinling, Frosthold kilitleri.
  * **Zorluk Seviyeleri:** Kıdemli Engizitör (Orta), Baş Engizitör (Zor - 6 şüpheli, çakışan alibiler).
  * **Kozmetikler:** Özel engizitör cüppeleri, veba doktoru maskeleri, mühürler.

---

## 🛠️ 6. Teknik Mimari

```
inquisitor/
├── backend/    # NestJS 11 + Prisma ORM + PostgreSQL (REST API & LLM Controller)
├── frontend/   # Next.js 16 (App Router) + Zustand + SCSS Modules (Web İstemcisi)
└── mobile/     # Expo 54 / React Native (Mobil İstemci)
```

* **Yapay Zeka Servisi:** Google Gemini modelleri (OpenAI uyumlu SDK köprüsü üzerinden). Model düşme/hata durumunda otomatik zincirleme yedek model mimarisi.
* **Prompt Kalkanı (Prompt Guard):** Kullanıcının karakter dışına çıkmasını ve yapay zekayı hacklemesini (prompt injection) karakter içi cevaplarla engelleyen güvenlik katmanı.
* **Durum Yönetimi:** Zustand (kalıcı oturum, envanter, harita ve diyalog senkronizasyonu).
* **Ses & Atmosfer:** Howler.js ile evrene özel dinamik ortam sesleri ve adım efektleri.

---

## 🚀 7. Hızlı Başlangıç (Geliştirici)

```bash
# 1. Veritabanını Başlatın (Docker)
docker compose up -d

# 2. Backend'i Çalıştırın (Port 3001)
cd backend
npm run prisma:push
npm run start:dev

# 3. Frontend'i Çalıştırın (Port 3000)
cd frontend
npm run dev
```

Tarayıcınızdan `http://localhost:3000` adresine giderek engizisyon masasına oturabilirsiniz!
