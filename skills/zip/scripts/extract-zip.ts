/**
 * Extract all files from a ZIP archive
 * @note If --output is not specified, files are extracted into a directory named after the zip file (without the .zip extension) in the same location as the archive.
 */
import { lstatSync } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import AdmZip from "adm-zip";

export function extractZip({
  inputPath,
  outputDir,
  overwrite = false,
}: {
  inputPath: string;
  outputDir?: string;
  overwrite?: boolean;
}) {
  const resolvedInput = resolve(inputPath);
  const targetDir =
    outputDir !== undefined
      ? resolve(outputDir)
      : resolve(dirname(resolvedInput), basename(resolvedInput, ".zip"));

  const targetStat = lstatSync(targetDir, { throwIfNoEntry: false });
  if (targetStat?.isSymbolicLink()) {
    throw new Error(`Unsafe extraction root is a symbolic link: ${targetDir}`);
  }
  if (!overwrite && targetStat !== undefined) {
    throw new Error(`Output directory already exists: ${targetDir}`);
  }

  const zip = new AdmZip(resolvedInput);
  for (const entry of zip.getEntries()) {
    const portableName = entry.entryName.replaceAll("\\", "/");
    const destination = resolve(targetDir, ...portableName.split("/"));
    const relativeDestination = relative(targetDir, destination);
    const isDrivePath = /^[A-Za-z]:\//.test(portableName);
    if (
      portableName.startsWith("/") ||
      portableName.startsWith("//") ||
      isDrivePath ||
      relativeDestination === ".." ||
      relativeDestination.startsWith(`..${sep}`) ||
      isAbsolute(relativeDestination)
    ) {
      throw new Error(`Unsafe archive member path: ${entry.entryName}`);
    }

    let existingPath = targetDir;
    for (const part of portableName.split("/").filter(Boolean)) {
      existingPath = join(existingPath, part);
      const stat = lstatSync(existingPath, { throwIfNoEntry: false });
      if (stat === undefined) {
        break;
      }
      if (stat.isSymbolicLink()) {
        throw new Error(
          `Unsafe archive member path through symlink: ${entry.entryName}`,
        );
      }
    }
  }

  zip.extractAllTo(targetDir, overwrite);

  const entries = zip.getEntries();
  const extractedFiles = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName);

  return {
    outputDir: targetDir,
    files: extractedFiles,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("extract-zip");
  cli.usage("<zipfile> [--output <dir>]");
  cli.option("--output <dir>", "Output directory for extracted files");
  cli.option("--overwrite", "Allow replacing files in the output directory");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [zipFile] = parsed.args;

  if (!zipFile) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = extractZip({
    inputPath: zipFile,
    outputDir: options.output,
    overwrite: options.overwrite,
  });

  const relOutput = result.outputDir;
  console.log(`Extracted to ${relOutput}:`);
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
}
