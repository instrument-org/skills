#!/usr/bin/env python3
"""Place flattened text into top-left coordinate boxes on a non-interactive PDF form."""

import argparse
import json
import sys
from pathlib import Path

# cspell:ignore cobi cobo coit cour hebi hebo heit helv symb tibi tibo tiit zapfdingbats fontname

ALIGNMENTS = {"left": 0, "center": 1, "right": 2}
BUILTIN_FONTS = {
    "cobi",
    "cobo",
    "coit",
    "cour",
    "hebi",
    "hebo",
    "heit",
    "helv",
    "symb",
    "tibi",
    "tibo",
    "tiit",
    "tiro",
    "zapfdingbats",
}


def parse_color(value: str) -> tuple[float, float, float]:
    text = value.removeprefix("#")
    if len(text) == 3:
        text = "".join(character * 2 for character in text)
    if len(text) != 6:
        raise ValueError(f"Invalid opaque hex color: {value}")
    try:
        channels = tuple(int(text[index : index + 2], 16) for index in range(0, 6, 2))
    except ValueError as error:
        raise ValueError(f"Invalid opaque hex color: {value}") from error
    return tuple(channel / 255 for channel in channels)


def rectangles_intersect(first: tuple[float, ...], second: tuple[float, ...]) -> bool:
    first_right = first[0] + first[2]
    first_bottom = first[1] + first[3]
    second_right = second[0] + second[2]
    second_bottom = second[1] + second[3]
    return not (
        first_right <= second[0]
        or second_right <= first[0]
        or first_bottom <= second[1]
        or second_bottom <= first[1]
    )


def load_fields(path: Path, document) -> list[dict[str, object]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not read field JSON: {error}") from error

    fields = payload.get("fields") if isinstance(payload, dict) else None
    if not isinstance(fields, list) or not fields:
        raise ValueError("Field JSON must contain a non-empty 'fields' array")

    validated = []
    boxes_by_page: dict[int, list[tuple[float, float, float, float]]] = {}
    for index, field in enumerate(fields, start=1):
        if not isinstance(field, dict):
            raise ValueError(f"Field {index} must be an object")

        page_number = field.get("page")
        if not isinstance(page_number, int) or isinstance(page_number, bool):
            raise ValueError(f"Field {index} page must be an integer")
        if page_number < 1 or page_number > document.page_count:
            raise ValueError(
                f"Field {index} page {page_number} is outside 1-{document.page_count}"
            )

        page = document[page_number - 1]
        if page.rotation != 0:
            raise ValueError(
                f"Field {index} targets rotated page {page_number}; normalize rotation first"
            )

        box = field.get("box")
        if (
            not isinstance(box, list)
            or len(box) != 4
            or any(
                not isinstance(value, (int, float)) or isinstance(value, bool)
                for value in box
            )
        ):
            raise ValueError(f"Field {index} box must be [x, top, width, height]")
        x, top, width, height = (float(value) for value in box)
        if x < 0 or top < 0 or width <= 0 or height <= 0:
            raise ValueError(
                f"Field {index} box must have non-negative position and positive size"
            )
        if x + width > page.rect.width or top + height > page.rect.height:
            raise ValueError(f"Field {index} box extends outside page {page_number}")

        text = field.get("text")
        if not isinstance(text, str) or not text:
            raise ValueError(f"Field {index} text must be a non-empty string")

        font_size = field.get("fontSize", 10)
        if (
            not isinstance(font_size, (int, float))
            or isinstance(font_size, bool)
            or font_size <= 0
        ):
            raise ValueError(f"Field {index} fontSize must be positive")
        minimum_font_size = field.get("minFontSize", min(8, font_size))
        if (
            not isinstance(minimum_font_size, (int, float))
            or isinstance(minimum_font_size, bool)
            or minimum_font_size <= 0
            or minimum_font_size > font_size
        ):
            raise ValueError(
                f"Field {index} minFontSize must be positive and at most fontSize"
            )

        font = field.get("font", "helv")
        if not isinstance(font, str) or font not in BUILTIN_FONTS:
            raise ValueError(f"Field {index} font must be a built-in PDF font alias")
        alignment = field.get("align", "left")
        if not isinstance(alignment, str) or alignment not in ALIGNMENTS:
            raise ValueError(f"Field {index} align must be left, center, or right")
        color = field.get("color", "#000000")
        if not isinstance(color, str):
            raise ValueError(f"Field {index} color must be a hex string")

        rectangle = (x, top, width, height)
        existing_boxes = boxes_by_page.setdefault(page_number, [])
        if any(
            rectangles_intersect(rectangle, existing) for existing in existing_boxes
        ):
            raise ValueError(
                f"Field {index} box overlaps another field on page {page_number}"
            )
        existing_boxes.append(rectangle)
        validated.append(
            {
                "align": ALIGNMENTS[alignment],
                "box": rectangle,
                "color": parse_color(color),
                "font": font,
                "fontSize": float(font_size),
                "minFontSize": float(minimum_font_size),
                "page": page_number,
                "text": text,
            }
        )

    return validated


def place_text(page, field: dict[str, object], fitz) -> float:
    x, top, width, height = field["box"]
    rectangle = fitz.Rect(x, top, x + width, top + height)
    font_size = field["fontSize"]
    minimum_font_size = field["minFontSize"]

    while font_size + 1e-9 >= minimum_font_size:
        shape = page.new_shape()
        spare_height = shape.insert_textbox(
            rectangle,
            field["text"],
            align=field["align"],
            color=field["color"],
            fontname=field["font"],
            fontsize=font_size,
        )
        if spare_height >= 0:
            shape.commit(overlay=True)
            return font_size
        font_size = round(font_size - 0.5, 2)

    raise ValueError(
        f"Text on page {field['page']} does not fit its box at "
        f"minimum font size {minimum_font_size:g}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Place flattened text into a non-interactive PDF form."
    )
    parser.add_argument("input", help="Input PDF file")
    parser.add_argument("fields", help="JSON file describing text boxes")
    parser.add_argument("output", nargs="?", help="Output PDF file")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate field data without writing a PDF",
    )
    args = parser.parse_args()

    if not args.validate_only and not args.output:
        parser.error("output is required unless --validate-only is used")

    input_path = Path(args.input).resolve()
    fields_path = Path(args.fields).resolve()
    output_path = Path(args.output).resolve() if args.output else None
    if output_path == input_path:
        parser.error("Output must differ from input")

    try:
        import fitz
    except ImportError:
        sys.exit("PyMuPDF is missing; the PDF skill dependencies were not installed")

    try:
        with fitz.open(input_path) as document:
            fields = load_fields(fields_path, document)
            if args.validate_only:
                print(f"Validated {len(fields)} field(s)")
                return

            for field in fields:
                place_text(document[field["page"] - 1], field, fitz)

            output_path.parent.mkdir(parents=True, exist_ok=True)
            document.save(output_path)
    except (OSError, RuntimeError, ValueError) as error:
        sys.exit(str(error))

    relative_output = (
        output_path.relative_to(Path.cwd())
        if output_path.is_relative_to(Path.cwd())
        else output_path
    )
    print(f"Placed {len(fields)} field(s) -> {relative_output}")


if __name__ == "__main__":
    main()
