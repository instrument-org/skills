#!/usr/bin/env python3
"""Replace text in a .pptx presentation using an inventory JSON.

Workflow:
  1. Run inventory.py to get the shape map
  2. Edit the JSON to set new text for each shape
  3. Run replace.py to apply changes

The replacements JSON has the same structure as inventory.py output.
Only shapes listed under 'paragraphs' are modified; other shapes are untouched.

Usage:
  python scripts/replace.py input.pptx replacements.json output.pptx

Or for simple find-and-replace across all text:
  python scripts/replace.py input.pptx --find "Draft" --replace "Final" output.pptx
"""

import argparse
import json
import sys


def replace_via_inventory(prs, replacements: dict):
    """Apply inventory-style replacements."""
    for slide_idx, slide in enumerate(prs.slides):
        slide_key = f"slide-{slide_idx}"
        if slide_key not in replacements:
            continue
        shape_replacements = replacements[slide_key]
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            shape_key = shape.name.replace(" ", "_").lower() if shape.name else None
            shape_idx_key = None
            for k in shape_replacements:
                if k == shape_key or k == f"shape-{list(slide.shapes).index(shape)}":
                    shape_idx_key = k
                    break
            if not shape_idx_key:
                continue
            data = shape_replacements[shape_idx_key]
            new_paras = data.get("paragraphs", [])
            tf = shape.text_frame
            # Clear existing paragraphs and set new content
            for i, para_data in enumerate(new_paras):
                if i < len(tf.paragraphs):
                    para = tf.paragraphs[i]
                else:
                    para = tf.add_paragraph()
                if para.runs:
                    para.runs[0].text = para_data.get("text", "")
                    for run in para.runs[1:]:
                        run.text = ""
                else:
                    from pptx.oxml.ns import qn
                    from lxml import etree
                    run = para.add_run()
                    run.text = para_data.get("text", "")
                para.level = para_data.get("level", 0)


def replace_find_replace(prs, find: str, replace: str):
    """Simple find-and-replace across all text shapes."""
    count = 0
    for slide in prs.slides:
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for para in shape.text_frame.paragraphs:
                for run in para.runs:
                    if find in run.text:
                        run.text = run.text.replace(find, replace)
                        count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description="Replace text in a .pptx file")
    parser.add_argument("input", help="Input .pptx file")
    parser.add_argument("replacements_or_output",
                        help="Replacements JSON file (inventory mode) or output path (find/replace mode)")
    parser.add_argument("output", nargs="?", help="Output .pptx file (inventory mode)")
    parser.add_argument("--find", help="Text to find (simple mode)")
    parser.add_argument("--replace", dest="replace_with", help="Replacement text (simple mode)")
    args = parser.parse_args()

    try:
        from pptx import Presentation
    except ImportError:
        sys.exit("python-pptx not installed. Run: pip install python-pptx")

    prs = Presentation(args.input)

    if args.find is not None and args.replace_with is not None:
        count = replace_find_replace(prs, args.find, args.replace_with)
        output_path = args.replacements_or_output
        prs.save(output_path)
        print(f"Replaced {count} occurrence(s) -> {output_path}")
    else:
        with open(args.replacements_or_output) as f:
            replacements = json.load(f)
        output_path = args.output
        if not output_path:
            sys.exit("Provide output path as third argument in inventory mode")
        replace_via_inventory(prs, replacements)
        prs.save(output_path)
        print(f"Applied replacements -> {output_path}")


if __name__ == "__main__":
    main()
