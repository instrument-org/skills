# Storyboard patterns

Vocabulary only a storyboard uses. The page is plain HTML: a header, a grid of `<figure>`s, one line under. What takes work is the panels, and the panels are composed from the kit below.

## The kit

Save it beside a scratch script, write each panel as a call to `panel([...pieces])`, run it with `node`, and paste the SVG strings into the page. Every piece is positioned against the panel's floor, which `FLOOR(h)` gives for a panel of height `h`, so a panel of any aspect keeps everyone on the ground.

```js
// A cast and a set, so a storyboard is composed rather than drawn.
//
// Every piece returns SVG for one panel. People are thick round-capped strokes
// in one flat color, which reads as a pictogram; the set is thin outline
// behind them. That contrast is what keeps a composed scene looking deliberate
// rather than unfinished. One accent color per panel, on the thing the beat is
// about, and nothing else.
//
// Furniture a person sits in or stands behind comes in two pieces, `back` and
// `front`, drawn either side of the person. Without that their shins cross
// the cushion, which is the one mistake that reads as a drawing error.

export const INK = "var(--color-gray-700)";
export const SOFT = "var(--color-gray-400)";
export const LINE = "var(--color-gray-300)";
export const PALE = "var(--color-gray-100)";
export const CARD = "var(--color-card)";
export const ACCENT = "var(--color-brand-600)";
export const ACCENT_PALE = "var(--color-brand-100)";

const s = (d, { stroke = INK, width = 2, fill = "none", cap = "round" } = {}) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;

const esc = (t) => t.replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"));

// --- the panel ----------------------------------------------------------------

/** A panel of `w` by `h` with the floor 32 above the bottom edge. Pieces take
 *  `floor` from here, so a panel of any aspect keeps everyone on the ground. */
export function panel(parts, { w = 400, h = 300, label = "" } = {}) {
  const aria = label ? ` aria-label="${esc(label)}"` : "";
  return `<svg viewBox="0 0 ${w} ${h}" class="block w-full" role="img"${aria}>${parts.filter(Boolean).join("")}</svg>`;
}

export const FLOOR = (h = 300) => h - 32;

// --- the set ------------------------------------------------------------------

export const floor = (floorY, { w = 400, stroke = LINE } = {}) =>
  s(`M 0 ${floorY} H ${w}`, { stroke });

export function door(
  x,
  floorY,
  { w = 70, h = 160, stroke = INK, open = false } = {},
) {
  const top = floorY - h;
  const leaf = `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="2" fill="${CARD}" stroke="${stroke}" stroke-width="2"/>`;
  return open
    ? leaf +
        s(`M ${x + w} ${top} l 30 -12 v ${h + 24} l -30 -12`, {
          stroke,
          fill: PALE,
        })
    : leaf +
        `<circle cx="${x + w - 13}" cy="${top + h / 2}" r="3.5" fill="${stroke}"/>`;
}

/** Solid, so whoever stands behind it shows from the chest up. Draw it after them. */
export function counter(
  x,
  floorY,
  { w = 150, h = 86, stroke = INK, fill = PALE } = {},
) {
  const top = floorY - h;
  return (
    `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
    s(`M ${x - 6} ${top} h ${w + 12}`, { stroke, width: 3 })
  );
}

/** Filled top, so a person drawn before it is cut off at the desk edge. */
export function desk(x, floorY, { w = 170, h = 74, stroke = INK } = {}) {
  const top = floorY - h;
  return (
    `<rect x="${x}" y="${top}" width="${w}" height="7" fill="${CARD}" stroke="${stroke}" stroke-width="2"/>` +
    s(`M ${x + 12} ${top + 7} V ${floorY}`, { stroke }) +
    s(`M ${x + w - 12} ${top + 7} V ${floorY}`, { stroke })
  );
}

export function table(x, floorY, { w = 120, stroke = INK } = {}) {
  const top = floorY - 62;
  return (
    `<rect x="${x}" y="${top}" width="${w}" height="6" fill="${CARD}" stroke="${stroke}" stroke-width="2"/>` +
    s(`M ${x + w / 2} ${top + 6} V ${floorY}`, { stroke, width: 3 })
  );
}

/** Side view, seat at floor-46, which is where `sitter` puts its hips. Two pieces. */
export function chair(
  x,
  floorY,
  { facing = 1, stroke = INK, part = "all" } = {},
) {
  const seat = floorY - 46;
  const spine = x - 20 * facing;
  const back =
    s(`M ${spine} ${seat} V ${seat - 54}`, { stroke, width: 3 }) +
    s(`M ${spine} ${seat} V ${floorY}`, { stroke });
  const front =
    s(`M ${x - 26} ${seat} h 52`, { stroke, width: 3 }) +
    s(`M ${x + 18 * facing} ${seat} V ${floorY}`, { stroke });
  return { all: back + front, back, front }[part];
}

export function sofa(
  x,
  floorY,
  { w = 150, stroke = INK, fill = PALE, part = "all" } = {},
) {
  const seat = floorY - 44;
  const back = `<rect x="${x}" y="${seat - 46}" width="${w}" height="46" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const front =
    `<rect x="${x - 8}" y="${seat}" width="${w + 16}" height="26" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
    s(`M ${x - 2} ${seat + 26} V ${floorY}`, { stroke }) +
    s(`M ${x + w + 2} ${seat + 26} V ${floorY}`, { stroke });
  return { all: back + front, back, front }[part];
}

export function screen(
  x,
  y,
  { w = 86, h = 58, stroke = INK, fill = CARD, lines = 2, stand = true } = {},
) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  for (let i = 0; i < lines; i++)
    out += s(
      `M ${x + 12} ${y + 16 + i * 13} h ${Math.max(16, w - 24 - i * 18)}`,
      { stroke, width: 2.5 },
    );
  if (stand)
    out += s(`M ${x + w / 2} ${y + h} v 9 m -13 0 h 26`, {
      stroke,
      width: 2.5,
    });
  return out;
}

/** A phone at true proportion, with a few grey bars and one accent button.
 *  `rows` is what the screen shows: bars, a button, or a big word. */
export function phone(
  x,
  y,
  {
    h = 150,
    stroke = INK,
    rows = ["bar", "bar", "button"],
    accent = ACCENT,
  } = {},
) {
  const w = Math.round(h * 0.48);
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.08}" fill="${CARD}" stroke="${stroke}" stroke-width="2.5"/>`;
  let cy = y + h * 0.16;
  for (const row of rows) {
    if (row === "bar")
      out += s(`M ${x + w * 0.16} ${cy} h ${w * 0.68}`, {
        stroke: SOFT,
        width: h * 0.035,
      });
    else if (row === "short")
      out += s(`M ${x + w * 0.16} ${cy} h ${w * 0.4}`, {
        stroke: SOFT,
        width: h * 0.035,
      });
    else if (row === "button")
      out += `<rect x="${x + w * 0.16}" y="${cy - h * 0.045}" width="${w * 0.68}" height="${h * 0.09}" rx="${h * 0.02}" fill="${accent}"/>`;
    else if (row === "field")
      out += `<rect x="${x + w * 0.16}" y="${cy - h * 0.045}" width="${w * 0.68}" height="${h * 0.09}" rx="${h * 0.02}" fill="none" stroke="${SOFT}" stroke-width="1.5"/>`;
    else if (row === "tick")
      out +=
        `<circle cx="${x + w / 2}" cy="${cy}" r="${h * 0.07}" fill="${accent}"/>` +
        s(
          `M ${x + w / 2 - h * 0.03} ${cy} l ${h * 0.02} ${h * 0.025} l ${h * 0.045} -${h * 0.05}`,
          { stroke: "#fff", width: 2 },
        );
    else
      out += `<text x="${x + w / 2}" y="${cy + h * 0.02}" text-anchor="middle" font-size="${h * 0.06}" font-weight="600" fill="${stroke}" style="font-family:inherit">${esc(row)}</text>`;
    cy += h * 0.13;
  }
  return out;
}

export function box(x, y, { w = 34, h = 30, stroke = INK, fill = PALE } = {}) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
    s(`M ${x + w / 2} ${y} v ${h}`, { stroke, width: 1.5 })
  );
}

export function van(
  x,
  floorY,
  { w = 200, stroke = INK, fill = PALE, facing = 1 } = {},
) {
  const h = 96;
  const top = floorY - h - 10;
  const body = `<path d="M ${x} ${top + h} V ${top + 10} h ${w * 0.62} l ${w * 0.16} ${h * 0.45} h ${w * 0.22} V ${top + h} Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
  const wheels = [x + w * 0.2, x + w * 0.8]
    .map(
      (cx) =>
        `<circle cx="${cx}" cy="${floorY - 10}" r="14" fill="${CARD}" stroke="${stroke}" stroke-width="2.5"/>`,
    )
    .join("");
  const win = `<path d="M ${x + w * 0.64} ${top + 16} h ${w * 0.11} l ${w * 0.1} ${h * 0.3} h -${w * 0.21} Z" fill="${CARD}" stroke="${stroke}" stroke-width="2"/>`;
  const flip =
    facing === -1 ? ` transform="translate(${2 * x + w} 0) scale(-1 1)"` : "";
  return `<g${flip}>${body}${win}${wheels}</g>`;
}

export function clock(x, y, hour, minute, { r = 21, stroke = SOFT } = {}) {
  const hh = ((hour % 12) * 30 + minute * 0.5 - 90) * (Math.PI / 180);
  const mm = (minute * 6 - 90) * (Math.PI / 180);
  return (
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${CARD}" stroke="${stroke}" stroke-width="2"/>` +
    s(
      `M ${x} ${y} L ${(x + Math.cos(hh) * r * 0.48).toFixed(1)} ${(y + Math.sin(hh) * r * 0.48).toFixed(1)}`,
      { stroke, width: 2.5 },
    ) +
    s(
      `M ${x} ${y} L ${(x + Math.cos(mm) * r * 0.76).toFixed(1)} ${(y + Math.sin(mm) * r * 0.76).toFixed(1)}`,
      { stroke, width: 2 },
    )
  );
}

// --- the cast -----------------------------------------------------------------

/** Standing. Returns { svg, hand } so a thing can be put in the hand.
 *  arm: down | out | up | hold | pocket. facing: 1 right, -1 left. */
export function person(
  x,
  floorY,
  { facing = 1, arm = "down", tone = INK, scale = 1 } = {},
) {
  const k = scale;
  const [headR, headY, neck, hip, shoulder, limb] = [
    14 * k,
    floorY - 128 * k,
    floorY - 110 * k,
    floorY - 62 * k,
    floorY - 100 * k,
    9 * k,
  ];
  const hand = {
    down: [x + 15 * k * facing, hip + 4 * k],
    out: [x + 40 * k * facing, shoulder + 6 * k],
    up: [x + 24 * k * facing, shoulder - 34 * k],
    hold: [x + 24 * k * facing, shoulder + 26 * k],
    pocket: [x + 17 * k * facing, hip - 2 * k],
  }[arm];
  const svg =
    `<circle cx="${x}" cy="${headY}" r="${headR}" fill="${tone}" stroke="${tone}" stroke-width="2"/>` +
    s(`M ${x} ${neck} V ${hip}`, { stroke: tone, width: 15 * k }) +
    s(`M ${x} ${hip} L ${x - 10 * k} ${floorY}`, {
      stroke: tone,
      width: limb,
    }) +
    s(`M ${x} ${hip} L ${x + 11 * k} ${floorY}`, {
      stroke: tone,
      width: limb,
    }) +
    s(`M ${x} ${shoulder + 3 * k} L ${hand[0]} ${hand[1]}`, {
      stroke: tone,
      width: limb,
    });
  return { svg, hand };
}

/** Seated, hips at the seat height a chair or sofa gives. arm: lap | out | up. */
export function sitter(
  x,
  floorY,
  { facing = 1, arm = "lap", tone = INK, scale = 1 } = {},
) {
  const k = scale;
  const seat = floorY - 46 * k;
  const [headR, headY, neck, kneeX, limb] = [
    14 * k,
    seat - 96 * k,
    seat - 78 * k,
    x + 40 * k * facing,
    9 * k,
  ];
  const hand = {
    lap: [x + 26 * k * facing, seat - 10 * k],
    out: [x + 48 * k * facing, seat - 50 * k],
    up: [x + 20 * k * facing, seat - 104 * k],
  }[arm];
  const svg =
    `<circle cx="${x}" cy="${headY}" r="${headR}" fill="${tone}" stroke="${tone}" stroke-width="2"/>` +
    s(`M ${x} ${neck} V ${seat}`, { stroke: tone, width: 15 * k }) +
    s(`M ${x} ${seat} H ${kneeX} V ${floorY}`, { stroke: tone, width: limb }) +
    s(`M ${x} ${neck + 12 * k} L ${hand[0]} ${hand[1]}`, {
      stroke: tone,
      width: limb,
    });
  return { svg, hand };
}

/** Head and shoulders, large: the close-up. The panel edge crops the body. */
export function closeup(x, bottom, { facing = 1, tone = INK, scale = 1 } = {}) {
  const k = scale;
  const headR = 44 * k;
  const headY = bottom - 150 * k;
  return (
    `<path d="M ${x - 120 * k} ${bottom} q 20 -80 120 -80 q 100 0 120 80 Z" fill="${tone}"/>` +
    `<circle cx="${x + 6 * k * facing}" cy="${headY}" r="${headR}" fill="${tone}"/>`
  );
}

// --- what they say, and what to notice ------------------------------------------

export function bubble(
  x,
  y,
  text,
  tail,
  { kind = "say", tone = INK, fill = CARD, size = 14 } = {},
) {
  const w = Math.max(76, Math.round(text.length * size * 0.53) + 24);
  const h = size + 20;
  const [ax, ay] = [x + w / 2, y + h];
  const [tx, ty] = tail;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${tone}" stroke-width="2"/>`;
  if (kind === "say")
    out += s(`M ${ax - 9} ${ay - 3} L ${tx} ${ty} L ${ax + 9} ${ay - 3} Z`, {
      stroke: tone,
      fill,
    });
  else
    for (const [i, f] of [0.4, 0.72].entries())
      out += `<circle cx="${(ax + (tx - ax) * f).toFixed(0)}" cy="${(ay + (ty - ay) * f).toFixed(0)}" r="${5.5 - i * 2}" fill="${fill}" stroke="${tone}" stroke-width="2"/>`;
  out += `<text x="${ax}" y="${(y + h / 2 + size * 0.35).toFixed(0)}" text-anchor="middle" font-size="${size}" fill="${tone}" style="font-family:inherit">${esc(text)}</text>`;
  return out;
}

export function label(
  x,
  y,
  text,
  { size = 13, tone = SOFT, anchor = "middle", weight = 400 } = {},
) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${tone}" font-weight="${weight}" style="font-family:inherit">${esc(text)}</text>`;
}

export function dots(x, y, { n = 3, tone = SOFT, gap = 13 } = {}) {
  return Array.from(
    { length: n },
    (_, i) => `<circle cx="${x + i * gap}" cy="${y}" r="3.5" fill="${tone}"/>`,
  ).join("");
}

/** A camera move, drawn outside the picture's logic: a thin accent arrow with a word. */
export function move(x1, y1, x2, y2, word, { tone = ACCENT } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = [1, -1]
    .map((k) =>
      s(
        `M ${x2} ${y2} L ${x2 - Math.cos(a + k * 0.5) * 12} ${y2 - Math.sin(a + k * 0.5) * 12}`,
        { stroke: tone, width: 2 },
      ),
    )
    .join("");
  return (
    s(`M ${x1} ${y1} L ${x2} ${y2}`, { stroke: tone, width: 2 }) +
    head +
    label((x1 + x2) / 2, Math.min(y1, y2) - 8, word, {
      size: 11,
      tone,
      weight: 600,
    })
  );
}
```

## A panel, in calls

```js
import {
  ACCENT,
  FLOOR,
  box,
  clock,
  door,
  floor,
  label,
  panel,
  person,
} from "./kit.mjs";

const F = FLOOR(); // 268, for the default 400 by 300
const ash = person(150, F, { arm: "hold" });
const svg = panel(
  [
    floor(F),
    door(232, F, { w: 78, h: 172 }),
    ash.svg,
    box(ash.hand[0] - 6, ash.hand[1] - 4, { w: 30, h: 34 }),
    clock(340, 62, 8, 55),
    label(271, F - 96, "PASS ONLY", { size: 11, weight: 600 }),
  ],
  { label: "Ash outside a closed door holding a bag, clock at 08:55" },
);
```

`person` and `sitter` return `{ svg, hand }`, so a thing can be put in the hand. The `label` option becomes the panel's `aria-label`, which is the text a screen reader gets for the drawing; write it as what the panel shows.

## Draw order

Back to front, always: the floor, the set behind the person, the person, the set in front of the person, then bubbles and labels. Furniture with a `part` option is the set that has a front: `sofa` and `chair`. `counter` is drawn after the person behind it, so they show from the chest up; `desk` has a filled top for the same reason.

```js
panel([
  floor(F),
  sofa(96, F, { w: 160, part: "back" }),
  sitter(132, F).svg,
  sofa(96, F, { w: 160, part: "front" }),
]);
```

## The three shapes

**Moments in a day.** 400 by 300 panels in a grid of three, a number top left, a time top right, the caption under, a line of speech under that in italic when there is one.

**A shot list.** 480 by 270 panels two across. The top left says the number and the kind of shot (`WIDE`, `CLOSE`), the top right the timecode in monospace. The caption is what the camera sees; the line said over it is the second column, in monospace and the brand color, because it is copy. `closeup(x, bottom)` is the head-and-shoulders for a close shot, cropped by the panel edge; `move(x1, y1, x2, y2, "PAN")` draws a camera move as a thin accent arrow outside the picture's own logic.

**Two tracks.** One wide panel per row, 560 by 260, the person in the left two thirds and a `phone` at one size in the right third, with a dashed rule between and the caption to the right of the panel. Keep the phone at the same position in every row, so the screens line up down the page and the eye compares them.

## The phone

`phone(x, y, { h, rows })` draws a phone at true proportion and fills its screen from `rows`: `"bar"` and `"short"` are grey lines standing in for text, `"field"` an empty input, `"button"` the accent button, `"tick"` a done mark, and any other string is set as a word on the screen. Four or five rows fit; a word longer than about fourteen characters does not.

## People

`person(x, floorY, { facing, arm, tone, scale })` stands; `sitter(x, floorY, { facing, arm, tone, scale })` sits with hips at the seat height `chair` and `sofa` give. `arm` is `down`, `out`, `up`, `hold` or `pocket` standing and `lap`, `out` or `up` sitting. `facing` is `1` for right and `-1` for left. `tone` is `INK` for the subject, `SOFT` for anyone else in the scene, `ACCENT` for the one person the beat is about. `scale` under one puts someone further away.

## The rest of the set

`door` (`open: true` for an open one), `counter`, `desk`, `table`, `screen` (a monitor, `lines` of grey text, `stand: false` for a laptop lid), `box` (a parcel or a bag), `van` (`facing: -1` to point it left), `clock(x, y, hour, minute)`, `dots(x, y)` for waiting, `bubble(x, y, text, [tailX, tailY], { kind: "say" | "think" })`, and `label(x, y, text)` for a word in the scene, in the muted tone unless it is the accent.
