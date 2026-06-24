#!/usr/bin/env python3
"""Extract tables from a PDF using pdfplumber."""

import argparse
import csv
import io
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract tables from a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--page", type=int, help="Only extract from this page (1-indexed)")
    parser.add_argument("--csv", action="store_true", dest="as_csv",
                        help="Output tables as CSV")
    parser.add_argument("--json", action="store_true", dest="as_json",
                        help="Output tables as JSON")
    args = parser.parse_args()

    try:
        import pdfplumber
    except ImportError:
        sys.exit("pdfplumber not installed. Run: pip install pdfplumber")

    all_tables = []
    with pdfplumber.open(args.input) as pdf:
        pages = [pdf.pages[args.page - 1]] if args.page else pdf.pages
        for page in pages:
            tables = page.extract_tables()
            for table in tables:
                all_tables.append(table)

    if not all_tables:
        print("No tables found.", file=sys.stderr)
        sys.exit(0)

    if args.as_json:
        print(json.dumps(all_tables, indent=2))
    elif args.as_csv:
        writer = csv.writer(sys.stdout)
        for i, table in enumerate(all_tables):
            if i > 0:
                print()
            for row in table:
                writer.writerow([cell or "" for cell in row])
    else:
        for i, table in enumerate(all_tables):
            print(f"Table {i + 1}:")
            for row in table:
                print("  " + " | ".join(str(cell or "") for cell in row))
            print()


if __name__ == "__main__":
    main()
