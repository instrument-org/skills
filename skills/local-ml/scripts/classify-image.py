#!/usr/bin/env python3
"""Classify an image using a zero-shot or ImageNet model.

First run downloads the model (~90-400 MB depending on model).
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Classify an image")
    parser.add_argument("input", help="Input image file")
    parser.add_argument("--labels", help="Comma-separated labels for zero-shot classification")
    parser.add_argument("--model", help="HuggingFace model ID override")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    try:
        from transformers import pipeline
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch Pillow")

    if args.labels:
        labels = [l.strip() for l in args.labels.split(",")]
        model = args.model or "openai/clip-vit-base-patch32"
        pipe = pipeline("zero-shot-image-classification", model=model)
        results = pipe(args.input, candidate_labels=labels)
    else:
        model = args.model or "google/vit-base-patch16-224"
        pipe = pipeline("image-classification", model=model, top_k=args.top_k)
        results = pipe(args.input)

    print(json.dumps(results[:args.top_k], indent=2))


if __name__ == "__main__":
    main()
