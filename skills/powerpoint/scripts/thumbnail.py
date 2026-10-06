#!/usr/bin/env python3
"""Render a deck's slides as a thumbnail grid image.

Takes the PDF the browser printed from a preview.py page, one slide per page, or a .pptx when LibreOffice (soffice) is installed to convert it. The skill supplies PyMuPDF and Pillow for image rendering.
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


DEFAULT_COLS = 4
THUMBNAIL_WIDTH = 280
DPI = 100
JPEG_QUALITY = 90
GRID_PADDING = 16
BORDER_WIDTH = 1
FONT_SIZE = 11


def convert_to_pdf(pptx_path: Path, temp_dir: Path) -> Path:
    pdf_path = temp_dir / (pptx_path.stem + ".pdf")
    result = subprocess.run(
        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(temp_dir), str(pptx_path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not pdf_path.exists():
        sys.exit(f"LibreOffice conversion failed:\n{result.stderr}")
    return pdf_path


def convert_to_images(pdf_path: Path, dpi: int, temp_dir: Path) -> list[Path]:

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit(
            "PyMuPDF is unavailable. Reload this skill to retry dependency setup."
        )

    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    doc = fitz.open(str(pdf_path))
    if len(doc) and "printed before its slides were drawn" in doc[0].get_text():
        sys.exit(doc[0].get_text().strip())
    slides = []
    for i, page in enumerate(doc):
        out = temp_dir / f"slide-{i + 1:03d}.png"
        page.get_pixmap(matrix=mat).save(str(out))
        slides.append(out)
    return slides


def create_grid(image_paths: list[Path], cols: int, output_path: Path, width: int = THUMBNAIL_WIDTH):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        sys.exit("Pillow is unavailable. Reload this skill to retry dependency setup.")

    if not image_paths:
        sys.exit("No slide images found")

    with Image.open(image_paths[0]) as img:
        aspect = img.height / img.width
    thumb_h = int(width * aspect)
    label_h = FONT_SIZE + 8

    rows = (len(image_paths) + cols - 1) // cols
    grid_w = cols * width + (cols + 1) * GRID_PADDING
    grid_h = rows * (thumb_h + label_h) + (rows + 1) * GRID_PADDING

    grid = Image.new("RGB", (grid_w, grid_h), "white")
    draw = ImageDraw.Draw(grid)
    try:
        font = ImageFont.load_default(size=FONT_SIZE)
    except Exception:
        font = ImageFont.load_default()

    for i, img_path in enumerate(image_paths):
        col = i % cols
        row = i // cols
        x = col * width + (col + 1) * GRID_PADDING
        y_label = row * (thumb_h + label_h) + (row + 1) * GRID_PADDING
        y_thumb = y_label + label_h

        label = str(i + 1)
        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((x + (width - text_w) // 2, y_label), label, fill="gray", font=font)

        with Image.open(img_path) as img:
            img.thumbnail((width, thumb_h), Image.Resampling.LANCZOS)
            w, h = img.size
            tx = x + (width - w) // 2
            ty = y_thumb + (thumb_h - h) // 2
            grid.paste(img, (tx, ty))
            if BORDER_WIDTH:
                draw.rectangle(
                    [tx - BORDER_WIDTH, ty - BORDER_WIDTH,
                     tx + w + BORDER_WIDTH - 1, ty + h + BORDER_WIDTH - 1],
                    outline="#cccccc", width=BORDER_WIDTH,
                )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    grid.save(str(output_path), quality=JPEG_QUALITY)
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Render a deck's slides as a thumbnail grid")
    parser.add_argument("input", help="The PDF printed from a preview.py page, or a .pptx when LibreOffice is installed")
    parser.add_argument("output_prefix", nargs="?", default="thumbnails",
                        help="Output filename prefix (default: thumbnails)")
    parser.add_argument("--cols", type=int, default=DEFAULT_COLS)
    parser.add_argument("--dpi", type=int, default=DPI)
    parser.add_argument("--width", type=int, default=THUMBNAIL_WIDTH, help=f"Width of each slide in pixels (default: {THUMBNAIL_WIDTH})")
    args = parser.parse_args()

    source = Path(args.input)
    if source.suffix.lower() != ".pdf" and not shutil.which("soffice"):
        sys.exit(
            "LibreOffice (soffice) is not available to convert a .pptx. Write a page with "
            "preview.py, print it with agent-browser pdf, and pass that PDF instead."
        )
    cols = args.cols
    max_per_grid = cols * (cols + 1)

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = source if source.suffix.lower() == ".pdf" else convert_to_pdf(source, Path(tmp))
        images = convert_to_images(pdf_path, args.dpi, Path(tmp))
        print(f"Found {len(images)} slide(s)")

        chunks = [images[i:i + max_per_grid] for i in range(0, len(images), max_per_grid)]
        outputs = []

        for chunk_idx, chunk in enumerate(chunks):
            if len(chunks) == 1:
                out = Path(f"{args.output_prefix}.jpg")
            else:
                out = Path(f"{args.output_prefix}-{chunk_idx + 1}.jpg")
            create_grid(chunk, cols, out, args.width)
            outputs.append(out)
            print(out)

        print(f"Created {len(outputs)} grid(s)")


if __name__ == "__main__":
    main()
