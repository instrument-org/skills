---
name: docx
description: "Read, create, and edit Word documents (.docx), including filling templates, tracked changes (redlines), and comments."
---

# DOCX

Use `python-docx` and `docxtpl` directly for composed documents and custom edits. The bundled scripts are conveniences for closed extraction, replacement, template filling, and simple documents.

## Dependencies

The app installs the locked `python-docx`, `docxtpl`, Pillow, and PyMuPDF dependencies when this skill is loaded. Run Python with `python`; do not repeat installation. Pages are laid out for review in the task's browser (`agent-browser`) by the same renderer Instrument shows Word files with.

## Choose an approach

| Need                                                         | Approach                            |
| ------------------------------------------------------------ | ----------------------------------- |
| Create a structured or polished document                     | Compose it with `python-docx`       |
| Modify styles, sections, tables, images, headers, or footers | Edit with `python-docx`             |
| Fill a user-authored Word template                           | Use `docxtpl` or `fill-template.py` |
| Redline: edits the reader accepts or rejects in Word         | Tracked changes with `redline.py`   |
| Review comments anchored to text                             | `doc.add_comment` on isolated runs  |
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
normal.font.name = "Arial"
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
output = Path("quarterly-review.docx")
output.parent.mkdir(parents=True, exist_ok=True)
doc.save(output)
```

Add an image at a known width and let Word retain its aspect ratio:

```python
import os

chart = os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "chart.png")
doc.add_picture(chart, width=Inches(6.2))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
```

`add_picture` needs a raster file, so draw or convert one first rather than
hand-rolling a rasterizer: Pillow is installed for images composed in Python,
and `ffmpeg` converts an image you already have. Save it beside the script and
embed that path.

## Edit an existing document

Load the original file and make the smallest structural change possible:

```python
import os
from pathlib import Path

from docx import Document

doc = Document(os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "input.docx"))
doc.add_heading("Appendix", level=1)
doc.add_paragraph("Additional findings go here.")
output = Path("edited.docx")
output.parent.mkdir(parents=True, exist_ok=True)
doc.save(output)
```

Word often splits visible text across formatting runs. Replacing `paragraph.text` discards run formatting. Use `edit.py` for plain cross-run replacement, or explicitly rebuild runs when the desired formatting is known. Remember to traverse table cells, headers, and footers when an edit applies to the entire document.

## Redline with tracked changes

When the person asks to redline, mark up, or suggest edits, or the document is a contract or anything someone else will review, record every edit as a tracked change: an edit made with plain `python-docx` is invisible in Word's review pane and cannot be rejected. Import `redline.py` and keep composing with `python-docx`:

```python
import os
import sys
from pathlib import Path

from docx import Document

sys.path.insert(0, "<docx-skill-path>/scripts")
from redline import Redline, resolve, view_text

doc = Document(os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "contract.docx"))
rl = Redline(doc, author="Claude")  # one author and timestamp for the whole pass
for paragraph in doc.paragraphs:
    rl.replace(paragraph, "thirty (30) days", "forty-five (45) days")  # count of replacements
    if paragraph.text.startswith("Non-compete."):
        rl.delete_paragraph(paragraph)
rl.insert_paragraph_after(doc.paragraphs[-1], "Either party may end this agreement with 60 days' notice.")
output = Path("contract-redlined.docx")
doc.save(output)

reopened = Document(output)
print(view_text(reopened, "accept"))  # the text if every change is accepted
print(view_text(reopened, "reject"))  # must read as the original
```

`replace` marks only the words that differ (`1,000 USD` to `5,000 USD` deletes `1,000` and inserts `5,000`), keeps the formatting of the text it replaces, and splits formatting runs as needed; pass `""` to delete. For a list of plain edits, `redline.py --edits edits.json` applies them across the body, tables, headers and footers and saves nothing if any edit matches nothing.

The markup, for edits `redline.py` does not cover (another author's insertion, a hyperlink, a field):

- An insertion is `<w:ins w:id=".." w:author=".." w:date="..">` around runs; a deletion is `<w:del ...>` around runs whose text is `<w:delText>`, never `<w:t>`. `w:id` is unique in the document.
- A deleted paragraph mark, `<w:pPr><w:rPr><w:del .../></w:rPr></w:pPr>`, joins the paragraph to the next one, so deleting a paragraph outright is that plus a `<w:del>` around every run. An inserted mark (`<w:ins .../>` there) is how a new paragraph is recorded. The `<w:ins/>` or `<w:del/>` comes first in that `w:rPr`; the schema fixes the order.
- To reject another author's insertion, nest a `<w:del>` inside their `<w:ins>`; to restore their deletion, add a new `<w:ins>` after their `<w:del>`. Never edit text inside their revisions.

`paragraph.text` and `paragraph.runs` skip runs inside `<w:ins>` and `<w:del>`, so on a redlined document they show neither version: read text through `view_text`, and search for text to redline before you redline near it. For a clean copy with every change accepted, run `resolve(doc.element.body, "accept")` and save under a new name; it settles text revisions only, not formatting changes. Run `validate.py --original <the original> --author "<the name>"` on the result (see Quality gate): it fails on any text that differs from the original without a tracked change recording it.

## Add review comments

`python-docx` anchors a comment to whole runs, so isolate the phrase first:

```python
runs = Redline(doc, author="Claude").isolate(paragraph, "1,000 USD")
comment = doc.add_comment(runs, text="This cap is below the industry norm.", author="Claude", initials="C")
comment.add_paragraph("A second paragraph, if needed.")
```

Reopen the document and check `doc.comments`. `python-docx` writes no reply threads (Word keeps those in `commentsExtended.xml`); to answer a comment, add a new comment on the same text.

## Fill a Word template

`docxtpl` preserves a user-authored design while substituting structured data:

```python
import os
from pathlib import Path

from docxtpl import DocxTemplate
from jinja2.sandbox import ImmutableSandboxedEnvironment

template = DocxTemplate(os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "template.docx"))
template.render(
    {
        "client": "Acme Corp",
        "items": [{"name": "Discovery", "amount": 2500}],
        "approved": True,
    },
    jinja_env=ImmutableSandboxedEnvironment(autoescape=True),
    autoescape=True,
)
output = Path("filled.docx")
output.parent.mkdir(parents=True, exist_ok=True)
template.save(output)
```

Write Jinja expressions directly in the Word template:

- `{{ variable }}` for escaped substitution
- `{% for item in items %}...{% endfor %}` for repeated content inside one paragraph or cell
- `{% if condition %}...{% endif %}` for an inline conditional

To repeat whole Word structures, use `docxtpl` structural tags in dedicated wrapper paragraphs or rows. For a repeated table row, put `{%tr for item in items %}` in its own row, the `{{ item.name }}` and other expressions in the next row, and `{%tr endfor %}` in a third row. Use `{%p ... %}` the same way to repeat a whole paragraph. The tag-only wrapper rows or paragraphs are removed during rendering.

Keep each control tag in one Word run as required by `docxtpl`; Word can split visually continuous text into multiple XML runs. Always render in `ImmutableSandboxedEnvironment`: a template is untrusted input, and the default Jinja environment lets an expression in it run commands on the user's machine. Keep `autoescape=True` so values containing `&`, `<`, or `>` remain valid Word XML. When sending Python through a shell heredoc, quote its delimiter as `<<'PY'` so shell expansion cannot alter currency text or template expressions.

## Format traps

- `python-docx` handles `.docx`, not legacy `.doc` files or PDF conversion. `office convert file.doc --to docx` converts a legacy file first, and `office convert report.docx --to pdf` makes a PDF. Their first use downloads LibreOffice, about 300 MB.
- A `\n` in run text becomes a line break inside the paragraph, not a new paragraph. Add a paragraph per paragraph, and use the `List Bullet` or `List Number` style for lists, never a typed `•`.
- Word ignores a table column's width unless every cell in the column has it: set `table.autofit = False` and `cell.width` on each cell, and keep the columns' sum within the margins.
- Cell shading written as XML uses `<w:shd w:val="clear" w:fill="D9E2F3"/>`; `w:val="solid"` paints the cell in the pattern color, black by default.
- A table of contents and the navigation pane list only built-in heading styles (`add_heading`) or styles with an outline level.
- Named styles and table styles must exist in the document or its template. Built-in styles such as `Normal`, `Heading 1`, and `Table Grid` are portable.
- Widths are constrained by the section margins. Word may reflow tables that exceed the usable page width.
- A new section can change headers, footers, margins, and page orientation.
- Page numbers and some advanced Word fields require lower-level XML. Preserve existing fields when editing a template unless the task requires rebuilding them.
- Name fonts both Word and the preview have, such as Arial, Georgia, Verdana and Times New Roman. A font missing where the document is opened is substituted, Aptos on older Word included, and the preview substitutes it too, so line breaks and page breaks there are only exact for fonts this computer has.

## Quality gate

Build and check the document in its job folder, and copy it to where it goes only once it passes. Run `validate.py` on every document you deliver; for an edited one, pass `--original` so errors the file already had are not reported, and `--author` when you redlined it:

```bash
python <docx-skill-path>/scripts/validate.py <job>/report.docx --original <original>.docx --author "Claude"
```

Reopening with `python-docx` proves only that `python-docx` can read the file: Word refuses or repairs markup it accepts, such as `<w:t>` inside a deletion, an undefined relationship id, or a comment marker naming no comment. Always reopen the saved document with `Document(...)` and verify expected paragraphs, styles, tables, images, sections, metadata, and filled values. Then look at every page:

```bash
python <docx-skill-path>/scripts/preview.py <job>/report.docx --output <job>/report.preview.html
agent-browser open <job>/report.preview.html
agent-browser wait --fn "document.body.dataset.ready || document.body.dataset.error"
agent-browser pdf <job>/report.preview.pdf
python <docx-skill-path>/scripts/render-pages.py <job>/report.preview.pdf --output <job>/report-pages
```

`render-pages.py` exits 1 with a `FAIL overflow` line for each page whose body text runs past its bottom margin. The preview can keep that text on the page, or cut it off the bottom of the image, where Word moves it to the next page, so a page count from the preview alone can be one short. Fix it before saying the document fits.

Read every page image and check for clipping, awkward page breaks, tables running past the margins, missing images, and missing glyphs. Fix the generator, rebuild, and look again. The preview needs a network connection to load its renderer; if `document.body.dataset.error` is set or the page never becomes ready, run `office render <job>/report.docx` and read its page images instead. It draws the pages with LibreOffice as a PDF export would, offline. If that fails too, say plainly that the document itself was not rendered.

## Script reference

Use scripts for bounded convenience operations. Full options are in [`reference.md`](reference.md).

- `create.py`: Create a Word document (.docx) from Markdown or structured JSON.
- `edit.py`: Edit an existing Word document: add content, modify paragraphs, or do find-and-replace.
- `extract-text.py`: Extract text from a Word document (.docx).
- `fill-template.py`: Fill a .docx Jinja2 template using docxtpl -- supports {{ var }}, {% for %}, {% if %}.
- `preview.py`: Write an HTML page that lays out a Word document page by page, for the agent's browser to open, print and look at.
- `redline.py`: Make tracked changes (redlines) in an existing Word document: replace, delete, or insert text as revisions Word shows and can accept or reject.
- `render-pages.py`: Render the pages of a printed preview.py page to PNG images, refusing a print taken before the document was laid out, and failing when a page's body text runs past its bottom margin.
- `validate.py`: Validate a Word document's XML before delivering it, and with --author check that every edit against the original is tracked.
