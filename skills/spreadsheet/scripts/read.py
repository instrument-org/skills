#!/usr/bin/env python3
"""Read and display spreadsheet data (XLSX, XLSM, CSV, TSV)."""

import argparse
import csv
import json
import sys
from pathlib import Path


def read_csv(path: str, delimiter: str = ",") -> list[list]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.reader(f, delimiter=delimiter))


def read_excel(path: str, sheet: str | None = None) -> dict[str, list[list]]:
    try:
        import openpyxl
    except ImportError:
        sys.exit(
            "openpyxl is unavailable. Reload this skill to retry dependency setup."
        )

    wb = openpyxl.load_workbook(path, data_only=True)
    names = [sheet] if sheet else wb.sheetnames
    result = {}
    for name in names:
        ws = wb[name]
        result[name] = [[cell.value for cell in row] for row in ws.iter_rows()]
    return result


def main():
    parser = argparse.ArgumentParser(description="Read spreadsheet data")
    parser.add_argument("input", help="Input file (.xlsx, .xlsm, .csv, .tsv)")
    parser.add_argument("--sheet", help="Sheet name (Excel only)")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--limit", type=int, default=50, help="Max rows to display (default: 50)")
    args = parser.parse_args()

    ext = Path(args.input).suffix.lower()

    if ext in (".csv",):
        rows = read_csv(args.input)
        data = {"Sheet1": rows}
    elif ext in (".tsv",):
        rows = read_csv(args.input, delimiter="\t")
        data = {"Sheet1": rows}
    elif ext in (".xlsx", ".xlsm"):
        data = read_excel(args.input, args.sheet)
    else:
        sys.exit(f"Unsupported format: {ext}")

    if args.as_json:
        print(json.dumps(data, indent=2, default=str))
    else:
        for sheet_name, rows in data.items():
            if len(data) > 1:
                print(f"\n=== {sheet_name} ===")
            for row in rows[:args.limit]:
                print("\t".join(str(v) if v is not None else "" for v in row))
            if len(rows) > args.limit:
                print(f"... ({len(rows) - args.limit} more rows)")


if __name__ == "__main__":
    main()
