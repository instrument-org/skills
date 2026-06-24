#!/usr/bin/env python3
"""Create a PDF from text or Markdown using reportlab."""

import argparse
import re
import sys


def md_to_story(text: str):
    """Convert simple Markdown to a reportlab Platypus story."""
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, Spacer
    from reportlab.lib.units import inch

    styles = getSampleStyleSheet()
    story = []
    for line in text.splitlines():
        stripped = line.rstrip()
        if stripped.startswith("### "):
            story.append(Paragraph(stripped[4:], styles["Heading3"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(stripped[3:], styles["Heading2"]))
        elif stripped.startswith("# "):
            story.append(Paragraph(stripped[2:], styles["Heading1"]))
        elif stripped == "":
            story.append(Spacer(1, 0.15 * inch))
        else:
            # Inline bold/italic
            escaped = (stripped
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
            escaped = re.sub(r"\*(.+?)\*", r"<i>\1</i>", escaped)
            story.append(Paragraph(escaped, styles["Normal"]))
    return story


def main():
    parser = argparse.ArgumentParser(description="Create a PDF from text or Markdown")
    parser.add_argument("--output", required=True, help="Output PDF path")
    parser.add_argument("--content", help="Text content")
    parser.add_argument("--input", help="Input text or Markdown file")
    parser.add_argument("--title")
    parser.add_argument("--author")
    args = parser.parse_args()

    try:
        from reportlab.platypus import SimpleDocTemplate
        from reportlab.lib.pagesizes import letter
    except ImportError:
        sys.exit("reportlab not installed. Run: pip install reportlab")

    if args.input:
        with open(args.input, encoding="utf-8") as f:
            text = f.read()
    elif args.content:
        text = args.content
    else:
        sys.exit("Provide --content or --input")

    doc = SimpleDocTemplate(args.output, pagesize=letter)
    meta = {}
    if args.title:
        meta["title"] = args.title
    if args.author:
        meta["author"] = args.author
    doc.build(md_to_story(text), **{k: v for k, v in meta.items()})
    print(f"Created: {args.output}")


if __name__ == "__main__":
    main()
