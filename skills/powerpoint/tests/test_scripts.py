"""Tests for powerpoint skill Python scripts."""

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


@pytest.fixture(scope="session")
def sample_pptx(tmp_path_factory) -> Path:
    pytest.importorskip("pptx")
    from pptx import Presentation
    from pptx.util import Inches

    path = tmp_path_factory.mktemp("pptx") / "sample.pptx"
    prs = Presentation()
    layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(layout)
    slide.shapes.title.text = "Test Presentation"
    slide.placeholders[1].text = "Subtitle text"

    layout2 = prs.slide_layouts[1]
    slide2 = prs.slides.add_slide(layout2)
    slide2.shapes.title.text = "Slide Two"
    slide2.placeholders[1].text = "Content here"

    prs.save(str(path))
    return path


class TestExtractText:
    def test_extracts_slide_text(self, sample_pptx):
        result = run("extract-text.py", str(sample_pptx))
        assert result.returncode == 0
        assert "Test Presentation" in result.stdout
        assert "Slide Two" in result.stdout

    def test_json_output(self, sample_pptx):
        result = run("extract-text.py", str(sample_pptx), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert data["slideCount"] == 2
        assert any("Test Presentation" in t for t in data["slides"][0]["texts"])


class TestCreate:
    def test_creates_from_json_string(self, tmp_path):
        pytest.importorskip("pptx")
        out = tmp_path / "deck.pptx"
        slides = json.dumps([
            {"layout": "title", "title": "Hello", "content": "World"},
            {"layout": "content", "title": "Points", "content": "- First\n- Second"},
        ])
        result = run("create.py", "--content", slides, "--output", str(out))
        assert result.returncode == 0
        assert out.exists()
        from pptx import Presentation
        prs = Presentation(str(out))
        assert len(prs.slides) == 2

    def test_creates_from_file(self, tmp_path):
        pytest.importorskip("pptx")
        slides_file = tmp_path / "slides.json"
        slides_file.write_text(json.dumps([
            {"title": "Slide 1", "content": "Body"},
        ]))
        out = tmp_path / "from_file.pptx"
        result = run("create.py", "--input", str(slides_file), "--output", str(out))
        assert result.returncode == 0
        assert out.exists()


class TestInventory:
    def test_outputs_shape_map(self, sample_pptx):
        result = run("inventory.py", str(sample_pptx))
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "slide-0" in data
        assert any(
            any("Test Presentation" in p["text"] for p in shapes.get("paragraphs", []))
            for shapes in data["slide-0"].values()
        )


class TestReplace:
    def test_find_replace(self, sample_pptx, tmp_path):
        pytest.importorskip("pptx")
        out = tmp_path / "replaced.pptx"
        result = run("replace.py", str(sample_pptx), str(out), "--find", "Slide Two", "--replace", "Slide 2")
        assert result.returncode == 0
        assert out.exists()
        from pptx import Presentation
        prs = Presentation(str(out))
        all_text = " ".join(
            "".join(r.text for r in para.runs)
            for slide in prs.slides
            for shape in slide.shapes
            if shape.has_text_frame
            for para in shape.text_frame.paragraphs
        )
        assert "Slide 2" in all_text
