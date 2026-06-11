---
name: sharp-images
description: "Pixel-level image manipulation with sharp. Use when the user wants to resize, crop, rotate, flip, convert format (png, jpeg, webp, avif, gif, tiff), compress, optimize file size, watermark, composite, annotate, adjust brightness/saturation/contrast/sharpness, blur, grayscale, or read image metadata."
---

# Images

Resize, crop, rotate, convert, composite, adjust, optimize, and inspect images using [sharp](https://sharp.pixelplumbing.com/).

For the complete Sharp API reference, see [references/REFERENCE.md](references/REFERENCE.md).

## Common workflows

### Resize and pad an image to a square canvas with exact margins

Use this when an image must fit inside a fixed-size square with controlled
white space on all sides.

**Margin formula:** `content_size = canvas_size x (1 - 2 x margin)`

Example: 1080 px canvas, 15% margin -> 1080 x 0.70 = **756 px**

**One-step -- image fills the full canvas (letterboxed if not square):**

```bash
cd skills/sharp-images && tsx scripts/resize.ts ../../user-provided/product.png \
  --width 1080 --height 1080 --fit contain --background white \
  --output ../../output/product-square.png
```

**Two-step -- explicit margin control (no external tools required):**

```bash
# 1. Scale to the content area (no background yet)
cd skills/sharp-images && tsx scripts/resize.ts ../../user-provided/product.png \
  --width 756 --height 756 --fit contain \
  --output ../../tmp/product-inner.png

# 2. Pad to full canvas size with background
cd skills/sharp-images && tsx scripts/resize.ts ../../tmp/product-inner.png \
  --width 1080 --height 1080 --fit contain --background white \
  --output ../../output/product-square.png
```

> Both steps use `resize` only -- no external tools needed. Adjust the numbers
> using the margin formula above for any canvas size and margin percentage.

## Scripts

{{GENERATED_SCRIPT_DOCS}}
