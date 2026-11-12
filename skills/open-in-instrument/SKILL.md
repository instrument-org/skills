---
name: open-in-instrument
description: "Use whenever your reply names something you, or an agent you ran, made or changed on the person's computer: an HTML page, folder, image, video, Markdown, PDF or other file. Gives each one a link line in place of a bare path, so one click opens it in Instrument, a desktop viewer, through a web page that still helps when the app is not installed. In replies only, never inside files, and not inside Instrument itself."
---

# Open in Instrument

Instrument is a desktop app that views the kinds of file listed under What Instrument opens, and folders. When you made something of those kinds for the person to look at, give each output a link that opens it there in one click. The link goes to a page on tryinstrument.com: if Instrument is installed it hands the path to the app, and if not it offers Copy path and Get Instrument. So the link is right either way, and you never need to know whether the person has the app. Don't tell them they have it, or that anything opened: you can't know either.

This holds for outputs a subagent or another tool made that you pass on, and for every later reply that names them again. When another skill or instruction says to give or return the path, give it as this line: the line carries the path.

Inside Instrument, where `$INSTRUMENT_WORK` is set, the person is already in the app and its chat opens a file you name: give the path and skip the link.

`<skill>` below is the full path to this skill's folder: `$INSTRUMENT_SKILL_DIR` inside Instrument, and the folder this file sits in anywhere else. Run the command from your work folder.

## What Instrument opens

Link only these. For any other file, give the path with no link: the app would show a card saying it has no preview, which is worse than no link.

- Pages: `.html`, `.htm`
- Markdown: `.md`, `.markdown`, `.mdx`, `.mdown`, `.mkd`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.svg`, `.heic`, `.heif`, `.bmp`, `.tif`, `.tiff`, `.ico`
- Video: `.mp4`, `.m4v`, `.mov`, `.webm`, `.ogv`
- Audio: `.mp3`, `.m4a`, `.aac`, `.wav`, `.flac`, `.ogg`, `.oga`, `.opus`
- PDF: `.pdf`, and Illustrator `.ai` saved PDF-compatible
- Office: `.docx`, `.docm`, `.xlsx`, `.xlsm`, `.xls`, `.pptx`, `.pptm`, `.ppt`
- Data: `.csv`, `.tsv`, `.jsonl`, `.ndjson`, `.parquet`, `.sqlite`, `.sqlite3`, `.db`, `.ipynb`
- Drawings: `.excalidraw`
- Folders: a folder of outputs opens as a browsable listing with thumbnails
- Code and plain text, `.json`, `.txt`, `.log` and source files, open as highlighted text. Link one only when reading it is the point, such as a report written as text.

Shown as a preview image only, not the document: Apple `.pages`, `.numbers`, `.key`, and Photoshop `.psd`. A `.zip` opens as a listing of its members. Other archives, `.doc`, `.rtf` and `.epub` do not open.

## Build the line with the command

```bash
node <skill>/scripts/open-in-instrument-link.ts <path> --title "<title>"
node <skill>/scripts/open-in-instrument-link.ts <path> <path>... --title "<work>" --from "<you>"
```

Paste what it prints into your reply as it is. It resolves relative paths against the current folder and `~` to the home folder, writes Windows paths in the link's form, ends a folder with a slash, and shows a path under the home folder as `~/…` while the link keeps it whole. On stderr it warns about a path that does not exist or sits in a temporary folder: fix the path or move the output, then run it again.

- One output: one line. `--title` names it in a few words the person would recognize; without it, the file name.
- Several outputs from one piece of work: one command, one link that opens them together. `--title` names the work and is required; `--from` names you as you would introduce yourself (`Claude Code`, `Codex`).
- Unrelated outputs: run the command once per output.
- Link the thing to look at, not its supporting files: the page, not the images it embeds or the folder of parts beside it.

## The line

One output:

```markdown
**Pricing comparison** · `~/Projects/pricing/comparison.html` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/comparison.html)
```

Several outputs from one piece of work:

```markdown
**Onboarding emails** · 2 files · [Open in Instrument](https://tryinstrument.com/open#title=Onboarding%20emails&from=Codex&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fwelcome.html&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fimages%2F)

- `~/Projects/emails/welcome.html`
- `~/Projects/emails/images/`
```

The link's words are always exactly `Open in Instrument`. Never link the title or any other words to Instrument, and add no emoji.

## Where the link goes

The link goes through the website by default, which is right everywhere. A person who wants links straight into the app, as `instrument://`, sets `INSTRUMENT_LINKS=app` in their shell, or writes `app` into Instrument's `agent-links` file: `~/Library/Application Support/Instrument/agent-links` on macOS, `%APPDATA%\Instrument\agent-links` on Windows, `~/.config/Instrument/agent-links` on Linux. The command reads these itself. You never choose this, and you pass `--links` only when the person asked for one form in this conversation.

## Write the link by hand only if the command can't run

The command needs Node 22.18 or later. Without it, build the same line yourself:

- One output: `https://tryinstrument.com/open#` and then the absolute path with forward slashes, each segment encoded with `encodeURIComponent`, plus `(` `)` `'` `!` `*` as `%28` `%29` `%27` `%21` `%2A` so the Markdown link holds. A space is `%20`, `#` is `%23`, `+` is `%2B`, `%` is `%25`. On Windows the drive leads: `/C:/Users/Sam/report.pdf`. A folder ends with `/`.
- Several: `https://tryinstrument.com/open#title=<work>&from=<you>&f=<path>&f=<path>`, each value encoded whole the same way (so `/` is `%2F`), the paths in the order you list them.

## Only in replies to the person

Write these links only in your replies in this conversation. Never put them in files you write (pages, docs, READMEs, commit messages, pull requests): a link names a path on this computer, which means nothing to anyone else.

## Keep outputs where they last

Temporary and scratch folders get cleaned up, and a link into one stops working. If the person will want an output later, write it into their project or a folder they named, and link that copy.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

- `open-in-instrument-link.ts`: Print the reply line that links outputs to Instrument: one line per output, or one link for several outputs of the same piece of work
