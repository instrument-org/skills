# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

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
