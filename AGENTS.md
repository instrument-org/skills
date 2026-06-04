# Instrument Skills

Skill/template registry for the Instrument desktop app. Not an app.

- `skills/`: workspace-installed agent skills. Scripts run from the consuming project root, not here. Each skill has its own `tests/`.

## Notes

- If `SKILL.template.md` exists, `SKILL.md` is generated; edit the template.
- Wrap long lines when it helps scan code, prompts, or docs.

## Consumer app context

Primary consumer: cross-platform Electron desktop app for knowledge workers. Users give agents project folders; agents work on local files with file I/O, shell, web search, browser automation, and image generation. Optimize for file-centric desktop use on Windows/Linux/macOS. Avoid platform-specific assumptions unless documented. Do not optimize for CI, servers, or CLI-first workflows.

## TypeScript

- No non-null assertions (`!`); use type guards or optional chaining.
- Avoid casts. If needed, explain why. Prefer `satisfies`; use `as` only for different-type assertions, e.g. unknown payloads.
- Avoid `any`; never use `as any`.
- Reuse existing types/interfaces; avoid per-file redefinitions.
- Avoid optional props/properties unless needed.
- Kebab-case filenames.
- Prefer named exports.
- No JSX section comments like `{/* Header */}<Header />`.
- Perfectionist/import-x sort objects, interfaces, types, imports, etc. Ignore order-only lint errors; auto-fix handles them.
- Prefer object params for many or identical params: `({ a, b }: { a: number, b: number }) => number`.
- Do not run `tsc`; use built-in diagnostics.
- `lib`: `es2023`, `DOM`, `DOM.Iterable`; modern features OK.
- Prefer short inline non-exported type declarations.
- Avoid `Array#reduce()`; prefer `.map`, `.filter`, or `for...of`.
- Omit return types unless needed.

## Tailwind

- Use `size-` over `w-` and `h-` when width and height are the same.
- Use `gap-x-` or `gap-y-` over `space-x` or `space-y` for gap.
- Tailwind v4 scale utilities (`pt-17`, `gap-11`, `w-17`, etc.) are valid. Prefer over arbitrary `[...]`.

## Zod

- Prefer `z.output` over `z.infer` for type inference.

## Cursor skills

Repo-local skills live in `.agents/skills/` (e.g. skills-commit-message,
create-registry-skill, tighten-skill).

## Monorepo checks (Turbo)

Run checks through Turbo from repo root for caching. Do not `cd skills/*` for repo-wide check loops.

- `pnpm check-and-test` — full CI
- `turbo run check:types` — all packages
- `turbo run check:types --filter=@instrument-org/skill-markdown` — one skill
- Single test file only: `cd skills/<name> && pnpm test <path/to/file.test.ts>`

## Package management

- `pnpm` CLI (`install`, `add`, `remove`, `why`, etc.): outside sandbox (full
  permissions). pnpm links from the global store; sandbox isolation blocks that
  path, so the workspace no longer matches a normal local install.
- `pnpm test` / `pnpm check-and-test`: sandbox OK.

## Tests

- Use `it.each` for testing repetitive cases.
- Generate empty `toMatchInlineSnapshot` and allow the test run to fill it in.
- Prefer `toMatchInlineSnapshot`; keep expected output visible in the test file.
- Run a specific test file: `cd skills/<name> && pnpm test <path/to/file.test.ts>`.
- Run all tests in a skill: `cd skills/<name> && pnpm test`.
