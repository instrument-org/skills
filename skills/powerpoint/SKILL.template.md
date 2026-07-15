---
name: powerpoint
description: "Work with PowerPoint files (.pptx). Use whenever the user wants to create presentations, generate PPTX files with slides and content, extract text from PowerPoint files, inspect an existing deck's text and shape inventory, or replace text in an existing deck using a template-fill workflow. Activate whenever the user mentions a .pptx file, PowerPoint, presentation slides, or asks to create, read, edit, or extract text from one."
---

# PowerPoint

Use the Python scripts in `scripts/` to create, read, and edit PowerPoint presentations.

## Dependencies

The app installs this skill's locked Python dependencies when it is loaded.
Run its scripts with `python`; do not repeat installation.

## Scripts

{{GENERATED_SCRIPT_DOCS}}

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
