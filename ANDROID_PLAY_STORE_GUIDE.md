# Trussets Android Application & Google Play Store Submission Guide

- **Application Name**: Trussets
- **Developer**: Brand Origin
- **Application ID (Package Name)**: `com.trussets.marketplace`
- **Version Name**: `1.0.0`
- **Version Code**: `1`
- **Compile / Target SDK**: `35` (Android 15 — Google Play Store compliant)
- **Min SDK**: `24` (Android 7.0+)
- **Production Backend**: `https://ais-pre-6omlvt4qhajgkvvfwj4akz-416483381564.asia-east1.run.app`

---

## 1. Architecture & Shared Production Database

The Trussets Android project (`/android`) uses **Capacitor 8** wrapping the production React application and routing all `/api/*` and `/uploads/*` requests to the live production backend (`src/utils/capacitorBridge.ts`).
- **Single Source of Truth**: Website, Android App, and Admin Portal share the exact same database, user accounts, OTP authentication, property listings, subscription plans, saved properties, and enquiries.
- **Native Capabilities**:
  - `@capacitor/app`: Android Hardware Back Button navigation across modals, property detail pages, and tabs; Deep Link (`https://` App Links and `com.trussets.marketplace://`) routing.
  - `@capacitor/geolocation`: Native Android Fine/Coarse GPS location permission prompt & reverse geocoding.
  - `@capacitor/network`: Real-time online/offline connectivity detection and automatic data resync on reconnect.
  - `@capacitor/status-bar` & `@capacitor/splash-screen`: Official Trussets `#77101F` crimson status bar and launch splash screen.

---

## 2. Building the Release APK and Signed AAB

Because the cloud container environment does not have a local JDK / Android SDK installed, run the following commands on your local machine (with **JDK 17+** and **Android Studio / Android SDK Platform 35** installed):

### Step 1: Generate Your Owner-Controlled Upload Keystore (One-Time)
Never commit your keystore or passwords to Git (already excluded in `.gitignore`).
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore android/trussets-upload-key.jks \
  -alias trussets-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Step 2: Configure `android/keystore.properties`
Copy `android/keystore.properties.example` to `android/keystore.properties`:
```properties
storeFile=trussets-upload-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=trussets-upload
keyPassword=YOUR_KEY_PASSWORD
```

### Step 3: Sync Web Assets & Build Release APK + Signed AAB
```bash
# Install dependencies & sync latest web build into android/
npm install
npm run android:sync

# Generate Installable Release APK:
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Generate Google Play Store Android App Bundle (AAB):
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 3. Graphic Assets Prepared (`/public/play-store-assets/`)

All required Play Store assets have been generated using the official Trussets logo and brand colors:
- **512 × 512 App Icon**: `public/play-store-assets/trussets-icon-512x512.png`
- **1024 × 500 Feature Graphic**: `public/play-store-assets/trussets-feature-graphic-1024x500.png`
- **Android Phone Screenshots (1080 × 1920)**:
  - `public/play-store-assets/screenshot-1-home-marketplace.png`
  - `public/play-store-assets/screenshot-2-property-details.png`
  - `public/play-store-assets/screenshot-3-post-property.png`
  - `public/play-store-assets/screenshot-4-profile-plans.png`
- **Tablet Screenshot (1920 × 1200)**:
  - `public/play-store-assets/screenshot-tablet-1920x1200.png`
- **Android Adaptive & Mipmap Icons**:
  - `android/app/src/main/res/mipmap-mdpi` through `mipmap-xxxhdpi` (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`)
  - `android/app/src/main/res/drawable*/splash.png`
