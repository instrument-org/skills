---
name: skills-commit-message
description: Generate a git commit message matching the Instrument Skills registry's conventional commit style. Use when the user asks for a commit message, wants to commit changes, or asks how to describe their changes. Knows the repo's scopes (skill names like agent-browser, pdf, docx, barcodes, etc.), types (feat, fix, dx, refactor, chore, ci, docs), and real examples from the commit history.
---

# Commit Message

## Format

`<type>(<scope>): <short description>`

- **Types:** `feat`, `fix`, `refactor`, `chore`, `dx`, `docs`, `ci`
- **Scope:** the skill name (`agent-browser`, `pdf`, `docx`, `barcodes`,
  `skills`, `basic`, etc.) or omit for repo-wide changes
- **Description:** lowercase, no period, imperative mood, under 72 chars
- **Body:** optional bullet list explaining the _why_ or _what_ in more detail

## Examples

One per type, drawn from the repo:

```plaintext
feat(agent-browser): initial version of skill
feat(barcodes): add barcode read/write skill using zxing-wasm
fix(agent-browser): remove headed references
fix(skills): ensure tables in docx width comes out not too narrow
refactor(skills): move to generated SKILL.md based on cac CLIs
refactor(markdown): combine string and file conversion
dx(skills): run check:skill per-package via turbo for caching, rename scripts for clarity
dx: explain cross platform
chore(deps): bump vitest to 4.1.5
chore: rename @quests scope to @instrument-org across packages
docs(agent-browser): replace batch with && chaining, simplify auth and downloads
docs(create-registry-skill): add tests, vitest config, and createRequire guidance
ci: consolidate turbo cache into prepare action and add concurrency to CI
```

Scopes: individual skill names (`agent-browser`, `pdf`, `docx`, `barcodes`,
`ffmpeg`, `markdown`, `basic`, `templates`), or `skills` for
cross-cutting changes across multiple skills; omit scope only for repo-wide
changes.

## How to write the message

**Determine what's being committed:**

- If conversation context describes recent work, use that as the primary signal
  for what the commit covers -- don't let unrelated staged or unstaged changes
  dilute the subject.
- Otherwise, prefer staged changes (`git diff --cached`). If nothing is staged,
  assume the user wants to commit everything (`git diff HEAD`).

**Then write the message:**

1. Pick `type` based on intent -- new behavior → `feat`, broken thing → `fix`,
   no behavior change → `refactor`/`chore`/`dx`
2. Use the skill's directory name as scope; use `skills` only when changes
   span multiple skills
3. Write the subject as a short imperative: _what does this commit do?_
4. Add a body only when the subject alone would be cryptic -- keep bullets tight

## Display & clipboard

Display the message inline at the end of your response -- no code block.
Subject-only example (no trailing newline):

feat(agent-browser): document console/errors and element screenshots

With body:

fix(skills): avoid outputting recording.wav in root

- script was writing to cwd instead of the output directory

Copy to clipboard immediately after displaying
(pipe through `tr -s '\n'` to suppress blank lines):

```bash
printf %s "feat(agent-browser): document console/errors and element screenshots" | tr -s '\n' | pbcopy
```

With body:

```bash
printf %s "fix(skills): avoid outputting recording.wav in root

- script was writing to cwd instead of the output directory" | tr -s '\n' | pbcopy
```
