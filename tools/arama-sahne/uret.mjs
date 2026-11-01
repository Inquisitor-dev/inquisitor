// Gemini API ile görsel üretir. Kullanım: node uret.mjs istemler/<ad>.txt [istemler/<ad2>.txt ...]
// Her istem için kaynak/<ad>.png kaydeder (kes.py .png ve .webp okur). Anahtar GEMINI_API_KEY ortam
// değişkeninden, yoksa backend/.env'den okunur; oyunun kotasını harcamamak için ayrı bir anahtar önerilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const MODEL = process.env.MODEL || 'gemini-3-pro-image';

function anahtar() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const env = path.join(KOK, '../../backend/.env');
  const satir = fs.existsSync(env) && fs.readFileSync(env, 'utf8').match(/^GEMINI_API_KEY=(.*)$/m);
  if (!satir) throw new Error('GEMINI_API_KEY yok (ortam değişkeni ya da backend/.env)');
  return satir[1].trim().replace(/^"|"$/g, '');
}
const key = anahtar();

async function uret(istemDosyasi) {
  const ad = path.basename(istemDosyasi, '.txt');
  const istem = fs.readFileSync(istemDosyasi, 'utf8');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: istem }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '16:9', imageSize: '2K' },
        },
      }),
    },
  );
  const j = await res.json();
  if (j.error) throw new Error(`${ad}: ${j.error.message}`);
  const parca = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!parca) throw new Error(`${ad}: görsel dönmedi (${j.candidates?.[0]?.finishReason})`);
  const dosya = path.join(KOK, 'kaynak', `${ad}.png`);
  fs.writeFileSync(dosya, Buffer.from(parca.inlineData.data, 'base64'));
  const u = j.usageMetadata || {};
  console.log(`kaynak/${ad}.png kaydedildi (girdi ${u.promptTokenCount} / çıktı ${u.candidatesTokenCount} token)`);
}

// Birkaç istem birlikte gönderilir; zaman aşımına uğrayan tek başına yeniden denenebilir
const sonuc = await Promise.allSettled(process.argv.slice(2).map(uret));
for (const s of sonuc) if (s.status === 'rejected') console.error(s.reason.message);
