#!/usr/bin/env python3
"""Check a saved .pptx for the package faults PowerPoint refuses or offers to repair.

Checks that every part is well-formed XML and has a content type, that every relationship resolves and every r:id names one, that slide, master and layout ids are unique and in range, that each slide has one layout and owns its notes, and that the slide XML matches the ECMA-376 PresentationML schema. Pass --original with the template a deck was built from: schema errors the template already had are not reported, so only what the edit introduced shows. python-pptx reopening a deck proves only that python-pptx can read it.

Adapted from anthropics/skills (Apache-2.0), pptx/scripts/office/validate.py and validators/base.py, validators/pptx.py; changed: reads the zipped package without unpacking, checks every part's content type rather than a fixed list, flags parts nothing references only under ppt/, baselines a duplicated slide against every template part in its folder, and drops the pptxgenjs chart and theme checks and the auto-repair.
"""

import argparse
import json
import posixpath
import sys
import zipfile
from pathlib import Path
from urllib.parse import unquote

SCHEMAS = Path(__file__).resolve().parent.parent / "schemas"
RELS_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
CONTENT_TYPES = "[Content_Types].xml"

# Namespaces the schema describes; everything else is an extension the schema check strips first.
OOXML_NAMESPACES = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "http://schemas.openxmlformats.org/drawingml/2006/main",
    "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "http://schemas.openxmlformats.org/drawingml/2006/chartDrawing",
    "http://schemas.openxmlformats.org/drawingml/2006/diagram",
    "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas",
    "http://schemas.openxmlformats.org/presentationml/2006/main",
    "http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes",
    "http://www.w3.org/XML/1998/namespace",
}
# Root elements whose part needs its own content type; the generic XML default makes PowerPoint repair the deck.
TYPED_ROOTS = {"presentation", "sld", "sldLayout", "sldMaster", "notes", "notesMaster", "handoutMaster", "theme", "chartSpace"}
ID_REFERENCES = {"sldId": "slide", "sldMasterId": "slideMaster", "sldLayoutId": "slideLayout",
                 "notesMasterId": "notesMaster", "handoutMasterId": "handoutMaster"}


def kind(rel) -> str:
    return rel.get("Type", "").rsplit("/", 1)[-1]


def rels_name(part: str) -> str:
    folder, name = posixpath.split(part)
    return posixpath.join(folder, "_rels", f"{name}.rels")


def source_of(rels: str) -> str:
    folder, name = posixpath.split(rels)
    return posixpath.join(posixpath.dirname(folder), name[: -len(".rels")])


def resolve(source: str, target: str) -> str:
    target = unquote(target)
    if target.startswith("/"):
        return posixpath.normpath(target[1:])
    return posixpath.normpath(posixpath.join(posixpath.dirname(source), target))


class Deck:
    def __init__(self, path: Path):
        from lxml import etree

        self.etree = etree
        self.parser = etree.XMLParser(resolve_entities=False, no_network=True)
        with zipfile.ZipFile(path) as archive:
            self.parts = {i.filename: archive.read(i) for i in archive.infolist() if not i.is_dir()}
        self.trees, self.broken = {}, {}
        for name, data in self.parts.items():
            if name.endswith((".xml", ".rels")):
                try:
                    self.trees[name] = etree.fromstring(data, self.parser)
                except etree.XMLSyntaxError as error:
                    self.broken[name] = str(error)

    def rels(self, part: str):
        tree = self.trees.get(rels_name(part) if part else "_rels/.rels")
        return list(tree) if tree is not None else []

    def internal(self, part: str):
        return [(rel, resolve(part, rel.get("Target", ""))) for rel in self.rels(part)
                if rel.get("TargetMode") != "External"]


def check_content_types(deck: Deck) -> list[str]:
    tree = deck.trees.get(CONTENT_TYPES)
    if tree is None:
        return [f"{CONTENT_TYPES} is missing or unreadable"]
    defaults = {d.get("Extension", "").lower(): d.get("ContentType") for d in tree.iter(f"{{{CT_NS}}}Default")}
    overrides = {o.get("PartName", "").lstrip("/").lower(): o.get("ContentType") for o in tree.iter(f"{{{CT_NS}}}Override")}
    lower = {name.lower() for name in deck.parts}
    problems = [f"Override for /{name}, which is not in the package" for name in overrides if name not in lower]
    for name in deck.parts:
        if name == CONTENT_TYPES:
            continue
        base = posixpath.basename(name)
        ext = base.rsplit(".", 1)[-1].lower() if "." in base else ""
        content_type = overrides.get(name.lower()) or defaults.get(ext)
        if content_type is None:
            problems.append(f"{name}: no content type; add <Default Extension=\"{ext}\" .../> or an <Override PartName=\"/{name}\" .../>")
            continue
        root = deck.trees.get(name)
        if root is not None and deck.etree.QName(root).localname in TYPED_ROOTS and name.lower() not in overrides:
            problems.append(f"{name}: <{deck.etree.QName(root).localname}> part needs an <Override PartName=\"/{name}\"> with its own content type")
    return problems


def check_relationships(deck: Deck) -> list[str]:
    problems = []
    for rels in sorted(n for n in deck.trees if n.endswith(".rels")):
        source = "" if rels == "_rels/.rels" else source_of(rels)
        if source and source not in deck.parts:
            problems.append(f"{rels}: relationships for {source}, which is not in the package")
            continue
        seen = set()
        for rel in deck.trees[rels]:
            rid = rel.get("Id")
            if rid in seen:
                problems.append(f"{rels}: relationship id {rid} is used twice")
            seen.add(rid)
            if rel.get("TargetMode") != "External" and resolve(source, rel.get("Target", "")) not in deck.parts:
                problems.append(f"{rels}: {rid} points at {rel.get('Target')}, which is not in the package")

    for name, root in deck.trees.items():
        if name.endswith(".rels") or name == CONTENT_TYPES:
            continue
        by_id = {rel.get("Id"): rel for rel in deck.rels(name)}
        for element in root.iter():
            if not isinstance(element.tag, str):
                continue
            for attr, value in element.attrib.items():
                if not attr.startswith(f"{{{R_NS}}}") or not value:
                    continue
                local = deck.etree.QName(element).localname
                rel = by_id.get(value)
                if rel is None:
                    problems.append(f"{name}: <{local}> names relationship {value}, which {rels_name(name)} does not have")
                elif attr == f"{{{R_NS}}}id" and local in ID_REFERENCES and kind(rel) != ID_REFERENCES[local]:
                    problems.append(f"{name}: <{local}> names {value}, a {kind(rel)} relationship rather than {ID_REFERENCES[local]}")

    reached, queue = set(), [""]
    while queue:
        part = queue.pop()
        for _, target in deck.internal(part):
            if target in deck.parts and target not in reached:
                reached.add(target)
                queue.append(target)
    problems += [f"{name}: nothing references this part; remove it or link it" for name in sorted(deck.parts)
                 if name.startswith("ppt/") and not name.endswith(".rels") and name not in reached]
    return problems


def check_presentation(deck: Deck) -> list[str]:
    office = [t for r, t in deck.internal("") if kind(r) == "officeDocument"]
    if not office or office[0] not in deck.trees:
        return ["The package has no readable presentation part"]
    pres = office[0]
    p = f"{{{P_NS}}}"
    root = deck.trees[pres]
    problems = []
    slide_ids = [int(e.get("id", "0")) for e in root.iter(f"{p}sldId")]
    problems += [f"{pres}: slide id {i} is used twice" for i in sorted({i for i in slide_ids if slide_ids.count(i) > 1})]
    problems += [f"{pres}: slide id {i} is outside 256..2147483647" for i in slide_ids if not 256 <= i <= 2147483647]

    masters = [t for r, t in deck.internal(pres) if kind(r) == "slideMaster"]
    big_ids = [(pres, e.get("id")) for e in root.iter(f"{p}sldMasterId")]
    for master in masters:
        if master in deck.trees:
            big_ids += [(master, e.get("id")) for e in deck.trees[master].iter(f"{p}sldLayoutId")]
    values = [v for _, v in big_ids]
    for part, value in big_ids:
        if values.count(value) > 1:
            problems.append(f"{part}: master/layout id {value} is used more than once across the masters")
        if value is not None and int(value) < 2147483648:
            problems.append(f"{part}: master/layout id {value} is below 2147483648")

    themes = {}
    for master in masters:
        for rel, target in deck.internal(master):
            if kind(rel) == "theme":
                themes.setdefault(target, []).append(master)
    problems += [f"{theme} is the theme of more than one master: {', '.join(owners)}" for theme, owners in themes.items() if len(owners) > 1]

    notes_owner = {}
    for rel, slide in deck.internal(pres):
        if kind(rel) != "slide":
            continue
        layouts = [t for r, t in deck.internal(slide) if kind(r) == "slideLayout"]
        if len(layouts) != 1:
            problems.append(f"{slide}: has {len(layouts)} slide layout relationships; it needs exactly one")
        for note_rel, notes in deck.internal(slide):
            if kind(note_rel) == "notesSlide":
                notes_owner.setdefault(notes, []).append(slide)
    problems += [f"{notes} is the notes of more than one slide: {', '.join(owners)}" for notes, owners in notes_owner.items() if len(owners) > 1]
    return problems


def schema_for(deck: Deck, name: str, schemas: dict):
    root = deck.trees.get(name)
    if root is None:
        return None
    if name == CONTENT_TYPES:
        return schemas["content_types"]
    if name.endswith(".rels"):
        return schemas["rels"]
    # Charts are skipped as upstream skips them: python-pptx writes negative axis ids, which the schema
    # rejects as unsignedInt and PowerPoint opens without complaint.
    if name.startswith("ppt/charts/"):
        return None
    if name.startswith("ppt/") and deck.etree.QName(root).namespace in OOXML_NAMESPACES:
        return schemas["pml"]
    return None


def stripped(etree, root):
    """A copy without markup-compatibility and extension namespaces, which the schema does not describe."""
    tree = etree.fromstring(etree.tostring(root))
    tree.attrib.pop(f"{{{MC_NS}}}Ignorable", None)

    def strip(element):
        for attr in [a for a in element.attrib if a.startswith("{") and a[1:].split("}")[0] not in OOXML_NAMESPACES]:
            del element.attrib[attr]
        for child in list(element):
            if not isinstance(child.tag, str):
                continue
            if child.tag.startswith("{") and child.tag[1:].split("}")[0] not in OOXML_NAMESPACES:
                element.remove(child)
            else:
                strip(child)

    strip(tree)
    return tree


def schema_errors(deck: Deck, schemas: dict) -> dict:
    found = {}
    for name in sorted(deck.trees):
        schema = schema_for(deck, name, schemas)
        if schema is None:
            continue
        if not schema.validate(stripped(deck.etree, deck.trees[name])):
            found[name] = {error.message for error in schema.error_log}
    return found


def load_schemas():
    from lxml import etree

    load = lambda name: etree.XMLSchema(etree.parse(str(SCHEMAS / name)))
    return {"pml": load("pml.xsd"), "content_types": load("opc-contentTypes.xsd"), "rels": load("opc-relationships.xsd")}


def validate(path: Path, original: Path | None = None) -> dict:
    deck = Deck(path)
    schemas = load_schemas()
    result = {
        "xml": [f"{name}: {message}" for name, message in sorted(deck.broken.items())],
        "content_types": check_content_types(deck),
        "relationships": check_relationships(deck),
        "presentation": check_presentation(deck),
    }
    current = schema_errors(deck, schemas)
    if original is not None:
        # A template's own schema errors are not the edit's; a duplicated slide carries its source's,
        # so an error any template part in the same folder had is not reported either.
        baseline = {}
        for name, errors in schema_errors(Deck(original), schemas).items():
            baseline.setdefault(posixpath.dirname(name), set()).update(errors)
        current = {n: e - baseline.get(posixpath.dirname(n), set()) for n, e in current.items()}
    result["schema"] = [f"{name}: {message}" for name, errors in sorted(current.items()) for message in sorted(errors)]
    result["status"] = "valid" if not any(result.values()) else "invalid"
    return result


LABELS = [("xml", "XML"), ("content_types", "Content types"), ("relationships", "Relationships"),
          ("presentation", "Presentation"), ("schema", "Schema")]


def main():
    parser = argparse.ArgumentParser(description="Check a .pptx for package faults PowerPoint repairs or refuses")
    parser.add_argument("input", help="The .pptx or .potx to check")
    parser.add_argument("--original", help="The template or source deck it was built from; its own schema errors are not reported")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    args = parser.parse_args()

    for path in filter(None, (args.input, args.original)):
        if not Path(path).is_file():
            sys.exit(f"Not a file: {path}")
    try:
        result = validate(Path(args.input), Path(args.original) if args.original else None)
    except ImportError:
        sys.exit("lxml is unavailable. Reload this skill to retry dependency setup.")
    except zipfile.BadZipFile:
        sys.exit(f"{args.input} is not a readable .pptx archive")

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"{args.input}: {result['status']}")
        for key, label in LABELS:
            for message in result[key][:40]:
                print(f"  {label}: {message}")
            if len(result[key]) > 40:
                print(f"  {label}: ... {len(result[key]) - 40} more")
    sys.exit(0 if result["status"] == "valid" else 1)


if __name__ == "__main__":
    main()
