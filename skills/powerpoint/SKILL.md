---
name: powerpoint
description: "Read, create, and edit PowerPoint presentations (.pptx), including decks built from templates."
---

# PowerPoint

Use `python-pptx` directly for composed presentations and custom edits. The bundled scripts cover what python-pptx cannot do (duplicating, deleting and reordering slides, checking the saved package) and conveniences for extraction, inventory, replacement, quick text-only decks, and drawing the slides so you can look at them.

## Dependencies

The app installs the locked `python-pptx`, `lxml`, Pillow, and PyMuPDF dependencies when this skill is loaded. Run Python with `python`; do not repeat installation. Slides are drawn for review in the task's browser (`agent-browser`) by the same renderer Instrument shows decks with; `office render deck.pptx` draws it with LibreOffice instead, offline and as a PDF export would; its first use downloads LibreOffice, about 300 MB. For a deck you did not make, render through `soffice.py`, which blanks the deck's links to outside files first. `office convert old.ppt --to pptx` converts a legacy deck.

## Choose an approach

| Need                           | Approach                                                             |
| ------------------------------ | -------------------------------------------------------------------- |
| Compose a designed deck        | Use `python-pptx` with explicit geometry                             |
| Extend an existing template    | Load it with `Presentation(...)` and use its layouts or named shapes |
| Build from a template's slides | `slides.py --order`, then fill the slides with `python-pptx`         |
| Create a quick text-only deck  | `create.py` is acceptable                                            |
| Extract or inventory content   | Use `extract-text.py` or `inventory.py`                              |
| Replace plain text across runs | Use `replace.py --find ... --replace ...`                            |
| Check the saved file           | `validate.py`, with `--original` for a template-built deck           |
| Look at the slides             | `preview.py`, print with `agent-browser pdf`, then `thumbnail.py`    |

## Compose a slide

Prefer a blank layout and explicit placement when the visual result matters:

```python
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
slide = prs.slides.add_slide(prs.slide_layouts[6])

background = slide.background.fill
background.solid()
background.fore_color.rgb = RGBColor(248, 249, 252)

title = slide.shapes.add_textbox(
    Inches(0.8), Inches(0.65), Inches(11.8), Inches(0.7)
)
title.name = "Title"
title_frame = title.text_frame
title_frame.clear()
title_frame.margin_left = 0
run = title_frame.paragraphs[0].add_run()
run.text = "Quarterly Review"
run.font.name = "Georgia"
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
output = Path("quarterly-review.pptx")
output.parent.mkdir(parents=True, exist_ok=True)
prs.save(output)
```

## Fit an image without distortion

Use Pillow only to read dimensions, then place the image with preserved aspect ratio:

```python
import os

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
    os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "chart.png"),
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

## Build from a template's slides

python-pptx can only add a slide from a layout, so a deck built from a template's own slides starts with `slides.py`: give the final order as slide numbers (as `extract-text.py` prints them), repeating one to duplicate it and leaving one out to delete it. It keeps the package consistent (relationships, content types, sections, links to deleted slides, notes and media nothing uses any more) and gives each duplicate its own notes and charts. `--prune-layouts` also drops layouts no slide uses.

```bash
python <powerpoint-skill-path>/scripts/extract-text.py "$INSTRUMENT_ATTACHMENTS/template.pptx"
python <powerpoint-skill-path>/scripts/slides.py "$INSTRUMENT_ATTACHMENTS/template.pptx" <job>/deck.pptx --order 1,4,4,4,7,9
```

Do the structural pass first and fill content after, on the output: a duplicate is a copy of its source as it stands. Then edit with `python-pptx` as below, and finish with `validate.py <job>/deck.pptx --original <template>`.

- When the template shows four team members and you have three, delete the fourth member's whole group (picture and text boxes), not only its text, then look for orphaned shapes in the preview.
- Deleting an animated shape leaves the slide's `<p:timing>` pointing at it, and PowerPoint offers to repair the deck; remove the slide's `p:timing` element too (`slide.element.find(qn("p:timing"))`, `qn` from `pptx.oxml.ns`).
- Template art is often SVG or EMF, which `add_picture` cannot read (`UnidentifiedImageError`). To reuse a template's icon or picture, duplicate a slide that already has it.
- Editing the XML directly, go through the `lxml` elements python-pptx gives you (`shape.element`, `slide.element`). Never round-trip a part through `xml.etree.ElementTree`, which renames namespace prefixes and leaves a deck PowerPoint cannot open.

## Edit an existing template

Template layout indices vary. Inspect the deck and target stable shape names when possible:

```python
import os
from pathlib import Path

from pptx import Presentation

prs = Presentation(os.path.join(os.environ["INSTRUMENT_ATTACHMENTS"], "template.pptx"))
slide = prs.slides[0]
by_name = {shape.name: shape for shape in slide.shapes}
by_name["Title"].text = "Updated title"
output = Path("updated.pptx")
output.parent.mkdir(parents=True, exist_ok=True)
prs.save(output)
```

Assigning `shape.text` or `text_frame.text` collapses the paragraphs to one unstyled run, erasing run-level formatting; assign `run.text` instead. For existing designs, edit the smallest possible run or use the plain cross-run replacement script only when inheriting the first run's formatting is acceptable. Inventory JSON keys are shape positions in that exact deck, not durable identifiers across deck revisions. Give each list item its own paragraph and let bullets come from the layout; a literal `•` in the text shows two bullets.

## Design a deck

- One message per slide, written as its title: "East and North carried the quarter", not "Regional results".
- One loud element per slide (the number, the chart, the claim) and everything else quieter in size and gray.
- Titles sit at the same position, size and color on every content slide; vary the body layout across slides instead.
- Figures go in native charts (`add_chart`) so they stay editable, with a title, data labels and colors from the deck's palette rather than the library default.
- Body text at 14pt or more on a 13.33 in slide, 0.5 in clear of every edge, and no slide that is only a title and bullets when a chart, a number or a picture would carry it.
- Left-align body text and lists, and end no title with a period.
- No accent line under a title and no decorative bar or stripe along a slide's or card's edge, which read as generated filler; set a card apart with a tint or whitespace.

## Layout traps

- Coordinates and sizes use English Metric Units; use `Inches` and `Pt` instead of unexplained integers.
- Shapes are drawn in insertion order. Later shapes appear above earlier ones.
- Slide layouts and placeholder indices depend on the presentation template.
- Name fonts both PowerPoint and the preview have, such as Arial, Georgia, Verdana and Times New Roman. A font missing where the deck is opened is substituted, Aptos on older Office included, and the preview substitutes it too, so text fit there is only exact for fonts this computer has.
- Text frames do not reliably shrink text to fit. Reserve enough height and inspect the rendered result.
- Text boxes have inner padding; set `text_frame.margin_left = 0` (and the other margins) when text must line up with a shape or line at the same x.
- Keep all shape bounds inside the slide and leave safe margins near each edge.

## Quality gate

Run `validate.py` on the saved deck, with `--original <template>` when it was built from one so the template's own schema errors are not reported; reopening it in python-pptx proves only that python-pptx can read it. Reopen the output with `Presentation(...)` and verify slide count, dimensions, shape bounds, expected text, tables, charts, images, and notes. Run `inventory.py` and `extract-text.py`, and for a template-built deck search the text for leftover placeholder copy (`lorem`, `ipsum`, `xxx`, `TODO`, `[insert`). Then look at every slide:

```bash
python <powerpoint-skill-path>/scripts/validate.py <job>/deck.pptx
python <powerpoint-skill-path>/scripts/preview.py <job>/deck.pptx
agent-browser open <job>/deck.preview.html
agent-browser wait --fn "document.body.dataset.ready || document.body.dataset.error"
agent-browser pdf <job>/deck.preview.pdf
python <powerpoint-skill-path>/scripts/thumbnail.py <job>/deck.preview.pdf <job>/deck-thumbs
```

Read the grid, and run `thumbnail.py --cols 1 --width 1200` on the same PDF for a slide that needs a closer look. Check for clipping, overlap, text running out of its box, tiny text, distorted images, poor contrast, and titles that move between slides. Fix the generator, rebuild, and look again. The preview needs a network connection to load its renderer; if `document.body.dataset.error` is set or the page never becomes ready, run `office render <job>/deck.pptx` and read its page images instead. If that fails too, say that the deck was checked structurally only.

## Script reference

Use scripts for bounded convenience operations. Full options are in [`reference.md`](reference.md).

- `create.py`: Create a PowerPoint presentation (.pptx) from a JSON slide definition.
- `extract-text.py`: Extract text from a PowerPoint presentation (.pptx).
- `inventory.py`: Inventory all text shapes in a .pptx file.
- `preview.py`: Write an HTML page that draws every slide of a deck, for the agent's browser to open, print and look at.
- `replace.py`: Replace text in a .pptx presentation using an inventory JSON.
- `slides.py`: Duplicate, delete and reorder a deck's slides, which python-pptx cannot do.
- `soffice.py`: Convert a deck with LibreOffice (soffice) without letting it touch the original or reach outside the file.
- `thumbnail.py`: Render a deck's slides as a thumbnail grid image.
- `validate.py`: Check a saved .pptx for the package faults PowerPoint refuses or offers to repair.
