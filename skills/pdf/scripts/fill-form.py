#!/usr/bin/env python3
"""Fill interactive (AcroForm) PDF form fields, checking every name and value.

Use --list-fields to discover field names, types, checkbox on-values and
choice options before filling.

Adapted from anthropics/skills (Apache-2.0), pdf/scripts/extract_form_field_info.py
and pdf/scripts/fill_fillable_fields.py; changed: walks the AcroForm field tree
instead of pypdf's flattened field map, reports tooltips, rects, flags and choice labels,
maps friendly checkbox values to the field's on-state, sets buttons' /V and /AS directly,
drops a hybrid form's XFA layer, and reads the written file back to confirm each value.
"""

import argparse
import difflib
import json
import sys
from pathlib import Path

READ_ONLY = 1 << 0
REQUIRED = 1 << 1
RADIO = 1 << 15
PUSHBUTTON = 1 << 16
COMBO = 1 << 17
EDIT = 1 << 18
MULTI_SELECT = 1 << 21

TRUTHY = {"yes", "y", "true", "on", "checked", "check", "x", "1", "selected"}
FALSY = {"no", "n", "false", "off", "unchecked", "", "0", "none", "unselected"}


def inherited(node, key, default=None):
    while node is not None:
        if key in node:
            return node[key].get_object()
        parent = node.get("/Parent")
        node = parent.get_object() if parent is not None else None
    return default


def text_of(value) -> str:
    return str(value) if value is not None else ""


def collect_fields(doc) -> dict:
    """Return {full name: info} for every terminal field, info holding the pypdf objects."""
    page_of = {}
    for index, page in enumerate(doc.pages):
        for annot in page.get("/Annots") or []:
            page_of[annot.idnum if hasattr(annot, "idnum") else id(annot)] = (index, page)

    acro_form = doc.root_object.get("/AcroForm")
    if acro_form is None:
        return {}
    acro_form = acro_form.get_object()
    fields = {}

    def visit(ref, prefix):
        node = ref.get_object()
        name = text_of(node.get("/T")) if "/T" in node else None
        full = ".".join(p for p in (prefix, name) if p) if name is not None else prefix
        kids = [k for k in node.get("/Kids") or []]
        field_kids = [k for k in kids if "/T" in k.get_object()]
        if field_kids:
            for kid in field_kids:
                visit(kid, full)
            return
        widgets = [k for k in kids] if kids else [ref]
        fields[full] = {"node": node, "widgets": widgets}

    for ref in acro_form.get("/Fields") or []:
        visit(ref, "")

    for info in fields.values():
        node = info["node"]
        info["ft"] = inherited(node, "/FT")
        info["flags"] = int(inherited(node, "/Ff", 0))
        info["pages"] = []
        info["rects"] = []
        info["states"] = []
        for widget_ref in info["widgets"]:
            widget = widget_ref.get_object()
            key = widget_ref.idnum if hasattr(widget_ref, "idnum") else id(widget_ref)
            located = page_of.get(key)
            if located is not None:
                index, page = located
                info["pages"].append(index + 1)
                rect = [float(v) for v in widget.get("/Rect", [0, 0, 0, 0])]
                top = float(page.mediabox.top)
                left, bottom, right, upper = min(rect[0], rect[2]), min(rect[1], rect[3]), max(rect[0], rect[2]), max(rect[1], rect[3])
                info["rects"].append([round(left - float(page.mediabox.left), 1), round(top - upper, 1), round(right - left, 1), round(upper - bottom, 1)])
            on = []
            if info["ft"] == "/Btn" and "/AP" in widget:
                normal = widget["/AP"].get_object().get("/N")
                normal = normal.get_object() if normal is not None else None
                if hasattr(normal, "keys"):
                    on = [str(k) for k in normal.keys() if str(k) != "/Off"]
            info["states"].append(on)
        info["kind"] = kind_of(info)
        info["opt_pairs"] = opt_pairs(info)
    return fields


def kind_of(info) -> str:
    ft, flags = info["ft"], info["flags"]
    if ft == "/Tx":
        return "text"
    if ft == "/Btn":
        if flags & PUSHBUTTON:
            return "button"
        return "radio" if flags & RADIO else "checkbox"
    if ft == "/Ch":
        return "combo" if flags & COMBO else "list"
    if ft == "/Sig":
        return "signature"
    return f"unknown ({ft})"


def opt_pairs(info) -> list[tuple[str, str]]:
    """(export value, display text) for each /Opt entry."""
    pairs = []
    for entry in inherited(info["node"], "/Opt", []) or []:
        entry = entry.get_object()
        if isinstance(entry, list) and len(entry) == 2:
            pairs.append((text_of(entry[0].get_object()), text_of(entry[1].get_object())))
        else:
            pairs.append((text_of(entry), text_of(entry)))
    return pairs


def on_states(info) -> list[str]:
    seen = []
    for states in info["states"]:
        for state in states:
            if state not in seen:
                seen.append(state)
    return seen


def radio_choices(info) -> list[tuple[str, str]]:
    """(value to pass, state name) for each radio option; /Opt labels when the form has them."""
    labels = [export for export, _ in info["opt_pairs"]]
    choices = []
    for index, states in enumerate(info["states"]):
        for state in states:
            label = labels[index] if len(labels) == len(info["states"]) else state.lstrip("/")
            if (label, state) not in choices:
                choices.append((label, state))
    return choices


def current_value(info):
    value = inherited(info["node"], "/V")
    if value is None:
        return None
    if isinstance(value, list):
        return [text_of(v) for v in value]
    return text_of(value)


def describe(info) -> dict:
    node, kind, flags = info["node"], info["kind"], info["flags"]
    entry = {"type": kind, "value": current_value(info)}
    if info["pages"]:
        entry["page"] = info["pages"][0] if len(set(info["pages"])) == 1 else sorted(set(info["pages"]))
        entry["rect"] = info["rects"][0]
    tooltip = inherited(node, "/TU")
    if tooltip is not None:
        entry["tooltip"] = text_of(tooltip)
    if kind == "checkbox":
        entry["on"] = on_states(info)
        entry["off"] = "/Off"
    elif kind == "radio":
        entry["options"] = [label for label, _ in radio_choices(info)]
    elif kind in ("combo", "list"):
        entry["options"] = [export for export, _ in info["opt_pairs"]]
        labels = [label for _, label in info["opt_pairs"]]
        if labels != entry["options"]:
            entry["labels"] = labels
        if kind == "combo" and flags & EDIT:
            entry["editable"] = True
        if kind == "list" and flags & MULTI_SELECT:
            entry["multiple"] = True
    elif kind == "text":
        max_len = inherited(node, "/MaxLen")
        if max_len is not None:
            entry["maxLength"] = int(max_len)
    if flags & READ_ONLY:
        entry["readOnly"] = True
    if flags & REQUIRED:
        entry["required"] = True
    return entry


def friendly(value) -> str | None:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if value is None:
        return "no"
    if isinstance(value, (int, float)):
        return "yes" if value else "no"
    return str(value).strip().lower() if isinstance(value, str) else None


def resolve(name, info, value):
    """Return (kind, resolved value, display) or raise ValueError with the reason."""
    kind, flags = info["kind"], info["flags"]
    if flags & READ_ONLY:
        raise ValueError(f'"{name}" is read-only')
    if kind == "text":
        if isinstance(value, (dict, list)):
            raise ValueError(f'"{name}" is a text field; give it a string')
        text = "" if value is None else ("Yes" if value is True else "No" if value is False else str(value))
        max_len = inherited(info["node"], "/MaxLen")
        if max_len is not None and len(text) > int(max_len):
            raise ValueError(f'"{name}" takes at most {int(max_len)} characters; got {len(text)}')
        return text, json.dumps(text)
    if kind == "checkbox":
        states = on_states(info)
        if isinstance(value, str):
            for state in states:
                if value in (state, state.lstrip("/")):
                    return state, f"checked ({state})"
            matches = [s for s in states if s.lstrip("/").lower() == value.strip().lstrip("/").lower()]
            if len(matches) == 1:
                return matches[0], f"checked ({matches[0]})"
            if value.strip() in ("/Off", "Off"):
                return "/Off", "unchecked"
        word = friendly(value)
        if word in FALSY:
            return "/Off", "unchecked"
        if word in TRUTHY:
            if len(states) == 1:
                return states[0], f"checked ({states[0]})"
            if not states:
                raise ValueError(f'checkbox "{name}" has no on-state appearance to check')
            raise ValueError(f'checkbox "{name}" has several on-values; pass one of {states} or "/Off"')
        raise ValueError(f'invalid value {json.dumps(value)} for checkbox "{name}"; pass true/false or one of {states + ["/Off"]}')
    if kind == "radio":
        choices = radio_choices(info)
        if isinstance(value, str):
            for label, state in choices:
                if value in (label, state, state.lstrip("/")):
                    return state, f"{label} ({state})"
            matches = [(l, s) for l, s in choices if value.strip().lower() in (l.lower(), s.lstrip("/").lower())]
            if len(matches) == 1:
                return matches[0][1], f"{matches[0][0]} ({matches[0][1]})"
        if value is None or (isinstance(value, str) and value.strip() in ("/Off", "Off")):
            return "/Off", "none selected"
        raise ValueError(f'invalid value {json.dumps(value)} for radio group "{name}"; valid options: {[l for l, _ in choices]}')
    if kind in ("combo", "list"):
        pairs = info["opt_pairs"]
        multiple = kind == "list" and flags & MULTI_SELECT
        editable = kind == "combo" and flags & EDIT
        values = value if isinstance(value, list) else [value]
        if isinstance(value, list) and not multiple:
            raise ValueError(f'"{name}" takes one option, not a list')
        resolved = []
        for item in values:
            item = text_of(item)
            match = next((export for export, label in pairs if item in (export, label)), None)
            if match is None:
                folded = [export for export, label in pairs if item.strip().lower() in (export.lower(), label.lower())]
                match = folded[0] if len(folded) == 1 else None
            if match is None and editable:
                match = item
            if match is None:
                raise ValueError(f'invalid value {json.dumps(item)} for {kind} field "{name}"; valid options: {[e for e, _ in pairs]}')
            resolved.append(match)
        result = resolved if multiple else resolved[0]
        return result, json.dumps(result)
    raise ValueError(f'"{name}" is a {kind} field, which this script cannot fill')


def unknown_name_error(name, fields) -> str:
    names = list(fields)
    close = difflib.get_close_matches(name, names, n=3, cutoff=0.6)
    close += [n for n in names if n.rsplit(".", 1)[-1] == name and n not in close]
    hint = f" Did you mean {close}?" if close else ""
    listing = f" Fields: {names}" if len(names) <= 30 else " Run --list-fields for every name."
    return f'"{name}" is not a field in this PDF.{hint}{listing}'


def set_button(info, state):
    from pypdf.generic import NameObject

    info["node"][NameObject("/V")] = NameObject(state)
    for widget_ref, states in zip(info["widgets"], info["states"]):
        widget = widget_ref.get_object()
        widget[NameObject("/AS")] = NameObject(state if state in states else "/Off")


def button_state(info):
    value = current_value(info)
    shown = [text_of(w.get_object().get("/AS")) for w in info["widgets"]]
    return value, shown


def load_values(raw: str) -> dict:
    text = raw if raw.lstrip().startswith("{") else Path(raw).read_text(encoding="utf-8")
    values = json.loads(text)
    if not isinstance(values, dict):
        sys.exit("--fields must be a JSON object of field name -> value")
    return values


def main():
    parser = argparse.ArgumentParser(description="Fill interactive PDF form fields, checking every name and value")
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("output", nargs="?", help="Output PDF file")
    parser.add_argument(
        "--fields",
        help='JSON object of field name -> value, or a path to a .json file holding one, e.g. \'{"Name": "Alice", "Agree": true, "State": "CA"}\'. Checkboxes take true/false, "Yes"/"No" or an on-value from --list-fields.',
    )
    parser.add_argument(
        "--list-fields",
        action="store_true",
        help="Print every field as JSON (type, value, page, rect [x, top, width, height] from the top-left, tooltip, checkbox on-values, radio and choice options) and exit",
    )
    args = parser.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
        from pypdf.generic import NameObject
    except ImportError:
        sys.exit("pypdf is missing; the PDF skill dependencies were not installed")

    reader = PdfReader(args.input)
    fields = collect_fields(reader)
    acro_form = reader.root_object.get("/AcroForm")
    has_xfa = acro_form is not None and "/XFA" in acro_form.get_object()

    if not fields:
        reason = "It is an XFA form, which this script cannot fill." if has_xfa else "It is not an interactive form."
        print(f"No AcroForm fields found in this PDF. {reason} Use overlay-form.py to place text on the page instead.", file=sys.stderr)
        sys.exit(0 if args.list_fields else 1)

    if args.list_fields:
        lines = [f"  {json.dumps(name, ensure_ascii=False)}: {json.dumps(describe(info), ensure_ascii=False)}" for name, info in fields.items()]
        print("{\n" + ",\n".join(lines) + "\n}")
        return

    if not args.fields:
        sys.exit("Provide --fields JSON or --list-fields")
    if not args.output:
        sys.exit("Provide an output path")

    values = load_values(args.fields)
    errors, plan = [], {}
    for name, value in values.items():
        info = fields.get(name)
        if info is None:
            errors.append(unknown_name_error(name, fields))
            continue
        try:
            plan[name] = resolve(name, info, value)
        except ValueError as error:
            errors.append(str(error))
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"Nothing written. Fix the {len(errors)} error(s) above and run again.", file=sys.stderr)
        sys.exit(1)

    before = {name: current_value(info) for name, info in fields.items()}
    writer = PdfWriter(clone_from=reader)
    out_fields = collect_fields(writer)
    text_values = {}
    for name, (resolved, _) in plan.items():
        info = out_fields[name]
        if info["kind"] in ("checkbox", "radio"):
            set_button(info, resolved)
        else:
            text_values[name] = resolved
    if text_values:
        writer.update_page_form_field_values(None, text_values, auto_regenerate=False)
    writer.set_need_appearances_writer(True)
    out_form = writer.root_object["/AcroForm"].get_object()
    if "/XFA" in out_form:
        del out_form[NameObject("/XFA")]

    with open(args.output, "wb") as f:
        writer.write(f)

    check = collect_fields(PdfReader(args.output))
    problems = []
    for name, (resolved, _) in plan.items():
        info = check.get(name)
        if info is None:
            problems.append(f'"{name}" is missing from the written file')
            continue
        if info["kind"] in ("checkbox", "radio"):
            value, shown = button_state(info)
            expected = [resolved if resolved in states else "/Off" for states in info["states"]]
            if value != resolved or shown != expected:
                problems.append(f'"{name}" reads back as {value} (shown {shown}), expected {resolved}')
        elif current_value(info) != resolved:
            problems.append(f'"{name}" reads back as {json.dumps(current_value(info))}, expected {json.dumps(resolved)}')
    for name, info in check.items():
        if name not in plan and current_value(info) != before.get(name):
            problems.append(f'"{name}" was not given but changed to {json.dumps(current_value(info))}')
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        sys.exit(1)

    print(f"Set {len(plan)} field(s) in {args.output}, confirmed by reading the file back:")
    for name, (_, display) in plan.items():
        print(f"  {name}: {display}")
    empty_required = [
        name for name, info in check.items()
        if info["flags"] & REQUIRED and current_value(info) in (None, "", "/Off")
    ]
    if empty_required:
        print(f"Required fields still empty: {empty_required}")
    if has_xfa:
        print("Removed the form's XFA layer so every viewer shows these AcroForm values.")


if __name__ == "__main__":
    main()
