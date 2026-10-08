---
name: wireframe
description: "Use when asked to wireframe, mock up or sketch a product screen or UI flow, or when an interface is being argued about in prose. Draws software as true-size frames across states, with click marks and captions, in one self-contained HTML page."
---

# Wireframe

This skill draws a flow through a piece of software as a grid of frames. We draw each frame at the real size of the screen and scale it down to fit, with a title and a short note under it. Click marks and "new" marks sit on a layer over each frame, and the reader can hide them with a button or the `A` key. Tapping a frame enlarges it, and adding `?frame=3` to the URL opens the page with the third frame enlarged. The line under the title is also the page's description, which a link preview shows under the title, and a link with `?frame=3` shows that frame's title and note instead.

## When to use it

Use it when someone asks for a wireframe, a mockup, a layout sketch, or "what would that look like". Also use it when you catch yourself describing an interface in prose. If you've written three paragraphs about where a button goes, draw it instead.

Don't use it for:

- something the reader types into or gets a number out of (build a small tool instead)
- an interface that already exists and can be screenshotted
- boxes and arrows (draw a diagram instead)
- a whole design system. One wireframe page covers one flow and makes one case.

## Files

`<skill>` is the full path to this skill's folder. Run commands from the task folder.

- `new.mjs` writes a new wireframe page from the two files below. Inside a git repository, it adds an `instrument:repo` meta tag with the repository's name, so wireframes from several products can share one folder and still be told apart.
- `repo.mjs` provides that name and meta tag, for a project's own kit to call when it builds pages itself.
- `shell.html` is the page shell. It holds Studio's theme as Tailwind tokens, the compiled stylesheet, the pinned Tailwind browser build, the icon set, and the share widget with its Share button. We draw frames with Tailwind classes, and projects' own wireframe kits do too. Don't edit anything between `shell:start` and `shell:end`.
- `share.mjs` and `share.py` publish a finished page to a link (see "Hand it over" below).
- `main.html` holds the title bar, the frame grid, the marks, the enlarged view, the `states` array you fill in, and a neutral kit of software pieces: `win`, `web`, `phone`, `panel`, `shell`, `navItem`, `group`, `btn`, `field`, `toggle`, `chip`, `grid`, `empty` and `bars`.
- `patterns.md` explains how a frame is built from two elements, lists common screen sizes, and covers the three ways a set of frames can vary, how marks work, grey bars, and printing.

## Worked example

```
node <skill>/new.mjs 2026-10-05-checkout-sold-out-mid-payment.html "Checkout: sold out mid-payment"
```

Then edit the page's module script:

1. Replace the `states` array between `// ---- the frames` and `// ---- render`.
2. Fill in the one line under the title and the `#source` line.
3. Set `SLOT_H` close to the height most of your frames scale to.
4. Delete every helper you don't call.

```js
const states = [
  {
    title: "Payment",
    note: "We hold the seat and show a countdown while we check the card, so nobody loses it halfway through paying.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5 space-y-4">${field("Card number", { value: "•••• 4417" })}${clickable(btn("Pay $84", { cls: "bg-brand-600 text-white", full: true }))}</div>`,
    ),
  },
  {
    title: "Sold out",
    note: "We check the seat is still free before we charge the card, so nobody pays for a seat they didn't get.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5">${fresh(`<p class="text-sm font-semibold">Those seats just sold</p>`)}<div class="mt-3 space-y-2.5">${bars("100%", "64%")}</div></div>`,
    ),
  },
];
```

Check the page in your browser tool before you hand it over. If the module script throws an error, the grid comes up blank.

```
agent-browser open 2026-10-05-checkout-sold-out-mid-payment.html
agent-browser errors
agent-browser screenshot checkout.png
```

`errors` must come back empty, so fix the script until it does. Then look at the screenshot and make sure every frame is drawn, each one has its caption, and nothing is cut off. The browser can only open the page if it's in the task folder or a folder the user granted. If you have no browser tool, tell the user you couldn't check the page.

## Rules

### The page

- Keep the page to the drawing. It has a title bar with the name and at most one line under it, then the frames, then one line saying what you drew from and what you made up. Don't add an intro paragraph or a closing section. Everything else you have to say goes in the frame notes.
- Name the page the way you'd name a folder: the part of the product, a colon, and what this version tries. For example, _Checkout: sold out mid-payment_ or _Calendar connection: every state_. Use three to seven words in sentence case, with no made-up words and no version numbers. The file name is the date plus a slug of the name. Only the page uses this colon pattern. Frames don't.
- Be honest about your sources. The line under the frames says whether you drew from the real product, a screenshot, or only a description, and what you invented to fill things out.

### Frames

- Draw several states, one per frame. Usually that's before, during and after one interaction. You can also show one panel in every condition it can be in (empty, loading, one item, many, denied, offline), or one screen at three widths. Never hand over a single frame with a paragraph of explanation.
- Show where the reader clicks and what's new, using `clickable`, `fresh`, `noted` and `ann`. Use at most one click per frame. Don't use a green row or a check mark as a mark, because those look like part of the product. If you draw a mark by hand, give it the class `ann`, or it stays on screen when the reader hides marks.
- Draw everything at its real size. A window is 1280x800, a phone is 390x844, and a panel is whatever it measures. Use the normal type scale. Don't shrink anything by hand, set a scale, or use classes like `text-[9px]`, because the page already scales frames with `transform`.
- Use grey bars for incidental text. Write real, final-quality copy for the words that matter: labels, warnings, empty states, and the buttons the proposal is about. Never use lorem ipsum.
- Draw the states nobody asks for: empty, loading, too many, denied, expired and offline. Leave out any chrome the proposal isn't about.

### Titles and notes

Write these the way a designer talks to a teammate in a design review.

- Name each frame the way you'd name an artboard in a design file. Use the screen's name in a word or two, such as _Welcome_, _Choose a plan_, _Import memories_ or _Allow notifications_. When several frames show the same screen, add the state after the name, so _Allow notifications_ is followed by _Notifications allowed_. When a frame shows the product as it ships today, add _(Current design)_, as in _Welcome (Current design)_. A title never explains anything, so it never has a colon, an "X, not Y", or a reason in it.
- Write each note in one sentence if you can, and use two or three only when you need them. Say what we're doing on this screen and why, in the first person and the active voice: "We check the seat is still free before we charge the card, so nobody pays for a seat they didn't get." Lead with the decision. "Hovering doesn't send anything. You have to click." tells the reader far more than "The thumbs buttons".
- Assume the reader hasn't seen any earlier version. Don't write "unchanged", "from last round", or labels like "New:". If something has to be built, say so in a sentence: "This needs a new model call to write the prompts."
- Read every title and note aloud before you hand the page over, and rewrite anything a person wouldn't say. These are the usual problems:
  - passive voice ("The seat is held while the card is checked")
  - a label and a colon before the point ("Allowed: the row says so")
  - a sentence that opens on a participle ("Pressed, the chip opens into a field")
  - objects that talk ("the line says", "the row says so")
  - piled-up nouns ("memory's fingerprint, its mark in Settings")
  - clauses chained together with semicolons

Here's one rewrite. Before: "Said plainly as memory, with memory's fingerprint on a badge at the icon's corner." After: "We call it memory and reuse the icon from Settings › Memory, so it looks familiar when they find it there later."

## A project's own kit

If the folder you're working in, or a folder above it, has `.agents/wireframe-kit/KIT.md`, read it before you draw. Use its functions in place of the neutral ones with the same names. The shell, the marks and the enlarged view still come from this skill's `shell.html` and `main.html`.

## Hand it over

Give the user its path, and show the page in this environment's preview of local files if it has one. If the reader can't open a file from where they are, or they asked for a link or to share, send or post the page, publish it yourself with `node <skill>/share.mjs page.html` (or `python <skill>/share.py page.html`); don't point them at the Share button instead. Never publish it with a host's own tool, such as a claude.ai Artifact, a canvas or a gist: the host blocks the page's scripts and Share button and keeps a copy `--delete` can't reach. The script puts a copy at its own unlisted address for thirty days and prints the link and a delete token, and `--delete` takes it down. Otherwise, including when they only say someone else will see it, offer it in one plain sentence ("Want me to put a private copy online? Only people you send the address to can open it, and it deletes itself in a month.") and wait for their answer. Never publish a page with the reader's private figures or names in it without asking first.
