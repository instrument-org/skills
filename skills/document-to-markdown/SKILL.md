---
name: document-to-markdown
description: "Convert local office documents and data files to clean Markdown for analysis, search, summarization, or reuse in notes. Use when the user wants the semantic content of a PDF, Word document, PowerPoint, Excel workbook, or common data file in Markdown. Use this for ingestion, not for layout-preserving or final human-facing document conversion."
---

# Document to Markdown

Convert local knowledge-work files into Markdown that preserves headings,
tables, links, and other useful structure for an agent to read and reuse.

## Dependencies

The app installs this skill's locked Python dependencies when it is loaded.
Run its scripts with `python`; do not repeat installation.

## When to use this skill

- Convert a document into agent-readable Markdown before analysis or summarization.
- Extract a presentation, workbook, PDF, email export, or data file into a reusable note.
- Prepare a local document for LLM analysis without discarding its semantic structure.

Use the PDF, DOCX, spreadsheet, or PowerPoint skills when the task requires
format-specific editing or creation. Use the Markdown skill for deliberate HTML
conversion. This skill is for local document ingestion, not preserving visual
layout exactly.

## Security

The script accepts only local PDF, Office, email, text, and data files. Do not
pass untrusted URLs, enable plugins, or use cloud conversion services through
this skill.

## Scripts

### `convert.py` Convert a local document to Markdown for analysis or reuse.

```text
usage: convert.py [-h] --output OUTPUT [--force] input

Convert a local document to Markdown

positional arguments:
  input            Local input file

options:
  -h, --help       show this help message and exit
  --output OUTPUT  Markdown output path
  --force          Overwrite an existing output file
```
