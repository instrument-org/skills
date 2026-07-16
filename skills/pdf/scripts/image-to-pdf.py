#!/usr/bin/env python3
"""Create a PDF from raster images, one image per page."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Create a PDF from raster images (one page per image, "
        "any Pillow-readable format). SVG is not supported here; use "
        "the PyMuPDF vector-conversion recipe in SKILL.md instead."
    )
    parser.add_argument("inputs", nargs="+", help="Input image paths")
    parser.add_argument("--output", required=True, help="Output PDF path")
    parser.add_argument(
        "--dpi",
        type=int,
        default=150,
        help="Resolution metadata for the output PDF (default: 150)",
    )
    args = parser.parse_args()

    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow is missing; the PDF skill dependencies were not installed")

    images = []
    for input_path in args.inputs:
        with Image.open(input_path) as source:
            images.append(source.convert("RGB"))

    first, *remaining = images
    first.save(
        args.output,
        "PDF",
        append_images=remaining,
        resolution=args.dpi,
        save_all=True,
    )
    print(f"Created {args.output} ({len(images)} page(s))")


if __name__ == "__main__":
    main()
