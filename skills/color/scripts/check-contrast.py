#!/usr/bin/env python3
"""Check WCAG contrast for a foreground and opaque background color."""

import argparse
import json
import sys


TARGET_RATIOS = {
    "normal": 4.5,
    "large": 3.0,
    "ui": 3.0,
    "aaa": 7.0,
}


def parse_hex(value: str) -> tuple[int, int, int, int]:
    text = value.removeprefix("#")
    if len(text) in {3, 4}:
        text = "".join(character * 2 for character in text)
    if len(text) == 6:
        text += "FF"
    if len(text) != 8:
        raise ValueError(f"Invalid hex color: {value}")
    try:
        return tuple(int(text[index : index + 2], 16) for index in range(0, 8, 2))
    except ValueError as error:
        raise ValueError(f"Invalid hex color: {value}") from error


def composite(
    foreground: tuple[int, int, int, int],
    background: tuple[int, int, int, int],
) -> tuple[int, int, int]:
    if background[3] != 255:
        raise ValueError("Background must be opaque")
    alpha = foreground[3] / 255
    return tuple(
        round(foreground[channel] * alpha + background[channel] * (1 - alpha))
        for channel in range(3)
    )


def relative_luminance(color: tuple[int, int, int]) -> float:
    channels = []
    for value in color:
        srgb = value / 255
        channels.append(
            srgb / 12.92
            if srgb <= 0.04045
            else ((srgb + 0.055) / 1.055) ** 2.4
        )
    red, green, blue = channels
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast_ratio(
    foreground: tuple[int, int, int], background: tuple[int, int, int]
) -> float:
    first = relative_luminance(foreground)
    second = relative_luminance(background)
    lighter = max(first, second)
    darker = min(first, second)
    return (lighter + 0.05) / (darker + 0.05)


def to_hex(color: tuple[int, int, int]) -> str:
    return "#" + "".join(f"{value:02X}" for value in color)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check WCAG contrast for a foreground/background pair."
    )
    parser.add_argument("foreground", help="Foreground hex color, including optional alpha")
    parser.add_argument("background", help="Opaque background hex color")
    parser.add_argument(
        "--target",
        choices=TARGET_RATIOS,
        default="normal",
        help="Required contrast target (default: normal)",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    args = parser.parse_args()

    try:
        foreground = parse_hex(args.foreground)
        background = parse_hex(args.background)
        effective_foreground = composite(foreground, background)
    except ValueError as error:
        parser.error(str(error))

    background_rgb = background[:3]
    ratio = contrast_ratio(effective_foreground, background_rgb)
    required = TARGET_RATIOS[args.target]
    result = {
        "foreground": args.foreground.upper(),
        "effectiveForeground": to_hex(effective_foreground),
        "background": to_hex(background_rgb),
        "target": args.target,
        "requiredRatio": required,
        "ratio": round(ratio, 2),
        "passes": ratio >= required,
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        status = "PASS" if result["passes"] else "FAIL"
        print(
            f"{status}: {result['effectiveForeground']} on {result['background']} "
            f"is {result['ratio']}:1; {args.target} requires {required}:1"
        )
        if foreground[3] != 255:
            print(f"Composited from {args.foreground.upper()}")

    sys.exit(0 if result["passes"] else 1)


if __name__ == "__main__":
    main()
