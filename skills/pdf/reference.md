# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `add-page-numbers.py` Add page numbers (and optional header/footer text) to a PDF.

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

options:
  -h, --help            show this help message and exit
  --start START         Starting page number
  --position {bottom-center,bottom-left,bottom-right,top-center,top-left,top-right}
  --format FMT          Label format, e.g. '{page} / {total}'
  --font-size FONT_SIZE
  --header HEADER
  --footer FOOTER
```

## `create-pdf.py` Create a quick PDF from simple text or Markdown using reportlab.

```text
usage: create-pdf.py [-h] --output OUTPUT [--content CONTENT] [--input INPUT]
                     [--title TITLE] [--author AUTHOR]

Create a quick PDF from simple text or Markdown. The supported Markdown subset
is headings, basic bold/italic, and local images via ![alt](path) on their own
line (raster formats and SVG).

options:
  -h, --help         show this help message and exit
  --output OUTPUT    Output PDF path
  --content CONTENT  Text content
  --input INPUT      Input text or Markdown file
  --title TITLE
  --author AUTHOR
```

## `extract-images.py` Extract embedded images from a PDF and save them as files.

```text
usage: extract-images.py [-h] [--output OUTPUT] [--page PAGE] input

Extract embedded images from a PDF

positional arguments:
  input            Input PDF file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory (default: .)
  --page PAGE      Only extract from this page (1-indexed)
```

## `extract-links.py` Extract hyperlinks from a PDF.

```text
usage: extract-links.py [-h] [--json] input

Extract hyperlinks from a PDF

positional arguments:
  input       Input PDF file

options:
  -h, --help  show this help message and exit
  --json
```

## `extract-tables.py` Extract tables from a PDF using pdfplumber.

```text
usage: extract-tables.py [-h] [--page PAGE] [--csv] [--json] input

Extract tables from a PDF

positional arguments:
  input        Input PDF file

options:
  -h, --help   show this help message and exit
  --page PAGE  Only extract from this page (1-indexed)
  --csv        Output tables as CSV
  --json       Output tables as JSON
```

## `extract-text.py` Extract text from a PDF file.

```text
usage: extract-text.py [-h] [--pages PAGES] [--json] input

Extract text from a PDF

positional arguments:
  input          Input PDF file

options:
  -h, --help     show this help message and exit
  --pages PAGES  Page range, e.g. 1-3 or 1,3,5
  --json         Output structured JSON with per-page text and page count
```

## `fill-form.py` Fill PDF form fields.

```text
usage: fill-form.py [-h] [--fields FIELDS] [--list-fields] input [output]

Fill PDF form fields

positional arguments:
  input            Input PDF file
  output           Output PDF file

options:
  -h, --help       show this help message and exit
  --fields FIELDS  JSON object of field name -> value, e.g. '{"Name":
                   "Alice"}'
  --list-fields    List available form fields and exit
```

## `get-meta.py` Read PDF metadata.

```text
usage: get-meta.py [-h] input

Read PDF metadata

positional arguments:
  input       Input PDF file

options:
  -h, --help  show this help message and exit
```

## `image-to-pdf.py` Create a PDF from raster images, one image per page.

```text
usage: image-to-pdf.py [-h] --output OUTPUT [--dpi DPI] inputs [inputs ...]

Create a PDF from raster images (one page per image, any Pillow-readable
format). SVG is not supported here; use the PyMuPDF vector-conversion recipe
in SKILL.md instead.

positional arguments:
  inputs           Input image paths

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output PDF path
  --dpi DPI        Resolution metadata for the output PDF (default: 150)
```

## `insert-image.py` Insert an image into a page of an existing PDF.

```text
usage: insert-image.py [-h] --image IMAGE [--page PAGE] [--x X] [--y Y]
                       --width WIDTH [--height HEIGHT]
                       input output

Insert an image into a PDF page

positional arguments:
  input            Input PDF file
  output           Output PDF file

options:
  -h, --help       show this help message and exit
  --image IMAGE    Image file to insert
  --page PAGE      Target page (1-indexed)
  --x X            Left position in points
  --y Y            Top position in points
  --width WIDTH    Image width in points
  --height HEIGHT  Image height in points
```

## `merge.py` Merge multiple PDF files into one.

```text
usage: merge.py [-h] --output OUTPUT inputs [inputs ...]

Merge PDF files

positional arguments:
  inputs           Input PDF files (in order)

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output PDF file
```

## `render-pages.py` Render PDF pages to PNG images using PyMuPDF (no external tools required).

```text
usage: render-pages.py [-h] [--output OUTPUT] [--dpi DPI] [--pages PAGES]
                       input

Render PDF pages to PNG images

positional arguments:
  input            Input PDF file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory (default: .)
  --dpi DPI        Resolution (default: 150)
  --pages PAGES    Page range, e.g. 1-3 or 2
```

## `rotate.py` Rotate pages in a PDF.

```text
usage: rotate.py [-h] --angle {90,180,270} [--pages PAGES] input output

Rotate PDF pages

positional arguments:
  input                 Input PDF file
  output                Output PDF file

options:
  -h, --help            show this help message and exit
  --angle {90,180,270}  Rotation angle (clockwise)
  --pages PAGES         Comma-separated 1-indexed page numbers (default: all)
```

## `set-meta.py` Update PDF metadata.

```text
usage: set-meta.py [-h] [--title TITLE] [--author AUTHOR] [--subject SUBJECT]
                   [--creator CREATOR]
                   input output

Update PDF metadata

positional arguments:
  input              Input PDF file
  output             Output PDF file

options:
  -h, --help         show this help message and exit
  --title TITLE
  --author AUTHOR
  --subject SUBJECT
  --creator CREATOR
```

## `split.py` Split a PDF into pages or named ranges.

```text
usage: split.py [-h] [--output OUTPUT] [--ranges RANGES] input

Split a PDF

positional arguments:
  input            Input PDF file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory
  --ranges RANGES  Page ranges, e.g. '1-3,4-6' or 'intro:1-2,body:3-10'
```

## `watermark.py` Add a text or image watermark to every page of a PDF.

```text
usage: watermark.py [-h] [--text TEXT] [--image IMAGE] [--opacity OPACITY]
                    [--angle ANGLE]
                    input output

Add a watermark to a PDF

positional arguments:
  input              Input PDF file
  output             Output PDF file

options:
  -h, --help         show this help message and exit
  --text TEXT        Watermark text
  --image IMAGE      Watermark image file
  --opacity OPACITY
  --angle ANGLE
```
