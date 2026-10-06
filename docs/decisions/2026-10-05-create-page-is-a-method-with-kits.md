# create-page is a method with kits, not a router over templates

Status: accepted, 2026-10-05. Supersedes [`2026-09-09-one-page-skill-many-templates.md`](2026-09-09-one-page-skill-many-templates.md) and [`2026-09-10-the-starter-owns-what-every-page-shares.md`](2026-09-10-the-starter-owns-what-every-page-shares.md). Its Chrome check, and wireframe's copied Chrome scripts, are superseded by [`2026-10-06-page-skills-launch-nothing.md`](2026-10-06-page-skills-launch-nothing.md).

## Context

`create-page` was a router over twenty-eight templates, each a `template.md`, a `main.html` pasted into one shared `starter.html`, a `patterns.md`, and three finished examples. The skill told the agent to pick the template that fit, read two examples, and fill the slots.

Agents did exactly that. A template is a strong prior: the agent grabbed the nearest one, filled it in, and produced pages that looked like the examples with the words swapped, whatever the material was. The template's slots decided what the page led with, so the point the inputs implied (the later email that corrects the flyer, the cheaper quote that leaves out the ride home) was rarely the headline. Across a three-round evaluation of several page skills on held-out tasks, the template router scored worst. The replacement below, built and iterated in that evaluation, won the held-out exam for both of the cheaper models it was run with.

## Decision

`create-page` has no page types. It is:

- **A method** in `SKILL.md`: analyze the inputs one at a time, find the point nobody asked about, direct a shape (`card`, `read`, `sheet`, `wall`), a feel and a hero, lead with the point, and keep the rules every page keeps.
- **A stylesheet the agent never reads**: `lib/foundation.css` and `lib/foundation.js`. Plain elements are already designed, a short list of layout classes exists, and `data-shape` and `data-feel` on `<html>` switch the rest. The skin's palette, type and theme contract (`data-theme`, `instrument:theme`, `window.__instrumentTheme`) carry over, so pages still follow the reader's theme and the share widget still works.
- **A check**: `page.mjs` writes the foundation into the page, renders it in Chrome at 1280x900, in the 1104x590 link preview, in dark mode and on a 390px phone, and prints one `FAIL rule: where: measurement -> fix` line per problem, with screenshots. It finds Chrome, Chromium or Edge on macOS, Windows and Linux, or wherever `CHROME` points, and says plainly when a page is unchecked.
- **Recipes** in `cookbook.md`: techniques rather than components, including what the dissolved templates were for (a comparison matrix, a ranked pick with one chosen, a timeline, steps and a checklist, figures with a chart) and the cross-cutting rules they carried (coarse scores, numbers only from inputs, sources or shown arithmetic, named products linked to their maker, the pick shown honestly).
- **Kits** in `kits/<name>/`: capability a page reaches for when it needs it, not a kind of page a user picks. `map` (MapLibre over OpenFreeMap, places read from the list, an offline drawing), `playground` (dialkit dials on a live rendering), `storyboard` (a pictogram drawing library in Node and Python), `whiteboard` (an Excalidraw board, with a scene-writing library in Node and Python). Each kept its real capability and moved onto the foundation.

**Wireframes are their own skill**, `skills/wireframe`. Its frames are drawn in Tailwind's vocabulary at true size, and projects carry their own wireframe kits in that vocabulary (Studio's draws the app's real window), so it keeps its own shell: the old starter's skin, compiled sheet, Tailwind browser build and share widget, as `shell.html`, with `main.html` holding the frame grid, marks, enlarged view and `#frame-N` links. A separate skill also routes better than a kit would: "mock up this screen" is a different request from "make me a page", and the two descriptions do not overlap. It carries copies of `share.mjs`, `share.py` and the Chrome driver, because a skill installs on its own and a path into another skill breaks when only one is installed; a test fails when a copy drifts.

## Options weighed

- **Keep the templates and add variety rules** ("never take the first example", "make one distinctive move"). Already in the router, and the pages still converged: the examples were the strongest signal on the page.
- **Keep the templates as optional references.** An agent that can see a filled-in page of the right kind copies it; optional made no difference in practice.
- **Port every kit, wireframe included, onto the foundation.** Wireframe frames are Tailwind markup through and through, and so are projects' own kits; porting would have broken them for no gain to the reader.
- **One shell shared by every kit.** Only the wireframe needed Tailwind; the other four sit on the foundation and are checked by `page.mjs` like any page.

## Consequences

- Deleted: the templates and their examples, `starter.html`, `captures/`, `skin/theme.css`, the references that were Tailwind vocabulary (`patterns.md`, `charts.md`, `diagrams.md`, `interaction.md`), and the scripts that served templates (`ideas.ts`, `check-ideas.ts`, `capture.ts`, `preview.ts`, `build-sheet.ts`, `check-contrast.ts`, `fix-shell.ts`). Contrast in both themes is now measured in Chrome by `page.mjs` on each real page, rather than by string work over the examples.
- `scripts/check-page-skill.ts` replaces `check-ideas.ts` for what still matters: the description budget, the router naming every recipe, kit and reference, the fifty-file ceiling, kit skeletons that `page.mjs` accepts, and the check's hosts agreeing with `allowed-sources.json`, which stays at the root because the pages worker reads it.
- The website's Discover section and the app's Ideas screen were built from the templates' `idea.json`, examples and captures. Both have nothing to read until they are rebuilt or removed; "ideas" stays the website's word for whatever replaces them.
- The catalog-budget argument of the superseded decision still holds: a new kind of page is a recipe or a kit, never a new skill. Wireframes are the one exception, because they are a different request rather than a different page.
