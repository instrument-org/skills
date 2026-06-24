#!/usr/bin/env python3
"""Rotate pages in a PDF."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Rotate PDF pages")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", help="Output PDF file")
    parser.add_argument("--angle", type=int, required=True, choices=[90, 180, 270],
                        help="Rotation angle (clockwise)")
    parser.add_argument("--pages", help="Comma-separated 1-indexed page numbers (default: all)")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        sys.exit("pypdf not installed. Run: pip install pypdf")

    reader = PdfReader(args.input)
    total = len(reader.pages)
    target = set()
    if args.pages:
        for p in args.pages.split(","):
            target.add(int(p.strip()) - 1)

    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if not args.pages or i in target:
            page.rotate(args.angle)
        writer.add_page(page)

    with open(args.output, "wb") as f:
        writer.write(f)

    print(f"Rotated {len(target) if target else total} page(s) -> {args.output}")


if __name__ == "__main__":
    main()
