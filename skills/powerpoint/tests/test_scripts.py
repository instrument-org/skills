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

    def test_rejects_unsupported_layout(self, tmp_path):
        out = tmp_path / "unsupported-layout.pptx"
        slides = json.dumps([{"layout": "two-col", "title": "Unsupported"}])

        result = run("create.py", "--content", slides, "--output", str(out))

        assert result.returncode != 0
        assert "Unsupported layout" in result.stderr


class TestLibraryRecipe:
    def test_composes_a_positioned_slide(self, tmp_path):
        from pptx import Presentation
        from pptx.dml.color import RGBColor
        from pptx.util import Inches, Pt

        output = tmp_path / "quarterly-review.pptx"
        prs = Presentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        background = slide.background.fill
        background.solid()
        background.fore_color.rgb = RGBColor(248, 249, 252)

        title = slide.shapes.add_textbox(
            Inches(0.8),
            Inches(0.65),
            Inches(11.8),
            Inches(0.7),
        )
        title.name = "Title"
        title.text_frame.clear()
        run = title.text_frame.paragraphs[0].add_run()
        run.text = "Quarterly Review"
        run.font.size = Pt(30)
        run.font.bold = True
        run.font.color.rgb = RGBColor(26, 31, 44)
        slide.notes_slide.notes_text_frame.text = "Discuss the pilot."
        prs.save(output)

        check = Presentation(output)
        checked_slide = check.slides[0]
        by_name = {shape.name: shape for shape in checked_slide.shapes}
        assert check.slide_width == Inches(13.333)
        assert check.slide_height == Inches(7.5)
        assert by_name["Title"].text == "Quarterly Review"
        assert by_name["Title"].left >= 0
        assert by_name["Title"].left + by_name["Title"].width <= check.slide_width
        assert checked_slide.notes_slide.notes_text_frame.text == "Discuss the pilot."


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

    def test_keeps_duplicate_shape_names_addressable(self, tmp_path):
        from pptx import Presentation
        from pptx.util import Inches

        source = tmp_path / "duplicate-shapes.pptx"
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        for index, text in enumerate(("First", "Second")):
            shape = slide.shapes.add_textbox(Inches(index), Inches(1), Inches(1), Inches(1))
            shape.name = "Duplicate shape"
            shape.text = text
        prs.save(source)

        result = run("inventory.py", str(source))

        assert result.returncode == 0
        shapes = json.loads(result.stdout)["slide-0"]
        duplicates = [
            (key, value)
            for key, value in shapes.items()
            if value["name"] == "Duplicate shape"
        ]
        assert [key for key, _ in duplicates] == ["shape-0", "shape-1"]
        assert [value["paragraphs"][0]["text"] for _, value in duplicates] == ["First", "Second"]


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

    def test_find_replace_across_runs(self, tmp_path):
        from pptx import Presentation

        source = tmp_path / "split-runs.pptx"
        out = tmp_path / "replaced.pptx"
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        text_frame = slide.shapes.add_textbox(0, 0, 100, 100).text_frame
        paragraph = text_frame.paragraphs[0]
        paragraph.add_run().text = "Draft "
        paragraph.add_run().text = "Version"
        prs.save(source)

        result = run(
            "replace.py",
            str(source),
            str(out),
            "--find",
            "Draft Version",
            "--replace",
            "Final Version",
        )

        assert result.returncode == 0
        assert "Replaced 1 occurrence" in result.stdout
        replaced = Presentation(out)
        assert replaced.slides[0].shapes[0].text == "Final Version"

    def test_find_replace_in_table_cells(self, tmp_path):
        from pptx import Presentation

        source = tmp_path / "table.pptx"
        out = tmp_path / "replaced.pptx"
        presentation = Presentation()
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        table = slide.shapes.add_table(1, 1, 0, 0, 100, 100).table
        table.cell(0, 0).text = "Draft table"
        presentation.save(source)

        result = run(
            "replace.py",
            str(source),
            str(out),
            "--find",
            "Draft",
            "--replace",
            "Final",
        )

        assert result.returncode == 0
        assert "Replaced 1 occurrence" in result.stdout
        replaced = Presentation(out)
        assert replaced.slides[0].shapes[0].table.cell(0, 0).text == "Final table"

    def test_inventory_replace_removes_omitted_paragraphs(self, sample_pptx, tmp_path):
        from pptx import Presentation

        inventory = json.loads(run("inventory.py", str(sample_pptx)).stdout)
        shape_key, _ = next(
            (key, value)
            for key, value in inventory["slide-1"].items()
            if any(paragraph["text"] == "Slide Two" for paragraph in value["paragraphs"])
        )
        replacements = {"slide-1": {shape_key: {"paragraphs": [{"text": "Updated", "level": 0}]}}}
        replacements_path = tmp_path / "replacements.json"
        replacements_path.write_text(json.dumps(replacements))
        out = tmp_path / "replaced-inventory.pptx"

        result = run("replace.py", str(sample_pptx), str(replacements_path), str(out))

        assert result.returncode == 0
        all_text = "\n".join(
            shape.text
            for shape in Presentation(out).slides[1].shapes
            if shape.has_text_frame
        )
        assert "Updated" in all_text
        assert "Slide Two" not in all_text


class TestPreview:
    def test_writes_a_page_holding_the_deck_at_its_slide_size(self, sample_pptx, tmp_path):
        out = tmp_path / "deck.preview.html"
        result = run("preview.py", str(sample_pptx), "--output", str(out))
        assert result.returncode == 0, result.stderr
        summary = json.loads(result.stdout)
        # python-pptx's default deck is 10 x 7.5 in, 960 x 720 px.
        assert summary == {"preview": str(out), "slides": 2, "slideSize": [960, 720]}
        page = out.read_text()
        assert "@page { size: 960px 720px; margin: 0; }" in page
        assert "@extend-ai/react-pptx@0.1.2" in page
        import base64

        assert base64.b64encode(sample_pptx.read_bytes()).decode() in page

    def test_writes_beside_the_deck_by_default(self, sample_pptx, tmp_path):
        deck = tmp_path / "pitch.pptx"
        deck.write_bytes(sample_pptx.read_bytes())
        assert run("preview.py", str(deck)).returncode == 0
        assert (tmp_path / "pitch.preview.html").exists()


class TestThumbnailFromPrintedPdf:
    def test_grids_a_printed_preview_without_libreoffice(self, tmp_path):
        fitz = pytest.importorskip("fitz")
        pytest.importorskip("PIL")
        pdf = tmp_path / "deck.preview.pdf"
        with fitz.open() as doc:
            for _ in range(3):
                doc.new_page(width=960, height=540)
            doc.save(str(pdf))
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "thumbnail.py"), str(pdf), "thumbs", "--width", "200"],
            capture_output=True,
            text=True,
            cwd=tmp_path,
            env={"PATH": ""},
        )
        assert result.returncode == 0, result.stderr
        assert "Found 3 slide(s)" in result.stdout
        assert (tmp_path / "thumbs.jpg").exists()

    def test_refuses_a_preview_printed_before_its_slides_were_drawn(self, tmp_path):
        fitz = pytest.importorskip("fitz")
        pdf = tmp_path / "early.pdf"
        with fitz.open() as doc:
            page = doc.new_page(width=960, height=540)
            page.insert_text((48, 80), "This preview was printed before its slides were drawn.")
            doc.save(str(pdf))
        result = run("thumbnail.py", str(pdf), str(tmp_path / "thumbs"))
        assert result.returncode == 1
        assert "printed before its slides were drawn" in result.stderr
        assert not (tmp_path / "thumbs.jpg").exists()


def build_template(path: Path, image: Path) -> Path:
    """Four slides: a title linking to slide 4, a picture with notes, a chart, and a plain slide."""
    from PIL import Image
    from pptx import Presentation
    from pptx.chart.data import ChartData
    from pptx.enum.chart import XL_CHART_TYPE
    from pptx.util import Inches

    Image.new("RGB", (40, 20), "red").save(image)
    prs = Presentation()
    for number in range(1, 5):
        prs.slides.add_slide(prs.slide_layouts[5]).shapes.title.text = f"Slide {number}"
    first, second, third, fourth = prs.slides
    first.shapes.title.click_action.target_slide = fourth
    second.shapes.add_picture(str(image), Inches(1), Inches(2))
    second.notes_slide.notes_text_frame.text = "Notes for the picture"
    data = ChartData()
    data.categories = ["Q1", "Q2"]
    data.add_series("Revenue", (1, 2))
    third.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(1), Inches(2), Inches(4), Inches(3), data)
    prs.save(path)
    return path


def package_parts(path: Path) -> dict:
    import zipfile

    with zipfile.ZipFile(path) as archive:
        return {name: archive.read(name) for name in archive.namelist()}


def rewrite_part(source: Path, target: Path, name: str, change):
    import zipfile

    parts = package_parts(source)
    parts[name] = change(parts[name].decode()).encode()
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for part, data in parts.items():
            archive.writestr(part, data)
    return target


class TestSlides:
    def test_duplicates_deletes_and_reorders(self, tmp_path):
        from pptx import Presentation

        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        out = tmp_path / "deck.pptx"
        result = run("slides.py", str(source), str(out), "--order", "2,1,2,3,3")
        assert result.returncode == 0, result.stderr
        assert "5 slide(s), 2 duplicated, 1 deleted" in result.stdout

        deck = Presentation(out)
        assert [s.shapes.title.text for s in deck.slides] == ["Slide 2", "Slide 1", "Slide 2", "Slide 3", "Slide 3"]
        original, copy = deck.slides[0], deck.slides[2]
        assert [s.shape_type for s in copy.shapes] == [s.shape_type for s in original.shapes]
        assert copy.notes_slide.notes_text_frame.text == "Notes for the picture"
        assert copy.notes_slide.part is not original.notes_slide.part
        from pptx.opc.constants import RELATIONSHIP_TYPE as RT

        assert copy.notes_slide.part.part_related_by(RT.SLIDE) is copy.part
        copy.notes_slide.notes_text_frame.text = "Changed"
        assert original.notes_slide.notes_text_frame.text == "Notes for the picture"
        charts = [next(s for s in slide.shapes if s.has_chart).chart.part for slide in list(deck.slides)[3:]]
        assert charts[0] is not charts[1]
        # The link on slide 1 pointed at the deleted slide 4.
        assert deck.slides[1].shapes.title.click_action.target_slide is None

        parts = package_parts(out)
        assert len([n for n in parts if n.startswith("ppt/media/")]) == 1
        assert len([n for n in parts if n.startswith("ppt/notesSlides/notesSlide")]) == 2
        assert len([n for n in parts if n.startswith("ppt/embeddings/")]) == 2
        assert b"<Slides>5</Slides>" in parts["docProps/app.xml"]

        checked = run("validate.py", str(out), "--json")
        assert checked.returncode == 0, checked.stdout
        assert json.loads(checked.stdout)["status"] == "valid"

    def test_prunes_layouts_no_slide_uses(self, tmp_path):
        from pptx import Presentation

        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        out = tmp_path / "pruned.pptx"
        result = run("slides.py", str(source), str(out), "--order", "3,1", "--prune-layouts")
        assert result.returncode == 0, result.stderr
        deck = Presentation(out)
        assert [layout.name for layout in deck.slide_layouts] == ["Title Only"]
        assert not [n for n in package_parts(out) if n.startswith("ppt/slideLayouts/slideLayout1")]
        assert run("validate.py", str(out)).returncode == 0

    def test_sections_follow_their_slides(self, tmp_path):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        sections = (
            '<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}">'
            '<p14:sectionLst xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main">'
            '<p14:section name="Intro" id="{11111111-1111-1111-1111-111111111111}"><p14:sldIdLst><p14:sldId id="256"/><p14:sldId id="257"/></p14:sldIdLst></p14:section>'
            '<p14:section name="Data" id="{22222222-2222-2222-2222-222222222222}"><p14:sldIdLst><p14:sldId id="258"/><p14:sldId id="259"/></p14:sldIdLst></p14:section>'
            "</p14:sectionLst></p:ext></p:extLst></p:presentation>"
        )
        sectioned = rewrite_part(source, tmp_path / "sectioned.pptx", "ppt/presentation.xml",
                                 lambda xml: xml.replace("</p:presentation>", sections))
        out = tmp_path / "deck.pptx"
        assert run("slides.py", str(sectioned), str(out), "--order", "3,1,3").returncode == 0

        from lxml import etree

        root = etree.fromstring(package_parts(out)["ppt/presentation.xml"])
        ns = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
              "p14": "http://schemas.microsoft.com/office/powerpoint/2010/main"}
        order = root.xpath("p:sldIdLst/p:sldId/@id", namespaces=ns)
        found = [(s.get("name"), s.xpath("p14:sldIdLst/p14:sldId/@id", namespaces=ns))
                 for s in root.xpath("//p14:section", namespaces=ns)]
        assert found == [("Data", [order[0]]), ("Intro", [order[1]]), ("Data", [order[2]])]
        ids = root.xpath("//p14:section/@id", namespaces=ns)
        assert len(set(ids)) == 3

    @pytest.mark.parametrize("order, message", [("1,9", "names 9"), ("x", "slide numbers"), ("", "at least one")])
    def test_refuses_a_bad_order(self, tmp_path, order, message):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        result = run("slides.py", str(source), str(tmp_path / "out.pptx"), "--order", order)
        assert result.returncode != 0
        assert message in result.stderr

    def test_refuses_to_overwrite_its_input(self, tmp_path):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        result = run("slides.py", str(source), str(source), "--order", "1")
        assert result.returncode != 0
        assert "must not replace the input" in result.stderr


class TestValidate:
    def test_passes_a_python_pptx_deck(self, tmp_path):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        result = run("validate.py", str(source))
        assert result.returncode == 0, result.stdout

    @pytest.mark.parametrize(
        "part, change, expected",
        [
            ("[Content_Types].xml",
             lambda xml: xml.replace('<Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>', ""),
             "ppt/slides/slide2.xml: <sld> part needs an <Override"),
            ("ppt/slides/_rels/slide2.xml.rels", lambda xml: xml.replace("../media/image1.png", "../media/missing.png"),
             "points at ../media/missing.png"),
            ("ppt/slides/slide2.xml", lambda xml: xml.replace('r:embed="rId', 'r:embed="rIdX', 1),
             "names relationship rIdX"),
            ("ppt/presentation.xml", lambda xml: xml.replace('id="257"', 'id="256"'), "slide id 256 is used twice"),
            ("ppt/slides/slide2.xml", lambda xml: xml.replace("<p:cSld>", "<p:cSld><p:bogus/>"), "Schema: ppt/slides/slide2.xml"),
            ("ppt/slides/slide2.xml", lambda xml: xml.replace("</p:sld>", ""), "XML: ppt/slides/slide2.xml"),
        ],
    )
    def test_reports_package_faults(self, tmp_path, part, change, expected):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        broken = rewrite_part(source, tmp_path / "broken.pptx", part, change)
        result = run("validate.py", str(broken))
        assert result.returncode == 1
        assert expected in result.stdout

    def test_original_hides_the_templates_own_schema_errors(self, tmp_path):
        source = build_template(tmp_path / "template.pptx", tmp_path / "red.png")
        template = rewrite_part(source, tmp_path / "flawed.pptx", "ppt/slides/slide2.xml",
                                lambda xml: xml.replace("<p:cSld>", "<p:cSld><p:bogus/>"))
        out = tmp_path / "deck.pptx"
        assert run("slides.py", str(template), str(out), "--order", "1,2,2").returncode == 0

        assert run("validate.py", str(out)).returncode == 1
        result = run("validate.py", str(out), "--original", str(template))
        assert result.returncode == 0, result.stdout

        worse = rewrite_part(out, tmp_path / "worse.pptx", "ppt/slides/slide1.xml",
                             lambda xml: xml.replace("<p:cSld>", "<p:cSld><p:other/>"))
        result = run("validate.py", str(worse), "--original", str(template))
        assert result.returncode == 1
        assert "other" in result.stdout


FAKE_SOFFICE = """#!{python}
import json, pathlib, shutil, sys, zipfile
args = sys.argv[1:]
outdir = pathlib.Path(args[args.index("--outdir") + 1])
deck = pathlib.Path(args[-1])
with zipfile.ZipFile(deck) as package:
    rels = {{n: package.read(n).decode() for n in package.namelist() if n.endswith(".rels")}}
pathlib.Path({log!r}).write_text(json.dumps({{"args": args, "rels": rels}}))
outdir.mkdir(parents=True, exist_ok=True)
shutil.copy({pdf!r}, outdir / (deck.stem + ".pdf"))
"""


class TestSoffice:
    @pytest.fixture
    def fake_soffice(self, tmp_path):
        fitz = pytest.importorskip("fitz")
        pdf = tmp_path / "rendered.pdf"
        with fitz.open() as doc:
            for _ in range(2):
                doc.new_page(width=960, height=540)
            doc.save(str(pdf))
        bin_dir = tmp_path / "bin"
        bin_dir.mkdir()
        log = tmp_path / "soffice-call.json"
        script = bin_dir / "soffice"
        script.write_text(FAKE_SOFFICE.format(python=sys.executable, log=str(log), pdf=str(pdf)))
        script.chmod(0o755)
        return bin_dir, log

    def linked_deck(self, tmp_path) -> Path:
        from pptx import Presentation

        deck = tmp_path / "linked.pptx"
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        box = slide.shapes.add_textbox(0, 0, 100, 100)
        box.text = "Links"
        box.text_frame.paragraphs[0].runs[0].hyperlink.address = "https://example.com/"
        slide.part.relate_to("file:///etc/passwd", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", is_external=True)
        slide.part.relate_to("https://example.com/tracker.png", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", is_external=True)
        prs.save(deck)
        return deck

    def test_renders_a_copy_with_outside_links_blanked_and_a_fresh_profile(self, tmp_path, fake_soffice):
        import os

        bin_dir, log = fake_soffice
        deck = self.linked_deck(tmp_path)
        before = deck.read_bytes()
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "thumbnail.py"), str(deck), "thumbs"],
            capture_output=True, text=True, cwd=tmp_path,
            env={**os.environ, "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}"},
        )
        assert result.returncode == 0, result.stderr
        assert "Found 2 slide(s)" in result.stdout
        assert deck.read_bytes() == before

        call = json.loads(log.read_text())
        assert call["args"][0].startswith("-env:UserInstallation=file://")
        assert Path(call["args"][-1]).parent != deck.parent
        slide_rels = call["rels"]["ppt/slides/_rels/slide1.xml.rels"]
        assert "file:///etc/passwd" not in slide_rels
        assert "tracker.png" not in slide_rels
        assert 'Target="https://example.com/"' in slide_rels

    def test_converts_with_the_cli(self, tmp_path, fake_soffice):
        import os

        bin_dir, _ = fake_soffice
        deck = self.linked_deck(tmp_path)
        out = tmp_path / "pdf"
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "soffice.py"), str(deck), "--outdir", str(out)],
            capture_output=True, text=True,
            env={**os.environ, "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}"},
        )
        assert result.returncode == 0, result.stderr
        assert (out / "linked.pdf").exists()

    def test_says_so_when_libreoffice_is_missing(self, tmp_path):
        deck = self.linked_deck(tmp_path)
        result = subprocess.run([sys.executable, str(SCRIPTS / "soffice.py"), str(deck)],
                                capture_output=True, text=True, env={"PATH": ""})
        assert result.returncode != 0
        assert "not installed" in result.stderr
