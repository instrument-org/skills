#!/usr/bin/env python3
"""Fill a .docx Jinja2 template using docxtpl -- supports {{ var }}, {% for %}, {% if %}.

Create a template in Word by typing Jinja2 expressions directly in the document text.
docxtpl handles Word's split-run XML automatically.

Examples:
  python scripts/fill-template.py template.docx output.docx \
    --values '{"client": "Acme Corp", "date": "2024-01-15"}'

  python scripts/fill-template.py template.docx output.docx --values-file values.json

  python scripts/fill-template.py template.docx output.docx --list-placeholders
"""

import argparse
import json
import re
import sys
import zipfile


def list_placeholders(docx_path: str):
    with zipfile.ZipFile(docx_path) as zf:
        xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
    names = sorted(set(re.findall(r"\{\{\s*(\w+)\s*\}\}", xml)))
    if names:
        for name in names:
            print(f"{{{{ {name} }}}}")
    else:
        print("No {{ variable }} expressions found in this template.")


def main():
    parser = argparse.ArgumentParser(
        description="Fill a .docx Jinja2 template with docxtpl"
    )
    parser.add_argument(
        "input",
        help="Input .docx template (Jinja2: {{ var }} substitution, for/if blocks supported)"
    )
    parser.add_argument("output", nargs="?", help="Output .docx file (omit with --list-placeholders)")
    parser.add_argument("--values", help="JSON object mapping variable names to values")
    parser.add_argument("--values-file", help="Path to a JSON file with variable values")
    parser.add_argument(
        "--list-placeholders",
        action="store_true",
        help="Print all {{ variable }} names found in the template and exit",
    )
    args = parser.parse_args()

    if args.list_placeholders:
        list_placeholders(args.input)
        return

    if not args.output:
        sys.exit("output is required unless --list-placeholders is set")

    if args.values_file:
        with open(args.values_file) as f:
            context = json.load(f)
    elif args.values:
        context = json.loads(args.values)
    else:
        sys.exit("Provide --values or --values-file")

    try:
        from docxtpl import DocxTemplate
    except ImportError:
        sys.exit("docxtpl not installed. Run: pip install docxtpl")

    tpl = DocxTemplate(args.input)
    tpl.render(context)
    tpl.save(args.output)
    print(f"Rendered {len(context)} variable(s) -> {args.output}")


if __name__ == "__main__":
    main()
