---
name: skills-commit-message
description: Generate a git commit message matching the Instrument Skills registry's scope-first commit style. Use when the user asks for a commit message, wants to commit changes, or asks how to describe their changes. Knows the repo's scopes (skill names like agent-browser, pdf, docx, barcodes, plus dx/ci/docs) and real examples from the commit history.
---

# Commit Message

## Format

`scope: clear, concise description of what changed`

- **Scope:** the main area touched -- a skill name (`agent-browser`, `pdf`, `docx`, `barcodes`, `ffmpeg`, `markdown`, `spreadsheet`), `skills` for cross-cutting changes across multiple skills, or a workflow area (`dx`, `ci`, `docs`). Prioritize scope over type.
- **No conventional types.** Drop `feat:`/`fix:`/`refactor:`/`chore:` etc. Let the description imply the nature of the change.
- **Description:** lowercase, no period, under ~72 chars. Start with a concrete verb and name the skill or capability affected, then the observable behavior: `add Apple Numbers support`, `document screenshot locations`, `generate skill reference files`.
- **Standalone subject:** write a history label, not a sentence from the implementation story. Avoid starting with articles or pronouns; personification, metaphors, comparisons, and contrast clauses belong in the body. Prefer the skill behavior over an implementation detail unless that detail is the public contract.
- **Check:** someone scanning `git log --oneline` should identify the skill and behavior without reading the diff or task. Rewrite the subject if they cannot.
- **Body:** use a body for context, rationale, follow-on detail, or edge cases an agent will need later. Keep that detail out of the subject.
- **Trailers:** a commit that makes a choice ends with decision trailers (below). Styling, copy, and mechanical commits carry none.

## Decision trailers

The final paragraph, one `Key: value` per line, no wrapped continuations. Write only lines the session actually supports; skip any you would have to invent.

| Trailer                               | Records                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Rejected: <alternative> \| <reason>` | An alternative actually raised in the session, by the user or the agent. Repeatable.                                                   |
| `Commits-to:`                         | A shape, contract, or invariant later code has to keep honoring.                                                                       |
| `Not-tested:`                         | What was not checked: never run by a real agent, not rendered in the consumer app, a known gap left open.                              |
| `Related: <sha>`                      | A commit this one reverses or extends.                                                                                                 |
| `Tested:`                             | Only a check beyond the unit suites: a real agent run, a rendered example, the skill installed in the consumer app. Never test counts. |

Every reason stands without the session. `Rejected: a second PDF engine | user dropped it` is chat history; `Rejected: a second PDF engine | pdfium already renders every page type the skill accepts` is a reason.

An illustrative commit:

```plaintext
pdf: fill form fields from a JSON map

<body>

Rejected: flatten the form after filling | users edit the filled PDF afterwards
Commits-to: field names in the map match the PDF's own names exactly
Tested: filled the three sample forms and opened them in Preview
Not-tested: XFA forms
```

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
