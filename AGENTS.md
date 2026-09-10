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

HTML is exempt, by `**/*.html` in `.oxfmtrc.json`. Formatting it broke tags across lines mid-element (`</span\n>`, `<a\n href=`) often enough that one line in five of a page was a fragment meaning nothing on its own, which is what makes an exact-match edit fail for whoever revises the page next. Setting `htmlWhitespaceSensitivity` to `ignore` cuts that by about two thirds rather than fixing it, and buys a rendering risk on inline elements. Nothing is lost: a page is content, written fresh from a starter, and no one compares two of them for whitespace. Write it the way it reads best. Any `<!-- prettier-ignore -->` still in a page is inert now, though oxfmt does honor it where it formats.

`scripts/generate-skill-md.ts` formats generated `SKILL.md` / `reference.md` with oxfmt's JS API, which — unlike its CLI — does not read `.oxfmtrc.json`. It passes the config through explicitly; keep that wiring if you touch the generator, or generated files will drift from `check:format`.

## Package management

- `pnpm` CLI (`install`, `add`, `remove`, `why`, etc.): outside sandbox (full permissions). pnpm links from the global store; sandbox isolation blocks that path, so the workspace no longer matches a normal local install.
- `pnpm test` / `pnpm check-and-test`: sandbox OK.

## Tests

- Run one file or a whole skill with `cd skills/<name> && pnpm test [path/to/file.test.ts]`.
- Prefer `toMatchInlineSnapshot` so expected output stays visible in the test file. Generate it empty and let the run fill it in.
- Use `it.each` for repetitive cases.

## Templates, and the ideas they become

`skills/create-page` makes one self-contained HTML page, and the kinds of page it can make are the folders under `skills/create-page/templates`. Adding a document kind means adding a template, never adding a skill: sixteen skills that each made a page put sixteen descriptions in the agent's catalog, which has a fixed character budget, and past it every skill on the machine gets its description cut. See [`docs/decisions/2026-09-09-one-page-skill-many-templates.md`](docs/decisions/2026-09-09-one-page-skill-many-templates.md).

The website's Discover section is built from those same folders, where it calls them **ideas**. That word stays on the website: it was chosen so non-technical visitors are not confused, and it is baked into the URLs, the components, and the analytics. `scripts/ideas.ts` is the seam between the two names and the only place both appear.

A template is a folder holding a `template.md` (what this document is, when to reach for it and when not, its slots, its own refusals), a `main.html` (the section stubs pasted into the shared starter), a `patterns.md` for vocabulary only that kind uses, an `idea.json` sidecar (title, tagline, when to use it, tags, order, needs, which example is the cover, and optionally the sections a page contains), and an `examples/` folder holding at least three finished pages that differ on purpose, each with a `.json` design note saying what that example chose and why, and a `variant`: one subject-free line under 80 characters saying what the example shows of the shape, which the website uses as the example's caption and viewer title with the subject title under it.

- The skill's `SKILL.md` is the router: the shared method, the fixed-and-free contract, the refusals every page obeys, and a table linking each template by its exact path. **Link every new template there.** The runtime hands an agent at most fifty filenames from a loaded skill and walks them depth-first, so a template the router does not name is one an agent has no way to open. `pnpm check:ideas` enforces it.
- One `starter.html` serves every template. It carries the skin, the fonts, the icon set, and the behavior every page gets: external links wear their site's icon, footnote markers and notes link both ways, and printing has sane margins. Do not add a second starter.
- The first of an idea's `tags` decides which group it appears under on the website, and it names what the reader arrives with rather than what they intend to do with it. Six of them: `decide` a decision to make, `explain` something to explain, `persuade` a case to make, `steps` steps to follow, `data` numbers to make sense of, `layout` something to lay out. A seventh invented here does not fail anything; it silently lands the idea in a group called More, so add one only by adding it to the website's list too. Later tags are free and group nothing.
- `idea.json` carries a `sketch`: the one mark the website draws on the idea's tile, so a visitor sees what the page is for before opening an example. It names a shape rather than a layout. An earlier version stacked six miniature rows into a facsimile of the template and every idea came out as the same grey document, which told them apart from nothing; a tile is small enough to carry one idea, so it draws one thing. The marks: `rank` a list with one picked, `grid` a table of options against specs, `fork` a yes beside a no, `weights` bars on a shared scale, `grade` a ring gauge, `split` a plus column and a minus column, `flow` boxes joined by arrows, `qa` repeated question rows, `short` a bold line and three bullets, `spine` a timeline with stops, `memo` a dense formal page, `sheet` a headline over columns, `quote` a quoted block over a result, `steps` numbered circles, `ticks` checkboxes, `days` a day at a time, `stats` figures and a chart, `table` many rows and a filter, `compute` an input over an answer, `board` notes placed on a plane, `frames` screens with captions. A name the website does not know draws a plain page, so add the drawing there before using a new one.
- The starter and every example carry the shared skin from `skin/theme.css` verbatim between `/* skin:start */` and `/* skin:end */`, and load nothing but the fonts, the icon set, and the pinned Tailwind browser build. `pnpm check:ideas` enforces that, the three-example minimum, and the skill description's budget, which is one description shared with every other skill on the machine and so reads as a routing rule.
- Shared vocabulary lives in `skills/create-page/references`: patterns, charts, diagrams, interaction, and images. Put a recipe there when a second template would want it, and in the template's own `patterns.md` when it would not.
- Iterate with `pnpm preview`, a grid of every example as a live frame that reloads on save. Do not iterate on the website; it renders whatever this repo committed.
- When a template is done, run `pnpm capture <name>`. It writes `captures/<name>/<example>.png` for the website's tiles and records each example's hash in its sidecar; CI fails when a capture is older than its HTML. Captures live outside `skills/` so nothing bundles or installs them.
- An example exists to show an agent the shape, not to be authoritative. Name things that exist, because a reader understands a comparison between things they have heard of, but the research is illustrative and the figures are not the point. A real run of the skill that turns out better than an example should replace it.
- What an example does owe is safe links. An agent copying a page keeps what it finds there, so every link points somewhere stable and harmless: a maker's or vendor's own page rather than a deep SKU or a search result, and nothing that will rot into a 404 or send a reader somewhere they did not ask to go. The example is teaching the agent that a named thing is a link, so the destination has to survive being copied.
- Numbers are the easiest thing for an agent to invent and the hardest for a reader to check. A page carries a figure only when the prompt, a source, or arithmetic over shown inputs gave it; scores use coarse scales (letters, a few dots, a word) unless every input is on the page, and never a decimal that implies precision the research does not have.
