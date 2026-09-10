# Patterns: the whiteboard's own vocabulary

Everything in `references/` still applies to the prose around the board. These are the pieces only a page whose content has coordinates needs.

## The three elements

```html
<div id="stage" class="relative overflow-auto" style="height: min(76vh, 740px)">
  <div
    id="board"
    class="relative origin-top-left"
    style="width: 2400px; height: 1400px"
  >
    <div class="absolute" style="left:80px; top:80px; width:260px">…</div>
  </div>
</div>
```

`#stage` is the window, `#board` is the surface, and every card is absolutely placed on it. The script removes `overflow-auto` from the stage and starts driving `#board`'s `transform`; until then, and forever if the script never runs, the stage is a scrolling box and the board is a big page. That is the entire degradation story, and it is why the stage is written as a scroller rather than as `overflow-hidden`.

`origin-top-left` matters: with the default center origin every translation has to be corrected for the scale, and the arithmetic stops being worth reading.

## Four attributes carry everything

| Attribute         | What it does                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| `data-region`     | A backdrop, a rule, a lane divider. Hidden when the page prints.           |
| `data-mini`       | Include this card as a block in the small map.                             |
| `data-drag="id"`  | The reader may move it, and where they put it is remembered under that id. |
| `data-from="0.6"` | Fade in only once the board is at that scale or larger.                    |

Nothing else has to be wired up. A card that carries none of them is a card that sits still, is not on the map, and is always visible, which is the right default for most of them.

## Laying out by hand, and by arithmetic

Coordinates in the file are the point, but nobody should be typing 27 of them. Compute them from something meaningful and write the results:

```python
MINUTE = 12                       # twelve pixels a minute, so a gap is a gap
x = LEFT + (minutes - START) * MINUTE
y = LANE[card.lane]
```

```python
x = zone_x + column * (card_w + gap)   # a grid inside a region
y = zone_y + HEADING + row * (card_h + gap)
```

The rule is that the arithmetic lives where the page is built and the answers live in the file. A page that computes its own layout in the browser has moved its content into a script, and then the board is gone when the script is.

## Regions, lanes, and rulers

A region is a dashed rectangle behind its cards, plus a heading outside it:

```html
<div
  data-region
  class="absolute rounded-2xl border-2 border-dashed border-border"
  style="left:60px; top:140px; width:760px; height:480px"
></div>
<p class="absolute text-[15px] font-semibold" style="left:80px; top:158px">
  It got too expensive
  <span class="ml-1.5 text-[11px] font-normal text-muted-foreground"
    >9 people</span
  >
</p>
```

A ruler is the same idea in one dimension: a label at each interval and a dashed vertical rule under it, both `data-region`. Draw the rule the full height of the board, so a card's position can be read off it from anywhere.

## Jump chips and tours, built from the board

Never hand-write a list of destinations. Read them off the thing they point at, and a region added later gets a chip while a region removed cannot leave a dead button:

```js
document.querySelector("#board-jumps").innerHTML = [
  ...document.querySelectorAll("#board [id^='zone-']"),
]
  .map((zone) => {
    const label = zone.nextElementSibling.firstChild.textContent.trim();
    return `<button data-go="#${zone.id}" data-scale="0.62" class="…">${label}</button>`;
  })
  .join("");
```

A numbered tour is the same with `data-stop` on the cards, sorted. `data-scale` is what makes a stop useful: a jump that arrives at the current zoom has only moved the reader sideways.

## Surfaces that survive both themes

`muted` and `card` resolve to the same value in the dark palette, so a `bg-muted` region behind `bg-card` cards is invisible there. Use `bg-background` for the ground under cards and `bg-accent` for a chip or a well **on** a card. This is the one palette trap that bites a board harder than an ordinary page, because a board is mostly surfaces.

## Printing

The board collapses to its cards in document order:

```css
@media print {
  #board {
    position: static !important;
    transform: none !important;
    width: auto !important;
    height: auto !important;
  }
  #board > * {
    position: static !important;
    width: auto !important;
    height: auto !important;
    margin-bottom: 0.5rem;
  }
  #board > [data-region] {
    display: none !important;
  }
}
```

Which is the reason DOM order has to be reading order, and the reason regions carry `data-region`: an empty dashed rectangle printed as a block is a page of nothing.

## Size, and when to stop

A board of about 2,400 by 1,400 fits a laptop stage at roughly half scale, which is the size where a card's title reads and its body does not. That is a good place to open: the reader sees the shape, and reading is what zooming is for. Go much past 4,000 in either direction and the fitted view is a texture rather than a picture, which is right for a canvas whose shape is the finding and wrong for a wall someone is meant to scan.

Past roughly a hundred cards, stop. Nobody is reading a board at that point; they are scanning a dataset, and a grid they can sort would serve them better.
