#!/usr/bin/env python3
"""Write an HTML page that lays out a Word document page by page, for the agent's browser to open, print and look at.

The page lays the document out with the same renderer Instrument uses to show a Word file to the person, loaded from a CDN, so it needs a network connection. Each page prints on its own sheet at the document's page size. When pagination has settled, the page sets `document.body.dataset.ready` to the page count; on failure it sets `document.body.dataset.error`. A page whose body text runs past its bottom margin, which Word would move to the next page, gets a `FAIL overflow` line printed onto it and listed in `document.body.dataset.overflow`.
"""

import argparse
import base64
import html
import json
import sys
from pathlib import Path

from lib.stored_pages import without_stored_page_count

# Printed in place of the pages when the preview is printed before they are
# laid out, and refused by render-pages.py, so an early print cannot pass as
# the document.
EARLY_PRINT = "This preview was printed before its pages were laid out. Wait for document.body.dataset.ready, then print again."

# Opens the line printed onto a page whose body text runs past its bottom
# margin, which render-pages.py looks for.
OVERFLOW = "FAIL overflow:"

# The renderer and the version Instrument itself ships, so the preview lays
# out what the person will see when they open the document there.
RENDERER = "@extend-ai/react-docx@0.8.4"
REACT = "19.2.0"
EMU_PER_PIXEL = 9525

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>__TITLE__</title>
<style>
  @page { size: __W__px __H__px; margin: 0; }
  html, body { margin: 0; background: #fff; }
  [data-docx-page-wrapper] { break-after: page; }
  @media print {
    body:not([data-ready]) > * { display: none !important; }
    body:not([data-ready])::before { content: "__EARLY__"; display: block; padding: 48px; font: 28px sans-serif; }
  }
</style>
</head>
<body>
<div id="root"></div>
<script type="application/octet-stream" id="doc">__DOC__</script>
<script type="module">
import React from "https://esm.sh/react@__REACT__";
import { createRoot } from "https://esm.sh/react-dom@__REACT__/client";
import { DocxEditorViewer, setWasmSource, useDocxEditor } from "https://esm.sh/__RENDERER__?deps=react@__REACT__,react-dom@__REACT__";

const fail = (error) => { document.body.dataset.error = String(error?.message ?? error); };
// Pagination settles over several frames after the import, so the page count
// has to hold this many frames in a row before the layout counts as done.
const SETTLED_FRAMES = 30;
const PAGE_HEIGHT_PX = __H__;
const OVERFLOW_TOLERANCE_PX = 2;
// The renderer can keep body text on a page past its bottom margin, where Word
// starts the next page, and the print then cuts it off the sheet. Each page's
// lowest line of body text is measured against the page's bottom margin, and
// an overflowing page gets the failure printed onto it, for render-pages.py
// to report.
function markOverflow() {
  const overflows = [];
  document.querySelectorAll("[data-docx-page-surface]").forEach((surface, index) => {
    const top = surface.getBoundingClientRect().top;
    const limit = top + PAGE_HEIGHT_PX - parseFloat(getComputedStyle(surface).paddingBottom);
    const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let bottom = -Infinity;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const host = node.parentElement;
      if (!host?.closest("[data-docx-paragraph-node-index], [data-docx-table-index]")) continue;
      if (host.closest("[data-docx-header-footer-region], [data-docx-textbox-editor], [data-docx-pagination-ignore]")) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) bottom = Math.max(bottom, rect.bottom);
    }
    const over = bottom - limit;
    if (over <= OVERFLOW_TOLERANCE_PX) return;
    const inches = (over / 96).toFixed(2);
    const message = `__OVERFLOW__ page ${index + 1}: body text runs ${inches} in past the bottom margin, and Word moves it to the next page`;
    overflows.push(message);
    const banner = document.createElement("div");
    banner.textContent = message;
    banner.style.cssText = `position:absolute;left:0;right:0;top:${PAGE_HEIGHT_PX - 28}px;z-index:1000;padding:4px 8px;background:#c62828;color:#fff;font:bold 11px sans-serif;white-space:nowrap;overflow:hidden;`;
    surface.appendChild(banner);
  });
  if (overflows.length) document.body.dataset.overflow = overflows.join("\\n");
}
try {
  // Handing the renderer a Response parses on this page's own thread; its
  // worker would be a cross-origin script, which a file:// page cannot start.
  setWasmSource(await fetch("https://cdn.jsdelivr.net/npm/__RENDERER__/dist/docx_wasm_bg.wasm"));
  const bytes = Uint8Array.from(atob(document.getElementById("doc").textContent.trim()), (c) => c.charCodeAt(0));
  const file = new File([bytes], __NAME__);
  function Preview() {
    const editor = useDocxEditor({ initialFileName: file.name });
    React.useEffect(() => {
      editor.setDocumentTheme("light");
      editor.importDocxFile(file).catch(fail);
    }, []);
    React.useEffect(() => {
      if (editor.documentLoadNonce === 0 || editor.isImporting) return;
      let last = -1;
      let steady = 0;
      const tick = () => {
        const pages = document.querySelectorAll("[data-docx-page-wrapper]").length;
        steady = pages > 0 && pages === last ? steady + 1 : 0;
        last = pages;
        if (steady >= SETTLED_FRAMES) {
          document.fonts.ready.then(() => {
            markOverflow();
            document.body.dataset.ready = String(pages);
          });
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }, [editor.documentLoadNonce, editor.isImporting]);
    if (editor.importError) fail(editor.importError);
    return React.createElement(DocxEditorViewer, {
      editor,
      mode: "read-only",
      pageGapBackgroundColor: "#ffffff",
      pageVirtualization: { enabled: false },
    });
  }
  createRoot(document.getElementById("root")).render(React.createElement(Preview));
} catch (error) {
  fail(error);
}
</script>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(
        description="Write an HTML page that lays out a .docx page by page for the browser to print and look at"
    )
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("--output", help="HTML file to write (default: <input>.preview.html beside the document)")
    args = parser.parse_args()

    try:
        from docx import Document
    except ImportError:
        sys.exit("python-docx is unavailable. Reload this skill to retry dependency setup.")

    source = Path(args.input)
    if not source.is_file():
        sys.exit(f"No such file: {source}")
    section = Document(str(source)).sections[0]
    width = round(section.page_width / EMU_PER_PIXEL)
    height = round(section.page_height / EMU_PER_PIXEL)
    output = Path(args.output) if args.output else source.with_name(f"{source.stem}.preview.html")

    page = (
        PAGE.replace("__TITLE__", html.escape(f"{source.name} preview"))
        .replace("__EARLY__", EARLY_PRINT)
        .replace("__OVERFLOW__", OVERFLOW)
        .replace("__RENDERER__", RENDERER)
        .replace("__REACT__", REACT)
        .replace("__W__", str(width))
        .replace("__H__", str(height))
        .replace("__NAME__", json.dumps(source.name))
        .replace("__DOC__", base64.b64encode(without_stored_page_count(source.read_bytes())).decode("ascii"))
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")
    print(json.dumps({"preview": str(output), "pageSize": [width, height]}))


if __name__ == "__main__":
    main()
