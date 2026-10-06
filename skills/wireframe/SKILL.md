---
name: wireframe
description: "Use when asked to wireframe, mock up or sketch a product screen or UI flow, or when an interface is being argued about in prose. Draws software as true-size frames across states, with click marks and captions, in one self-contained HTML page."
---

# Wireframe

Draws a flow across states of a piece of software: a grid of frames, each drawn at the size the thing really is and scaled to fit, with a caption under each saying what that frame proves. Click and new marks sit on a layer over each frame, a button (or the `A` key) takes them off, a tap enlarges a frame, and `#frame-3` opens the page on the third frame enlarged.

## When to use it

When someone asks for a wireframe, a mockup, a layout sketch or "what would that look like", and when a page you are writing keeps describing an interface in prose: three paragraphs about where a button goes is a wireframe not yet drawn. Not for something the reader will type into or get a number out of (build that as a small tool), not for an interface that exists and can be screenshotted, not for boxes and arrows (a diagram), and not for a whole design system: one flow, one argument.

## Files

`<skill>` is the full path to this skill's folder; run commands from the task folder.

- `new.mjs`: writes a new wireframe page from the two files below. Inside a git repository it names the repository in an `instrument:repo` meta, so a folder of wireframes from several products can be told apart.
- `repo.mjs`: that name and that meta, for a project's own kit to call when it builds pages itself.
- `shell.html`: the page shell: Studio's theme as Tailwind tokens, the compiled sheet, the pinned Tailwind browser build, the icon set, the share widget and its Share button. Frames are drawn in Tailwind's vocabulary, as are projects' own wireframe kits. Leave its `shell:start` ... `shell:end` regions alone.
- `share.mjs` and `share.py`: publish a finished page to a link (below).
- `main.html`: the title bar, the frame grid, the neutral kit of software pieces (`win`, `web`, `phone`, `panel`, `shell`, `navItem`, `group`, `btn`, `field`, `toggle`, `chip`, `grid`, `empty`, `bars`), the marks, the enlarged view, and the `states` array you fill.
- `patterns.md`: the frame's two-element shape, sizes worth knowing, the three axes a set of states can vary along, marking without decorating, bars, and printing.

## Worked example

```
node <skill>/new.mjs 2026-10-05-checkout-sold-out-mid-payment.html "Checkout: sold out mid-payment"
```

Then, in the page's module script, replace the `states` array between `// ---- the frames` and `// ---- render`, set the one line under the title and the `#source` line, set `SLOT_H` near the height most frames scale to, and delete every helper you do not call:

```js
const states = [
  {
    title: "Paying",
    note: "The seat is held while the card is checked, and the timer says so.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5 space-y-4">${field("Card number", { value: "•••• 4417" })}${clickable(btn("Pay $84", { cls: "bg-brand-600 text-white", full: true }))}</div>`,
    ),
  },
  {
    title: "Sold out",
    note: "The money is never taken: the error comes before the charge.",
    w: 390,
    h: 844,
    body: phone(
      `<div class="p-5">${fresh(`<p class="text-sm font-semibold">Those seats just sold</p>`)}<div class="mt-3 space-y-2.5">${bars("100%", "64%")}</div></div>`,
    ),
  },
];
```

Look at it in your browser tool before you hand it over, since a module script that throws leaves the grid blank:

```
agent-browser open 2026-10-05-checkout-sold-out-mid-payment.html
agent-browser errors
agent-browser screenshot checkout.png
```

`errors` must come back empty; fix the page's script until it does. Then look at the screenshot: every frame drawn, its caption under it, nothing cut off. The page must sit in the task folder (or a folder the user granted) for the browser to open it. With no browser tool, tell the user the page is unchecked.

## Rules

- **The page is the drawing.** A title bar with the name and at most one line, the frames, and one line under them saying what the frames are drawn against and what was invented. No opening paragraph, no closing section: every other sentence is a caption.
- **Name it like a folder**: the part of the product, a colon, what this take tries. _Checkout: sold out mid-payment_, _Calendar connection: every state_. Three to seven words, sentence case, no coined words, no version words. The file is the date and the slug.
- **A sequence, not a screen.** One frame per state: resting, the interaction, the result. Or one panel in every condition (empty, loading, one, many, denied, offline), or one screen at three widths. Never one frame and a paragraph.
- **Show the click, mark the new**, with `clickable`, `fresh`, `noted` and `ann`. One click per frame. Never a green row or a check mark standing in for a mark: those look like the product. A mark drawn by hand carries the class `ann`, or the marks button leaves it behind.
- **True size.** A window is 1280x800, a phone 390x844, a panel what it measures. Use the ordinary type scale; never shrink by hand, never set a scale, never `text-[9px]`. The page scales with `transform`.
- **Bars for prose, real copy where the idea lives.** Grey bars for incidental text; final-quality words for labels, warnings, empty states and the buttons that carry the proposal. No lorem.
- **The caption argues.** "Nothing is sent by hovering", not "the thumbs buttons". Put the burden of proof early.
- **Draw the states nobody asks for**: empty, loading, too many, denied, expired, offline. Draw no chrome the proposal is not about.
- **Honesty**: the line under the frames says whether they are drawn against a real product, a screenshot, or only the description, and what was invented to fill a row.

## A project's own kit

When the folder you work in, or one above it, has `.agents/wireframe-kit/KIT.md`, read it before drawing and use its functions in place of the neutral ones of the same name. The shell, the marks and the enlarged view still come from this skill's `shell.html` and `main.html`.

## Hand it over

Open the page in whatever this environment offers and give the path. Where the reader cannot open a file from where they are, or asked for a link, publish it: `node <skill>/share.mjs page.html` (or `python <skill>/share.py page.html`) puts a copy at its own unlisted address, served for thirty days, and prints the link and a delete token; `--delete` takes it down. Otherwise offer that in one plain sentence ("Want me to put a private copy online? Only people you send the address to can open it, and it deletes itself in a month") and let them answer. Never publish a page carrying the reader's private figures or names without asking.
