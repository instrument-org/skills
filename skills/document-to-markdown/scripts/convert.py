#!/usr/bin/env python3
"""Convert a local document to Markdown for analysis or reuse."""

import argparse
from pathlib import Path
import sys


SUPPORTED_EXTENSIONS = frozenset(
    {
        ".csv",
        ".docx",
        ".epub",
        ".json",
        ".msg",
        ".pdf",
        ".pptx",
        ".tsv",
        ".txt",
        ".xls",
        ".xlsx",
        ".xml",
    },
)


def relative_path(path: Path) -> str:
    try:
        return str(path.relative_to(Path.cwd()))
    except ValueError:
        return str(path)


def main():
    parser = argparse.ArgumentParser(
        description="Convert a local document to Markdown",
    )
    parser.add_argument("input", help="Local input file")
    parser.add_argument("--output", required=True, help="Markdown output path")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing output file",
    )
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if not input_path.is_file():
        sys.exit(f"Input file not found: {input_path}")
    if input_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        sys.exit(
            f"Unsupported input type: {input_path.suffix or '(none)'}. "
            f"Supported: {supported}",
        )
    if input_path == output_path:
        sys.exit("Output path must differ from the input file")
    if output_path.exists() and not args.force:
        sys.exit(
            f"Output file already exists: {output_path}. "
            "Use --force to overwrite it",
        )

    try:
        from markitdown import MarkItDown
    except ImportError:
        sys.exit(
            "MarkItDown is not installed. Run: "
            "pip install 'markitdown[pdf,docx,pptx,xlsx,xls,outlook]'",
        )

    try:
        result = MarkItDown(enable_plugins=False).convert_local(str(input_path))
    except Exception as error:
        sys.exit(f"Conversion failed: {error}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(result.text_content, encoding="utf-8")
    print(f"Converted: {relative_path(input_path)} -> {relative_path(output_path)}")


if __name__ == "__main__":
    main()
