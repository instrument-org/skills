---
name: wireframe
description: "Use when asked to wireframe, mock up or sketch a product screen or UI flow, or when an interface is being argued about in prose. Draws software as true-size frames across states, with callouts and captions, in one self-contained HTML page, or as one live prototype screen to click through or replay. Also use it to read a wireframe someone sent as a link."
---

# Wireframe

This skill draws a flow through a piece of software as a grid of frames. We draw each frame at the real size of the screen and scale it down to fit, with a title and a short note under it. Callouts outline a region of a frame, and their words show over it when the reader presses `A`. Tapping a frame enlarges it, and a frame far taller than the screen, such as a whole web page, opens at its width and scrolls. The arrow keys step through the frames, and adding `?frame=3` to the URL opens the page at the third frame. The line under the title is also the page's description, which a link preview shows, and a link with `?frame=3` shows that frame's title and note instead.

## When to use it

Use it when someone asks for a wireframe, a mockup, a layout sketch, or "what would that look like". Also use it when you catch yourself describing an interface in prose. If you've written three paragraphs about where a button goes, draw it instead. When the screen already exists and your browser tool can open it, start from a snapshot of it instead of redrawing it (see "Frames from a snapshot" below).

Don't use it for:

- something the reader types into or gets a number out of (build a small tool instead)
- boxes and arrows (draw a diagram instead)
- a whole design system. One wireframe page covers one flow and makes one case.

## Files

`<skill>` is the full path to this skill's folder. Run commands from the task folder.

- `new.mjs` writes a new wireframe page from the two files below. Inside a git repository, it adds an `instrument:repo` meta tag naming the repository, which the index app files the page under.
- `check.mjs` checks a page without a browser: every script parses, and every frame draws (see "Worked example" below).
- `repo.mjs` provides that name and tag, for a project's own kit to call when it builds pages itself.
- `shell.html` is the page shell. It holds Studio's theme as Tailwind tokens, the compiled stylesheet, the pinned Tailwind browser build, the icon set, and the share widget with its Share button. We draw frames with Tailwind classes, and projects' own wireframe kits do too. Don't edit anything between `shell:start` and `shell:end`.
- `share.mjs` and `share.py` publish a finished page to a link (see "Hand it over" below).
- `prototype.html` holds the other kind of page: one live screen instead of a grid (see "A prototype instead of frames" below).
- `main.html` holds the title bar, the frame grid, the marks, the enlarged view, the `groups` and `states` you fill in, and a neutral kit of software pieces: `win`, `web`, `phone`, `panel`, `shell`, `navItem`, `group`, `btn`, `field`, `toggle`, `chip`, `grid`, `empty` and `bars`.
- `snapshot.js` captures the page open in your browser tool as one self-contained snapshot, `add-snapshot.mjs` puts snapshots into a wireframe page, and `snapshot-frames.js` is the script it adds there, which draws `snap()` frames (see "Frames from a snapshot" below).
- `patterns.md` explains how a frame is built from two elements, lists common screen sizes, and covers the four ways a set of frames can vary (moments, conditions, widths and options), how marks work, every target and edit `snap()` takes, grey bars, and printing.

## Worked example

```
node <skill>/new.mjs 2026-10-05-checkout-sold-out-mid-payment.html "Checkout: sold out mid-payment"
```

Then edit the page's module script:

1. Replace the `states` array between `// ---- the frames` and `// ---- render`, and fill in `groups` if the frames fall into sets.
2. Fill in the one line under the title and the `#source` line.
3. Delete every helper you don't call.

```js
const states = [
  {
    title: "Payment",
    note: "We hold the seat and show a countdown while we check the card, so nobody loses it halfway through paying.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5 space-y-4">${field("Card number", { value: "•••• 4417" })}${btn("Pay $84", { cls: "bg-brand-600 text-white", full: true })}</div>`,
    ),
  },
  {
    title: "Sold out",
    note: "We check the seat is still free before we charge the card, so nobody pays for a seat they didn't get.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5">${noted(`<p class="text-sm font-semibold">Those seats just sold</p>`, "checked before charging")}<div class="mt-3 space-y-2.5">${bars("100%", "64%")}</div></div>`,
    ),
  },
];
```

Check the page each time you finish an edit, before you open it anywhere: `node <skill>/check.mjs 2026-10-05-checkout-sold-out-mid-payment.html`. It parses every script the way the browser does, then draws the frames in Node, and prints a FAIL line with the page's line number for a script that can't load, a name nothing defines, or a frame that draws `undefined`. Any of those leaves the grid blank or a frame wrong, so fix each one. A page whose frames use `document` or `window` it parses but can't draw, and it says so.

Then check the page in your browser tool before you hand it over, since only a browser shows how it looks.

```
agent-browser open 2026-10-05-checkout-sold-out-mid-payment.html
agent-browser errors
agent-browser screenshot checkout.png
```

`errors` must come back empty, so fix the script until it does. Then look at the screenshot and make sure every frame is drawn, each one has its caption, and nothing is cut off. Marks start hidden, so press `A` and take a second screenshot to check that each callout sits on the element it names. The browser can only open the page if it's in the task folder or a folder the user granted. If you have no browser tool, tell the user that `check.mjs` passed but you couldn't look at the page.

## Frames from a snapshot

A snapshot is a page as your browser tool drew it, kept whole, and a frame drawn from one is the real screen, edited by the words a person reads on it. Use one whenever the screen exists and your browser can reach it, and draw from scratch only screens that don't exist yet, mixing the two frame by frame.

1. At the frame's size, click into the state you'll draw (a menu open, a tab chosen) and capture it. Repeat per state: one you never clicked into isn't in the snapshot.

```
agent-browser set viewport 1280 800
agent-browser open https://tryinstrument.com/pricing
agent-browser eval --stdin < <skill>/snapshot.js > pricing.json
```

2. Make the page with `new.mjs` and write its frames, then add the snapshots last, as a page holding them is too large for most edit tools: `node <skill>/add-snapshot.mjs page.html pricing.json menu.json`. It prints what each couldn't keep, and `--remove <name>` drops one.
3. Draw the current design unedited, then edit copies of it, so every NEW reads against something shown:

```js
const states = [
  {
    title: "Pricing (Current design)",
    note: "…",
    ...snap.size("pricing"),
    body: snap("pricing"),
  },
  {
    title: "Pricing",
    note: "We show Pro's yearly price under its monthly one, so the saving is plain.",
    ...snap.size("pricing"),
    body: snap("pricing", ($) => {
      $({ role: "heading", text: "Pricing" }).text("Plans");
      $({ contains: "/ month", nth: 2 }).after(
        `<span style="display:block;font-size:13px">or $96 a year</span>`,
      );
      $("Choose Pro").note("starts a 14-day trial");
    }),
  },
];
```

- `$(target)` finds exactly one element by its words, a role, a label or a selector (every target and edit is in "Frames from a snapshot" in `patterns.md`). A target that matches nothing or several draws that frame as an error and throws one naming the close matches, which `agent-browser errors` shows.
- Edits mark nothing. `.note("words")` adds a callout and `.fresh()` NEW, and `noted` or `fresh` inside HTML you add works too.
- The snapshot keeps only the style rules its page used, so style what you add with `.look(target)`, a `.clone()` of a neighbor, or inline `style`.
- Frames draw as they come near the screen, so before a full-page screenshot run `agent-browser eval 'dispatchEvent(new Event("beforeprint"))'`.

A snapshot holds whatever the page showed, names and figures included. Capture from a test account where you can, edit the rest out, and never share the user's own screens without asking. Password fields are never kept. It can't capture a native app, and `add-snapshot.mjs` prints what it drew without, such as another site's embedded page.

## Rules

### The page

- Keep the page to the drawing. It has a title bar with the name and at most one line under it, then the frames, then one line saying what you drew from and what you made up. Don't add an intro paragraph or a closing section. Everything else you have to say goes in the frame notes.
- Name the page the way you'd name a folder: the part of the product, a colon, and what this version tries. For example, _Checkout: sold out mid-payment_ or _Calendar connection: every state_. Use three to seven words in sentence case, with no made-up words and no version numbers. The file name is the date plus a slug of the name. Only the page uses this colon pattern. Frames don't.
- Be honest about your sources. The line under the frames says whether you drew from the real product, a screenshot, or only a description, and what you invented to fill things out.

### Frames

- Draw several states, one per frame. Usually that's before, during and after one interaction. You can also show one panel in every condition it can be in (empty, loading, one item, many, denied, offline), or one screen at three widths. Never hand over a single frame with a paragraph of explanation.
- A callout outlines what to look at when the frame doesn't make it obvious. Its words, one short sentence, say what the drawing and the note can't: a behavior a still can't show ("scrolled into view on open"), a reason ("site name, so you judge the source first"), why something is missing, where data comes from, a limit ("Mac and Linux only"), or an open question. Use `noted(el, "words")`; the words show over the drawing on `A`. Never repeat the element's text or the note. Most frames need no callout.
- `fresh` puts NEW on what a revision changed, against a design the page also shows (the current design, or an earlier round). On a page that proposes something new throughout, leave it out. Don't use a green row or a check mark as a mark, because those look like part of the product. If you draw a mark by hand, give it the class `ann`, or it stays on screen while marks are off; it shows only with `A`.
- Frames stay in the light scheme even when the reader turns the page dark. To draw a frame in dark mode, give it `dark: true` and draw it with the theme's colors (`bg-background`, `text-foreground` and the rest), not fixed ones like `bg-white`; for both modes, draw the screen twice, once with `dark: true`.
- Draw everything at its real size. A window is 1280x800, a phone is 390x844, and a panel is whatever it measures. Use the normal type scale. Don't shrink anything by hand, set a scale, or use classes like `text-[9px]`, because the page already scales frames with `transform`.
- Use grey bars for incidental text. Write real, final-quality copy for the words that matter: labels, warnings, empty states, and the buttons the proposal is about. Never use lorem ipsum.
- Draw the states nobody asks for: empty, loading, too many, denied, expired and offline. Leave out any chrome the proposal isn't about.

### Titles and notes

Write these the way a designer talks to a teammate in a design review.

- When the frames fall into two or more sets the reader will name back to you, such as options, the current design and rounds, declare them in `groups` and give each frame its `group` (see "Groups" in `patterns.md`). The page labels the frames A1, A2, B1 for you, so a title never carries a letter. Keep every option on one page, so the current design is drawn once and the reader can step from A to B without switching files. When you hand the page over, name the sets by their marks.
- Name each frame the way you'd name an artboard in a design file. Use the screen's name in a word or two, such as _Welcome_, _Choose a plan_, _Import memories_ or _Allow notifications_. When several frames show the same screen, add the state after the name, so _Allow notifications_ is followed by _Notifications allowed_. When a frame shows the product as it ships today outside a current-design group, add _(Current design)_, as in _Welcome (Current design)_. A title never explains anything, so it never has a colon, an "X, not Y", or a reason in it.
- Write each note in one sentence if you can, and keep it under about 160 characters, which is two lines under a tile in the grid. Use a second sentence only when you need it. Say what we're doing on this screen and why, in the first person and the active voice: "We check the seat is still free before we charge the card, so nobody pays for a seat they didn't get." Lead with the decision. "Hovering doesn't send anything. You have to click." tells the reader far more than "The thumbs buttons".
- Assume the reader hasn't seen any earlier version. Don't write "unchanged", "from last round", or labels like "New:". If something has to be built, say so in a sentence: "This needs a new model call to write the prompts."
- Read every title and note aloud before you hand the page over, and rewrite anything a person wouldn't say. These are the usual problems:
  - passive voice ("The seat is held while the card is checked")
  - a label and a colon before the point ("Allowed: the row says so")
  - a sentence that opens on a participle ("Pressed, the chip opens into a field")
  - objects that talk ("the line says", "the row says so")
  - piled-up nouns ("memory's fingerprint, its mark in Settings")
  - clauses chained together with semicolons

Here's one rewrite. Before: "Said plainly as memory, with memory's fingerprint on a badge at the icon's corner." After: "We call it memory and reuse the icon from Settings › Memory, so it looks familiar when they find it there later."

### Recommending

- When you have a pick among the options, star it with `pick: true`, at most once per group, and only where you would actually choose it. The star says "recommended", so don't write the word in a title or note. With no pick, star nothing.

## A prototype instead of frames

Frames are for comparing states side by side. When the reader needs to use one screen instead, clicking into it, opening and closing things, or scrubbing through it over time, make a prototype: one screen drawn at its true size, scaled down only as far as the window needs, with everything on it live. There's no grid, no marks and no enlarged view, and the title bar has Fit and 100% in place of the density slider. A replay of something that happened over time is the usual case, with a scrubber under the screen.

```
node <skill>/new.mjs 2026-10-28-chat-replay-field-research.html "Chat replay: field research" --prototype
```

Then edit `SCREEN` under `// ---- the screen` in the page's module script. It needs `w`, `h` and `draw()`, which returns the screen's HTML from whatever state you keep beside it. `controls()`, if there is one, returns what goes under the screen at true size, such as a scrubber or a row of buttons, so they never shrink with the drawing. Change your state in your own listeners on `document`, and call `redraw()` to draw the screen again. For anything that changes every frame, like a scrubber being dragged, write to `#screen` directly instead of redrawing the controls, so the slider under the pointer isn't replaced mid-drag.

The same rules for the name, the line under it and the source line apply. Check it the same way, and click the things the reader will click.

## A project's own kit

If the folder you're working in, or a folder above it, has `.agents/wireframe-kit/KIT.md`, read it before you draw. Use its functions in place of the neutral ones with the same names. The shell, the marks and the enlarged view still come from this skill's `shell.html` and `main.html`, and a prototype's page from `prototype.html`.

## Hand it over

Give the user its path, as the `open-in-instrument` skill's link line when that skill is installed, and show the page in this environment's preview of local files if it has one. If the reader can't open a file from where they are, or they asked for a link or to share, send or post the page, publish it yourself with `node <skill>/share.mjs page.html` (or `python <skill>/share.py page.html`); don't point them at the Share button instead. Never publish it with a host's own tool, such as a claude.ai Artifact, a canvas or a gist: the host blocks the page's scripts and Share button and keeps a copy `--delete` can't reach. The script puts a copy at its own unlisted address for thirty days and prints the link and a delete token, and `--delete` takes it down. It publishes nothing while the page holds a string shaped like an API key, token or private key, and names each by line: replace each with a placeholder or masked text, or, when none is a working secret, run it again with `--allow-secrets`. Otherwise, including when they only say someone else will see it, offer it in one plain sentence ("Want me to put a private copy online? Only people you send the address to can open it, and it deletes itself in a month.") and wait for their answer. Never publish a page with the reader's private figures or names in it without asking first.

## Reading a wireframe from its link

A wireframe draws its frames with script, so its bytes hold the title and little else, and the link answers with what you can read instead. A fetch tool that asks for Markdown gets every frame's screen text, title and note, and after the screen text one line per mark, such as `(new mark: Convert)`, naming the mark and what it sits on. Fetched without asking for Markdown, as `curl <link>` does, the same address answers with the page as it was drawn: every frame's HTML and classes, with the scripts taken out. Read that HTML when you are building from a wireframe, since it is the layout itself. The Markdown keeps the words and drops how things look, so what is dimmed, disabled or the primary button, and where a link sits, is only in the HTML's classes; most of its bytes are the page's stylesheet, which you can skip. When you talk about a frame, give its number and title, so the reader can find it.
