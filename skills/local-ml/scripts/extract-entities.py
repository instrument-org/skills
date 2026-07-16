#!/usr/bin/env python3
"""Extract named entities such as people, organizations, and locations from text."""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Extract named entities from text")
    parser.add_argument("--text", help="Text to process")
    parser.add_argument("--input", help="Input text file")
    parser.add_argument("--model", default="dslim/bert-base-NER")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    if not args.text and not args.input:
        sys.exit("Provide --text or --input")

    try:
        from transformers import pipeline
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch")

    text = args.text
    if args.input:
        with open(args.input) as f:
            text = f.read()

    pipe = pipeline("ner", model=args.model, aggregation_strategy="simple")
    entities = pipe(text)

    if args.as_json:
        print(json.dumps(entities, indent=2, default=str))
    else:
        for e in entities:
            print(f"{e['entity_group']:12s} {e['score']:.2f}  {e['word']}")


if __name__ == "__main__":
    main()
