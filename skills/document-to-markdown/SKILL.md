---
name: document-to-markdown
description: "Convert local office documents and data files to clean Markdown for analysis, search, summarization, or reuse in notes. Use when the user wants the semantic content of a PDF, Word document, PowerPoint, Excel workbook, or common data file in Markdown. Use this for ingestion, not for layout-preserving or final human-facing document conversion."
user-invocable: false
---

# Document to Markdown

Convert local files into Markdown that preserves useful semantic structure for an agent to read and reuse. This is a closed conversion task, so prefer the bundled script unless the output needs custom processing.

## Dependencies

The app installs the locked `markitdown` dependency when this skill is loaded. Run Python with `python`; do not repeat installation.

## Choose an approach

| Need                                        | Approach                                                    |
| ------------------------------------------- | ----------------------------------------------------------- |
| Convert one supported local file safely     | Use `convert.py`                                            |
| Transform or combine the Markdown in memory | Use the MarkItDown API below                                |
| Edit or create the source format            | Use the PDF, DOCX, spreadsheet, or PowerPoint skill         |
| Preserve visual layout                      | Work in the source format; Markdown is semantic, not visual |

## Custom conversion pipeline

Use the library directly when conversion is one step in a larger Python task:

```python
from pathlib import Path

from markitdown import MarkItDown

source = Path("attachments/input.docx")
result = MarkItDown(enable_plugins=False).convert_local(str(source))
markdown = result.text_content

# Perform task-specific cleanup or combine it with other content here.
output = Path("output/input.md")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(markdown, encoding="utf-8")
```

Keep plugins disabled. Use only local files, not URLs or cloud conversion services. If a format's semantics are missing, inspect it with its dedicated skill instead of guessing from incomplete Markdown.

## Quality gate

Before using or delivering the Markdown:

1. Read the output and confirm the expected sections are present.
2. Compare representative tables, links, lists, and slide or sheet boundaries against the source.
3. Report any content that the converter could not represent cleanly.

## Script reference

Use the script for the standard local-file conversion. Full options are in [`reference.md`](reference.md).

- `convert.py`: Convert a local document to Markdown for analysis or reuse.
