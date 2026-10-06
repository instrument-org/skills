# Page skills launch nothing

Status: accepted, 2026-10-06. Supersedes the Chrome check in [`2026-10-05-create-page-is-a-method-with-kits.md`](2026-10-05-create-page-is-a-method-with-kits.md).

## Context

`create-page`'s `page.mjs` and `wireframe`'s `look.mjs` found the user's installed Chrome (in `/Applications` on macOS) and ran it headless to measure and screenshot a page. Run from inside Instrument, that raised a macOS App Management permission prompt attributed to Instrument: the user saw the app they were working in ask to manage another app, for a step they never asked for.

## Decision

- **A skill starts no process and opens no browser.** Nothing a skill ships may raise an operating system prompt. `page.mjs` builds the page and runs every check the file itself can answer: headline, title and paragraph length, words before the hero, an approximate prose share, quotes against the inputs, weekdays against dates, allowed hosts, placeholders, em dashes, the direction comment.
- **Layout is measured in the agent's own browser tool.** `lib/probe.js` is a script the agent evaluates in a page it has opened. It loads the page into hidden frames at 1280x900 in light and dark, the 1104x590 link preview and a 390px phone, measures overlaps, clipping, sideways scroll, small phone text, contrast and the first screen, removes the frames, and returns FAIL lines. With no browser tool, the static check is the whole check, and the agent says the layout is unchecked.
- **Publishing is unchanged.** `share.mjs` and `share.py` stay in both skills, as [`2026-09-13-agents-publish-pages-the-reader-cannot-open.md`](2026-09-13-agents-publish-pages-the-reader-cannot-open.md) decided. They send one upload to the share endpoint and start no process.
- **The Chromium check lives in `tools/page-check`**, outside `skills/`, for evals and development. It runs the same `probe.js` and takes screenshots, and only ever launches a downloaded Chromium, never an installed browser.
- `scripts/page-skill.test.ts` fails when a file in either skill names a process call, or a network write anywhere but the share scripts.

## Why

A check that pops a permission dialog in the user's app costs more trust than the check is worth, and the agent's browser tool already renders the page the user will see. Running the measurements inside that page, rather than in a second browser, keeps one implementation for the skill and the evals. The frames are written from the page as `page.mjs` built it (`window.__instrumentSource`), because a `file://` page cannot reach into a frame of its own URL.

## Rejected

- **A dormant probe built into every page, woken by a URL hash.** Every reader and every shared copy would carry it.
- **The Chrome check behind a flag.** An agent reaches for whatever a skill offers, and the prompt is the harm.
- **Removing the share scripts and leaving publishing to the page's Share button.** Many places an agent makes a page cannot run that button: a host that renders HTML in a sandbox that blocks the widget's script or its call to the share endpoint, or a terminal agent with no browser at all. There the scripts are the only way to a link. A shared link is unlisted, so an agent publishing one when the reader cannot open the file is a small exposure.
