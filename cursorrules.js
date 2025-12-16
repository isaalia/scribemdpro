# ============================================================================
# CURSOR DEVELOPMENT RULES
# Auto Port-Finding | Orchestrated Startup | Responsive PWA/Mobile Design
# ============================================================================

## CRITICAL STARTUP REQUIREMENTS

All development applications MUST follow this startup sequence:
1. Backend starts → Health check passes → Frontend starts → Health check passes → Browser opens
2. Use automatic port-finding (NEVER hardcode ports like 3000, 5000, 8080)
3. All processes run silently (no popup windows)

---

## PORT MANAGEMENT

### Auto Port-Finding Utility (Required)

Always create `utils/port_manager.py` or `utils/portManager.js` in every project:

```python
# utils/port_manager.py
import socket
from contextlib import closing

def find_free_port(start=3000, end=9000):
    """Find an available port in the given range."""
    for port in range(start, end):
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            if sock.connect_ex(('localhost', port)) != 0:
                return port
    raise RuntimeError("No free ports available")

def is_port_in_use(port):
    """Check if a port is currently in use."""
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        return sock.connect_ex(('localhost', port)) == 0
```

```javascript
// utils/portManager.js
const net = require('net');

async function findFreePort(start = 3000, end = 9000) {
  for (let port = start; port < end; port++) {
    const available = await checkPort(port);
    if (available) return port;
  }
  throw new Error('No free ports available');
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

module.exports = { findFreePort, checkPort };
```

### Port Assignment Rules
- Backend: Start searching from port 8000
- Frontend: Start searching from port 3000
- Database: Start searching from port 5432 (Postgres) or 27017 (MongoDB)
- Never assume a port is available - always check first
- Write assigned ports to `.env.local` or `runtime.config.json` for cross-process communication

---

## ORCHESTRATED STARTUP SCRIPT

Always create `scripts/dev.js` or `scripts/dev.py` as the single entry point:

```javascript
// scripts/dev.js
const { spawn } = require('child_process');
const { findFreePort } = require('../utils/portManager');
const http = require('http');
const fs = require('fs');
const open = require('open');

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

async function healthCheck(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on('error', reject);
        req.setTimeout(2000, reject);
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, RETRY_INTERVAL));
    }
  }
  throw new Error(`Health check failed: ${url}`);
}

async function startDev() {
  console.log('🔍 Finding available ports...');
  const BACKEND_PORT = await findFreePort(8000, 8999);
  const FRONTEND_PORT = await findFreePort(3000, 3999);
  
  // Write runtime config
  const config = { BACKEND_PORT, FRONTEND_PORT, BACKEND_URL: `http://localhost:${BACKEND_PORT}` };
  fs.writeFileSync('runtime.config.json', JSON.stringify(config, null, 2));
  
  console.log(`📦 Starting backend on port ${BACKEND_PORT}...`);
  const backend = spawn('npm', ['run', 'backend'], {
    env: { ...process.env, PORT: BACKEND_PORT },
    stdio: 'inherit',
    shell: true
  });

  console.log('⏳ Waiting for backend health...');
  await healthCheck(`http://localhost:${BACKEND_PORT}/health`);
  console.log('✅ Backend healthy');

  console.log(`🎨 Starting frontend on port ${FRONTEND_PORT}...`);
  const frontend = spawn('npm', ['run', 'frontend'], {
    env: { ...process.env, PORT: FRONTEND_PORT, REACT_APP_API_URL: `http://localhost:${BACKEND_PORT}` },
    stdio: 'inherit',
    shell: true
  });

  console.log('⏳ Waiting for frontend health...');
  await healthCheck(`http://localhost:${FRONTEND_PORT}`);
  console.log('✅ Frontend healthy');

  console.log(`🌐 Opening browser at http://localhost:${FRONTEND_PORT}`);
  await open(`http://localhost:${FRONTEND_PORT}`);
  
  process.on('SIGINT', () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });
}

startDev().catch(console.error);
```

### Package.json Scripts (Required Pattern)
```json
{
  "scripts": {
    "dev": "node scripts/dev.js",
    "backend": "node server/index.js",
    "frontend": "react-scripts start",
    "start": "npm run dev"
  }
}
```

### Backend Health Endpoint (Required)
Every backend MUST expose `/health` endpoint:
```javascript
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: Date.now() }));
```

---

## PWA RESPONSIVE DESIGN STANDARDS

### Target Display Sizes
- **Small Desktop**: 21" (1920×1080)
- **Medium Desktop**: 24-27" (2560×1440)
- **Large Desktop**: 32" (3840×2160)
- **Extra Large**: 40-56" (3840×2160 to 7680×4320)

### Required CSS Architecture

```css
/* ============================================================================
   ROOT CONFIGURATION - Fluid Typography & Spacing Scale
   ============================================================================ */
:root {
  /* Fluid base font: 16px at 1920px → 24px at 3840px (4K) → 32px at 7680px (8K) */
  --font-base: clamp(1rem, 0.5rem + 0.5vw, 2rem);
  
  /* Spacing scale (relative to viewport) */
  --space-xs: clamp(0.25rem, 0.5vmin, 0.5rem);
  --space-sm: clamp(0.5rem, 1vmin, 1rem);
  --space-md: clamp(1rem, 2vmin, 2rem);
  --space-lg: clamp(1.5rem, 3vmin, 3rem);
  --space-xl: clamp(2rem, 4vmin, 4rem);
  --space-2xl: clamp(3rem, 6vmin, 6rem);
  
  /* Container max-widths */
  --container-sm: min(640px, 90vw);
  --container-md: min(1024px, 90vw);
  --container-lg: min(1440px, 90vw);
  --container-xl: min(1920px, 95vw);
  --container-2xl: min(2560px, 95vw);
  --container-full: 100%;
  
  /* Aspect ratio safe content area */
  --content-width: min(90vw, 90vh * 1.78); /* 16:9 max */
}

html {
  font-size: var(--font-base);
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
}

/* ============================================================================
   BREAKPOINT SYSTEM - Desktop Focus (21" to 56")
   ============================================================================ */

/* Full HD - 21" monitors (1920×1080) */
@media screen and (min-width: 1920px) {
  :root {
    --font-base: 16px;
    --content-padding: 2rem;
  }
}

/* QHD - 24-27" monitors (2560×1440) */
@media screen and (min-width: 2560px) {
  :root {
    --font-base: 18px;
    --content-padding: 2.5rem;
  }
}

/* 4K - 32-40" monitors (3840×2160) */
@media screen and (min-width: 3840px) {
  :root {
    --font-base: 24px;
    --content-padding: 3rem;
  }
}

/* 5K+ - 40-56" displays (5120×2880+) */
@media screen and (min-width: 5120px) {
  :root {
    --font-base: 28px;
    --content-padding: 4rem;
  }
}

/* 8K - Large format displays (7680×4320) */
@media screen and (min-width: 7680px) {
  :root {
    --font-base: 32px;
    --content-padding: 5rem;
  }
}

/* ============================================================================
   ORIENTATION HANDLING
   ============================================================================ */

/* Landscape orientation adjustments */
@media screen and (orientation: landscape) {
  .app-container {
    flex-direction: row;
    max-height: 100vh;
    max-height: 100dvh;
  }
  
  .sidebar {
    width: clamp(200px, 20vw, 400px);
    height: 100%;
  }
  
  .main-content {
    flex: 1;
    overflow-y: auto;
  }
}

/* Portrait orientation adjustments */
@media screen and (orientation: portrait) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 30vh;
  }
  
  .main-content {
    flex: 1;
    overflow-y: auto;
  }
}

/* Ultra-wide displays (21:9 and wider) */
@media screen and (min-aspect-ratio: 21/9) {
  .app-container {
    max-width: 80vw;
    margin: 0 auto;
  }
  
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }
}

/* ============================================================================
   RESOLUTION-AWARE SCALING
   ============================================================================ */

/* High DPI / Retina displays */
@media screen and (-webkit-min-device-pixel-ratio: 2),
       screen and (min-resolution: 192dpi) {
  :root {
    --border-width: 0.5px;
    --shadow-blur: 0.5rem;
  }
}

/* Standard DPI */
@media screen and (-webkit-max-device-pixel-ratio: 1.5),
       screen and (max-resolution: 144dpi) {
  :root {
    --border-width: 1px;
    --shadow-blur: 1rem;
  }
}

/* ============================================================================
   FLEX CONTAINER PATTERNS
   ============================================================================ */

.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.flex-grow {
  flex: 1 1 auto;
  min-width: 0; /* Prevent overflow */
}

.flex-shrink-0 {
  flex-shrink: 0;
}

/* Auto-sizing grid that adapts to screen size */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: var(--space-md);
}

/* Large screen grid with more columns */
@media screen and (min-width: 2560px) {
  .auto-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
  }
}

@media screen and (min-width: 3840px) {
  .auto-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(500px, 100%), 1fr));
  }
}

/* ============================================================================
   CONTAINER QUERIES (Modern Responsive)
   ============================================================================ */

.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    flex-direction: row;
  }
}

@container card (min-width: 600px) {
  .card-content {
    gap: var(--space-lg);
  }
  .card-title {
    font-size: 1.5rem;
  }
}

/* ============================================================================
   VIEWPORT-RELATIVE SIZING UTILITIES
   ============================================================================ */

.w-screen { width: 100vw; }
.h-screen { height: 100vh; height: 100dvh; }
.min-h-screen { min-height: 100vh; min-height: 100dvh; }

.w-full { width: 100%; }
.h-full { height: 100%; }

/* Safe area insets for notched devices */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

### Required Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

---

## iOS & ANDROID RESPONSIVE STANDARDS

### Target Mobile Devices

**iOS Devices:**
- iPhone SE: 375×667 (4.7")
- iPhone 14: 390×844 (6.1")
- iPhone 14 Plus: 428×926 (6.7")
- iPhone 14 Pro: 393×852 (6.1")
- iPhone 14 Pro Max: 430×932 (6.7")
- iPad Mini: 744×1133 (8.3")
- iPad Air: 820×1180 (10.9")
- iPad Pro 11": 834×1194
- iPad Pro 12.9": 1024×1366

**Android Devices:**
- Small phones: 360×640 (5")
- Medium phones: 390×844 (6.1")
- Large phones: 412×915 (6.7")
- Foldables open: 717×512 to 884×1104
- Tablets: 800×1280 to 1600×2560

### Mobile-First CSS

```css
/* ============================================================================
   MOBILE BREAKPOINT SYSTEM
   ============================================================================ */

/* Base: Mobile-first (smallest phones 320px+) */
:root {
  --mobile-font-base: 16px;
  --mobile-spacing: 1rem;
  --mobile-radius: 0.5rem;
  --touch-target-min: 44px; /* Apple HIG / Material minimum */
}

/* Small phones (iPhone SE, older Androids) */
@media screen and (min-width: 320px) and (max-width: 374px) {
  :root {
    --mobile-font-base: 14px;
    --mobile-spacing: 0.75rem;
  }
}

/* Standard phones (iPhone 14, Pixel) */
@media screen and (min-width: 375px) and (max-width: 427px) {
  :root {
    --mobile-font-base: 16px;
    --mobile-spacing: 1rem;
  }
}

/* Large phones (iPhone Pro Max, large Androids) */
@media screen and (min-width: 428px) and (max-width: 767px) {
  :root {
    --mobile-font-base: 17px;
    --mobile-spacing: 1.25rem;
  }
}

/* Tablets portrait */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  :root {
    --mobile-font-base: 18px;
    --mobile-spacing: 1.5rem;
  }
}

/* Tablets landscape / small laptops */
@media screen and (min-width: 1024px) and (max-width: 1365px) {
  :root {
    --mobile-font-base: 18px;
    --mobile-spacing: 1.5rem;
  }
}

/* Large tablets (iPad Pro 12.9") */
@media screen and (min-width: 1366px) and (max-width: 1919px) {
  :root {
    --mobile-font-base: 18px;
    --mobile-spacing: 2rem;
  }
}

/* ============================================================================
   AUTO-ROTATION HANDLING
   ============================================================================ */

/* Portrait mode (default mobile) */
@media screen and (orientation: portrait) {
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(60px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .mobile-header {
    position: sticky;
    top: 0;
    padding-top: env(safe-area-inset-top);
  }
  
  .mobile-content {
    padding-bottom: calc(60px + env(safe-area-inset-bottom) + var(--mobile-spacing));
  }
  
  .mobile-grid {
    grid-template-columns: 1fr;
  }
}

/* Landscape mode */
@media screen and (orientation: landscape) and (max-height: 500px) {
  /* Phones in landscape - minimize chrome */
  .mobile-nav {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: calc(60px + env(safe-area-inset-left));
    padding-left: env(safe-area-inset-left);
    flex-direction: column;
  }
  
  .mobile-header {
    display: none; /* Hide header in landscape on small screens */
  }
  
  .mobile-content {
    margin-left: calc(60px + env(safe-area-inset-left));
    padding-bottom: 0;
    max-height: 100vh;
    max-height: 100dvh;
    overflow-y: auto;
  }
  
  .mobile-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet landscape */
@media screen and (orientation: landscape) and (min-height: 501px) {
  .mobile-nav {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: clamp(200px, 25vw, 300px);
  }
  
  .mobile-content {
    margin-left: clamp(200px, 25vw, 300px);
  }
  
  .mobile-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

/* ============================================================================
   FOLDABLE DEVICE SUPPORT
   ============================================================================ */

/* Foldable phones - folded state */
@media screen and (min-width: 280px) and (max-width: 320px) {
  :root {
    --mobile-font-base: 12px;
    --mobile-spacing: 0.5rem;
  }
}

/* Foldable phones - unfolded state */
@media screen and (min-width: 700px) and (max-width: 900px) and (min-height: 500px) and (max-height: 600px) {
  /* Samsung Fold style devices */
  .mobile-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Spanning displays (dual screen) */
@media (horizontal-viewport-segments: 2) {
  .mobile-content {
    display: grid;
    grid-template-columns: env(viewport-segment-width 0 0) env(viewport-segment-width 1 0);
    column-gap: calc(env(viewport-segment-left 1 0) - env(viewport-segment-right 0 0));
  }
}

/* ============================================================================
   TOUCH & INTERACTION TARGETS
   ============================================================================ */

/* Ensure all interactive elements meet minimum touch target size */
button,
a,
input,
select,
textarea,
[role="button"],
[role="link"],
.clickable {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}

/* Adequate spacing between touch targets */
.touch-list > * + * {
  margin-top: 8px; /* Minimum 8px between targets per WCAG */
}

/* Disable hover effects on touch devices */
@media (hover: none) and (pointer: coarse) {
  .hover-effect:hover {
    transform: none;
    box-shadow: none;
  }
}

/* Enable hover effects only on devices with fine pointers */
@media (hover: hover) and (pointer: fine) {
  .hover-effect:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* ============================================================================
   SAFE AREA HANDLING (Notched devices, Dynamic Island)
   ============================================================================ */

.app-shell {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Fixed elements must account for safe areas */
.fixed-top {
  top: env(safe-area-inset-top);
}

.fixed-bottom {
  bottom: env(safe-area-inset-bottom);
}

.fixed-left {
  left: env(safe-area-inset-left);
}

.fixed-right {
  right: env(safe-area-inset-right);
}

/* ============================================================================
   PLATFORM-SPECIFIC ADJUSTMENTS
   ============================================================================ */

/* iOS-specific: Prevent text size adjustment */
@supports (-webkit-touch-callout: none) {
  html {
    -webkit-text-size-adjust: 100%;
  }
  
  /* Momentum scrolling */
  .scrollable {
    -webkit-overflow-scrolling: touch;
  }
  
  /* Disable tap highlight */
  * {
    -webkit-tap-highlight-color: transparent;
  }
}

/* Android-specific: Prevent overscroll glow */
@supports not (-webkit-touch-callout: none) {
  html {
    overscroll-behavior: none;
  }
}
```

### React Native / Expo Responsive Utilities

```javascript
// utils/responsive.js - For React Native projects
import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Responsive scaling
export const wp = (percentage) => (percentage / 100) * SCREEN_WIDTH;
export const hp = (percentage) => (percentage / 100) * SCREEN_HEIGHT;

export const scaleWidth = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const scaleHeight = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
export const moderateScale = (size, factor = 0.5) => size + (scaleWidth(size) - size) * factor;

// Font scaling with limits
export const scaledFontSize = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Device type detection
export const isTablet = () => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (SCREEN_WIDTH >= 768 || (aspectRatio < 1.6 && SCREEN_WIDTH >= 600));
};

export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;

// Orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    isLandscape() ? 'landscape' : 'portrait'
  );
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });
    return () => subscription?.remove();
  }, []);
  
  return orientation;
};

// Responsive styles hook
export const useResponsiveStyles = () => {
  const insets = useSafeAreaInsets();
  const orientation = useOrientation();
  const tablet = isTablet();
  
  return {
    insets,
    orientation,
    isTablet: tablet,
    isLandscape: orientation === 'landscape',
    containerPadding: tablet ? 24 : 16,
    fontSize: {
      xs: scaledFontSize(12),
      sm: scaledFontSize(14),
      md: scaledFontSize(16),
      lg: scaledFontSize(18),
      xl: scaledFontSize(24),
      xxl: scaledFontSize(32),
    },
    spacing: {
      xs: moderateScale(4),
      sm: moderateScale(8),
      md: moderateScale(16),
      lg: moderateScale(24),
      xl: moderateScale(32),
    },
    touchTarget: 44, // Minimum touch target size
  };
};
```

### Required PWA Manifest Settings

```json
{
  "name": "App Name",
  "short_name": "App",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## IMPLEMENTATION CHECKLIST

When creating any new development project, ALWAYS include:

### Startup Infrastructure
- [ ] `utils/portManager.js` or `utils/port_manager.py`
- [ ] `scripts/dev.js` with orchestrated startup
- [ ] Backend `/health` endpoint
- [ ] `package.json` with proper script configuration
- [ ] `runtime.config.json` generated at startup

### PWA Responsive (Web)
- [ ] Viewport meta tag with `viewport-fit=cover`
- [ ] CSS custom properties for fluid scaling
- [ ] Media queries for 1920px, 2560px, 3840px, 5120px, 7680px
- [ ] Orientation handlers (landscape/portrait)
- [ ] Container queries for component-level responsiveness
- [ ] Safe area inset handling

### Mobile (iOS/Android)
- [ ] Safe area inset handling
- [ ] Touch target minimums (44px)
- [ ] Orientation change handlers
- [ ] Responsive scaling utilities
- [ ] Platform-specific adjustments
- [ ] Foldable device support

### Testing Requirements
- [ ] Test at 1920×1080 (Full HD)
- [ ] Test at 2560×1440 (QHD)
- [ ] Test at 3840×2160 (4K)
- [ ] Test both orientations
- [ ] Test on iPhone SE (smallest iOS)
- [ ] Test on iPhone Pro Max (largest iOS)
- [ ] Test on small Android (360px width)
- [ ] Test on Android tablet
- [ ] Test orientation changes

---

## QUICK REFERENCE

### Port Ranges
- Backend: 8000-8999
- Frontend: 3000-3999
- Database: 5432 (Postgres), 27017 (MongoDB), 6379 (Redis)

### Breakpoints (Desktop)
- Full HD: 1920px
- QHD: 2560px
- 4K: 3840px
- 5K: 5120px
- 8K: 7680px

### Breakpoints (Mobile)
- Small phone: 320px
- Standard phone: 375px
- Large phone: 428px
- Tablet portrait: 768px
- Tablet landscape: 1024px
- Large tablet: 1366px

### Touch Targets
- Minimum: 44×44px (Apple HIG)
- Recommended: 48×48px (Material Design)
- Spacing between: 8px minimum
