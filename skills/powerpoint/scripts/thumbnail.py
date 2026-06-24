#!/usr/bin/env python3
"""Render a PowerPoint presentation as a thumbnail grid image.

Requires LibreOffice (soffice) for PPTX-to-PDF conversion.
PyMuPDF handles PDF-to-image rendering (no Poppler needed).

Install:
  pip install pymupdf Pillow
  macOS:   brew install libreoffice
  Ubuntu:  apt install libreoffice
"""

import argparse
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


def convert_to_images(pptx_path: Path, dpi: int, temp_dir: Path) -> list[Path]:
    pdf_path = temp_dir / (pptx_path.stem + ".pdf")
    result = subprocess.run(
        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(temp_dir), str(pptx_path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not pdf_path.exists():
        sys.exit(f"LibreOffice conversion failed:\n{result.stderr}")

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("pymupdf not installed. Run: pip install pymupdf")

    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    doc = fitz.open(str(pdf_path))
    slides = []
    for i, page in enumerate(doc):
        out = temp_dir / f"slide-{i + 1:03d}.png"
        page.get_pixmap(matrix=mat).save(str(out))
        slides.append(out)
    return slides


def create_grid(image_paths: list[Path], cols: int, output_path: Path):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        sys.exit("Pillow not installed. Run: pip install Pillow")

    if not image_paths:
        sys.exit("No slide images found")

    with Image.open(image_paths[0]) as img:
        aspect = img.height / img.width
    thumb_h = int(THUMBNAIL_WIDTH * aspect)
    label_h = FONT_SIZE + 8

    rows = (len(image_paths) + cols - 1) // cols
    grid_w = cols * THUMBNAIL_WIDTH + (cols + 1) * GRID_PADDING
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
        x = col * THUMBNAIL_WIDTH + (col + 1) * GRID_PADDING
        y_label = row * (thumb_h + label_h) + (row + 1) * GRID_PADDING
        y_thumb = y_label + label_h

        label = str(i + 1)
        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((x + (THUMBNAIL_WIDTH - text_w) // 2, y_label), label, fill="gray", font=font)

        with Image.open(img_path) as img:
            img.thumbnail((THUMBNAIL_WIDTH, thumb_h), Image.Resampling.LANCZOS)
            w, h = img.size
            tx = x + (THUMBNAIL_WIDTH - w) // 2
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
    parser = argparse.ArgumentParser(description="Render .pptx slides as a thumbnail grid")
    parser.add_argument("input", help="Input .pptx file")
    parser.add_argument("output_prefix", nargs="?", default="thumbnails",
                        help="Output filename prefix (default: thumbnails)")
    parser.add_argument("--cols", type=int, default=DEFAULT_COLS)
    parser.add_argument("--dpi", type=int, default=DPI)
    args = parser.parse_args()

    result = subprocess.run(["which", "soffice"], capture_output=True)
    if result.returncode != 0:
        sys.exit(
            "LibreOffice (soffice) not found. Install:\n"
            "  macOS:  brew install libreoffice\n"
            "  Ubuntu: apt install libreoffice"
        )

    pptx_path = Path(args.input)
    cols = args.cols
    max_per_grid = cols * (cols + 1)

    with tempfile.TemporaryDirectory() as tmp:
        images = convert_to_images(pptx_path, args.dpi, Path(tmp))
        print(f"Found {len(images)} slide(s)")

        chunks = [images[i:i + max_per_grid] for i in range(0, len(images), max_per_grid)]
        outputs = []

        for chunk_idx, chunk in enumerate(chunks):
            if len(chunks) == 1:
                out = Path(f"{args.output_prefix}.jpg")
            else:
                out = Path(f"{args.output_prefix}-{chunk_idx + 1}.jpg")
            create_grid(chunk, cols, out)
            outputs.append(out)
            print(out)

        print(f"Created {len(outputs)} grid(s)")


if __name__ == "__main__":
    main()
