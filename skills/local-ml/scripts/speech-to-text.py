#!/usr/bin/env python3
"""Transcribe audio to text using Whisper.

Accepts WAV, MP3, M4A, FLAC, OGG, and most other audio formats, and reads the
audio stream straight out of a video container. Mono 16 kHz is what the model
works in, so converting first with ffmpeg avoids a resample.

Runs on the CPU unless an NVIDIA GPU is present, at minutes of compute per hour
of audio. Pass --output for anything long so an interrupted run keeps the part
it finished.

Pass --vocabulary with the names and jargon the recording uses. Whisper spells
unfamiliar proper nouns phonetically, and biasing the decoder is far more
reliable than repairing the transcript afterward.

First run downloads the selected model (~140 MB for 'base').
"""

import argparse
import json
import shutil
import sys

# Voice activity detection, so silence never reaches the decoder. Whisper
# invents text over digital silence and charges full price for the audio it
# does not need to read.
VAD_DEFAULT = True


def resolve_device(requested):
    """Picks the compute device and the precision that suits it.

    CTranslate2 accelerates only on NVIDIA GPUs, so 'auto' means CUDA where a
    card is present and CPU everywhere else, including Apple silicon.
    """
    if requested != "auto":
        return requested, "float16" if requested == "cuda" else "int8"
    try:
        import ctranslate2

        if ctranslate2.get_cuda_device_count() > 0:
            return "cuda", "float16"
    except Exception:
        # A CUDA probe can fail on a driver mismatch as easily as on absence.
        # Either way the answer is the CPU.
        pass
    return "cpu", "int8"


def build_bias(vocabulary):
    """Turns a term list into the two biasing arguments Whisper needs.

    They are not interchangeable and neither alone is enough. `initial_prompt`
    seeds only the first window, and is dropped entirely once
    condition_on_previous_text is off. `hotwords` is re-injected into every
    window but carries less weight in some models. Setting both is what keeps
    a term spelled correctly from the first minute to the last.
    """
    if not vocabulary:
        return None, None
    terms = ", ".join(t.strip() for t in vocabulary.split(",") if t.strip())
    if not terms:
        return None, None
    return f"Glossary: {terms}.", terms


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio to text")
    parser.add_argument("input", help="Audio file")
    parser.add_argument("--model", default="base",
                        choices=["tiny", "base", "small", "medium", "large",
                                 "large-v3", "turbo"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--language", help="Language code, e.g. 'en', 'fr'")
    parser.add_argument("--vocabulary",
                        help="Comma-separated names, products, and jargon the "
                             "recording uses, to bias spelling")
    parser.add_argument("--device", default="auto",
                        choices=["auto", "cpu", "cuda"],
                        help="Compute device (default: auto)")
    parser.add_argument("--no-vad", action="store_true",
                        help="Disable voice activity detection, which is on by "
                             "default and skips silence")
    parser.add_argument("--json", action="store_true", dest="as_json",
                        help="Output full JSON with timestamps")
    parser.add_argument("--output",
                        help="Write segments to this file as they are "
                             "transcribed, so a stopped run keeps its work")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        transcribe_with_openai_whisper(args)
        return

    device, compute_type = resolve_device(args.device)
    initial_prompt, hotwords = build_bias(args.vocabulary)

    model = WhisperModel(args.model, device=device, compute_type=compute_type)
    segments, info = model.transcribe(
        args.input,
        language=args.language,
        vad_filter=not args.no_vad and VAD_DEFAULT,
        # Off, so a passage the decoder starts repeating is not fed back as the
        # prompt that keeps it repeating. A loop costs several times what the
        # same audio costs otherwise, which is what turns a long recording into
        # a run that does not finish.
        condition_on_previous_text=False,
        initial_prompt=initial_prompt,
        hotwords=hotwords,
    )

    # Consuming this generator is what runs the transcription, so each segment
    # is flushed as it arrives rather than collected and written at the end.
    result_segments = []
    with open_output(args.output) as output:
        for segment in segments:
            result_segments.append(segment)
            if output:
                output.write(segment.text.strip() + "\n")
                output.flush()

    text = "".join(segment.text for segment in result_segments).strip()

    if not result_segments:
        print(
            "No speech found. Confirm the file carries an audio stream, and "
            "retry with --no-vad if the recording is very quiet.",
            file=sys.stderr,
        )

    if args.as_json:
        print(json.dumps({
            "text": text,
            "language": info.language,
            "segments": [
                {"end": segment.end, "start": segment.start, "text": segment.text}
                for segment in result_segments
            ],
        }, indent=2))
    else:
        print(text)


class _NoOutput:
    """Stands in for the output file when --output was not passed."""

    def __enter__(self):
        return None

    def __exit__(self, *exc_info):
        return False


def open_output(path):
    if not path:
        return _NoOutput()
    return open(path, "w", encoding="utf-8")


def transcribe_with_openai_whisper(args):
    try:
        import whisper
    except ImportError:
        sys.exit(
            "faster-whisper is not installed. Run: pip install faster-whisper"
        )

    if not shutil.which("ffmpeg"):
        sys.exit(
            "ffmpeg is required by the Windows on ARM OpenAI Whisper fallback. "
            "Provide ffmpeg before using speech-to-text."
        )

    initial_prompt, _ = build_bias(args.vocabulary)

    model = whisper.load_model(args.model)
    result = model.transcribe(
        args.input,
        language=args.language,
        condition_on_previous_text=False,
        initial_prompt=initial_prompt,
    )

    if args.as_json:
        print(json.dumps({
            "text": result["text"],
            "language": result.get("language"),
            "segments": result.get("segments", []),
        }, indent=2))
    else:
        print(result["text"])


if __name__ == "__main__":
    main()
