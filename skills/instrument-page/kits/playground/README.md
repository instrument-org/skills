# Playground kit

## What it draws

It draws one thing on a stage, with dialkit's dials beside it and a takeaway under it that the reader can copy. The reader turns the dials until the thing looks or feels right, then leaves with something they can paste, such as CSS, a config object, an SVG or a palette. The thing can be a motion, a shadow, a type scale, a grid, a pattern or a color ramp. The reader works toward a result on this page rather than reading it.

## When to use it

Use it when the answer is judged by eye rather than checked with arithmetic, and the thing being judged has settings. You'll hear it in phrases like "make it feel snappier", "I'm not sure about the radius", "let me play with it", "which shadow" or "can I tweak this". Use it without being asked when you're about to make three versions of something and ask the reader to pick, or when a page you're writing describes a look in adjectives. It usually takes one of three forms: **a motion** (something enters, opens or settles), **a look** (a shadow, a corner, a ramp, a type scale, a spacing rhythm), or **a generator** (a pattern drawn from a seed and a few numbers, where the takeaway is the drawing).

Don't use it when the answer is a number. A calculator with a control panel is still a calculator, so write a slider that recomputes instead (see the cookbook). Don't use it when there's one right setting and you know what it is; just write it down. Don't use it when there are only a few distinct choices; show them side by side. **If the reader would never turn a dial, the page doesn't need a playground.**

## Files

- `skeleton.html` is a complete working page on the foundation. It has the header with a Reset button, the stage marked `class="hero"`, the dials column with the opening settings written out as a list, the takeaway with a copy button, the source line, and the module script (`CONFIG`, `resolve`, `render`, and dialkit mounted inline). Copy it into the task folder as `page.html` and replace everything in capitals.
- `patterns.md` covers dialkit's notation, reading defaults out of the config, mounting the panel in the page's theme, persistence and Reset, rendering on pause, replaying motion, a spring as Motion resolves it, figures beside the stage, and Tweakpane for controls dialkit doesn't have.

## How it sits on the foundation

A playground page is an ordinary page. Write it, then build and check it like any other with `node <skill>/page.mjs page.html --inputs request.md`. The stage is the hero. The stage and the dials share a `.split` row inside a `.bleed` section, since they need the room side by side, and they stack on a phone. Use foundation tokens in the page's own `<style>` (`--paper`, `--line`, `--muted`, `--gray-100`, `--radius`). The takeaway is a plain `<pre>`, which the foundation already styles as code and gives a Copy button that copies whatever the script last wrote into it. `window.__instrumentTheme()` returns the theme the page is showing, and `instrument:theme` fires on `document` when it changes, so the panel follows the page.

The check measures the page as it first paints, which shows the list of opening settings rather than the panel. That's also the offline state, so it has to pass on its own.

## Worked example

The request is "Help me pick a shadow for the cards in our settings screen. I want CSS to paste." The config is the whole page:

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

The stage is a real settings card with that shadow already in its CSS. The settings list reads Lift 8 px, Blur 24 px, Darkness 0.12 and Corner radius 12 px. The `<pre>` holds the opening CSS as `render()` writes it, and the source line says the opening values are a starting point rather than a guideline.

## Rules

- **One config is the whole page.** The dials are one object in dialkit's notation, and that object is the panel, the opening values and the offline list. Nothing about the controls is written twice.
- **The page opens on a real setting, already rendered.** The stage, the figures and the takeaway are in the HTML at the opening values before any script runs. Choose a good opening setting rather than a neutral one, and say where it came from.
- **Every dial does something visible** at the size the stage is drawn. Use about a dozen dials at most. Fewer is better, as long as each one matters.
- **Name the dials in the reader's words.** Keys are labels, such as `travel`, `cornerRadius` or `dim`, never `dy`. Group them into folders the way the reader thinks about them.
- **The takeaway is ready to paste.** That means real CSS with real units, a config in the library's own shape, or an SVG that opens. When two formats describe the same thing, show both.
- **Figures are arithmetic over the dials**, with a word saying what they mean. Never show a score or an opinion as a number.
- **What the reader sets belongs to them.** Use `persist: true` with an `id` unique to the page, and give the page a Reset button. The file you sent never changes.
- **Offline**, the page shows the stage at its opening values (still moving, if it moves), the settings in words where the panel would be, a line saying the dials need the network, the takeaway and the figures.
- **What it loads:** dialkit's vanilla build, pinned, from jsDelivr (`dialkit@2.0.2/vanilla/+esm` and its `dist/vanilla/styles.css`), about 200 KB. The stage loads nothing beyond HTML, CSS, the Web Animations API and inline SVG.

Don't build a stage that opens blank, a dial that changes nothing visible, a takeaway that lives only in the panel's own copy button, a default that is secretly a recommendation, prose sections around the stage, a submit or generate button (the stage follows the dials as they move), or a library loaded to draw something CSS can draw.

Readers take the opening values as a recommendation, so the source line says what they are: a published guideline, a value measured from something real, or a starting point. When a takeaway claims to match a library, name the library, its version and what you checked.
