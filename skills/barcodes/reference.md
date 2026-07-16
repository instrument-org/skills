# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `generate-barcode.ts` Generate a barcode or QR code image from text content

Exports:

- `generateBarcode({ content, format, outputPath, scale, }: { content: string; format?: string; outputPath?: string; scale?: number; }): Promise<{ outputPath: string; }>`
- `prepareBarcodeWriter(): Promise<void>`

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

## `read-barcode.ts` Read and decode barcodes or QR codes from an image file

Exports:

- `prepareBarcodeReader(): Promise<void>`
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
