#!/usr/bin/env python3
"""Convert between spreadsheet formats: CSV <-> XLSX <-> TSV."""

import argparse
import sys
from pathlib import Path


def store_formula_like_values_as_text(output: str, dataframe):
    from openpyxl import load_workbook

    workbook = load_workbook(output)
    sheet = workbook.active
    for row_index, row in enumerate(dataframe.itertuples(index=False, name=None), start=2):
        for column_index, value in enumerate(row, start=1):
            if isinstance(value, str) and value.startswith("="):
                cell = sheet.cell(row=row_index, column=column_index)
                cell.value = value
                cell.data_type = "s"
    workbook.save(output)


def main():
    parser = argparse.ArgumentParser(description="Convert spreadsheet formats")
    parser.add_argument("input", help="Input file")
    parser.add_argument("--output", required=True, help="Output file")
    parser.add_argument("--sheet", help="Source sheet name (for multi-sheet XLSX input)")
    args = parser.parse_args()

    src = Path(args.input).suffix.lower()
    dst = Path(args.output).suffix.lower()

    try:
        import pandas as pd
    except ImportError:
        sys.exit("pandas not installed. Run: pip install pandas openpyxl")

    if src in (".xlsx", ".xlsm"):
        df = pd.read_excel(args.input, sheet_name=args.sheet or 0)
    elif src == ".xls":
        sys.exit(
            "Legacy .xls files need the TypeScript compatibility bridge: "
            "tsx scripts/numbers-bridge.ts input.xls --output output.xlsx"
        )
    elif src == ".tsv":
        df = pd.read_csv(args.input, sep="\t")
    else:
        df = pd.read_csv(args.input)

    if dst in (".xlsx",):
        df.to_excel(args.output, index=False)
        store_formula_like_values_as_text(args.output, df)
    elif dst == ".tsv":
        df.to_csv(args.output, sep="\t", index=False)
    else:
        df.to_csv(args.output, index=False)

    print(f"Converted {len(df)} rows: {args.input} -> {args.output}")


if __name__ == "__main__":
    main()
