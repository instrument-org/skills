# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `convert.py` Convert between spreadsheet formats: CSV, TSV, XLSX, and Parquet.

```text
usage: convert.py [-h] --output OUTPUT [--sheet SHEET] input

Convert spreadsheet formats

positional arguments:
  input            Input file (.csv, .tsv, .xlsx, .xlsm, .parquet)

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output file (.csv, .tsv, .xlsx, .parquet)
  --sheet SHEET    Source sheet name (for multi-sheet XLSX input)
```

## `create.py` Create a new Excel spreadsheet from JSON data or a CSV file.

```text
usage: create.py [-h] --output OUTPUT [--json JSON_DATA] [--input INPUT]
                 [--sheet SHEET] [--title TITLE] [--freeze-header]

Create an Excel spreadsheet

options:
  -h, --help        show this help message and exit
  --output OUTPUT   Output .xlsx path
  --json JSON_DATA  JSON array of rows
  --input INPUT     Input CSV or TSV file
  --sheet SHEET     Sheet name
  --title TITLE
  --freeze-header   Freeze the first (header) row
```

## `edit.py` Edit cells, formulas, and rows in an existing Excel spreadsheet.

```text
usage: edit.py [-h] [--output OUTPUT] [--sheet SHEET] [--set-cell REF=VALUE]
               [--set-formula REF=FORMULA] [--add-row JSON] [--delete-row N]
               input

Edit an Excel spreadsheet

positional arguments:
  input                 Input .xlsx file

options:
  -h, --help            show this help message and exit
  --output OUTPUT       Output path (default: overwrite input)
  --sheet SHEET         Target sheet name (default: first sheet)
  --set-cell REF=VALUE  Set cell value, e.g. A1=Hello or Sheet1!B2=42
  --set-formula REF=FORMULA
                        Set a formula, e.g. C2==SUM(A2:B2)
  --add-row JSON        Append a row (JSON array), e.g. '["Alice",30]'
  --delete-row N        Delete row N (1-indexed)
```

## `numbers-bridge.ts` Convert Apple Numbers and legacy XLS files through SheetJS.

Exports:

- `convertNumbers({ inputPath, outputPath, sheetName, }: { inputPath: string; outputPath: string; sheetName?: string; }): Promise<{ inputPath: string; outputPath: string; sheetName: string | undefined; }>`

```text
numbers-bridge

Usage:
  $ numbers-bridge <input.numbers|input.xls> --output <path> [--sheet <name>]

Options:
  --output <path>  Output .csv, .json, .numbers, or .xlsx path
  --sheet <name>   Sheet to export for CSV or JSON output
  -h, --help       Display this message
```

> [!NOTE]
> Use this compatibility bridge only for `.numbers` or `.xls` files. The Python scripts handle XLSX, XLSM, CSV, and TSV.

## `query.py` Query, filter, and analyze spreadsheet data with pandas.

```text
usage: query.py [-h] [--sheet SHEET] [--filter FILTER_EXPR] [--select SELECT]
                [--sort SORT] [--desc] [--limit LIMIT] [--describe]
                [--output OUTPUT] [--json]
                input

Query spreadsheet data

positional arguments:
  input                 Input file (.xlsx, .xlsm, .csv, .tsv, .parquet)

options:
  -h, --help            show this help message and exit
  --sheet SHEET         Sheet name or index (Excel only)
  --filter FILTER_EXPR  Filter expression, e.g. 'Age > 30 and Status ==
                        "active"'
  --select SELECT       Comma-separated column names to include
  --sort SORT           Column name to sort by
  --desc                Sort descending
  --limit LIMIT         Max rows to return
  --describe            Print summary statistics
  --output OUTPUT       Save result to .xlsx, .csv, .tsv, or .parquet
  --json
```

## `read.py` Read and display spreadsheet data (XLSX, XLSM, CSV, TSV, Parquet).

```text
usage: read.py [-h] [--sheet SHEET] [--json] [--limit LIMIT] input

Read spreadsheet data

positional arguments:
  input          Input file (.xlsx, .xlsm, .csv, .tsv, .parquet)

options:
  -h, --help     show this help message and exit
  --sheet SHEET  Sheet name (Excel only)
  --json
  --limit LIMIT  Max rows to display (default: 50)
```

## `validate.py` Validate an Excel workbook's XML before delivering it.

```text
usage: validate.py [-h] [--fix] [--json] input

Validate an Excel workbook's XML

positional arguments:
  input       Input .xlsx or .xlsm file

options:
  -h, --help  show this help message and exit
  --fix       Repair inconsistent sheet view selections in place
  --json      Emit JSON
```
