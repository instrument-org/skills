# Instrument Skills

Skill/template registry for the Instrument desktop app. Not an app.

- `skills/`: workspace-installed agent skills. Scripts run from the consuming project root, not here. Each skill has its own `tests/`.

## Notes

- If `SKILL.template.md` exists, `SKILL.md` is generated; edit the template.
- Wrap long lines when it helps scan code, prompts, or docs.

## Skill design

- Treat a skill as a recipe book for solving a domain, not as a catalog of CLI
  wrappers. Teach the agent how to choose an approach, compose the installed
  libraries, and verify the result.
- Keep scripts for closed, repeatable operations. For generative, layout, data,
  or multi-step work, include executable library recipes and make direct code
  the primary route.
- Use `{{GENERATED_SCRIPT_INDEX}}` when a template has scripts. Keep the concise
  index in `SKILL.md`; the generator writes complete CLI documentation to
  `reference.md` for progressive disclosure.
- A command-first skill is appropriate only when the underlying interface is
  itself the best improvisational surface, such as FFmpeg or browser
  automation.
- TypeScript dependencies are isolated to the loaded skill package. A custom
  TypeScript recipe that imports them must live under that skill directory and
  be run by its full path from the task root. Python packages are available to
  task-local scripts through the shared task virtualenv.

## Consumer app context

Primary consumer: Instrument, a cross-platform Electron desktop app for
knowledge workers. Users open a local project folder and delegate work to an
agent. The agent operates on that folder using file I/O, shell commands, web
search, browser automation, and image generation.

Skills from this registry are installed into the user's workspace on demand.
Their scripts execute from the user's project root, not from this registry.
Optimize for file-centric desktop workflows on Windows, Linux, and macOS.
Avoid platform-specific assumptions unless documented. Do not optimize for CI,
servers, or CLI-first workflows.

## Skill runtime

- The product provides a Node.js runtime and a Python runtime for skill
  scripts. Implement scripts in TypeScript (npm deps) or Python (pip deps).
- Python is available via bundled uv with managed CPython. A per-task
  virtualenv lives at `work/.venv`; agents call `python`, `pip`, and `uv`
  as shell commands. The app installs locked base dependencies from a loaded
  skill's `pyproject.toml` and `uv.lock`; write `.py` scripts and use
  `pip install <pkg>` only for task-specific optional extras.
- Python skills keep their complete dependency contract in `pyproject.toml`
  and a committed `uv.lock`. Tests run with `uv run --locked --project .` so
  the manifest stays executable. Keep SKILL.md's dependency guidance aligned
  with the manifest: identify automatically installed base packages and any
  optional extras the agent must install for a requested workflow.
- Native npm dependencies are acceptable only when they provide supported
  binaries for Windows, Linux, and macOS.
- A tool available on a contributor's machine is not necessarily available to
  an installed skill. Treat the product runtime and the skill's declared
  dependencies as the execution environment.
- Prefer Python for document manipulation (PDF, DOCX, XLSX, PPTX), data
  processing, and ML inference — the ecosystem is more stable and feature-rich
  than the Node equivalents. Prefer TypeScript for skills that are inherently
  browser/web or that wrap Node-native APIs.

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

- `pnpm check-and-test` — full local check (includes spelling, format, etc.)
- `pnpm check-and-test:ci` — what CI runs (omits pedantic checks that don't affect correctness)
- `turbo run check:types` — all packages
- `turbo run check:types --filter=@instrument-org/skill-markdown` — one skill
- `turbo run check:python` — Python syntax checks for every Python skill
- Single test file only: `cd skills/<name> && pnpm test <path/to/file.test.ts>`

Format hook: each Edit/Write runs Prettier only; finishing (Stop) runs Prettier + `eslint --fix` + Prettier over changed files. Don't hand-format or fix order-only/auto-fixable lint; expect files to change after you write them. Non-auto-fixable lint/type errors are not handled by the hook, run the checks above.

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
