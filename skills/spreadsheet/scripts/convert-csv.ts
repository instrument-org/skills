/**
 * Convert between CSV and spreadsheet formats (Apple Numbers, XLSX, and XLS)
 */
import { readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import * as XLSX from "xlsx";
import XLSX_ZAHL_PAYLOAD from "xlsx/dist/xlsx.zahl";

const SPREADSHEET_EXTENSIONS = [".numbers", ".xls", ".xlsx"];

function getWriteOptions(outputExt: string): XLSX.WritingOptions {
  if (outputExt === ".numbers") {
    return {
      bookType: "numbers",
      compression: true,
      numbers: XLSX_ZAHL_PAYLOAD,
      type: "buffer",
    };
  }

  return {
    bookType: outputExt === ".xls" ? "biff8" : "xlsx",
    type: "buffer",
  };
}

export async function convertCsv({
  inputPath,
  outputPath,
  sheetName,
}: {
  inputPath: string;
  outputPath: string;
  sheetName?: string;
}) {
  const inputExt = extname(inputPath).toLowerCase();
  const outputExt = extname(outputPath).toLowerCase();
  const buffer = await readFile(inputPath);
  const workbook = XLSX.read(buffer);

  if (inputExt === ".csv" && SPREADSHEET_EXTENSIONS.includes(outputExt)) {
    const outWorkbook = XLSX.utils.book_new();
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new Error("No sheet found in CSV input");
    }
    XLSX.utils.book_append_sheet(outWorkbook, sheet, sheetName ?? "Sheet1");
    const outBuffer = XLSX.write(outWorkbook, getWriteOptions(outputExt));
    await writeFile(outputPath, outBuffer);
    const direction: "csv-to-numbers" | "csv-to-xlsx" =
      outputExt === ".numbers" ? "csv-to-numbers" : "csv-to-xlsx";
    return { inputPath, outputPath, direction };
  }

  if (SPREADSHEET_EXTENSIONS.includes(inputExt) && outputExt === ".csv") {
    const targetSheet = sheetName ?? workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];
    if (!worksheet) {
      throw new Error(
        `Sheet "${targetSheet}" not found. Available: ${workbook.SheetNames.join(", ")}`,
      );
    }
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    await writeFile(outputPath, csv, "utf-8");
    const direction: "numbers-to-csv" | "xlsx-to-csv" =
      inputExt === ".numbers" ? "numbers-to-csv" : "xlsx-to-csv";
    return { inputPath, outputPath, direction };
  }

  throw new Error(
    `Unsupported conversion: ${inputExt} -> ${outputExt}. Supported: CSV <-> NUMBERS/XLSX/XLS`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("convert-csv");
  cli.usage("<input> --output <path> [--sheet <name>]");
  cli.option("--output <path>", "Output file path");
  cli.option("--sheet <name>", "Sheet name for spreadsheet conversion");
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;
  if (options.help) process.exit(0);
  const [inputFile] = parsed.args;

  if (!inputFile || !options.output) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await convertCsv({
    inputPath: resolve(inputFile),
    outputPath: resolve(options.output),
    sheetName: options.sheet,
  });

  console.log(
    `Converted ${relative(process.cwd(), result.inputPath) || "."} -> ${relative(process.cwd(), result.outputPath) || "."} (${result.direction})`,
  );
}
