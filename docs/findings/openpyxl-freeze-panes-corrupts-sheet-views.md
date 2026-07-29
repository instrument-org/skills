# openpyxl's freeze_panes corrupts sheet views on loaded workbooks

Excel opens a workbook the spreadsheet skill produced with "we found a problem with some content", and the repair log reads `Removed Feature: View from /xl/worksheets/sheet1.xml`. The data survives; the sheet view does not. The source workbook the user supplied opens cleanly, so the damage is introduced on save.

## Root cause

`Worksheet.freeze_panes` adds to the pane selections the worksheet already holds rather than replacing them. It assigns `view.selection[0].pane` and, for a corner freeze, inserts two more `Selection` entries at the head of the list:

```python
view.selection[0].pane = "bottomLeft"
...
sel = list(view.selection)
sel.insert(0, Selection(pane="topRight", activeCell=None, sqref=None))
sel.insert(1, Selection(pane="bottomLeft", activeCell=None, sqref=None))
view.selection = sel
```

A `Workbook()` built in memory holds exactly one selection, so the result is correct. A workbook loaded from a file that was saved with frozen panes holds one selection per pane, and those survive the assignment. The saved XML then carries several `<selection>` elements naming the same pane, or naming panes the new split does not create. `CT_SheetView` in ECMA-376 also caps `selection` at `maxOccurs="4"`, so a corner freeze over an existing corner freeze overruns the schema outright. Excel cannot reconcile the element and drops the entire sheet view.

Measured across the source shapes Excel actually writes, freezing with openpyxl afterwards:

| Source workbook                 | Freeze target | Selections | Schema      | Result                                      |
| ------------------------------- | ------------- | ---------- | ----------- | ------------------------------------------- |
| Built from scratch              | any           | 1–3        | valid       | clean                                       |
| Header row frozen, 1 selection  | any           | 1–3        | valid       | clean                                       |
| Header row frozen, 2 selections | `A2`          | 2          | valid       | duplicate `bottomLeft`                      |
| Header row frozen, 2 selections | `B2`          | 4          | valid       | duplicate `bottomLeft`                      |
| Corner frozen, 3 selections     | `A2`          | 3          | valid       | duplicate `bottomLeft`, stale `bottomRight` |
| Corner frozen, 3 selections     | `B2`          | 5          | **invalid** | exceeds `maxOccurs="4"`                     |

Only the last row breaks the schema. The duplicate and stale cases are schema-valid, which is why schema validation alone is not a sufficient check. A plain load, edit, and save that never assigns `freeze_panes` round-trips the sheet view intact.

## Why the existing quality gate missed it

The skill told the agent to reopen the saved workbook and verify its contents. `openpyxl` reads its own malformed output back without complaint: `load_workbook` returns the right freeze target, the right values, and the right styles. Structural verification through the same library that wrote the file cannot detect markup that only Excel rejects.

## Remedy

Clear the inherited view state before assigning the freeze:

```python
from openpyxl.worksheet.views import Selection

ws.sheet_view.selection = [Selection()]
ws.freeze_panes = "A2"
```

This reproduces the from-scratch path exactly and yields a clean sheet view for every source shape above.

## What shipped

- `SKILL.md` documents the trap and the reset, in the section on editing loaded workbooks.
- `scripts/validate.py` checks a saved workbook against the ECMA-376 spreadsheet schema and checks sheet views for duplicate, stale, and over-count selections. `--fix` keeps the first selection for each pane that exists and drops the rest, in place.
- The `schemas/` directory vendors `sml.xsd` and its import closure from ISO/IEC 29500-4.
- The quality gate now leads with `validate.py` and states why reopening with `openpyxl` is not enough on its own.

Schema validation earns its keep beyond this bug: it also catches a `ColorScaleRule` written without colors, which emits a `<colorScale>` with no `<color>` children and is likewise unreadable to Excel.

## Alternative considered

Other published spreadsheet skills route every workbook through headless LibreOffice to recalculate formulas, which rewrites all parts and normalizes malformed markup as a side effect. That is not available to us: LibreOffice is an optional system dependency across these skills, absent on a typical user machine, and the registry cannot assume it. Validating the XML we emit is the portable equivalent.
