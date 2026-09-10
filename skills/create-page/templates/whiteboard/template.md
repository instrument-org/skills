# Whiteboard

One self-contained HTML page whose subject is an arrangement. The content sits on a surface bigger than the screen, at positions that mean something, and the reader moves around it: drag to pan, pinch or scroll to zoom, click a small map to jump. Not a diagram of boxes joined by arrows, and not a slide. A place.

Every other template puts things in an order. This one puts them in a **place**, and the argument is what the placement makes visible: what is next to what, what is far from what, what clusters, and what would not sit anywhere.

## When to reach for it

Reach for it when the material has two dimensions of its own and flattening them into a list throws the interesting part away. Three shapes come up over and over:

- **A wall.** Many small things sorted into groups by hand: survey answers, quotes, ideas, findings, cards from a workshop. The grouping is a judgment, and the reader should be able to argue with it by moving something.
- **A plan.** Something that is already spatial: a floor, a site, a garden, a room, a route. Distance on the page is distance in the world, and the questions worth asking are questions about distance.
- **A canvas.** Heterogeneous evidence placed against two real axes, most often time across and who-or-what down. Two things in a vertical line happened together, and a wide gap is a long gap.

"Put it all on one board", "lay this out", "where does everything go", "what's near what", "cluster these", "map this out" are the phrases. Reach for it unprompted when a page you are writing keeps saying "meanwhile" and "at the same time", or when a list you are making has an order you keep having to apologize for.

Do not reach for it when the content is a sequence with one dimension: that is a timeline, and a timeline is easier to read. Do not reach for it for boxes joined by arrows, which is an explainer's diagram and belongs in the column with the prose. Do not reach for it when the reader wants to filter and sort rather than to look, which is a [data explorer](../explorer/template.md). And do not reach for it because a board looks impressive: **if you cannot say in one sentence what position means, there is no board here**, only a list that has been scattered.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **What this board is.** Two or three sentences: what is on it, how it is arranged, and what the arrangement shows that the same things in a list would not.
- **How to read it.** The legend, and it is not decoration. What the axes are, or what the regions are; what color says; what size says if it says anything. On a board, position is meaning, and a reader who has to infer the meaning will infer a different one.
- **The board.**
- **What the arrangement says.** Two to four readings, each one checkable by looking, each naming the part of the board it comes from. The board is evidence; this is the argument. A board with no findings is a filing cabinet.
- **Where this came from.** What the placement rests on, what is measured and what is judgment, what is missing from the board, and what it is not a picture of.

## What varies here

Free, and expected to differ between two pages made a day apart: the size and aspect of the board; whether it has regions, axes, lanes, or nothing but placement; whether cards are draggable; whether there is a minimap, jump chips, or a numbered tour; what appears only at higher zoom; the density; and the kind of thing a card is, which may be a sticky note, a desk, a photograph, a log excerpt, a small chart or a quote, and may differ card to card on the same board.

## The rules that make a board work

**Position is the whole claim, so state it and then honor it.** A wall's regions are a judgment, and the page should say so. A plan's distances are measurements, and a plan whose blocks are sized for the layout rather than for the building looks identical and means nothing, which is worse than a table because it looks authoritative. A canvas's axis has a scale, and a card nudged along it for room is a lie in the same units as the truth.

**DOM order is reading order.** Printed, the board collapses to exactly the sequence the cards are written in, and that is the only thing a reader with a sheet of paper gets. So write the cards grouped the way you would talk through them: a region's heading, then that region's cards, then the next. Positions can be in any order and the file will still work, which is exactly why this has to be a rule rather than a consequence.

**The board is on the page, not in the script.** Cards are real HTML with their coordinates in a `style` attribute. With the script gone the stage is an ordinary scrolling box at full size and every word is still there. Nothing on a board may exist only as a string in JavaScript.

**Zoom may reveal detail; it may never hide a fact.** `data-from` is for a desk's occupant, a room's capacity, a second line under a label. If the page's argument depends on something, it is legible at the size the board opens at, or it is written in the prose below.

**Say where what the reader moves is kept.** Which is: in that browser, and nowhere else. The file is unchanged, so a copy they forward arrives arranged the way it was written. That is a fine thing for a board to offer as long as nobody is surprised by it.

## What it may load, and what has to survive without it

Nothing beyond the starter's fonts, icon set and Tailwind build. The pan-and-zoom is about two hundred lines of pointer handling in the page, and the canvas libraries that would replace it are the wrong trade twice over: they are megabytes against the whole page's kilobytes, they need React, and they render a scene from a JSON blob, so with the library absent the reader gets a blank rectangle instead of a board. The rule this family runs on is that a library may add motion or scale to something already on the page and may never be the only copy of a fact, and a canvas SDK fails it by construction.

Small drawings on the board are inline SVG. An image is inline data, like anywhere else.

## Refusals

A board where position means nothing, which is a list with extra steps. A legend that is missing, or that explains the colors and not the axes. Boxes joined by arrows. Content that can only be reached by zooming or dragging. A plan drawn out of scale. A canvas whose cards are spaced for the layout rather than by the axis they claim. A board with no findings under it. A reader who has to drag before they can read. Cards generated in script, so the page is blank without it. Persistence that is implied to travel with the file. More than about a hundred cards, past which nobody is reading a board, they are scanning a dataset and should have been given a grid.

## Honesty about the arrangement

Say what the placement is drawn from, because a board's authority is entirely in its coordinates. A plan traced from a real drawing is a claim about a building; one laid out by eye is a sketch, and the two look the same on screen. Where a card's position is a judgment, say that it is, and let the reader move it if moving it is cheap. Say what is not on the board, since a board reads as complete in a way a list does not: the empty part of a board looks like an absence of things rather than an absence of research. And where a card carries a number, the same rule holds as everywhere else: it came from the prompt, a source, or arithmetic over what is shown, or it does not appear.
