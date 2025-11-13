# Generate App Icons & Splash Screens

## 🎨 Quick Options

### Option 1: Use Free Online Tools (Recommended)

1. **AppIcon.co** - https://www.appicon.co/
   - Upload a 1024x1024 PNG
   - Generates all iOS/Android sizes automatically
   - Free, no signup required

2. **IconKitchen** - https://icon.kitchen/
   - Google's icon generator
   - Generates Android adaptive icons
   - Free

3. **MakeAppIcon** - https://makeappicon.com/
   - Upload 1024x1024 PNG
   - Generates all sizes
   - Free

### Option 2: Use AI Image Generators

#### DALL-E 3 (via ChatGPT Plus or Bing)
**Prompt for App Icon:**
```
Create a professional medical app icon for "ScribeMD Pro", an AI-powered medical documentation platform. 
Design: Modern, clean, medical cross symbol integrated with a microphone or document icon. 
Colors: Primary blue (#0066cc) background, white medical cross, subtle gradient. 
Style: Flat design, iOS/Android app icon style, rounded corners, professional healthcare aesthetic. 
Size: Square, 1024x1024 pixels, suitable for app stores.
```

**Prompt for Splash Screen:**
```
Create a splash screen for "ScribeMD Pro" medical app. 
Design: Centered logo with medical cross and microphone, app name "ScribeMD Pro" below, tagline "AI-Powered Medical Documentation". 
Colors: Blue gradient background (#0066cc to #004499), white text and icons. 
Style: Clean, professional, medical/healthcare theme, modern flat design. 
Size: 2048x2732 pixels (iPhone 14 Pro Max), centered content.
```

#### Midjourney
```
/apprompt medical app icon, ScribeMD Pro, blue background #0066cc, white medical cross, microphone icon, modern flat design, iOS app icon style, professional healthcare, --ar 1:1 --v 6
```

#### Stable Diffusion (via Hugging Face Spaces)
- Visit: https://huggingface.co/spaces
- Use prompt: "medical app icon, blue background, white medical cross, modern flat design, professional"

### Option 3: Use the SVG Templates

I've created SVG templates in `apps/web/public/`:
- `icon-template.svg` - Base icon design
- `splash-template.svg` - Splash screen design

**To convert SVG to PNG:**

1. **Using Inkscape (Free):**
```bash
# Install Inkscape: https://inkscape.org/
inkscape icon-template.svg --export-filename=icon-1024.png --export-width=1024 --export-height=1024
```

2. **Using Online Converter:**
- https://cloudconvert.com/svg-to-png
- Upload SVG, set size to 1024x1024, download PNG

3. **Using ImageMagick:**
```bash
magick icon-template.svg -resize 1024x1024 icon-1024.png
```

## 📱 Required Sizes

### iOS App Icon
- **App Store:** 1024x1024 PNG (required)
- **iPhone:** 180x180, 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20
- **iPad:** 152x152, 76x76, 40x40, 29x29, 20x20

### Android App Icon
- **Play Store:** 512x512 PNG (required)
- **Adaptive Icon:** 1024x1024 PNG (foreground + background)
- **Legacy:** 192x192, 144x144, 96x96, 72x72, 48x48, 36x36

### Splash Screens

#### iOS
- iPhone 14 Pro Max: 1290x2796
- iPhone 14 Pro: 1179x2556
- iPhone 14 Plus: 1284x2778
- iPhone 14: 1170x2532
- iPad Pro 12.9": 2048x2732
- iPad Pro 11": 1668x2388
- iPad Air: 1640x2360

#### Android
- **Portrait:** 1080x1920 (most common)
- **Landscape:** 1920x1080
- **Tablet:** 2048x2732

## 🚀 Quick Start Guide

### Step 1: Generate Base Icon (1024x1024)

**Using AI:**
1. Use one of the prompts above with DALL-E/Midjourney
2. Download the 1024x1024 PNG
3. Save as `icon-1024.png`

**Using Template:**
1. Open `apps/web/public/icon-template.svg` in a design tool
2. Customize colors/text if needed
3. Export as 1024x1024 PNG

### Step 2: Generate All Sizes

**Using AppIcon.co:**
1. Go to https://www.appicon.co/
2. Upload `icon-1024.png`
3. Download the generated zip
4. Extract to `apps/web/public/icons/`

**Or manually resize:**
```bash
# Using ImageMagick (if installed)
for size in 1024 512 256 192 180 152 144 120 96 87 80 76 72 60 58 48 40 36 29 20; do
  magick icon-1024.png -resize ${size}x${size} icon-${size}.png
done
```

### Step 3: Generate Splash Screen

**Using AI:**
1. Use splash screen prompt above
2. Generate 2048x2732 PNG
3. Save as `splash-ios.png`

**Using Template:**
1. Open `apps/web/public/splash-template.svg`
2. Customize if needed
3. Export as 2048x2732 PNG

### Step 4: Add to Capacitor Project

**iOS:**
```bash
cd apps/web/ios/App/App/Assets.xcassets/AppIcon.appiconset/
# Copy all icon-*.png files here
# Update Contents.json with correct sizes
```

**Android:**
```bash
cd apps/web/android/app/src/main/res/
# mipmap-hdpi: 72x72
# mipmap-mdpi: 48x48
# mipmap-xhdpi: 96x96
# mipmap-xxhdpi: 144x144
# mipmap-xxxhdpi: 192x192
```

## 🎨 Design Guidelines

### App Icon Best Practices
- **Simple & Recognizable:** Works at small sizes
- **No Text:** App name appears below icon in stores
- **Consistent Branding:** Use your brand colors
- **Square Design:** Will be rounded/masked by OS
- **High Contrast:** Readable on light/dark backgrounds

### Splash Screen Best Practices
- **Centered Logo:** Main visual element centered
- **Brand Colors:** Use primary brand color
- **Minimal Text:** App name only (optional)
- **Fast Loading:** Keep file size small
- **Consistent:** Matches app icon design

## 🔧 Automated Generation Script

I can create a Node.js script to automate resizing if you have ImageMagick installed. Would you like me to create that?

## 📝 Next Steps

1. **Generate base icon** (1024x1024) using AI or template
2. **Use AppIcon.co** to generate all sizes automatically
3. **Generate splash screen** (2048x2732) using AI or template
4. **Add to Capacitor project** following the paths above
5. **Test on device** to ensure icons display correctly

## 💡 Pro Tips

- **Test on Device:** Always test icons on actual devices
- **Adaptive Icons:** Android adaptive icons need separate foreground/background layers
- **Safe Zone:** Keep important content in center 66% (Android adaptive icons)
- **File Size:** Optimize PNGs (use TinyPNG.com)
- **Transparency:** iOS icons should NOT have transparency

