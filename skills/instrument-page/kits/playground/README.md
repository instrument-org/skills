# Playground kit

## What it draws

One thing on a stage, dialkit's dials beside it, and a copyable takeaway under it. The reader turns the dials until the thing looks or feels right and leaves with something they can paste: CSS, a config object, an SVG, a palette. A motion, a shadow, a type scale, a grid, a pattern, a color ramp. The page is a thing to arrive at, not a thing to read.

## When to reach for it

When the answer is judged by eye rather than checked by arithmetic, and the thing being judged has parameters. "Make it feel snappier", "I am not sure about the radius", "let me play with it", "which shadow", "can I tweak this" are the phrases. Reach for it unprompted when you are about to make three variants of something and ask the reader to pick, or when a page you are writing describes a look in adjectives. Three shapes recur: **a motion** (something enters, opens or settles), **a look** (a shadow, a corner, a ramp, a type scale, a spacing rhythm), and **a generator** (a pattern drawn from a seed and a few numbers, where the takeaway is the drawing).

Not when the answer is a number: a calculator wearing a control panel is still a calculator, so write a slider that recomputes (see the cookbook). Not when there is one right setting and you know it: write it down. Not when the choices are few and discrete: show them side by side. **If the reader would never turn a dial, there is no playground here.**

## Files

- `skeleton.html`: a complete working page on the foundation: the header with Reset, the stage marked `class="hero"`, the dials column with the opening settings written out as a list, the takeaway with a copy button, the source line, and the module script (`CONFIG`, `resolve`, `render`, dialkit mounted inline). Copy it into the task folder as `page.html` and replace everything in capitals.
- `patterns.md`: dialkit's notation, reading defaults out of the config, mounting the panel in the page's theme, persistence and Reset, render-on-pause, replaying motion, a spring as Motion resolves it, figures beside the stage, and Tweakpane for controls dialkit lacks.

## How it sits on the foundation

A playground page is an ordinary page: write it, then build and check it like any other with `node <skill>/page.mjs page.html --inputs request.md`. The stage is the hero. The stage and dials share a `.split` row inside a `.bleed` section and stack on a phone. Use foundation tokens in the page's own `<style>` (`--paper`, `--line`, `--muted`, `--gray-100`, `--radius`). The takeaway is a plain `<pre>`, which the foundation already styles as code, and `<button data-copy="#css">Copy</button>` copies it with no script of your own. `window.__instrumentTheme()` answers the theme the page shows and `instrument:theme` fires on `document` when it changes, so the panel follows the page.

The check measures the page as it first paints, which is the opening settings list rather than the panel; that is the offline state, and it has to pass on its own.

## Worked example

"Help me pick a shadow for the cards in our settings screen; I want CSS to paste." The config is the whole page:

```js
const CONFIG = {
  lift: [8, 0, 32, 1],
  blur: [24, 0, 64, 1],
  darkness: [0.12, 0, 0.4, 0.01],
  cornerRadius: [12, 0, 32, 1],
};
const render = () => {
  const shadow = `0 1px 2px rgb(0 0 0 / 0.06), 0 ${values.lift}px ${values.blur}px rgb(0 0 0 / ${values.darkness})`;
  thing.style.borderRadius = `${values.cornerRadius}px`;
  thing.style.boxShadow = shadow;
  $("#figure").textContent = values.lift + values.blur; // "reaches 32 px below the card"
  $("#css").textContent =
    `.card {\n  border-radius: ${values.cornerRadius}px;\n  box-shadow: ${shadow};\n}`;
};
```

The stage is a real settings card with that shadow already in its CSS, the settings list reads Lift 8 px, Blur 24 px, Darkness 0.12, Corner radius 12 px, the `<pre>` holds the opening CSS as `render()` writes it, and the source line says the opening values are a starting point, not a guideline.

## Rules

- **One config is the whole page.** The dials are one object in dialkit's notation, and it is the panel, the opening values, and the offline list. Nothing about the controls is written twice.
- **It opens on a real setting, already rendered.** The stage, the figures and the takeaway are in the HTML for the opening values before any script runs. Choose a good opening setting, not a neutral one, and say where it came from.
- **Every dial does something visible** at the size the stage is drawn. About a dozen dials at most; fewer, each consequential, is better.
- **Dials are in the reader's words.** Keys are labels: `travel`, `cornerRadius`, `dim`, never `dy`. Folders group the way the reader thinks.
- **The takeaway is pasteable**: real CSS with real units, a config in the library's own shape, an SVG that opens. Where two formats describe one thing, show both.
- **Figures are arithmetic over the dials**, with a word saying what they mean. Never a score, never an opinion in a number.
- **What the reader sets is theirs.** `persist: true` with a page-unique `id`; the page carries Reset; the sent file never changes.
- **Offline**: the stage at its opening values (still moving if it moves), the settings in words where the panel would be, a line saying the dials need the network, the takeaway and the figures.
- **Loads**: dialkit's vanilla build pinned from jsDelivr (`dialkit@2.0.2/vanilla/+esm` and its `dist/vanilla/styles.css`), about 200 KB. The stage loads nothing: HTML, CSS, the Web Animations API, inline SVG.

Refuse: a stage that opens blank; a dial that changes nothing visible; a takeaway only in the panel's own copy button; a default that is secretly a recommendation; prose sections around the stage; a submit or generate button (the stage follows the dials); a library loaded to draw what CSS draws.

Honesty: the opening values read as a recommendation, so the source line says what they are: a published guideline, a value measured off something real, or a starting point. Where a takeaway claims to match a library, name the library and version and what was checked.
