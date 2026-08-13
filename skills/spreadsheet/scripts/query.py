#!/usr/bin/env python3
"""Query, filter, and analyze spreadsheet data with pandas.

Examples:
  python scripts/query.py data.xlsx --filter "Age > 30"
  python scripts/query.py data.csv --select "Name,Age" --sort Age --limit 10
  python scripts/query.py events.parquet --sort ts --limit 20 --output recent.parquet
  python scripts/query.py report.xlsx --describe
"""

import argparse
import json
import sys
from pathlib import Path


BRIDGE = (
    "Apple Numbers and legacy .xls files need the TypeScript compatibility bridge: "
    "node scripts/numbers-bridge.ts <input> --output <output>"
)

PYARROW_MISSING = (
    "pyarrow is unavailable, so this run cannot handle Parquet. Reload this skill "
    "to retry dependency setup; Windows on ARM has no pyarrow build."
)


def unsupported(ext: str, formats: str) -> str:
    if ext in (".numbers", ".xls"):
        return BRIDGE
    return (
        f"Unsupported format: {ext or '(no extension)'}. Expected {formats}. "
        "Handle any other format with pandas directly."
    )


def load(path: str, sheet: str | None = None):
    try:
        import pandas as pd
    except ImportError:
        sys.exit(
            "pandas is unavailable. Reload this skill to retry dependency setup."
        )

    ext = Path(path).suffix.lower()
    if ext in (".xlsx", ".xlsm"):
        return pd.read_excel(path, sheet_name=sheet or 0)
    elif ext == ".parquet":
        try:
            return pd.read_parquet(path)
        except ImportError:
            sys.exit(PYARROW_MISSING)
    elif ext == ".tsv":
        return pd.read_csv(path, sep="\t")
    elif ext == ".csv":
        return pd.read_csv(path)
    else:
        # Refusing an unrecognized extension keeps a binary format from parsing
        # into garbage rows.
        sys.exit(unsupported(ext, ".xlsx, .xlsm, .csv, .tsv, or .parquet"))


def main():
    parser = argparse.ArgumentParser(description="Query spreadsheet data")
    parser.add_argument("input", help="Input file (.xlsx, .xlsm, .csv, .tsv, .parquet)")
    parser.add_argument("--sheet", help="Sheet name or index (Excel only)")
    parser.add_argument("--filter", dest="filter_expr",
                        help="Filter expression, e.g. 'Age > 30 and Status == \"active\"'")
    parser.add_argument("--select", help="Comma-separated column names to include")
    parser.add_argument("--sort", help="Column name to sort by")
    parser.add_argument("--desc", action="store_true", help="Sort descending")
    parser.add_argument("--limit", type=int, help="Max rows to return")
    parser.add_argument("--describe", action="store_true",
                        help="Print summary statistics")
    parser.add_argument("--output", help="Save result to .xlsx, .csv, .tsv, or .parquet")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    import pandas as pd
    df = load(args.input, args.sheet)

    if args.describe:
        print(df.describe(include="all").to_string())
        return

    if args.filter_expr:
        df = df.query(args.filter_expr)

    if args.select:
        cols = [c.strip() for c in args.select.split(",")]
        df = df[cols]

    if args.sort:
        df = df.sort_values(args.sort, ascending=not args.desc)

    if args.limit:
        df = df.head(args.limit)

    if args.output:
        ext = Path(args.output).suffix.lower()
        if ext == ".xlsx":
            df.to_excel(args.output, index=False)
        elif ext == ".parquet":
            try:
                df.to_parquet(args.output, index=False)
            except ImportError:
                sys.exit(PYARROW_MISSING)
        elif ext == ".tsv":
            df.to_csv(args.output, sep="\t", index=False)
        elif ext == ".csv":
            df.to_csv(args.output, index=False)
        else:
            sys.exit(unsupported(ext, ".xlsx, .csv, .tsv, or .parquet"))
        print(f"Saved {len(df)} rows -> {args.output}")
    elif args.as_json:
        print(df.to_json(orient="records", indent=2, default_handler=str))
    else:
        print(df.to_string(index=False))
        print(f"\n{len(df)} rows")


if __name__ == "__main__":
    main()
