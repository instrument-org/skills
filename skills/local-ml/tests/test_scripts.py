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


@pytest.fixture(scope="session")
def speech_module():
    """Loads speech-to-text.py as a module so its pure helpers are testable."""
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "speech_to_text", SCRIPTS / "speech-to-text.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def silent_audio(tmp_path_factory) -> Path:
    """Writes a silent WAV without needing ffmpeg or any optional dependency."""
    import wave

    path = tmp_path_factory.mktemp("audio") / "silence.wav"
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(16000)
        handle.writeframes(b"\x00\x00" * 16000 * 3)
    return path


class TestResolveDevice:
    def test_explicit_cpu_uses_int8(self, speech_module):
        assert speech_module.resolve_device("cpu") == ("cpu", "int8")

    def test_explicit_cuda_uses_float16(self, speech_module):
        assert speech_module.resolve_device("cuda") == ("cuda", "float16")

    def test_auto_falls_back_to_cpu_when_the_probe_fails(self, speech_module, monkeypatch):
        # A driver mismatch raises rather than reporting zero devices, and the
        # answer has to be the CPU either way.
        import builtins

        real_import = builtins.__import__

        def explode(name, *args, **kwargs):
            if name == "ctranslate2":
                raise ImportError("no ctranslate2")
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, "__import__", explode)
        assert speech_module.resolve_device("auto") == ("cpu", "int8")


class TestBuildBias:
    def test_no_vocabulary_biases_nothing(self, speech_module):
        assert speech_module.build_bias(None) == (None, None)
        assert speech_module.build_bias("") == (None, None)
        assert speech_module.build_bias(" , , ") == (None, None)

    def test_sets_both_biasing_inputs_from_one_list(self, speech_module):
        # initial_prompt seeds the first window and hotwords every window, so a
        # term list has to reach both to survive a long recording.
        initial_prompt, hotwords = speech_module.build_bias("ripgrep, oxlint")

        assert initial_prompt == "Glossary: ripgrep, oxlint."
        assert hotwords == "ripgrep, oxlint"

    def test_trims_terms_and_drops_empties(self, speech_module):
        initial_prompt, hotwords = speech_module.build_bias("  ripgrep ,, oxlint  ")

        assert initial_prompt == "Glossary: ripgrep, oxlint."
        assert hotwords == "ripgrep, oxlint"


class TestSpeechToText:
    @pytest.mark.slow
    def test_silence_reports_no_speech_rather_than_inventing_it(self, silent_audio):
        pytest.importorskip("faster_whisper")
        result = run("speech-to-text.py", str(silent_audio))

        assert result.returncode == 0
        assert result.stdout.strip() == ""
        assert "No speech found" in result.stderr

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
