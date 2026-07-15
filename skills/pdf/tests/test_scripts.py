"""Tests for pdf skill Python scripts."""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).parent.parent / "scripts"


def run(script: str, *args: str, input_text: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        text=True,
    )


@pytest.fixture(scope="session")
def sample_pdf(tmp_path_factory) -> Path:
    """Create a minimal test PDF using reportlab."""
    pytest.importorskip("reportlab")
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet

    path = tmp_path_factory.mktemp("pdf") / "sample.pdf"
    doc = SimpleDocTemplate(str(path))
    styles = getSampleStyleSheet()
    doc.build([
        Paragraph("Hello World", styles["Heading1"]),
        Paragraph("This is a test document.", styles["Normal"]),
        Paragraph("Second paragraph.", styles["Normal"]),
    ])
    return path


@pytest.fixture(scope="session")
def sample_pdf_b(tmp_path_factory) -> Path:
    pytest.importorskip("reportlab")
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet

    path = tmp_path_factory.mktemp("pdf2") / "sample_b.pdf"
    doc = SimpleDocTemplate(str(path))
    styles = getSampleStyleSheet()
    doc.build([Paragraph("Second document.", styles["Normal"])])
    return path


class TestExtractText:
    def test_plain_output(self, sample_pdf, tmp_path):
        result = run("extract-text.py", str(sample_pdf))
        assert result.returncode == 0
        assert "Hello World" in result.stdout

    def test_json_output(self, sample_pdf):
        result = run("extract-text.py", str(sample_pdf), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "totalPages" in data
        assert data["totalPages"] >= 1
        assert any("Hello World" in p["text"] for p in data["pages"])


class TestGetMeta:
    def test_returns_json(self, sample_pdf):
        result = run("get-meta.py", str(sample_pdf))
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "pageCount" in data
        assert data["pageCount"] >= 1
        assert "encrypted" in data


class TestMerge:
    def test_merges_two_pdfs(self, sample_pdf, sample_pdf_b, tmp_path):
        pytest.importorskip("pypdf")
        out = tmp_path / "merged.pdf"
        result = run("merge.py", str(sample_pdf), str(sample_pdf_b), "--output", str(out))
        assert result.returncode == 0
        assert out.exists()
        from pypdf import PdfReader
        assert len(PdfReader(str(out)).pages) >= 2


class TestSplit:
    def test_splits_to_pages(self, sample_pdf, tmp_path):
        pytest.importorskip("pypdf")
        out_dir = tmp_path / "pages"
        result = run("split.py", str(sample_pdf), "--output", str(out_dir))
        assert result.returncode == 0
        pages = list(out_dir.glob("*.pdf"))
        assert len(pages) >= 1


class TestRotate:
    def test_rotates_pages(self, sample_pdf, tmp_path):
        pytest.importorskip("pypdf")
        out = tmp_path / "rotated.pdf"
        result = run("rotate.py", str(sample_pdf), str(out), "--angle", "90")
        assert result.returncode == 0
        assert out.exists()


class TestSetMeta:
    def test_sets_title(self, sample_pdf, tmp_path):
        pytest.importorskip("pypdf")
        out = tmp_path / "updated.pdf"
        result = run("set-meta.py", str(sample_pdf), str(out), "--title", "Test Title")
        assert result.returncode == 0
        from pypdf import PdfReader
        meta = PdfReader(str(out)).metadata
        assert meta.get("/Title") == "Test Title"


class TestCreatePdf:
    def test_creates_pdf_with_metadata_from_content(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("pypdf")
        out = tmp_path / "created.pdf"
        result = run(
            "create-pdf.py",
            "--content",
            "# Hello\n\nTest paragraph.",
            "--output",
            str(out),
            "--title",
            "Quarterly report",
            "--author",
            "Instrument",
        )
        assert result.returncode == 0
        assert out.exists()
        assert out.stat().st_size > 100
        from pypdf import PdfReader

        metadata = PdfReader(str(out)).metadata
        assert metadata.title == "Quarterly report"
        assert metadata.author == "Instrument"


class TestWatermark:
    def test_adds_an_image_watermark(self, sample_pdf, tmp_path):
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        image = tmp_path / "watermark.png"
        Image.new("RGBA", (32, 16), "red").save(image)
        out = tmp_path / "watermarked.pdf"

        result = run(
            "watermark.py",
            str(sample_pdf),
            str(out),
            "--image",
            str(image),
        )

        assert result.returncode == 0
        resources = PdfReader(str(out)).pages[0]["/Resources"]
        assert "/XObject" in resources


class TestImages:
    def test_creates_pdf_from_images(self, tmp_path):
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        first = tmp_path / "first.png"
        second = tmp_path / "second.png"
        Image.new("RGB", (32, 16), "red").save(first)
        Image.new("RGB", (16, 32), "blue").save(second)
        out = tmp_path / "images.pdf"

        result = run(
            "image-to-pdf.py",
            str(first),
            str(second),
            "--output",
            str(out),
        )

        assert result.returncode == 0
        assert len(PdfReader(str(out)).pages) == 2

    def test_inserts_image_into_pdf(self, sample_pdf, tmp_path):
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        image = tmp_path / "stamp.png"
        Image.new("RGB", (32, 16), "green").save(image)
        out = tmp_path / "with-image.pdf"

        result = run(
            "insert-image.py",
            str(sample_pdf),
            str(out),
            "--image",
            str(image),
            "--width",
            "72",
            "--height",
            "36",
        )

        assert result.returncode == 0
        resources = PdfReader(str(out)).pages[0]["/Resources"]
        assert "/XObject" in resources


class TestExtractLinks:
    def test_no_links_exits_cleanly(self, sample_pdf):
        result = run("extract-links.py", str(sample_pdf), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
