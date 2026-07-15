#!/usr/bin/env python3
"""Insert an image into a page of an existing PDF."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Insert an image into a PDF page")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", help="Output PDF file")
    parser.add_argument("--image", required=True, help="Image file to insert")
    parser.add_argument("--page", type=int, default=1, help="Target page (1-indexed)")
    parser.add_argument("--x", type=float, default=0, help="Left position in points")
    parser.add_argument("--y", type=float, default=0, help="Top position in points")
    parser.add_argument("--width", type=float, required=True, help="Image width in points")
    parser.add_argument("--height", type=float, help="Image height in points")
    args = parser.parse_args()

    try:
        import fitz
    except ImportError:
        sys.exit("pymupdf not installed. Run: pip install pymupdf")

    document = fitz.open(args.input)
    if args.page < 1 or args.page > len(document):
        sys.exit(f"Page {args.page} is out of range (document has {len(document)} pages)")

    page = document[args.page - 1]
    height = args.height if args.height is not None else page.rect.height - args.y
    if args.width <= 0 or height <= 0:
        sys.exit("--width and --height must produce a positive image rectangle")

    rectangle = fitz.Rect(args.x, args.y, args.x + args.width, args.y + height)
    page.insert_image(rectangle, filename=args.image, keep_proportion=True)
    document.save(args.output)
    print(f"Inserted image on page {args.page} -> {args.output}")


if __name__ == "__main__":
    main()
