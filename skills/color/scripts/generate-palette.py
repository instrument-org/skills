#!/usr/bin/env python3
"""Generate an sRGB-gamut-mapped OKLCH shade scale from a hex color."""

import argparse
import json
import math


LIGHT_MIX = {50: 0.92, 100: 0.82, 200: 0.64, 300: 0.44, 400: 0.22}
DARK_MIX = {600: 0.12, 700: 0.28, 800: 0.48, 900: 0.70, 950: 0.86}
CHROMA_SCALE = {
    50: 0.18,
    100: 0.30,
    200: 0.50,
    300: 0.72,
    400: 0.90,
    500: 1.00,
    600: 0.95,
    700: 0.85,
    800: 0.70,
    900: 0.48,
    950: 0.30,
}
USES = {
    50: "subtle surface",
    100: "hovered subtle surface",
    200: "border candidate",
    300: "strong border candidate",
    400: "muted accent candidate",
    500: "source color",
    600: "action candidate",
    700: "action hover candidate",
    800: "strong accent candidate",
    900: "text candidate",
    950: "dark surface candidate",
}


def parse_hex(value: str) -> tuple[int, int, int]:
    text = value.removeprefix("#")
    if len(text) == 3:
        text = "".join(character * 2 for character in text)
    if len(text) != 6:
        raise ValueError(f"Invalid opaque hex color: {value}")
    try:
        return tuple(int(text[index : index + 2], 16) for index in range(0, 6, 2))
    except ValueError as error:
        raise ValueError(f"Invalid opaque hex color: {value}") from error


def srgb_to_linear(value: float) -> float:
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def linear_to_srgb(value: float) -> float:
    return 12.92 * value if value <= 0.0031308 else 1.055 * value ** (1 / 2.4) - 0.055


def rgb_to_oklch(color: tuple[int, int, int]) -> tuple[float, float, float]:
    red, green, blue = (srgb_to_linear(value / 255) for value in color)
    light = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
    medium = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
    short = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
    light_root = math.copysign(abs(light) ** (1 / 3), light)
    medium_root = math.copysign(abs(medium) ** (1 / 3), medium)
    short_root = math.copysign(abs(short) ** (1 / 3), short)
    oklab_lightness = (
        0.2104542553 * light_root
        + 0.7936177850 * medium_root
        - 0.0040720468 * short_root
    )
    axis_a = (
        1.9779984951 * light_root
        - 2.4285922050 * medium_root
        + 0.4505937099 * short_root
    )
    axis_b = (
        0.0259040371 * light_root
        + 0.7827717662 * medium_root
        - 0.8086757660 * short_root
    )
    chroma = math.hypot(axis_a, axis_b)
    hue = math.degrees(math.atan2(axis_b, axis_a)) % 360 if chroma > 1e-8 else 0
    return oklab_lightness, chroma, hue


def raw_oklch_to_srgb(lightness: float, chroma: float, hue: float) -> tuple[float, float, float]:
    radians = math.radians(hue)
    axis_a = chroma * math.cos(radians)
    axis_b = chroma * math.sin(radians)
    light_root = lightness + 0.3963377774 * axis_a + 0.2158037573 * axis_b
    medium_root = lightness - 0.1055613458 * axis_a - 0.0638541728 * axis_b
    short_root = lightness - 0.0894841775 * axis_a - 1.2914855480 * axis_b
    light = light_root**3
    medium = medium_root**3
    short = short_root**3
    red = 4.0767416621 * light - 3.3077115913 * medium + 0.2309699292 * short
    green = -1.2684380046 * light + 2.6097574011 * medium - 0.3413193965 * short
    blue = -0.0041960863 * light - 0.7034186147 * medium + 1.7076147010 * short
    return linear_to_srgb(red), linear_to_srgb(green), linear_to_srgb(blue)


def gamut_map(lightness: float, chroma: float, hue: float) -> tuple[tuple[int, int, int], float]:
    def in_gamut(values: tuple[float, float, float]) -> bool:
        return all(-1e-7 <= value <= 1.0000001 for value in values)

    mapped_chroma = chroma
    values = raw_oklch_to_srgb(lightness, mapped_chroma, hue)
    if not in_gamut(values):
        low = 0.0
        high = chroma
        for _ in range(24):
            candidate = (low + high) / 2
            candidate_values = raw_oklch_to_srgb(lightness, candidate, hue)
            if in_gamut(candidate_values):
                low = candidate
            else:
                high = candidate
        mapped_chroma = low
        values = raw_oklch_to_srgb(lightness, mapped_chroma, hue)

    rgb = tuple(round(max(0, min(1, value)) * 255) for value in values)
    return rgb, mapped_chroma


def to_hex(color: tuple[int, int, int]) -> str:
    return "#" + "".join(f"{value:02X}" for value in color)


def generate_palette(source: tuple[int, int, int]) -> list[dict[str, object]]:
    source_lightness, source_chroma, source_hue = rgb_to_oklch(source)
    if source_lightness <= 0.10 or source_lightness >= 0.985:
        raise ValueError(
            "Source color is too close to black or white for an anchored shade scale"
        )
    rows = []
    for shade in CHROMA_SCALE:
        if shade in LIGHT_MIX:
            mix = LIGHT_MIX[shade]
            lightness = source_lightness + (0.985 - source_lightness) * mix
        elif shade in DARK_MIX:
            mix = DARK_MIX[shade]
            lightness = source_lightness + (0.10 - source_lightness) * mix
        else:
            lightness = source_lightness

        requested_chroma = source_chroma * CHROMA_SCALE[shade]
        if shade == 500:
            rgb = source
            mapped_chroma = source_chroma
        else:
            rgb, mapped_chroma = gamut_map(lightness, requested_chroma, source_hue)
        rows.append(
            {
                "shade": shade,
                "hex": to_hex(rgb),
                "oklch": {
                    "l": round(lightness, 4),
                    "c": round(mapped_chroma, 4),
                    "h": round(source_hue, 2),
                },
                "use": USES[shade],
            }
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate an sRGB-gamut-mapped OKLCH shade scale."
    )
    parser.add_argument("color", help="Opaque source color in hex notation")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    args = parser.parse_args()

    try:
        source = parse_hex(args.color)
        palette = generate_palette(source)
    except ValueError as error:
        parser.error(str(error))

    if args.json:
        print(json.dumps({"source": to_hex(source), "palette": palette}, indent=2))
        return

    print("Shade  Hex       OKLCH                         Candidate use")
    for row in palette:
        color = row["oklch"]
        print(
            f"{row['shade']:>5}  {row['hex']}  "
            f"{color['l']:.4f} {color['c']:.4f} {color['h']:>6.2f}  {row['use']}"
        )


if __name__ == "__main__":
    main()
