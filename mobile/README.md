# The Inquisitor Mobile

Expo tabanli mobil istemci.

## Gelistirme

`npm run start`

Bu komut bir defalik cikis veren komut degil, Expo dev server acip acik kalir.

Yardimci scriptler:

- `npm run start:lan`
- `npm run start:tunnel`
- `npm run start:clear`

## Fiziksel cihaz testi

Telefon ile test ederken backend adresini `localhost` yerine makinenin LAN IP'sine ver.

Ornek:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3001
```

Bu degeri `mobile/.env` icinde tanimlayabilirsin. Ornek dosya: [mobile/.env.example](C:/Users/berke/Desktop/The_Inquisitor/mobile/.env.example)

## Hızlı doğrulama

`npx expo config --type public`

Bu komut dev server acmadan Expo config'ini kontrol eder.

## Expo Go cihaz checklist

1. Backend'i `3001` portunda baslat.
2. Bilgisayarinin LAN IP adresini ogren.
3. `mobile/.env` olustur ve `EXPO_PUBLIC_API_BASE_URL=http://LAN_IP:3001` yaz.
4. `mobile` klasorunde `npm run start:lan` calistir.
5. Telefonda Expo Go ile QR kodu okut.
6. Login ekraninda gorunen `API target` alaninin LAN IP'yi gosterdigini kontrol et.
7. `Check backend connection` butonuna bas.
8. Baglanti basariliysa login ol.
9. Yeni session ac, `Map`, `Interact` ve `Result` akislarini dene.
