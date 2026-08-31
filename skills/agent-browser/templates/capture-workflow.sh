#!/bin/bash
# Template: Content Capture Workflow
# Purpose: Extract content from web pages (text, screenshots, PDF)
# Usage: ./capture-workflow.sh <url> [output-dir]
#
# Outputs:
#   - page-viewport.png: Current viewport screenshot
#   - page-structure.txt: Page element structure with refs
#   - page-text.txt: Agent-friendly page text or Markdown
#   - page.pdf: PDF version

set -euo pipefail

TARGET_URL="${1:?Usage: $0 <url> [output-dir]}"
OUTPUT_DIR="${2:-.}"

echo "Capturing: $TARGET_URL"
mkdir -p "$OUTPUT_DIR"

# Navigate to target
agent-browser open "$TARGET_URL"

# Get metadata
TITLE=$(agent-browser get title)
URL=$(agent-browser get url)
echo "Title: $TITLE"
echo "URL: $URL"

# Capture the current viewport. Instrument does not support full-page PNG
# capture; the PDF below covers the full document.
SCREENSHOT_RESULT=$(agent-browser screenshot "$OUTPUT_DIR/page-viewport.png")
printf '%s\n' "$SCREENSHOT_RESULT"

# Get page structure with refs
agent-browser snapshot -i > "$OUTPUT_DIR/page-structure.txt"
echo "Saved: $OUTPUT_DIR/page-structure.txt"

# Extract agent-friendly page content
agent-browser read > "$OUTPUT_DIR/page-text.txt"
echo "Saved: $OUTPUT_DIR/page-text.txt"

# Save as PDF
agent-browser pdf "$OUTPUT_DIR/page.pdf"
echo "Saved: $OUTPUT_DIR/page.pdf"

# Optional: Extract specific elements using refs from structure
# agent-browser get text @e5 > "$OUTPUT_DIR/main-content.txt"

# Optional: Handle infinite scroll pages
# for i in {1..5}; do
#     agent-browser scroll down 1000
#     agent-browser wait 1000
# done
# agent-browser screenshot "$OUTPUT_DIR/page-scrolled.png"

echo ""
echo "Capture complete:"
ls -la "$OUTPUT_DIR"
