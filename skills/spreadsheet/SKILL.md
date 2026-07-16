---
name: spreadsheet
description: "Work with tabular data files: Excel (.xlsx, .xlsm), Apple Numbers (.numbers), CSV, and TSV. Use whenever the user wants to read, write, create, edit, style, filter, query, convert, or analyze a spreadsheet. Activate for rows, columns, formulas, tables, charts, formatting, data cleaning, aggregation, or format conversion."
---

# Spreadsheet

Use `openpyxl` and pandas directly for multi-step spreadsheet work. The bundled
scripts are conveniences for bounded reads, queries, flat conversion, primitive
edits, and Apple Numbers compatibility.

## Dependencies

The app installs the locked `openpyxl` and pandas dependencies when this skill
is loaded. Run Python with `python`; do not repeat installation. The Numbers
compatibility bridge uses its bundled Node dependencies.

## Choose an approach

| Need                                                    | Approach                    |
| ------------------------------------------------------- | --------------------------- |
| Preserve workbook structure, formulas, and formatting   | Use `openpyxl`              |
| Create a styled multi-sheet workbook                    | Use `openpyxl`              |
| Filter, join, reshape, group, or summarize tabular data | Use pandas                  |
| Preview or perform a one-step query                     | Use `read.py` or `query.py` |
| Convert a flat table between CSV, TSV, and XLSX         | Use `convert.py`            |
| Read or write Apple Numbers, or read legacy `.xls`      | Use `numbers-bridge.ts`     |

Do not round-trip a styled workbook through pandas or `convert.py`: doing so
can discard formulas, formatting, multiple sheets, tables, charts, validation,
and metadata.

## Create a polished workbook

Use workbook-native tables, formats, formulas, and frozen panes:

```python
from datetime import date
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

wb = Workbook()
ws = wb.active
ws.title = "Sales"
ws.append(["Date", "Region", "Revenue", "Target", "Variance"])
for values in [
    (date(2026, 1, 31), "East", 125000, 120000),
    (date(2026, 1, 31), "West", 117500, 115000),
]:
    ws.append(values)

for row in range(2, ws.max_row + 1):
    ws.cell(row, 5, f"=C{row}-D{row}")
    ws.cell(row, 1).number_format = "mmm d, yyyy"
    for column in range(3, 6):
        ws.cell(row, column).number_format = '$#,##0;[Red]-$#,##0'

header_fill = PatternFill("solid", fgColor="1F4E78")
for cell in ws[1]:
    cell.font = Font(bold=True, color="FFFFFF")
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center")

table = Table(displayName="SalesTable", ref=f"A1:E{ws.max_row}")
table.tableStyleInfo = TableStyleInfo(
    name="TableStyleMedium2", showRowStripes=True, showColumnStripes=False
)
ws.add_table(table)
ws.freeze_panes = "A2"
ws.column_dimensions["A"].width = 15
ws.column_dimensions["B"].width = 14
for column in ["C", "D", "E"]:
    ws.column_dimensions[column].width = 16

summary = wb.create_sheet("Summary")
summary["A1"] = "Total revenue"
summary["B1"] = "=SUM(Sales!C2:C3)"
summary["B1"].number_format = "$#,##0"

wb.properties.title = "Monthly Sales"
output = Path("output/sales.xlsx")
output.parent.mkdir(parents=True, exist_ok=True)
wb.save(output)

# Structural verification belongs in the same workflow.
check = load_workbook(output, data_only=False)
assert check.sheetnames == ["Sales", "Summary"]
assert check["Sales"]["E2"].value == "=C2-D2"
assert "SalesTable" in check["Sales"].tables
```

## Analyze with pandas

Use pandas for data operations, then write the result to a new sheet or file:

```python
from pathlib import Path

import pandas as pd

frame = pd.read_excel("attachments/sales.xlsx", sheet_name="Sales")
summary = (
    frame.groupby("Region", as_index=False)
    .agg(revenue=("Revenue", "sum"), target=("Target", "sum"))
    .sort_values("revenue", ascending=False)
)
summary["attainment"] = summary["revenue"] / summary["target"]
output = Path("output/regional-summary.xlsx")
output.parent.mkdir(parents=True, exist_ok=True)
summary.to_excel(output, index=False)
```

Pandas is ideal for analysis but does not preserve the source workbook's full
presentation layer. Use `openpyxl` to insert results into an existing workbook.

## Edit without flattening the workbook

```python
from pathlib import Path

from openpyxl import load_workbook

source = Path("attachments/input.xlsm")
keep_vba = source.suffix.lower() == ".xlsm"
wb = load_workbook(source, data_only=False, keep_vba=keep_vba)
ws = wb["Inputs"]
ws["B4"] = 0.08
ws["B4"].number_format = "0.0%"
output = Path("output/updated.xlsm" if keep_vba else "output/updated.xlsx")
output.parent.mkdir(parents=True, exist_ok=True)
wb.save(output)
```

Load with `data_only=False` to inspect or preserve formulas. With
`data_only=True`, formula cells expose only their last cached result, which may
be missing. Neither `openpyxl` nor pandas calculates formulas; Excel or
LibreOffice must recalculate the workbook.

## Data and formula traps

- Treat untrusted strings beginning with `=`, `+`, `-`, or `@` as potential
  spreadsheet formulas when exporting CSV data to a workbook. Store them as
  explicit text unless formulas are intended.
- When sending Python through a shell heredoc, quote its delimiter as `<<'PY'`
  so shell expansion cannot alter currency formats or formulas.
- Preserve real dates and numbers as typed values; do not pre-format them as
  display strings.
- `read_only=True` reduces memory for large workbooks but limits editing.
- `write_only=True` supports large exports but gives up random cell access.
- Sheet names, named ranges, tables, validation, hidden sheets, and merged cells
  are part of the workbook contract. Inspect them before broad edits.
- The TypeScript bridge remains appropriate for `.numbers` and legacy `.xls`
  because its codec support is not available in the managed Python libraries.

## Quality gate

Reopen the saved workbook and verify sheet names, dimensions, representative
values and types, formulas, number formats, styles, table ranges, frozen panes,
and any hidden or macro-bearing content. Inspect representative sheets in the
app viewer when presentation quality matters. Never claim formula results were
recalculated unless Excel or LibreOffice actually recalculated them.

## Script reference

Use scripts for bounded convenience operations. Full options are in
[`reference.md`](reference.md).

- `convert.py`: Convert between spreadsheet formats: CSV <-> XLSX <-> TSV.
- `create.py`: Create a new Excel spreadsheet from JSON data or a CSV file.
- `edit.py`: Edit cells, formulas, and rows in an existing Excel spreadsheet.
- `numbers-bridge.ts`: Convert Apple Numbers and legacy XLS files through SheetJS.
- `query.py`: Query, filter, and analyze spreadsheet data with pandas.
- `read.py`: Read and display spreadsheet data (XLSX, XLSM, CSV, TSV).
