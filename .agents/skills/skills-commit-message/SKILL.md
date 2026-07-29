---
name: skills-commit-message
description: Generate a git commit message matching the Instrument Skills registry's scope-first commit style. Use when the user asks for a commit message, wants to commit changes, or asks how to describe their changes. Knows the repo's scopes (skill names like agent-browser, pdf, docx, barcodes, plus dx/ci/docs) and real examples from the commit history.
---

# Commit Message

## Format

`scope: clear, concise description of what changed`

- **Scope:** the main area touched -- a skill name (`agent-browser`, `pdf`, `docx`, `barcodes`, `ffmpeg`, `markdown`, `spreadsheet`), `skills` for cross-cutting changes across multiple skills, or a workflow area (`dx`, `ci`, `docs`). Prioritize scope over type.
- **No conventional types.** Drop `feat:`/`fix:`/`refactor:`/`chore:` etc. Let the description imply the nature of the change.
- **Description:** lowercase, no period, imperative-ish, informative and scannable, no redundancy. Keep the subject under ~72 chars.
- **Body:** optional bullet list for the _why_/_what_ when the subject alone is cryptic.

## Examples

```plaintext
agent-browser: note new location of screenshots
spreadsheet: add Apple Numbers support
skills: move to generated SKILL.md based on cac CLIs
dx: drop unsafe eslint --cache from editor settings
```

Use comma-separated scopes only when changes genuinely span two areas. Omit scope only for truly repo-wide changes.

## What the message describes

- If conversation context describes recent work, use that as the primary signal -- don't let unrelated staged or unstaged changes dilute the subject.
- Otherwise, prefer staged changes (`git diff --cached`). If nothing is staged, assume the user wants to commit everything (`git diff HEAD`).
