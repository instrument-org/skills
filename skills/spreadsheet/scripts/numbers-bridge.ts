/**
 * Convert Apple Numbers and legacy XLS files through SheetJS.
 * @note Use this compatibility bridge only for `.numbers` or `.xls` files. The Python scripts handle XLSX, XLSM, CSV, and TSV.
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import * as XLSX from "xlsx";
import XLSX_ZAHL_PAYLOAD from "xlsx/dist/xlsx.zahl";

const SUPPORTED_OUTPUT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".numbers",
  ".xlsx",
]);

function normalizeNumber(value: unknown) {
  if (typeof value !== "number") return value;

  const nearestInteger = Math.round(value);
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value));
  return Math.abs(value - nearestInteger) <= tolerance ? nearestInteger : value;
}

function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeNumber(value)]),
  );
}

function getWorksheet({
  workbook,
  sheetName,
}: {
  workbook: XLSX.WorkBook;
  sheetName?: string;
}) {
  const selectedSheet = sheetName ?? workbook.SheetNames[0];
  if (!selectedSheet) {
    throw new Error("Input spreadsheet has no sheets");
  }

  const worksheet = workbook.Sheets[selectedSheet];
  if (!worksheet) {
    throw new Error(
      `Sheet "${selectedSheet}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`,
    );
  }
  return worksheet;
}

/** Convert a Numbers or legacy XLS file to a supported output format. */
export async function convertNumbers({
  inputPath,
  outputPath,
  sheetName,
}: {
  inputPath: string;
  outputPath: string;
  sheetName?: string;
}) {
  const outputExtension = extname(outputPath).toLowerCase();
  if (!SUPPORTED_OUTPUT_EXTENSIONS.has(outputExtension)) {
    throw new Error(
      `Unsupported output format: ${outputExtension || "(none)"}. Supported: .csv, .json, .numbers, .xlsx`,
    );
  }

  const workbook = XLSX.read(await readFile(inputPath));

  if (outputExtension === ".numbers") {
    await writeFile(
      outputPath,
      XLSX.write(workbook, {
        bookType: "numbers",
        compression: true,
        numbers: XLSX_ZAHL_PAYLOAD,
        type: "buffer",
      }),
    );
  } else {
    const worksheet = getWorksheet({ workbook, sheetName });
    if (outputExtension === ".csv") {
      await writeFile(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf-8");
    } else if (outputExtension === ".json") {
      const rows = XLSX.utils
        .sheet_to_json<Record<string, unknown>>(worksheet, { defval: null })
        .map(normalizeRow);
      await writeFile(outputPath, JSON.stringify(rows, null, 2), "utf-8");
    } else {
      await writeFile(
        outputPath,
        XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }),
      );
    }
  }

  return { inputPath, outputPath, sheetName };
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  const cli = cac("numbers-bridge");
  cli.usage("<input.numbers|input.xls> --output <path> [--sheet <name>]");
  cli.option("--output <path>", "Output .csv, .json, .numbers, or .xlsx path");
  cli.option("--sheet <name>", "Sheet to export for CSV or JSON output");
  cli.help();
  const parsed = cli.parse();
  if (parsed.options.help) process.exit(0);

  const [inputFile] = parsed.args;
  if (!inputFile || !parsed.options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await convertNumbers({
    inputPath: resolve(inputFile),
    outputPath: resolve(parsed.options.output),
    sheetName: parsed.options.sheet,
  });
  console.log(
    `Converted ${relative(process.cwd(), result.inputPath) || "."} -> ${relative(process.cwd(), result.outputPath) || "."}`,
  );
}
