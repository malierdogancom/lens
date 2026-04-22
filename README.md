# Lens — lens.malierdogan.com

A private photo gallery for sharing high-quality photos with friends and family.

## What It Does

- **Gallery:** Browse photo collections organized into folders (albums)
- **Public & Private Folders:** Public folders are open to anyone; private folders require a password to view
- **Admin Panel:** Upload photos in original quality, create/manage folders, delete or move photos
- **EXIF Data:** Camera metadata (make, model, ISO, aperture, shutter speed) is extracted and stored on upload
- **Easy Download:** Visitors can download individual photos or bulk-download a folder as a ZIP

## Why It Was Built

A personal alternative to Google Drive or shared albums — upload photos at full resolution, organize them into named folders, and share a link with friends. They can browse and download without needing a Google account or dealing with Drive's compression.

## Tech Stack

- **Framework:** Next.js 14 (Firebase Frameworks — serverless, NOT static export)
- **Styling:** Tailwind CSS 4
- **Backend:** Firebase Firestore + Cloud Storage + Authentication (email/password)
- **Hosting:** Firebase Hosting + Cloud Functions (target: `portfolio-malilens`)

## Authentication

Admin access is restricted to a single whitelisted email (`malilens@mali.com`). Login at `/login`. Public visitors can browse public folders and view/download photos without an account. Private folders require a password set by the admin.

## Deployment

Push to `main` → GitHub Actions deploys to Firebase (hosting + serverless functions). PRs get a preview channel URL.

```bash
npm run dev    # local development (Node 20 required)
firebase deploy --only hosting --project portfolio-mali-erdogan  # manual deploy
```

> Note: This site uses Firebase Frameworks (serverless Next.js). The build is handled by Firebase during deploy, not by `npm run build` directly.
