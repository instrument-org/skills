#!/usr/bin/env python3
"""Convert a deck with LibreOffice (soffice) without letting it touch the original or reach outside the file.

Renders a copy of the deck, with every external link except web and mail hyperlinks blanked so a linked picture, movie or object cannot fetch a file:// or network target, under a throwaway user profile, since soffice hangs or exits silently when the person already has LibreOffice open. Adapted from anthropics/skills (Apache-2.0), pptx/scripts/office/soffice.py; changed: a convert command rather than a soffice passthrough, links blanked by relationship type (a linked picture at an https address is blanked too), lxml in place of defusedxml, a timeout, and no AF_UNIX socket shim.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

HYPERLINK_TYPE = "/relationships/hyperlink"
WEB_OR_MAIL = ("http://", "https://", "mailto:")
EMPTY_RELS = b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
DEFAULT_TIMEOUT = 180


def find_soffice() -> str | None:
    return shutil.which("soffice")


def blank_outside_links(rels: bytes) -> bytes | None:
    """Return the relationships with outside targets blanked, or None when nothing needed blanking."""
    from lxml import etree

    try:
        root = etree.fromstring(rels, etree.XMLParser(resolve_entities=False, no_network=True))
    except etree.XMLSyntaxError:
        return EMPTY_RELS
    cut = False
    for rel in root:
        if rel.get("TargetMode") != "External":
            continue
        target = rel.get("Target", "")
        if rel.get("Type", "").endswith(HYPERLINK_TYPE) and target.lower().startswith(WEB_OR_MAIL):
            continue
        if target != "about:blank":
            rel.set("Target", "about:blank")
            cut = True
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True) if cut else None


def safe_copy(source: Path, folder: Path) -> Path:
    """Copy the deck into folder, blanking outside links in an OOXML package; other files are copied as they are."""
    copy = folder / source.name
    if not zipfile.is_zipfile(source):
        shutil.copyfile(source, copy)
        return copy
    with zipfile.ZipFile(source) as package, zipfile.ZipFile(copy, "w", zipfile.ZIP_DEFLATED) as out:
        for member in package.infolist():
            data = package.read(member)
            if member.filename.lower().endswith(".rels"):
                data = blank_outside_links(data) or data
            out.writestr(member, data)
    return copy


def convert(source: Path, to: str, outdir: Path, timeout: int = DEFAULT_TIMEOUT) -> Path:
    """Convert source to the `to` format in outdir and return the written file."""
    soffice = find_soffice()
    if soffice is None:
        raise RuntimeError("LibreOffice (soffice) is not installed.")
    outdir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="soffice-", ignore_cleanup_errors=True) as tmp:
        work = Path(tmp)
        (work / "in").mkdir()
        copy = safe_copy(source, work / "in")
        profile = (work / "profile").as_uri()
        command = [
            soffice, f"-env:UserInstallation={profile}", "--headless", "--norestore",
            "--convert-to", to, "--outdir", str(work / "out"), str(copy),
        ]
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=timeout,
                                    env={**os.environ, "SAL_USE_VCLPLUGIN": "svp"})
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"LibreOffice did not finish converting {source.name} within {timeout} seconds.")
        written = sorted((work / "out").glob(f"{copy.stem}.*")) if (work / "out").is_dir() else []
        if result.returncode != 0 or not written:
            raise RuntimeError(f"LibreOffice could not convert {source.name}:\n{result.stderr.strip()}")
        target = outdir / written[0].name
        if target.resolve() == source.resolve():
            raise RuntimeError(f"Converting {source.name} into its own folder would replace it; pass another --outdir.")
        shutil.move(str(written[0]), target)
        return target


def main():
    parser = argparse.ArgumentParser(description="Convert a deck with LibreOffice, from a copy with outside links blanked and a throwaway profile")
    parser.add_argument("input", help="Deck to convert (.pptx, .ppt, .potx, .odp)")
    parser.add_argument("--to", default="pdf", help="Target format, as soffice --convert-to takes it (default: pdf; pptx converts a legacy .ppt)")
    parser.add_argument("--outdir", default=".", help="Folder for the converted file (default: current folder)")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help=f"Seconds before giving up (default: {DEFAULT_TIMEOUT})")
    args = parser.parse_args()
    try:
        print(convert(Path(args.input), args.to, Path(args.outdir), args.timeout))
    except RuntimeError as error:
        sys.exit(str(error))


if __name__ == "__main__":
    main()
