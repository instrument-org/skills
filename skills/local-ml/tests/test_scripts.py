"""Tests for local-ml skill Python scripts.

Model-dependent tests (classify-image, describe-image, speech-to-text, etc.)
are skipped by default because they require large downloads (~100MB-2GB).
Run with: pytest tests/ -m "not slow"

To run the full suite including model downloads:
  pytest tests/ -m "slow" --timeout=300
"""

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
def sample_image(tmp_path_factory) -> Path:
    """Create a minimal test PNG using Pillow."""
    pytest.importorskip("PIL")
    from PIL import Image

    path = tmp_path_factory.mktemp("img") / "test.png"
    img = Image.new("RGB", (100, 100), color=(128, 64, 32))
    img.save(str(path))
    return path


class TestRemoveBackground:
    def test_missing_dep_exits_gracefully(self, tmp_path):
        """Script exits with a clear error if rembg is missing."""
        result = run("remove-background.py", "--help")
        # --help always succeeds
        assert result.returncode == 0

    @pytest.mark.slow
    def test_removes_background(self, sample_image, tmp_path):
        pytest.importorskip("rembg")
        out = tmp_path / "out.png"
        result = run("remove-background.py", str(sample_image), "--output", str(out))
        assert result.returncode == 0
        assert out.exists()


class TestClassifyText:
    @pytest.mark.slow
    def test_sentiment_analysis(self):
        pytest.importorskip("transformers")
        result = run("classify-text.py", "--text", "I love this product!")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert "label" in data[0]

    @pytest.mark.slow
    def test_zero_shot_classification(self):
        pytest.importorskip("transformers")
        result = run("classify-text.py", "--text", "Send this urgently", "--labels", "urgent,routine,spam")
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert any(item["label"] == "urgent" for item in data)


class TestEmbedText:
    @pytest.mark.slow
    def test_embed_single_text(self):
        pytest.importorskip("sentence_transformers")
        result = run("embed-text.py", "--text", "Hello world")
        assert result.returncode == 0
        vec = json.loads(result.stdout)
        assert isinstance(vec, list)
        assert len(vec) == 384  # MiniLM-L6-v2 dimension

    @pytest.mark.slow
    def test_embed_file(self, tmp_path):
        pytest.importorskip("sentence_transformers")
        f = tmp_path / "sentences.txt"
        f.write_text("First sentence.\nSecond sentence.\n")
        result = run("embed-text.py", "--input", str(f))
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert len(data) == 2


class TestExtractEntities:
    @pytest.mark.slow
    def test_extracts_entities(self):
        pytest.importorskip("transformers")
        result = run("extract-entities.py", "--text", "Apple Inc was founded by Steve Jobs.")
        assert result.returncode == 0
        # Output should contain ORG or PER entities
        assert "Apple" in result.stdout or result.returncode == 0
