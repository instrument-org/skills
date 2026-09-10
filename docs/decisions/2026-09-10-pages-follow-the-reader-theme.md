# Pages follow the reader's theme

A page made by `create-page` renders light or dark according to the reader's system setting. The agent writing one never chooses, and never writes a `dark:` variant.

Before this, the skin was one light palette and `SKILL.md` said so: "a page that has to look right in two themes is a page that looks wrong in one of them." That held only while nobody could check. The reason it stopped holding is below.

## What forced it

Two bugs that turned out to be the same bug.

The skin painted every link `brand-700` from `@layer base`, one fixed value with no idea what it was sitting on. In the standing-desks verdict banner that is `#0a4a42` on `#0b6056`, **1.36:1**. In the commuter-ebike page, which had chosen `bg-gray-950` for its ground, every link on the page was **1.81:1**.

The second is the tell. The old rule let a page "choose a darker surface within the palette", so a page did, and the moment it did, half the skin's assumptions were wrong beneath it. A palette with one direction cannot be reused upside down, and an agent had no way to find out.

A contrast pass over the registry as it then stood found **44 failing runs across five pages, in the only theme those pages had**, including score badges at 2.7:1 that had shipped and been captured. The one-theme rule was not producing one theme that worked. It was producing an unchecked one.

## The ramp means distance, not lightness

Every token is `light-dark(light, dark)`. A step names how far a color is from the paper: 25 is the faintest wash a page can carry, 950 its darkest ink, and what changes between themes is which end of the spectrum each lands on. So `text-brand-700` is "brand ink" in both, `bg-brand-50` is "brand wash" in both, and a page written against them was already written for both.

The saturated middle, 400 through 600, is written as a single value because it holds still. That is what makes a solid brand banner with white on it render identically either way, and it is the whole rule for white: **white rides the middle and nowhere else**, because every other step moves out from under it. Every dark-theme failure found while converting the corpus was white on a step that flips.

`light-dark()` was chosen over a `@media (prefers-color-scheme: dark)` block that restates the palette, for three reasons: one value per token instead of two blocks a hundred lines apart, no second palette to keep in step, and it makes a theme toggle one property (`color-scheme`) rather than a second set of selectors. Measured in Chrome, it resolves correctly through Tailwind's opacity modifiers, through `color-mix()`, inside multi-color shadows, and in an SVG `fill` reached by `var()`.

## Two surfaces that do not follow

**Paper.** `@media print { :root { color-scheme: only light } }` pins the scheme rather than restating the palette, so a page printed from a dark desktop comes out on white and there is no second set of colors to maintain.

**The code well.** A terminal is a well cut into the page, not more paper. `--color-code` plus four `--color-code-*` inks stay put in both themes, because a transcript whose comment color follows the theme loses half its content in one of them. This also replaced the old advice to pick terminal colors "from the theme's 300 range (they read on dark)", which stopped being true the moment 300 meant wash.

## A link on a block that brings its own ink

Three lines in the skin's base layer, and the reason the green box needed no redesign:

```css
.text-white a,
.text-background a,
.text-code-foreground a {
  color: inherit;
  text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
}
```

A block that sets its own ink has already decided what reads on it, so a link inside takes that and keeps only its underline. It is keyed on the class the agent already writes, needs nothing added to any page, and sits in `@layer base` so a utility on the anchor still wins.

## Checking replaces looking

`pnpm check:contrast` reads both palettes out of `skin/theme.css` and walks every page as a stack of frames, carrying the nearest background and the nearest ink down into each child the way inheritance does, then measures every run of text against WCAG AA in both themes.

It is string work start to finish. **No browser is started**, which is what lets it sit in the ordinary check run rather than in a separate visual job. What it cannot see, and so does not promise: a color set in a `style` attribute or by script, a gradient, text over an image, and anything a media query changes at another width. What it does see is where every mistake actually was.

Three token values moved because it found them under AA in the light theme, unrelated to dark mode: `muted-foreground` and `gray-500` from `#79716b` to `#6d655f` (4.32:1 on the wash surfaces, across 1453 uses), `yellow-700` to `#a25a3c`, and `brown-700` to `#7f6a4d`.

## Where the theme comes from

Not always the operating system. Whatever is showing the page decides, and the two that matter already do:

- **Studio** sets `nativeTheme.themeSource` from its own preference, and Electron hands that to Chromium as the preferred color scheme for every web content in the app, including the sandboxed iframe a page is shown in. A page therefore follows the app, not the desktop, with nothing passed to it. Verified against real Electron with the desktop set to the opposite appearance.
- **A capture** has no reader. `scripts/capture.ts` injects `:root { color-scheme: only light }` into the throwaway copy it shoots, so a tile is the same PNG on a dark laptop and on a CI runner, and the website that shows those tiles stays light.

Anything else embedding a page can pin it the same way, in one property.
