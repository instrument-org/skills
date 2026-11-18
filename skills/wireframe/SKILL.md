---
name: wireframe
description: "Use when asked to wireframe, mock up or sketch a product screen or UI flow, or when an interface is being argued about in prose. Draws software as true-size frames across states, with callouts and captions, in one self-contained HTML page, or as one live prototype screen to click through or replay. Also use it to read a wireframe someone sent as a link."
---

# Wireframe

A wireframe page is a grid of frames: each one a screen drawn at its real size and scaled to fit, with a title and a one-sentence note under it. Callouts ring part of a frame and show their words when the reader presses `A`. Tapping a frame enlarges it (a frame far taller than the screen opens at its width and scrolls), the arrow keys step through frames, and `?frame=3` opens the page at the third, which a link preview then describes.

Use it when someone asks for a wireframe, a mockup or "what would that look like", and when you catch yourself describing an interface in prose. Don't use it for something the reader types into or gets a number out of (build a small tool), for boxes and arrows (draw a diagram), or for a whole design system: one page covers one flow and makes one case.

If the folder you work in, or one above it, has `.agents/wireframe-kit/KIT.md`, read that next, in a call of its own: the project draws with its own kit and build, in the same format.

## A page

`<skill>` is this skill's folder. Write a **part**, `<name>.frames.html`, then build the page from it:

```
node <skill>/build.mjs parts/2026-10-05-checkout-sold-out-mid-payment.frames.html 2026-10-05-checkout-sold-out-mid-payment.html
```

A part is `<script>` blocks and nothing else: one `meta()`, then one `frame()` per frame, and each helper in its own block just above the first frame that uses it.

```html
<script>
meta({
  title: "Checkout: sold out mid-payment",
  line: "We check the seat before charging, so nobody pays for a seat they lost.",
  source: "Drawn from a description; prices are made up.",
  groups: {
    now: { mark: "Now", tone: "gray", note: "The checkout as it ships." },
    A: { mark: "A", name: "Hold the seat", note: "We hold the seat while we check the card." },
  },
});
</script>
<script>frame({
  group: "now",
  title: "Payment",
  note: "We take the card and charge it in one step.",
  w: 390,
  h: 844,
  body: phone(`<div class="space-y-4 p-5">${field("Card number", { value: "•••• 4417" })}${btn("Pay $84", { full: true })}</div>`),
})</script>
<script>
const held = (min) => chip(`Held for ${min} min`, { icon: "ph-clock" });
</script>
<script>frame({
  group: "A",
  title: "Payment",
  note: "We hold the seat and count down while we check the card, so nobody loses it halfway through paying.",
  w: 390,
  h: 844,
  pick: true,
  body: phone(`<div class="space-y-4 p-5">${noted(held(5), "starts when the card form opens")}${btn("Pay $84", { full: true })}</div>`),
})</script>
```

- Each block runs on its own, in order, and sees the names the blocks above it declared. One that throws or doesn't parse becomes a red tile naming the error and its line, and every other frame still draws.
- Declare a name once: a second `const held` is a SyntaxError in its block. A piece's name (`card`, `win`) is yours to take for a helper of your own; `meta` and `frame` aren't.
- A frame's body is a string of HTML styled with Tailwind classes, and it can't use `document` or `window`: the build runs every block in Node first.

The build lists the frames by label, then prints a FAIL line with the part's line number for each block that fails, a frame that draws `undefined` or `NaN`, a field `meta()` or `frame()` doesn't read, and a callout on an element that draws nothing. It writes the page either way, so fix each FAIL and build again. Then look at the page in your browser tool, since only a browser shows how it looks: `agent-browser open <page>`, `agent-browser errors` (fix the part until it's empty), `agent-browser screenshot <png>`, and once more after pressing `A`, to see each callout on what it names. The browser opens only pages in the task folder or a folder the user granted. With no browser tool, say the build passed but you couldn't look.

## meta() and frame()

| Call | Fields |
| --- | --- |
| `meta({ title, line, source, groups })` | `title` names the page, `line` is the one line under it and the page's description, `source` says what you drew from and what you made up. `groups` below. `slotH` and `tileMin` set the grid's tile height and narrowest tile, in pixels |
| `frame({ title, note, body, w, h, group, pick, verdict, dark })` | `title`, `note` and `body` are required. `w` and `h` are its true size, 1280 by 800 when left out. `group` is a key of `meta`'s `groups`. `pick: true` stars the option you'd choose, once per group. `verdict: "skip"` marks an option you'd drop and `verdict: "later"` one to build later; a frame takes a pick or a verdict, not both. `dark: true` draws it in the dark scheme |

### Groups

When the frames fall into sets the reader will name back to you (options, the current design, rounds), declare them in `meta({ groups })`, keyed by what frames give as `group`:

- `mark` is what the reader says: a letter for an option, with a `name` beside it; a word such as `Now` that is the set's whole name, so it takes no `name`; or `""` for no label. Frames are labeled A1, A2, Now 1 for you, so a title never carries a letter.
- `note` says in one line what the whole set tries, so frame notes only say what each screen does.
- `tone` is one of `gray`, `sky`, `emerald`, `amber`, `rose` or `indigo`. Left out, sets take colors in order. Gray suits the current design.
- Keep a group's frames together: the current design first, then the options in the order you'd recommend them, all on one page. Use groups only for two or more sets; one walk through one design needs none.

### Marks

- `noted(html, "words")` rings `html`, and its few words show over the frame on `A`. Say what the drawing and the note can't: a behavior a still can't show, a reason, where data comes from, a limit, or an open question. Never repeat the element's text or the note. Most frames need no callout.
- `fresh(html)` marks what a revision changed, reading NEW, against a design the page also shows. On a page that proposes something new throughout, leave it out.
- `ann("words")` inside an element marks that element, for what a piece built: `` `<div>${field("Card number")}${ann("saved to Keychain")}</div>` ``.
- A mark you draw by hand takes the class `ann`, or it stays on screen while marks are off. Never a green row or a check mark as a mark: those look like the product.

## Pieces

Each returns HTML. Most take what goes inside first and options second: pass your own HTML in rather than editing a piece's output.

On every page:

| Piece | Draws |
| --- | --- |
| `win(children, { title, side, top, over })` | A desktop window: title bar, then `children`, with a `side` column, a `top` bar and an `over` layer. `win("Mail", inner)` works too |
| `bar(children, { end, h, rule })` | A row of controls, `end` against the right edge |
| `card(children, { title, line, icon, end, foot, w })` | A bordered panel with a head and a foot |
| `chip(label, { cls, icon, on })`, `pill(label, { icon, on, end })` | A status label; a rounded label a person presses |
| `composer({ text, ph, chips, start, end, focus, w })` | A box a person types into |
| `box(cls, children)` | A grey block standing in for a picture |
| `crop(html, { x, y, w, h })` | A `w` by `h` window onto a true-size drawing, for a frame about one control |

Only on a page drawn without a project's kit, which brings its own in their place:

| Piece | Draws |
| --- | --- |
| `web(url, inner)`, `phone(inner)`, `panel(inner)` | A browser window, a phone (390x844), one piece of UI floated on the ground |
| `shell(rail, body, aside)`, `navItem(label, { active, icon })`, `group(text)` | An app with a side rail, its items and its section labels |
| `btn(label, { cls, icon, full })`, `field(label, { value, placeholder, hint, error })`, `toggle(label, { on })` | Form controls |
| `grid(headers, rows)`, `empty(icon, title, note)` | A table; an empty state |
| `bars(...widths)` | Grey bars for incidental text, `bars("100%", "78%", "62%")` |

Icons are Phosphor regular, `ph ph-<name>`. Write class names out whole: one built by interpolation (`bg-${tone}-500`) draws nothing. When frames repeat something no piece covers, write a small helper, and leave none that no frame calls.

## Rules

### Scope

- Draw the states the request asks about, and no others. When it's about one panel, its edge states (empty, loading, too many, denied, offline) count as asked: nobody remembers to ask for them.
- Draw several frames, one state each, usually before, during and after one interaction (`patterns.md` has the four ways a set can vary). Never one frame with a paragraph.
- Before drawing a screen that exists, read its current component, or snapshot it when your browser can reach it (`snapshots.md`), so the frame starts from what ships rather than from memory.
- Leave out chrome the proposal isn't about, unless a project's kit says otherwise.

### The page

- Keep it to the drawing: the title, at most one line under it, the frames, and the source line. Everything else goes in frame notes.
- Name it like a folder: the part of the product, a colon, and what this version tries, in three to seven words of sentence case (_Checkout: sold out mid-payment_), with no made-up words or version numbers. The file is the date plus a slug of the name. Only the page uses the colon.
- Be honest in `source`: the real product, a screenshot or a description, and what you invented.

### Drawing

- Everything at its real size: a window is 1280x800, a phone 390x844, a panel what it measures (`patterns.md` lists sizes). Use the normal type scale; never shrink by hand or write `text-[9px]`, since the page scales frames.
- Frames stay light when the reader turns the page dark. A dark frame takes `dark: true` and the theme's colors (`bg-background`, `text-foreground`), not fixed ones like `bg-white`.
- Grey bars for incidental text, and real, final copy for the words that matter: labels, warnings, empty states, the buttons the proposal is about. Never lorem ipsum.
- Write that copy by the project's UI copy rules; in the Instrument repo, the "UI copy" section of its `CLAUDE.md`.

### Titles and notes

Write them the way a designer talks to a teammate in a design review.

- A title names the screen like an artboard, in a word or two (_Choose a plan_), with the state after it when frames share a screen (_Notifications allowed_). The product as it ships today, outside a current-design group, adds _(Current design)_. A title never explains, so no colon, no "X, not Y", no reason.
- A note is one sentence under about 160 characters, in the first person and the active voice, leading with the decision: "We check the seat is still free before we charge the card, so nobody pays for a seat they didn't get." Add a second only when you need it.
- Assume the reader saw no earlier version: no "unchanged", "from last round" or "New:". If something has to be built, say so in a sentence.
- Read each aloud and rewrite passive voice, a label and a colon before the point, a sentence opening on a participle, objects that talk ("the row says"), piled-up nouns, and clauses chained with semicolons.
- Star a pick only where you'd choose it, and never write "recommended": the star says it. Picks go on the frames you'd choose, in whichever sets they fall.
- Give an option you'd drop `verdict: "skip"` and one you'd leave for later `verdict: "later"`, rather than saying so in a set's name or a note: the reader reads the strip and the title, not the notes. The note still gives the reason in a clause.

## Revising a page

- A fix to the page you just made changes its part in place. A new round the reader will compare with the last starts as a copy of the last round's part under the new name, so only the frames that change get written.
- The build lists every frame by its label and the lines of its block (`A2  Payment  lines 47-55`), so a frame the reader names is a block you can go to. Change those blocks; never write a part out again to change a frame or two.
- Edit with your edit tool, or a script that stops when a text it replaces doesn't match exactly once. Not `sed -i`: macOS sed reads no `\b`, `\s` or `\d` and changes nothing without saying so.

## Hand it over

Give the page's path as the `open-in-instrument` skill's link line when that skill is installed, and name the sets by their marks. Before publishing a link, or reading a wireframe someone sent as one, read `handover.md`: never publish with a host's own tool, and never publish the reader's private figures or names without asking.

## When you need more

- `patterns.md`: common sizes, the four ways a set of frames can vary, how marks are drawn, grey bars.
- `snapshots.md`: frames from a snapshot of a live page, edited by name.
- `prototype.md`: one live screen to click through or replay, instead of frames.
- `handover.md`: publishing a link, and reading a wireframe from one.
- `check.mjs <page>` checks a built page again without a browser. A page made with `new.mjs`, with its frames in a `states` array, still opens and checks as before.
