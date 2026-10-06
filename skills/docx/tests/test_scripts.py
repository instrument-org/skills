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


class TestLibraryRecipe:
    def test_creates_a_styled_document(self, tmp_path):
        from docx import Document
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.shared import Inches, Pt, RGBColor

        output = tmp_path / "quarterly-review.docx"
        doc = Document()
        section = doc.sections[0]
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        doc.styles["Normal"].font.name = "Aptos"
        doc.styles["Normal"].font.size = Pt(10.5)

        title = doc.add_heading("Quarterly Review", level=0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        table = doc.add_table(rows=1, cols=3)
        table.style = "Table Grid"
        for cell, label in zip(
            table.rows[0].cells,
            ["Metric", "Current", "Target"],
            strict=True,
        ):
            cell.text = label
            for run in cell.paragraphs[0].runs:
                run.bold = True
                run.font.color.rgb = RGBColor(31, 78, 121)
        cells = table.add_row().cells
        for cell, value in zip(cells, ["Retention", "94%", "92%"], strict=True):
            cell.text = value
        section.footer.paragraphs[0].text = "Confidential"
        doc.core_properties.title = "Quarterly Review"
        doc.save(output)

        check = Document(output)
        assert check.core_properties.title == "Quarterly Review"
        assert check.paragraphs[0].text == "Quarterly Review"
        assert check.paragraphs[0].alignment == WD_ALIGN_PARAGRAPH.CENTER
        assert check.styles["Normal"].font.name == "Aptos"
        assert check.tables[0].cell(1, 1).text == "94%"
        header_run = check.tables[0].cell(0, 0).paragraphs[0].runs[0]
        assert header_run.font.color.rgb == RGBColor(31, 78, 121)
        assert check.sections[0].footer.paragraphs[0].text == "Confidential"


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

    def test_escapes_xml_sensitive_values(self, template_docx, tmp_path):
        from docx import Document

        out = tmp_path / "escaped.docx"
        values = json.dumps(
            {
                "REPORT_TITLE": "R&D <Q4>",
                "CLIENT_NAME": "A > B",
                "DATE": "2024-01-01",
            }
        )

        result = run(
            "fill-template.py",
            str(template_docx),
            str(out),
            "--values",
            values,
        )

        assert result.returncode == 0
        text = "\n".join(paragraph.text for paragraph in Document(out).paragraphs)
        assert "R&D <Q4>" in text
        assert "A > B" in text

    def test_refuses_code_in_a_template(self, tmp_path):
        from docx import Document

        template = tmp_path / "hostile-template.docx"
        marker = tmp_path / "pwned"
        document = Document()
        document.add_paragraph(
            "{{ cycler.__init__.__globals__.os.popen('touch "
            + str(marker)
            + "').read() }}"
        )
        document.save(template)

        result = run(
            "fill-template.py",
            str(template),
            str(tmp_path / "out.docx"),
            "--values",
            "{}",
        )

        assert not marker.exists()
        assert result.returncode != 0

    def test_repeats_table_rows_without_blank_rows(self, tmp_path):
        from docx import Document

        template = tmp_path / "rows-template.docx"
        output = tmp_path / "rows-output.docx"
        document = Document()
        table = document.add_table(rows=4, cols=2)
        table.rows[0].cells[0].text = "Item"
        table.rows[0].cells[1].text = "Amount"
        table.rows[1].cells[0].text = "{%tr for item in items %}"
        table.rows[2].cells[0].text = "{{ item.name }}"
        table.rows[2].cells[1].text = "{{ item.amount }}"
        table.rows[3].cells[0].text = "{%tr endfor %}"
        document.save(template)

        result = run(
            "fill-template.py",
            str(template),
            str(output),
            "--values",
            json.dumps(
                {
                    "items": [
                        {"name": "Discovery", "amount": "$2,500"},
                        {"name": "Delivery", "amount": "$4,000"},
                    ]
                }
            ),
        )

        assert result.returncode == 0
        rows = [
            [cell.text for cell in row.cells]
            for row in Document(output).tables[0].rows
        ]
        assert rows == [
            ["Item", "Amount"],
            ["Discovery", "$2,500"],
            ["Delivery", "$4,000"],
        ]


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


class TestPreview:
    def test_writes_a_page_holding_the_document_at_its_page_size(self, tmp_path):
        pytest.importorskip("docx")
        from docx import Document

        source = tmp_path / "report.docx"
        doc = Document()
        doc.add_paragraph("Hello")
        doc.save(str(source))
        result = run("preview.py", str(source))
        assert result.returncode == 0, result.stderr
        out = tmp_path / "report.preview.html"
        # python-docx's default section is US Letter, 816 x 1056 px.
        assert json.loads(result.stdout) == {"preview": str(out), "pageSize": [816, 1056]}
        page = out.read_text()
        assert "@page { size: 816px 1056px; margin: 0; }" in page
        assert "@extend-ai/react-docx@0.8.4" in page


class TestRenderPages:
    def test_renders_each_printed_page(self, tmp_path):
        pymupdf = pytest.importorskip("pymupdf")
        pdf = tmp_path / "report.preview.pdf"
        with pymupdf.open() as doc:
            for _ in range(2):
                doc.new_page(width=612, height=792)
            doc.save(str(pdf))
        result = run("render-pages.py", str(pdf), "--output", str(tmp_path / "pages"))
        assert result.returncode == 0, result.stderr
        assert sorted(p.name for p in (tmp_path / "pages").iterdir()) == ["page-001.png", "page-002.png"]

    def test_refuses_a_preview_printed_before_its_pages_were_laid_out(self, tmp_path):
        pymupdf = pytest.importorskip("pymupdf")
        pdf = tmp_path / "early.pdf"
        with pymupdf.open() as doc:
            doc.new_page(width=612, height=792).insert_text((48, 80), "This preview was printed before its pages were laid out.")
            doc.save(str(pdf))
        result = run("render-pages.py", str(pdf), "--output", str(tmp_path / "pages"))
        assert result.returncode == 1
        assert "printed before its pages were laid out" in result.stderr
        assert not (tmp_path / "pages").exists()
