# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `open-in-instrument-link.ts` Print the reply line that links outputs to Instrument: one line per output, or one link for several outputs of the same piece of work

Exports:

- `buildReply({ paths, title, from, cwd, home, platform, stat, tempRoots, }: { paths: readonly string[]; title?: string; from?: string; cwd?: string; home?: string; platform?: NodeJS.Platform; stat?: (absolutePath: string) => Kind; tempRoots?: readonly string[]; }): { markdown: string; warnings: string[]; }`

```text
open-in-instrument-link

Usage:
  $ node open-in-instrument-link.ts <path> [--title <title>]
  $ node open-in-instrument-link.ts <path> <path>... --title <work> [--from <agent>]

Prints the Markdown to paste into your reply. One path prints one line; several
paths print one link that opens them together, then each path on its own line.
Relative paths resolve against the current folder. Warnings go to stderr.

Options:
  --title <title>  Names the output, or for several the piece of work (default: the file name)
  --from <agent>   Names you as you would introduce yourself; used with several paths
  -h, --help       Display this message
```

> [!NOTE]
> Prints Markdown to stdout and warnings to stderr. It reads only whether each path exists and is a folder, and opens nothing.
