# Whiteboard patterns

Vocabulary only a board uses. The page, the fallback drawing and the editor mount are in `main.html` and do not change from board to board; what changes is the scene, and the scene is written with the kit below.

## The kit

Save it beside a scratch script, write the board as calls, run it with `node`, and paste the JSON it writes into the page's `#scene` block. Every call returns the element it made, so a later call can bind to it, ring it, or put it in a frame.

```js
// A board is a list of Excalidraw elements. This is the kit that writes them,
// so a page's author names things and never types a coordinate twice.
//
// Two references have to point both ways or Excalidraw drops them on the way
// in: a container's text (containerId <-> boundElements) and an arrow's ends
// (startBinding / endBinding <-> boundElements). Both are made here, never by
// hand. Everything else Excalidraw fills in for itself.

import { writeFileSync } from "node:fs";

export const INK = "#1e1e1e";
export const RED = "#b4324f";
export const GREEN = "#0e7869";
export const MUTED = "#6d655f";
export const SAND = "#f6efe6";
export const SAGE = "#d8e6e1";
export const BLUSH = "#f3d9d9";
export const CREAM = "#fbf5e6";

const els = [];
const files = {};
let n = 0;
const id = (p) => `${p}${++n}`;

const put = (el) => (els.push(el), el);

const shape = (type, x, y, w, h, o = {}) =>
  put({
    id: id(type[0]),
    type,
    x,
    y,
    width: w,
    height: h,
    strokeColor: INK,
    backgroundColor: "transparent",
    fillStyle: "solid",
    boundElements: [],
    ...(type === "rectangle" ? { roundness: { type: 3 } } : {}),
    ...o,
  });

/** Text that lives inside a shape and moves with it. */
const bind = (host, label, size = 20, o = {}) => {
  const lines = label.split("\n").length;
  const t = put({
    id: id("t"),
    type: "text",
    x: host.x + 12,
    y: host.y + host.height / 2 - (size * 1.25 * lines) / 2,
    width: Math.max(20, host.width - 24),
    height: size * 1.25 * lines,
    text: label,
    originalText: label,
    fontSize: size,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    strokeColor: o.color ?? host.strokeColor,
    containerId: host.id,
  });
  host.boundElements.push({ id: t.id, type: "text" });
  return t;
};

// --- things ------------------------------------------------------------------

/** A box with a label. `fill` names its color; `size` its type. */
export function box(
  x,
  y,
  w,
  h,
  label,
  {
    fill = "transparent",
    stroke = INK,
    size = 20,
    color,
    square = false,
    dash = false,
    weight,
  } = {},
) {
  const b = shape("rectangle", x, y, w, h, {
    backgroundColor: fill,
    strokeColor: stroke,
    ...(square ? { roundness: null } : {}),
    ...(dash ? { strokeStyle: "dashed" } : {}),
    ...(weight ? { strokeWidth: weight } : {}),
  });
  if (label) bind(b, label, size, { color });
  return b;
}

export function ellipse(
  x,
  y,
  w,
  h,
  label,
  { fill = "transparent", stroke = INK, size = 20, weight } = {},
) {
  const e = shape("ellipse", x, y, w, h, {
    backgroundColor: fill,
    strokeColor: stroke,
    ...(weight ? { strokeWidth: weight } : {}),
  });
  if (label) bind(e, label, size);
  return e;
}

export function diamond(
  x,
  y,
  w,
  h,
  label,
  { fill = "transparent", stroke = INK, size = 18 } = {},
) {
  const d = shape("diamond", x, y, w, h, {
    backgroundColor: fill,
    strokeColor: stroke,
  });
  if (label) bind(d, label, size);
  return d;
}

/** Text on its own. `font`: 1 hand-drawn, 2 plain, 3 monospace. */
export function text(
  x,
  y,
  s,
  { size = 20, color = INK, font = 1, align = "left", angle = 0 } = {},
) {
  const lines = s.split("\n");
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.55;
  return put({
    id: id("t"),
    type: "text",
    x: align === "center" ? x - w / 2 : align === "right" ? x - w : x,
    y,
    width: w,
    height: size * 1.25 * lines.length,
    text: s,
    originalText: s,
    fontSize: size,
    fontFamily: font,
    textAlign: align,
    verticalAlign: "top",
    strokeColor: color,
    angle,
  });
}

/** A straight line between two points. */
export function line(
  x1,
  y1,
  x2,
  y2,
  { stroke = INK, weight = 2, dash = false } = {},
) {
  return put({
    id: id("l"),
    type: "line",
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [
      [0, 0],
      [x2 - x1, y2 - y1],
    ],
    strokeColor: stroke,
    strokeWidth: weight,
    ...(dash ? { strokeStyle: "dashed" } : {}),
  });
}

/** Where an arrow should leave `a` for `b`: the middle of the facing edge. */
const port = (a, b, gap) => {
  const [ax, ay] = [a.x + a.width / 2, a.y + a.height / 2];
  const [bx, by] = [b.x + b.width / 2, b.y + b.height / 2];
  if (Math.abs(bx - ax) >= Math.abs(by - ay)) {
    const s = Math.sign(bx - ax) || 1;
    return [ax + (s * a.width) / 2 + s * gap, ay];
  }
  const s = Math.sign(by - ay) || 1;
  return [ax, ay + (s * a.height) / 2 + s * gap];
};

/** An arrow from shape `a` to shape `b`, bound at both ends so it follows a drag. */
export function arrow(
  a,
  b,
  { label, stroke = INK, size = 16, dash = false, weight } = {},
) {
  const gap = 6;
  const [x1, y1] = port(a, b, gap);
  const [x2, y2] = port(b, a, gap);
  const ar = put({
    id: id("a"),
    type: "arrow",
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [
      [0, 0],
      [x2 - x1, y2 - y1],
    ],
    strokeColor: stroke,
    ...(dash ? { strokeStyle: "dashed" } : {}),
    ...(weight ? { strokeWidth: weight } : {}),
    startBinding: { elementId: a.id, focus: 0, gap },
    endBinding: { elementId: b.id, focus: 0, gap },
    startArrowhead: null,
    endArrowhead: "arrow",
    boundElements: [],
  });
  a.boundElements.push({ id: ar.id, type: "arrow" });
  b.boundElements.push({ id: ar.id, type: "arrow" });
  if (label) {
    const t = put({
      id: id("t"),
      type: "text",
      x: (x1 + x2) / 2 - 30,
      y: (y1 + y2) / 2 - size * 0.625,
      width: 60,
      height: size * 1.25,
      text: label,
      originalText: label,
      fontSize: size,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      strokeColor: stroke,
      containerId: ar.id,
    });
    ar.boundElements.push({ id: t.id, type: "text" });
  }
  return ar;
}

/** An SVG drawn onto the board, as an image the reader can move and scale. */
export function pic(x, y, w, h, svg) {
  const fileId = id("f");
  files[fileId] = {
    id: fileId,
    mimeType: "image/svg+xml",
    dataURL: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"),
    created: 1757548800000,
  };
  return put({
    id: id("i"),
    type: "image",
    x,
    y,
    width: w,
    height: h,
    fileId,
    status: "saved",
    scale: [1, 1],
    boundElements: [],
  });
}

/** A named frame around a set of things, sized from what it holds. */
export function frame(name, members, { pad = 28 } = {}) {
  const x0 = Math.min(...members.map((m) => m.x)) - pad;
  const y0 = Math.min(...members.map((m) => m.y)) - pad - 8;
  const x1 = Math.max(...members.map((m) => m.x + m.width)) + pad;
  const y1 = Math.max(...members.map((m) => m.y + m.height)) + pad;
  const f = put({
    id: id("fr"),
    type: "frame",
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
    name,
    boundElements: [],
  });
  const inside = new Set(members.map((m) => m.id));
  for (const e of els) {
    if (inside.has(e.id) || (e.containerId && inside.has(e.containerId)))
      e.frameId = f.id;
  }
  return f;
}

/** A hand-drawn stroke through the given points, as the marker would. */
export function stroke(points, { stroke: color = RED, weight = 2 } = {}) {
  const [x0, y0] = points[0];
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return put({
    id: id("d"),
    type: "freedraw",
    x: x0,
    y: y0,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    points: points.map(([x, y]) => [x - x0, y - y0]),
    pressures: [],
    simulatePressure: true,
    strokeColor: color,
    strokeWidth: weight,
  });
}

/** A ring around one or more things: the marker's way of saying `these`. */
export function ring(members, { stroke = RED, pad = 22 } = {}) {
  const x0 = Math.min(...members.map((m) => m.x)) - pad;
  const y0 = Math.min(...members.map((m) => m.y)) - pad;
  const x1 = Math.max(...members.map((m) => m.x + m.width)) + pad;
  const y1 = Math.max(...members.map((m) => m.y + m.height)) + pad;
  // An ellipse through a box's corners is sqrt(2) wider than the box.
  const [cx, cy, w, h] = [
    (x0 + x1) / 2,
    (y0 + y1) / 2,
    (x1 - x0) * 1.2,
    (y1 - y0) * 1.35,
  ];
  return shape("ellipse", cx - w / 2, cy - h / 2, w, h, {
    strokeColor: stroke,
    strokeWidth: 2,
  });
}

/** A marker note: a pale box with colored ink, for what the board says about itself. */
export function note(
  x,
  y,
  w,
  h,
  label,
  { stroke = RED, fill = "#fbeaea", size = 18 } = {},
) {
  return box(x, y, w, h, label, { fill, stroke, size });
}

// --- the file ------------------------------------------------------------------

/** Writes the scene, named so an export from the board is named after the page. */
export function write(
  path,
  name,
  { grid = null, background = "#ffffff" } = {},
) {
  const scene = {
    type: "excalidraw",
    version: 2,
    source: "tryinstrument.com",
    elements: els,
    appState: {
      viewBackgroundColor: background,
      gridSize: grid,
      gridModeEnabled: grid !== null,
      name,
    },
    files,
  };
  const out = JSON.stringify(scene);
  writeFileSync(path, out);
  console.log(
    `${path}: ${els.length} elements, ${Object.keys(files).length} files, ${(out.length / 1024).toFixed(1)} KB`,
  );
}
```

## A board, in calls

```js
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
} from "./kit.mjs";

text(40, 0, "How a refund moves", { size: 28 });
text(40, 42, "drawn from the ticket log, week of 2 March", {
  size: 16,
  color: MUTED,
});

const asked = box(40, 120, 200, 84, "refund asked for", { fill: SAND });
const check = diamond(320, 90, 230, 144, "under £50?", { fill: SAND });
const paid = box(640, 50, 210, 76, "paid back", { fill: SAGE });
arrow(asked, check);
arrow(check, paid, { label: "yes" });

const held = ring([check]);
const why = note(610, 380, 300, 92, "12 days sat here, median");
arrow(why, held, { stroke: RED });

text(
  40,
  520,
  "Drawn from 118 tickets, 2 to 8 March. Every figure is illustrative.",
  { size: 14, color: MUTED, font: 2 },
);
write("scene.json", "How a refund moves");
```

## Coordinates

The board has no edges: the editor fits whatever was drawn to the window on open. Start the title at `(40, 0)`, lay the drawing out under it, and put the provenance note below the drawing. Sizes that read well at the fit: a box 200 by 80 with 20-point text, a title at 28, a marker note at 18, provenance at 14 in the plain face.

`fontFamily` is `1` for the hand-drawn face, `2` for plain, `3` for monospace. The title, labels and marker are hand-drawn; measurements, captions under images and the provenance note are plain, which is what makes them read as record rather than as drawing.

## A plan, to scale

Pick a unit, state it on the board, and derive every coordinate from it:

```js
const M = 80; // one meter
const m = (v) => Math.round(v * M);
const walls = box(0, 0, m(9), m(6), null, { square: true, weight: 4 });
const counter = box(m(0.4), m(2.2), m(0.9), m(3.2), "counter", {
  fill: SAND,
  size: 16,
  square: true,
});
write("scene.json", "The shop", { grid: 40 }); // half a meter
```

`square: true` turns off the rounded corners a box has by default, which walls and furniture want. An opening in a wall is a short line in the background color drawn over it, then a thin line for the door leaf. The grid is on for a plan and off for everything else.

## A sheet of things

An image element is an SVG the reader can move and scale, and a sheet draws each candidate twice: once large enough to see and once at the size it is judged, with a plain-face name under the pair:

```js
const icon = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const home = icon('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>');
const big = pic(40, 120, 96, 96, home);
const small = pic(76, 262, 24, 24, home);
text(88, 226, "home", { size: 16, color: MUTED, font: 2, align: "center" });
frame("Round two", [big, small]);
```

Draw the SVG on a small grid with a real stroke width, because that is what ships; an icon that looks fine at 96 and fills in at 24 is the finding a sheet exists to show.

## Marker

`ring(things)` draws an ellipse round one or more elements, with air. `note(x, y, w, h, text)` is a pale box in the marker color. `stroke(points)` is a freehand line, for a strike-through, an underline, or a route walked. `arrow(from, to, { stroke: RED })` joins a note to the thing it is about, and moves with both. All of it in one marker color per board, and every one of them a real element the reader can move or delete.

## Frames

`frame(name, members)` draws a named region round a set of elements and marks each as belonging to it, so Excalidraw moves them together and an export can be of one frame alone. A sheet has one frame per round; a plan has one per room; a wall has one per group.
