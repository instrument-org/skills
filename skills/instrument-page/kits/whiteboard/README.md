# Whiteboard kit

This kit makes a page that is a real Excalidraw editor, with the drawing already on it and fitted to the window. The reader can move things, add to them, export a picture, or save the `.excalidraw` file, with every tool they'd have on excalidraw.com. The arrangement makes the argument, and the reader can push back by dragging things around.

## When to use it

Use it when the answer is a drawing someone will keep working on. It usually takes one of four forms:

- **A flow**: boxes joined by arrows, where the finding is a single step, such as the one nobody owns, the one that takes twelve days, or the one that loops back.
- **A plan**: something that's already spatial (a floor, a site, a garden), drawn to a stated unit, so dragging a table moves it a distance the plan can name.
- **A sheet**: things judged side by side at the size they'll be judged at, such as icon candidates at phone size, three logo marks, or four layouts of one screen.
- **A wall**: notes sorted into groups by hand, where the grouping is a judgment the reader should be able to change.

You'll hear it in phrases like "put it on a board", "draw this out", "let me move things around" or "I want to take this into Excalidraw". Don't use it for a finished diagram that only needs looking at, since an inline SVG in an ordinary page costs nothing and prints. Don't use it for a sequence of screens or for moments in a person's day, or for many rows to sort and filter. **If the reader would never drag anything, the page doesn't need a board**, only a picture, and the board would add a megabyte for nothing.

## Files

- `skeleton.html` is the whole page on the foundation. The board fills the window. A small name card (the page's `h1` and one line) sits in the middle of Excalidraw's footer on a wide window and under its top bar on a phone, and it never catches a click. The skeleton holds the scene block, the plain-SVG sketch that shows until the editor loads (and stays if it never does), and the editor mount.
- `scripts/board.mjs` and `scripts/board.py` are the kit that writes the scene. They take the same calls, produce the same output, and need no dependencies. Run either one directly to write a sample and check your environment.
- `patterns.md` covers every call, coordinates and sizes, plans to scale, sheets of SVG things, marker and frames.

## How it sits on the foundation

Copy `skeleton.html` to the task folder as `page.html`, and replace the capitalized placeholders: the direction comment, title, description, `h1`, the line under it, and the board's `aria-label`. Paste in the scene, and build with `node <skill>/page.mjs page.html --inputs <inputs> request.md` like any other page. The `h1` states the point, as on every page, and the board's own first text names the topic. The editor follows the page's theme through `window.__instrumentTheme()` and the `instrument:theme` event, so the share widget's theme switch reaches it.

## Worked example

```js
// board.mjs in the task folder: node board.mjs
import {
  arrow,
  box,
  diamond,
  note,
  ring,
  text,
  write,
  MUTED,
  RED,
  SAND,
  SAGE,
} from "<skill>/kits/whiteboard/scripts/board.mjs";

text(40, 0, "How a refund moves", { size: 28 });
text(40, 42, "from last month's ticket log, 118 refunds", {
  size: 16,
  color: MUTED,
});
const asked = box(40, 140, 200, 84, "customer asks\nin chat", { fill: SAND });
const under = diamond(320, 110, 220, 144, "under $50?", { fill: SAND });
const same = box(640, 40, 220, 84, "support refunds\nsame day", { fill: SAGE });
const fin = box(640, 260, 220, 84, "finance approves", { fill: SAND });
arrow(asked, under);
arrow(under, same, { label: "yes" });
arrow(under, fin, { label: "no" });
const held = ring([fin]);
arrow(
  note(
    600,
    440,
    300,
    100,
    "12 of the 14 days are spent here.\nNobody owns this queue.",
    {
      stroke: RED,
    },
  ),
  held,
  { stroke: RED },
);
text(
  40,
  600,
  "Medians come from the ticket log. Positions are a sketch, so move anything.",
  { size: 14, color: MUTED, font: 2 },
);
write("scene.json", "How a refund moves");
```

Then paste all of `scene.json` into the `<script type="application/json" id="scene">` block, set the `h1` to the point ("Refunds over $50 wait 12 days on finance"), and build. The check measures the sketch, since that's what a reader sees before the editor arrives, so look at the desktop screenshot.

## Rules

- **Write the scene with the kit, never by hand.** A label needs `containerId` in one direction and `boundElements` in the other, and an arrow needs `startBinding`, `endBinding` and `boundElements` on both ends. Without them, Excalidraw silently drops the label, or leaves the arrow behind when someone drags its box. `write` refuses a scene where a reference doesn't point both ways.
- **Bind everything that belongs together**: labels to their boxes, arrows to both ends, and a region's members inside a `frame`.
- **State one unit, once.** A plan states its scale in a corner, and its grid uses that unit. A sheet states the size things are judged at and draws them at that size. A flow needs neither.
- **Marker is the commentary, and it lives on the board.** Use two to four rings, notes and strokes in one marker color, each anchored to a thing and saying what the board shows. They're elements, so the reader can move them and an export keeps them.
- **Say where the board comes from, on the board,** in the plain typeface in a corner: what the drawing is based on, what is measured and what is judgment, and that the reader's changes stay in their own copy (to pass a changed board on, they export it).
- **Fit the board to the window when it opens, and follow the theme.** The skeleton does both.

Don't make a board nobody would drag, or put prose, sections or a footer outside the board. Don't write a label without its back-reference or an arrow without its bindings. Don't draw a plan with no scale, or furniture sized to suit the layout instead of the room. Don't state a finding in prose when it belongs in marker beside the thing. Don't put facts only in an image on the board, fetch or generate the scene when the page opens instead of carrying it in the page, or use more than about 150 elements.

A board is only as trustworthy as its positions, so say on the board whether you traced them from a measured drawing or laid them out by eye. A figure in a note comes from the prompt, a source, or arithmetic over what the board shows. Otherwise, leave it out.

## What it loads, and what works without it

It loads Excalidraw 0.18.1 from esm.sh, with React and ReactDOM 19.2.5 pinned and named again in `?deps=` so a single React runs through the whole graph, plus its stylesheet by path and its fonts through `EXCALIDRAW_ASSET_PATH`. That's about 1.2 MB, which is worth it because the editor is the page. A framed viewer whose Content Security Policy doesn't allow esm.sh never loads it, and shows the sketch instead. Offline, the sketch draws every shape, arrow, label, image and note in plain type, and the scene is in the file as text, so the reader loses only the dragging.

On a phone the board is fitted to the window, so a wide board's text is small until the reader pinches to zoom. The board's `figure` carries `data-zoom`, which tells the layout check (`lib/probe.js`) that the reader zooms it, so its text isn't held to the 11px minimum on a phone. Nothing else on the page may carry `data-zoom`. Keep the board compact anyway, with a flow of six to eight steps wrapped onto two rows if it runs wide, so the first view on a phone is legible.
