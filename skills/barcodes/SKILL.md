---
name: barcodes
description: "Read barcodes and QR codes from images, or generate barcode and QR code assets. Use when the user wants to scan a screenshot or photo, decode a URL or identifier, read a Wi-Fi or meeting QR code, create a printable code, locate multiple codes, or inspect barcode metadata. Supports common linear and matrix formats through zxing-wasm."
---

# Barcodes

Use the supplied scripts for ordinary one-code scans and PNG generation. Write TypeScript against `zxing-wasm` when the task needs SVG, full scan metadata, recovery options, multiple symbols, or format-specific controls.

## Choose an approach

| Need                                                           | Approach                  |
| -------------------------------------------------------------- | ------------------------- |
| Decode one clear code                                          | Run `read-barcode.ts`     |
| Generate a standard PNG                                        | Run `generate-barcode.ts` |
| Print-quality SVG or custom error correction                   | Use the writer API        |
| Positions, orientation, raw bytes, or damaged-code diagnostics | Use the reader API        |

Node dependencies are isolated per loaded skill. Put custom TypeScript inside the loaded skill package, then run it by full path from the task root. A custom file elsewhere cannot import this skill's `zxing-wasm` dependency.

Common formats include `QRCode`, `Code128`, `Code39`, `DataMatrix`, `Aztec`, `PDF417`, `EAN13`, `EAN8`, `UPCA`, `UPCE`, `ITF`, `ITF14`, and `DataBar`. Format-specific capacity, checksum, and character rules still apply.

## Recipes

### Generate vector and raster versions

Save this as `<skill-path>/scripts/custom-generate.ts`, then run `tsx <skill-path>/scripts/custom-generate.ts` from the task root.

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { writeBarcode } from "zxing-wasm/writer";
import { prepareBarcodeWriter } from "./generate-barcode.ts";

await prepareBarcodeWriter();
await mkdir("output", { recursive: true });

const payload = "https://example.com/check-in";
const result = await writeBarcode(payload, {
  addQuietZones: true,
  format: "QRCode",
  options: "ecLevel=H",
  scale: 8,
});

if (result.error || !result.image || !result.svg) {
  throw new Error(result.error || "Barcode writer returned no image");
}

await Promise.all([
  writeFile("output/check-in.svg", result.svg),
  writeFile(
    "output/check-in.png",
    Buffer.from(await result.image.arrayBuffer()),
  ),
]);
```

SVG is preferable for print and document composition. Keep the PNG for visual inspection and round-trip decoding.

### Decode every code with positions

Save this as `<skill-path>/scripts/custom-read.ts` so package imports resolve.

<!-- cspell:ignore tryDenoise -->

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readBarcodes } from "zxing-wasm/reader";
import { prepareBarcodeReader } from "./read-barcode.ts";

await prepareBarcodeReader();
await mkdir("output", { recursive: true });

const bytes = await readFile("attachments/codes.png");
const results = await readBarcodes(bytes, {
  maxNumberOfSymbols: 0,
  returnErrors: true,
  tryDenoise: true,
  tryHarder: true,
  tryInvert: true,
  tryRotate: true,
});

const report = results.map((result) => ({
  error: result.error || null,
  format: result.format,
  inverted: result.isInverted,
  mirrored: result.isMirrored,
  orientation: result.orientation,
  position: result.position,
  text: result.text,
  valid: result.isValid,
}));

await writeFile("output/barcodes.json", JSON.stringify(report, null, 2));
```

Restrict `formats` when the expected type is known. It reduces false positives and can make difficult scans faster.

### Build a Wi-Fi QR payload safely

The barcode writer encodes the exact string it receives. Escape structured payload values before composing them.

```ts
const escapeWifi = (value: string) => value.replace(/([\\;,":])/g, "\\$1");

const payload = [
  "WIFI:",
  `T:${escapeWifi("WPA")};`,
  `S:${escapeWifi("Studio;Guest")};`,
  `P:${escapeWifi("correct,horse:battery")};`,
  ";",
].join("");
```

Do not log passwords or other sensitive payloads. Round-trip decoding proves the encoded text, not that another application accepts the protocol syntax.

## Traps

- Preserve a quiet zone and strong foreground/background contrast.
- Do not resize a raster barcode with smoothing. Generate it at an integer module scale or use SVG.
- Linear formats may require digits, fixed lengths, or valid checksums.
- A clean generated image is not representative of a skewed or blurred photo. Try rotation, inversion, noise reduction, cropping, or a separate image cleanup.
- The upstream writer API is less stable than the reader API. Keep writer options local and verify after dependency upgrades.
- `read-barcode.ts` intentionally returns only text and format. Use the reader recipe when location or diagnostics matter.

## Verification

- Decode every generated raster and compare the result to the exact payload.
- Inspect the PNG or SVG for clipping, missing quiet zones, and low contrast.
- For print, test at the intended physical size instead of relying on preview.
- For photographs, verify the reported position encloses the visible code.
- Treat invalid results and checksum errors as failures, not partial success.

## Script index

Full command options and exported helper signatures are in [`reference.md`](reference.md).

- `generate-barcode.ts`: Generate a barcode or QR code image from text content
- `read-barcode.ts`: Read and decode barcodes or QR codes from an image file
