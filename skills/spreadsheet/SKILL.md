---
name: spreadsheet
description: "Work with tabular data files: Excel (.xlsx, .xlsm), Apple Numbers (.numbers), CSV, and TSV. Use whenever the user wants to read, write, create, edit, filter, query, convert, or analyze spreadsheet or tabular data. Activate whenever the user mentions a .xlsx, .numbers, .csv, or .tsv file, or asks to work with rows, columns, formulas, or tabular data. Also use for data cleaning, filtering rows, computing aggregates, and format conversion."
---

# Spreadsheet

Use the Python scripts in `scripts/` to work with spreadsheet and tabular data files.

## Dependencies

Install before first use:

```
pip install openpyxl pandas
```

## Scripts

### `convert.py` Convert between spreadsheet formats: CSV <-> XLSX <-> TSV.

```text
usage: convert.py [-h] --output OUTPUT [--sheet SHEET] input

Convert spreadsheet formats

positional arguments:
  input            Input file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output file
  --sheet SHEET    Source sheet name (for multi-sheet XLSX input)
```

### `create.py` Create a new Excel spreadsheet from JSON data or a CSV file.

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

### `edit.py` Edit cells, formulas, and rows in an existing Excel spreadsheet.

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

### `numbers-bridge.ts` Convert Apple Numbers and legacy XLS files through SheetJS.

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

### `query.py` Query, filter, and analyze spreadsheet data with pandas.

```text
usage: query.py [-h] [--sheet SHEET] [--filter FILTER_EXPR] [--select SELECT]
                [--sort SORT] [--desc] [--limit LIMIT] [--describe]
                [--output OUTPUT] [--json]
                input

Query spreadsheet data

positional arguments:
  input                 Input file (.xlsx, .csv, .tsv)

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
  --output OUTPUT       Save result to .xlsx or .csv
  --json
```

### `read.py` Read and display spreadsheet data (XLSX, XLSM, CSV, TSV).

```text
usage: read.py [-h] [--sheet SHEET] [--json] [--limit LIMIT] input

Read spreadsheet data

positional arguments:
  input          Input file (.xlsx, .xlsm, .csv, .tsv)

options:
  -h, --help     show this help message and exit
  --sheet SHEET  Sheet name (Excel only)
  --json
  --limit LIMIT  Max rows to display (default: 50)
```

## Notes

- All Excel operations use `openpyxl`. Formulas are written as strings; to read
  recalculated values, open the file in Excel or LibreOffice first.
- `read.py` reads formula results (`data_only=True`) — the stored cached value,
  not the formula text.
- For very large files (100k+ rows), `query.py` with pandas is more efficient than `read.py`.
- Use `numbers-bridge.ts` for `.numbers` files and legacy `.xls` files. It is the one
  TypeScript script in this skill because SheetJS provides the required Apple Numbers codec.
