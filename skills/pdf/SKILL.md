---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, extracting tables, finding hyperlinks, pulling embedded images, reading or updating document metadata, rendering pages as images, creating new PDFs from text or Markdown, merging or splitting PDFs, filling form fields, rotating pages, adding page numbers, watermarking, or encrypting. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, merge, split, or fill one."
---

# PDF

Use the Python scripts in `scripts/` to work with PDF files.

## Dependencies

Install before first use:

```
pip install pymupdf pdfplumber reportlab pypdf
```

`render-pages.py` uses PyMuPDF for native rendering -- no Poppler or external tools needed.

## Scripts

### `add-page-numbers.py` Add page numbers (and optional header/footer text) to a PDF.

```text
usage: add-page-numbers.py [-h] [--start START]
                           [--position {bottom-center,bottom-left,bottom-right,top-center,top-left,top-right}]
                           [--format FMT] [--font-size FONT_SIZE]
                           [--header HEADER] [--footer FOOTER]
                           input output

Add page numbers to a PDF

positional arguments:
  input                 Input PDF file
  output                Output PDF file

optional arguments:
  -h, --help            show this help message and exit
  --start START         Starting page number
  --position {bottom-center,bottom-left,bottom-right,top-center,top-left,top-right}
  --format FMT          Label format, e.g. '{page} / {total}'
  --font-size FONT_SIZE
  --header HEADER
  --footer FOOTER
```

### `create-pdf.py` Create a PDF from text or Markdown using reportlab.

```text
usage: create-pdf.py [-h] --output OUTPUT [--content CONTENT] [--input INPUT]
                     [--title TITLE] [--author AUTHOR]

Create a PDF from text or Markdown

optional arguments:
  -h, --help         show this help message and exit
  --output OUTPUT    Output PDF path
  --content CONTENT  Text content
  --input INPUT      Input text or Markdown file
  --title TITLE
  --author AUTHOR
```

### `extract-images.py` Extract embedded images from a PDF and save them as files.

```text
usage: extract-images.py [-h] [--output OUTPUT] [--page PAGE] input

Extract embedded images from a PDF

positional arguments:
  input            Input PDF file

optional arguments:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory (default: .)
  --page PAGE      Only extract from this page (1-indexed)
```

### `extract-links.py` Extract hyperlinks from a PDF.

```text
usage: extract-links.py [-h] [--json] input

Extract hyperlinks from a PDF

positional arguments:
  input       Input PDF file

optional arguments:
  -h, --help  show this help message and exit
  --json
```

### `extract-tables.py` Extract tables from a PDF using pdfplumber.

```text
usage: extract-tables.py [-h] [--page PAGE] [--csv] [--json] input

Extract tables from a PDF

positional arguments:
  input        Input PDF file

optional arguments:
  -h, --help   show this help message and exit
  --page PAGE  Only extract from this page (1-indexed)
  --csv        Output tables as CSV
  --json       Output tables as JSON
```

### `extract-text.py` Extract text from a PDF file.

```text
usage: extract-text.py [-h] [--pages PAGES] [--json] input

Extract text from a PDF

positional arguments:
  input          Input PDF file

optional arguments:
  -h, --help     show this help message and exit
  --pages PAGES  Page range, e.g. 1-3 or 1,3,5
  --json         Output structured JSON with per-page text and page count
```

### `fill-form.py` Fill PDF form fields.

```text
usage: fill-form.py [-h] [--fields FIELDS] [--list-fields] input [output]

Fill PDF form fields

positional arguments:
  input            Input PDF file
  output           Output PDF file

optional arguments:
  -h, --help       show this help message and exit
  --fields FIELDS  JSON object of field name -> value, e.g. '{"Name":
                   "Alice"}'
  --list-fields    List available form fields and exit
```

### `get-meta.py` Read PDF metadata.

```text
usage: get-meta.py [-h] input

Read PDF metadata

positional arguments:
  input       Input PDF file

optional arguments:
  -h, --help  show this help message and exit
```

### `merge.py` Merge multiple PDF files into one.

```text
usage: merge.py [-h] --output OUTPUT inputs [inputs ...]

Merge PDF files

positional arguments:
  inputs           Input PDF files (in order)

optional arguments:
  -h, --help       show this help message and exit
  --output OUTPUT  Output PDF file
```

### `render-pages.py` Render PDF pages to PNG images using PyMuPDF (no external tools required).

```text
usage: render-pages.py [-h] [--output OUTPUT] [--dpi DPI] [--pages PAGES]
                       input

Render PDF pages to PNG images

positional arguments:
  input            Input PDF file

optional arguments:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory (default: .)
  --dpi DPI        Resolution (default: 150)
  --pages PAGES    Page range, e.g. 1-3 or 2
```

### `rotate.py` Rotate pages in a PDF.

```text
usage: rotate.py [-h] --angle {90,180,270} [--pages PAGES] input output

Rotate PDF pages

positional arguments:
  input                 Input PDF file
  output                Output PDF file

optional arguments:
  -h, --help            show this help message and exit
  --angle {90,180,270}  Rotation angle (clockwise)
  --pages PAGES         Comma-separated 1-indexed page numbers (default: all)
```

### `set-meta.py` Update PDF metadata.

```text
usage: set-meta.py [-h] [--title TITLE] [--author AUTHOR] [--subject SUBJECT]
                   [--creator CREATOR]
                   input output

Update PDF metadata

positional arguments:
  input              Input PDF file
  output             Output PDF file

optional arguments:
  -h, --help         show this help message and exit
  --title TITLE
  --author AUTHOR
  --subject SUBJECT
  --creator CREATOR
```

### `split.py` Split a PDF into pages or named ranges.

```text
usage: split.py [-h] [--output OUTPUT] [--ranges RANGES] input

Split a PDF

positional arguments:
  input            Input PDF file

optional arguments:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory
  --ranges RANGES  Page ranges, e.g. '1-3,4-6' or 'intro:1-2,body:3-10'
```

### `watermark.py` Add a text or image watermark to every page of a PDF.

```text
usage: watermark.py [-h] [--text TEXT] [--image IMAGE] [--opacity OPACITY]
                    [--angle ANGLE]
                    input output

Add a watermark to a PDF

positional arguments:
  input              Input PDF file
  output             Output PDF file

optional arguments:
  -h, --help         show this help message and exit
  --text TEXT        Watermark text
  --image IMAGE      Watermark image file
  --opacity OPACITY
  --angle ANGLE
```

## Visual verification workflow

After creating or modifying a PDF, always render and inspect before delivering:

```
python scripts/render-pages.py output.pdf --output ./preview --dpi 150
```

Review the PNG files to catch clipped text, layout issues, or broken formatting.

## Notes

- Text extraction accuracy depends on whether the PDF has embedded text layers. Scanned PDFs
  require OCR (not included in this skill -- use `pytesseract` + `pdf2image` for OCR).
- `pymupdf` (fitz) handles text and image extraction and page rendering natively and quickly.
  `pdfplumber` provides the best table detection. `pypdf` is used for structural operations
  (merge/split/rotate/metadata/forms).
- `fill-form.py` works with AcroForm fields. XFA forms (Adobe LiveCycle) are not supported.
