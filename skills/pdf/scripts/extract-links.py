#!/usr/bin/env python3
"""Extract hyperlinks from a PDF."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract hyperlinks from a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("pypdf not installed. Run: pip install pypdf")

    reader = PdfReader(args.input)
    links = []
    for page_num, page in enumerate(reader.pages, start=1):
        if "/Annots" not in page:
            continue
        for annot in page["/Annots"]:
            obj = annot.get_object()
            if obj.get("/Subtype") == "/Link":
                action = obj.get("/A")
                if action and action.get("/S") == "/URI":
                    links.append({"page": page_num, "url": action["/URI"]})

    if args.as_json:
        print(json.dumps(links, indent=2))
    else:
        for link in links:
            print(f"p{link['page']}: {link['url']}")


if __name__ == "__main__":
    main()
