# Wireframe patterns

How the pieces of a wireframe page work, beyond what `SKILL.md` covers.

## How a frame is built

Each frame is two nested boxes. The outer box takes the scaled size, and the inner box is laid out at true size and scaled down into it:

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

The grid lays out the outer box, and the drawing lives in the inner one. Only `--s` changes. Everything here is Tailwind arbitrary values and CSS variables, so the page needs no stylesheet of its own.

The inline style gives `--s` a reasonable starting value, so the first paint isn't full size. The layout pass replaces it a moment later.

## Common sizes

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

Set `SLOT_H` close to the height most frames in the file scale to. A file of phones needs a taller slot than a file of windows. If a file mixes them, use the taller slot so no frame gets squeezed into a strip.

## Three ways a set of frames can vary

The `states` array doesn't have to be a sequence in time. There are three common setups:

- **Moments.** Before, during and after an interaction. This is the default, and most proposals need it.
- **Conditions.** One panel in every state it can be in: empty, loading, one item, many, denied, expired, offline. Use `panel` with a small `w` and `h`, and the grid fits five or six across.
- **Widths.** The same screen at 1440, 900 and 390, to show the layout holds up. These take a lot of work, so only draw them when the responsive behavior is the question.

Whichever you pick, each note should say how its frame differs from the others. If you could swap two frames and their notes would still fit, the frames aren't telling the reader anything.

## Marks

```js
clickable(btn("Freeze card", { cls: "bg-error-600 text-white" })); // ring + pointer
fresh(chip("Frozen", "bg-error-100 text-error-700")); // ring, no pointer
noted(someRow, "3 of 5", "new"); // any label you like
```

You can also put `ann` on its own inside any element to mark that element. That's how you put a ring on something the kit built:

```js
`<div>${field("Card number", { value: "•••• 4417" })}${ann("click")}</div>`;
```

Each helper leaves an invisible marker inside the element. After render, `drawMarks` measures every marked element against its frame and draws the ring and tag on one layer over the whole frame. That way a mark never changes the element's size, and no `overflow-hidden` parent can clip it. The tag goes beside a narrow element, above a wide one, and inside the corner of a whole pane.

That layer has the class `ann`, as does anything else the reader can switch off. The marks button hides them all with one rule:

```css
body[data-marks="off"] .ann {
  display: none;
}
```

The rule sits on the body, so it covers both the grid and the enlarged view, which is a copy of the frame placed inside the same body. If you draw a mark by hand instead of through the kit, give it the `ann` class. Otherwise it stays visible after the reader hides marks, which is worse than having no button at all. If the reader should never lose a callout, it isn't an annotation. Draw it inside the frame as real interface.

## Grey bars

```js
bars("100%", "78%", "62%"); // a paragraph
bars("46%"); // a name
bars("100%", "100%", "34%"); // a paragraph that ends mid-line
```

Wrap them in `space-y-2.5`. Vary the width of the last bar, because three bars at 100% look like a table rather than a paragraph.

## Delete what you don't use

The kit in `main.html` is a starting point. A file that draws six phones has no use for `win`, `web`, `shell`, `grid` or `group`, and every one you leave behind is a function the next reader has to check for callers. Delete whatever you don't call.

It works the other way too. If your frames repeat something the kit doesn't cover, write a small function that returns it as a string. That's most of what keeps these files short, and it's why a six-frame file isn't six copies of one window.

## Printing

Tiles have `break-inside-avoid`, so no frame splits across a page break when you print. Frames print at the scale they have on screen, so print from a window the width you want on paper. The enlarged view and the grid toggle have `print:hidden`, and nothing else needs a print rule.
