# Wireframe patterns

How the pieces of a wireframe page work, beyond what `SKILL.md` covers.

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

The grid sizes its slots from the frames themselves, so there is nothing to set. The middle frame of the set fills its tile's width, and a frame much taller than the rest, such as a phone among windows, scales down to the shared slot height.

## Four ways a set of frames can vary

The frames don't have to be a sequence in time. There are four common setups:

- **Moments.** Before, during and after an interaction. This is the default, and most proposals need it.
- **Conditions.** One panel in every state it can be in: empty, loading, one item, many, denied, expired, offline. Use `panel` with a small `w` and `h`, and the grid fits five or six across.
- **Widths.** The same screen at 1440, 900 and 390, to show the layout holds up. These take a lot of work, so only draw them when the responsive behavior is the question.
- **Options.** Two or more ways to solve the same thing, for the reader to pick between. Put each option in a group (below), in the order you'd recommend them, with the current design first. Options often combine with moments or conditions: each option walks the same few screens, so the reader can say "B, but with A's empty state".

Whichever you pick, each note should say how its frame differs from the others. If you could swap two frames and their notes would still fit, the frames aren't telling the reader anything.

## Groups

```html
<script>
meta({
  title: "Website: two directions",
  line: "…",
  source: "…",
  groups: {
    now: { mark: "Now", tone: "gray", note: "The site as it ships today." },
    A: { mark: "A", name: "Plainly said", note: "One plain sentence up top and two quiet tones for the rest." },
    B: { mark: "B", name: "Night shift", note: "The whole site dark, with the app glowing on its wallpaper." },
  },
});
</script>
<script>frame({ group: "now", title: "Home", note: "…", body: … })</script>
<script>frame({ group: "A", title: "Home", note: "…", body: … })</script>
```

- A frame's label is its group's mark and its place in the group, so the second frame of A is A2 and the second of Now is Now 2.
- A group has one name, shown the same way in the grid's heading, in the enlarged view's strip and in the frames' labels. A letter mark goes with a `name` ("A First option"). A word mark is the whole name, so leave `name` out: `{ mark: "Starters", note: "…" }`, never `{ mark: "Starters", name: "Prompt and opening suggestions" }`, which would label the frames "Starters 2" under a heading that says something else.
- The grid draws each group under one slim heading, with a rule in its color down the left margin from the heading to its last frame, and labels its frames in that color. The enlarged view shows a bar per frame in runs by group along the bottom, with the open group's name under its run.

## Marks

```js
noted(someRow, "named by AI"); // your few words, over the frame when the reader presses A
fresh(chip("Frozen", "bg-error-100 text-error-700")); // NEW, only on a revision
```

You can also put `ann("words")` on its own inside any element to mark that element, which is how you mark something a piece built:

```js
`<div>${field("Card number", { value: "•••• 4417" })}${ann("saved to Keychain")}</div>`;
```

Each helper leaves an invisible marker inside the element, and the viewer measures it after render, so a mark never changes the element's size and no `overflow-hidden` parent clips it. If you draw a mark by hand instead, give it the class `ann` so it hides with the rest when callouts are off. If the reader should never lose a callout, it isn't an annotation: draw it inside the frame as real interface.

## Grey bars

```js
bars("100%", "78%", "62%"); // a paragraph
bars("46%"); // a name
bars("100%", "100%", "34%"); // a paragraph that ends mid-line
```

Wrap them in `space-y-2.5`. Vary the width of the last bar, because three bars at 100% look like a table rather than a paragraph.

## Helpers

If your frames repeat something no piece covers, write a small function that returns it as a string, in its own block above the first frame that calls it. That's most of what keeps a part short, and it's why a six-frame part isn't six copies of one window. A helper no frame calls is one the next reader has to check for callers, so take it out.
