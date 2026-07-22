---
name: tighten-skill
description: Audit and trim a skill's token usage. Use when a skill feels verbose, is over its token budget, or you want to tighten prose without losing meaning.
---

# Trim Skill Tokens

Skills are loaded on demand into an agent context. Excess tokens still compete with the user's task, so keep the primary skill to the minimum needed to choose an approach and act correctly.

## What to cut

- **Filler prose** — "When the goal is to understand a page..." → "To read a page:"
- **Redundant callouts** — if a warning repeats something already shown in a code example, cut the prose
- **Over-specified comments** — `# Navigate (aliases: goto, navigate)` is fine; a paragraph explaining it is not
- **Grammar** — agents don't need full sentences; drop articles, compress clauses, use imperative fragments
- **Duplicate commands** — if a flag appears in a section header comment and again as its own line, pick one
- **Exhaustive references**: move complete CLI help and API catalogs to linked reference files; keep only a concise index in the primary skill

## What to keep

- **Behavioral gotchas** — silent failures, exit-0-but-no-op cases, things that look like they work but don't
- **The "why"** — one short reason behind a non-obvious rule helps agents follow it reliably
- **Deliberate additions** — check git log before removing; some lines exist to fix regressions
- **Composable recipes**: preserve small executable examples that teach the agent how to adapt the underlying library
- **Routing rules**: keep the distinction between direct library work and closed operations handled by bundled scripts

## Process

1. Check token count if a budget is known
2. Read the skill top to bottom, noting sections that feel like prose documentation vs. agent instructions
3. Cut or compress the worst offenders first — intros, section bodies, long inline comments
4. Check git log for the file to understand what was deliberately added; don't remove those
5. Verify nothing load-bearing was lost; re-read the trimmed version as if you're the agent

## Grammar shortcuts that are fine for agents

- Drop "the", "a", "an" when meaning is clear
- "Always X" not "You should always make sure to X"
- Sentence fragments for lists
- Slash-joined alternatives: `click`/`hover`, `fill`/`select`
