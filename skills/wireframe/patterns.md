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

The `states` array doesn't have to be a sequence in time. There are four common setups:

- **Moments.** Before, during and after an interaction. This is the default, and most proposals need it.
- **Conditions.** One panel in every state it can be in: empty, loading, one item, many, denied, expired, offline. Use `panel` with a small `w` and `h`, and the grid fits five or six across.
- **Widths.** The same screen at 1440, 900 and 390, to show the layout holds up. These take a lot of work, so only draw them when the responsive behavior is the question.
- **Options.** Two or more ways to solve the same thing, for the reader to pick between. Put each option in a group (below), in the order you'd recommend them, with the current design first. Options often combine with moments or conditions: each option walks the same few screens, so the reader can say "B, but with A's empty state".

Whichever you pick, each note should say how its frame differs from the others. If you could swap two frames and their notes would still fit, the frames aren't telling the reader anything.

## Groups

Sets of frames the reader will name back to you, such as options, the current design or rounds of a review, go in `groups`, and each frame joins one with `group`:

```js
const groups = {
  now: { mark: "Now", tone: "gray", note: "The site as it ships today." },
  A: { mark: "A", name: "Plainly said", note: "One plain sentence up top and two quiet tones for the rest." },
  B: { mark: "B", name: "Night shift", note: "The whole site dark, with the app glowing on its wallpaper." },
};
const states = [
  { group: "now", title: "Home", note: "…", body: … },
  { group: "A", title: "Home", note: "…", body: … },
];
```

- `mark` is what the reader says back: a letter for an option, a short word such as `Now` for the current design, or `""` for no label. A frame's label is its mark and its place in the group, so the second frame of A is A2 and the second of Now is Now 2.
- A group has one name, shown the same way in the grid's heading, in the enlarged view's strip and in the frames' labels. A letter mark goes with a `name` ("A First option"). A word mark is the whole name, so leave `name` out: `{ mark: "Starters", note: "…" }`, never `{ mark: "Starters", name: "Prompt and opening suggestions" }`, which would label the frames "Starters 2" under a heading that says something else.
- `note` says in one line what the whole set tries, so frame notes only say what each screen does.
- `tone` is one of gray, sky, emerald, amber, rose or indigo. Leave it out and the sets take colors in order. Gray suits the current design.
- Keep a group's frames next to each other in `states`. The grid draws each group under one slim heading, with a rule in its color down the left margin from the heading to its last frame, and labels its frames in that color. The enlarged view shows a bar per frame in runs by group along the bottom, with the open group's name under its run.
- Use groups only when there are two or more sets to tell apart. Most pages are one walk through one design and need none: leave `groups` empty, and the frames keep plain numbers.

## Marks

```js
noted(someRow, "named by AI"); // your few words, over the frame when the reader presses A
fresh(chip("Frozen", "bg-error-100 text-error-700")); // NEW, only on a revision
```

You can also put `ann("words")` on its own inside any element to mark that element, which is how you mark something a kit built:

```js
`<div>${field("Card number", { value: "•••• 4417" })}${ann("saved to Keychain")}</div>`;
```

Each helper leaves an invisible marker inside the element, and the viewer measures it after render, so a mark never changes the element's size and no `overflow-hidden` parent clips it. If you draw a mark by hand instead, give it the class `ann` so it hides with the rest when callouts are off. If the reader should never lose a callout, it isn't an annotation: draw it inside the frame as real interface.

## Frames from a snapshot

`SKILL.md` covers capturing a page and adding it. This is everything `snap()` takes.

```js
snap("pricing"); // the snapshot as captured
snap("pricing", ($) => { … }); // a copy, edited
snap.size("pricing"); // { w, h }, the viewport it was captured at
snap.url("pricing"); // the address it was captured at
```

A frame is the snapshot in its own document, so its styles reach only that frame and its width is its viewport: a page's breakpoints work. It shows the first screen, at the scroll positions the page had.

### Targets

`$(target)` returns exactly one element. Otherwise the frame draws as an error and the page throws one naming what came close.

| Target                                   | Finds                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"Choose Pro"`                           | the innermost element whose words, label, placeholder or alt are exactly that                                         |
| `{ contains: "/ month" }`                | the innermost element whose words include that                                                                        |
| `{ role: "button", text: "Choose Pro" }` | the outermost of a role: button, link, textbox, heading, listitem, navigation, dialog, image, or any `role` attribute |
| `{ label: "Close" }`                     | by `aria-label`                                                                                                       |
| `{ selector: "header nav" }`             | by CSS selector, for what has no words                                                                                |
| `{ within: "Pro", text: "Choose" }`      | inside another target                                                                                                 |
| `{ contains: "/ month", nth: 2 }`        | the second of several                                                                                                 |

`.find(target)` looks inside an element, and `.up("li")` or `.up("button")` climbs to the nearest selector or role around it. `$.root` is the page's body.

### Edits

Each returns the element, so edits chain. Edits mark nothing: mark only what the reader should look at, with `.note()` or `.fresh()`.

- `.text("Plans")` sets an element's one piece of words, and `.text("Pricing", "Plans")` replaces those words where an element holds several.
- `.html("…")` replaces the insides, and `.replace("…")` the element itself.
- `.before("…")`, `.after("…")`, `.append("…")` and `.prepend("…")` add HTML, or a clone, beside or inside it.
- `.clone()` copies an element to change and then place: `$("Basic").up("li").clone().find("Basic").text("Team")` and then `$("Pro").up("li").after(copy)`.
- `.remove()` takes it out.
- `.attr(name, value)` sets an attribute, and `null` removes it. `.addClass("…")` and `.removeClass("…")` change classes.
- `.look(target)` takes another element's classes, so a link can take a button's look.
- `.css("width: 320px")` adds inline style.
- `.note("words")` puts a callout on it, like `noted`, and `.fresh()` NEW, like `fresh`. `noted`, `fresh` and `ann` inside HTML you add mark the element that holds them.

What you add is styled by the snapshot's own stylesheets, which keep only the rules its page used, so reach for `.look()`, `.clone()` or inline `style` before a class the page never had.

To show the page in a browser window, wrap it: `body: web(snap.url("pricing"), snap("pricing"))` with `w: 1280, h: snap.size("pricing").h + 77`, since the window's bars take 77 pixels.

### When a snapshot is wrong

- What it can't keep, `add-snapshot.mjs` prints: another site's embedded page comes out a gray box carrying `data-snapshot-embed`, a shadow root comes out empty, and another site's stylesheet that refuses reads stays a link, so it draws only online.

- A frame that comes up blank or unstyled: the page drew with a stylesheet it couldn't read, and `add-snapshot.mjs` printed which. Capture again from a page that serves it, or draw that frame from scratch.
- A state the frame needs that the snapshot lacks, such as a menu open or a hover: capture it again with the state clicked into. Hover can't be captured; draw its look with `.look()` or `.css()`.
- Each snapshot is 0.3 to 1 MB, stored once however many frames draw it, and a shared page takes up to 8 MB.
- Any browser tool that evaluates a script and returns its value can capture, as long as what it returns is saved to a file unshortened. `add-snapshot.mjs` also takes the snapshot's `html` on its own, saved as an `.html` file.

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
