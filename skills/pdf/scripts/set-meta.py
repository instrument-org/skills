#!/usr/bin/env python3
"""Update PDF metadata."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Update PDF metadata")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", help="Output PDF file")
    parser.add_argument("--title")
    parser.add_argument("--author")
    parser.add_argument("--subject")
    parser.add_argument("--creator")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        sys.exit("pypdf is missing; the PDF skill dependencies were not installed")

    reader = PdfReader(args.input)
    writer = PdfWriter()
    writer.append(reader)

    meta = {}
    if args.title:
        meta["/Title"] = args.title
    if args.author:
        meta["/Author"] = args.author
    if args.subject:
        meta["/Subject"] = args.subject
    if args.creator:
        meta["/Creator"] = args.creator

    if meta:
        writer.add_metadata(meta)

    with open(args.output, "wb") as f:
        writer.write(f)

    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()
