/**
 * Create an Excel or Apple Numbers spreadsheet from a JSON array of row objects
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import * as XLSX from "xlsx";
import XLSX_ZAHL_PAYLOAD from "xlsx/dist/xlsx.zahl";

function getWriteOptions(outputPath: string): XLSX.WritingOptions {
  const outputExt = extname(outputPath).toLowerCase();

  if (outputExt === ".numbers") {
    return {
      bookType: "numbers",
      compression: true,
      numbers: XLSX_ZAHL_PAYLOAD,
      type: "buffer",
    };
  }

  if (outputExt === ".xls") {
    return { bookType: "biff8", type: "buffer" };
  }

  if (outputExt === ".xlsx") {
    return { bookType: "xlsx", type: "buffer" };
  }

  throw new Error(
    `Unsupported output format: ${outputExt || "(none)"}. Supported: .numbers, .xlsx, .xls`,
  );
}

export async function createSpreadsheet({
  data,
  outputPath,
  sheetName = "Sheet1",
}: {
  data: Record<string, unknown>[];
  outputPath: string;
  sheetName?: string;
}) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, getWriteOptions(outputPath));
  await writeFile(outputPath, buffer);

  return { outputPath, sheetName, rowCount: data.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-spreadsheet");
  cli.usage(
    "--output <path> [--sheet <name>] [--data <json>] [--data-file <path>]",
  );
  cli.option("--output <path>", "Output spreadsheet path");
  cli.option("--sheet <name>", "Sheet name");
  cli.option("--data <json>", "Inline JSON array data");
  cli.option("--data-file <path>", "Path to JSON array data file");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);

  if (!options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  let data: Record<string, unknown>[];

  if (options["dataFile"]) {
    const raw = await readFile(resolve(options["dataFile"]), "utf-8");
    data = JSON.parse(raw);
  } else if (options.data) {
    data = JSON.parse(options.data);
  } else {
    console.error("Provide --data or --data-file");
    process.exit(1);
  }

  const result = await createSpreadsheet({
    data,
    outputPath: resolve(options.output),
    sheetName: options.sheet,
  });

  console.log(
    `Created ${relative(process.cwd(), result.outputPath) || "."} with ${result.rowCount} rows in sheet "${result.sheetName}"`,
  );
}
