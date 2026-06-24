"""Tests for spreadsheet skill Python scripts."""

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
def sample_xlsx(tmp_path_factory) -> Path:
    pytest.importorskip("openpyxl")
    import openpyxl

    path = tmp_path_factory.mktemp("xlsx") / "sample.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data"
    ws.append(["Name", "Age", "Score"])
    ws.append(["Alice", 30, 95])
    ws.append(["Bob", 25, 82])
    ws.append(["Carol", 35, 91])
    wb.save(str(path))
    return path


@pytest.fixture(scope="session")
def sample_csv(tmp_path_factory) -> Path:
    path = tmp_path_factory.mktemp("csv") / "sample.csv"
    path.write_text("Name,Age,Score\nAlice,30,95\nBob,25,82\nCarol,35,91\n")
    return path


class TestRead:
    def test_reads_xlsx(self, sample_xlsx):
        result = run("read.py", str(sample_xlsx))
        assert result.returncode == 0
        assert "Alice" in result.stdout

    def test_reads_xlsx_json(self, sample_xlsx):
        result = run("read.py", str(sample_xlsx), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "Data" in data
        assert data["Data"][0] == ["Name", "Age", "Score"]

    def test_reads_csv(self, sample_csv):
        result = run("read.py", str(sample_csv))
        assert result.returncode == 0
        assert "Alice" in result.stdout


class TestCreate:
    def test_creates_from_json(self, tmp_path):
        pytest.importorskip("openpyxl")
        out = tmp_path / "output.xlsx"
        data = json.dumps([{"Name": "Alice", "Score": 95}, {"Name": "Bob", "Score": 82}])
        result = run("create.py", "--output", str(out), "--json", data)
        assert result.returncode == 0
        assert out.exists()
        import openpyxl
        wb = openpyxl.load_workbook(str(out))
        ws = wb.active
        assert ws.cell(1, 1).value == "Name"
        assert ws.cell(2, 1).value == "Alice"

    def test_creates_from_csv(self, sample_csv, tmp_path):
        pytest.importorskip("openpyxl")
        out = tmp_path / "from_csv.xlsx"
        result = run("create.py", "--output", str(out), "--input", str(sample_csv))
        assert result.returncode == 0
        assert out.exists()


class TestQuery:
    def test_filters_rows(self, sample_xlsx):
        pytest.importorskip("pandas")
        result = run("query.py", str(sample_xlsx), "--filter", "Age > 28")
        assert result.returncode == 0
        assert "Alice" in result.stdout
        assert "Carol" in result.stdout
        assert "Bob" not in result.stdout

    def test_describe(self, sample_xlsx):
        pytest.importorskip("pandas")
        result = run("query.py", str(sample_xlsx), "--describe")
        assert result.returncode == 0
        assert "Age" in result.stdout

    def test_json_output(self, sample_xlsx):
        pytest.importorskip("pandas")
        result = run("query.py", str(sample_xlsx), "--json")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert len(data) == 3


class TestConvert:
    def test_csv_to_xlsx(self, sample_csv, tmp_path):
        pytest.importorskip("pandas")
        out = tmp_path / "converted.xlsx"
        result = run("convert.py", str(sample_csv), "--output", str(out))
        assert result.returncode == 0
        assert out.exists()

    def test_xlsx_to_csv(self, sample_xlsx, tmp_path):
        pytest.importorskip("pandas")
        out = tmp_path / "exported.csv"
        result = run("convert.py", str(sample_xlsx), "--output", str(out))
        assert result.returncode == 0
        content = out.read_text()
        assert "Alice" in content
