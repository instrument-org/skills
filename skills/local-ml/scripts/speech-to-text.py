#!/usr/bin/env python3
"""Transcribe audio to text using Whisper.

Accepts WAV, MP3, M4A, FLAC, OGG, and most other audio formats, and reads the
audio stream straight out of a video container. Mono 16 kHz is what the model
works in, so converting first with ffmpeg avoids a resample.

Runs on the CPU, at minutes of compute per hour of audio. Pass --output for
anything long so an interrupted run keeps the part it finished.

First run downloads the selected model (~140 MB for 'base').
"""

import argparse
import json
import shutil
import sys


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio to text")
    parser.add_argument("input", help="Audio file")
    parser.add_argument("--model", default="base",
                        choices=["tiny", "base", "small", "medium", "large",
                                 "large-v3", "turbo"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--language", help="Language code, e.g. 'en', 'fr'")
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

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(args.input, language=args.language)

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

    model = whisper.load_model(args.model)
    result = model.transcribe(args.input, language=args.language)

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
