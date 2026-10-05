// Write an Excalidraw scene from named pieces, so a board's author never types
// a coordinate twice. Import it from a script of your own and call `write`:
//
//   import { box, arrow, write } from "<this file>";
//   const a = box(40, 0, 200, 80, "order lands", { fill: SAND });
//   const b = box(340, 0, 200, 80, "stock check");
//   arrow(a, b, { label: "then" });
//   write("scene.json", "How an order moves");
//
// Then paste scene.json into the page's `#scene` block. Run this file directly
// (`node board.mjs`) to write a sample scene and check the kit runs here.
//
// Two references have to point both ways or Excalidraw drops them silently on
// the way in: a container's text (containerId <-> boundElements) and an arrow's
// ends (startBinding / endBinding <-> boundElements). Every function here makes
// both. Everything else Excalidraw fills in for itself, so a board names only
// what it decided.
//
// State is module-level, which is what keeps the calls short: one run writes
// one board, and `write` clears the buffer so a script may write several.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const INK = "#1e1e1e";
export const RED = "#b4324f";
export const GREEN = "#0e7869";
export const MUTED = "#6d655f";
export const SAND = "#f6efe6";
export const SAGE = "#d8e6e1";
export const BLUSH = "#f3d9d9";
export const CREAM = "#fbf5e6";

let els = [];
let files = {};
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
function bind(host, label, size, color) {
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
    strokeColor: color ?? host.strokeColor,
    containerId: host.id,
  });
  host.boundElements.push({ id: t.id, type: "text" });
  return t;
}

// --- things -------------------------------------------------------------------

/** A box, with a label that moves with it. `square` drops the rounded corners. */
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
  if (label) bind(b, label, size, color);
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

/** A straight line between two points, bound to nothing. */
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
function port(a, b, gap) {
  const [ax, ay] = [a.x + a.width / 2, a.y + a.height / 2];
  const [bx, by] = [b.x + b.width / 2, b.y + b.height / 2];
  if (Math.abs(bx - ax) >= Math.abs(by - ay)) {
    const s = Math.sign(bx - ax) || 1;
    return [ax + (s * a.width) / 2 + s * gap, ay];
  }
  const s = Math.sign(by - ay) || 1;
  return [ax, ay + (s * a.height) / 2 + s * gap];
}

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

/** An SVG onto the board, as an image the reader can move, scale and export. */
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

/** A named region around a set of things, sized from what it holds. Excalidraw
 *  moves a frame's members with it and can export one frame alone. */
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
  // An ellipse through a box's corners is wider than the box, so it gets air.
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

// --- the file -------------------------------------------------------------------

/** Every reference resolves, and both ways. Throws rather than writing a scene
 *  whose labels or arrows Excalidraw would drop without saying so. */
function audit() {
  const by = new Map(els.map((e) => [e.id, e]));
  const claims = (host, child) =>
    (by.get(host)?.boundElements ?? []).some((b) => b.id === child);
  for (const e of els) {
    if (e.containerId && !claims(e.containerId, e.id)) {
      throw new Error(
        `text ${e.id} names container ${e.containerId}, which does not claim it back`,
      );
    }
    for (const k of ["startBinding", "endBinding"]) {
      if (e[k] && !claims(e[k].elementId, e.id)) {
        throw new Error(
          `arrow ${e.id} binds ${e[k].elementId}, which does not claim it back`,
        );
      }
    }
    if (e.frameId && !by.has(e.frameId))
      throw new Error(`${e.id} names a frame that is not here`);
    if (e.type === "image" && !files[e.fileId])
      throw new Error(`image ${e.id} has no file`);
  }
}

/** Writes the scene and clears the buffer. `grid` is the spacing in board units
 *  for a plan, or null for everything else; `name` is what an export is called. */
export function write(
  path,
  name,
  { grid = null, background = "#ffffff" } = {},
) {
  audit();
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
    `${path}: ${els.length} elements, ${Object.keys(files).length} file(s), ${(out.length / 1024).toFixed(1)} KB`,
  );
  els = [];
  files = {};
  n = 0;
  return scene;
}

// Run directly to check the kit works here.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  text(0, 0, "A sample board", { size: 28 });
  const a = box(0, 70, 200, 80, "a thing", { fill: SAND });
  const b = box(320, 70, 200, 80, "what it leads to", { fill: SAGE });
  arrow(a, b, { label: "then" });
  note(0, 220, 240, 70, "and what to notice");
  write(process.argv[2] ?? "sample.excalidraw.json", "A sample board");
}
