---
name: pdf
description: "Work with PDF files. Use whenever the user wants to do anything with a PDF: extracting text content, extracting tables, finding hyperlinks, pulling embedded images, reading or updating document metadata, rendering pages as images, creating new PDFs from text, Markdown, or images, merging or splitting PDFs, filling form fields, rotating pages, adding page numbers, watermarking, or inserting images. Activate whenever the user mentions a .pdf file or asks to read, parse, inspect, render, create, modify, merge, split, or fill one."
---

# PDF

Use the Python scripts in `scripts/` to work with PDF files.

## Dependencies

The app installs this skill's locked Python dependencies when it is loaded.
Run its scripts with `python`; do not repeat installation.

`render-pages.py` uses PyMuPDF for native rendering -- no Poppler or external tools needed.

## Scripts

{{GENERATED_SCRIPT_DOCS}}

## Visual verification workflow

After creating or modifying a PDF, always render and inspect before delivering:

```
python scripts/render-pages.py output.pdf --output ./preview --dpi 150
```

Review the PNG files to catch clipped text, layout issues, or broken formatting.

## Notes

- Text extraction accuracy depends on whether the PDF has embedded text layers. Scanned PDFs
  require OCR (not included in this skill -- use `pytesseract` + `pdf2image` for OCR).
- `pymupdf` (fitz) handles text and image extraction and page rendering natively and quickly.
  `pdfplumber` provides the best table detection. `pypdf` is used for structural operations
  (merge/split/rotate/metadata/forms).
- `fill-form.py` works with AcroForm fields. XFA forms (Adobe LiveCycle) are not supported.
