"""Tests for color skill Python scripts."""

import json
import subprocess
import sys
from pathlib import Path

import pytest


SCRIPTS = Path(__file__).parent.parent / "scripts"


def run(script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        text=True,
    )


class TestContrast:
    def test_reports_black_on_white(self):
        result = run("check-contrast.py", "#000", "#fff", "--json")

        assert result.returncode == 0
        assert json.loads(result.stdout) == {
            "foreground": "#000",
            "effectiveForeground": "#000000",
            "background": "#FFFFFF",
            "target": "normal",
            "requiredRatio": 4.5,
            "ratio": 21.0,
            "passes": True,
        }

    def test_composites_alpha_before_checking(self):
        result = run("check-contrast.py", "#00000080", "#FFFFFF", "--json")

        assert result.returncode == 1
        output = json.loads(result.stdout)
        assert output["effectiveForeground"] == "#7F7F7F"
        assert output["ratio"] == 4.0

    @pytest.mark.parametrize("target", ["normal", "aaa"])
    def test_uses_selected_target(self, target):
        result = run(
            "check-contrast.py", "#777777", "#FFFFFF", "--target", target, "--json"
        )

        assert result.returncode == 1
        assert json.loads(result.stdout)["target"] == target

    def test_rejects_translucent_background(self):
        result = run("check-contrast.py", "#000", "#FFFFFF80")

        assert result.returncode != 0
        assert "Background must be opaque" in result.stderr


class TestPalette:
    def test_preserves_source_as_shade_500(self):
        result = run("generate-palette.py", "#2563EB", "--json")

        assert result.returncode == 0
        output = json.loads(result.stdout)
        shades = {row["shade"]: row for row in output["palette"]}
        assert output["source"] == "#2563EB"
        assert shades[500]["hex"] == "#2563EB"

    def test_generates_monotonic_lightness(self):
        result = run("generate-palette.py", "#D946EF", "--json")

        palette = json.loads(result.stdout)["palette"]
        lightness = [row["oklch"]["l"] for row in palette]
        assert lightness == sorted(lightness, reverse=True)
        assert len({row["hex"] for row in palette}) == len(palette)

    def test_handles_achromatic_color(self):
        color = "#808080"
        result = run("generate-palette.py", color, "--json")

        assert result.returncode == 0
        assert len(json.loads(result.stdout)["palette"]) == 11

    @pytest.mark.parametrize("color", ["#000000", "#FFFFFF"])
    def test_rejects_anchor_without_room_for_both_directions(self, color):
        result = run("generate-palette.py", color)

        assert result.returncode != 0
        assert "too close to black or white" in result.stderr

    def test_rejects_alpha(self):
        result = run("generate-palette.py", "#2563EB80")

        assert result.returncode != 0
        assert "Invalid opaque hex color" in result.stderr
