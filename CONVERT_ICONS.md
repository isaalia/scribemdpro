# Convert Your Icon Designs to App Assets

You have two beautiful icon designs! Here's how to convert them to the required app icon sizes.

## 🎯 Quick Method (Recommended)

### Step 1: Convert SVG to PNG

**Option A: Online Converter (Easiest)**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `apps/web/public/icon-design-1.svg` (or design-2)
3. Set size to **1024x1024**
4. Download as `icon-1024.png`

**Option B: Using Inkscape (Free Desktop Tool)**
```bash
# Download from https://inkscape.org/
inkscape icon-design-1.svg --export-filename=icon-1024.png --export-width=1024 --export-height=1024
```

**Option C: Using ImageMagick**
```bash
magick icon-design-1.svg -resize 1024x1024 icon-1024.png
```

### Step 2: Generate All Sizes

**Easiest: Use AppIcon.co**
1. Go to https://www.appicon.co/
2. Upload your `icon-1024.png`
3. Click "Generate"
4. Download the zip file
5. Extract all sizes

**Or use the script:**
```bash
node scripts/generate-icons.js icon-1024.png
```

## 📱 Which Design to Use?

**Design 1 (Blue Background):**
- ✅ More colorful and vibrant
- ✅ Better visibility on light backgrounds
- ✅ Includes "ScribeMD Pro" text (may need to remove for app stores)
- ✅ Professional medical look

**Design 2 (Black Background):**
- ✅ More minimalist and modern
- ✅ Better contrast
- ✅ No text (better for app stores)
- ✅ Sleek, premium feel

**Recommendation:** Use **Design 2** for app stores (no text), but keep Design 1 for marketing materials.

## 🔧 Next Steps

### For iOS:
1. Generate all sizes using AppIcon.co
2. Copy to `apps/web/ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Update `Contents.json` with correct filenames

### For Android:
1. Generate all sizes
2. Copy to appropriate `mipmap-*` folders:
   - `android/app/src/main/res/mipmap-mdpi/` (48x48)
   - `android/app/src/main/res/mipmap-hdpi/` (72x72)
   - `android/app/src/main/res/mipmap-xhdpi/` (96x96)
   - `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
   - `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### For Splash Screens:
1. Convert `splash-design-1.svg` or `splash-design-2.svg` to PNG
2. Size: 2048x2732 (iPhone 14 Pro Max)
3. Add to Capacitor splash screen assets

## 🎨 Design Notes

**Important:** App Store guidelines:
- ❌ **No text** in app icons (text appears below icon automatically)
- ✅ Keep important elements in center 66% (safe zone)
- ✅ Test at small sizes (20x20, 29x29)
- ✅ Ensure contrast is good

**For Design 1:** You may want to remove the "ScribeMD Pro" text for the final app icon, keeping it only for splash screens.

## 🚀 Quick Commands

```bash
# Convert SVG to 1024x1024 PNG (if you have ImageMagick)
magick apps/web/public/icon-design-2.svg -resize 1024x1024 icon-1024.png

# Generate all sizes (if you have ImageMagick)
node scripts/generate-icons.js icon-1024.png

# Or just upload to AppIcon.co - it's easier!
```

## 📝 File Locations

After generating, place icons here:

**iOS:**
- `apps/web/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Android:**
- `apps/web/android/app/src/main/res/mipmap-*/ic_launcher.png`

**Splash Screens:**
- iOS: `apps/web/ios/App/App/Assets.xcassets/Splash.imageset/`
- Android: `apps/web/android/app/src/main/res/drawable/`

