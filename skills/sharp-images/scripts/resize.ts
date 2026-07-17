/**
 * Resize an image to specified dimensions with configurable fit mode
 * @note If neither --width nor --height is provided, the script prints image metadata instead of resizing.
 * @note `--fit contain` scales the image to fit within the target dimensions and pads the remainder with background color. `--fit cover` fills the target dimensions by cropping.
 * @note `--background` only fills the padding area added by `contain` -- it does not remove the source image's existing background. For background removal a separate tool is needed.
 * @note Output format follows the output file extension. Transparent input written to a format without alpha (e.g. `.jpg`) is flattened onto `--background` (default white), not left to turn black.
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import sharp from "sharp";
import type { FitEnum } from "sharp";

type Fit = keyof FitEnum;

type OutputFormat = "avif" | "gif" | "jpeg" | "png" | "tiff" | "webp";

const VALID_FITS = new Set<Fit>([
  "contain",
  "cover",
  "fill",
  "inside",
  "outside",
]);

const FORMAT_BY_EXTENSION: Record<string, OutputFormat> = {
  ".avif": "avif",
  ".gif": "gif",
  ".jpeg": "jpeg",
  ".jpg": "jpeg",
  ".png": "png",
  ".tif": "tiff",
  ".tiff": "tiff",
  ".webp": "webp",
};

// Formats without an alpha channel: transparent input must be flattened onto a
// background before encoding, or Sharp drops the transparency to black.
const OPAQUE_FORMATS = new Set<OutputFormat>(["jpeg"]);

export async function resizeImage({
  inputPath,
  outputPath,
  width,
  height,
  fit = "cover",
  withoutEnlargement,
  background,
  kernel,
  position,
}: {
  background?: string;
  fit?: Fit;
  height?: number;
  inputPath: string;
  kernel?:
    | "cubic"
    | "lanczos2"
    | "lanczos3"
    | "linear"
    | "mitchell"
    | "nearest";
  outputPath: string;
  position?: string;
  width?: number;
  withoutEnlargement?: boolean;
}) {
  const buffer = await readFile(inputPath);
  let pipeline = sharp(buffer).resize({
    background,
    fit,
    height,
    kernel,
    position,
    width,
    withoutEnlargement,
  });

  // Encode to the format named by the output extension. Without this Sharp
  // keeps the input format and silently writes, e.g., PNG bytes into a `.jpg`
  // file -- so a transparent PNG "saved as JPEG" stays a transparent PNG.
  const format = FORMAT_BY_EXTENSION[extname(outputPath).toLowerCase()];
  if (format) {
    if (OPAQUE_FORMATS.has(format)) {
      pipeline = pipeline.flatten({ background: background ?? "#ffffff" });
    }
    pipeline = pipeline.toFormat(format);
  }

  const resized = await pipeline.toBuffer({ resolveWithObject: true });

  await writeFile(outputPath, resized.data);

  return {
    bytes: resized.data.byteLength,
    fit,
    height: resized.info.height,
    outputPath,
    width: resized.info.width,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("resize");
  cli.usage("photo.jpg --width 800 --height 600 --output resized.jpg");
  cli.option("--width <px>", "Target width in pixels");
  cli.option("--height <px>", "Target height in pixels");
  cli.option("--fit <mode>", "Resize fit mode", { default: "cover" });
  cli.option("--output <path>", "Output image path");
  cli.option("--background <color>", "Background color for contain fit");
  cli.option("--kernel <kernel>", "Resize kernel");
  cli.option("--no-enlarge", "Prevent upscaling smaller inputs");
  cli.option("--position <position>", "Gravity/crop position");
  cli.help();
  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  if (!args[0]) {
    cli.outputHelp();
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const width = options.width ? Number(options.width) : undefined;
  const height = options.height ? Number(options.height) : undefined;

  if (!width && !height) {
    const metadata = await sharp(inputPath).metadata();
    console.log(JSON.stringify(metadata, null, 2));
    process.exit(0);
  }

  const fit = options.fit as string;
  if (!VALID_FITS.has(fit as Fit)) {
    throw new Error(
      `Invalid fit mode "${fit}". Valid: ${[...VALID_FITS].join(", ")}`,
    );
  }

  const parsed = parse(inputPath);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(parsed.dir, `${parsed.name}-resized${parsed.ext}`);

  const result = await resizeImage({
    background: options.background,
    fit: fit as Fit,
    height,
    inputPath,
    kernel: options.kernel as "lanczos3" | undefined,
    outputPath,
    position: options.position,
    width,
    withoutEnlargement: options.noEnlarge,
  });
  const displayOutput = options.output ?? `${parsed.name}-resized${parsed.ext}`;
  console.log(
    `Resized → ${displayOutput} (${result.width}×${result.height}, ${result.fit}, ${result.bytes} bytes)`,
  );
}
