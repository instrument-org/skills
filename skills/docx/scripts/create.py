#!/usr/bin/env python3
"""Create a Word document (.docx) from Markdown or structured JSON.

Markdown support: # headings (H1-H6), **bold**, *italic*, bullet lists (- or *),
numbered lists (1.), horizontal rules (---), and paragraph breaks.

JSON format: list of block objects with 'type' and 'text' (and optional 'level' for headings).
  [{"type":"heading","level":1,"text":"Title"},{"type":"paragraph","text":"Body text"}]

Examples:
  python scripts/create.py --input doc.md --output report.docx
  python scripts/create.py --content "# Hello\n\nWorld" --output hello.docx
"""

import argparse
import json
import re
import sys


def add_inline(paragraph, text: str):
    """Add Markdown bold and italic spans without flattening the paragraph."""
    for token in re.split(r"(\*\*.+?\*\*|\*.+?\*)", text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
        elif token.startswith("*") and token.endswith("*"):
            run = paragraph.add_run(token[1:-1])
            run.italic = True
        else:
            paragraph.add_run(token)


def add_markdown(doc, text: str):
    from docx.shared import Pt
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        # Heading
        m = re.match(r"^(#{1,6})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            paragraph = doc.add_heading(level=level)
            add_inline(paragraph, m.group(2).strip())
            i += 1
            continue
        # HR
        if re.match(r"^---+$", line.strip()):
            doc.add_paragraph("─" * 40)
            i += 1
            continue
        # Bullet
        if re.match(r"^[-*]\s+", line):
            clean = re.sub(r"^[-*]\s+", "", line)
            paragraph = doc.add_paragraph(style="List Bullet")
            add_inline(paragraph, clean)
            i += 1
            continue
        # Numbered list
        if re.match(r"^\d+\.\s+", line):
            clean = re.sub(r"^\d+\.\s+", "", line)
            paragraph = doc.add_paragraph(style="List Number")
            add_inline(paragraph, clean)
            i += 1
            continue
        # Empty line
        if not line.strip():
            i += 1
            continue
        # Normal paragraph
        paragraph = doc.add_paragraph()
        add_inline(paragraph, line.strip())
        i += 1


def add_blocks(doc, blocks: list):
    for block in blocks:
        block_type = block.get("type", "paragraph")
        text = block.get("text", "")
        if block_type == "heading":
            doc.add_heading(text, level=block.get("level", 1))
        elif block_type == "bullet":
            doc.add_paragraph(text, style="List Bullet")
        elif block_type == "numbered":
            doc.add_paragraph(text, style="List Number")
        else:
            doc.add_paragraph(text)


def main():
    parser = argparse.ArgumentParser(description="Create a Word document")
    parser.add_argument("--output", required=True, help="Output .docx path")
    parser.add_argument("--content", help="Markdown text content")
    parser.add_argument("--input", help="Input Markdown or JSON file")
    parser.add_argument("--title", help="Document title (metadata)")
    parser.add_argument("--author", help="Document author (metadata)")
    args = parser.parse_args()

    try:
        from docx import Document
    except ImportError:
        sys.exit(
            "python-docx is unavailable. Reload this skill to retry dependency setup."
        )

    doc = Document()

    if args.input:
        with open(args.input, encoding="utf-8") as f:
            raw = f.read()
        if args.input.endswith(".json"):
            add_blocks(doc, json.loads(raw))
        else:
            add_markdown(doc, raw)
    elif args.content:
        add_markdown(doc, args.content)
    else:
        sys.exit("Provide --content or --input")

    if args.title:
        doc.core_properties.title = args.title
    if args.author:
        doc.core_properties.author = args.author

    doc.save(args.output)
    print(f"Created: {args.output}")


if __name__ == "__main__":
    main()
