# Playground patterns

These are the pieces only a page with dials needs. Everything else on the page, such as the header and the source line, is ordinary foundation HTML, and `skeleton.html` beside this file has all of it wired together.

## The config

The config is one object in dialkit's notation. It defines the panel, the page's opening values, and the list a reader with no network sees.

```js
const CONFIG = {
  motion: { type: "spring", visualDuration: 0.45, bounce: 0.25 },
  sheet: { travel: [320, 40, 600, 10], fade: true },
  backdrop: { dim: [0.4, 0, 0.8, 0.05], blur: [0, 0, 16, 1] },
  loop: true,
  replay: { type: "action" },
};
```

What each value becomes:

| You write                                                | The reader gets                                   | The value you read back        |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| `24`                                                     | a slider with a range dialkit infers              | number                         |
| `[24, 0, 64]` or `[24, 0, 64, 2]`                        | a slider from 0 to 64, stepping by 2              | number                         |
| `true`                                                   | a toggle                                          | boolean                        |
| `"Hello"`                                                | a text field                                      | string                         |
| `"#0e7869"`                                              | a color well                                      | CSS color string               |
| `{ type: "select", options: ["a", "b"] }`                | a segmented control or a menu                     | the chosen string              |
| `{ type: "pad", x: [0, -1, 1], y: [0, -1, 1] }`          | an XY pad                                         | `{ x, y }`                     |
| `{ type: "spring", visualDuration: 0.45, bounce: 0.25 }` | a spring editor with its curve drawn, three modes | a spring or an easing config   |
| `{ type: "action" }`                                     | a button, reported through `onAction`             | nothing                        |
| `{ blur: [12, 0, 40], y: [4, 0, 24] }`                   | a folder, labeled from the key                    | an object of the values inside |

A key becomes its label by splitting on capitals: `cornerRadius` reads "Corner Radius". So keys are the reader's words, and a folder key names the group the way the reader thinks about it. `_collapsed: true` inside a folder starts it closed.

The spring editor has three modes the reader can switch between, and the value you read back changes shape with them: `{ type: "spring", visualDuration, bounce }` in Time, `{ type: "spring", stiffness, damping, mass }` in Physics, and `{ type: "easing", duration, ease: [x1, y1, x2, y2] }` in Easing. A page with a spring on it handles all three or hides the switch by never reading it.

## Reading the defaults

The config is the only place the opening values are written, so the page reads them out of it before the panel arrives:

```js
const resolve = (config) =>
  Object.fromEntries(
    Object.entries(config).flatMap(([key, v]) => {
      if (Array.isArray(v)) return [[key, v[0]]];
      if (v && typeof v === "object") {
        if (v.type === "action") return [];
        if (v.type === "spring" || v.type === "easing") return [[key, v]];
        if (v.type === "pad")
          return [[key, { x: v.x?.[0] ?? 0, y: v.y?.[0] ?? 0 }]];
        if ("type" in v)
          return [
            [key, v.default ?? v.options?.[0]?.value ?? v.options?.[0] ?? ""],
          ];
        return [[key, resolve(v)]];
      }
      return [[key, v]];
    }),
  );
let values = resolve(CONFIG);
```

The shape it returns is the shape `kit.subscribe` hands you later, so `render()` reads one thing either way.

## Mounting the panel in the page

Inline, in the page's own column, told the theme the page settled on:

```js
const theme = () => window.__instrumentTheme();
const { createDialKit, createDialRoot } =
  await import("https://cdn.jsdelivr.net/npm/dialkit@2.0.2/vanilla/+esm");
const root = createDialRoot({
  target: $("#dials"),
  mode: "inline",
  theme: theme(),
});
document.addEventListener("instrument:theme", () => {
  root.element.dataset.theme = theme();
});
const kit = createDialKit("Sheet", CONFIG, {
  id: "playground-bottom-sheet",
  persist: true,
  onAction: (path) => path === "replay" && play(),
});
$("#settings").remove();
kit.subscribe((next) => {
  values = next;
  render();
});
```

`subscribe` calls back at once with the current values and then on every change, so the first call replaces what `render()` already drew with the same thing, or with what the reader left it at last time. The theme is asked of the page rather than the media query: `window.__instrumentTheme()` answers what the page shows, a viewer's pin and the reader's own choice included, and `instrument:theme` fires on document for either kind of change, so the panel follows the page.

The stylesheet goes in as a `<link>` by path, `https://cdn.jsdelivr.net/npm/dialkit@2.0.2/dist/vanilla/styles.css`, and the panel's root is given the column's width and a card's frame, since inline mode draws a bare panel:

```css
#dials .dialkit-root {
  position: static;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
}
```

A floating panel is `mode: "popover"` with a `position`, and no `target`. It is what dialkit does on its own and what a designer expects from it; reach for it when the stage wants the whole window, and know that on a phone it sits over the thing.

## Saving the reader's settings

`persist: true` keeps the reader's last position under `dialkit:<id>` in their browser's storage and turns on the Versions row, where they can save more than one and copy the values out. The `id` matters: every file opened from a folder shares one storage, so a panel called "Sheet" on two pages would share one memory. Make it the page's own.

The panel has no Reset of its own, so the page carries one, hidden until there are dials to reset:

```js
$("#reset").hidden = false;
$("#reset").addEventListener("click", () => kit.resetValues());
```

Say in the last line where the reader's settings are kept. A reader who has found a setting they like wants to know whether it's safe to close the tab.

## Rendering

One function reads every value and writes every output, meaning the stage, the takeaway and the figures. A slider fires many times a second while it's being dragged, so anything expensive to restart, especially a replayed motion, waits until the reader pauses:

```js
let pending;
const render = () => {
  write(curve(values.motion)); // the takeaway and the figures, cheap
  clearTimeout(pending);
  pending = setTimeout(play, 120); // the replay, once the hand has paused
};
```

Set styles that follow a dial directly, such as a radius, a color or a shadow, in `render()` itself, since the reader should see the thing change as they move the dial.

## Replaying motion

Use the browser's own animation API, so the preview is the same CSS the reader copies rather than an approximation of it:

```js
const play = () => {
  clearTimeout(timer);
  for (const a of thing.getAnimations()) a.cancel();
  thing.animate([{ translate: "0 320px" }, { translate: "0 0" }], {
    duration: c.ms,
    easing: c.easing,
    fill: "both",
  });
  if (values.loop) timer = setTimeout(play, c.ms + 1400);
};
$("#replay").addEventListener("click", play);
$("#stage").addEventListener("click", play);
```

`linear()` easings are how a spring reaches CSS, and `animate()` throws on a browser that lacks them; catch it and fall back to `ease-out`, so the shape still shows without the bounce. Start with `loop` off when the reader has asked for reduced motion: `loop: !matchMedia("(prefers-reduced-motion: reduce)").matches` in the config, so the panel agrees with the page.

## Springs in Motion

This is the one piece of arithmetic worth reusing from page to page. Motion turns a visual duration and a bounce into physics, and a unit spring starting from rest has a closed form. When it counts as settled follows Motion's own rule, and the easing is the curve sampled every 10 ms, which is also what Motion writes for the browser:

```js
const physics = (m) => {
  if (m.visualDuration !== undefined) {
    const root = (2 * Math.PI) / (m.visualDuration * 1.2);
    const stiffness = root * root;
    const damping =
      2 *
      Math.min(1, Math.max(0.05, 1 - (m.bounce || 0))) *
      Math.sqrt(stiffness);
    return { stiffness, damping, mass: 1 };
  }
  return {
    stiffness: m.stiffness ?? 100,
    damping: m.damping ?? 10,
    mass: m.mass ?? 1,
  };
};
```

Position `x(t)` and speed `v(t)` then follow from the damping ratio, under, critical or over, and the page walks `t` in 50 ms steps until `|1 - x| ≤ 0.005` and `|v| ≤ 0.01` per second. The whole of it is about forty lines; state the rule in the page's last line, which is what lets a reader check the figure.

## The takeaway

Write the takeaway in the reader's own format: real CSS with real units, a config in the library's shape, or an SVG that opens. When two formats describe the same thing, write both and say so:

```js
$("#css").textContent =
  `.sheet {\n  animation: sheet-in ${c.ms}ms ${c.easing} both;\n}\n…`;
$("#motion").textContent =
  `<motion.div\n  transition={{ type: "spring", visualDuration: 0.45, bounce: 0.25 }}\n/>`;
```

Copy is the button the foundation puts on every `<pre>`, which copies the block's text as it is when clicked. Keep the takeaway a bare `<pre>` rather than `<pre><code class="language-css">`: the script rewrites its text, which would wipe the highlighting. When the clipboard is refused inside a frame the text is still on the page and selectable, so say so in the source line. Write the opening takeaway into the HTML by rendering the page once and pasting back what the script produced, never by typing it, since a sampled easing is eighty numbers and a reader can check whether the two agree.

## A figure beside the stage

A figure is arithmetic over the dials, in the reader's units, with a word that says what it means:

```html
<dt>Damping ratio</dt>
<dd>
  <span id="zeta" class="n">0.75</span> <small>under, so it bounces once</small>
</dd>
```

The word is what makes the figure useful. A contrast ratio on its own is just a number, while "passes AA for body text" is what the reader wanted to know. A settle time is just a number, while "longer than a tap feels" is the judgment the page can make from it.

## Tweakpane, for controls dialkit lacks

[Tweakpane](https://tweakpane.github.io/docs/) 4.0.5 is the same idea with a different notation and a few controls dialkit does not have: a point in three or four dimensions and a graph that monitors a changing value in the core, and an interval with two thumbs or a grid of radio buttons through its essentials plugin. It ships a single script that installs a global:

```html
<script src="https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js"></script>
```

```js
const pane = new Tweakpane.Pane({ container: $("#dials"), title: "Sheet" });
const params = { travel: 320, fade: true, accent: "#0e7869" };
pane.addBinding(params, "travel", { min: 40, max: 600, step: 10 });
pane.addBinding(params, "fade");
pane.addBinding(params, "accent");
pane.on("change", () => render(params));
```

Its values live in the object you bind, so `params` is the config and the defaults at once and no `resolve()` is needed; its theme is a set of `--tp-*` variables rather than a `data-theme`. Reach for it for the control, not for the look: dialkit's spring editor and its inferred ranges are the reason this kit defaults to dialkit.
