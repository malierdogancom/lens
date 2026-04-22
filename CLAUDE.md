# CLAUDE.md — Lens

## Proje Özeti
Fotoğraf galerisi uygulaması. `lens.malierdogan.com` adresinde yayınlanır.
- **Subdomain:** lens.malierdogan.com
- **GitHub Org:** github.com/malierdogancom/lens
- **Firebase Hosting:** `portfolio-mali-erdogan` projesi, target: `lens` → `portfolio-malilens`

## Tech Stack
- **Framework:** Next.js 14.2.18 (Firebase Frameworks / serverless — `output: 'export'` YOK)
- **React:** 18.x
- **TypeScript:** Evet
- **Styling:** Tailwind CSS 4
- **Node:** 20 (zorunlu — `engines.node: "20"`)
- **Extra libs:** Exifreader (EXIF metadata), JSZip, Framer Motion, Yet Another React Lightbox, Lucide React

## Önemli: Bu site diğerlerinden farklı!
- Diğer siteler **static export** (`out/` klasörü), lens ise **Firebase Frameworks** kullanır
- `firebase.json`'da `"source": ".", "frameworksBackend": { "region": "us-central1" }` ayarı var
- `firebase deploy` komutu Next.js'i build edip **Cloud Functions + Hosting** olarak deploy eder
- Bu yüzden production deploy'da `npm run build` ayrıca çalıştırılmaz — Firebase bunu otomatik yapar

## Firebase Yapısı
- **Project ID:** `portfolio-mali-erdogan`
- **Hosting target:** `lens` → site ID: `portfolio-malilens`
- **Firestore:** Evet
  - Collection: `photos` — fotoğraf belgeleri (url, folderId, name, exif verileri, createdAt)
  - Collection: `folders` — albüm/klasör belgeleri (name, type: "public"|"private", password, createdAt)
- **Storage:** Evet
  - Path: `photos/{folderId}/{timestamp}-{filename}` — orijinal fotoğraf dosyaları
- **Auth:** Evet (admin işlemleri için)
- **Cloud Functions:** Evet (Firebase Frameworks backend, us-central1 bölgesi)

## Firebase Config (hardcoded — env var değil)
`src/lib/firebase.ts` dosyasında sabit değerler:
```javascript
apiKey: "AIzaSyB0eED9JbSQXvPfFJPNOhRiZSm5PpbTkjk"
authDomain: "portfolio-mali-erdogan.firebaseapp.com"
projectId: "portfolio-mali-erdogan"
storageBucket: "portfolio-mali-erdogan.firebasestorage.app"
messagingSenderId: "263756724892"
appId: "1:263756724892:web:517a7b71798c682e554b59"
measurementId: "G-11J83J99DY"
```

## CI/CD Süreci
- **Trigger:** `main` branch'e push → production deploy (hosting+functions), PR → preview channel deploy
- **Workflow:** `.github/workflows/firebase-deploy.yml`
- **İki ayrı job var:**
  1. `deploy_preview` (PR): `FirebaseExtended/action-hosting-deploy@v0` ile preview channel
  2. `deploy_live` (main push): `firebase-tools` CLI ile full deploy
- **Secrets gerekli:**
  - `FIREBASE_SERVICE_ACCOUNT_PORTFOLIO_MALI_ERDOGAN` (org secret — otomatik)

## Build & Deploy Detayları
```bash
# Production (firebase-tools halledyor build'i de):
npm ci
npm install -g firebase-tools
echo "$FIREBASE_KEY" > firebase_credentials.json
export GOOGLE_APPLICATION_CREDENTIALS="./firebase_credentials.json"
firebase deploy --only hosting --project portfolio-mali-erdogan --non-interactive
rm firebase_credentials.json
```

## Firestore Rules
`firestore.rules` ve `firestore.indexes.json` mevcut. Deploy:
```bash
firebase deploy --only firestore --project portfolio-mali-erdogan
```

## Storage Rules
`storage.rules` mevcut. Deploy:
```bash
firebase deploy --only storage --project portfolio-mali-erdogan
```

## Admin İşlemleri
`src/utils/adminActions.ts` — fotoğraf/klasör silme ve güncelleme işlemleri Firestore + Storage'ı birlikte kullanır.

## Bilinen Kısıtlar
- Node 20 zorunlu (package.json'da `engines.node: "20"` var)
- Static export değil — sunucu tarafı rendering + Cloud Functions gerekiyor
- Diğer sitelerden farklı deploy süreci — workflow'u karıştırma

---

## Yeni Subdomain Ekleme Rehberi

(Bkz. `portfolio/CLAUDE.md` → Yeni Subdomain Ekleme Rehberi bölümü — adımlar aynı)
