---
name: sharp-images
description: "Manipulate raster images with Sharp. Use when the user wants to resize, crop, rotate, flip, convert, compress, optimize, watermark, composite, annotate, adjust color or sharpness, blur, remove alpha, preserve metadata, process image batches, or inspect dimensions and format."
---

# Images

Use the supplied scripts for closed one-step operations. Write a Sharp pipeline when the work combines transformations, processes a batch, generates overlays, or needs exact control over encoding and metadata.

## Choose an approach

| Need                                                     | Approach                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| One resize, crop, rotation, conversion, or metadata read | Run the matching script                                    |
| Several transforms on one image                          | Compose one Sharp pipeline                                 |
| Batch conversion or generated overlays                   | Write custom TypeScript                                    |
| An uncommon option                                       | Consult the [Sharp API reference](references/REFERENCE.md) |

Node dependencies are isolated per loaded skill. Put custom TypeScript inside the loaded skill package, then run it by full path from the task root. A custom file elsewhere cannot import this skill's `sharp` dependency.

## Recipes

### Decode and encode only once

Save this as `<skill-path>/scripts/custom-process.ts`, then run `tsx <skill-path>/scripts/custom-process.ts` from the task root.

```ts
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("output", { recursive: true });

const result = await sharp("attachments/photo.jpg", { failOn: "warning" })
  .rotate()
  .resize({
    fit: "inside",
    height: 1200,
    width: 1200,
    withoutEnlargement: true,
  })
  .flatten({ background: "#ffffff" })
  .jpeg({ mozjpeg: true, quality: 84 })
  .toFile("output/photo-ready.jpg");

console.log(result);
```

`rotate()` without an angle applies EXIF orientation. Chaining avoids intermediate files, repeated decoding, and extra lossy encodes.

### Put a product on a clean white background

The most common request. Choose the path before writing code:

- Subject already isolated on white or transparent (most catalog and product photos): do not remove the background. Flatten and pad with the canvas recipe below. Re-segmenting a clean image only adds edge halos and color fringing.
- Subject on a busy or multi-object background: cut it out first with the `local-ml` skill (prefer a BiRefNet model for hair or fine edges), then pad the returned PNG with the canvas recipe below.

The canvas recipe flattens transparency onto the background, so a cut-out PNG lands on solid white with no checkerboard. To place an existing image on white without changing its geometry, use `flatten({ background: "#ffffff" })` alone.

### Center a subject on white with matched whitespace

`fit: "contain"` scales the whole file, so a cutout that already carries its own transparent or white padding keeps it and your margin will not match a reference. Trim to the subject first, then pad. To match a reference exactly, measure its subject the same way (`trim` on its background color) and reuse that fraction as `marginFraction`.

```ts
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("output", { recursive: true });

const canvas = 1080;
const marginFraction = 0.15; // whitespace on the subject's longest axis
const content = Math.round(canvas * (1 - marginFraction * 2));
const padding = Math.round((canvas - content) / 2);
const background = "#ffffff";

// Trim the transparent (or uniform) border down to the subject's real box.
const subject = await sharp("attachments/product.png")
  .rotate()
  .trim()
  .toBuffer();

await sharp(subject)
  .resize({ background, fit: "contain", height: content, width: content })
  .flatten({ background })
  .extend({
    background,
    bottom: padding,
    left: padding,
    right: padding,
    top: padding,
  })
  .jpeg({ chromaSubsampling: "4:4:4", mozjpeg: true, quality: 90 })
  .toFile("output/product-square.jpg");
```

`trim()` on a transparent cutout removes fully clear margins; on an opaque source pass `trim({ background: "#ffffff" })`. A baked soft shadow is semi-transparent, so `trim` keeps it and `flatten` renders it gray -- see Traps to drop it when the brief says no shadow.

### Process a batch with bounded concurrency

Sharp is efficient, but decoding many large images simultaneously can exhaust memory. Keep a small worker pool.

```ts
import { mkdir, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";

const inputDir = "attachments/photos";
const outputDir = "output/photos";
await mkdir(outputDir, { recursive: true });
const names = (await readdir(inputDir)).filter((name) =>
  [".jpg", ".jpeg", ".png", ".webp"].includes(extname(name).toLowerCase()),
);

async function worker(queue: string[]) {
  while (queue.length > 0) {
    const name = queue.shift();
    if (!name) return;
    await sharp(join(inputDir, name))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outputDir, `${name}.webp`));
  }
}

const queue = [...names];
await Promise.all(Array.from({ length: 3 }, () => worker(queue)));
```

### Check codec support at runtime

Sharp's available codecs depend on its packaged native build. Inspect the runtime instead of assuming an uncommon format is enabled.

```ts
import sharp from "sharp";

for (const [format, support] of Object.entries(sharp.format)) {
  console.log(format, { input: support.input, output: support.output });
}
```

If the requested format reports no output support, choose a supported format or tell the user about the limitation. Do not silently change extensions.

### Verify a flat background numerically

Opening the result matters, but model vision is unreliable for flat color and whitespace: it both misses a real halo and reports one that is not there. For those checks, assert in code -- corners and a below-subject sample must be pure white, and the output must carry no alpha.

```ts
import sharp from "sharp";

const { data, info } = await sharp("output/product-square.jpg")
  .raw()
  .toBuffer({ resolveWithObject: true });
const px = (x: number, y: number) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]] as const;
};
const samples = [
  px(2, 2),
  px(info.width - 3, 2),
  px(2, info.height - 3),
  px(info.width - 3, info.height - 3),
  px(info.width >> 1, info.height - 3),
];
const clean = samples.every(([r, g, b]) => r === 255 && g === 255 && b === 255);
console.log({ channels: info.channels, clean, samples });
if (!clean || info.channels === 4) {
  throw new Error("background is not clean opaque white");
}
```

## Traps

- Apply `rotate()` before geometry operations when EXIF orientation matters.
- Sharp strips metadata by default. Use `keepMetadata()`, `keepExif()`, or `keepIccProfile()` only when the output should preserve it.
- JPEG has no alpha channel. Use `flatten()` with an intentional background before encoding transparent input as JPEG.
- Animated and multi-page inputs default to one page. Open them with `{ animated: true }` and verify page count and frame timing.
- Do not write to the same path being read by a pipeline. Write a new file, verify it, then replace the original only when replacement is intended.
- Large dimensions can exceed memory or Sharp's input-pixel safety limit. Read metadata first and use bounded concurrency.
- A file extension does not enable a codec. Query `sharp.format` and inspect the actual output metadata.
- A source's extension can lie about its real format and alpha; a CDN image may serve PNG-with-alpha under a `.jpg` name. Read metadata for the real `format` and `hasAlpha` before flattening or encoding.
- `fit: "contain"` frames the whole file, not the subject. A cutout's own padding then inflates the margin. `trim()` to the subject box first when whitespace must match a target.
- A semi-transparent baked shadow flattens to gray. When the brief says no shadow, binarize the alpha to 0 or 255 before `flatten` (threshold the extracted alpha channel, or zero every alpha below a cutoff in a raw pass), then trim and flatten.

## Verification

You do not know an image is right until you have opened the output and looked at it. A script exiting cleanly is not verification.

- Open the result and inspect it for crop, padding, orientation, color, transparency, text, and compositing defects -- at full resolution for lossy output, not just a thumbnail.
- When the user gave a reference or a target framing, open it alongside the output and compare directly. Match it, do not estimate.
- Read output metadata and assert the expected format, dimensions, alpha, and page count, and confirm the file extension matches the encoded format.
- Confirm flat backgrounds and exact margins numerically (sample corner and below-subject pixels; check the channel count), not by eye alone.
- For a set that should vary (one per color, angle, or item), confirm the outputs actually differ. Identical bytes across items that should be distinct means the pipeline reprocessed one source, not that it succeeded.
- For batches, verify input and output counts and report skipped files.
- If you could not complete a check, say so; do not imply an inspection you did not run.

## Script index

Full command options and exported helper signatures are in [`reference.md`](reference.md).

{{GENERATED_SCRIPT_INDEX}}
