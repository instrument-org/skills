#!/usr/bin/env python3
"""Duplicate, delete and reorder a deck's slides, which python-pptx cannot do.

Takes the final slide order as 1-based numbers in the deck's current order: a number listed twice is duplicated, a number left out is deleted. A duplicate gets its own copy of the slide's notes, charts, SmartArt, embedded objects and tags, and shares pictures and the layout. Afterwards, parts no slide reaches any more (deleted slides' notes, charts and media) are removed with their relationships and content types, links to deleted slides are dropped, and sections follow their slides. --prune-layouts also drops layouts no slide uses.

Adapted from anthropics/skills (Apache-2.0), pptx/scripts/add_slide.py and clean.py; changed: one pass over the zipped package from a final order, duplicates own their notes and charts rather than sharing or losing them, cleanup by reachability from the package root, sections, custom shows and slide links kept consistent, optional layout pruning, lxml in place of minidom and regexes.
"""

import argparse
import copy
import posixpath
import re
import sys
import uuid
import zipfile
from pathlib import Path
from urllib.parse import unquote

RELS_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
P14_NS = "http://schemas.microsoft.com/office/powerpoint/2010/main"
APP_NS = "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
CONTENT_TYPES = "[Content_Types].xml"

# Parts a duplicate gets its own copy of. Anything else (layout, pictures, media, notes master) is shared.
OWNED = {
    "notesSlide", "chart", "chartUserShapes", "chartStyle", "chartColorStyle", "themeOverride", "package",
    "oleObject", "tags", "diagramData", "diagramLayout", "diagramQuickStyle", "diagramColors", "diagramDrawing",
}
# Relationships a duplicate leaves behind: comments belong to the slide they were written on.
NOT_COPIED = {"comments", "comment", "commentAuthors"}

SLIDE_ID_MIN, SLIDE_ID_MAX = 256, 2147483647


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


def relative(source: str, part: str) -> str:
    return posixpath.relpath(part, posixpath.dirname(source) or ".")


class Package:
    def __init__(self, path: Path):
        from lxml import etree

        self.etree = etree
        self.parser = etree.XMLParser(resolve_entities=False, no_network=True, remove_blank_text=False)
        with zipfile.ZipFile(path) as archive:
            self.infos = {info.filename: info for info in archive.infolist() if not info.is_dir()}
            self.parts = {name: archive.read(name) for name in self.infos}
        self.trees = {}
        self.lower = {name.lower(): name for name in self.parts}

    def xml(self, name: str):
        if name not in self.trees:
            self.trees[name] = self.etree.fromstring(self.parts[name], self.parser)
        return self.trees[name]

    def rels(self, part: str):
        """The part's <Relationships> root, created empty when the part has none."""
        name = rels_name(part)
        if name not in self.parts and name not in self.trees:
            self.trees[name] = self.etree.Element(f"{{{RELS_NS}}}Relationships", nsmap={None: RELS_NS})
            self.parts[name] = b""
        return self.xml(name)

    def has_rels(self, part: str) -> bool:
        return rels_name(part) in self.parts

    def internal(self, part: str):
        """(relationship, target part) for each internal relationship of part."""
        if not self.has_rels(part):
            return []
        return [(rel, resolve(part, rel.get("Target", ""))) for rel in self.rels(part)
                if rel.get("TargetMode") != "External"]

    def free_name(self, part: str) -> str:
        folder, name = posixpath.split(part)
        stem, number, ext = re.match(r"(.*?)(\d*)(\.[^.]*)?$", name).groups()
        ext = ext or ""
        pattern = re.compile(re.escape(stem) + r"(\d*)" + re.escape(ext) + "$", re.I)
        taken = [int(m.group(1) or 0) for other in self.parts if posixpath.dirname(other) == folder
                 and (m := pattern.match(posixpath.basename(other)))]
        n = max(taken, default=0) + 1
        while (candidate := posixpath.join(folder, f"{stem}{n}{ext}")).lower() in self.lower:
            n += 1
        return candidate

    def add_part(self, name: str, data: bytes):
        self.parts[name] = data
        self.lower[name.lower()] = name

    def remove_part(self, name: str):
        self.parts.pop(name, None)
        self.trees.pop(name, None)
        self.lower.pop(name.lower(), None)

    def content_types(self):
        return self.xml(CONTENT_TYPES)

    def override(self, part: str):
        for entry in self.content_types().iter(f"{{{CT_NS}}}Override"):
            if entry.get("PartName", "").lstrip("/").lower() == part.lower():
                return entry
        return None

    def next_rid(self, part: str) -> str:
        used = {int(m.group(1)) for rel in self.rels(part) if (m := re.fullmatch(r"rId(\d+)", rel.get("Id", "")))}
        return f"rId{max(used, default=0) + 1}"

    def add_rel(self, part: str, rel_type: str, target_part: str) -> str:
        rid = self.next_rid(part)
        self.etree.SubElement(self.rels(part), f"{{{RELS_NS}}}Relationship",
                              Id=rid, Type=rel_type, Target=relative(part, target_part))
        return rid

    def clone(self, part: str, renamed: dict) -> str:
        """Copy part and the parts it owns; renamed maps old part names to their copies and is shared across the walk."""
        new = self.free_name(part)
        renamed[part] = new
        self.add_part(new, self.parts[part])
        override = self.override(part)
        if override is not None:
            entry = copy.deepcopy(override)
            entry.set("PartName", "/" + new)
            override.addnext(entry)
        if not self.has_rels(part):
            return new
        rels = copy.deepcopy(self.rels(part))
        for rel in list(rels):
            if kind(rel) in NOT_COPIED:
                rels.remove(rel)
                continue
            if rel.get("TargetMode") == "External":
                continue
            target = resolve(part, rel.get("Target", ""))
            if target in renamed:
                rel.set("Target", relative(new, renamed[target]))
            elif kind(rel) in OWNED and target in self.parts:
                rel.set("Target", relative(new, self.clone(target, renamed)))
        self.trees[rels_name(new)] = rels
        self.parts[rels_name(new)] = b""
        return new

    def reachable(self) -> set:
        seen, queue = set(), [""]
        while queue:
            part = queue.pop()
            for _, target in self.internal(part) if part else self.root_internal():
                if target in self.parts and target not in seen:
                    seen.add(target)
                    queue.append(target)
        return seen

    def root_internal(self):
        if "_rels/.rels" not in self.parts:
            return []
        return [(rel, resolve("", rel.get("Target", ""))) for rel in self.xml("_rels/.rels")
                if rel.get("TargetMode") != "External"]

    def write(self, path: Path):
        for name, tree in self.trees.items():
            if name in self.parts:
                self.parts[name] = self.etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)
        names = [CONTENT_TYPES] + [n for n in self.parts if n != CONTENT_TYPES]
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as out:
            for name in names:
                info = self.infos.get(name)
                entry = zipfile.ZipInfo(name, info.date_time if info else (1980, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                out.writestr(entry, self.parts[name])


def presentation_part(pkg: Package) -> str:
    for rel, target in pkg.root_internal():
        if kind(rel) == "officeDocument":
            return target
    sys.exit("This file has no presentation part; is it a .pptx?")


def parse_order(text: str, count: int) -> list[int]:
    try:
        order = [int(item) for item in re.split(r"[,\s]+", text.strip()) if item]
    except ValueError:
        sys.exit(f"--order takes slide numbers separated by commas, such as 1,3,3,2; got {text!r}")
    bad = [n for n in order if not 1 <= n <= count]
    if bad:
        sys.exit(f"The deck has {count} slide(s); --order names {', '.join(map(str, bad))}")
    if not order:
        sys.exit("--order must keep at least one slide")
    return order


def rearrange(pkg: Package, order: list[int]) -> dict:
    p = f"{{{P_NS}}}"
    pres = presentation_part(pkg)
    root = pkg.xml(pres)
    id_list = root.find(f"{p}sldIdLst")
    entries = list(id_list) if id_list is not None else []
    by_rid = {rel.get("Id"): (rel, target) for rel, target in pkg.internal(pres)}
    slides = [by_rid[entry.get(f"{{{R_NS}}}id")] for entry in entries]
    used_ids = {int(entry.get("id")) for entry in entries}

    placed, kept, duplicated = [], set(), 0
    for number in order:
        entry, (rel, part) = entries[number - 1], slides[number - 1]
        if number not in kept:
            kept.add(number)
            placed.append((entry, number))
            continue
        new_part = pkg.clone(part, {})
        rid = pkg.add_rel(pres, rel.get("Type"), new_part)
        new_id = next((i for i in range(max(used_ids | {SLIDE_ID_MIN - 1}) + 1, SLIDE_ID_MAX + 1)), None)
        if new_id is None:
            new_id = next(i for i in range(SLIDE_ID_MIN, SLIDE_ID_MAX + 1) if i not in used_ids)
        used_ids.add(new_id)
        clone = copy.deepcopy(entry)
        clone.set("id", str(new_id))
        clone.set(f"{{{R_NS}}}id", rid)
        placed.append((clone, number))
        duplicated += 1

    deleted = [number for number in range(1, len(entries) + 1) if number not in kept]
    deleted_parts = {slides[n - 1][1] for n in deleted}
    for n in deleted:
        pres_rels = pkg.rels(pres)
        pres_rels.remove(slides[n - 1][0])
    for child in list(id_list):
        id_list.remove(child)
    for entry, _ in placed:
        id_list.append(entry)

    update_sections(root, entries, placed)
    gone = {slides[n - 1][0].get("Id") for n in deleted}
    for show_slide in root.iter(f"{p}sld"):
        if show_slide.get(f"{{{R_NS}}}id") in gone:
            show_slide.getparent().remove(show_slide)
    drop_links_to(pkg, deleted_parts)
    return {"kept": len(kept), "duplicated": duplicated, "deleted": len(deleted)}


def update_sections(root, entries, placed):
    """Rebuild the section list so each slide sits in the section its source slide was in."""
    s = f"{{{P14_NS}}}"
    section_list = next(root.iter(f"{s}sectionLst"), None)
    if section_list is None:
        return
    original_ids = [entry.get("id") for entry in entries]
    section_of = {}
    for section in section_list.findall(f"{s}section"):
        for member in section.iter(f"{s}sldId"):
            section_of[member.get("id")] = section
    runs, previous = [], None
    for entry, number in placed:
        section = section_of.get(original_ids[number - 1], previous)
        if section is None:
            continue
        if not runs or runs[-1][0] is not section:
            runs.append((section, []))
        runs[-1][1].append(entry.get("id"))
        previous = section
    for section in list(section_list):
        section_list.remove(section)
    seen = set()
    for section, ids in runs:
        built = copy.deepcopy(section)
        if id(section) in seen:
            built.set("id", "{" + str(uuid.uuid4()).upper() + "}")
        seen.add(id(section))
        members = built.find(f"{s}sldIdLst")
        if members is None:
            members = section.makeelement(f"{s}sldIdLst", {})
            built.insert(0, members)
        for member in list(members):
            members.remove(member)
        for slide_id in ids:
            members.append(members.makeelement(f"{s}sldId", {"id": slide_id}))
        section_list.append(built)


def drop_links_to(pkg: Package, deleted_parts: set):
    """Remove relationships from other parts to deleted slides, and the hyperlink elements that used them."""
    for rels in [n for n in pkg.parts if n.endswith(".rels")]:
        source = source_of(rels)
        if source in deleted_parts or source not in pkg.parts:
            continue
        doomed = [rel for rel, target in pkg.internal(source) if target in deleted_parts]
        if not doomed:
            continue
        ids = {rel.get("Id") for rel in doomed}
        for rel in doomed:
            rel.getparent().remove(rel)
        if source.endswith(".xml"):
            for element in list(pkg.xml(source).iter()):
                if any(element.get(f"{{{R_NS}}}{attr}") in ids for attr in ("id", "embed", "link")):
                    element.getparent().remove(element)


def prune_layouts(pkg: Package) -> int:
    """Drop layouts no slide uses; a master keeps its first layout when none of its layouts are used."""
    p = f"{{{P_NS}}}"
    pres = presentation_part(pkg)
    used = set()
    for rel, slide in pkg.internal(pres):
        if kind(rel) == "slide":
            used |= {target for layout_rel, target in pkg.internal(slide) if kind(layout_rel) == "slideLayout"}
    removed = 0
    for rel, master in pkg.internal(pres):
        if kind(rel) != "slideMaster":
            continue
        layout_list = pkg.xml(master).find(f"{p}sldLayoutIdLst")
        layout_rels = {r.get("Id"): (r, t) for r, t in pkg.internal(master) if kind(r) == "slideLayout"}
        if layout_list is None:
            continue
        listed = list(layout_list)
        unused = [e for e in listed if layout_rels.get(e.get(f"{{{R_NS}}}id"), (None, None))[1] not in used]
        if len(unused) == len(listed):
            unused = unused[1:]
        for entry in unused:
            layout_rel, _ = layout_rels[entry.get(f"{{{R_NS}}}id")]
            layout_rel.getparent().remove(layout_rel)
            layout_list.remove(entry)
            removed += 1
    return removed


def remove_unreachable(pkg: Package) -> list[str]:
    """Delete parts under ppt/ that nothing reaches from the package root, with their rels and content types."""
    reachable = pkg.reachable()
    doomed = sorted(n for n in pkg.parts if n.startswith("ppt/") and not n.endswith(".rels") and n not in reachable)
    for name in doomed:
        pkg.remove_part(name)
        pkg.remove_part(rels_name(name))
        override = pkg.override(name)
        if override is not None:
            override.getparent().remove(override)
    for name in [n for n in pkg.parts if n.endswith(".rels") and n != "_rels/.rels"]:
        if source_of(name) not in pkg.parts:
            pkg.remove_part(name)
    return doomed


def update_counts(pkg: Package):
    name = "docProps/app.xml"
    if name not in pkg.parts:
        return
    try:
        root = pkg.xml(name)
    except pkg.etree.XMLSyntaxError:
        return
    pres = presentation_part(pkg)
    slides = [t for r, t in pkg.internal(pres) if kind(r) == "slide"]
    notes = sum(1 for s in slides for r, _ in pkg.internal(s) if kind(r) == "notesSlide")
    for tag, value in (("Slides", len(slides)), ("Notes", notes)):
        element = root.find(f"{{{APP_NS}}}{tag}")
        if element is not None:
            element.text = str(value)


def main():
    parser = argparse.ArgumentParser(description="Duplicate, delete and reorder a deck's slides")
    parser.add_argument("input", help="Input .pptx or .potx")
    parser.add_argument("output", help="Output file; must differ from the input")
    parser.add_argument("--order", required=True,
                        help="Final order as 1-based slide numbers, such as 1,3,3,2: repeat a number to duplicate that slide, leave one out to delete it")
    parser.add_argument("--prune-layouts", action="store_true", help="Also drop layouts no remaining slide uses")
    args = parser.parse_args()

    source, output = Path(args.input), Path(args.output)
    if source.resolve() == output.resolve():
        sys.exit("Write to a new file; the output must not replace the input.")
    try:
        pkg = Package(source)
    except ImportError:
        sys.exit("lxml is unavailable. Reload this skill to retry dependency setup.")
    except (zipfile.BadZipFile, OSError) as error:
        sys.exit(f"{source} is not a readable .pptx: {error}")

    pres = presentation_part(pkg)
    id_list = pkg.xml(pres).find(f"{{{P_NS}}}sldIdLst")
    count = len(id_list) if id_list is not None else 0
    summary = rearrange(pkg, parse_order(args.order, count))
    layouts = prune_layouts(pkg) if args.prune_layouts else 0
    removed = remove_unreachable(pkg)
    update_counts(pkg)
    output.parent.mkdir(parents=True, exist_ok=True)
    pkg.write(output)
    print(f"Wrote {output}: {summary['kept'] + summary['duplicated']} slide(s), "
          f"{summary['duplicated']} duplicated, {summary['deleted']} deleted"
          + (f", {layouts} unused layout(s) dropped" if args.prune_layouts else "")
          + f", {len(removed)} unreferenced part(s) removed")


if __name__ == "__main__":
    main()
