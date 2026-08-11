---
name: docx
description: "Work with Word documents (.docx). Use whenever the user wants to extract text from a .docx file, create a new Word document with headings, paragraphs, lists, tables, images, headers, or footers, fill a Word template, or edit an existing document. Activate whenever the user mentions a .docx file, Word document, or asks to read, create, generate, fill, edit, or template one."
---

# DOCX

Use `python-docx` and `docxtpl` directly for composed documents and custom edits. The bundled scripts are conveniences for closed extraction, replacement, template filling, and simple documents.

## Dependencies

The app installs the locked `python-docx`, `docxtpl`, and Pillow dependencies when this skill is loaded. Run Python with `python`; do not repeat installation.

## Choose an approach

| Need                                                         | Approach                            |
| ------------------------------------------------------------ | ----------------------------------- |
| Create a structured or polished document                     | Compose it with `python-docx`       |
| Modify styles, sections, tables, images, headers, or footers | Edit with `python-docx`             |
| Fill a user-authored Word template                           | Use `docxtpl` or `fill-template.py` |
| Extract text or perform cross-run find-and-replace           | Use the bundled script              |
| Create a quick headings-and-paragraphs document              | `create.py` is acceptable           |

## Create a styled document

Build task-specific structure directly instead of forcing content through the limited Markdown convenience script:

```python
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.7)
section.bottom_margin = Inches(0.7)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

normal = doc.styles["Normal"]
normal.font.name = "Aptos"
normal.font.size = Pt(10.5)

title = doc.add_heading("Quarterly Review", level=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
subtitle = doc.add_paragraph("Prepared for the operating team")
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading("Highlights", level=1)
paragraph = doc.add_paragraph()
paragraph.add_run("Revenue grew 18%. ").bold = True
paragraph.add_run("Retention remained above target.")

table = doc.add_table(rows=1, cols=3)
table.style = "Table Grid"
for cell, label in zip(table.rows[0].cells, ["Metric", "Current", "Target"]):
    cell.text = label
    for run in cell.paragraphs[0].runs:
        run.bold = True
        run.font.color.rgb = RGBColor(31, 78, 121)
for values in [("Revenue", "1.2M USD", "1.1M USD"), ("Retention", "94%", "92%")]:
    cells = table.add_row().cells
    for cell, value in zip(cells, values):
        cell.text = value

doc.add_page_break()
doc.add_heading("Next steps", level=1)
for text in ["Expand the pilot", "Review results in 30 days"]:
    doc.add_paragraph(text, style="List Bullet")

doc.core_properties.title = "Quarterly Review"
doc.sections[0].footer.paragraphs[0].text = "Confidential"
output = Path("output/quarterly-review.docx")
output.parent.mkdir(parents=True, exist_ok=True)
doc.save(output)
```

Add an image at a known width and let Word retain its aspect ratio:

```python
doc.add_picture("attachments/chart.png", width=Inches(6.2))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
```

`add_picture` needs a raster file, so draw or convert one first rather than
hand-rolling a rasterizer: Pillow is installed for images composed in Python,
and `ffmpeg` converts an image you already have. Write it under `work/` and
embed that path.

## Edit an existing document

Load the original file and make the smallest structural change possible:

```python
from pathlib import Path

from docx import Document

doc = Document("attachments/input.docx")
doc.add_heading("Appendix", level=1)
doc.add_paragraph("Additional findings go here.")
output = Path("output/edited.docx")
output.parent.mkdir(parents=True, exist_ok=True)
doc.save(output)
```

Word often splits visible text across formatting runs. Replacing `paragraph.text` discards run formatting. Use `edit.py` for plain cross-run replacement, or explicitly rebuild runs when the desired formatting is known. Remember to traverse table cells, headers, and footers when an edit applies to the entire document.

## Fill a Word template

`docxtpl` preserves a user-authored design while substituting structured data:

```python
from pathlib import Path

from docxtpl import DocxTemplate

template = DocxTemplate("attachments/template.docx")
template.render(
    {
        "client": "Acme Corp",
        "items": [{"name": "Discovery", "amount": 2500}],
        "approved": True,
    },
    autoescape=True,
)
output = Path("output/filled.docx")
output.parent.mkdir(parents=True, exist_ok=True)
template.save(output)
```

Write Jinja expressions directly in the Word template:

- `{{ variable }}` for escaped substitution
- `{% for item in items %}...{% endfor %}` for repeated content inside one paragraph or cell
- `{% if condition %}...{% endif %}` for an inline conditional

To repeat whole Word structures, use `docxtpl` structural tags in dedicated wrapper paragraphs or rows. For a repeated table row, put `{%tr for item in items %}` in its own row, the `{{ item.name }}` and other expressions in the next row, and `{%tr endfor %}` in a third row. Use `{%p ... %}` the same way to repeat a whole paragraph. The tag-only wrapper rows or paragraphs are removed during rendering.

Keep each control tag in one Word run as required by `docxtpl`; Word can split visually continuous text into multiple XML runs. Keep `autoescape=True` so values containing `&`, `<`, or `>` remain valid Word XML. When sending Python through a shell heredoc, quote its delimiter as `<<'PY'` so shell expansion cannot alter currency text or template expressions.

## Format traps

- `python-docx` handles `.docx`, not legacy `.doc` files or PDF conversion.
- Named styles and table styles must exist in the document or its template. Built-in styles such as `Normal`, `Heading 1`, and `Table Grid` are portable.
- Widths are constrained by the section margins. Word may reflow tables that exceed the usable page width.
- A new section can change headers, footers, margins, and page orientation.
- Page numbers and some advanced Word fields require lower-level XML. Preserve existing fields when editing a template unless the task requires rebuilding them.

## Quality gate

Always reopen the saved document with `Document(...)` and verify expected paragraphs, styles, tables, images, sections, metadata, and filled values. When LibreOffice or Word is available, render or open the result and inspect every page for clipping, awkward page breaks, table overflow, and missing glyphs. When neither is, open each image you generated at its own path and look at it: reopening the document proves a picture is present, never that it looks right. Say plainly when the document itself was not rendered.

## Script reference

Use scripts for bounded convenience operations. Full options are in [`reference.md`](reference.md).

{{GENERATED_SCRIPT_INDEX}}
