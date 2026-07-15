---
name: powerpoint
description: "Work with PowerPoint files (.pptx). Use whenever the user wants to create presentations, generate PPTX files with slides and content, extract text from PowerPoint files, inspect an existing deck's text and shape inventory, or replace text in an existing deck using a template-fill workflow. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, edit, or extract text from one."
---

# PowerPoint

Use the Python scripts in `scripts/` to create, read, and edit PowerPoint presentations.

## Dependencies

Install before first use:

```
pip install python-pptx Pillow pymupdf
```

## Scripts

### `create.py` Create a PowerPoint presentation (.pptx) from a JSON slide definition.

```text
usage: create.py [-h] --output OUTPUT [--input INPUT] [--content CONTENT]
                 [--title TITLE]

Create a PowerPoint presentation

options:
  -h, --help         show this help message and exit
  --output OUTPUT    Output .pptx path
  --input INPUT      JSON file with slide definitions
  --content CONTENT  JSON string with slide definitions
  --title TITLE      Presentation title (metadata)
```

### `extract-text.py` Extract text from a PowerPoint presentation (.pptx).

```text
usage: extract-text.py [-h] [--json] input

Extract text from a .pptx file

positional arguments:
  input       Input .pptx file

options:
  -h, --help  show this help message and exit
  --json      Output structured JSON with per-slide text
```

### `inventory.py` Inventory all text shapes in a .pptx file.

```text
usage: inventory.py [-h] [--output OUTPUT] input

Inventory text shapes in a .pptx

positional arguments:
  input            Input .pptx file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Save JSON to file (default: stdout)
```

### `replace.py` Replace text in a .pptx presentation using an inventory JSON.

```text
usage: replace.py [-h] [--find FIND] [--replace REPLACE_WITH]
                  input replacements_or_output [output]

Replace text in a .pptx file

positional arguments:
  input                 Input .pptx file
  replacements_or_output
                        Replacements JSON file (inventory mode) or output path
                        (find/replace mode)
  output                Output .pptx file (inventory mode)

options:
  -h, --help            show this help message and exit
  --find FIND           Text to find (simple mode)
  --replace REPLACE_WITH
                        Replacement text (simple mode)
```

### `thumbnail.py` Render a PowerPoint presentation as a thumbnail grid image.

```text
usage: thumbnail.py [-h] [--cols COLS] [--dpi DPI] input [output_prefix]

Render .pptx slides as a thumbnail grid

positional arguments:
  input          Input .pptx file
  output_prefix  Output filename prefix (default: thumbnails)

options:
  -h, --help     show this help message and exit
  --cols COLS
  --dpi DPI
```

## Visual verification workflow

Use a structural verification pass before delivering:

```
python scripts/inventory.py output.pptx
python scripts/extract-text.py output.pptx
```

`thumbnail.py` is available only when the environment already supplies LibreOffice.
It is optional and is not a bundled dependency.

## Notes

- `python-pptx` creates valid .pptx files but does not match PowerPoint's visual
  fidelity for complex custom themes. For pixel-perfect slides, LibreOffice Impress
  or the original PowerPoint application is needed.
- Slide layouts (indices) depend on the presentation's theme. If the default layouts
  don't match, load a template file: `Presentation("template.pptx")` and add slides
  to it.
