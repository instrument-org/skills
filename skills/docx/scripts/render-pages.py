#!/usr/bin/env python3
"""Render the pages of a printed preview.py page to PNG images, refusing a print taken before the document was laid out."""

import argparse
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Render the PDF printed from a preview.py page to one PNG per page")
    parser.add_argument("input", help="PDF printed from the preview page with agent-browser pdf")
    parser.add_argument("--output", default=".", help="Output directory (default: .)")
    parser.add_argument("--dpi", type=int, default=110, help="Resolution (default: 110)")
    args = parser.parse_args()

    try:
        import pymupdf
    except ImportError:
        sys.exit("PyMuPDF is unavailable. Reload this skill to retry dependency setup.")

    doc = pymupdf.open(args.input)
    if len(doc) and "printed before its pages were laid out" in doc[0].get_text():
        sys.exit(doc[0].get_text().strip())
    os.makedirs(args.output, exist_ok=True)
    for index, page in enumerate(doc):
        path = os.path.join(args.output, f"page-{index + 1:03d}.png")
        page.get_pixmap(dpi=args.dpi).save(path)
        print(path)


if __name__ == "__main__":
    main()
