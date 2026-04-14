/**
 * Generate a barcode or QR code image from text content
 * @note The image format is always PNG. Use --format to produce any supported barcode type (e.g. QRCode, Code128, DataMatrix, Aztec, EAN13). Defaults to QRCode.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import {
  prepareZXingModule,
  writeBarcode,
  type WriteInputBarcodeFormat,
} from "zxing-wasm/writer";

const _require = createRequire(import.meta.url);

async function loadWasm() {
  const wasmPath = _require.resolve("zxing-wasm/writer/zxing_writer.wasm");
  const wasmBinary = (await readFile(wasmPath)).buffer as ArrayBuffer;
  await prepareZXingModule({
    overrides: { wasmBinary },
    fireImmediately: true,
  });
}

export async function generateBarcode({
  content,
  format = "QRCode",
  outputPath = "barcode.png",
  scale = 4,
}: {
  content: string;
  format?: string;
  outputPath?: string;
  scale?: number;
}) {
  await loadWasm();
  const result = await writeBarcode(content, {
    format: format as WriteInputBarcodeFormat,
    scale,
  });
  if (result.error) {
    throw new Error(`Failed to generate barcode: ${result.error}`);
  }
  if (!result.image) {
    throw new Error("No image output from barcode generator");
  }
  const buffer = Buffer.from(await result.image.arrayBuffer());
  const resolvedOutput = resolve(outputPath);
  await writeFile(resolvedOutput, buffer);
  return { outputPath: resolvedOutput };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("generate-barcode");
  cli.usage("<content> [options]");
  cli.option(
    "--format <name>",
    "Barcode format (e.g. QRCode, Code128, DataMatrix, Aztec, EAN13)",
    { default: "QRCode" },
  );
  cli.option("--output <path>", "Output PNG file path", {
    default: "barcode.png",
  });
  cli.option("--scale <n>", "Pixel scale factor", { default: 4 });
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await generateBarcode({
    content: args[0],
    format: options.format as string,
    outputPath: resolve(options.output as string),
    scale: Number(options.scale),
  });

  const rel = relative(process.cwd(), result.outputPath) || ".";
  console.log(`Saved to ${rel}`);
}
