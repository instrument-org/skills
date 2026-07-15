#!/usr/bin/env python3
"""Convert between spreadsheet formats: CSV <-> XLSX <-> TSV."""

import argparse
import sys
from pathlib import Path


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
    elif dst == ".tsv":
        df.to_csv(args.output, sep="\t", index=False)
    else:
        df.to_csv(args.output, index=False)

    print(f"Converted {len(df)} rows: {args.input} -> {args.output}")


if __name__ == "__main__":
    main()
