#!/usr/bin/env python3
"""Transcribe audio to text using OpenAI Whisper.

Accepts WAV, MP3, M4A, FLAC, OGG, and most other audio formats.
First run downloads the model (~140 MB for 'base').
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio to text")
    parser.add_argument("input", help="Audio file")
    parser.add_argument("--model", default="base",
                        choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--language", help="Language code, e.g. 'en', 'fr'")
    parser.add_argument("--json", action="store_true", dest="as_json",
                        help="Output full JSON with timestamps")
    args = parser.parse_args()

    try:
        import whisper
    except ImportError:
        sys.exit("openai-whisper not installed. Run: pip install openai-whisper")

    model = whisper.load_model(args.model)
    opts = {}
    if args.language:
        opts["language"] = args.language

    result = model.transcribe(args.input, **opts)

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
