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


def replace_text(paragraph, find: str, replacement: str):
    """Replace text in a paragraph, including matches spanning formatting runs."""
    count = 0
    search_from = 0

    while True:
        runs = list(paragraph.runs)
        text = "".join(run.text for run in runs)
        start = text.find(find, search_from)
        if start == -1:
            return count

        end = start + len(find)
        offset = 0
        start_index = None
        end_index = None
        start_offset = 0
        end_offset = 0

        for index, run in enumerate(runs):
            run_end = offset + len(run.text)
            if start_index is None and start < run_end:
                start_index = index
                start_offset = start - offset
            if end <= run_end:
                end_index = index
                end_offset = end - offset
                break
            offset = run_end

        if start_index is None or end_index is None:
            return count

        start_run = runs[start_index]
        end_run = runs[end_index]
        if start_run == end_run:
            start_run.text = (
                start_run.text[:start_offset]
                + replacement
                + start_run.text[end_offset:]
            )
        else:
            start_run.text = start_run.text[:start_offset] + replacement
            for run in runs[start_index + 1:end_index]:
                run.text = ""
            end_run.text = end_run.text[end_offset:]

        count += 1
        search_from = start + len(replacement)


def main():
    parser = argparse.ArgumentParser(description="Edit a Word document")
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("--output", help="Output path (default: overwrite input)")
    parser.add_argument("--append", help="Text to append as a new paragraph")
    parser.add_argument("--style", default="Normal", help="Paragraph style for --append")
    parser.add_argument("--heading", choices=range(1, 7), type=int, metavar="LEVEL",
                        help="Append as heading at this level (1-6)")
    parser.add_argument("--find", help="Text to find")
    parser.add_argument("--replace", help="Replacement text for --find")
    parser.add_argument("--add-table", metavar="JSON",
                        help="Append a table from a JSON array of row arrays")
    args = parser.parse_args()
    if (args.find is None) != (args.replace is None):
        parser.error("--find and --replace must be supplied together")
    if args.find == "":
        parser.error("--find must not be empty")

    try:
        from docx import Document
    except ImportError:
        sys.exit("python-docx not installed. Run: pip install python-docx")

    doc = Document(args.input)

    if args.find is not None:
        for para in doc.paragraphs:
            replace_text(para, args.find, args.replace)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for para in cell.paragraphs:
                        replace_text(para, args.find, args.replace)

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
