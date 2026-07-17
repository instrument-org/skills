#!/usr/bin/env python3
"""Remove the background from an image, outputting a PNG with transparency.

Uses rembg (no GPU required). u2net (default, ~170 MB) suits high-contrast
subjects; birefnet-general (~1 GB) preserves hair, fur, and fine edges. The
chosen model downloads on first use and is cached.
"""

import argparse
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Remove image background")
    parser.add_argument("input", help="Input image (PNG, JPG, WEBP)")
    parser.add_argument("--output", help="Output PNG path (default: <input>-nobg.png)")
    parser.add_argument(
        "--model",
        default="u2net",
        choices=["u2net", "u2net_human_seg", "isnet-general-use",
                 "birefnet-general", "birefnet-general-lite"],
        help="u2net: fast, high-contrast subjects (default). "
             "birefnet-general: best edges for hair/fur, ~1 GB download. "
             "birefnet-general-lite: lighter BiRefNet. "
             "u2net_human_seg: people. isnet-general-use: general.",
    )
    parser.add_argument(
        "--alpha-matting",
        action="store_true",
        help="Refine edges to reduce halos/fringing (slower; helps u2net/isnet).",
    )
    args = parser.parse_args()

    try:
        from rembg import remove, new_session
        from PIL import Image
    except ImportError:
        sys.exit('Required packages missing. Run: pip install "rembg[cpu]" Pillow "numba>=0.60"')

    out = args.output or os.path.splitext(args.input)[0] + "-nobg.png"
    session = new_session(args.model)

    with open(args.input, "rb") as f:
        result = remove(f.read(), session=session, alpha_matting=args.alpha_matting)

    with open(out, "wb") as f:
        f.write(result)

    print(out)


if __name__ == "__main__":
    main()
