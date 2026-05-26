# Instrument Skills

Skill and template registry consumed by the Instrument desktop app (cross-platform Electron, Windows/Linux/macOS). Not an application itself.

- `skills/`: Agent skills installed into a workspace on demand. Scripts run from the workspace project root, not here. Each skill has its own `tests/` directory.

## Notes

- If a skill has a `SKILL.template.md`, `SKILL.md` is auto-generated. Edit the template, not `SKILL.md`.
- Prefer wrapping long lines when it makes code, prompts, or docs easier to scan.

## Consumer app context

The primary user is a **cross-platform Electron desktop app for knowledge workers** (agentic AI workspace). Users give the agent project folders; it works on local files (create, edit, research, small apps). Tools include file I/O, shell, web search, browser automation, and image generation. Skills add domain capabilities (e.g. transformers.js, browser scraping). Optimize for file-centric desktop use on Windows, Linux, and macOS. Avoid macOS-only or Linux-only assumptions unless the skill documents platform requirements. Do not optimize for CI, servers, or traditional CLI workflows.

## TypeScript

- Avoid casting types unless necessary. If you do cast, you must add a comment explaining why.
- Avoid `any` and NEVER use `as any`.
- Avoid redefining types and interfaces in every file, if possible, use an existing type or interface.
- Avoid making component props and object properties optional unless necessary.
- NEVER use non-null assertions (`!`). This is forbidden. Always use proper type guards or optional chaining instead.
- Prefer `satisfies` over `as`; use `as` only to assert a different type (e.g. unknown payloads).
- We use kebab case for filenames.
- We use non-default exports whenever possible.
- NEVER add comments for sections of JSX like `{/* Header */}<Header />`.
- Objects, interfaces, types, imports, and other sortable structures are sorted by perfectionist and import-x. Do not fix "Expected {thing} to come before {thing}" or import-order errors; they are auto-fixed after your work is done.
- Prefer objects for functions with many parameters.
- Don't run `tsc` to check for type errors, use your built-in diagnostics tool.
- `"lib": ["es2023", "DOM", "DOM.Iterable"]` is set, so you can use modern features.
- Prefer inline type declarations when they are short and not exported.
- Prefer object types for functions with identical parameters, e.g. `({ a, b }: { a: number, b: number }) => number` instead of `(a: number, b: number) => number`.
- `Array#reduce()` usually results in hard-to-read and less performant code. Instead, prefer `.map`, `.filter`, or a `for...of` loop.
- Don't define return types unless necessary.

## Tailwind

- Use `size-` over `w-` and `h-` when width and height are the same.
- Use `gap-x-` or `gap-y-` over `space-x` or `space-y` for gap.
- Tailwind v4 scale utilities (`pt-17`, `gap-11`, `w-17`, etc.) are valid (4px x n). Prefer over arbitrary `[...]`.

## Zod

- Prefer `z.output` over `z.infer` for type inference.

## Cursor skills

Repo-local skills live in `.cursor/skills/` (commit-message, create-registry-skill).

## Monorepo checks (Turbo)

Run checks through Turbo from the repo root so tasks use caching. Do not
`cd skills/*` to run repo-wide checks in a loop.

- `pnpm check-and-test` — full CI
- `turbo run check:types` — all packages
- `turbo run check:types --filter=@instrument-org/skill-markdown` — one skill
- Single test file only: `cd skills/<name> && pnpm test <path/to/file.test.ts>`

## Package management

- Run `pnpm add`, `pnpm remove`, `pnpm install`, and other dependency-changing
  commands outside the sandbox. They touch the global pnpm store and can fail
  with store/symlink permission errors inside the sandbox.
- Normal pnpm scripts that do not add, remove, or install packages, such as
  `pnpm test` and `pnpm check-and-test`, can run inside the sandbox.

## Tests

- Use `it.each` for testing repetitive cases.
- Generate empty `toMatchInlineSnapshot` and allow the test run to fill it in.
- Prefer `toMatchInlineSnapshot` over `toMatchSnapshot`. We prefer to see what's being tested clearly in the same file to avoid mistakes.
- Run a specific test file: `cd skills/<name> && pnpm test <path/to/file.test.ts>`.
- Run all tests in a skill: `cd skills/<name> && pnpm test`.
