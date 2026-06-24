#!/usr/bin/env python3
"""Render PDF pages to PNG images using PyMuPDF (no external tools required)."""

import argparse
import os
import sys


def parse_range(s: str, total: int) -> list[int]:
    indices = []
    for part in s.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            indices.extend(range(int(a) - 1, min(int(b), total)))
        else:
            indices.append(int(part) - 1)
    return indices


def main():
    parser = argparse.ArgumentParser(
        description="Render PDF pages to PNG images"
    )
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--output", default=".", help="Output directory (default: .)")
    parser.add_argument("--dpi", type=int, default=150, help="Resolution (default: 150)")
    parser.add_argument("--pages", help="Page range, e.g. 1-3 or 2")
    args = parser.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("pymupdf not installed. Run: pip install pymupdf")

    os.makedirs(args.output, exist_ok=True)
    doc = fitz.open(args.input)
    total = len(doc)
    indices = parse_range(args.pages, total) if args.pages else list(range(total))

    zoom = args.dpi / 72
    mat = fitz.Matrix(zoom, zoom)

    for i in indices:
        page = doc[i]
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(args.output, f"page-{i + 1:03d}.png")
        pix.save(out_path)
        print(out_path)


if __name__ == "__main__":
    main()
