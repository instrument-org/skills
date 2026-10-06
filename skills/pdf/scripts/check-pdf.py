#!/usr/bin/env python3
"""Check a finished PDF for defects that are easy to miss in a render: lines printed over each other, text off the page, type too small to read, the wrong page count, a stranded last page, and a one-page document that stops partway down.

Prints a summary line, then one `FAIL rule: where: measurement -> fix` line per problem, or `pass`. Exits 1 when anything failed.
"""

import argparse
import sys

# A line's glyphs rise about this share of its font size above the baseline,
# and fall about this share below it.
ASCENT = 0.70
DESCENT = 0.18
# Lines that share less horizontal run than this, in points, are side by side
# (a label column and its content), not stacked.
MIN_SHARED_RUN = 6
SMALLEST_TYPE = 6.0
# Running headers and footers sit in this band at the top and bottom of a
# page and do not count toward where the content starts or ends.
RUNNING_BAND = 54
# A one-page document whose content ends above this share of the page height
# stops partway down; a last page whose content ends above STRANDED holds a
# few stranded lines.
ONE_PAGE_FILL = 0.70
STRANDED = 0.20


def page_lines(page):
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = [s for s in line["spans"] if s["text"].strip()]
            # Rotated text (a chart's axis title) has no baseline to compare.
            if not spans or abs(line["dir"][1]) > 0.01:
                continue
            lines.append(
                {
                    "x0": min(s["bbox"][0] for s in spans),
                    "x1": max(s["bbox"][2] for s in spans),
                    "y0": min(s["bbox"][1] for s in spans),
                    "y1": max(s["bbox"][3] for s in spans),
                    "baseline": spans[0]["origin"][1],
                    "size": max(s["size"] for s in spans),
                    "text": "".join(s["text"] for s in spans).strip(),
                }
            )
    return lines


def overlaps(lines):
    pairs = []
    for i, a in enumerate(lines):
        for b in lines[i + 1 :]:
            if min(a["x1"], b["x1"]) - max(a["x0"], b["x0"]) < MIN_SHARED_RUN:
                continue
            upper, lower = (a, b) if a["baseline"] <= b["baseline"] else (b, a)
            gap = lower["baseline"] - upper["baseline"]
            if gap < ASCENT * lower["size"] + DESCENT * upper["size"]:
                pairs.append((upper, lower))
    return pairs


def quote(text):
    return repr(text[:32])


def check(path, expected_pages=None):
    import pymupdf

    doc = pymupdf.open(path)
    fails = []
    first = doc[0].rect
    producer = (doc.metadata or {}).get("producer") or "unknown"
    summary = (
        f"{path}: {len(doc)} page{'s' if len(doc) != 1 else ''}, "
        f"{first.width / 72:.2f} x {first.height / 72:.2f} in, made by {producer}"
    )

    if expected_pages is not None and len(doc) != expected_pages:
        fails.append(
            f"FAIL page-count: document: {len(doc)} pages, asked for {expected_pages} "
            "-> cut or tighten copy and spacing first, type size last"
        )

    smallest = None
    last_bottom = 0.0
    for number, page in enumerate(doc, 1):
        width, height = page.rect.width, page.rect.height
        lines = page_lines(page)
        where = f"page {number}"
        if not lines and not page.get_images() and not page.get_drawings():
            fails.append(f"FAIL blank-page: {where}: nothing on it -> remove the break or the empty trailing content that made it")
            continue

        pairs = overlaps(lines)
        if pairs:
            upper, lower = pairs[0]
            fails.append(
                f"FAIL overlap: {where}: {len(pairs)} pair{'s' if len(pairs) > 1 else ''} of lines print over each other, "
                f"e.g. {quote(upper['text'])} / {quote(lower['text'])} -> let the layout flow: no fixed heights or hand-set "
                "y positions; in ReportLab use Platypus flowables, not canvas drawString arithmetic"
            )

        off = [l for l in lines if l["x0"] < -1 or l["y0"] < -1 or l["x1"] > width + 1 or l["y1"] > height + 1]
        if off:
            fails.append(f"FAIL off-page: {where}: {len(off)} line{'s' if len(off) > 1 else ''} run off the page, e.g. {quote(off[0]['text'])} -> narrow or wrap it inside the margins")

        for line in lines:
            if smallest is None or line["size"] < smallest[0]:
                smallest = (line["size"], number, line["text"])

        body = [l for l in lines if RUNNING_BAND < l["y0"] and l["y1"] < height - RUNNING_BAND]
        last_bottom = max((l["y1"] for l in body), default=0.0) / height

    if smallest and smallest[0] < SMALLEST_TYPE:
        fails.append(f"FAIL tiny-type: page {smallest[1]}: {smallest[0]:.1f}pt, e.g. {quote(smallest[2])} -> nothing a reader needs below {SMALLEST_TYPE:.0f}pt")

    if len(doc) > 1 and 0 < last_bottom < STRANDED:
        fails.append(
            f"FAIL stranded: page {len(doc)}: content ends {last_bottom:.0%} of the way down -> pull it back onto the page before "
            "or give the last page enough to stand on its own"
        )

    if expected_pages == 1 and len(doc) == 1 and 0 < last_bottom < ONE_PAGE_FILL:
        fails.append(
            f"FAIL empty-band: page 1: content ends {last_bottom:.0%} of the way down -> a one-page document fills its page: "
            "larger type, more space between sections, or a layout that uses the width"
        )

    return summary, fails


def main():
    parser = argparse.ArgumentParser(
        description="Check a finished PDF for overlapping lines, text off the page, tiny type, the wrong page count, a stranded last page, and a one-pager that stops partway down"
    )
    parser.add_argument("input", help="PDF file to check")
    parser.add_argument("--pages", type=int, help="Page count the request asked for, e.g. 1 for a one-pager; also checks that a one-page document fills its page")
    args = parser.parse_args()

    try:
        import pymupdf  # noqa: F401
    except ImportError:
        sys.exit("PyMuPDF is missing; the PDF skill dependencies were not installed")

    summary, fails = check(args.input, args.pages)
    print(summary)
    for line in fails:
        print(line)
    if not fails:
        print("pass")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
