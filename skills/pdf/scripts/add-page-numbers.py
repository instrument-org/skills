#!/usr/bin/env python3
"""Add page numbers (and optional header/footer text) to a PDF."""

import argparse
import io
import sys


POSITIONS = ["bottom-center", "bottom-left", "bottom-right",
             "top-center", "top-left", "top-right"]


def make_overlay(page_num: int, total: int, fmt: str, position: str,
                 font_size: float, header: str, footer: str, page_w: float, page_h: float):
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.units import inch

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(page_w, page_h))
    c.setFont("Helvetica", font_size)

    label = fmt.replace("{page}", str(page_num)).replace("{total}", str(total))
    margin = 0.4 * inch

    if "bottom" in position:
        y = margin
    else:
        y = page_h - margin

    if position.endswith("left"):
        x, align = margin, "left"
    elif position.endswith("right"):
        x, align = page_w - margin, "right"
    else:
        x, align = page_w / 2, "center"

    if align == "center":
        c.drawCentredString(x, y, label)
    elif align == "right":
        c.drawRightString(x, y, label)
    else:
        c.drawString(x, y, label)

    if header:
        c.drawCentredString(page_w / 2, page_h - margin, header)
    if footer and "bottom" not in position:
        c.drawCentredString(page_w / 2, margin, footer)

    c.save()
    buf.seek(0)
    return buf


def main():
    parser = argparse.ArgumentParser(description="Add page numbers to a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", help="Output PDF file")
    parser.add_argument("--start", type=int, default=1, help="Starting page number")
    parser.add_argument("--position", default="bottom-center", choices=POSITIONS)
    parser.add_argument("--format", default="{page}", dest="fmt",
                        help="Label format, e.g. '{page} / {total}'")
    parser.add_argument("--font-size", type=float, default=10)
    parser.add_argument("--header", default="")
    parser.add_argument("--footer", default="")
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas as rl_canvas  # noqa: F401
    except ImportError:
        sys.exit("Required PDF skill dependencies were not installed")

    reader = PdfReader(args.input)
    writer = PdfWriter()
    total = len(reader.pages)

    for i, page in enumerate(reader.pages):
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        overlay_buf = make_overlay(
            args.start + i, total, args.fmt, args.position,
            args.font_size, args.header, args.footer, w, h,
        )
        from pypdf import PdfReader as PR
        overlay_page = PR(overlay_buf).pages[0]
        page.merge_page(overlay_page)
        writer.add_page(page)

    with open(args.output, "wb") as f:
        writer.write(f)
    print(f"Added page numbers -> {args.output}")


if __name__ == "__main__":
    main()
