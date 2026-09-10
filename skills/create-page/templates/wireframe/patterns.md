# Patterns: the wireframe's own vocabulary

Everything in `references/` still applies to the prose around the frames. These are the pieces only a page made of drawings needs.

## The frame, and why it is two elements

A frame is an outer box sized to the scaled result and an inner box laid out at true size:

```html
<div
  class="frame w-[calc(var(--w)*var(--s))] h-[calc(var(--h)*var(--s))] overflow-hidden"
  data-w="1280"
  data-h="800"
  style="--w:1280px; --h:800px; --s:0.2"
>
  <div class="w-[var(--w)] h-[var(--h)] origin-top-left scale-[var(--s)]">
    …
  </div>
</div>
```

The outer box is what the grid lays out; the inner box is what the drawing lives in. Only `--s` moves. Everything the template needs is Tailwind arbitrary values and CSS variables, so the page carries no stylesheet of its own.

`--s` starts at a plausible value in the inline style so the first paint is not full-size, and the layout pass overwrites it a moment later.

## Sizes worth knowing

| Thing              | Draw it at            |
| ------------------ | --------------------- |
| Desktop app window | 1280x800              |
| Laptop browser     | 1280x800              |
| Large desktop      | 1440x900 or 1600x1000 |
| Phone              | 390x844               |
| Tablet, portrait   | 834x1112              |
| A dialog or sheet  | 480x360 to 640x520    |
| A settings panel   | 520 wide              |
| A dropdown or menu | 240x320               |
| A toast or banner  | 380x72                |

Set `SLOT_H` near the height most frames in the file scale to. A file of phones wants a taller slot than a file of windows; a file that mixes them wants the taller one, so nothing in it is squeezed to a strip.

## The state that is not a moment

The `states` array does not have to be a sequence in time. Three axes come up:

- **Moments.** Resting, the interaction, the result. The default, and what most proposals need.
- **Conditions.** One panel in every state it can be in: empty, loading, one item, many, denied, expired, offline. Use `panel` and a small `w`/`h`, and the grid fits five or six across.
- **Widths.** The same screen at 1440, 900 and 390, arguing that the layout survives. Expensive to write, so only when the responsive behavior is the thing in question.

Whichever axis, the captions have to be comparative. If every caption would read the same with the frame swapped, the frames are not doing work.

## Marking without decorating

```js
clickable(btn("Freeze card", { cls: "bg-error-600 text-white" })); // ring + pointer
fresh(chip("Frozen", "bg-error-100 text-error-700")); // ring, no pointer
noted(someRow, "3 of 5", "new"); // any label you like
```

`ann` alone goes inside anything already `relative`, which is how a ring lands on an element the kit built:

```js
`<div class="relative">${field("Card number", { value: "•••• 4417" })}${ann("click")}</div>`;
```

The rings are `outline`, not `border`, so they sit outside the element and never change its size. `-inset-1.5` gives them a little air; on a dense row use `-inset-1`.

## Bars

```js
bars("100%", "78%", "62%"); // a paragraph
bars("46%"); // a name
bars("100%", "100%", "34%"); // a paragraph that ends mid-line
```

Wrap them in `space-y-2.5`. Vary the last width: three bars all at 100% read as a table, not as prose.

## Deleting the kit

The kit is a starting point, not furniture. A file that draws six phones has no use for `win`, `web`, `shell`, `grid` or `group`, and every one of them left behind is a function the next reader has to check for callers. Delete what you do not call.

The same goes the other way: anything the frames repeat and the kit does not cover should become a small function returning a string. That is most of what keeps these files short, and it is why a six-frame file is not six copies of one window.

## Printing

The tiles carry `break-inside-avoid`, so the grid prints without a frame straddling a page break. The frames print at whatever scale the layout pass last set, which is the scale on screen, so print from a window the width you want on paper. The enlarged view and the grid toggle are `print:hidden` where they exist; nothing else needs a print rule.
