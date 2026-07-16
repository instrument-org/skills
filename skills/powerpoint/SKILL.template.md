---
name: powerpoint
description: "Work with PowerPoint files (.pptx). Use whenever the user wants to create a presentation, generate slides with custom layout, images, tables, charts, or speaker notes, extract or inspect slide content, edit an existing deck, or fill a presentation template. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, edit, or extract text from one."
---

# PowerPoint

Use `python-pptx` directly for composed presentations and custom edits. The
bundled scripts are conveniences for extraction, inventory, replacement, quick
text-only decks, and optional thumbnail rendering.

## Dependencies

The app installs the locked `python-pptx`, Pillow, and PyMuPDF dependencies when
this skill is loaded. Run Python with `python`; do not repeat installation.
LibreOffice is an optional system dependency used only for visual rendering.

## Choose an approach

| Need                           | Approach                                                             |
| ------------------------------ | -------------------------------------------------------------------- |
| Compose a designed deck        | Use `python-pptx` with explicit geometry                             |
| Extend an existing template    | Load it with `Presentation(...)` and use its layouts or named shapes |
| Create a quick text-only deck  | `create.py` is acceptable                                            |
| Extract or inventory content   | Use `extract-text.py` or `inventory.py`                              |
| Replace plain text across runs | Use `replace.py --find ... --replace ...`                            |
| Render an overview             | Use `thumbnail.py` when LibreOffice is available                     |

## Compose a slide

Prefer a blank layout and explicit placement when the visual result matters:

```python
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
slide = prs.slides.add_slide(prs.slide_layouts[6])

background = slide.background.fill
background.solid()
background.fore_color.rgb = RGBColor(248, 249, 252)

accent = slide.shapes.add_shape(
    MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.18), prs.slide_height
)
accent.fill.solid()
accent.fill.fore_color.rgb = RGBColor(48, 92, 222)
accent.line.fill.background()

title = slide.shapes.add_textbox(
    Inches(0.8), Inches(0.65), Inches(11.8), Inches(0.7)
)
title.name = "Title"
title_frame = title.text_frame
title_frame.clear()
title_frame.margin_left = 0
run = title_frame.paragraphs[0].add_run()
run.text = "Quarterly Review"
run.font.name = "Aptos Display"
run.font.size = Pt(30)
run.font.bold = True
run.font.color.rgb = RGBColor(26, 31, 44)

metric = slide.shapes.add_textbox(
    Inches(0.8), Inches(2.0), Inches(4.4), Inches(2.2)
)
metric.name = "Primary metric"
frame = metric.text_frame
frame.clear()
frame.paragraphs[0].text = "94%"
frame.paragraphs[0].runs[0].font.size = Pt(46)
frame.paragraphs[0].runs[0].font.bold = True
detail = frame.add_paragraph()
detail.text = "customer retention"
detail.font.size = Pt(18)
detail.font.color.rgb = RGBColor(90, 98, 115)

caption = slide.shapes.add_textbox(
    Inches(0.8), Inches(6.75), Inches(11.8), Inches(0.35)
)
caption.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT
caption.text_frame.paragraphs[0].text = "Internal"

slide.notes_slide.notes_text_frame.text = "Discuss expansion of the pilot."
prs.core_properties.title = "Quarterly Review"
output = Path("output/quarterly-review.pptx")
output.parent.mkdir(parents=True, exist_ok=True)
prs.save(output)
```

## Fit an image without distortion

Use Pillow only to read dimensions, then place the image with preserved aspect
ratio:

```python
from PIL import Image

def contain_image(slide, path, left, top, width, height):
    with Image.open(path) as image:
        scale = min(width / image.width, height / image.height)
        rendered_width = int(image.width * scale)
        rendered_height = int(image.height * scale)
    x = left + (width - rendered_width) // 2
    y = top + (height - rendered_height) // 2
    return slide.shapes.add_picture(path, x, y, rendered_width, rendered_height)

contain_image(
    slide,
    "attachments/chart.png",
    Inches(6.2), Inches(1.7), Inches(6.2), Inches(4.6),
)
```

## Add a native chart

Native charts remain editable in PowerPoint:

```python
from pptx.chart.data import ChartData
from pptx.enum.chart import XL_CHART_TYPE

data = ChartData()
data.categories = ["Q1", "Q2", "Q3", "Q4"]
data.add_series("Revenue", (2.4, 2.8, 3.1, 3.6))
slide.shapes.add_chart(
    XL_CHART_TYPE.COLUMN_CLUSTERED,
    Inches(6.5), Inches(1.7), Inches(5.8), Inches(4.4),
    data,
)
```

## Edit an existing template

Template layout indices vary. Inspect the deck and target stable shape names
when possible:

```python
from pathlib import Path

from pptx import Presentation

prs = Presentation("attachments/template.pptx")
slide = prs.slides[0]
by_name = {shape.name: shape for shape in slide.shapes}
by_name["Title"].text = "Updated title"
output = Path("output/updated.pptx")
output.parent.mkdir(parents=True, exist_ok=True)
prs.save(output)
```

Assigning `shape.text` or clearing a text frame can erase run-level formatting.
For existing designs, edit the smallest possible run or use the plain
cross-run replacement script only when inheriting the first run's formatting is
acceptable. Inventory JSON keys are shape positions in that exact deck, not
durable identifiers across deck revisions.

## Layout traps

- Coordinates and sizes use English Metric Units; use `Inches` and `Pt` instead
  of unexplained integers.
- Shapes are drawn in insertion order. Later shapes appear above earlier ones.
- Slide layouts and placeholder indices depend on the presentation template.
- PowerPoint may substitute fonts that are unavailable on the viewing machine.
- Text frames do not reliably shrink text to fit. Reserve enough height and
  inspect the rendered result.
- Keep all shape bounds inside the slide and leave safe margins near each edge.

## Quality gate

Reopen the output with `Presentation(...)` and verify slide count, dimensions,
shape bounds, expected text, tables, charts, images, and notes. Run
`inventory.py` and `extract-text.py`. When LibreOffice is available, render the
deck with `thumbnail.py` and inspect every slide for clipping, overlap, tiny
text, image distortion, and poor contrast. State when only structural
verification was possible.

## Script reference

Use scripts for bounded convenience operations. Full options are in
[`reference.md`](reference.md).

{{GENERATED_SCRIPT_INDEX}}
