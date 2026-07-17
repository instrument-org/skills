---
name: sharp-images
description: "Manipulate raster images with Sharp. Use when the user wants to resize, crop, rotate, flip, convert, compress, optimize, watermark, composite, annotate, adjust color or sharpness, blur, remove alpha, preserve metadata, process image batches, or inspect dimensions and format."
---

# Images

Use the supplied scripts for closed one-step operations. Write a Sharp pipeline
when the work combines transformations, processes a batch, generates overlays,
or needs exact control over encoding and metadata.

## Choose an approach

| Need                                                     | Approach                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| One resize, crop, rotation, conversion, or metadata read | Run the matching script                                    |
| Several transforms on one image                          | Compose one Sharp pipeline                                 |
| Batch conversion or generated overlays                   | Write custom TypeScript                                    |
| An uncommon option                                       | Consult the [Sharp API reference](references/REFERENCE.md) |

Node dependencies are isolated per loaded skill. Put custom TypeScript inside
the loaded skill package, then run it by full path from the task root. A custom
file elsewhere cannot import this skill's `sharp` dependency.

## Recipes

### Decode and encode only once

Save this as `<skill-path>/scripts/custom-process.ts`, then run
`tsx <skill-path>/scripts/custom-process.ts` from the task root.

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

`rotate()` without an angle applies EXIF orientation. Chaining avoids
intermediate files, repeated decoding, and extra lossy encodes.

### Build an exact canvas with percentage margins

This produces a 1080 px square with at least 15 percent whitespace on every
side. Non-square inputs receive additional whitespace along one axis.

```ts
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("output", { recursive: true });

const canvas = 1080;
const marginFraction = 0.15;
const padding = Math.round(canvas * marginFraction);
const content = canvas - padding * 2;
const background = "#ffffff";

await sharp("attachments/product.png")
  .rotate()
  .resize({
    background,
    fit: "contain",
    height: content,
    width: content,
  })
  .flatten({ background })
  .extend({
    background,
    bottom: padding,
    left: padding,
    right: padding,
    top: padding,
  })
  .png()
  .toFile("output/product-square.png");
```

### Process a batch with bounded concurrency

Sharp is efficient, but decoding many large images simultaneously can exhaust
memory. Keep a small worker pool.

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

Sharp's available codecs depend on its packaged native build. Inspect the
runtime instead of assuming an uncommon format is enabled.

```ts
import sharp from "sharp";

for (const [format, support] of Object.entries(sharp.format)) {
  console.log(format, { input: support.input, output: support.output });
}
```

If the requested format reports no output support, choose a supported format
or tell the user about the limitation. Do not silently change extensions.

## Traps

- Apply `rotate()` before geometry operations when EXIF orientation matters.
- Sharp strips metadata by default. Use `keepMetadata()`, `keepExif()`, or
  `keepIccProfile()` only when the output should preserve it.
- JPEG has no alpha channel. Use `flatten()` with an intentional background
  before encoding transparent input as JPEG.
- Animated and multi-page inputs default to one page. Open them with
  `{ animated: true }` and verify page count and frame timing.
- Do not write to the same path being read by a pipeline. Write a new file,
  verify it, then replace the original only when replacement is intended.
- Large dimensions can exceed memory or Sharp's input-pixel safety limit.
  Read metadata first and use bounded concurrency.
- A file extension does not enable a codec. Query `sharp.format` and inspect
  the actual output metadata.

## Verification

You do not know an image is right until you have opened the output and looked at
it. A script exiting cleanly is not verification.

- Open the result and inspect it for crop, padding, orientation, color,
  transparency, text, and compositing defects -- at full resolution for lossy
  output, not just a thumbnail.
- When the user gave a reference or a target framing, open it alongside the
  output and compare directly. Match it, do not estimate.
- Read output metadata and assert the expected format, dimensions, alpha, and
  page count, and confirm the file extension matches the encoded format.
- For a set that should vary (one per color, angle, or item), confirm the
  outputs actually differ. Identical bytes across items that should be distinct
  means the pipeline reprocessed one source, not that it succeeded.
- For batches, verify input and output counts and report skipped files.
- If you could not complete a check, say so; do not imply an inspection you did
  not run.

## Script index

Full command options and exported helper signatures are in
[`reference.md`](reference.md).

- `adjust.ts`: Adjust image color, brightness, blur, sharpen, and other visual properties
- `annotate.ts`: Draw labeled bounding box annotations on an image
- `composite.ts`: Overlay one image on top of another with configurable position and blend mode.
  Requires an existing file as the base image.
- `convert.ts`: Convert an image to a different format (jpeg, png, webp, avif, etc.)
- `crop.ts`: Crop an image to exact dimensions, with optional auto-crop strategy
- `get-metadata.ts`: Read format, dimensions, color space, and file size of an image
- `optimize.ts`: Re-encode an image to reduce file size while preserving format
- `resize.ts`: Resize an image to specified dimensions with configurable fit mode
- `rotate.ts`: Rotate or flip an image
