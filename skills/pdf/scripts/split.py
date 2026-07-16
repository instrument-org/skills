#!/usr/bin/env python3
"""Split a PDF into pages or named ranges."""

import argparse
import os
import sys


def parse_ranges(spec: str, total: int) -> list[tuple[str, list[int]]]:
    """Parse 'name:1-3,name2:4-6' or '1-3,4-6' into (name, [page_indices]) pairs."""
    parts = []
    for i, part in enumerate(spec.split(",")):
        part = part.strip()
        if ":" in part:
            name, rng = part.split(":", 1)
        else:
            name = f"part-{i + 1:03d}"
            rng = part
        if "-" in rng:
            a, b = rng.split("-", 1)
            indices = list(range(int(a) - 1, min(int(b), total)))
        else:
            indices = [int(rng) - 1]
        parts.append((name, indices))
    return parts


def main():
    parser = argparse.ArgumentParser(description="Split a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--output", default=".", help="Output directory")
    parser.add_argument("--ranges", help="Page ranges, e.g. '1-3,4-6' or 'intro:1-2,body:3-10'")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        sys.exit("pypdf is missing; the PDF skill dependencies were not installed")

    os.makedirs(args.output, exist_ok=True)
    reader = PdfReader(args.input)
    total = len(reader.pages)

    if args.ranges:
        parts = parse_ranges(args.ranges, total)
    else:
        parts = [(f"page-{i + 1:03d}", [i]) for i in range(total)]

    for name, indices in parts:
        writer = PdfWriter()
        for idx in indices:
            writer.add_page(reader.pages[idx])
        out_path = os.path.join(args.output, f"{name}.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        print(out_path)


if __name__ == "__main__":
    main()
