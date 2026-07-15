"""Tests for docx skill Python scripts."""

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
def sample_docx(tmp_path_factory) -> Path:
    pytest.importorskip("docx")
    from docx import Document

    path = tmp_path_factory.mktemp("docx") / "sample.docx"
    doc = Document()
    doc.add_heading("Test Document", level=1)
    doc.add_paragraph("This is the first paragraph.")
    doc.add_paragraph("This is the second paragraph.")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Name"
    table.cell(0, 1).text = "Value"
    table.cell(1, 0).text = "Alice"
    table.cell(1, 1).text = "42"
    doc.save(str(path))
    return path


@pytest.fixture(scope="session")
def template_docx(tmp_path_factory) -> Path:
    pytest.importorskip("docx")
    from docx import Document

    path = tmp_path_factory.mktemp("template") / "template.docx"
    doc = Document()
    doc.add_heading("{{REPORT_TITLE}}", level=1)
    doc.add_paragraph("Dear {{CLIENT_NAME}},")
    doc.add_paragraph("Date: {{DATE}}")
    doc.save(str(path))
    return path


class TestExtractText:
    def test_extracts_plain_text(self, sample_docx):
        result = run("extract-text.py", str(sample_docx))
        assert result.returncode == 0
        assert "Test Document" in result.stdout
        assert "first paragraph" in result.stdout

    def test_extracts_table_text(self, sample_docx):
        result = run("extract-text.py", str(sample_docx))
        assert "Alice" in result.stdout

    def test_json_output(self, sample_docx):
        result = run("extract-text.py", str(sample_docx), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "paragraphs" in data
        assert "tables" in data
        assert any(p["text"] == "Test Document" for p in data["paragraphs"])


class TestCreate:
    def test_creates_from_markdown(self, tmp_path):
        pytest.importorskip("docx")
        out = tmp_path / "output.docx"
        md = "# Title\n\nParagraph with **bold** and *italic* text.\n\n- Bullet one\n- Bullet two"
        result = run("create.py", "--content", md, "--output", str(out))
        assert result.returncode == 0
        assert out.exists()
        from docx import Document
        doc = Document(str(out))
        texts = [p.text for p in doc.paragraphs]
        assert "Title" in texts
        paragraph = next(p for p in doc.paragraphs if "Paragraph with" in p.text)
        assert any(run.bold for run in paragraph.runs if run.text == "bold")
        assert any(run.italic for run in paragraph.runs if run.text == "italic")

    def test_creates_from_file(self, tmp_path):
        pytest.importorskip("docx")
        md_file = tmp_path / "content.md"
        md_file.write_text("# Report\n\nBody text here.")
        out = tmp_path / "report.docx"
        result = run("create.py", "--input", str(md_file), "--output", str(out))
        assert result.returncode == 0
        assert out.exists()


class TestFillTemplate:
    def test_lists_placeholders(self, template_docx):
        result = run("fill-template.py", str(template_docx), "/dev/null", "--list-placeholders")
        assert result.returncode == 0
        assert "REPORT_TITLE" in result.stdout
        assert "CLIENT_NAME" in result.stdout

    def test_fills_values(self, template_docx, tmp_path):
        pytest.importorskip("docx")
        out = tmp_path / "filled.docx"
        values = json.dumps({"REPORT_TITLE": "Q4 Report", "CLIENT_NAME": "Acme", "DATE": "2024-01-01"})
        result = run("fill-template.py", str(template_docx), str(out), "--values", values)
        assert result.returncode == 0
        assert out.exists()
        from docx import Document
        doc = Document(str(out))
        text = "\n".join(p.text for p in doc.paragraphs)
        assert "Q4 Report" in text
        assert "Acme" in text
        assert "{{" not in text


class TestEdit:
    def test_appends_paragraph(self, sample_docx, tmp_path):
        pytest.importorskip("docx")
        out = tmp_path / "edited.docx"
        result = run("edit.py", str(sample_docx), "--append", "Appended text.", "--output", str(out))
        assert result.returncode == 0
        from docx import Document
        doc = Document(str(out))
        assert any(p.text == "Appended text." for p in doc.paragraphs)

    def test_find_replace(self, sample_docx, tmp_path):
        pytest.importorskip("docx")
        out = tmp_path / "replaced.docx"
        result = run("edit.py", str(sample_docx), "--find", "first", "--replace", "1st", "--output", str(out))
        assert result.returncode == 0
        from docx import Document
        doc = Document(str(out))
        text = "\n".join(p.text for p in doc.paragraphs)
        assert "1st" in text

    def test_find_replace_across_runs(self, tmp_path):
        from docx import Document

        source = tmp_path / "split-runs.docx"
        out = tmp_path / "replaced.docx"
        doc = Document()
        paragraph = doc.add_paragraph()
        paragraph.add_run("Draft ").bold = True
        paragraph.add_run("Version").italic = True
        doc.save(source)

        result = run(
            "edit.py",
            str(source),
            "--find",
            "Draft Version",
            "--replace",
            "Final Version",
            "--output",
            str(out),
        )

        assert result.returncode == 0
        replaced = Document(out).paragraphs[0]
        assert replaced.text == "Final Version"
        assert replaced.runs[0].bold

    def test_find_replace_requires_a_complete_pair(self, tmp_path):
        result = run("edit.py", str(tmp_path / "missing.docx"), "--find", "Draft")

        assert result.returncode == 2
        assert "must be supplied together" in result.stderr
