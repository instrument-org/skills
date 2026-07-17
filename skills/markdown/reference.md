# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `html-to-md.ts` Convert an HTML file or string to Markdown

Exports:

- `convertHtmlFile({ inputPath, outputPath, gfm, headingStyle, codeBlockStyle, }: { codeBlockStyle?: CodeBlockStyle; gfm?: boolean; headingStyle?: HeadingStyle; inputPath: string; outputPath?: string; }): Promise<{ markdown: string; outputPath: string; } | { markdown: string; outputPath?: undefined; }>`
- `convertHtmlString({ html, gfm, headingStyle, codeBlockStyle, }: { codeBlockStyle?: CodeBlockStyle; gfm?: boolean; headingStyle?: HeadingStyle; html: string; }): string`

```text
html-to-md

Usage:
  $ html-to-md --html-file page.html --output page.md

Options:
  --html-file <path>          Input HTML file path
  --html <htmlString>         Inline HTML string input
  --output <path>             Output Markdown file path
  --no-gfm                    Disable GitHub-Flavored Markdown (default: true)
  --heading-style <style>     Heading style: atx or setext (default: atx)
  --code-block-style <style>  Code block style: fenced or indented (default: fenced)
  -h, --help                  Display this message
```
