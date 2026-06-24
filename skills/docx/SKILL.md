---
name: docx
description: "Work with Word documents (.docx). Use whenever the user wants to extract text from a .docx file, create a new Word document with headings, paragraphs, lists, or tables, fill placeholders in a .docx template, or edit an existing document (append content, find-and-replace, add tables). Activate whenever the user mentions a .docx file, Word document, or asks to read, create, generate, fill, edit, or template one."
---

# DOCX

Use the Python scripts in `scripts/` to work with Word documents.

## Dependencies

Install before first use:

```
pip install python-docx docxtpl
```

## Scripts

### `create.py` Create a Word document (.docx) from Markdown or structured JSON.

```text
usage: create.py [-h] --output OUTPUT [--content CONTENT] [--input INPUT]
                 [--title TITLE] [--author AUTHOR]

Create a Word document

optional arguments:
  -h, --help         show this help message and exit
  --output OUTPUT    Output .docx path
  --content CONTENT  Markdown text content
  --input INPUT      Input Markdown or JSON file
  --title TITLE      Document title (metadata)
  --author AUTHOR    Document author (metadata)
```

### `edit.py` Edit an existing Word document: add content, modify paragraphs, or do find-and-replace.

```text
usage: edit.py [-h] [--output OUTPUT] [--append APPEND] [--style STYLE]
               [--heading LEVEL] [--find FIND] [--replace REPLACE]
               [--add-table JSON]
               input

Edit a Word document

positional arguments:
  input              Input .docx file

optional arguments:
  -h, --help         show this help message and exit
  --output OUTPUT    Output path (default: overwrite input)
  --append APPEND    Text to append as a new paragraph
  --style STYLE      Paragraph style for --append
  --heading LEVEL    Append as heading at this level (1-6)
  --find FIND        Text to find
  --replace REPLACE  Replacement text for --find
  --add-table JSON   Append a table from a JSON array of row arrays
```

### `extract-text.py` Extract text from a Word document (.docx).

```text
usage: extract-text.py [-h] [--json] [--include-tables] input

Extract text from a .docx file

positional arguments:
  input             Input .docx file

optional arguments:
  -h, --help        show this help message and exit
  --json            Output structured JSON with paragraphs and styles
  --include-tables  Include table cell text (default: included)
```

### `fill-template.py` Fill a .docx Jinja2 template using docxtpl -- supports {{ var }}, {% for %}, {% if %}.

```text
usage: fill-template.py [-h] [--values VALUES] [--values-file VALUES_FILE]
                        [--list-placeholders]
                        input [output]

Fill a .docx Jinja2 template with docxtpl

positional arguments:
  input                 Input .docx template (Jinja2: {{ var }} substitution,
                        for/if blocks supported)
  output                Output .docx file (omit with --list-placeholders)

optional arguments:
  -h, --help            show this help message and exit
  --values VALUES       JSON object mapping variable names to values
  --values-file VALUES_FILE
                        Path to a JSON file with variable values
  --list-placeholders   Print all {{ variable }} names found in the template
                        and exit
```

## Template syntax

`fill-template.py` uses `docxtpl` (Jinja2 for Word). Write expressions directly in your
`.docx` template:

- `{{ variable }}` -- simple substitution
- `{% for item in items %}...{% endfor %}` -- repeat rows or paragraphs
- `{% if condition %}...{% endif %}` -- conditional content

Pass values as a JSON object with `--values` or point to a file with `--values-file`.
Lists and nested dicts work as Jinja2 context objects.

## Notes

- `python-docx` can read and write `.docx` files but cannot convert to/from `.doc`
  (old binary format) or PDF. For PDF conversion, use LibreOffice:
  `soffice --headless --convert-to pdf document.docx`
- Table styles require the style to exist in the document's style gallery. `"Table Grid"`
  is safe to use universally.
