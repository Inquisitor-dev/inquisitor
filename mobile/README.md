# The Inquisitor Mobile

Expo tabanli mobil istemci.

## Gelistirme

`npm run start`

Bu komut bir defalik cikis veren komut degil, Expo dev server acip acik kalir.

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
