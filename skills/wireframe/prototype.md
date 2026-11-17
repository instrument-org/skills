# A prototype instead of frames

Frames are for comparing states side by side. When the reader needs to use one screen instead, clicking into it, opening and closing things, or scrubbing through it over time, make a prototype: one screen drawn at its true size, scaled down only as far as the window needs, with everything on it live. There's no grid, no marks and no enlarged view, and the title bar has Fit and 100% in place of the density slider. A replay of something that happened over time is the usual case, with a scrubber under the screen.

```
node <skill>/new.mjs 2026-10-28-chat-replay-field-research.html "Chat replay: field research" --prototype
```

Then edit `SCREEN` under `// ---- the screen` in the page's module script, and fill in the one line under the title and the `#source` line. `SCREEN` needs `w`, `h` and `draw()`, which returns the screen's HTML from whatever state you keep beside it. `controls()`, if there is one, returns what goes under the screen at true size, such as a scrubber or a row of buttons, so they never shrink with the drawing. Change your state in your own listeners on `document`, and call `redraw()` to draw the screen again. For anything that changes every frame, like a scrubber being dragged, write to `#screen` directly instead of redrawing the controls, so the slider under the pointer isn't replaced mid-drag.

The page's kit is the neutral one in `main.html` (`win`, `web`, `phone`, `panel`, `shell`, `navItem`, `group`, `btn`, `field`, `toggle`, `chip`, `grid`, `empty`, `bars`); delete the helpers you don't call. The same rules for the name, the line under it and the source line apply. Check it with `node <skill>/check.mjs <page>`, then in your browser tool, and click the things the reader will click.
