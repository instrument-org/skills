---
name: skills-commit-message
description: Generate a git commit message matching the Instrument Skills registry's scope-first commit style. Use when the user asks for a commit message, wants to commit changes, or asks how to describe their changes. Knows the repo's scopes (skill names like agent-browser, pdf, docx, barcodes, plus dx/ci/docs) and real examples from the commit history.
---

# Commit Message

## Format

`scope: clear, concise description of what changed`

- **Scope:** the main area touched -- a skill name (`agent-browser`, `pdf`,
  `docx`, `barcodes`, `ffmpeg`, `markdown`, `spreadsheet`), `skills` for
  cross-cutting changes across multiple skills, or a workflow area
  (`dx`, `ci`, `docs`). Prioritize scope over type.
- **No conventional types.** Drop `feat:`/`fix:`/`refactor:`/`chore:` etc. Let
  the description imply the nature of the change.
- **Description:** lowercase, no period, imperative-ish, informative and
  scannable, no redundancy. Keep the subject under ~72 chars.
- **Body:** optional bullet list for the _why_/_what_ when the subject alone is
  cryptic.

## Examples

```plaintext
agent-browser: note new location of screenshots
spreadsheet: add Apple Numbers support
skills: move to generated SKILL.md based on cac CLIs
dx: drop unsafe eslint --cache from editor settings
```

Use comma-separated scopes only when changes genuinely span two areas.
Omit scope only for truly repo-wide changes.

## How to write the message

**Determine what's being committed:**

- If conversation context describes recent work, use that as the primary signal
  -- don't let unrelated staged or unstaged changes dilute the subject.
- Otherwise, prefer staged changes (`git diff --cached`). If nothing is staged,
  assume the user wants to commit everything (`git diff HEAD`).

**Then write the message:**

1. Pick the `scope` -- the skill's directory name, or `skills` when changes
   span multiple skills.
2. Write the subject as a short description: _what does this commit do?_
3. Add a body only when the subject alone would be cryptic -- keep bullets tight.

## Display & clipboard

Display the message inline at the end of your response -- no code block.
Subject-only example (no trailing newline):

agent-browser: document console/errors and element screenshots

With body:

skills: avoid outputting recording.wav in root

- script was writing to cwd instead of the output directory

Copy to clipboard immediately after displaying
(pipe through `tr -s '\n'` to suppress blank lines):

```bash
printf %s "agent-browser: document console/errors and element screenshots" | tr -s '\n' | pbcopy
```

With body:

```bash
printf %s "skills: avoid outputting recording.wav in root

- script was writing to cwd instead of the output directory" | tr -s '\n' | pbcopy
```
