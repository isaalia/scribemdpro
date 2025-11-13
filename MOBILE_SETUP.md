# Mobile App Setup Guide

## 📱 Prerequisites

### iOS Development
- macOS (required for iOS builds)
- Xcode 14+ installed
- Apple Developer Account ($99/year)
- CocoaPods installed: `sudo gem install cocoapods`

### Android Development
- Android Studio installed
- Android SDK (API 33+)
- Java JDK 11+
- Google Play Developer Account ($25 one-time)

## 🚀 Initial Setup

### 1. Install Capacitor Dependencies
```bash
cd apps/web
npm install
```

### 2. Build Web App
```bash
npm run build
```

### 3. Add Platforms
```bash
# iOS
npx cap add ios

# Android
npx cap add android
```

### 4. Sync Capacitor
```bash
npx cap sync
```

## 📦 iOS Setup

### 1. Open in Xcode
```bash
npx cap open ios
```

### 2. Configure App Settings
- **Bundle Identifier**: `com.scribemd.pro`
- **Display Name**: `ScribeMD Pro`
- **Version**: `1.0.0`
- **Build**: `1`

### 3. Configure Signing & Capabilities
1. Select project in Xcode
2. Go to "Signing & Capabilities"
3. Select your Team
4. Enable "Automatically manage signing"
5. Add capabilities:
   - **Microphone** (for transcription)
   - **Camera** (for file uploads)
   - **Photo Library** (for file uploads)
   - **Background Modes** → Audio, AirPlay, and Picture in Picture

### 4. Configure Info.plist
Add these keys to `ios/App/App/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to transcribe patient encounters in real-time.</string>
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture images for patient documentation.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to attach images to patient encounters.</string>
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

### 5. Build for Device/Simulator
- **Simulator**: Product → Destination → Choose simulator → Run
- **Device**: Connect device → Select device → Run

### 6. Archive for App Store
1. Product → Destination → Any iOS Device
2. Product → Archive
3. Distribute App → App Store Connect
4. Follow App Store Connect upload process

## 🤖 Android Setup

### 1. Open in Android Studio
```bash
npx cap open android
```

### 2. Configure App Settings
- **Application ID**: `com.scribemd.pro`
- **Version Name**: `1.0.0`
- **Version Code**: `1`

### 3. Configure Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-feature android:name="android.hardware.microphone" android:required="true" />
```

### 4. Generate Signing Key
```bash
cd android/app
keytool -genkey -v -keystore scribemd-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias scribemd
```

### 5. Configure Signing
Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=scribemd
storeFile=../app/scribemd-release-key.jks
```

Update `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6. Build APK/AAB
```bash
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB (for Play Store)
```

Outputs:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 🎨 App Icons & Splash Screens

### Generate Icons
Use a tool like [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) or [App Icon Generator](https://www.appicon.co/):

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

Required sizes:
- **iOS**: 1024x1024 (App Store), various sizes for devices
- **Android**: 512x512 (Play Store), various sizes for devices

### Splash Screen
Create splash screens:
- **iOS**: `ios/App/App/Assets.xcassets/Splash.imageset/`
- **Android**: `android/app/src/main/res/drawable/`

## 📋 App Store Submission Checklist

### iOS App Store
- [ ] App icons (all sizes)
- [ ] Screenshots (6.5", 5.5", iPad)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Category: Medical
- [ ] Age rating: 17+ (Medical/Treatment Information)
- [ ] Privacy questionnaire completed
- [ ] TestFlight beta testing (optional)
- [ ] App Store review submission

### Google Play Store
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Category: Medical
- [ ] Content rating questionnaire
- [ ] Data safety section completed
- [ ] Internal testing track (optional)
- [ ] Production release

## 🔧 Development Commands

```bash
# Build web app
npm run build

# Sync Capacitor
npx cap sync

# Open iOS in Xcode
npx cap open ios

# Open Android in Android Studio
npx cap open android

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android

# Copy web assets
npx cap copy

# Update native dependencies
npx cap update
```

## 🐛 Troubleshooting

### iOS Issues
- **Build fails**: Clean build folder (Cmd+Shift+K), then rebuild
- **Signing errors**: Check Team selection and certificates
- **Simulator issues**: Reset simulator (Device → Erase All Content)

### Android Issues
- **Gradle sync fails**: Update Gradle wrapper, check Java version
- **Build fails**: Clean project (Build → Clean Project)
- **Permission denied**: Check AndroidManifest.xml permissions

## 📱 Testing Checklist

- [ ] App launches successfully
- [ ] Login works
- [ ] Microphone permission requested
- [ ] Transcription works
- [ ] Camera/photo library access works
- [ ] File uploads work
- [ ] Navigation works smoothly
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area respected (notch/status bar)
- [ ] App works offline (if applicable)
- [ ] Push notifications work (if implemented)

## 🚀 Deployment

### iOS
1. Archive in Xcode
2. Upload to App Store Connect
3. Complete App Store listing
4. Submit for review
5. Wait for approval (typically 1-3 days)

### Android
1. Build AAB bundle
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review
5. Wait for approval (typically 1-7 days)

## 📞 Support

For issues:
1. Check Capacitor documentation: https://capacitorjs.com/docs
2. Check platform-specific documentation (iOS/Android)
3. Review error logs in Xcode/Android Studio

