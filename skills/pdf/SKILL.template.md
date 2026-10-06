---
name: pdf
description: "Read, create, and edit PDF files (.pdf): design new documents in HTML printed by the browser, extract text and tables, merge, split, fill forms, and watermark."
---

# PDF

A PDF someone will read is a designed page, and the best layout engine here is the browser. Write a new document as HTML and CSS, print it with `agent-browser pdf`, check it, and look at what printed. Use the bundled scripts for closed operations on existing PDFs, and the Python libraries for the cases below where a program beats a stylesheet.

## Runtime

The skill installs locked versions of `reportlab`, PyMuPDF (`fitz`), `pdfplumber`, `pypdf`, and Pillow into the task environment. Run Python with `python`; do not reinstall these packages. `agent-browser`, the task's browser, is a shell command; where it is not available, build with ReportLab instead.

Run commands from the task root, and run bundled scripts by the full path shown when the skill loads; do not change into the skill directory.

Prefer a saved `.py` file for repeatable generation. If using a heredoc, quote its delimiter (`<<'PY'`) so shell expansion cannot alter dollar amounts or other document content.

## Choose an approach

| Need                                                                                           | Approach                                              |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| A document a person reads: proposal, one-pager, letter, resume, report, invoice, handout, menu | Write HTML and CSS, print it with `agent-browser pdf` |
| Hundreds of pages generated from data, or every element at fixed coordinates                   | Write a ReportLab Platypus script                     |
| SVG to vector PDF or SVG placed on a PDF page                                                  | Write a PyMuPDF script                                |
| Fill an interactive AcroForm                                                                   | Use `fill-form.py`                                    |
| Fill a scanned or non-interactive form                                                         | Use `overlay-form.py`                                 |
| One PDF page per raster image                                                                  | Use `image-to-pdf.py`                                 |
| Closed operation on an existing PDF                                                            | Use the matching bundled script                       |
| Confirm a finished PDF                                                                         | `check-pdf.py`, then render every page and read it    |

## Recipe: design in HTML, print with the browser

CSS gives you a grid, real tables, a type scale, running headers and page breaks without placing anything by coordinate, so trying a different layout is an edit rather than a rewrite. The browser is Chromium, so what you check is what prints.

**Decide the design first**, in a comment at the top of the file: who reads it and what they do next; the one element that should be loudest; what recedes; and the structure the content falls into. Hierarchy comes from size, weight and gray, not from making every heading bold. Structure is usually a grid: labels in a narrow column with their content aligned in a second one, a table wherever there are figures to compare or add up, a timeline as rows rather than paragraphs. "Simple" or "minimal" means few type sizes, one or two grays, and generous space, not the absence of a grid. "Neutral" means white paper and gray ink; tint the page only when asked.

**Write `work/<name>.html`** on these mechanics:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Document title</title>
    <style>
      @page {
        size: letter;
        margin: 0.75in;
        @bottom-right {
          content: counter(page) " of " counter(pages);
          font-size: 8pt;
          color: #888;
        }
      }
      html {
        font-family:
          -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.45;
        color: #1c1c1c;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-variant-numeric: tabular-nums;
      }
      h2 {
        break-after: avoid;
      }
      tr,
      figure {
        break-inside: avoid;
      }
    </style>
  </head>
  <body>
    ...
  </body>
</html>
```

- `@page` sets the paper: `letter` (8.5 x 11 in, 7 in wide inside 0.75 in margins), `A4`, or `landscape` after either. Size type and space in `pt` or `in`; body text between 9 and 11pt.
- Margin boxes (`@top-left`, `@bottom-center`, ...) carry running headers, footers and page numbers; `counter(pages)` is the total. `break-before: page` starts a new page.
- When the request gives a page count, design for it from the start. If the print runs over, cut or tighten copy and spacing before shrinking type. A one-page document fills its page or ends deliberately, never with an empty band below.
- A background on `html` or `body` stops at the print margins and leaves a white frame. A tinted sheet needs `@page { margin: 0 }` with the margin moved to padding on a wrapper, which gives up the margin boxes.
- A chart is inline SVG drawn from the data, computed by a short script, never a screenshot.
- The system font stack above is always there. A web font from Google Fonts works when the computer is online; confirm in the rendered pages that it printed.

**Print, check, render and look.** Pass `--pages` only when the request named a page count. After editing the HTML, run `agent-browser open` again before printing, or you print the old page.

```bash
agent-browser open work/<name>.html
agent-browser pdf work/<name>.pdf
python <pdf-skill-path>/scripts/check-pdf.py work/<name>.pdf --pages 1
python <pdf-skill-path>/scripts/render-pages.py work/<name>.pdf --output pdf-preview --dpi 110
```

**Review it as a designer would, then revise.** Is exactly one thing loudest? Do labels, dates and footers recede? Do columns and numbers line up down the page? Are figures in a table, right-aligned, with any total set apart? If a revision still reads like a word processor's defaults, change the structure, not the numbers. Keep the HTML beside the PDF in `work/`, so a later change is an edit to the page and a reprint.

## Recipe: data-generated document with ReportLab

Use Platypus when the document is a program's output at a scale where markup would be a program anyway, such as hundreds of pages of generated tables, or when every element sits at fixed coordinates. Let flowables place the content; hand-set `drawString` positions are how lines end up printed over each other. Keep the generation script so layout fixes are repeatable.

```python
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

output = Path("report.pdf")
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

output = Path("chart.pdf")
output.parent.mkdir(parents=True, exist_ok=True)

with fitz.open("attachments/chart.svg") as svg:
    output.write_bytes(svg.convert_to_pdf())
```

To place SVG content on a larger PDF page while keeping it vector:

```python
from pathlib import Path

import fitz

output = Path("chart-page.pdf")
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

Some SVG renderers also do not fully honor stylesheets or class selectors. Render and inspect the PDF after conversion. If critical colors, strokes, or text styling are lost, make a PDF-specific copy of the SVG, inline the required presentation attributes on it, and regenerate the PDF. Do not modify an already delivered SVG just to make its PDF rendering work.

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
python <pdf-skill-path>/scripts/overlay-form.py attachments/form.pdf fields.json --validate-only
python <pdf-skill-path>/scripts/overlay-form.py attachments/form.pdf fields.json filled-form.pdf
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

## Check, then look

After every creation or meaningful change, check the PDF that was actually written, then render every page:

```bash
PDF_PATH=work/report.pdf
python <pdf-skill-path>/scripts/check-pdf.py "$PDF_PATH"
python <pdf-skill-path>/scripts/render-pages.py "$PDF_PATH" --output pdf-preview --dpi 150
```

`check-pdf.py` prints one `FAIL` line per measured problem: lines printed over each other, text off the page, type under 6pt, the wrong page count, a stranded last page, and, with `--pages 1`, a one-pager that stops partway down. Fix each one in the source, never by hiding it, and run it again until it prints `pass`.

Then read every rendered PNG with the file-reading tool and compare it with the request. The check measures geometry, not design: clipped content, broken tables, missing images, literal markup, black boxes, weak spacing, and blurry graphics are yours to see. Do not deliver until the check passes and the latest look finds nothing to fix.

## Existing-PDF notes

- Scanned PDFs may not have an embedded text layer. OCR is not included in the base dependencies.
- Use `pdfplumber` for layout-aware text and table extraction, PyMuPDF for page rendering and image extraction, and `pypdf` for structural operations.
- `fill-form.py` supports AcroForm fields. It does not support XFA forms.
- `overlay-form.py` is appropriate when visual placement is the intended deliverable. It does not create interactive fields or implement XFA.
