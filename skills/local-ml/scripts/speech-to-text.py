#!/usr/bin/env python3
"""Transcribe audio to text using Whisper.

Accepts WAV, MP3, M4A, FLAC, OGG, and most other audio formats.
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
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        transcribe_with_openai_whisper(args)
        return

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(args.input, language=args.language)
    result_segments = list(segments)
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
