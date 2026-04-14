---
name: barcodes
description: "Read barcodes and QR codes from image files, or generate barcode/QR code PNG images. Use when the user wants to: scan a QR code from a screenshot or photo, decode a barcode to extract a URL/text/identifier, read a Wi-Fi QR code or meeting link, or create a QR code or barcode image from text. Supports all common formats: QRCode, DataMatrix, Aztec, Code128, EAN13, UPC, PDF417, and more."
---

# Barcodes

Read barcodes from image files or generate barcode images. No image processing libraries needed — pass image files directly.

## Supported formats

Common readable/writable formats: `QRCode`, `Code128`, `Code39`, `DataMatrix`, `Aztec`, `PDF417`, `EAN13`, `EAN8`, `UPCA`, `UPCE`, `ITF`, `ITF14`, `DataBar`. Meta-formats like `AllLinear`, `AllMatrix`, and `All` work in `--formats` too.

## Scripts

### `generate-barcode.ts` Generate a barcode or QR code image from text content

Exports:

- `generateBarcode({ content, format, outputPath, scale, }: { content: string; format?: string; outputPath?: string; scale?: number; }): Promise<{ outputPath: string; }>`

```text
generate-barcode

Usage:
  $ generate-barcode <content> [options]

Options:
  --format <name>  Barcode format (e.g. QRCode, Code128, DataMatrix, Aztec, EAN13) (default: QRCode)
  --output <path>  Output PNG file path (default: barcode.png)
  --scale <n>      Pixel scale factor (default: 4)
  -h, --help       Display this message
```

> [!NOTE]
> The image format is always PNG. Use --format to produce any supported barcode type (e.g. QRCode, Code128, DataMatrix, Aztec, EAN13). Defaults to QRCode.

### `read-barcode.ts` Read and decode barcodes or QR codes from an image file

Exports:

- `readBarcode({ imagePath, formats, limit, }: { formats?: string[]; imagePath: string; limit?: number; }): Promise<{ format: ReadOutputBarcodeFormat; text: string; }[]>`

```text
read-barcode

Usage:
  $ read-barcode <imagePath> [options]

Options:
  --formats <list>  Comma-separated barcode formats to look for (e.g. QRCode,DataMatrix)
  --limit <n>       Max number of barcodes to return, 0 for all (default: 1)
  -h, --help        Display this message
```

> [!NOTE]
> Supports all common formats automatically: QR Code, DataMatrix, Aztec, Code128, EAN, UPC, PDF417, and more. Pass --formats to restrict detection to specific types.
