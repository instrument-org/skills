#!/usr/bin/env python3
"""Generate sentence embeddings for semantic search or similarity.

Outputs a JSON array of floats.
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Embed text as a vector")
    parser.add_argument("--text", help="Text to embed")
    parser.add_argument("--input", help="File with one text per line")
    parser.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2")
    args = parser.parse_args()

    if not args.text and not args.input:
        sys.exit("Provide --text or --input")

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        sys.exit("sentence-transformers not installed. Run: pip install sentence-transformers")

    model = SentenceTransformer(args.model)

    if args.input:
        with open(args.input) as f:
            texts = [line.strip() for line in f if line.strip()]
    else:
        texts = [args.text]

    embeddings = model.encode(texts, convert_to_numpy=True)

    if len(texts) == 1:
        print(json.dumps(embeddings[0].tolist()))
    else:
        print(json.dumps([e.tolist() for e in embeddings]))


if __name__ == "__main__":
    main()
