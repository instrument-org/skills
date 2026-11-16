---
name: spreadsheet
description: "Read, create, edit, and analyze spreadsheets and data files: Excel (.xlsx), Numbers, CSV, TSV, and Parquet."
---

# Spreadsheet

Use `openpyxl` and pandas directly for multi-step spreadsheet work. The bundled scripts are conveniences for bounded reads, queries, flat conversion, primitive edits, and Apple Numbers compatibility.

## Dependencies

The app installs the locked `openpyxl`, pandas, `pyarrow`, and `lxml` dependencies when this skill is loaded. Run Python with `python`; do not repeat installation. `pyarrow` is the engine behind `read_parquet` and `to_parquet`, and also reads Feather, Arrow IPC, and ORC. The Numbers compatibility bridge uses its bundled Node dependencies.

`pyarrow` ships no Windows on ARM build, so Parquet is unavailable on that platform and the scripts say so rather than failing obscurely. Everything else in this skill works there. Convert the file to CSV or XLSX elsewhere when a task needs its contents.

## Choose an approach

| Need                                                     | Approach                                   |
| -------------------------------------------------------- | ------------------------------------------ |
| Preserve workbook structure, formulas, and formatting    | Use `openpyxl`                             |
| Create a styled multi-sheet workbook                     | Use `openpyxl`                             |
| Filter, join, reshape, group, or summarize tabular data  | Use pandas                                 |
| Read or write Parquet                                    | Use pandas `read_parquet` and `to_parquet` |
| Preview or perform a one-step query                      | Use `read.py` or `query.py`                |
| Convert a flat table between CSV, TSV, XLSX, and Parquet | Use `convert.py`                           |
| Read or write Apple Numbers, or read legacy `.xls`       | Use `numbers-bridge.ts`                    |
| Confirm a saved workbook opens without repair            | Use `validate.py`                          |

Do not round-trip a styled workbook through pandas or `convert.py`: doing so can discard formulas, formatting, multiple sheets, tables, charts, validation, and metadata.

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
output = Path("sales.xlsx")
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
import os
from pathlib import Path

import pandas as pd

source = os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "sales.xlsx")
frame = pd.read_excel(source, sheet_name="Sales")
summary = (
    frame.groupby("Region", as_index=False)
    .agg(revenue=("Revenue", "sum"), target=("Target", "sum"))
    .sort_values("revenue", ascending=False)
)
summary["attainment"] = summary["revenue"] / summary["target"]
output = Path("regional-summary.xlsx")
output.parent.mkdir(parents=True, exist_ok=True)
summary.to_excel(output, index=False)
```

Pandas is ideal for analysis but does not preserve the source workbook's full presentation layer. Use `openpyxl` to insert results into an existing workbook.

## Read and write Parquet

`pd.read_parquet` and `DataFrame.to_parquet` cover Parquet through `pyarrow`. Read only the columns you need, and write without the index unless it carries data:

```python
import os

import pandas as pd
import pyarrow.parquet as pq

source = os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "events.parquet")

# Inspect the schema and row count before loading a large file.
parquet_file = pq.ParquetFile(source)
print(parquet_file.schema_arrow, parquet_file.metadata.num_rows)

frame = pd.read_parquet(source, columns=["ts", "region", "revenue"])
frame.to_parquet("by-region.parquet", index=False)
```

A Parquet file is one typed table. It preserves column types, nulls, and dictionary-encoded categories, but carries no sheets, formulas, formatting, or charts, so writing a styled workbook to Parquet keeps a single sheet's values and nothing else. Going the other way, prefer Parquet over CSV whenever types must survive the round trip.

## Edit without flattening the workbook

```python
import os
from pathlib import Path

from openpyxl import load_workbook

source = Path(os.environ["INSTRUMENT_ATTACHMENTS"], "input.xlsm")
keep_vba = source.suffix.lower() == ".xlsm"
wb = load_workbook(source, data_only=False, keep_vba=keep_vba)
ws = wb["Inputs"]
ws["B4"] = 0.08
ws["B4"].number_format = "0.0%"
output = Path("updated.xlsm" if keep_vba else "updated.xlsx")
output.parent.mkdir(parents=True, exist_ok=True)
wb.save(output)
```

### Formulas and cached values

A formula cell stores its formula and, when Excel or LibreOffice last saved the file, a cached result. Neither `openpyxl` nor pandas calculates formulas, so:

- `load_workbook()` gives formula strings and `load_workbook(data_only=True)` gives cached results with the formulas gone. Reading both takes two loads.
- Never save a workbook loaded with `data_only=True`. It has no formulas left, so the save replaces every formula with its cached value, or with nothing where there was none.
- `openpyxl` writes no cached values. Reading back a workbook it just wrote with `data_only=True` gives `None` for every formula cell, and pandas reads them as empty. Check new formulas by reading their text with the default load; `read.py` shows a formula's text where it has no cached value and says so. `office recalc` (see Quality gate) computes them and writes the results in.

### Reset inherited sheet views before freezing panes

`ws.freeze_panes` adds to the pane selections a loaded workbook already carries instead of replacing them. Freezing a file that was saved with frozen panes therefore leaves duplicate `<selection>` entries and entries naming panes the new split does not create, and Excel discards the whole sheet view as unreadable content. Clear the inherited state first:

```python
from openpyxl.worksheet.views import Selection

ws.sheet_view.selection = [Selection()]
ws.freeze_panes = "A2"
```

A workbook built from scratch carries a single selection, so this applies only to workbooks loaded from disk.

## Data and formula traps

- Treat untrusted strings beginning with `=`, `+`, `-`, or `@` as potential spreadsheet formulas when exporting CSV data to a workbook. Store them as explicit text unless formulas are intended.
- When sending Python through a shell heredoc, quote its delimiter as `<<'PY'` so shell expansion cannot alter currency formats or formulas.
- Preserve real dates and numbers as typed values; do not pre-format them as display strings.
- `read_only=True` reduces memory for large workbooks but limits editing.
- `write_only=True` supports large exports but gives up random cell access.
- Sheet names, named ranges, tables, validation, hidden sheets, and merged cells are part of the workbook contract. Inspect them before broad edits.
- `openpyxl` writes a formula into the file exactly as given. Functions added after Excel 2007 are stored with an `_xlfn.` prefix that Excel's formula bar hides, so write `=_xlfn.TEXTJOIN(", ",TRUE,A2:A9)`, `_xlfn.IFS`, `_xlfn.MAXIFS`, `_xlfn.CONCAT`, or `_xlfn.XLOOKUP`; written bare, Excel shows `#NAME?`. Prefer `SUMIFS`, `INDEX`/`MATCH`, and `IFERROR`, which need no prefix.
- Quote a sheet name in a cross-sheet reference whenever it has a space or punctuation: `='Assumptions Inputs'!$B$5`. `openpyxl.utils.quote_sheetname(name)` builds the quoted form.
- Every new formula cell starts with the General number format; nothing infers one from its inputs. Set `number_format` on it, or a date shows as `46023` and 30% as `0.3`.
- Saving a loaded workbook drops the text boxes, shapes, and slicers `openpyxl` does not model; charts and images survive. Before editing an upload, look for `sp` elements in `xl/drawings/*.xml` and for an `xl/slicers/` folder inside the file, and if there are any, tell the user what the save would lose before writing it.
- Text that is partly bold or italic in one cell is flattened to plain text on load, and stays flattened when saved. Load with `load_workbook(path, rich_text=True)` to keep it; such a cell's `.value` is then a `CellRichText`, not a `str`.
- The TypeScript bridge remains appropriate for `.numbers` and legacy `.xls` because its codec support is not available in the managed Python libraries.
- `read.py`, `query.py`, and `convert.py` route by file extension: they point `.numbers` and `.xls` at the bridge, and refuse an extension they do not recognize rather than guessing CSV. Read an unusual delimited file with pandas directly.

## Charts that render as intended

`openpyxl` leaves several chart settings unwritten, and Excel's defaults for them round the chart frame, let the legend and titles overlap the plot, and can hide the axes. Set them on every new chart. A `DateAxis` replaces the category axis but the value axis still points at the old one's id, a dangling reference Excel may offer to repair, so point it at the date axis:

```python
from openpyxl.chart import LineChart, Reference
from openpyxl.chart.axis import DateAxis

chart = LineChart()
chart.title = "Revenue"
chart.add_data(Reference(ws, min_col=3, min_row=1, max_row=ws.max_row), titles_from_data=True)
chart.set_categories(Reference(ws, min_col=1, min_row=2, max_row=ws.max_row))
chart.x_axis = DateAxis()
chart.x_axis.number_format = "mmm yyyy"
chart.x_axis.majorTimeUnit = "months"
chart.y_axis.crossAx = chart.x_axis.axId

chart.roundedCorners = False
chart.legend.overlay = False
chart.title.overlay = False  # and on each axis title you set
chart.x_axis.delete = False  # charts with axes only, not pie or doughnut
chart.y_axis.delete = False
ws.add_chart(chart, "G2")
```

## Financial models

Follow these conventions unless the user or the existing workbook does otherwise; an existing file's conventions always win, and its input cells are the only ones to write.

- Put every assumption in its own labeled cell and reference it (`=B5*(1+$B$6)`, never `=B5*1.05`). Write formulas, not results computed in Python, so the model recalculates when an input changes.
- Color text by what the cell is: blue (`0000FF`) for typed inputs, black for formulas, green (`008000`) for links to another sheet. A yellow fill marks key assumptions the reader may change.
- Currency as `$#,##0;($#,##0);"-"`, with the unit in the header (`Revenue ($mm)`), so negatives show in parentheses and zeros as a dash. Percentages as `0.0%`, stored as fractions (`0.15`, not `15`). Multiples as `0.0"x"`. Years as text or the `0` format, never `#,##0`.
- Keep each row's formula the same across every period, and guard any denominator that can be zero.
- Say where each typed number came from, in a note cell or a cell comment.

## Quality gate

Run `validate.py` on every workbook you deliver. Reopening a file with `openpyxl` proves only that `openpyxl` can read it back: it accepts markup that Excel rejects, so a workbook that round-trips cleanly in Python can still open with a repair prompt. `validate.py` checks the saved XML against the ECMA-376 schema and checks the sheet views for pane and selection combinations Excel refuses, and `--fix` repairs the sheet views in place.

Then reopen the workbook and verify sheet names, dimensions, representative values and types, formulas, number formats, styles, table ranges, frozen panes, and any hidden or macro-bearing content. Inspect representative sheets in the app viewer when presentation quality matters. Before delivering a workbook with formulas, run `office recalc <job>/model.xlsx`. It computes every formula in LibreOffice, writes the results into the file as cached values (nothing else in the file changes), and lists each error cell with its formula, exiting 1 when there is one. Fix every listed error and run it again; `--check` reports without writing. A cell it reports as a function LibreOffice does not compute is not an error: Excel computes it when the file opens. Its first use downloads LibreOffice, about 300 MB. If that fails, say plainly that the workbook was not recalculated; never claim formula results were recalculated unless Excel or LibreOffice actually recalculated them.

`office render <job>/model.xlsx` draws the sheets to a PDF and page images, as a print or PDF export would lay them out, and lists each sheet's used range. A legacy `.xls` converts with `office convert old.xls --to xlsx`, and `--to csv` writes one file per sheet with computed values.

## Script reference

Use scripts for bounded convenience operations. Full options are in [`reference.md`](reference.md).

{{GENERATED_SCRIPT_INDEX}}
