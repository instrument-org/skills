# Storyboard

One self-contained HTML page that shows an experience as it would be lived: a handful of drawn panels, a person in each, one beat apiece, with a caption under each saying what that moment proves. Not a flow, not a sequence of screens, not a timeline of events. Moments, with someone in them.

A [wireframe](../wireframe/template.md) draws what is on the screen. A storyboard draws what is happening to the person. That is the whole difference, and it is the reason this template exists: some arguments cannot be made about an interface or a process at all, only about a Tuesday morning.

## When to reach for it

Reach for it when someone asks what something would be like, how it would feel, or what happens to the customer, the new starter, the patient, the driver. "Walk me through it", "what's the experience", "show me a day in the life", "storyboard this", "what does the customer actually see" are the phrases. Three shapes come up:

- **Moments in a day.** The service storyboard: six or so beats with a time on each, showing where an experience breaks or where a proposed one is better. The argument is usually one panel, and the caption names it.
- **A shot list.** The film storyboard: what the camera sees, shot by shot, with the kind of shot, a timecode, and the line said over it set apart from what is seen. For a video, a spot, an explainer, a walkthrough.
- **Two tracks.** The product storyboard: the person on one side of every panel and the screen in their hand on the other, so what they do and what they see can be argued with separately, and the screens line up down the page.

Reach for it unprompted when a proposal keeps saying "the user then" and nobody has drawn the user.

Do not reach for it when the subject is the interface, which is a wireframe, or a drawing the reader will edit, which is a [whiteboard](../whiteboard/template.md), or events in order without a person, which is a [timeline](../timeline/template.md). Nor for more than about eight beats: past that it is a film, and a storyboard of forty panels is one nobody reads.

## The shape

**The page is the storyboard.** A name, one line under it, the panels, and one line underneath. There is no prose column, no opening paragraph, and no section after the panels: the captions are where the argument goes, because a caption sits under the thing it is about and a section does not.

- **A name and one line.** Who this is, and what the beats are meant to settle.
- **The panels.** Each carries its number, a time or timecode, the drawing, and a caption. A panel may also carry one line of what is said, set apart from the caption.
- **One line underneath.** What the beats are drawn from: interviews, a visit, a brief, the prompt alone. And what was invented to fill a panel.

## The cast and the set

Nobody draws these panels; they are composed from a kit that ships in both languages, as a library to import rather than code to copy: `scripts/panels.mjs` for `node` and `scripts/panels.py` for `python`, neither with any dependency, and `patterns.md` has the worked example. A person is a few thick round-capped strokes in one flat color, which reads as a pictogram and so as deliberate, where a thin stick figure reads as unfinished. The set is thin outline behind them: a door, a counter, a desk, a sofa, a phone, a van, a clock. The contrast between the two is what makes a composed scene look drawn on purpose.

Three rules the kit enforces and a hand-drawn panel forgets:

**The floor is at one height, and everyone stands on it.** A standing person's feet and a sitter's feet are at the floor, and a seat is at one height above it, so a person put in a chair lands in the chair.

**Furniture a person sits in or stands behind comes in two pieces.** `back`, then the person, then `front`. Draw the sofa in one piece and their shins cross the cushion, which is the one mistake that reads as an error rather than as a style.

**One accent color per panel, on the thing the beat is about.** The clock that says forty minutes, the screen that finally works, the person who arrives. Everything else is ink and grey. A panel with two accents has two subjects, and a beat has one.

## The rules that make a storyboard work

**One beat per panel.** Something changes for the person between this panel and the next, and the caption says what. A panel that shows a state rather than a change belongs in a wireframe.

**A person in every panel**, with at most one exception per board: a close-up on the thing in their hand, drawn large, where the hand is the person. A storyboard with no one in it is a set of empty rooms.

**The caption argues.** "Forty minutes on the sofa, watching everyone else badge through" is a caption. "Ash waits on a sofa" is a description of the drawing the reader can already see.

**Time on every panel.** A clock time for moments, a timecode for shots, a number for the two-track. Time is what makes a set of pictures a sequence.

**Say what is said, apart from what is seen.** Speech goes in a bubble in the panel when it is short, and in its own line under the caption when it matters. On a shot list the line said over the shot is the second column, in monospace, because it is copy rather than commentary.

## What varies here

Free, and expected to differ between two pages made a day apart: which of the three shapes it is; the panel aspect (4:3 for moments, 16:9 for shots, wide for two tracks); how many beats, between four and eight; whether anyone speaks; what the accent marks; the layout of the panels on the page; and the cast, which is whoever the story needs.

Fixed: the page is the panels, every panel has a number, a time and a caption, the people are pictograms, and the line underneath says what the beats rest on.

## What it may load, and what has to survive without it

Nothing beyond the starter's fonts, icon set and Tailwind build. Every panel is inline SVG in the page's own palette, so the file opens from a folder with no network and prints as drawn, in both themes. There is no library that would help.

## Refusals

**An opening paragraph, a closing section, or any prose that is not a caption or the one line underneath.** A panel with no person in it, other than one close-up. A beat that changes nothing. A caption that describes the picture. A panel with two people and a sofa drawn in one piece, so limbs cross furniture. Thin stick figures. Two accent colors in one panel. Text laid over a drawing. A photo, or a generated image, where a composed panel would do. More than eight beats. A storyboard of screens with nobody in front of them.

## Honesty about the story

Say underneath what the beats are drawn from. A storyboard composed from interviews is evidence about how something is; one drawn from a brief is a proposal about how it could be, and the two look identical on the page. Where a time, a price, a name or a line of dialogue was invented to fill a panel, say so in the same line rather than letting a plausible 09:52 be read as a measurement.
