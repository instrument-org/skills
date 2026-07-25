# Docs

Durable, versioned docs are the system of record; prefer them over chat or PR history. Keep them evergreen and safe to share: no secrets, and nothing tied to one machine, person, or moment. Link the code path, PR, or commit a doc describes so it stays tied to the source.

The same taxonomy is used in the sibling Instrument repos, so a doc lands in the same place wherever you are.

- **`decisions/`** — why we chose one approach over the alternatives, named for the date decided: `YYYY-MM-DD-short-slug.md`. Record the context, the options weighed, the choice, and why. Don't rewrite a decision; supersede it with a new dated file that references the old one.
- **`findings/`** — non-obvious issues, what we tried, and what might resolve them later. One file per finding. (Nothing here yet.)
- **`plans/`** — execution plans for non-trivial work, so someone can pick the work up later with full context. `active/` vs `completed/`; each starts with a `Status:` line. Move a finished or abandoned plan to `completed/` with its `Status:` updated rather than deleting it. (Nothing here yet.)

Guidance on how to _write_ a skill is not a doc — it belongs in [`AGENTS.md`](../AGENTS.md) (repo-wide rules) or in the repo-local skills under `.agents/skills/`, which is where an agent will actually look.
