---
name: powerpoint
description: "Work with PowerPoint files (.pptx). Use whenever the user wants to create presentations, generate PPTX files with slides and content, extract text from PowerPoint files, visually inspect a presentation as thumbnail images, or replace text in an existing deck using a template-fill workflow. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, edit, or extract text from one."
---

# PowerPoint

Use the Python scripts in `scripts/` to create, read, and edit PowerPoint presentations.

## Dependencies

Install before first use:

```
pip install python-pptx Pillow pymupdf
```

`thumbnail.py` also requires LibreOffice for PPTX-to-PDF conversion:

```
# macOS
brew install libreoffice
# Ubuntu/Debian
apt install libreoffice
```

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Visual verification workflow

Always inspect the output before delivering:

```
python scripts/thumbnail.py output.pptx preview --cols 4
```

Review the grid image for text cutoff, alignment issues, or layout problems.

## Notes

- `python-pptx` creates valid .pptx files but does not match PowerPoint's visual
  fidelity for complex custom themes. For pixel-perfect slides, LibreOffice Impress
  or the original PowerPoint application is needed.
- Slide layouts (indices) depend on the presentation's theme. If the default layouts
  don't match, load a template file: `Presentation("template.pptx")` and add slides
  to it.
- To convert .pptx to PDF: `soffice --headless --convert-to pdf deck.pptx`
