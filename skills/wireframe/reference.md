# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `create-wireframe.ts` Generate an HTML wireframe scaffold with Tailwind CSS styling

Exports:

- `createWireframe({ body, bodyFile, outputPath, themeFile, theme, title, }: { body?: string; bodyFile?: string; outputPath: string; themeFile?: string; theme?: string; title?: string; }): Promise<{ outputPath: string; }>`

```text
create-wireframe

Usage:
  $ create-wireframe --output wireframe.html [--body-file body.html]

Options:
  --output <path>      Output HTML file path
  --body <html>        Inline HTML body content
  --body-file <path>   Read HTML body content from a file
  --theme <css>        Inline declarations for the @theme block
  --theme-file <path>  Read @theme block declarations from a file
  --title <text>       Document title (default: Wireframe)
  -h, --help           Display this message
--output <path> is required
```
