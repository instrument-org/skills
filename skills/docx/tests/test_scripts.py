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
        assert "@extend-ai/react-docx@0.15.0" in page


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

    def test_fails_on_a_page_whose_text_runs_past_its_bottom_margin(self, tmp_path):
        pymupdf = pytest.importorskip("pymupdf")
        pdf = tmp_path / "overflow.pdf"
        message = "FAIL overflow: page 2: body text runs 0.98 in past the bottom margin, and Word moves it to the next page"
        with pymupdf.open() as doc:
            doc.new_page(width=612, height=792)
            doc.new_page(width=612, height=792).insert_text((8, 780), message, fontsize=8)
            doc.save(str(pdf))
        result = run("render-pages.py", str(pdf), "--output", str(tmp_path / "pages"))
        assert result.returncode == 1
        assert sorted(p.name for p in (tmp_path / "pages").iterdir()) == ["page-001.png", "page-002.png"]
        assert result.stdout.splitlines()[-1].startswith(message + " -> ")


def load_script(name: str):
    import importlib.util

    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(SCRIPTS))
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def contract_docx(tmp_path) -> Path:
    pytest.importorskip("docx")
    from docx import Document

    path = tmp_path / "contract.docx"
    doc = Document()
    p = doc.add_paragraph()
    p.add_run("Payment is due within ")
    p.add_run("thirty (30)").bold = True
    p.add_run(" days, Net 30.")
    doc.add_paragraph("The term is one year.")
    doc.add_paragraph("Fees are capped at 1,000 USD in total.")
    doc.add_paragraph("Governing law is Delaware.")
    doc.save(str(path))
    return path


class TestRedline:
    def test_accepted_and_rejected_views_read_right_after_reopening(self, contract_docx, tmp_path):
        from docx import Document

        redline = load_script("redline")
        doc = Document(str(contract_docx))
        rl = redline.Redline(doc, author="Reviewer")
        paragraphs = doc.paragraphs
        assert rl.replace(paragraphs[0], "thirty (30) days", "forty-five (45) days") == 1
        assert rl.replace(paragraphs[0], "Net 30.", "Net 30, in USD.") == 1
        rl.delete_paragraph(paragraphs[1])
        assert rl.replace(paragraphs[2], " in total", "") == 1
        rl.insert_paragraph_after(paragraphs[3], "Disputes go to arbitration.")
        out = tmp_path / "redlined.docx"
        doc.save(str(out))

        reopened = Document(str(out))
        assert redline.view_text(reopened, "accept") == (
            "Payment is due within forty-five (45) days, Net 30, in USD.\n"
            "Fees are capped at 1,000 USD.\n"
            "Governing law is Delaware.\n"
            "Disputes go to arbitration."
        )
        assert redline.view_text(reopened, "reject") == (
            "Payment is due within thirty (30) days, Net 30.\n"
            "The term is one year.\n"
            "Fees are capped at 1,000 USD in total.\n"
            "Governing law is Delaware."
        )

    def test_marks_only_the_changed_words_with_revision_markup_word_reads(self, contract_docx, tmp_path):
        from docx import Document
        from docx.oxml.ns import qn

        redline = load_script("redline")
        doc = Document(str(contract_docx))
        rl = redline.Redline(doc, author="Reviewer")
        rl.replace(doc.paragraphs[2], "1,000 USD", "5,000 USD")
        rl.delete_paragraph(doc.paragraphs[1])
        body = doc.element.body
        deleted = [t.text for d in body.iter(qn("w:del")) for t in d.iter(qn("w:delText"))]
        inserted = [t.text for i in body.iter(qn("w:ins")) for t in i.iter(qn("w:t"))]
        assert deleted == ["The term is one year.", "1,000"]
        assert inserted == ["5,000"]
        assert not [t for d in body.iter(qn("w:del")) for t in d.iter(qn("w:t"))]
        revisions = [el for el in body.iter() if el.tag in redline.REVISION_TAGS]
        assert all(el.get(qn("w:author")) == "Reviewer" and el.get(qn("w:date")) for el in revisions)
        assert len({el.get(qn("w:id")) for el in revisions}) == len(revisions)
        mark = doc.paragraphs[1]._p.pPr.find(qn("w:rPr"))
        assert mark[0].tag == qn("w:del")

    def test_cli_saves_nothing_when_an_edit_matches_nothing(self, contract_docx, tmp_path):
        edits = tmp_path / "edits.json"
        edits.write_text(json.dumps([{"find": "one year", "replace": "two years"}, {"find": "no such clause", "replace": "x"}]))
        out = tmp_path / "out.docx"
        result = run("redline.py", str(contract_docx), "--author", "Reviewer", "--edits", str(edits), "--output", str(out))
        assert result.returncode == 1
        assert 'FAIL edit 2: no match for {"find": "no such clause", "replace": "x"}' in result.stdout
        assert not out.exists()

    def test_comment_anchors_to_exactly_the_isolated_phrase(self, contract_docx, tmp_path):
        from docx import Document
        from docx.oxml.ns import qn

        redline = load_script("redline")
        doc = Document(str(contract_docx))
        runs = redline.Redline(doc, author="Reviewer").isolate(doc.paragraphs[2], "1,000 USD")
        doc.add_comment(runs, text="This cap is too low.", author="Reviewer", initials="RV")
        out = tmp_path / "commented.docx"
        doc.save(str(out))

        reopened = Document(str(out))
        (comment,) = list(reopened.comments)
        assert (comment.author, comment.initials, comment.text) == ("Reviewer", "RV", "This cap is too low.")
        p = reopened.paragraphs[2]._p
        start = p.find(qn("w:commentRangeStart"))
        end = p.find(qn("w:commentRangeEnd"))
        inside = p[p.index(start) + 1 : p.index(end)]
        assert "".join(t.text for r in inside for t in r.iter(qn("w:t"))) == "1,000 USD"
        assert reopened.paragraphs[2].text == "Fees are capped at 1,000 USD in total."


class TestValidate:
    def test_passes_a_new_redlined_and_commented_document(self, contract_docx, tmp_path):
        from docx import Document

        redline = load_script("redline")
        doc = Document(str(contract_docx))
        rl = redline.Redline(doc, author="Reviewer")
        rl.replace(doc.paragraphs[0], "thirty (30)", "sixty (60)")
        rl.delete_paragraph(doc.paragraphs[1])
        rl.insert_paragraph_after(doc.paragraphs[3], "New clause.")
        doc.add_comment(rl.isolate(doc.paragraphs[2], "Fees"), text="Why?", author="Reviewer", initials="RV")
        out = tmp_path / "redlined.docx"
        doc.save(str(out))
        assert run("validate.py", str(contract_docx)).returncode == 0
        result = run("validate.py", str(out), "--original", str(contract_docx), "--author", "Reviewer")
        assert result.returncode == 0, result.stdout
        assert result.stdout.startswith("OK ")

    def test_flags_an_edit_made_without_tracking(self, contract_docx, tmp_path):
        from docx import Document

        redline = load_script("redline")
        doc = Document(str(contract_docx))
        redline.Redline(doc, author="Reviewer").replace(doc.paragraphs[0], "thirty (30)", "sixty (60)")
        doc.paragraphs[3].runs[0].text = "Governing law is New York."
        out = tmp_path / "sneaky.docx"
        doc.save(str(out))
        result = run("validate.py", str(out), "--original", str(contract_docx), "--author", "Reviewer")
        assert result.returncode == 1
        assert result.stdout.splitlines() == [
            "FAIL word/document.xml: text differs from the original once this edit's tracked changes are rejected:",
            "  -Governing law is Delaware.",
            "  +Governing law is New York.",
        ]

    def test_flags_bad_markup_but_not_errors_the_original_already_had(self, contract_docx, tmp_path):
        import zipfile

        def rewrite(src, dst, change):
            with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename == "word/document.xml":
                        data = change(data.decode()).encode()
                    zout.writestr(item, data)

        original = tmp_path / "original.docx"
        rewrite(contract_docx, original, lambda x: x.replace("<w:body>", "<w:body><w:bogus/>", 1))
        edited = tmp_path / "edited.docx"
        rewrite(
            original,
            edited,
            lambda x: x.replace(
                "<w:r><w:t>The term is one year.</w:t></w:r>",
                '<w:del w:id="9" w:author="A" w:date="2026-01-01T00:00:00Z"><w:r><w:t>The term is one year.</w:t></w:r></w:del>',
            ),
        )
        alone = run("validate.py", str(original))
        assert alone.returncode == 1 and "bogus" in alone.stdout
        result = run("validate.py", str(edited), "--original", str(original))
        assert result.returncode == 1
        assert "bogus" not in result.stdout
        assert "<w:t> inside <w:del>; deleted text must be <w:delText>: 'The term is one year.'" in result.stdout
