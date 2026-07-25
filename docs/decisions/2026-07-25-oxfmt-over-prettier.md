# Format with oxfmt rather than Prettier

## Context

This repo formatted with Prettier while the two sibling Instrument repos had already moved to oxfmt. The shared format hook (`@instrument-org/agent-hooks`) is repo-agnostic: it shells out to `oxfmt`, `eslint`, and `oxlint`, and **silently no-ops when a binary is absent**. This repo installed none of them, so the hook was configured but did nothing — agent-written files went unformatted, and the mismatch only surfaced later as a `check:format` failure.

Installing oxfmt while keeping Prettier as the checker would have been worse than either end state: the hook would write oxfmt's output and `check:format` would demand Prettier's.

## Decision

Format with oxfmt. `check:format` is `oxfmt --check .`, `fix:format` is `oxfmt .`, Prettier is removed, and `.prettierignore` becomes `.oxfmtrc.json`.

`printWidth: 80` reproduces Prettier's output on every existing file, so the switch reformatted almost nothing: two `pyproject.toml` files Prettier could not parse, and one generated `reference.md` heading that oxfmt keeps on a single line — which is what this repo's own no-soft-wrap rule wants anyway.

`sortPackageJson: false` matches the monorepo and keeps oxfmt out of syncpack's territory.

## Consequence for the generator

`scripts/generate-skill-md.ts` formats generated `SKILL.md` and `reference.md` itself, so it moved from Prettier's API to oxfmt's. **oxfmt's JS API does not read `.oxfmtrc.json` the way its CLI does**, so the generator passes the config through explicitly. Drop that wiring and generated files silently drift from what `check:format` demands.

## Alternatives considered

- **Teach the hook to fall back to Prettier.** Keeps this repo on Prettier and reformats nothing, but leaves the three repos on two formatters and puts repo-specific branching in a shared hook.
- **Leave it and document the manual step.** Zero risk, but the manual `pnpm fix:format` stays forever and a future `oxfmt` install silently reintroduces the write/check conflict.

## Implementation

- Commit `4215cef` — the migration.
- [`.oxfmtrc.json`](../../.oxfmtrc.json), [`scripts/generate-skill-md.ts`](../../scripts/generate-skill-md.ts)
