#!/usr/bin/env python3
"""Validate a Word document's XML before delivering it, and with --author check that every edit against the original is tracked.

Adapted from anthropics/skills (Apache-2.0), docx/scripts/office/validators/base.py, docx.py and redlining.py; changed: reads the .docx in place instead of an unpacked folder, uses the skill's python-docx/lxml instead of defusedxml, keeps the schema, tracked-change markup, comment marker and relationship checks plus the untracked-edit check, drops auto-repair, the pptx validator and page-field matching.

Checks every Word part against the ECMA-376 WordprocessingML schema (after
dropping Microsoft extension markup that the schema does not cover, as Word
itself does), [Content_Types].xml and the .rels parts against the OPC schemas,
<w:t> inside <w:del> and <w:delText> outside it, revisions without an id or
author, comment markers that name no comment, and relationship ids a part uses
but does not define. With --original, errors the original already had are not
reported. With --author (needs --original), text that differs from the
original without a <w:ins>/<w:del> recording it fails the check.

Examples:
  python scripts/validate.py report.docx
  python scripts/validate.py redlined.docx --original contract.docx --author "Claude"
  python scripts/validate.py report.docx --json
"""

import argparse
import difflib
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath

from lxml import etree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from redline import REVISION_TAGS, paragraph_texts, resolve  # noqa: E402

SCHEMAS = Path(__file__).resolve().parent.parent / "schemas"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
XML_NS = "http://www.w3.org/XML/1998/namespace"
OOXML = {
    W, R, MC, XML_NS,
    "http://schemas.openxmlformats.org/officeDocument/2006/math",
    "http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes",
    "http://schemas.openxmlformats.org/schemaLibrary/2006/main",
    "http://schemas.openxmlformats.org/drawingml/2006/main",
    "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "http://schemas.openxmlformats.org/drawingml/2006/chartDrawing",
    "http://schemas.openxmlformats.org/drawingml/2006/diagram",
    "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}
# Word parts whose root is a WordprocessingML element the schema defines.
WORD_PART = re.compile(
    r"word/(document|styles|numbering|settings|fontTable|webSettings|comments|footnotes|endnotes|header\d*|footer\d*|glossary/document)\.xml"
)
TRACKED_PARTS = re.compile(r"word/(document|header\d*|footer\d*|footnotes|endnotes)\.xml")
# Known schema/Word disagreements that Word opens: the first two are Word's
# own output, the zoom one is python-docx's default template.
IGNORED = ("hyphenationZone", "purl.org/dc/terms", "}zoom': The attribute '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}percent' is required")

_schemas = {}


def schema(name):
    if name not in _schemas:
        _schemas[name] = etree.XMLSchema(etree.parse(str(SCHEMAS / name)))
    return _schemas[name]


def schema_for(part):
    if WORD_PART.fullmatch(part):
        return "wml.xsd"
    if part == "[Content_Types].xml":
        return "opc-contentTypes.xsd"
    if part.endswith(".rels"):
        return "opc-relationships.xsd"
    return None


def parse(data):
    return etree.fromstring(data, etree.XMLParser(resolve_entities=False, no_network=True, huge_tree=True))


def strip_extensions(root):
    """Drop markup outside the ECMA namespaces (w14, w15, mc:AlternateContent, ...)."""
    root = etree.fromstring(etree.tostring(root))
    root.attrib.pop(f"{{{MC}}}Ignorable", None)
    for el in list(root.iter()):
        if not isinstance(el.tag, str):
            continue
        for attr in [a for a in el.attrib if a.startswith("{") and a[1:].split("}")[0] not in OOXML]:
            del el.attrib[attr]
    for el in list(root.iter()):
        if isinstance(el.tag, str) and el is not root:
            ns = el.tag[1:].split("}")[0] if el.tag.startswith("{") else ""
            if ns not in OOXML or el.tag == f"{{{MC}}}AlternateContent":
                if el.getparent() is not None:
                    el.getparent().remove(el)
    return root


def schema_errors(part, root):
    name = schema_for(part)
    if name is None:
        return set()
    doc = strip_extensions(root) if name == "wml.xsd" else root
    s = schema(name)
    if s.validate(doc):
        return set()
    return {e.message for e in s.error_log if not any(i in e.message for i in IGNORED)}


def markup_errors(part, root):
    """(line, message) for tracked-change and text markup Word misreads."""
    out = []
    w = lambda t: f"{{{W}}}{t}"  # noqa: E731
    for t in root.iter(w("t")):
        if any(a.tag in (w("del"), w("moveFrom")) for a in t.iterancestors()):
            out.append((t.sourceline, f"<w:t> inside <w:del>; deleted text must be <w:delText>: {t.text!r}"))
    for t in root.iter(w("delText")):
        if not any(a.tag in (w("del"), w("moveFrom")) for a in t.iterancestors()):
            out.append((t.sourceline, f"<w:delText> outside <w:del>; Word drops it: {t.text!r}"))
    for el in root.iter():
        if el.tag in REVISION_TAGS and (el.get(w("id")) is None or el.get(w("author")) is None):
            out.append((el.sourceline, f"<w:{etree.QName(el).localname}> without w:id and w:author"))
    for t in root.iter(w("t")):
        text = t.text or ""
        if text != text.strip() and t.get(f"{{{XML_NS}}}space") != "preserve":
            out.append((t.sourceline, f"<w:t> with leading or trailing spaces lacks xml:space=\"preserve\", so Word drops the spaces: {text!r}"))
    return out


def rels_of(part):
    p = PurePosixPath(part)
    return str(p.parent / "_rels" / f"{p.name}.rels")


def package_errors(files, roots):
    out = []
    w = lambda t: f"{{{W}}}{t}"  # noqa: E731
    comment_ids = set()
    if "word/comments.xml" in roots:
        comment_ids = {c.get(w("id")) for c in roots["word/comments.xml"].iter(w("comment"))}
    for part, root in roots.items():
        if not WORD_PART.fullmatch(part) or part == "word/comments.xml":
            continue
        for tag in ("commentRangeStart", "commentRangeEnd", "commentReference"):
            for el in root.iter(w(tag)):
                if el.get(w("id")) not in comment_ids:
                    out.append(f"{part}:{el.sourceline}: <w:{tag}> names comment {el.get(w('id'))}, which word/comments.xml lacks")
        used = {(v, el.sourceline) for el in root.iter() if isinstance(el.tag, str) for k, v in el.attrib.items() if k.startswith(f"{{{R}}}")}
        rels = roots.get(rels_of(part))
        defined = {r.get("Id") for r in rels} if rels is not None else set()
        for rid, line in sorted(used, key=lambda x: x[1] or 0):
            if rid not in defined:
                out.append(f"{part}:{line}: relationship {rid} is not defined in {rels_of(part)}")
    folders = [n for n in files if n.endswith("/")]
    if folders:
        out.append(f"the ZIP has {len(folders)} folder entries, which Word has refused when opening through a cloud co-editing service; rebuild it with python-docx or zip without them")
    return out


def read_package(path):
    with zipfile.ZipFile(path) as z:
        files = z.namelist()
        roots, bad = {}, []
        for name in files:
            if name.endswith(".xml") or name.endswith(".rels"):
                try:
                    roots[name] = parse(z.read(name))
                except etree.XMLSyntaxError as e:
                    bad.append(f"{name}: not well-formed XML: {e}")
    return files, roots, bad


def new_revisions(original, modified):
    """Revisions in `modified` that `original` lacks, matched by kind, author, date and text."""
    def key(el):
        text = "".join(t.text or "" for t in el.iter(f"{{{W}}}t", f"{{{W}}}delText"))
        return (el.tag, el.get(f"{{{W}}}author"), el.get(f"{{{W}}}date"), text)

    pool = {}
    for el in original.iter():
        if el.tag in REVISION_TAGS:
            pool.setdefault(key(el), []).append(el)
    new = set()
    for el in modified.iter():
        if el.tag in REVISION_TAGS:
            bucket = pool.get(key(el))
            if bucket:
                bucket.pop()
            else:
                new.add(el)
    return new


def untracked_edits(original_roots, roots):
    """Reject this edit's revisions; whatever text still differs from the original was edited untracked."""
    out = []
    for part in sorted(set(original_roots) | set(roots)):
        if not TRACKED_PARTS.fullmatch(part):
            continue
        before = original_roots.get(part)
        after = roots.get(part)
        if before is None or after is None:
            out.append(f"{part}: present in only one of the two documents")
            continue
        after = etree.fromstring(etree.tostring(after))
        resolve(after, "reject", only=new_revisions(before, after))
        a = [t for t in paragraph_texts(before) if t]
        b = [t for t in paragraph_texts(after) if t]
        if a == b:
            continue
        lines = [f"{part}: text differs from the original once this edit's tracked changes are rejected:"]
        for line in difflib.unified_diff(a, b, "original", "edited, revisions rejected", n=0, lineterm=""):
            if not line.startswith(("---", "+++", "@@")):
                lines.append(f"  {line}")
        out.append("\n".join(lines[:21]))
    return out


def validate(path, original=None, author=None):
    files, roots, bad = read_package(path)
    problems = list(bad)
    original_roots = read_package(original)[1] if original else {}
    for part, root in roots.items():
        errors = schema_errors(part, root)
        if part in original_roots:
            errors -= schema_errors(part, original_roots[part])
        problems += [f"{part}: schema: {e}" for e in sorted(errors)]
        existing = {m for _, m in markup_errors(part, original_roots[part])} if part in original_roots else set()
        problems += [f"{part}:{line}: {m}" for line, m in markup_errors(part, root) if m not in existing]
    problems += package_errors(files, roots)
    if author is not None:
        problems += untracked_edits(original_roots, roots)
    return problems


def main():
    parser = argparse.ArgumentParser(description="Validate a Word document's XML")
    parser.add_argument("input", help=".docx file to check")
    parser.add_argument("--original", help="The document it was edited from; its own errors are not reported")
    parser.add_argument("--author", help="The name you redlined under; turns on the check that every edit against --original is tracked")
    parser.add_argument("--json", action="store_true", help="Print problems as JSON")
    args = parser.parse_args()
    if args.author is not None and not args.original:
        parser.error("--author requires --original")
    problems = validate(args.input, args.original, args.author)
    if args.json:
        print(json.dumps({"valid": not problems, "problems": problems}, indent=2))
    elif problems:
        print("\n".join(f"FAIL {p}" for p in problems))
    else:
        print(f"OK {args.input}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
