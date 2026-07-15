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

{{GENERATED_SCRIPT_DOCS}}

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
  (old binary format) or PDF.
- Table styles require the style to exist in the document's style gallery. `"Table Grid"`
  is safe to use universally.
