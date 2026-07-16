#!/usr/bin/env python3
"""Extract text from a PDF file."""

import argparse
import json
import sys


def parse_page_range(s: str, total: int) -> list[int]:
    pages = []
    for part in s.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            pages.extend(range(int(a) - 1, min(int(b), total)))
        else:
            pages.append(int(part) - 1)
    return pages


def main():
    parser = argparse.ArgumentParser(description="Extract text from a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--pages", help="Page range, e.g. 1-3 or 1,3,5")
    parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Output structured JSON with per-page text and page count",
    )
    args = parser.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF is missing; the PDF skill dependencies were not installed")

    doc = fitz.open(args.input)
    total = len(doc)
    indices = parse_page_range(args.pages, total) if args.pages else list(range(total))

    if args.as_json:
        pages = []
        for i in indices:
            text = doc[i].get_text()
            pages.append({"page": i + 1, "text": text})
        print(json.dumps({"totalPages": total, "pages": pages}, indent=2))
    else:
        chunks = [doc[i].get_text() for i in indices]
        print("\n".join(chunks))


if __name__ == "__main__":
    main()
