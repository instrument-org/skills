#!/usr/bin/env python3
"""Make tracked changes (redlines) in an existing Word document: replace, delete, or insert text as revisions Word shows and can accept or reject.

Import it to redline with python-docx directly:

  import sys; sys.path.insert(0, "<docx-skill-path>/scripts")
  from redline import Redline, view_text
  rl = Redline(doc, author="Claude")
  rl.replace(paragraph, "thirty (30) days", "forty-five (45) days")
  rl.delete_paragraph(paragraph)
  rl.insert_paragraph_after(paragraph, "New clause text.")
  runs = rl.isolate(paragraph, "Net 30")   # whole runs for doc.add_comment(runs, ...)
  view_text(doc, "accept"), view_text(doc, "reject")

Or apply a list of edits from JSON:

  python scripts/redline.py contract.docx --author "Claude" --edits edits.json --output redlined.docx
  python scripts/redline.py redlined.docx --show accept

edits.json is a list of objects, applied in order to every paragraph in the
body, tables, headers and footers:
  {"find": "30 days", "replace": "45 days"}     replace ("" deletes)
  {"delete_paragraph": "text in the paragraph"} delete each paragraph containing it
  {"insert_after": "text in the paragraph", "text": "New paragraph."}
An edit that matches nothing fails the run and nothing is saved.

Only text in runs directly under a paragraph is matched: text inside a
hyperlink, a content control, or another author's tracked change is not.
"""

import argparse
import json
import re
import sys
from copy import deepcopy
from datetime import datetime, timezone

try:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.text.paragraph import Paragraph
    from docx.text.run import Run
except ImportError:  # pragma: no cover
    sys.exit("python-docx is unavailable. Reload this skill to retry dependency setup.")

REVISION_TAGS = {qn(f"w:{t}") for t in ("ins", "del", "moveFrom", "moveTo")}
# Run content that Run.text round-trips; a run holding anything else is not split.
SPLITTABLE = {qn(f"w:{t}") for t in ("rPr", "t", "tab", "br", "cr", "noBreakHyphen", "lastRenderedPageBreak")}
TOKEN = re.compile(r"\S+|\s+")


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _runs(p):
    return p.xpath("./w:r")


def _text(r) -> str:
    return Run(r, None).text


def _trim(old: str, new: str):
    """Shared leading and trailing whole words, so only the changed words are marked."""
    a, b = TOKEN.findall(old), TOKEN.findall(new)
    head = 0
    while head < min(len(a), len(b)) and a[head] == b[head]:
        head += 1
    tail = 0
    while tail < min(len(a), len(b)) - head and a[-1 - tail] == b[-1 - tail]:
        tail += 1
    pre = len("".join(a[:head]))
    suf = len("".join(a[len(a) - tail:]))
    return pre, old[pre:len(old) - suf], new[pre:len(new) - suf]


def _paragraph_mark_rpr(p):
    """The paragraph mark's w:rPr inside w:pPr, created in schema order."""
    ppr = p.get_or_add_pPr()
    rpr = ppr.find(qn("w:rPr"))
    if rpr is None:
        rpr = OxmlElement("w:rPr")
        later = [c for c in ppr if c.tag in (qn("w:sectPr"), qn("w:pPrChange"))]
        if later:
            later[0].addprevious(rpr)
        else:
            ppr.append(rpr)
    return rpr


class Redline:
    """Tracked edits on one python-docx Document, all under one author and timestamp."""

    def __init__(self, doc, author: str, date: str | None = None):
        self.doc = doc
        self.author = author
        self.date = date or _now()
        ids = [0]
        for part in doc.part.package.iter_parts():
            element = getattr(part, "_element", None)
            if element is None:
                continue
            for el in element.iter():
                value = el.get(qn("w:id")) if isinstance(el.tag, str) else None
                if value and value.lstrip("-").isdigit():
                    ids.append(int(value))
        self._next = max(ids) + 1

    def _mark(self, tag: str):
        el = OxmlElement(tag)
        el.set(qn("w:id"), str(self._next))
        el.set(qn("w:author"), self.author)
        el.set(qn("w:date"), self.date)
        self._next += 1
        return el

    def _boundary(self, p, pos: int) -> int:
        """Split the run straddling character pos; return the index of the first run at or after it."""
        off = 0
        runs = _runs(p)
        for i, r in enumerate(runs):
            if pos == off:
                return i
            n = len(_text(r))
            if off < pos < off + n:
                extra = {c.tag for c in r} - SPLITTABLE
                if extra:
                    raise ValueError(f"cannot split a run holding {sorted(extra)}; edit its XML directly")
                text = _text(r)
                right = deepcopy(r)
                Run(r, None).text = text[: pos - off]
                Run(right, None).text = text[pos - off:]
                r.addnext(right)
                return i + 1
            off += n
        return len(runs)

    def _span(self, p, start: int, end: int):
        first = self._boundary(p, start)
        last = self._boundary(p, end)
        return _runs(p)[first:last], first

    def isolate(self, paragraph, find: str, occurrence: int = 0) -> list:
        """Split runs so `find` is covered by whole runs, and return them as Run objects (for doc.add_comment)."""
        p = paragraph._p
        text = "".join(_text(r) for r in _runs(p))
        start = -1
        for _ in range(occurrence + 1):
            start = text.find(find, start + 1)
            if start == -1:
                raise ValueError(f"{find!r} not found in paragraph")
        runs, _ = self._span(p, start, start + len(find))
        return [Run(r, paragraph) for r in runs]

    def replace(self, paragraph, find: str, replacement: str) -> int:
        """Replace every occurrence of `find` as a tracked deletion plus insertion; return the count."""
        if not find or find == replacement:
            raise ValueError("find must be non-empty and differ from the replacement")
        if "\n" in replacement:
            raise ValueError("a replacement cannot hold a paragraph break; use insert_paragraph_after")
        p = paragraph._p
        count, search = 0, 0
        while True:
            text = "".join(_text(r) for r in _runs(p))
            i = text.find(find, search)
            if i == -1:
                return count
            pre, old, new = _trim(find, replacement)
            start = i + pre
            runs, first = self._span(p, start, start + len(old))
            all_runs = _runs(p)
            if runs:
                style_from = runs[0]
            elif first > 0:
                style_from = all_runs[first - 1]
            else:
                style_from = all_runs[first] if first < len(all_runs) else None
            anchor = None
            if runs:
                deletion = self._mark("w:del")
                runs[0].addprevious(deletion)
                for r in runs:
                    deletion.append(r)
                    for t in r.iter(qn("w:t")):
                        t.tag = qn("w:delText")
                    for t in r.iter(qn("w:instrText")):
                        t.tag = qn("w:delInstrText")
                anchor = deletion
            if new:
                insertion = self._mark("w:ins")
                run = OxmlElement("w:r")
                if style_from is not None and style_from.rPr is not None:
                    run.append(deepcopy(style_from.rPr))
                insertion.append(run)
                Run(run, None).text = new
                if anchor is not None:
                    anchor.addnext(insertion)
                elif first < len(all_runs):
                    all_runs[first].addprevious(insertion)
                elif all_runs:
                    all_runs[-1].addnext(insertion)
                else:
                    p.append(insertion)
            count += 1
            search = i + len(find) - len(old)

    def delete_paragraph(self, paragraph) -> None:
        """Delete a whole paragraph: every run plus its paragraph mark, which joins it to the next."""
        p = paragraph._p
        if p.xpath("./w:hyperlink|./w:sdt|./w:ins|./w:smartTag|./w:fldSimple"):
            raise ValueError("paragraph holds a hyperlink, content control, field or tracked insertion; edit its XML directly")
        runs = _runs(p)
        if runs:
            deletion = self._mark("w:del")
            runs[0].addprevious(deletion)
            for r in runs:
                deletion.append(r)
                for t in r.iter(qn("w:t")):
                    t.tag = qn("w:delText")
                for t in r.iter(qn("w:instrText")):
                    t.tag = qn("w:delInstrText")
        # A deleted mark joins its paragraph to the next one. The last paragraph
        # of a body or cell has no next one, so the mark before it goes instead.
        following, previous = p.getnext(), p.getprevious()
        if following is not None and following.tag == qn("w:p"):
            _paragraph_mark_rpr(p).insert(0, self._mark("w:del"))
        elif previous is not None and previous.tag == qn("w:p"):
            _paragraph_mark_rpr(previous).insert(0, self._mark("w:del"))

    def insert_paragraph_after(self, paragraph, text: str, style: str | None = None):
        """Insert a new tracked paragraph after `paragraph`, matching its formatting unless `style` is given."""
        p = paragraph._p
        new = OxmlElement("w:p")
        ppr = p.pPr
        if ppr is not None:
            copy = deepcopy(ppr)
            for child in copy.findall(qn("w:rPr")) + copy.findall(qn("w:sectPr")) + copy.findall(qn("w:pPrChange")):
                copy.remove(child)
            new.append(copy)
        p.addnext(new)
        para = Paragraph(new, paragraph._parent)
        if style is not None:
            para.style = style
        insertion = self._mark("w:ins")
        run = OxmlElement("w:r")
        source = _runs(p)[-1:] or p.xpath("./w:del/w:r")[-1:]
        if source and source[0].rPr is not None:
            run.append(deepcopy(source[0].rPr))
        insertion.append(run)
        new.append(insertion)
        Run(run, None).text = text
        # Rejecting an inserted mark joins its paragraph to the next one, so the
        # new paragraph's own mark is the inserted one unless nothing follows it;
        # then it is the mark before, as when Enter is pressed at the end of `paragraph`.
        following = new.getnext()
        holder = new if following is not None and following.tag == qn("w:p") else p
        _paragraph_mark_rpr(holder).insert(0, self._mark("w:ins"))
        return para


def _merge_into_next(p) -> bool:
    following = p.getnext()
    if following is None or following.tag != qn("w:p"):
        return False
    at = 1 if len(following) and following[0].tag == qn("w:pPr") else 0
    for child in reversed([c for c in p if c.tag != qn("w:pPr")]):
        following.insert(at, child)
    p.getparent().remove(p)
    return True


def resolve(root, mode: str, only=None):
    """Accept or reject tracked changes in an lxml tree in place; `only` limits it to those elements."""
    keep, drop = ("w:ins", "w:moveTo"), ("w:del", "w:moveFrom")
    if mode == "reject":
        keep, drop = drop, keep
    elif mode != "accept":
        raise ValueError("mode is accept or reject")
    keep, drop = {qn(t) for t in keep}, {qn(t) for t in drop}
    chosen = [el for el in root.iter() if el.tag in REVISION_TAGS and (only is None or el in only)]
    marks = [el for el in chosen if el.getparent() is not None and el.getparent().tag == qn("w:rPr")
             and el.getparent().getparent() is not None and el.getparent().getparent().tag == qn("w:pPr")]
    for el in marks:
        p = el.getparent().getparent().getparent()
        el.getparent().remove(el)
        if el.tag in drop and p is not None:
            _merge_into_next(p)
    for el in chosen:
        if el in marks or el.getparent() is None:
            continue
        parent = el.getparent()
        if el.tag in drop:
            parent.remove(el)
            continue
        for t in el.iter(qn("w:delText")):
            t.tag = qn("w:t")
        for t in el.iter(qn("w:delInstrText")):
            t.tag = qn("w:instrText")
        index = parent.index(el)
        for child in reversed(list(el)):
            parent.insert(index, child)
        parent.remove(el)
    return root


def paragraph_texts(root) -> list[str]:
    """Visible text of each paragraph: w:t only, so deleted text (w:delText) never counts."""
    out = []
    for p in root.iter(qn("w:p")):
        out.append("".join(t.text or "" for t in p.iter(qn("w:t")) if next(t.iterancestors(qn("w:p"))) is p))
    return out


def view_text(doc, mode: str) -> str:
    """The body's text with every tracked change accepted or rejected, one line per paragraph."""
    root = deepcopy(doc.element.body)
    return "\n".join(paragraph_texts(resolve(root, mode)))


def iter_paragraphs(doc):
    """Every paragraph in the body (tables included), then each distinct header and footer."""
    for p in doc.element.body.iter(qn("w:p")):
        yield Paragraph(p, doc._body)
    seen = set()
    for section in doc.sections:
        for hf in (section.header, section.footer, section.first_page_header, section.first_page_footer,
                   section.even_page_header, section.even_page_footer):
            if hf.is_linked_to_previous or id(hf.part) in seen:
                continue
            seen.add(id(hf.part))
            for p in hf._element.iter(qn("w:p")):
                yield Paragraph(p, hf)


def apply_edits(doc, edits, author: str) -> list[str]:
    """Apply edit objects in order; return a problem line for each edit that matched nothing."""
    rl = Redline(doc, author)
    problems = []
    for n, edit in enumerate(edits, 1):
        hits = 0
        if "find" in edit:
            for para in list(iter_paragraphs(doc)):
                hits += rl.replace(para, edit["find"], edit.get("replace", ""))
        elif "delete_paragraph" in edit:
            for para in list(iter_paragraphs(doc)):
                if edit["delete_paragraph"] in "".join(_text(r) for r in _runs(para._p)):
                    rl.delete_paragraph(para)
                    hits += 1
        elif "insert_after" in edit:
            for para in list(iter_paragraphs(doc)):
                if edit["insert_after"] in "".join(_text(r) for r in _runs(para._p)):
                    rl.insert_paragraph_after(para, edit["text"], edit.get("style"))
                    hits += 1
        else:
            problems.append(f"edit {n}: needs find, delete_paragraph or insert_after")
            continue
        if hits == 0:
            problems.append(f"edit {n}: no match for {json.dumps(edit, ensure_ascii=False)}")
        else:
            print(f"edit {n}: {hits} change(s)")
    return problems


def main():
    parser = argparse.ArgumentParser(description="Make tracked changes in a Word document")
    parser.add_argument("input", help="Input .docx file")
    parser.add_argument("--author", help="Name the revisions are recorded under")
    parser.add_argument("--edits", help="JSON file with a list of edits")
    parser.add_argument("--output", help="Output .docx path (required with --edits)")
    parser.add_argument("--show", choices=["accept", "reject"],
                        help="Print the body text with all tracked changes accepted or rejected, and exit")
    args = parser.parse_args()

    from docx import Document

    doc = Document(args.input)
    if args.show:
        print(view_text(doc, args.show))
        return
    if not (args.edits and args.author and args.output):
        parser.error("--edits, --author and --output are required unless --show is given")
    with open(args.edits, encoding="utf-8") as f:
        edits = json.load(f)
    try:
        problems = apply_edits(doc, edits, args.author)
    except ValueError as e:
        sys.exit(f"FAIL {e}")
    if problems:
        print("\n".join(f"FAIL {p}" for p in problems))
        sys.exit("Nothing was saved.")
    doc.save(args.output)
    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()
