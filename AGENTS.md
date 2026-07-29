# Instrument Skills

Skill/template registry for the Instrument desktop app. Not an app.

- `skills/`: workspace-installed agent skills. Scripts run from the consuming project root, not here. Each skill has its own `tests/`.

## Notes

- If `SKILL.template.md` exists, `SKILL.md` is generated; edit the template.
- Do not soft-wrap prose in skill Markdown. The app renders source line breaks, so keep each paragraph or list item on one source line.

## Skill design

- Treat a skill as a recipe book for solving a domain, not as a catalog of CLI wrappers. Teach the agent how to choose an approach, compose the installed libraries, and verify the result.
- Fix skills for the general case, not the transcript. When a failure report motivates a change, encode the durable rule (how a tool really works, a transferable technique) and drop the incidental specifics that exposed it: the one-off site, vendor, CDN token, error string, or environment quirk. Test: would it help on a different task, or only replay this one?
- Keep scripts for closed, repeatable operations. For generative, layout, data, or multi-step work, include executable library recipes and make direct code the primary route.
- Use `{{GENERATED_SCRIPT_INDEX}}` when a template has scripts. Keep the concise index in `SKILL.md`; the generator writes complete CLI documentation to `reference.md` for progressive disclosure.
- A command-first skill is appropriate only when the underlying interface is itself the best improvisational surface, such as FFmpeg or browser automation.
- TypeScript dependencies are isolated to the loaded skill package. A custom TypeScript recipe that imports them must live under that skill directory and be run by its full path from the task root. Python packages are available to task-local scripts through the shared task virtualenv.

## Consumer app context

Primary consumer: Instrument, a cross-platform Electron desktop app for knowledge workers. Users open a local project folder and delegate work to an agent. The agent operates on that folder using file I/O, shell commands, web search, browser automation, and image generation.

Skills from this registry are installed into the user's workspace on demand. Their scripts execute from the user's project root, not from this registry. Optimize for file-centric desktop workflows on Windows, Linux, and macOS. Avoid platform-specific assumptions unless documented. Do not optimize for CI, servers, or CLI-first workflows.

## Skill runtime

- The product provides a Node.js runtime and a Python runtime for skill scripts. Implement scripts in TypeScript (npm deps) or Python (pip deps).
- Python is available via bundled uv with managed CPython. A per-task virtualenv lives at `work/.venv`; agents call `python`, `pip`, and `uv` as shell commands. The app installs locked base dependencies from a loaded skill's `pyproject.toml` and `uv.lock`; write `.py` scripts and use `pip install <pkg>` only for task-specific optional extras.
- Python skills keep their complete dependency contract in `pyproject.toml` and a committed `uv.lock`. Tests run with `uv run --locked --project .` so the manifest stays executable. Keep SKILL.md's dependency guidance aligned with the manifest: identify automatically installed base packages and any optional extras the agent must install for a requested workflow.
- Native npm dependencies are acceptable only when they provide supported binaries for Windows, Linux, and macOS.
- A tool available on a contributor's machine is not necessarily available to an installed skill. Treat the product runtime and the skill's declared dependencies as the execution environment.
- Prefer Python for document manipulation (PDF, DOCX, XLSX, PPTX), data processing, and ML inference — the ecosystem is more stable and feature-rich than the Node equivalents. Prefer TypeScript for skills that are inherently browser/web or that wrap Node-native APIs.

## TypeScript

- Avoid casts. Prefer `satisfies`; use `as` only for genuinely different types (e.g. unknown payloads), and say why.
- Reuse existing types/interfaces rather than redefining per file. Prefer short inline non-exported types.
- Do not run `tsc`; use built-in diagnostics.
- This repo installs no ESLint or oxlint, so nothing auto-fixes import or object key order. Match the surrounding file.

## Zod

Prefer `z.output` over `z.infer` for type inference.

## Repository knowledge base

Durable, versioned docs are the system of record; prefer them over chat/history. Keep them evergreen and safe to share: leave out secrets and anything tied to one machine, person, or moment. See [`docs/README.md`](docs/README.md) for the taxonomy (`decisions/`, `findings/`, `plans/`).

## Monorepo checks (Turbo)

Run checks through Turbo from repo root for caching. Do not `cd skills/*` for repo-wide check loops.

- `pnpm check-and-test` — full local check (includes spelling, format, etc.)
- `pnpm check-and-test:ci` — what CI runs (omits pedantic checks that don't affect correctness)
- `turbo run check:types` — all packages, or `--filter=@instrument-org/skill-<name>` for one
- `turbo run check:python` — Python syntax checks for every Python skill

A format hook runs oxfmt on every file you Edit/Write, then oxfmt over all changed files on Stop. With no linter installed, formatting is the whole of it. So: expect files to change after you write them, don't hand-format, and run the checks above for type errors and skill-rule violations, which the hook does not cover.

`scripts/generate-skill-md.ts` formats generated `SKILL.md` / `reference.md` with oxfmt's JS API, which — unlike its CLI — does not read `.oxfmtrc.json`. It passes the config through explicitly; keep that wiring if you touch the generator, or generated files will drift from `check:format`.

## Package management

- `pnpm` CLI (`install`, `add`, `remove`, `why`, etc.): outside sandbox (full permissions). pnpm links from the global store; sandbox isolation blocks that path, so the workspace no longer matches a normal local install.
- `pnpm test` / `pnpm check-and-test`: sandbox OK.

## Tests

- Run one file or a whole skill with `cd skills/<name> && pnpm test [path/to/file.test.ts]`.
- Prefer `toMatchInlineSnapshot` so expected output stays visible in the test file. Generate it empty and let the run fill it in.
- Use `it.each` for repetitive cases.
