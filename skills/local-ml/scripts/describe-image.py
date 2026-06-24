#!/usr/bin/env python3
"""Generate a natural-language description of an image (image captioning)."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Describe an image")
    parser.add_argument("input", help="Input image file")
    parser.add_argument("--model", default="Salesforce/blip-image-captioning-base")
    args = parser.parse_args()

    try:
        from transformers import pipeline
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch Pillow")

    pipe = pipeline("image-to-text", model=args.model)
    results = pipe(args.input)
    for r in results:
        print(r.get("generated_text", ""))


if __name__ == "__main__":
    main()
