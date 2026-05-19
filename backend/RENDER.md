# Render Deploy Notes

Bu backend Render Web Service olarak deploy edilmeye hazirdir.

Gerekli Render ayarlari:

- `Root Directory`: `backend`
- `Build Command`: `npm ci && npm run render:build`
- `Start Command`: `npm run render:start`
- `Health Check Path`: `/`

Gerekli environment variable'lar:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `MAIL_USER`
- `MAIL_PASS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Notlar:

- Backend zaten `PORT` env variable'ini okuyup `0.0.0.0` uzerinde dinler.
- Repo kokundeki `render.yaml` ile Blueprint uzerinden de import edebilirsin.
- Render HTTPS verir; mobil uygulamada backend URL olarak Render `onrender.com` adresi kullanilmalidir.
