#!/usr/bin/env python3
"""Detect objects in an image and return bounding boxes with labels."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Detect objects in an image")
    parser.add_argument("input", help="Input image file")
    parser.add_argument("--model", default="facebook/detr-resnet-50")
    parser.add_argument("--threshold", type=float, default=0.9,
                        help="Confidence threshold (default: 0.9)")
    args = parser.parse_args()

    try:
        from transformers import pipeline
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch Pillow")

    pipe = pipeline("object-detection", model=args.model)
    results = pipe(args.input, threshold=args.threshold)
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
