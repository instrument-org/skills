# Patterns: the whiteboard's own vocabulary

Everything in `references/` still applies to what goes on a card. These are the pieces only a page whose content has coordinates needs.

## The three elements

```html
<main class="relative flex h-dvh flex-col overflow-hidden">
  <header class="shrink-0 …">…</header>
  <div id="stage" class="relative flex-1 overflow-auto bg-background">
    <div
      id="board"
      class="relative origin-top-left"
      style="width: 2400px; height: 1400px"
    >
      <div class="absolute" style="left:80px; top:80px; width:260px">…</div>
    </div>
  </div>
</main>
```

`#stage` is the window, `#board` is the surface, and every card is absolutely placed on it. The script removes `overflow-auto` from the stage and starts driving `#board`'s `transform`; until then, and forever if the script never runs, the stage is a scrolling box and the board is a big page. That is the entire degradation story, and it is why the stage is written as a scroller rather than as `overflow-hidden`.

Two things about `<main>`: `relative` is what the minimap and the zoom controls hang off, and `h-dvh overflow-hidden` is what makes the board the page rather than a panel inside one. The print block puts both back.

`origin-top-left` matters: with the default center origin every translation has to be corrected for the scale, and the arithmetic stops being worth reading.

## Attributes carry everything

| Attribute         | What it does                                                                |
| ----------------- | --------------------------------------------------------------------------- |
| `data-region`     | Backdrop, rule or ink. Hidden when the page prints; handwriting is not.     |
| `data-mini`       | Include this card as a block in the small map.                              |
| `data-drag="id"`  | The reader may move it, and where they put it is remembered under that id.  |
| `data-from="0.6"` | Fade in only once the board is at that scale or larger.                     |
| `data-ink="…"`    | Draw a marker stroke into this box: `lasso`, `arrow`, `underline`, `bracket`, `strike`. |

A card that carries none of them sits still, is not on the map, and is always visible, which is the right default for most of them.

`data-drag` is an opinion, not a feature. Put it on a note whose cluster is a judgment; leave it off a plan, where a reader who moves a desk has broken the page's only claim.

## Stickies, marker and cards

Three weights, and the difference between them is how much the thing has to say.

```html
<!-- A sticky: something someone said, or one line of an idea. -->
<div
  data-mini
  class="absolute -rotate-1 rounded-[3px] bg-warning-100 px-3 py-2.5 shadow-sm"
  style="left:96px; top:130px; width:196px"
>
  <p class="marker text-[19px] leading-[1.12]">What someone actually said</p>
  <p class="mt-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
    who, and how many
  </p>
</div>

<!-- Marker: a heading, or a finding, written where the finding is. No
     data-region on handwriting: it is content, and on paper a cluster
     heading is the only thing holding the printed list together. -->
<p class="marker absolute text-[30px] text-foreground" style="left:80px; top:52px">
  What this corner is
</p>

<!-- A card: anything with more in it than a sticky can hold. -->
<div
  data-mini
  class="absolute rounded-xl border border-border bg-card p-4 shadow-sm"
  style="left:320px; top:150px; width:230px"
>
  …
</div>
```

The `.marker` class is the one hand on the page, and the template's `<style>` and its `<link>` are all it takes:

```css
.marker {
  font-family: "Caveat", ui-rounded, cursive;
}
```

Keep it for headings, findings and what a person said. Everything measured stays in the page's own type, because a price in handwriting reads as a guess.

Two rules on stickies. Tilt them a little (`-rotate-2` through `rotate-2`) and vary the direction, or a wall of them reads as a table. And color them by something the position does not carry: who said it, who does it, where it came from. A wall colored by the cluster it is already inside has spent its second dimension on nothing.

## Ink

Marker over the top of the board. Every stroke goes into a box you placed, so the position is in the HTML and only the shape is in the script:

```html
<span
  data-ink="lasso"
  data-tone="red"
  data-region
  class="absolute"
  style="left:78px; top:112px; width:236px; height:120px"
></span>
<span
  data-ink="arrow"
  data-dir="se"
  data-region
  class="absolute"
  style="left:300px; top:250px; width:150px; height:80px"
></span>
```

`lasso` rounds the whole box and overshoots the start, the way a hand does. `arrow` runs corner to corner with a bend and a two-stroke head, and `data-dir` picks which corner it ends at: `se`, `ne`, `sw`, `nw`. `underline` draws twice, because once reads as a border. `bracket` is a square brace down the left edge, for _these, together_. `strike` crosses the box out. Tones are `ink` (which follows the reader's theme), `red`, `green` and `orange`; `data-weight` thickens a stroke.

**Ink is commentary, never content.** It carries `data-region`, so it does not print, is not on the map, and is gone if the script never runs, and the board still says everything it said. Anything you would be sorry to lose is a card.

Two shapes, two jobs, and picking wrong is the usual mistake: a **lasso is an ellipse**, so it wants a group that is roughly as wide as it is tall, and inscribing one in a rectangle either misses the corners or swallows half the board. Around a column of rooms, or a stack of three cards, reach for a **bracket**.

## Rings that hold what they claim

A lasso drawn by hand around a cluster is wrong the moment a note moves. Compute it from the notes it holds:

```python
left   = min(n.x for n in notes)
top    = min(n.y for n in notes)
right  = max(n.x + n.w for n in notes)
bottom = max(n.y + n.h for n in notes)
cx, cy = (left + right) / 2, (top + bottom) / 2
rw, rh = (right - left) * 1.42, (bottom - top) * 1.42   # sqrt(2), plus air
ring = (cx - rw / 2, cy - rh / 2, rw, rh)
```

The 1.42 is the whole trick: an ellipse inscribed in a rectangle passes through the middle of each edge and misses all four corners, so a ring sized to the bounding box cuts through the notes at its corners. Inflating by the diagonal ratio is what puts them inside.

And a note that belongs to two clusters goes **halfway between the two ring centers**, which is inside both ellipses at its middle and outside both at its corners: the two lines cross over the note. That is what "it went in two clusters" looks like, and it is a claim a list of the same notes cannot make.

Same rule for a count beside a ring. Derive it from the notes the ring contains rather than typing a number that will be wrong by the second revision.

## Laying out by hand, and by arithmetic

Coordinates in the file are the point, but nobody should be typing 27 of them. Compute them from something meaningful and write the results:

```python
MINUTE = 12                       # twelve pixels a minute, so a gap is a gap
x = LEFT + (minutes - START) * MINUTE
y = LANE[card.lane]
```

Where an axis has labeled bands, place a card from **its own value**, not by eye:

```python
x = BAND[job.price_band] + jitter(-70, 70)
```

A board whose cards disagree with the axis labels under them is worse than a table, because it looks authoritative. Placing from the value is what makes that impossible rather than merely unlikely.

The rule is that the arithmetic lives where the page is built and the answers live in the file. A page that computes its own layout in the browser has moved its content into a script, and then the board is gone when the script is.

## Regions, lanes and rulers

A region is a wash of ground behind its cards plus a heading outside it. On a wall, prefer a lasso: a dashed rectangle reads as software and a ring reads as a person. On a plan, prefer the rectangle, because a room is a rectangle.

```html
<div
  data-region
  class="absolute rounded-2xl bg-accent/50"
  style="left:60px; top:140px; width:760px; height:480px"
></div>
```

A ruler is the same idea in one dimension: a label at each interval and a dashed rule under it, both `data-region`. Draw the rule the full height of the board, so a card's position can be read off it from anywhere.

## Surfaces that survive both themes

`muted` and `card` resolve to the same value in the dark palette, so a `bg-muted` region behind `bg-card` cards is invisible there. Use `bg-background` for the ground under cards and `bg-accent` for a chip or a well **on** a card. This is the one palette trap that bites a board harder than an ordinary page, because a board is mostly surfaces.

Sticky fills come off the ramps at 100 (`bg-warning-100`, `bg-brand-100`, `bg-error-100`), which invert to dark tints and stay distinguishable from each other. Ink tones are the saturated middles, which hold still in both.

## Printing

The board collapses to its cards in document order:

```css
@media print {
  main,
  #stage {
    height: auto !important;
    overflow: visible !important;
  }
  #board {
    position: static !important;
    transform: none !important;
    width: auto !important;
    height: auto !important;
  }
  #board *,
  #board > * {
    position: static !important;
    transform: none !important;
  }
  #board > * {
    width: auto !important;
    height: auto !important;
    margin-bottom: 0.5rem;
  }
  #board > [data-region] {
    display: none !important;
  }
}
```

Which is the reason DOM order has to be reading order, and the reason regions and ink carry `data-region`: an empty ring printed as a block is a page of nothing. `#board *` and not only `#board > *`, because a label pinned to the bottom of a fixed-height card has nothing to pin to once the card is in the flow and goes missing from the paper; `transform: none` on the same selector straightens the stickies out.

## Size, and when to stop

A board of about 2,400 by 1,500 fits a laptop stage at roughly half scale, which is the size where a card's title reads and its body does not. That is a good place to open: the reader sees the shape, and reading is what zooming is for. Go much past 4,000 in either direction and the fitted view is a texture rather than a picture, which is right for a canvas whose shape is the finding and wrong for a wall someone is meant to scan.

Past roughly a hundred cards, stop. Nobody is reading a board at that point; they are scanning a dataset, and a grid they can sort would serve them better.
