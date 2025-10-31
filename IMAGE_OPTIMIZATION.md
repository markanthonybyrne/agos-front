# Image Optimization Setup

## Compression Plugin

The project has `vite-plugin-imagemin` installed but **disabled by default** due to the large number of image assets (~100MB+) causing build hangs.

## Build Process

**Normal builds (no compression):**
```bash
npm run build
npm run build:staging
npm run build:fast          # Explicitly skip compression
npm run build:fast:staging   # Explicitly skip compression
```

**Builds WITH compression (if you want to enable it):**
```bash
ENABLE_IMAGE_COMPRESSION=true npm run build
```

⚠️ **Warning**: Enabling compression may cause builds to hang or take a very long time due to the large image assets (ships, facilities, defenses folders are 18MB+ each).

## Compression Settings (when enabled)

- **JPEG images**: Compressed to 75% quality using mozjpeg
- **PNG images**: Compressed using pngquant with quality range 0.8-0.9 at fastest speed
- **WebP conversion**: Disabled for faster builds
- **SVG optimization**: Removes unnecessary attributes while preserving quality

## Expected Results

- JPEG files: ~30-50% size reduction
- PNG files: ~40-60% size reduction  
- Overall: Significant reduction in bundle size and faster page loads

## Lazy Loading

Many images in lists and grids use the native `loading="lazy"` attribute to defer loading until they're about to enter the viewport.

## Manual Optimization (Optional)

For even better compression before committing images, you can use:
- [TinyPNG](https://tinypng.com/) - Online PNG/JPEG compressor
- [Squoosh](https://squoosh.app/) - Advanced image compression tool
- [ImageOptim](https://imageoptim.com/) - Desktop app for batch optimization

