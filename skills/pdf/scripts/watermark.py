#!/usr/bin/env python3
"""Add a text or image watermark to every page of a PDF."""

import argparse
import io
import math
import sys


def make_text_watermark(text: str, opacity: float, angle: float, page_w: float, page_h: float) -> io.BytesIO:
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.colors import Color

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(page_w, page_h))
    c.saveState()
    c.setFillColor(Color(0, 0, 0, alpha=opacity))
    c.setFont("Helvetica-Bold", 48)
    c.translate(page_w / 2, page_h / 2)
    c.rotate(angle)
    c.drawCentredString(0, 0, text)
    c.restoreState()
    c.save()
    buf.seek(0)
    return buf


def make_image_watermark(
    image_path: str,
    opacity: float,
    page_w: float,
    page_h: float,
) -> io.BytesIO:
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas as rl_canvas

    image = ImageReader(image_path)
    image_w, image_h = image.getSize()
    scale = min(page_w * 0.6 / image_w, page_h * 0.6 / image_h)
    width = image_w * scale
    height = image_h * scale

    buf = io.BytesIO()
    canvas = rl_canvas.Canvas(buf, pagesize=(page_w, page_h))
    canvas.saveState()
    canvas.setFillAlpha(opacity)
    canvas.drawImage(
        image,
        (page_w - width) / 2,
        (page_h - height) / 2,
        width=width,
        height=height,
        mask="auto",
    )
    canvas.restoreState()
    canvas.save()
    buf.seek(0)
    return buf


def main():
    parser = argparse.ArgumentParser(description="Add a watermark to a PDF")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", help="Output PDF file")
    parser.add_argument("--text", help="Watermark text")
    parser.add_argument("--image", help="Watermark image file")
    parser.add_argument("--opacity", type=float, default=0.3)
    parser.add_argument("--angle", type=float, default=45)
    args = parser.parse_args()

    if not args.text and not args.image:
        sys.exit("Provide --text or --image")

    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas as rl_canvas  # noqa: F401
    except ImportError:
        sys.exit("Required packages missing. Run: pip install pypdf reportlab")

    reader = PdfReader(args.input)
    writer = PdfWriter()

    for page in reader.pages:
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)

        if args.text:
            wm_buf = make_text_watermark(args.text, args.opacity, args.angle, w, h)
        else:
            wm_buf = make_image_watermark(args.image, args.opacity, w, h)

        from pypdf import PdfReader as PR

        wm_page = PR(wm_buf).pages[0]
        page.merge_page(wm_page)
        writer.add_page(page)

    metadata = {
        key: value
        for key, value in (reader.metadata or {}).items()
        if isinstance(key, str) and isinstance(value, str)
    }
    if metadata:
        writer.add_metadata(metadata)
    if reader.xmp_metadata is not None:
        writer.xmp_metadata = reader.xmp_metadata

    with open(args.output, "wb") as f:
        writer.write(f)
    print(f"Watermarked -> {args.output}")


if __name__ == "__main__":
    main()
