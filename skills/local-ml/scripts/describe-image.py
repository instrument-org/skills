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
        from PIL import Image
        from transformers import BlipForConditionalGeneration, BlipProcessor
    except ImportError:
        sys.exit("transformers not installed. Run: pip install transformers torch Pillow")

    image = Image.open(args.input).convert("RGB")
    processor = BlipProcessor.from_pretrained(args.model)
    model = BlipForConditionalGeneration.from_pretrained(args.model)
    inputs = processor(images=image, return_tensors="pt")
    output = model.generate(**inputs, max_new_tokens=50)
    print(processor.decode(output[0], skip_special_tokens=True))


if __name__ == "__main__":
    main()
