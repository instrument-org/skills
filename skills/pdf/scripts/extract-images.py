#!/usr/bin/env python3
"""Extract embedded images from a PDF and save them as files."""

import argparse
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract embedded images from a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--output", default=".", help="Output directory (default: .)")
    parser.add_argument("--page", type=int, help="Only extract from this page (1-indexed)")
    args = parser.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF is missing; the PDF skill dependencies were not installed")

    os.makedirs(args.output, exist_ok=True)
    doc = fitz.open(args.input)
    pages = [doc[args.page - 1]] if args.page else list(doc)
    count = 0

    for page in pages:
        page_num = page.number + 1
        for img_index, img in enumerate(page.get_images(), start=1):
            xref = img[0]
            base = doc.extract_image(xref)
            ext = base["ext"]
            out_path = os.path.join(
                args.output, f"page{page_num:03d}-img{img_index:02d}.{ext}"
            )
            with open(out_path, "wb") as f:
                f.write(base["image"])
            print(out_path)
            count += 1

    print(f"{count} image(s) extracted.", file=sys.stderr)


if __name__ == "__main__":
    main()
