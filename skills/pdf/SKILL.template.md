---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, extracting tables, finding hyperlinks, pulling embedded images, reading or updating document metadata, rendering pages as images, creating new PDFs from text, Markdown, images, or SVG, merging or splitting PDFs, filling interactive or non-interactive forms, rotating pages, adding page numbers, watermarking, or inserting images. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, merge, split, or fill one."
user-invocable: false
---

# PDF

Use bundled scripts for operations they directly cover. For content, layout, or other generative work, write Python against the preinstalled libraries using the recipes below.

## Runtime

The skill installs locked versions of `reportlab`, PyMuPDF (`fitz`), `pdfplumber`, `pypdf`, and Pillow into the task environment. Run Python with `python`; do not reinstall these packages.

Run commands from the task root. Put temporary code and previews under `work/` and final deliverables under `output/`. Run bundled scripts by the full path shown when the skill loads; do not change into the skill directory.

Prefer a saved `.py` file for repeatable generation. If using a heredoc, quote its delimiter (`<<'PY'`) so shell expansion cannot alter dollar amounts or other document content.

## Choose an approach

| Need                                            | Approach                              |
| ----------------------------------------------- | ------------------------------------- |
| New report, invoice, or flowing document        | Write a ReportLab Platypus script     |
| SVG to vector PDF or SVG placed on a PDF page   | Write a PyMuPDF script                |
| Quick text/Markdown document with simple images | Use `create-pdf.py`                   |
| Fill an interactive AcroForm                    | Use `fill-form.py`                    |
| Fill a scanned or non-interactive form          | Use `overlay-form.py`                 |
| One PDF page per raster image                   | Use `image-to-pdf.py`                 |
| Closed operation on an existing PDF             | Use the matching bundled script       |
| Confirm appearance                              | Render every page, then read the PNGs |

## Recipe: flowing document with ReportLab

Use Platypus for documents whose content must wrap and flow across pages. Keep the generation script so layout fixes are repeatable.

```python
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

output = Path("output/report.pdf")
output.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=colors.HexColor("#1f2937"),
    spaceAfter=8,
)

doc = SimpleDocTemplate(
    str(output),
    pagesize=letter,
    leftMargin=0.75 * inch,
    rightMargin=0.75 * inch,
    topMargin=0.7 * inch,
    bottomMargin=0.7 * inch,
    title="Quarterly report",
    author="Instrument",
)
frame_width = doc.width - 12
frame_height = doc.height - 12
story = [
    Paragraph("Quarterly report", styles["Title"]),
    Spacer(1, 0.18 * inch),
    Paragraph(escape("Revenue improved by 18% across the quarter."), body),
]
# Append any tables and images before this final build call.
doc.build(story)
```

For tables, insert this before `doc.build(story)`. Use `LongTable`, set column widths, wrap cell text in `Paragraph`, and repeat the header row:

```python
from reportlab.lib import colors
from reportlab.platypus import LongTable, Paragraph, TableStyle

rows = [
    [Paragraph("Region", body), Paragraph("Revenue", body)],
    [Paragraph("North", body), Paragraph("$124,000", body)],
]
table = LongTable(
    rows,
    colWidths=[frame_width * 0.65, frame_width * 0.35],
    repeatRows=1,
)
table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9ca3af")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]
    )
)
story.append(table)
```

## Recipe: fit a raster image in a Platypus document

ReportLab does not automatically constrain images to the document frame. Add the fitted image to `story` before `doc.build(story)`.

```python
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Image as PDFImage


def fitted_image(path: str, max_width: float, max_height: float) -> PDFImage:
    width, height = ImageReader(path).getSize()
    scale = min(max_width / width, max_height / height, 1)
    return PDFImage(path, width=width * scale, height=height * scale)


story.append(
    fitted_image("attachments/chart.png", frame_width, frame_height * 0.55)
)
```

For mixed Markdown and images, `create-pdf.py` is a quick convenience. Put a Markdown image on its own line: `![alt](path)`. Raster images embed directly; SVG inputs are rasterized. Use PyMuPDF below when SVG must remain vector.

## Recipe: convert SVG to vector PDF

```python
from pathlib import Path

import fitz

output = Path("output/chart.pdf")
output.parent.mkdir(parents=True, exist_ok=True)

with fitz.open("attachments/chart.svg") as svg:
    output.write_bytes(svg.convert_to_pdf())
```

To place SVG content on a larger PDF page while keeping it vector:

```python
from pathlib import Path

import fitz

output = Path("output/chart-page.pdf")
output.parent.mkdir(parents=True, exist_ok=True)

with fitz.open("attachments/chart.svg") as svg:
    with fitz.open("pdf", svg.convert_to_pdf()) as vector_pdf:
        with fitz.open() as document:
            page = document.new_page(width=612, height=792)
            page.show_pdf_page(
                fitz.Rect(54, 72, 558, 387),
                vector_pdf,
                0,
                keep_proportion=True,
            )
            document.save(str(output))
```

PDF cannot preserve SVG or CSS animation. The renderer produces a static representation and may ignore animation styling. Tell the user when converting an animated source.

Some SVG renderers also do not fully honor stylesheets or class selectors. Render and inspect the PDF after conversion. If critical colors, strokes, or text styling are lost, copy the SVG into `work/`, inline the required presentation attributes on that PDF-specific copy, and regenerate the PDF. Do not modify an already delivered SVG just to make its PDF rendering work.

## Recipe: fill a non-interactive form

Run `fill-form.py --list-fields` first. If the PDF has no AcroForm fields, render the blank form and measure each entry area in PDF points. Coordinates for `overlay-form.py` start at the page's top-left; each box is `[x, top, width, height]`.

```json
{
  "fields": [
    {
      "page": 1,
      "box": [144, 96, 220, 18],
      "text": "Alice Example",
      "fontSize": 10,
      "minFontSize": 8,
      "align": "left",
      "color": "#000000"
    },
    {
      "page": 1,
      "box": [412, 214, 12, 12],
      "text": "X",
      "fontSize": 10,
      "align": "center"
    }
  ]
}
```

Validate before writing, then create a new PDF:

```bash
python <pdf-skill-path>/scripts/overlay-form.py attachments/form.pdf work/fields.json --validate-only
python <pdf-skill-path>/scripts/overlay-form.py attachments/form.pdf work/fields.json output/filled-form.pdf
```

The script writes page content, not editable form controls. It rejects rotated pages, overlapping or out-of-page boxes, and text that cannot fit at the minimum font size. Normalize page rotation before using it. Use only built-in PDF font aliases unless a task-specific script embeds the required font.

## ReportLab layout traps

- `Paragraph` content uses XML-like markup. Escape dynamic text with `xml.sax.saxutils.escape` before adding intentional tags.
- Built-in fonts have limited glyph coverage. Register and use a suitable TTF font when the document needs characters they do not contain.
- Do not use Unicode subscript or superscript numerals with built-in fonts; they may render as black boxes. Use `<sub>` and `<super>` inside `Paragraph`.
- ReportLab canvas coordinates start at the bottom-left. PyMuPDF coordinates normally start at the top-left. Confirm coordinates before mixing APIs.
- Set table column widths explicitly. Use `Paragraph` cells for wrapping and `repeatRows=1` for multi-page tables.
- `KeepTogether` fails when its contents cannot fit on one page. Use it only for small groups; use heading styles with `keepWithNext` for section titles.
- A `SimpleDocTemplate` frame has six points of padding on each edge. Subtract 12 points from `doc.width` and `doc.height` when sizing full-frame content.
- Page dimensions are points: 72 points equal one inch. Use `letter`, `A4`, `landscape(...)`, or an explicit `(width, height)` tuple.

## Script index

Use these scripts only for operations they directly cover. Read [`reference.md`](reference.md) for their complete arguments before invoking one.

{{GENERATED_SCRIPT_INDEX}}

## Mandatory visual verification

After every creation or meaningful modification, set `PDF_PATH` to the actual PDF that was created or changed:

```bash
PDF_PATH=output/report.pdf
python <pdf-skill-path>/scripts/render-pages.py "$PDF_PATH" --output work/pdf-preview --dpi 150
```

Then read every rendered PNG with the file-reading tool and compare it with the request. Command success, page count, and text extraction do not verify visual quality. Check for clipped or overlapping content, broken tables, missing images, literal markup, black boxes, unreadable glyphs, weak spacing, and blurry graphics. Fix the source and repeat the loop. Do not deliver until the latest inspection has zero visual or formatting defects.

## Existing-PDF notes

- Scanned PDFs may not have an embedded text layer. OCR is not included in the base dependencies.
- Use `pdfplumber` for layout-aware text and table extraction, PyMuPDF for page rendering and image extraction, and `pypdf` for structural operations.
- `fill-form.py` supports AcroForm fields. It does not support XFA forms.
- `overlay-form.py` is appropriate when visual placement is the intended deliverable. It does not create interactive fields or implement XFA.
