# Storyboard kit

Draws an experience as it would be lived: a handful of panels with a person in each, one beat per panel, and a caption under each saying what that moment proves. A wireframe draws what is on the screen. A storyboard draws what is happening to the person, because some arguments can only be made about a Tuesday morning, not about an interface or a process.

## When to reach for it

Reach for it when someone asks what something would be like, how it would feel, or what happens to the customer, the new starter, the patient, or the driver. "Walk me through it", "what's the experience", "a day in the life", "storyboard this" are the phrases. Reach for it unprompted when a proposal keeps saying "the user then" and nobody has drawn the user. Three shapes come up:

- **Moments in a day**: six or so beats with a clock time on each, showing where an experience breaks or where a proposed one is better. 400 by 300 panels, three across.
- **A shot list**: what the camera sees, shot by shot, with the kind of shot, a timecode, and the line said over it set apart. 480 by 270 panels, two across.
- **Two tracks**: the person on one side of every panel and the phone in their hand on the other, so what they do and what they see line up down the page. 560 by 260, one per row.

Not for the interface itself (draw frames), for events in order with no person in them (a timeline), or for more than about eight beats.

## Files

- `scripts/panels.mjs`: the kit for `node`, no dependencies.
- `scripts/panels.py`: the same calls and byte-identical SVG for `python`, no dependencies.
- `patterns.md`: every call, the draw order, the three shapes, the phone, the cast.

Run either script directly (`node <skill>/kits/storyboard/scripts/panels.mjs`) to print a sample panel and check it runs here.

## How it sits on the page

A storyboard is an ordinary page on the stylesheet: a `header` with an `hgroup` and the `h1`, then a `.grid` of `figure`s, and that grid is the `class="hero"`. The panels are inline SVG colored with the stylesheet's tokens (`--gray-*`, `--paper`, `--muted`, `--accent`, `--wash`), so they follow both themes and print as drawn. Build and check it like any page:

```
node <skill>/page.mjs page.html --inputs <every input file> request.md
```

## Worked example

Write a script in the task folder that imports the kit by its full path, composes each panel back to front, and prints the SVG:

```js
// panels.mjs, in the task folder: node panels.mjs > panels.json
import {
  ACCENT,
  FLOOR,
  floor,
  door,
  box,
  clock,
  label,
  panel,
  person,
  sofa,
  sitter,
} from "<skill>/kits/storyboard/scripts/panels.mjs";

const F = FLOOR(); // the floor line for a 400 by 300 panel
const ash = person(150, F, { arm: "hold" });
const out = {
  locked: panel(
    [
      floor(F),
      door(232, F, { w: 78, h: 172 }),
      ash.svg,
      box(ash.hand[0] - 6, ash.hand[1] - 4, { w: 30, h: 34 }),
      clock(340, 62, 8, 55),
      label(271, F - 96, "PASS ONLY", { weight: 600 }),
    ],
    { label: "Ash outside a closed door holding a bag, clock at 08:55" },
  ),
  waiting: panel(
    [
      floor(F),
      sofa(70, F, { w: 170, part: "back" }),
      sitter(120, F).svg,
      sofa(70, F, { w: 170, part: "front" }),
      clock(340, 62, 9, 35, { stroke: ACCENT }),
    ],
    { label: "Ash on the lobby sofa, clock at 09:35" },
  ),
};
console.log(JSON.stringify(out));
```

Then paste each SVG into a figure, with its number and time over the drawing and the caption under it:

```html
<section>
  <div class="grid hero bleed" style="--min:17rem">
    <figure>
      <div class="frame">
        <span class="n">01</span><span class="t">08:55</span><svg ...></svg>
      </div>
      <figcaption>
        The badge fails at the first door, so day one starts locked out.
      </figcaption>
    </figure>
  </div>
</section>
```

`.frame` is the page's own: `position: relative`, `background: var(--paper)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`, with the number and time absolutely placed in its top corners in `var(--mono)` and `var(--muted)`.

## Rules

- **One floor.** Every piece is placed against `FLOOR(h)`, so standing and seated people land on the ground and in their seats.
- **Back, person, front.** Furniture someone sits in or stands behind (`sofa`, `chair`) is drawn in two parts either side of them, or their shins cross the cushion.
- **One accent per panel**, on the thing the beat is about: the clock that says forty minutes, the screen that finally works, the person who arrives. Everything else is ink and grey.
- **One beat per panel.** Something changes for the person between this panel and the next.
- **A person in every panel**, with at most one close-up on the thing in their hand.
- **The caption argues.** "Forty minutes on the sofa, watching everyone else badge through", not "Ash waits on a sofa".
- **Time on every panel**: a clock time, a timecode, or a step number.
- **Speech apart from sight.** Short speech in a `bubble`; a line that matters goes under the caption; on a shot list the voice-over is its own column in monospace.
- **Words in a panel stay readable on a phone.** A 400-wide panel shrinks to about 350 pixels, so `label` text stays at its default 13 or more; anything longer belongs in the caption.

## Refusals

- Prose sections that argue what the captions should.
- A panel with nobody in it (beyond one close-up), a beat that changes nothing, a caption that describes the picture.
- Thin stick figures, two accents in one panel, text laid over a drawing.
- A photo or generated image where a composed panel would do.
- More than eight beats.

## Honesty

Say in the footer what the beats are drawn from: interviews, a visit, a brief, or the prompt alone. A storyboard from interviews is evidence about how something is; one from a brief is a proposal, and the two look identical. Where a time, a name, a price or a line of dialogue was invented to fill a panel, say so there too.
