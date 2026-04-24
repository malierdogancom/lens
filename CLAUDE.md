# CLAUDE.md — Lens

## Proje Özeti
Fotoğraf galerisi uygulaması. `lens.malierdogan.com` adresinde yayınlanır.
- **Subdomain:** lens.malierdogan.com
- **GitHub Org:** github.com/malierdogancom/lens
- **Firebase Hosting:** `portfolio-mali-erdogan` projesi, target: `lens` → `portfolio-malilens`
- **Page title:** "Lens — Mali Erdoğan Photography"
- **Favicon:** `src/app/icon.svg` (mavi diyafram/lens ikonu)

## Tech Stack
- **Framework:** Next.js 14.2.18 (Firebase Frameworks / serverless — `output: 'export'` YOK)
- **React:** 18.x
- **TypeScript:** Evet
- **Styling:** Tailwind CSS 4
- **Node:** 20 (zorunlu — `engines.node: "20"`)
- **Extra libs:** Exifreader (EXIF metadata), JSZip, Framer Motion, Yet Another React Lightbox, Lucide React

## Önemli: Bu site diğerlerinden farklı!
- Diğer siteler **static export** (`out/` klasörü), lens ise **Firebase Frameworks** kullanır
- `firebase.json`'da `"source": ".", "frameworksBackend": { "region": "us-east1" }` ayarı var
- `firebase deploy` komutu Next.js'i build edip **Cloud Functions + Hosting** olarak deploy eder
- Bu yüzden production deploy'da `npm run build` ayrıca çalıştırılmaz — Firebase bunu otomatik yapar

## ⚠️ Bu repo tüm projenin Firestore config'ini yönetir!
`lens` reposu `firebase deploy` ile **tüm `portfolio-mali-erdogan` projesi için** Firestore rules ve indexes'i deploy eder.

Bu dosyaları düzenlerken tüm sitelerin collection'larını dahil et:
- `firestore.rules` → `folders`, `photos` (lens) + `messages` (portfolio) + `brackets` (bracket)
- `firestore.indexes.json` → `photos` (lens) + `brackets` (bracket admin)

**Başka bir sitenin Firestore kurallarını veya index'ini değiştirmen gerekiyorsa bu repodaki dosyaları düzenle.**

## Firebase Yapısı
- **Project ID:** `portfolio-mali-erdogan`
- **Hosting target:** `lens` → site ID: `portfolio-malilens`
- **Firestore:** Evet (proje genelinde rules/indexes buradan deploy edilir)
  - Collection: `photos` — fotoğraf belgeleri (url, folderId, name, exif verileri, createdAt)
  - Collection: `folders` — albüm/klasör belgeleri (name, type: "public"|"private", password, createdAt)
- **Storage:** Evet
  - Path: `photos/{folderId}/{timestamp}-{filename}` — orijinal fotoğraf dosyaları
- **Auth:** Evet (admin işlemleri için)
- **Cloud Functions:** Evet (Firebase Frameworks backend, us-east1 bölgesi)

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
- **Trigger:** `main` branch'e push → production deploy (hosting + functions + firestore rules/indexes + storage rules), PR → preview channel, `workflow_dispatch` → manuel tetikleme
- **Workflow:** `.github/workflows/firebase-deploy.yml`
- **İki ayrı job var:**
  1. `deploy_preview` (PR): `FirebaseExtended/action-hosting-deploy@v0` ile preview channel, `FIREBASE_SERVICE_ACCOUNT_PORTFOLIO_MALI_ERDOGAN` kullanır
  2. `deploy_live` (main push): `firebase-tools` CLI ile full deploy, `FIREBASE_TOKEN` kullanır
- **Secrets gerekli:**
  - `FIREBASE_TOKEN` (org secret — `firebase login:ci` ile üretilir) — production deploy için
  - `FIREBASE_SERVICE_ACCOUNT_PORTFOLIO_MALI_ERDOGAN` (org secret) — PR preview için

## Build & Deploy Detayları
```bash
# Production deploy (workflow bunu çalıştırır):
npm ci
npm install -g firebase-tools
firebase experiments:enable webframeworks
firebase deploy --project portfolio-mali-erdogan --non-interactive --force
# NOT: --force, Cloud Functions artifact cleanup policy kurulumu için gerekli
# NOT: FIREBASE_TOKEN env var olarak set edilmeli (service account değil)
```

## Firestore Rules (proje geneli)
`firestore.rules` — tüm sitelerin collection'larını içerir. Deploy:
```bash
firebase deploy --only firestore:rules --project portfolio-mali-erdogan
```

## Firestore İndeksler (proje geneli)
`firestore.indexes.json` — tüm sitelerin index'lerini içerir. Deploy:
```bash
firebase deploy --only firestore:indexes --project portfolio-mali-erdogan
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
- `FIREBASE_TOKEN` süresi dolabilir → `firebase login:ci` ile yenile, org secret'ı güncelle

---

## Yeni Subdomain Ekleme Rehberi

(Bkz. `portfolio/CLAUDE.md` → Yeni Subdomain Ekleme Rehberi bölümü — adımlar aynı)
