# Wireframe

One self-contained HTML page showing a **flow across states** of a piece of software: a sequence of frames, each drawn at the size the thing really is, with a caption under each saying what it proves. Not a prototype, not a component library, not a spec. It exists to make a proposal legible to someone who will not read the plan.

Every other template argues in sentences. This one argues in pictures, and the sentences are captions. Reach for it when the fastest way to settle a disagreement is to draw the thing and point at it.

## When to reach for it

Reach for it when someone asks for a wireframe, a mockup, a layout sketch, a UI concept, or "what would that look like"; when a proposal, plan, or bug report would be clearer as a sequence of screens; and when a conversation about an interface has gone three rounds without anyone drawing it. "Sketch the login page", "mock up the settings screen", "show me the flow", "what happens after they tap that" are the phrases.

Reach for it unprompted when a page you are already writing keeps describing an interface in prose. Three paragraphs about where a button goes is a wireframe that has not been drawn yet.

Do not reach for it when the answer is a working thing rather than a picture of one: something the reader will type into, run, or get a number out of is a [tool](../tool/template.md). Do not reach for it to document an interface that already exists and can be screenshotted, since a drawing of a real screen is a worse copy of it. Do not reach for it for a diagram of boxes and arrows, which is an explainer's job. And do not draw a whole design system: one flow, one argument.

## The shape

There are three slots and two of them are one line each, because **the page is the drawing**. This template has no prose column, no opening paragraph, and no sections after the frames.

- **A title bar.** A name, and at most one line under it saying what is being proposed and what the frames are meant to settle. It sticks to the top of the window, so it also carries the two controls and the legend.
- **The frames.** The whole rest of the page.
- **One line underneath.** What the frames are drawn against and what was invented to fill a row. Delete it when there is nothing true to put there.

Everything else goes in the captions. A caption is the only prose on this page that has a reader, because it sits under the thing it is about; the same sentence in a section three screens down is one nobody reaches. A wireframe surrounded by an argument is an argument with pictures in it, and the pictures are what was asked for.

So: no thesis paragraph, no "what this settles" ledger, no reading notes, no evidence footer. When a decision genuinely has to be argued, the argument is a [briefing memo](../briefing-memo/template.md) that links this page, not two sections bolted to it.

## The two rules that matter

**Show a sequence, not a screen.** One frame per state: resting, the moment of interaction, the result. A single screen shows what something looks like; a sequence shows what happens, which is what a proposal has to argue. Some subjects want a different axis — five states of one panel, three kinds of data, the same screen at three widths — and that is fine as long as the frames are doing comparative work. What is never fine is one frame and a paragraph.

**Show the click, mark the new.** The reader has to see what was clicked to get from one frame to the next, and what changed because of it, and neither may look like part of the design. That is what `cursor`, `ann`, `noted`, `clickable` and `fresh` are for: a pointer on the thing being clicked, a dashed orange ring for the click, a dashed violet ring for what appeared. The colors are ones interfaces do not use for themselves, so they read as commentary. One click per frame. Never a green row, a highlighted tile, or a check mark standing in for either: those look like the product, and they are not.

**And let the reader take them off.** The marks button in the title bar, and the `A` key, hide every annotation in the grid and in the enlarged view at once, so the same file is both the argument and the drawing on its own. It works because the rule hangs off the body and every annotation carries the class `ann`, which is the one thing to get right when you draw a mark by hand instead of calling the kit: a ring without that class is a ring that stays on when someone asked to see the design.

## Draw at true size

**Draw every frame at the size the thing really is.** A desktop window is 1280x800. A phone is 390x844. A settings panel is whatever it actually measures, around 520 wide. Use the ordinary type scale inside it: `text-sm`, `text-xs`, real padding, real spacing.

The page measures its own width, works out how many frames fit per row, and scales them with `transform` to match. Tapping one opens it as large as the space around the caption allows, which is why the page survives being read on a phone. Nothing renders above its true size.

So: never shrink a drawing by hand, never set a scale, and never reach for `text-[9px]` to make something fit. A frame drawn small is small twice, once in the grid and again when it is enlarged. `zoom` looks like a shortcut here and is not: it re-runs layout at the smaller size, so text re-wraps and the miniature stops matching the thing it depicts, where `transform` composites a box that was laid out once.

## Bars for prose, real copy where the idea lives

Every piece of text is a decision the reader has to evaluate. Grey bars for message bodies, article text, and anything incidental; real, final-quality copy for the labels, warnings, empty states, and buttons that carry the proposal. All lorem reads as unfinished. All real text buries the point.

Corollaries:

- The caption says **what the frame proves**, not what it depicts. "Nothing is sent by hovering" beats "the thumbs buttons".
- Put the burden of proof early. Someone who stops halfway should already have seen the thing being argued.
- Draw no chrome the proposal is not about. No sidebar, title bar, or tab strip unless they are in question, even though the kit makes drawing one a single call.
- Draw the states nobody asks for: empty, loading, one item, too many items, denied, expired, offline. That is where a design is actually decided, and it is what separates a wireframe from a picture of a happy path.

## What varies here

Free, and expected to differ between two pages made a day apart: the chrome (window, browser, phone, bare panel, or none); the frame size and whether the file mixes sizes; how many frames and along which axis they vary; whether the kit's helpers are used at all or the frames are written out; and `SLOT_H`, which is the one number worth tuning per file, since it is the height every tile gives its frame.

Fixed: the page is the frames. The title bar stays one line, the grid gets the window, and nothing is added before or after.

## What it may load, and what has to survive without it

Nothing beyond the starter's fonts, icon set and Tailwind build. There is no dataset here and no library that would help.

This template does draw its frames from its own inline `states` array rather than writing them out as markup, which is the one place it differs from the rest of the family. The reason is that a frame is mostly repeated shell, and a file that writes six windows out longhand is a file nobody will revise. The array is in the page, so nothing is fetched and nothing is missing offline: open it from a USB stick in a year and it draws exactly as it does now. It is the network the offline test is about, and this page never touches it.

## Refusals

A page that could be any of the examples with the words swapped. One frame and three paragraphs. **An opening paragraph, a closing section, or any prose at all that is not a caption or the one line under the frames.** A frame with no caption, or a caption that describes the drawing instead of arguing from it. Lorem ipsum in a button. A happy path with no failure state. Chrome the proposal is not about, drawn because the kit made it easy. A click that is implied rather than marked, or marked with a green highlight that reads as part of the design. An annotation drawn without the `ann` class, so the marks button leaves it behind. A drawing shrunk by hand to fit. A wireframe of an existing screen that could have been a screenshot. Copy that says `Lorem` where a real warning belongs, or says nothing where the whole argument lives.

## Honesty about the drawing

Say what the frames are drawn against: a real product you measured, a screenshot you were given, or nothing but the description in the prompt. A wireframe drawn from a description is a proposal; one drawn from a real screen is a claim about that screen, and the difference decides how much weight a reader should put on it. That belongs in the one line under the frames, which is what that line is for.

Where a frame invents a number, a name, or a piece of data to fill a row, the same line says so rather than letting it be read as research. And where you drew something the prompt did not ask for because the flow needs it, the caption on that frame says so, so it can be argued with in the place where it is visible.
