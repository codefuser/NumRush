# NumRush - Android APK Build & Installation Guide

The NumRush Android application is built using **Capacitor Android** and shares the unified React + TypeScript frontend codebase.

---

## 1. Verified Generated APK
The debug APK has been successfully compiled and verified:
- **Location**: `NumRush-debug.apk` (Root directory) and `client/android/app/build/outputs/apk/debug/app-debug.apk`
- **Application ID**: `com.numrush.game`
- **Application Display Name**: `NumRush`
- **File Size**: ~4.28 MB

---

## 2. Installing the Debug APK on an Android Device

### Method A: Direct Sideloading (Recommended)
1. Transfer `NumRush-debug.apk` to your Android phone via USB cable, Google Drive, WhatsApp, or email.
2. On your Android phone, tap the file in your Files / Downloads app.
3. If prompted, toggle **"Allow installation from this source"**.
4. Tap **Install** and launch **NumRush**.

### Method B: ADB Command Line Installation
Ensure your Android device has **USB Debugging** enabled and is connected:
```bash
adb install -r NumRush-debug.apk
```

---

## 3. How to Rebuild the APK Locally

Whenever you make changes to the client codebase:

```bash
# 1. Build the web application bundle
cd client
npm run build

# 2. Sync web assets with Capacitor Android
npx cap sync android

# 3. Compile the debug APK using Gradle
cd android
.\gradlew.bat assembleDebug

# Output APK is generated at:
# client/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Production Backend URL Configuration for Android

By default, in local testing on an Android device or emulator:
- Android emulators access the host machine via `http://10.0.2.2:3001`.
- Physical Android phones connect over your local Wi-Fi network (e.g. `http://192.168.1.150:3001`) or to your deployed cloud domain (`https://api.numrush.game`).

To set the production backend URL for the APK:
1. Create or edit `client/.env.production`:
   ```env
   VITE_BACKEND_URL=https://api.numrush.game
   ```
2. Re-run:
   ```bash
   cd client
   npm run build
   npx cap sync android
   cd android
   .\gradlew.bat assembleDebug
   ```

---

## 5. Generating a Signed Release APK for Google Play Store

To create a signed release APK or Android App Bundle (AAB):

1. **Generate a Keystore**:
   ```bash
   keytool -genkey -v -keystore numrush-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias numrush-key
   ```

2. **Configure Signing in `client/android/app/build.gradle`**:
   ```groovy
   android {
       ...
       signingConfigs {
           release {
               storeFile file("path/to/numrush-release-key.jks")
               storePassword "your-store-password"
               keyAlias "numrush-key"
               keyPassword "your-key-password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build the Release Bundle**:
   ```bash
   cd client/android
   .\gradlew.bat bundleRelease    # Produces AAB for Google Play Store
   # or
   .\gradlew.bat assembleRelease  # Produces Signed Release APK
   ```
