# PWA Icon Generation Guide

## Required Icons for PWA

The app currently references these icon files in `public/manifest.json` that need to be generated:

### PWA Icons (Required)
- `/icons/icon-72x72.png`
- `/icons/icon-96x96.png`
- `/icons/icon-128x128.png`
- `/icons/icon-144x144.png`
- `/icons/icon-152x152.png`
- `/icons/icon-192x192.png`
- `/icons/icon-384x384.png`
- `/icons/icon-512x512.png`

### Favicon Icons
- `/favicon.ico` (already exists)
- `/icons/icon-16x16.png`
- `/icons/icon-32x32.png`

### Apple Icons
- `/icons/apple-touch-icon-180x180.png`

### Additional Icons
- `/icons/safari-pinned-tab.svg`
- `/og-image.png` (1200x630 for social sharing)

## Generation Methods

### Option 1: Use PWA Icon Generator Tools
1. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
2. **Favicon.io**: https://favicon.io/favicon-generator/
3. **Real Favicon Generator**: https://realfavicongenerator.net/

### Option 2: Design Tools
1. Use the placeholder SVG in `/public/icons/icon-placeholder.svg` as a base
2. Create a 512x512 master icon in Figma/Sketch/Adobe Illustrator
3. Export all required sizes

### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick
# From a master 512x512 PNG file:
convert icon-512.png -resize 72x72 icons/icon-72x72.png
convert icon-512.png -resize 96x96 icons/icon-96x96.png
convert icon-512.png -resize 128x128 icons/icon-128x128.png
convert icon-512.png -resize 144x144 icons/icon-144x144.png
convert icon-512.png -resize 152x152 icons/icon-152x152.png
convert icon-512.png -resize 192x192 icons/icon-192x192.png
convert icon-512.png -resize 384x384 icons/icon-384x384.png
# Keep original 512x512
```

## Icon Design Guidelines

### Brand Colors
- Primary: #3b82f6 (Blue 500)
- Background: #ffffff (White)
- Text: #111827 (Gray 900)

### Design Elements
- Main icon: Credit card or subscription symbol
- App name: "SubWise" (optional on smaller sizes)
- Style: Modern, minimal, rounded corners
- Ensure good contrast for visibility

### Technical Requirements
- Format: PNG (for sizes), ICO (for favicon), SVG (for safari-pinned-tab)
- Color depth: 32-bit with alpha channel
- Purpose: "maskable any" (for Android adaptive icons)

## Current Status
- ❌ All PWA icons missing (app install will fail)
- ✅ Basic favicon exists
- ❌ Social sharing image missing
- ✅ Placeholder SVG available as design template

## Priority
**HIGH PRIORITY**: Generate at minimum the core PWA icons (192x192, 512x512) for basic PWA functionality.
