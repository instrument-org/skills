# Storyboard patterns

Vocabulary only a storyboard uses. The page is plain HTML: a header, a grid of `<figure>`s, one line under. What takes work is the panels, and the panels are composed from the kit below.

## The kit

It ships, in both languages, as a library you import rather than code to copy:

- `scripts/panels.mjs` -- `node`, no dependencies
- `scripts/panels.py` -- `python`, no dependencies

The same functions, the same arguments, the same SVG out; take whichever language the rest of the task is in. Run either directly (`node panels.mjs`, `python panels.py`) to print a sample panel and check it runs in your environment.

Write a script of your own, import the kit **by its full path from where you are**, build each panel as a list of pieces, and paste the SVG it prints into the page. Every piece is positioned against the panel's floor, which `FLOOR(h)` gives for a panel of height `h`, so a panel of any aspect keeps everyone on the ground.

| Call                             | Draws                                                              |
| -------------------------------- | ------------------------------------------------------------------ |
| `panel(parts, { w, h, label })`  | The frame. `label` is its aria-label: say what it shows            |
| `person(x, floorY)`              | Standing. Returns `{ svg, hand }`, so a thing can go in the hand   |
| `sitter(x, floorY)`              | Seated, hips where `chair` and `sofa` put a seat                   |
| `closeup(x, bottom)`             | Head and shoulders, large, cropped by the panel edge               |
| `door` `counter` `desk` `table`  | The set. `counter` and `desk` hide what is behind them             |
| `chair` `sofa`                   | The set a person sits in: `part` is `"back"`, `"front"` or `"all"` |
| `screen(x, y)` `phone(x, y)`     | A monitor, or a phone whose `rows` fill its screen                 |
| `box` `van` `clock(x, y, h, m)`  | A parcel, a vehicle, a time                                        |
| `bubble(x, y, text, tail)`       | Speech, or `kind: "think"`                                         |
| `label(x, y, text)` `dots(x, y)` | A word in the scene; waiting                                       |
| `move(x1, y1, x2, y2, "PAN")`    | A camera move, for a shot list                                     |

Shared options: `tone` (`INK` the subject, `SOFT` anyone else, `ACCENT` the one the beat is about), `facing` (`1` right, `-1` left), `scale` (under one puts someone further away), `arm`.

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
} from "<skill>/templates/storyboard/scripts/panels.mjs";

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
