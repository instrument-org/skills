# wireframe-check

Drives the wireframe skill's enlarged view in headless Chromium and prints one FAIL line per broken promise. Run it after any change to `skills/wireframe/main.html`.

```sh
pnpm wireframe-check [--keep <dir>]
```

It writes a handful of fixture pages with the skill's own `new.mjs` (no groups, groups with a current design and stars, an ungrouped lead-in, a single group, a frame still carrying a `compare` field, tall frames at one per row, and frames with callouts), opens each at 1440x900, and walks it:

- no script errors
- the title block and the bottom band keep one height across every frame, with notes of one line and of two
- the counter, the strip's lit bar, the group's name inside the strip, and `?frame=` follow the open frame
- a frame with a `compare` field, from a page written for an older viewer, lists no problem, and C does nothing
- on frames with callouts, the margin shows each callout's words and a tick, and a frame of one size sits in the same place on every frame, callouts or none
- the spotlight is up as a frame arrives and gone 2s later; `A` holds it, draws leaders in place of the ticks and keeps the rings off
- Cmd+. hides the margin's words, ticks and leaders and the spotlight, with `A` off and on
- closing leaves nothing behind

`--keep <dir>` writes the fixture pages there to open by hand. Exit 0 pass, 1 FAIL, 3 Chromium could not run. It finds Chromium the way `tools/page-check` does, and `scripts/wireframe-check.test.ts` runs it in the suite wherever one is downloaded.
