#!/usr/bin/env python3
"""Extract text from a Word document (.docx)."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract text from a .docx file")
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("--json", action="store_true", dest="as_json",
                        help="Output structured JSON with paragraphs and styles")
    parser.add_argument("--include-tables", action="store_true",
                        help="Include table cell text (default: included)")
    args = parser.parse_args()

    try:
        from docx import Document
    except ImportError:
        sys.exit(
            "python-docx is unavailable. Reload this skill to retry dependency setup."
        )

    doc = Document(args.input)

    if args.as_json:
        paragraphs = [
            {"style": p.style.name, "text": p.text}
            for p in doc.paragraphs
            if p.text.strip()
        ]
        tables = []
        for table in doc.tables:
            rows = [[cell.text for cell in row.cells] for row in table.rows]
            tables.append(rows)
        print(json.dumps({"paragraphs": paragraphs, "tables": tables}, indent=2))
    else:
        lines = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                lines.append("\t".join(cell.text for cell in row.cells))
        print("\n".join(lines))


if __name__ == "__main__":
    main()
