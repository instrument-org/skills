# Frames from a snapshot

A snapshot is a page as your browser tool drew it, kept whole, and a frame drawn from one is the real screen, edited by the words a person reads on it. Use one for any frame that needs a real screen your browser can reach: it's quicker than redrawing the screen and can't be wrong about it. Other frames can be gray boxes or pieces, on the same page. A project's kit may keep a library of its own (its `KIT.md` says).

Read down to "What snap() takes" and start; the rest is reference for an edit or a problem the example doesn't cover.

1. At the frame's size, click into the state you'll draw (a menu open, a tab chosen) and capture it. Repeat per state: one you never clicked into isn't in the snapshot.

```
agent-browser set viewport 1280 800
agent-browser open https://tryinstrument.com/pricing
agent-browser eval --stdin < <skill>/snapshot.js > pricing.json
```

2. Name the snapshot files after the page when you build: `node <skill>/build.mjs part.frames.html page.html pricing.json menu.json`. Each file's name is its snapshot's (`pricing.json` is `snap("pricing")`), the build prints what each couldn't keep, and a rebuild keeps the snapshots the page already has. `node <skill>/add-snapshot.mjs page.html --remove <name>` drops one.
3. A frame of the current design is the snapshot as captured, and a proposal is an edited copy of it:

```html
<script>frame({
  title: "Pricing (Current design)",
  note: "…",
  ...snap.size("pricing"),
  body: snap("pricing"),
})</script>
<script>frame({
  title: "Pricing",
  note: "We show Pro's yearly price under its monthly one, so the saving is plain.",
  ...snap.size("pricing"),
  body: snap("pricing", ($) => {
    $({ role: "heading", text: "Pricing" }).text("Plans");
    $({ contains: "/ month", nth: 2 }).after(`<span style="display:block;font-size:13px">or $96 a year</span>`);
    $("Choose Pro").note("starts a 14-day trial");
  }),
})</script>
```

- `$(target)` finds exactly one element. A target that matches nothing or several draws that frame as an error naming the close matches, which `agent-browser errors` shows.
- Edits mark nothing. `.note("words")` adds a callout and `.fresh()` NEW, and `noted` or `fresh` inside HTML you add works too.
- The snapshot keeps only the style rules its page used, so style what you add with `.look(target)`, a `.clone()` of a neighbor, or inline `style`.
- Frames draw as they come near the screen, so before a full-page screenshot run `agent-browser eval 'dispatchEvent(new Event("beforeprint"))'`.

A snapshot holds whatever the page showed, names and figures included. Capture from a test account where you can, edit the rest out, and never share the user's own screens without asking. Password fields are never kept. It can't capture a native app.

## What snap() takes

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

- What it can't keep, the build prints: another site's embedded page comes out a gray box carrying `data-snapshot-embed`, a shadow root comes out empty, and another site's stylesheet that refuses reads stays a link, so it draws only online.
- A frame that comes up blank or unstyled: the page drew with a stylesheet it couldn't read, and the build printed which. Capture again from a page that serves it, or draw that frame from scratch.
- A state the frame needs that the snapshot lacks, such as a menu open or a hover: capture it again with the state clicked into. Hover can't be captured; draw its look with `.look()` or `.css()`.
- Each snapshot is 0.3 to 1 MB, stored once however many frames draw it, and a shared page takes up to 8 MB.
- Any browser tool that evaluates a script and returns its value can capture, as long as what it returns is saved to a file unshortened. The build also takes the snapshot's `html` on its own, saved as an `.html` file.
