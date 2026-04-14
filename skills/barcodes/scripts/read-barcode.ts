/**
 * Read and decode barcodes or QR codes from an image file
 * @note Supports all common formats automatically: QR Code, DataMatrix, Aztec, Code128, EAN, UPC, PDF417, and more. Pass --formats to restrict detection to specific types.
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import {
  prepareZXingModule,
  readBarcodes,
  type ReadInputBarcodeFormat,
} from "zxing-wasm/reader";

const _require = createRequire(import.meta.url);

async function loadWasm() {
  const wasmPath = _require.resolve("zxing-wasm/reader/zxing_reader.wasm");
  const wasmBinary = (await readFile(wasmPath)).buffer as ArrayBuffer;
  await prepareZXingModule({
    overrides: { wasmBinary },
    fireImmediately: true,
  });
}

export async function readBarcode({
  imagePath,
  formats,
  limit = 1,
}: {
  formats?: string[];
  imagePath: string;
  limit?: number;
}) {
  await loadWasm();
  const imageBytes = await readFile(imagePath);
  const results = await readBarcodes(
    imageBytes,
    formats && formats.length > 0
      ? { formats: formats as ReadInputBarcodeFormat[] }
      : undefined,
  );
  const valid = results.filter((r) => r.isValid);
  const capped = limit > 0 ? valid.slice(0, limit) : valid;
  return capped.map((r) => ({ format: r.format, text: r.text }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("read-barcode");
  cli.usage("<imagePath> [options]");
  cli.option(
    "--formats <list>",
    "Comma-separated barcode formats to look for (e.g. QRCode,DataMatrix)",
  );
  cli.option("--limit <n>", "Max number of barcodes to return, 0 for all", {
    default: 1,
  });
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const formats = options.formats
    ? (options.formats as string).split(",").map((f) => f.trim())
    : undefined;

  const results = await readBarcode({
    formats,
    imagePath: resolve(args[0]),
    limit: Number(options.limit),
  });

  if (results.length === 0) {
    console.log("No barcode found.");
  } else {
    for (const r of results) {
      console.log(`${r.format}: ${r.text}`);
    }
  }
}
