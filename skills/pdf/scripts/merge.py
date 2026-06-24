#!/usr/bin/env python3
"""Merge multiple PDF files into one."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Merge PDF files")
    parser.add_argument("inputs", nargs="+", help="Input PDF files (in order)")
    parser.add_argument("--output", required=True, help="Output PDF file")
    args = parser.parse_args()

    try:
        from pypdf import PdfWriter
    except ImportError:
        sys.exit("pypdf not installed. Run: pip install pypdf")

    writer = PdfWriter()
    for path in args.inputs:
        writer.append(path)

    with open(args.output, "wb") as f:
        writer.write(f)

    print(f"Merged {len(args.inputs)} files -> {args.output}")


if __name__ == "__main__":
    main()
