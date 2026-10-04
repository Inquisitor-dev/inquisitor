// Koda gömülü bir yedek anahtar repoda herkese açık olurdu; o anahtarla herkes istediği
// kullanıcı adına token üretebilirdi. Bu yüzden JWT_SECRET tanımlı değilse sunucu başlamaz.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET tanimli degil. backend/.env dosyasina ekleyin (bkz. .env.example).',
    );
  }
  return secret;
}
