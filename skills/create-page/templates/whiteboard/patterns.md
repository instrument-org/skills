# Whiteboard patterns

Vocabulary only a board uses. The page, the fallback drawing and the editor mount are in `main.html` and do not change from board to board; what changes is the scene, and the scene is written with the kit below.

## The kit

It ships, in both languages, as a library you import rather than code to copy:

- `scripts/board.mjs` -- `node`, no dependencies
- `scripts/board.py` -- `python`, no dependencies

The same functions, the same arguments and the same output; take whichever language the rest of the task is in. Run either directly (`node board.mjs`, `python board.py`) to write a sample scene and check it runs in your environment before writing a board.

Write a script of your own, import the kit **by its full path from where you are**, and call `write` at the end. Then paste the JSON it writes into the page's `#scene` block.

Writing the JSON by hand instead is possible and is a bad trade: the two references every board depends on have to point both ways, and the kit is what makes them. `write` refuses a scene where one does not, rather than leaving you a board whose labels Excalidraw silently drops.

| Call                                     | Draws                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `box(x, y, w, h, label)`                 | A rounded box with a label bound to it. `square` for sharp corners |
| `ellipse` / `diamond(x, y, w, h, label)` | The same, other shapes                                             |
| `text(x, y, s)`                          | Text on its own. `font`: 1 hand-drawn, 2 plain, 3 monospace        |
| `line(x1, y1, x2, y2)`                   | A straight line, bound to nothing                                  |
| `arrow(a, b)`                            | An arrow between two things, bound at both ends. `label` rides it  |
| `pic(x, y, w, h, svg)`                   | An SVG as a movable, scalable image                                |
| `frame(name, members)`                   | A named region, sized from what it holds                           |
| `ring(members)`                          | A marker ring round one or more things                             |
| `note(x, y, w, h, label)`                | A pale marker note in the marker color                             |
| `stroke(points)`                         | A freehand line: a strike-through, an underline, a route walked    |
| `write(path, name)`                      | Checks every reference, writes the scene, clears the buffer        |

Shared options: `fill`, `stroke`, `size`, `weight`, `dash`. Colors are named: `INK`, `RED`, `GREEN`, `MUTED`, `SAND`, `SAGE`, `BLUSH`, `CREAM`.

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
} from "<skill>/templates/whiteboard/scripts/board.mjs";

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

The same board in Python, which is the same calls with keyword arguments:

```python
import sys

sys.path.insert(0, "<skill>/templates/whiteboard/scripts")
from board import MUTED, SAND, SAGE, arrow, box, diamond, text, write

text(40, 0, "How a refund moves", size=28)
text(40, 42, "drawn from the ticket log, week of 2 March", size=16, color=MUTED)

asked = box(40, 120, 200, 84, "refund asked for", fill=SAND)
check = diamond(320, 90, 230, 144, "under £50?", fill=SAND)
arrow(asked, check)
write("scene.json", "How a refund moves")
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
