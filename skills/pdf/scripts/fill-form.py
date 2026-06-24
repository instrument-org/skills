#!/usr/bin/env python3
"""Fill PDF form fields.

Use --list-fields to discover field names before filling.
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Fill PDF form fields")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", nargs="?", help="Output PDF file")
    parser.add_argument("--fields", help='JSON object of field name -> value, e.g. \'{"Name": "Alice"}\'')
    parser.add_argument("--list-fields", action="store_true",
                        help="List available form fields and exit")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        sys.exit("pypdf not installed. Run: pip install pypdf")

    reader = PdfReader(args.input)
    fields = reader.get_fields()

    if args.list_fields or not fields:
        if not fields:
            print("No form fields found in this PDF.", file=sys.stderr)
            sys.exit(0)
        result = {
            name: {
                "type": str(field.field_type),
                "value": field.value,
            }
            for name, field in fields.items()
        }
        print(json.dumps(result, indent=2, default=str))
        return

    if not args.fields:
        sys.exit("Provide --fields JSON or --list-fields")
    if not args.output:
        sys.exit("Provide an output path")

    values = json.loads(args.fields)
    writer = PdfWriter()
    writer.append(reader)
    writer.update_page_form_field_values(writer.pages[0], values)

    # Apply to all pages
    for page in writer.pages[1:]:
        writer.update_page_form_field_values(page, values)

    with open(args.output, "wb") as f:
        writer.write(f)
    print(f"Filled {len(values)} field(s) -> {args.output}")


if __name__ == "__main__":
    main()
