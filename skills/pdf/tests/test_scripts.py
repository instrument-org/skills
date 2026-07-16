"""Tests for pdf skill Python scripts."""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).parent.parent / "scripts"


def run(
    script: str,
    *args: str,
    input_text: str | None = None,
    cwd: Path | None = None,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        cwd=cwd,
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

    def test_escapes_heading_and_body_text(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("pypdf")
        from pypdf import PdfReader

        out = tmp_path / "escaped.pdf"
        result = run(
            "create-pdf.py",
            "--content",
            "# R&D <2026>\n\nMargin \N{EM DASH} stable.",
            "--output",
            str(out),
        )

        assert result.returncode == 0
        text = PdfReader(str(out)).pages[0].extract_text()
        assert "R&D <2026>" in text
        assert "Margin \N{EM DASH} stable." in text

    def test_embeds_markdown_image(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image

        image = tmp_path / "chart.png"
        Image.new("RGB", (120, 80), "blue").save(image)
        out = tmp_path / "with-image.pdf"
        result = run(
            "create-pdf.py",
            "--content",
            f"# Report\n\n![Chart]({image})",
            "--output",
            str(out),
        )
        assert result.returncode == 0
        from pypdf import PdfReader

        assert len(PdfReader(str(out)).pages[0].images) == 1

    def test_embeds_markdown_image_relative_to_task_root(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        task = tmp_path / "task"
        attachments = task / "attachments"
        output = task / "output"
        attachments.mkdir(parents=True)
        output.mkdir()
        Image.new("RGB", (120, 80), "blue").save(attachments / "chart.png")

        result = run(
            "create-pdf.py",
            "--content",
            "![Chart](attachments/chart.png)",
            "--output",
            "output/report.pdf",
            cwd=task,
        )

        assert result.returncode == 0
        assert len(PdfReader(str(output / "report.pdf")).pages[0].images) == 1

    def test_resolves_images_relative_to_markdown_file_first(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        source = tmp_path / "source"
        source.mkdir()
        Image.new("RGB", (16, 16), "blue").save(source / "chart.png")
        markdown = source / "report.md"
        markdown.write_text("![Chart](chart.png)")

        task = tmp_path / "task"
        task.mkdir()
        Image.new("RGB", (16, 16), "red").save(task / "chart.png")
        out = task / "report.pdf"

        result = run(
            "create-pdf.py",
            "--input",
            str(markdown),
            "--output",
            str(out),
            cwd=task,
        )

        assert result.returncode == 0
        embedded = PdfReader(str(out)).pages[0].images[0].image.convert("RGB")
        assert embedded.getpixel((0, 0)) == (0, 0, 255)

    def test_falls_back_to_task_root_for_markdown_file_images(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader

        source = tmp_path / "source"
        source.mkdir()
        markdown = source / "report.md"
        markdown.write_text("![Chart](attachments/chart.png)")

        task = tmp_path / "task"
        attachments = task / "attachments"
        attachments.mkdir(parents=True)
        Image.new("RGB", (16, 16), "red").save(attachments / "chart.png")
        out = task / "report.pdf"

        result = run(
            "create-pdf.py",
            "--input",
            str(markdown),
            "--output",
            str(out),
            cwd=task,
        )

        assert result.returncode == 0
        embedded = PdfReader(str(out)).pages[0].images[0].image.convert("RGB")
        assert embedded.getpixel((0, 0)) == (255, 0, 0)

    def test_embeds_svg_image(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("fitz")
        pytest.importorskip("pypdf")
        svg = tmp_path / "box.svg"
        svg.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">'
            '<rect width="100" height="50" fill="red"/></svg>'
        )
        out = tmp_path / "with-svg.pdf"
        result = run(
            "create-pdf.py",
            "--content",
            f"![Box]({svg})",
            "--output",
            str(out),
        )
        assert result.returncode == 0
        import fitz
        from pypdf import PdfReader

        assert len(PdfReader(str(out)).pages[0].images) == 1
        with fitz.open(out) as pdf:
            rendered = pdf[0].get_pixmap(alpha=False)
        assert b"\xff\x00\x00" in rendered.samples

    def test_fails_loudly_on_malformed_svg(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("fitz")
        svg = tmp_path / "broken.svg"
        svg.write_text("<svg><rect>")
        out = tmp_path / "broken.pdf"

        result = run(
            "create-pdf.py",
            "--content",
            f"![Broken]({svg})",
            "--output",
            str(out),
        )

        assert result.returncode != 0
        assert "Could not render SVG" in result.stderr
        assert not out.exists()

    def test_rejects_svg_entities(self, tmp_path):
        pytest.importorskip("reportlab")
        pytest.importorskip("fitz")
        svg = tmp_path / "entity.svg"
        svg.write_text(
            '<!DOCTYPE svg [<!ENTITY payload "unsafe">]>'
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">'
            "<text>&payload;</text></svg>",
            encoding="utf-8",
        )
        out = tmp_path / "entity.pdf"

        result = run(
            "create-pdf.py",
            "--content",
            f"![Entity]({svg})",
            "--output",
            str(out),
        )

        assert result.returncode != 0
        assert "EntitiesForbidden" in result.stderr
        assert not out.exists()

    @pytest.mark.parametrize("size", [(4000, 1000), (1000, 4000)])
    def test_fits_large_raster_images_on_page(self, tmp_path, size):
        pytest.importorskip("reportlab")
        pytest.importorskip("PIL")
        fitz = pytest.importorskip("fitz")
        from PIL import Image

        image = tmp_path / "large.png"
        Image.new("RGB", size, "blue").save(image)
        out = tmp_path / "fitted.pdf"

        result = run(
            "create-pdf.py",
            "--content",
            f"![Large]({image})",
            "--output",
            str(out),
        )

        assert result.returncode == 0
        with fitz.open(out) as pdf:
            page = pdf[0]
            xref = page.get_images(full=True)[0][0]
            rect = page.get_image_rects(xref)[0]
        assert rect.width <= 468.1
        assert rect.height <= 648.1
        assert rect.x0 >= 0
        assert rect.y0 >= 0
        assert rect.x1 <= 612
        assert rect.y1 <= 792

    def test_fails_loudly_on_missing_image(self, tmp_path):
        pytest.importorskip("reportlab")
        out = tmp_path / "broken.pdf"
        result = run(
            "create-pdf.py",
            "--content",
            "![Chart](does-not-exist.svg)",
            "--output",
            str(out),
        )
        assert result.returncode != 0
        assert "Image not found" in result.stderr
        assert not out.exists()


class TestRecipes:
    def test_converts_svg_to_vector_pdf(self, tmp_path):
        fitz = pytest.importorskip("fitz")
        svg = tmp_path / "chart.svg"
        svg.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">'
            '<rect width="100" height="50" fill="red"/></svg>'
        )
        out = tmp_path / "chart.pdf"

        with fitz.open(svg) as source:
            out.write_bytes(source.convert_to_pdf())

        with fitz.open(out) as pdf:
            assert pdf.page_count == 1
            assert pdf[0].rect == fitz.Rect(0, 0, 100, 50)
            assert pdf[0].get_drawings()
            assert not pdf[0].get_images()

    def test_places_svg_as_vector_content_on_page(self, tmp_path):
        fitz = pytest.importorskip("fitz")
        svg = tmp_path / "chart.svg"
        svg.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">'
            '<rect width="100" height="50" fill="red"/></svg>'
        )
        out = tmp_path / "chart-page.pdf"

        with fitz.open(svg) as source:
            with fitz.open("pdf", source.convert_to_pdf()) as vector_pdf:
                with fitz.open() as document:
                    page = document.new_page(width=612, height=792)
                    page.show_pdf_page(
                        fitz.Rect(54, 72, 558, 387),
                        vector_pdf,
                        0,
                        keep_proportion=True,
                    )
                    document.save(str(out))

        with fitz.open(out) as pdf:
            assert pdf.page_count == 1
            assert pdf[0].rect == fitz.Rect(0, 0, 612, 792)
            assert pdf[0].get_drawings()
            assert not pdf[0].get_images()


class TestWatermark:
    def test_adds_an_image_watermark_and_preserves_metadata(self, tmp_path):
        pytest.importorskip("PIL")
        pytest.importorskip("pypdf")
        from PIL import Image
        from pypdf import PdfReader, PdfWriter

        image = tmp_path / "watermark.png"
        Image.new("RGBA", (32, 16), "red").save(image)
        source = tmp_path / "source.pdf"
        out = tmp_path / "watermarked.pdf"
        # cspell:disable
        xmp_metadata = b"""<?xpacket begin=\"\xef\xbb\xbf\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>
<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">
  <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">
    <rdf:Description xmlns:dc=\"http://purl.org/dc/elements/1.1/\" dc:title=\"Watermark source\" />
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end=\"w\"?>"""
        # cspell:enable
        writer = PdfWriter()
        writer.add_blank_page(width=144, height=144)
        writer.add_metadata({"/Title": "Watermark source", "/Author": "Instrument"})
        writer.xmp_metadata = xmp_metadata
        with source.open("wb") as file:
            writer.write(file)

        result = run(
            "watermark.py",
            str(source),
            str(out),
            "--image",
            str(image),
        )

        assert result.returncode == 0
        watermarked = PdfReader(str(out))
        resources = watermarked.pages[0]["/Resources"]
        assert "/XObject" in resources
        assert watermarked.metadata.title == "Watermark source"
        assert watermarked.metadata.author == "Instrument"
        assert watermarked.xmp_metadata is not None
        assert watermarked.xmp_metadata.stream.get_data() == xmp_metadata


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
