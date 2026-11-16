# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `create.py` Create a Word document (.docx) from Markdown or structured JSON.

```text
usage: create.py [-h] --output OUTPUT [--content CONTENT] [--input INPUT]
                 [--title TITLE] [--author AUTHOR]

Create a Word document

options:
  -h, --help         show this help message and exit
  --output OUTPUT    Output .docx path
  --content CONTENT  Markdown text content
  --input INPUT      Input Markdown or JSON file
  --title TITLE      Document title (metadata)
  --author AUTHOR    Document author (metadata)
```

## `edit.py` Edit an existing Word document: add content, modify paragraphs, or do find-and-replace.

```text
usage: edit.py [-h] [--output OUTPUT] [--append APPEND] [--style STYLE]
               [--heading LEVEL] [--find FIND] [--replace REPLACE]
               [--add-table JSON]
               input

Edit a Word document

positional arguments:
  input              Input .docx file

options:
  -h, --help         show this help message and exit
  --output OUTPUT    Output path (default: overwrite input)
  --append APPEND    Text to append as a new paragraph
  --style STYLE      Paragraph style for --append
  --heading LEVEL    Append as heading at this level (1-6)
  --find FIND        Text to find
  --replace REPLACE  Replacement text for --find
  --add-table JSON   Append a table from a JSON array of row arrays
```

## `extract-text.py` Extract text from a Word document (.docx).

```text
usage: extract-text.py [-h] [--json] [--include-tables] input

Extract text from a .docx file

positional arguments:
  input             Input .docx file

options:
  -h, --help        show this help message and exit
  --json            Output structured JSON with paragraphs and styles
  --include-tables  Include table cell text (default: included)
```

## `fill-template.py` Fill a .docx Jinja2 template using docxtpl -- supports {{ var }}, {% for %}, {% if %}.

```text
usage: fill-template.py [-h] [--values VALUES] [--values-file VALUES_FILE]
                        [--list-placeholders]
                        input [output]

Fill a .docx Jinja2 template with docxtpl

positional arguments:
  input                 Input .docx template (Jinja2: {{ var }} substitution,
                        for/if blocks supported)
  output                Output .docx file (omit with --list-placeholders)

options:
  -h, --help            show this help message and exit
  --values VALUES       JSON object mapping variable names to values
  --values-file VALUES_FILE
                        Path to a JSON file with variable values
  --list-placeholders   Print all {{ variable }} names found in the template
                        and exit
```

## `preview.py` Write an HTML page that lays out a Word document page by page, for the agent's browser to open, print and look at.

```text
usage: preview.py [-h] [--output OUTPUT] input

Write an HTML page that lays out a .docx page by page for the browser to print
and look at

positional arguments:
  input            Input .docx file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  HTML file to write (default: <input>.preview.html beside
                   the document)
```

## `redline.py` Make tracked changes (redlines) in an existing Word document: replace, delete, or insert text as revisions Word shows and can accept or reject.

```text
usage: redline.py [-h] [--author AUTHOR] [--edits EDITS] [--output OUTPUT]
                  [--show {accept,reject}]
                  input

Make tracked changes in a Word document

positional arguments:
  input                 Input .docx file

options:
  -h, --help            show this help message and exit
  --author AUTHOR       Name the revisions are recorded under
  --edits EDITS         JSON file with a list of edits
  --output OUTPUT       Output .docx path (required with --edits)
  --show {accept,reject}
                        Print the body text with all tracked changes accepted
                        or rejected, and exit
```

## `render-pages.py` Render the pages of a printed preview.py page to PNG images, refusing a print taken before the document was laid out, and failing when a page's body text runs past its bottom margin.

```text
usage: render-pages.py [-h] [--output OUTPUT] [--dpi DPI] input

Render the PDF printed from a preview.py page to one PNG per page

positional arguments:
  input            PDF printed from the preview page with agent-browser pdf

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Output directory (default: .)
  --dpi DPI        Resolution (default: 110)
```

## `validate.py` Validate a Word document's XML before delivering it, and with --author check that every edit against the original is tracked.

```text
usage: validate.py [-h] [--original ORIGINAL] [--author AUTHOR] [--json] input

Validate a Word document's XML

positional arguments:
  input                .docx file to check

options:
  -h, --help           show this help message and exit
  --original ORIGINAL  The document it was edited from; its own errors are not
                       reported
  --author AUTHOR      The name you redlined under; turns on the check that
                       every edit against --original is tracked
  --json               Print problems as JSON
```
