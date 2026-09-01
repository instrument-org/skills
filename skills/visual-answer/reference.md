# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `create-visual-answer.ts` Generate a visual answer page shell with the Studio theme and local bundles

Exports:

- `createVisualAnswer({ body, bodyFile, outputPath, title, }: { body?: string; bodyFile?: string; outputPath: string; title?: string; }): Promise<{ outputPath: string; }>`

```text
create-visual-answer

Usage:
  $ create-visual-answer --output output/answer.html [--body-file work/body.html]

Options:
  --output <path>     Output HTML file path
  --body <html>       Inline HTML content for <main>
  --body-file <path>  Read <main> content from a file
  --title <text>      Document title placeholder (default: Visual answer)
  -h, --help          Display this message
--output <path> is required
```
