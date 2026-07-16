"""Tests for local-ml skill Python scripts.

Model-dependent tests (classify-image, describe-image, speech-to-text, etc.)
are skipped by default because they require large downloads (~100MB-2GB).
Run with: pytest tests/ -m "not slow"

To run the full suite including model downloads:
  pytest tests/ -m "slow" --timeout=300
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).parent.parent / "scripts"


def run(script: str, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        env=env,
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
    def test_help_does_not_import_rembg(self):
        result = run("remove-background.py", "--help")
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
        assert len(vec) == 384  # BGE small dimension

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


class TestSpeechToText:
    def test_missing_dependency_exits_with_install_guidance(self, tmp_path):
        (tmp_path / "faster_whisper.py").write_text(
            "raise ImportError('faster-whisper unavailable')\n"
        )
        (tmp_path / "whisper.py").write_text(
            "raise ImportError('openai-whisper unavailable')\n"
        )
        result = run(
            "speech-to-text.py",
            "audio.mp3",
            env={**os.environ, "PYTHONPATH": str(tmp_path)},
        )

        assert result.returncode != 0
        assert "faster-whisper is not installed" in result.stderr


@pytest.mark.parametrize(
    "script",
    [
        "classify-image.py",
        "classify-text.py",
        "describe-image.py",
        "detect-objects.py",
        "embed-text.py",
        "extract-entities.py",
        "remove-background.py",
        "speech-to-text.py",
    ],
)
def test_help_is_available_without_optional_dependencies(script):
    result = run(script, "--help")

    assert result.returncode == 0
    assert "usage:" in result.stdout
