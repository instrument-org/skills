#!/usr/bin/env python3
"""Create a quick PDF from simple text or Markdown using reportlab.

Supports headings, bold/italic, and standalone image lines (`![alt](path)`).
Raster images embed directly; SVG images are rasterized with PyMuPDF.
"""

import argparse
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

DEFAULT_FRAME_PADDING = 6

# A line that is exactly one Markdown image: ![alt](path) or ![alt](<path>),
# with an optional "title". Angle brackets allow paths containing spaces.
IMAGE_LINE = re.compile(
    r"!\[[^\]]*\]\(\s*(?:<(?P<bracketed>[^>]+)>|(?P<plain>[^)\s]+))"
    r"(?:\s+\"[^\"]*\")?\s*\)"
)


def inline_markdown(text: str) -> str:
    """Escape text for ReportLab, then apply supported inline Markdown."""
    escaped = escape(text)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    return re.sub(r"\*(.+?)\*", r"<i>\1</i>", escaped)


def image_flowable(
    raw_path: str,
    image_dirs: list[Path],
    max_width: float,
    max_height: float,
):
    """Load an image reference into a page-fitted reportlab flowable.

    Exits with an error if the file is missing or unreadable -- a PDF that
    silently drops an image the caller asked for is worse than no PDF.
    """
    from reportlab.platypus import Image

    path = next(
        (p for d in image_dirs if (p := d / raw_path).is_file()), None
    )
    if path is None:
        sys.exit(f"Image not found: {raw_path}")

    if path.suffix.lower() == ".svg":
        try:
            import fitz
            from defusedxml import ElementTree as ET
        except ImportError:
            sys.exit(
                "PyMuPDF or defusedxml is missing; the PDF skill dependencies were not installed"
            )
        try:
            root = ET.parse(path).getroot()
            if root.tag.rsplit("}", 1)[-1] != "svg":
                raise ValueError("root element is not <svg>")
            with fitz.open(str(path)) as svg:
                page = svg[0]
                natural_width = page.rect.width
                natural_height = page.rect.height
                # Rasterize at 2x layout size so the bitmap stays sharp when
                # the PDF is zoomed.
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                source = io.BytesIO(pixmap.tobytes("png"))
        except Exception as error:  # noqa: BLE001 - report any render failure
            sys.exit(f"Could not render SVG {raw_path}: {error}")
    else:
        from reportlab.lib.utils import ImageReader

        try:
            natural_width, natural_height = ImageReader(str(path)).getSize()
        except Exception as error:  # noqa: BLE001 - report any read failure
            sys.exit(f"Could not read image {raw_path}: {error}")
        source = str(path)

    scale = min(max_width / natural_width, max_height / natural_height, 1)
    return Image(
        source,
        width=natural_width * scale,
        height=natural_height * scale,
    )


def md_to_story(
    text: str,
    image_dirs: list[Path],
    max_width: float,
    max_height: float,
):
    """Convert simple Markdown to a reportlab Platypus story."""
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, Spacer
    from reportlab.lib.units import inch

    styles = getSampleStyleSheet()
    story = []
    for line in text.splitlines():
        stripped = line.rstrip()
        image = IMAGE_LINE.fullmatch(stripped.strip())
        if image:
            raw_path = image.group("bracketed") or image.group("plain")
            story.append(
                image_flowable(raw_path, image_dirs, max_width, max_height)
            )
        elif stripped.startswith("### "):
            story.append(Paragraph(inline_markdown(stripped[4:]), styles["Heading3"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(inline_markdown(stripped[3:]), styles["Heading2"]))
        elif stripped.startswith("# "):
            story.append(Paragraph(inline_markdown(stripped[2:]), styles["Heading1"]))
        elif stripped == "":
            story.append(Spacer(1, 0.15 * inch))
        else:
            story.append(Paragraph(inline_markdown(stripped), styles["Normal"]))
    return story


def main():
    parser = argparse.ArgumentParser(
        description="Create a quick PDF from simple text or Markdown. The "
        "supported Markdown subset is headings, basic bold/italic, and local "
        "images via ![alt](path) on their own line (raster formats and SVG)."
    )
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
        sys.exit("reportlab is missing; the PDF skill dependencies were not installed")

    if args.input:
        input_path = Path(args.input).resolve()
        with input_path.open(encoding="utf-8") as f:
            text = f.read()
        # Prefer paths beside the Markdown file, then resolve task-relative
        # references from the caller's working directory.
        image_dirs = list(dict.fromkeys([input_path.parent, Path.cwd()]))
    elif args.content:
        text = args.content
        image_dirs = [Path.cwd()]
    else:
        sys.exit("Provide --content or --input")

    def set_metadata(canvas, _doc):
        if args.title:
            canvas.setTitle(args.title)
        if args.author:
            canvas.setAuthor(args.author)

    doc = SimpleDocTemplate(args.output, pagesize=letter)
    # SimpleDocTemplate frames add six points of padding on each edge inside
    # the document margins.
    max_image_width = doc.width - 2 * DEFAULT_FRAME_PADDING
    max_image_height = doc.height - 2 * DEFAULT_FRAME_PADDING
    doc.build(
        md_to_story(text, image_dirs, max_image_width, max_image_height),
        onFirstPage=set_metadata,
        onLaterPages=set_metadata,
    )
    print(f"Created: {args.output}")


if __name__ == "__main__":
    main()
