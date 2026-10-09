# Test Ortamı: Neon + Render + Vercel

- **Veritabanı:** Neon (PostgreSQL)
- **Backend:** Render Web Service (`render.yaml`)
- **Frontend:** Vercel (Hobby planı; depo herkese açık olduğu için yeterli)

## 1. Neon

1. Neon'da yeni bir proje aç (bölge: Frankfurt, `aws-eu-central-1`).
2. Connection string'i al. **Pooled olmayan** (adında `-pooler` geçmeyen) adresi kullan,
   çünkü `prisma db push` pooler üzerinden çalışmaz.
3. Adresin sonundaki `&channel_binding=require` kısmını sil, `?sslmode=require` kalsın.

Şema ve NPC'ler Render build'inde otomatik kurulur (`render:build` = generate + db push + seed + build).
Seed `upsert` yaptığı için her deploy'da tekrar çalışması sorun değildir.

## 2. Render

Render panelinde **New → Blueprint** ile repoyu seç; `render.yaml` okunur.
Elle kuracaksan:

- `Root Directory`: `backend`
- `Build Command`: `npm ci && npm run render:build`
- `Start Command`: `npm run render:start`
- `Health Check Path`: `/`

Environment variable'lar:

| Değişken | Değer |
| --- | --- |
| `DATABASE_URL` | Neon adresi |
| `GEMINI_API_KEY` | Gemini anahtarı |
| `JWT_SECRET` | Uzun, rastgele bir metin |
| `MAIL_USER`, `MAIL_PASS` | Gmail adresi ve uygulama şifresi |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin hesabı |
| `FRONTEND_URL` | Vercel adresi (Stripe dönüşü için) |
| `ALLOW_TEST_MODE` | `true` (yalnızca test ortamında) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | İsteğe bağlı; boşsa ödeme simüle edilir |

Notlar:

- Render ücretsiz planı giden SMTP bağlantılarını engelleyebilir. O durumda kayıt e-postası gitmez;
  `ALLOW_TEST_MODE=true` iken doğrulama kodu hata mesajında gösterilir.
- Ücretsiz servis 15 dakika boşta kalınca uyur; ilk istek 30–60 sn sürebilir.
- Mobil uygulamada backend adresi olarak Render `onrender.com` adresi kullanılmalıdır.

## 3. Vercel

1. **Add New… → Project** ile `Inquisitor-dev/inquisitor` deposunu import et.
2. `Root Directory`: `frontend`. Framework (Next.js), build ve install komutları otomatik algılanır.
3. Environment variable: `NEXT_PUBLIC_API_BASE_URL` = Render adresi (ör. `https://the-inquisitor-backend.onrender.com`, sonunda `/` yok).
4. Deploy et. Vercel adresini Render'daki `FRONTEND_URL`'e yazıp kaydet; Render yeniden deploy eder.

`NEXT_PUBLIC_API_BASE_URL` build sırasında koda gömülür; değiştirirsen Vercel'de **Redeploy** gerekir.
Frontend backend'e doğrudan istek atar (CORS açık), Vercel fonksiyonları kullanılmaz; bu yüzden uzun süren
senaryo üretimi zaman aşımına düşmez.

main'e her push canlı adrese, diğer branch'ler ve PR'lar ayrı önizleme adreslerine deploy edilir.
