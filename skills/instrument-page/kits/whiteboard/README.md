# Whiteboard kit

A page that is a real Excalidraw editor with the drawing already on it, fitted to the window. The reader moves things, adds to them, exports a picture, or saves the `.excalidraw` file, with every tool they would have on excalidraw.com. The argument is what the arrangement makes visible, and the reader argues back by dragging.

## When to reach for it

When the answer is a drawing someone will keep working on. Four shapes come up:

- **A flow.** Boxes joined by arrows, where the finding is one step: the one nobody owns, the one that takes twelve days, the one that loops.
- **A plan.** Something already spatial (a floor, a site, a garden), drawn to a stated unit, so a dragged table moves a distance the plan can name.
- **A sheet.** Things judged side by side at the size they are judged: icon candidates at phone size, three logo marks, four layouts of one screen.
- **A wall.** Notes sorted into groups by hand, where the grouping is a judgment the reader should be able to move.

"Put it on a board", "draw this out", "let me move things around", "I want to take this into Excalidraw" are the phrases. Not for a finished diagram that only needs looking at: an inline SVG in an ordinary page costs nothing and prints. Not for a sequence of screens or moments in a person's day. Not for many rows to sort and filter. **If the reader would never drag anything, there is no board here**, only a picture that costs a megabyte.

## Files

- `skeleton.html`: the whole page on the foundation. The board fills the window; a small name card (the page's `h1` and one line) sits in the middle of Excalidraw's footer on a wide window and under its top bar on a phone, never taking a click. It carries the scene block, the plain-SVG sketch that shows until the editor lands (and for good if it never does), and the editor mount.
- `scripts/board.mjs`, `scripts/board.py`: the kit that writes the scene. Same calls, same output, no dependencies. Run either directly to write a sample and check your environment.
- `patterns.md`: every call, coordinates and sizes, plans to scale, sheets of SVG things, marker, frames.

## How it sits on the foundation

Copy `skeleton.html` to the task folder as `page.html`, replace the capitalized placeholders (direction comment, title, description, `h1`, the line under it, the board's `aria-label`), paste the scene, and build with `node <skill>/page.mjs page.html --inputs <inputs> request.md` like any page. The `h1` says the point, as on every page; the board's own first text is the topic. The editor follows the page's theme through `window.__instrumentTheme()` and the `instrument:theme` event, so the share widget's switch reaches it.

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
  note(600, 440, 300, 100, "12 of 14 days wait here:\nnobody owns this queue", {
    stroke: RED,
  }),
  held,
  { stroke: RED },
);
text(
  40,
  600,
  "Medians from the ticket log. Positions are a sketch; move anything.",
  { size: 14, color: MUTED, font: 2 },
);
write("scene.json", "How a refund moves");
```

Then paste `scene.json` whole into the `<script type="application/json" id="scene">` block, set the `h1` to the point ("Refunds over $50 wait 12 days on finance"), and build. The check measures the sketch, which is what a reader sees before the editor arrives; look at the desktop picture.

## Rules

- **Write the scene with the kit, never by hand.** A label needs `containerId` one way and `boundElements` the other; an arrow needs `startBinding`, `endBinding` and `boundElements` on both ends. Without them Excalidraw silently drops the label, or leaves the arrow behind when its box is dragged. `write` refuses a scene where a reference does not point both ways.
- **Bind everything that belongs together**: labels to boxes, arrows to both ends, region members inside a `frame`.
- **One unit, said once.** A plan states its scale in a corner and its grid is that unit; a sheet states the size things are judged at and draws them at it. A flow needs neither.
- **Marker is commentary, and it is on the board.** Two to four rings, notes and strokes in one marker color, each anchored to a thing, saying what the board shows. They are elements, so the reader can move them and an export keeps them.
- **Provenance is on the board** too, in the plain face in a corner: what the drawing rests on, what is measured and what is judgment, and that the reader's changes stay in their copy (the way to send a changed board on is to export it).
- **Fit on open** and **follow the theme**: the skeleton does both.

Refusals: a board nobody would drag; prose, sections or a footer outside the board; a label without its back-reference or an arrow without bindings; a plan with no scale, or furniture sized for the layout rather than the room; a finding in prose rather than in marker beside the thing; facts that live only in an image on the board; a scene fetched or generated at runtime rather than carried in the page; more than about 150 elements.

Honesty: a board's authority is its coordinates. Say on the board whether the placement is traced from a measured drawing or laid out by eye. A figure in a note comes from the prompt, a source, or arithmetic over what is shown, or it does not appear.

## What it loads, and what survives without it

Excalidraw 0.18.1 from esm.sh with React and ReactDOM 19.2.5 pinned and named again in `?deps=`, so one React runs through the graph; its stylesheet by path; its fonts through `EXCALIDRAW_ASSET_PATH`. About 1.2 MB, which the board earns because the editor is the page. A framed viewer whose Content Security Policy does not name esm.sh never loads it and shows the sketch. Offline, the sketch draws every shape, arrow, label, image and note in plain type, and the scene is in the file as text, so nothing a reader needs is lost but the dragging.

On a phone the board is fitted to the window, so a wide board's text is small until the reader pinches. The board's `figure` carries `data-zoom`, which tells the layout check (`lib/probe.js`) the reader zooms it, so its text size on a phone is not held to the 11px floor; nothing else on the page may carry it. Keep the board compact anyway (a flow of six to eight steps, wrapped onto two rows if it runs wide) so the first look on a phone is legible.
