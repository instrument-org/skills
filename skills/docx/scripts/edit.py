#!/usr/bin/env python3
"""Edit an existing Word document: add content, modify paragraphs, or do find-and-replace.

Examples:
  # Append a paragraph
  python scripts/edit.py doc.docx --append "New paragraph text" [--style "Normal"]

  # Find and replace text
  python scripts/edit.py doc.docx --find "old text" --replace "new text"

  # Add a heading
  python scripts/edit.py doc.docx --append "Section Title" --heading 2

  # Add a table from JSON
  python scripts/edit.py doc.docx --add-table '[["Name","Age"],["Alice",30]]'
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Edit a Word document")
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("--output", help="Output path (default: overwrite input)")
    parser.add_argument("--append", help="Text to append as a new paragraph")
    parser.add_argument("--style", default="Normal", help="Paragraph style for --append")
    parser.add_argument("--heading", type=int, metavar="LEVEL",
                        help="Append as heading at this level (1-6)")
    parser.add_argument("--find", help="Text to find")
    parser.add_argument("--replace", help="Replacement text for --find")
    parser.add_argument("--add-table", metavar="JSON",
                        help="Append a table from a JSON array of row arrays")
    args = parser.parse_args()

    try:
        from docx import Document
    except ImportError:
        sys.exit("python-docx not installed. Run: pip install python-docx")

    doc = Document(args.input)

    if args.find is not None and args.replace is not None:
        for para in doc.paragraphs:
            for run in para.runs:
                if args.find in run.text:
                    run.text = run.text.replace(args.find, args.replace)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for para in cell.paragraphs:
                        for run in para.runs:
                            if args.find in run.text:
                                run.text = run.text.replace(args.find, args.replace)

    if args.append:
        if args.heading:
            doc.add_heading(args.append, level=args.heading)
        else:
            doc.add_paragraph(args.append, style=args.style)

    if args.add_table:
        rows = json.loads(args.add_table)
        if rows:
            table = doc.add_table(rows=len(rows), cols=len(rows[0]))
            table.style = "Table Grid"
            for r_idx, row in enumerate(rows):
                for c_idx, value in enumerate(row):
                    table.cell(r_idx, c_idx).text = str(value)

    out = args.output or args.input
    doc.save(out)
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
