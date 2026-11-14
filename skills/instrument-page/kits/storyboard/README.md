# Storyboard kit

This kit draws an experience as someone would live it: a handful of panels with a person in each, one beat per panel, and a caption under each saying what that moment shows. A wireframe draws what's on the screen. A storyboard draws what's happening to the person, because some arguments are about what someone's Tuesday morning is like, and an interface or a process diagram can't make them.

## When to use it

Use it when someone asks what something would be like, how it would feel, or what happens to the customer, the new starter, the patient or the driver. You'll hear it in phrases like "walk me through it", "what's the experience", "a day in the life" or "storyboard this". Use it without being asked when a proposal keeps saying "the user then" and nobody has drawn the user. It usually takes one of three forms:

- **Moments in a day**: six or so beats, each with a clock time, showing where an experience breaks down or where a proposed one is better. Panels are 400 by 300, three across.
- **A shot list**: what the camera sees, shot by shot, with the kind of shot, a timecode, and the line spoken over it set apart. Panels are 480 by 270, two across.
- **Two tracks**: the person on one side of every panel and the phone in their hand on the other, so what they do and what they see line up down the page. Panels are 560 by 260, one per row.

Don't use it for the interface itself (draw frames instead), for events in order with no person in them (use a timeline), or for more than about eight beats.

## Files

- `scripts/panels.mjs` is the kit for `node`, with no dependencies.
- `scripts/panels.py` takes the same calls and produces byte-identical SVG for `python`, with no dependencies.
- `patterns.md` covers every call, the draw order, the three forms, the phone and the cast.

Run either script directly (`node <skill>/kits/storyboard/scripts/panels.mjs`) to print a sample panel and confirm it runs here.

## How it sits on the page

A storyboard is an ordinary page on the stylesheet. It has a `header` with an `hgroup` and the `h1`, then a `.grid` of `figure`s, and that grid is the `class="hero"`. Three panels across need the room, so the grid takes `.bleed`. The panels are inline SVG colored with the stylesheet's tokens (`--gray-*`, `--paper`, `--muted`, `--accent`, `--wash`), so they follow both themes and print as drawn. Build and check it like any page:

```
node <skill>/page.mjs page.html --inputs <every input file> request.md
```

## Worked example

Write a script in the task folder that imports the kit by its full path, composes each panel from back to front, and prints the SVG:

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

`.frame` belongs to the page itself. Give it `position: relative`, `background: var(--paper)`, `border-radius: var(--radius)` and `box-shadow: var(--shadow)`, and place the number and time absolutely in its top corners in `var(--mono)` and `var(--muted)`.

## Rules

- **Use one floor.** Place every piece against `FLOOR(h)`, so standing and seated people land on the ground and in their seats.
- **Draw back, then the person, then front.** Draw furniture someone sits in or stands behind (`sofa`, `chair`) in two parts, one on each side of the person, or their shins cross the cushion.
- **Use one accent per panel**, on the thing the beat is about, such as the clock showing forty minutes have passed, the screen that finally works, or the person who arrives. Everything else is ink and gray.
- **Give each panel one beat.** Something changes for the person between this panel and the next.
- **Put a person in every panel**, with at most one close-up on the thing in their hand.
- **The caption says what the moment shows**, rather than describing the picture. "Ash waits forty minutes on the sofa while everyone else badges straight through" does that, and "Ash sits on a sofa" doesn't.
- **Give every panel a time**: a clock time, a timecode or a step number.
- **Keep speech apart from the picture.** Put short speech in a `bubble`, put a line that matters under the caption, and on a shot list give the voice-over its own column in monospace.
- **Keep the words in a panel readable on a phone.** A 400-wide panel shrinks to about 350 pixels, so keep `label` text at its default size of 13 or more, and move anything longer into the caption.

## What not to draw

- Prose sections that argue what the captions should.
- A panel with nobody in it (apart from one close-up), a beat that changes nothing, or a caption that only describes the picture.
- Thin stick figures, two accents in one panel, or text laid over a drawing.
- A photo or generated image where a composed panel would do.
- More than eight beats.

## Saying where it comes from

Say in the footer what the beats are based on: interviews, a visit, a brief, or the prompt alone. A storyboard drawn from interviews is evidence of how something is, and one drawn from a brief is a proposal, yet the two look the same. Wherever you invented a time, a name, a price or a line of dialogue to fill a panel, say so there too.
