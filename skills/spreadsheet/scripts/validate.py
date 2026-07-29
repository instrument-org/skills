#!/usr/bin/env python3
"""Validate an Excel workbook's XML before delivering it.

Checks every worksheet part against the ECMA-376 spreadsheet schema and checks
the sheet views for pane/selection combinations Excel rejects. Excel reports
either class as unreadable content and offers to repair the file.

Examples:
  python scripts/validate.py output/report.xlsx
  python scripts/validate.py output/report.xlsx --fix
  python scripts/validate.py output/report.xlsx --json
"""

import argparse
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

SCHEMA = Path(__file__).resolve().parent.parent / "schemas" / "sml.xsd"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
PANE_DEFAULT = "topLeft"


def panes_present(pane):
    """The panes a <pane> element actually creates. Selections may name only these."""
    if pane is None:
        return {PANE_DEFAULT}
    x = float(pane.get("xSplit") or 0)
    y = float(pane.get("ySplit") or 0)
    if x and y:
        return {"topLeft", "topRight", "bottomLeft", "bottomRight"}
    if y:
        return {"topLeft", "bottomLeft"}
    if x:
        return {"topLeft", "topRight"}
    return {PANE_DEFAULT}


def check_sheet_views(root, part):
    """Report selections Excel cannot reconcile with the sheet's panes.

    openpyxl's freeze_panes setter appends to whatever selections the loaded file
    already had instead of replacing them, so re-freezing a workbook that was
    saved with frozen panes leaves duplicates and references to panes that the
    new split does not create. The schema allows at most four selections, so a
    third freeze also overruns that limit.
    """
    problems = []
    for view_index, view in enumerate(root.iter(f"{NS}sheetView")):
        selections = view.findall(f"{NS}selection")
        keys = [s.get("pane") or PANE_DEFAULT for s in selections]
        live = panes_present(view.find(f"{NS}pane"))
        where = f"{part} sheetView[{view_index}]"

        if len(selections) > 4:
            problems.append(
                f"{where}: {len(selections)} <selection> elements; the schema allows at most 4"
            )
        for key in sorted({k for k in keys if keys.count(k) > 1}):
            problems.append(f'{where}: {keys.count(key)} selections for pane "{key}"')
        for key in sorted({k for k in keys if k not in live}):
            problems.append(
                f'{where}: selection for pane "{key}", which this sheet\'s split does not create'
            )
    return problems


def repair_sheet_views(root):
    """Keep the first selection for each pane that exists; drop the rest."""
    repaired = 0
    for view in root.iter(f"{NS}sheetView"):
        live = panes_present(view.find(f"{NS}pane"))
        kept = set()
        for selection in view.findall(f"{NS}selection"):
            key = selection.get("pane") or PANE_DEFAULT
            if key in live and key not in kept:
                kept.add(key)
                continue
            view.remove(selection)
            repaired += 1
    return repaired


def worksheet_parts(archive):
    return sorted(n for n in archive.namelist() if n.startswith("xl/worksheets/sheet"))


def validate(path, fix=False):
    try:
        from lxml import etree
    except ImportError:
        sys.exit("lxml is unavailable. Reload this skill to retry dependency setup.")

    if not SCHEMA.is_file():
        sys.exit(f"Schema not found at {SCHEMA}")

    schema = etree.XMLSchema(etree.parse(str(SCHEMA)))
    schema_errors, view_errors, repairs = [], [], 0
    repaired_parts = {}

    with zipfile.ZipFile(path) as archive:
        parts = worksheet_parts(archive)
        for part in parts:
            root = etree.fromstring(archive.read(part))

            if fix:
                count = repair_sheet_views(root)
                if count:
                    repairs += count
                    repaired_parts[part] = etree.tostring(
                        root, xml_declaration=True, encoding="UTF-8", standalone=True
                    )

            view_errors += check_sheet_views(root, part)
            if not schema.validate(root):
                schema_errors += [f"{part}: {e.message}" for e in schema.error_log]

    if repaired_parts:
        rewrite(path, repaired_parts)
        # Re-read so the reported result describes the file as it now stands.
        return validate(path, fix=False) | {"repaired_selections": repairs}

    return {
        "status": "valid" if not (schema_errors or view_errors) else "invalid",
        "worksheets": len(parts),
        "schema_errors": schema_errors,
        "sheet_view_errors": view_errors,
        "repaired_selections": repairs,
    }


def rewrite(path, replacements):
    """Replace parts in place, leaving every other entry byte-identical."""
    path = Path(path)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".xlsx", delete=False) as tmp:
        staged = Path(tmp.name)
    try:
        with zipfile.ZipFile(path) as src, zipfile.ZipFile(
            staged, "w", zipfile.ZIP_DEFLATED
        ) as dst:
            for item in src.infolist():
                dst.writestr(item, replacements.get(item.filename, src.read(item.filename)))
        shutil.move(str(staged), str(path))
    finally:
        staged.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Validate an Excel workbook's XML")
    parser.add_argument("input", help="Input .xlsx or .xlsm file")
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Repair inconsistent sheet view selections in place",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    args = parser.parse_args()

    if not Path(args.input).is_file():
        sys.exit(f"Not a file: {args.input}")

    try:
        result = validate(args.input, fix=args.fix)
    except zipfile.BadZipFile:
        sys.exit(f"{args.input} is not a readable .xlsx archive")

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        count = result["worksheets"]
        print(f"{args.input}: {result['status']} ({count} worksheet{'' if count == 1 else 's'})")
        if result["repaired_selections"]:
            print(f"Repaired {result['repaired_selections']} sheet view selection(s)")
        for label, key in [
            ("Sheet view", "sheet_view_errors"),
            ("Schema", "schema_errors"),
        ]:
            for message in result[key]:
                print(f"  {label}: {message}")
        if result["status"] == "invalid" and not args.fix:
            print("Re-run with --fix to repair sheet view selections.")

    sys.exit(0 if result["status"] == "valid" else 1)


if __name__ == "__main__":
    main()
