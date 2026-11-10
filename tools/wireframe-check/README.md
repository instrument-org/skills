# wireframe-check

Drives the wireframe skill's enlarged view in headless Chromium and prints one FAIL line per broken promise. Run it after any change to `skills/wireframe/main.html`.

```sh
pnpm wireframe-check [--keep <dir>]
```

It writes a handful of fixture pages with the skill's own `new.mjs` (no groups, groups with a current design, an ungrouped lead-in, a single group, and tall frames at one per row), opens each at 1440x900, and walks it:

- no script errors
- the bottom band keeps one height across every frame, alone and two up, with notes of one line and of two
- the counter, the strip's lit bar and `?frame=` follow the open frame
- two up shows two different frames, nothing behind them, both inside the window, also after resizing to 960 and 1600 wide, with the right one ringed in the strip
- down in two up moves only the right frame
- a zoom key and a tap on a pane go back to one frame, and closing leaves nothing behind

`--keep <dir>` writes the fixture pages there to open by hand. Exit 0 pass, 1 FAIL, 3 Chromium could not run. It finds Chromium the way `tools/page-check` does, and `scripts/wireframe-check.test.ts` runs it in the suite wherever one is downloaded.
