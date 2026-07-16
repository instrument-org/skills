/**
 * Create a ZIP archive from files or directories
 */
import { existsSync, lstatSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import AdmZip from "adm-zip";

export function createZip({
  outputPath,
  inputPaths,
  overwrite = false,
}: {
  outputPath: string;
  inputPaths: readonly string[];
  overwrite?: boolean;
}) {
  const resolvedOutput = resolve(outputPath);
  if (!overwrite && existsSync(resolvedOutput)) {
    throw new Error(`Output already exists: ${resolvedOutput}`);
  }

  const zip = new AdmZip();

  for (const inputPath of inputPaths) {
    const resolved = resolve(inputPath);
    const stat = lstatSync(resolved);

    if (stat.isDirectory()) {
      zip.addLocalFolder(resolved, basename(resolved));
    } else {
      zip.addLocalFile(resolved);
    }
  }

  zip.writeZip(resolvedOutput);

  const entries = zip.getEntries();
  return {
    outputPath: resolvedOutput,
    entryCount: entries.length,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-zip");
  cli.usage("--output <path> <input...>");
  cli.option("--output <path>", "Output ZIP file path");
  cli.option("--overwrite", "Replace an existing output archive");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const positionals = parsed.args;

  if (!options.output || positionals.length === 0) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = createZip({
    outputPath: options.output,
    inputPaths: positionals,
    overwrite: options.overwrite,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${relOutput} (${result.entryCount} entries)`);
}
