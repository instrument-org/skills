#!/usr/bin/env python3
"""Classify text using sentiment analysis or zero-shot labels."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Classify text")
    parser.add_argument("--text", required=True, help="Text to classify")
    parser.add_argument("--labels", help="Comma-separated labels for zero-shot classification")
    parser.add_argument("--multi-label", action="store_true")
    parser.add_argument("--model", help="HuggingFace model ID override")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    try:
        from transformers import pipeline
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch")

    if args.labels:
        labels = [l.strip() for l in args.labels.split(",")]
        model = args.model or "facebook/bart-large-mnli"
        pipe = pipeline("zero-shot-classification", model=model)
        result = pipe(args.text, candidate_labels=labels, multi_label=args.multi_label)
        output = [{"label": l, "score": s}
                  for l, s in zip(result["labels"], result["scores"])]
    else:
        model = args.model or "distilbert-base-uncased-finetuned-sst-2-english"
        pipe = pipeline("sentiment-analysis", model=model, top_k=args.top_k)
        output = pipe(args.text)[0]

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
