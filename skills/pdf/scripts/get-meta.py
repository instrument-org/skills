#!/usr/bin/env python3
"""Read PDF metadata."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Read PDF metadata")
    parser.add_argument("input", help="Input PDF file")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("pypdf is missing; the PDF skill dependencies were not installed")

    reader = PdfReader(args.input)
    meta = reader.metadata or {}
    print(json.dumps({
        "title": meta.get("/Title"),
        "author": meta.get("/Author"),
        "subject": meta.get("/Subject"),
        "creator": meta.get("/Creator"),
        "producer": meta.get("/Producer"),
        "creationDate": str(meta.get("/CreationDate", "")),
        "modDate": str(meta.get("/ModDate", "")),
        "pageCount": len(reader.pages),
        "encrypted": reader.is_encrypted,
    }, indent=2))


if __name__ == "__main__":
    main()
