---
name: spreadsheet
description: "Work with tabular data files: Excel (.xlsx, .xls), CSV, and TSV. Use whenever the user wants to read, write, create, edit, filter, query, convert, or analyze spreadsheet or tabular data. Activate whenever the user mentions a .xlsx, .csv, or .tsv file, or asks to work with rows, columns, formulas, or tabular data. Also use for data cleaning, filtering rows, computing aggregates, and format conversion."
---

# Spreadsheet

Use the Python scripts in `scripts/` to work with spreadsheet and tabular data files.

## Dependencies

Install before first use:

```
pip install openpyxl pandas
```

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Notes

- All Excel operations use `openpyxl`. Formulas are written as strings; to read
  recalculated values, open the file in Excel or LibreOffice first.
- `read.py` reads formula results (`data_only=True`) — the stored cached value,
  not the formula text.
- For very large files (100k+ rows), `query.py` with pandas is more efficient than `read.py`.
- Numbers files are not supported. Convert them to XLSX first using Numbers or LibreOffice.
