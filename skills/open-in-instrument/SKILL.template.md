---
name: open-in-instrument
description: "Use when your reply points the person to something you made or changed on their computer: an HTML page, folder, image, video, Markdown, PDF or other file. Links each output so one click opens it in Instrument, a desktop viewer, through a web page that still helps when the app is not installed. In replies only, never inside files, and not inside Instrument itself."
---

# Open in Instrument

Instrument is a desktop app that views HTML pages, folders, images, video, PDFs, Markdown and more. When you made something for the person to look at, give each output a link that opens it there in one click. The link goes to a page on tryinstrument.com: if Instrument is installed it hands the path to the app, and if not it offers Copy path and Get Instrument. So the link is right either way, and you never need to know whether the person has the app. Don't tell them they have it, or that anything opened: you can't know either.

Inside Instrument, where `$INSTRUMENT_WORK` is set, the person is already in the app and its chat opens a file you name: give the path and skip the link.

`<skill>` below is the full path to this skill's folder: `$INSTRUMENT_SKILL_DIR` inside Instrument, and the folder this file sits in anywhere else. Run the command from your work folder.

## Build the line with the command

```bash
node <skill>/scripts/open-in-instrument-link.ts <path> --title "<title>"
node <skill>/scripts/open-in-instrument-link.ts <path> <path>... --title "<work>" --from "<you>"
```

Paste what it prints into your reply as it is. It resolves relative paths against the current folder and `~` to the home folder, writes Windows paths in the link's form, and ends a folder with a slash. On stderr it warns about a path that does not exist or sits in a temporary folder: fix the path or move the output, then run it again.

- One output: one line. `--title` names it in a few words the person would recognize; without it, the file name.
- Several outputs from one piece of work: one command, one link that opens them together. `--title` names the work and is required; `--from` names you as you would introduce yourself (`Claude Code`, `Codex`).
- Unrelated outputs: run the command once per output.
- Link the thing to look at, not its supporting files: the page, not the images it embeds or the folder of parts beside it.

## The line

One output:

```markdown
**Pricing comparison** · `/Users/sam/Projects/pricing/comparison.html` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/comparison.html)
```

Several outputs from one piece of work:

```markdown
**Onboarding emails** · 2 files · [Open in Instrument](https://tryinstrument.com/open#title=Onboarding%20emails&from=Codex&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fwelcome.html&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fimages%2F)

- `/Users/sam/Projects/emails/welcome.html`
- `/Users/sam/Projects/emails/images/`
```

The link's words are always exactly `Open in Instrument`. Never link the title or any other words to Instrument, and add no emoji.

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

{{GENERATED_SCRIPT_INDEX}}
