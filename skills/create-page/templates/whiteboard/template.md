# Whiteboard

One self-contained HTML page that is a drawing board with the drawing already on it. The page opens as a real Excalidraw editor, fitted to the board, with every tool the reader would have on excalidraw.com: they move things, add to them, export a picture, save the file, or hand the drawing on to someone who does. Not a picture of a board, and not a document with a board in it. The board.

Every other template puts things in an order or a column. This one puts them in a **place**, and lets the reader change the place. The argument is what the arrangement makes visible, and the reader is meant to argue back by dragging.

## When to reach for it

Reach for it when what was asked for is a drawing someone will want to keep working on. Four shapes come up over and over:

- **A flow.** Boxes joined by arrows, where the argument is one step on the way: the one nobody owns, the one that takes twelve days, the one that loops. Draw it, ring it, write the finding next to it.
- **A plan.** Something already spatial: a floor, a site, a garden, a route. Distance on the board is distance in the world, the grid is a real unit, and a reader who drags a table has moved it by a distance the plan can name.
- **A sheet.** Things judged side by side, at the size they are judged: icon candidates at the size the phone draws them, three logo marks, four layouts of one screen. The things are real vectors on the board, so the reader can pick one up, scale it, and try it elsewhere.
- **A wall.** Notes sorted into groups by hand, where the grouping is a judgment the reader should be able to move.

"Put it on a board", "draw this out", "let me move things around", "I want to take this into Excalidraw", "map this out", "lay this out" are the phrases. Reach for it unprompted when a page you are writing keeps describing a layout in prose, or when the reader's next step is plainly to redraw what you would have written.

Do not reach for it when the drawing is finished and only needs looking at: a diagram in an [explainer](../explainer/template.md) costs nothing and prints. Nor for a sequence of screens, which is a [wireframe](../wireframe/template.md), nor for moments in a person's day, which is a [storyboard](../storyboard/template.md). Nor for many rows the reader wants to sort and filter, which is a [data explorer](../explorer/template.md). And do not reach for it because a board looks impressive: **if the reader would never drag anything, there is no board here**, only a picture that costs a megabyte.

## The shape

**The page is the board.** There is no title bar, no prose column, no footer, and nothing above or below the canvas: it fills the window and looks like the editor it is. Two things every other template puts in chrome go onto the board itself, where a reader who exports the drawing keeps them:

- **The name and the one line** are the first text on the board, top left, in the hand-drawn face at the largest size on it.
- **Where it came from** is a plain-face note in a corner: what the drawing rests on, what is measured and what is judgment, what is invented. On a plan, the scale. On a sheet, what size things are judged at.

And the finding is written in marker next to what it is about: a ring round the step, a note with an arrow, a question in red. Two to four of these, each anchored to a thing.

## The scene is the document

The board is a `.excalidraw` scene, written into the page as a JSON block: a list of elements, each a flat object with a type, a position, a size and a few style fields, plus a `files` map for any image. Excalidraw fills in every field the scene leaves out, so the page carries only what was decided. That block is the page's content. The editor is a view of it, the fallback drawing under the editor is another view of it, and a reader with the network off has every word of it in the file.

Write the scene with the kit, never by hand. It ships in both languages, as a library to import rather than code to copy: `scripts/board.mjs` for `node` and `scripts/board.py` for `python`, neither with any dependency, and `patterns.md` has the worked example. It exists because two references have to point both ways or Excalidraw drops them silently on the way in: a box and its label (`containerId` one way, `boundElements` the other), and an arrow and the shapes at its ends (`startBinding`, `endBinding`, and `boundElements` on both). A label written without the back-reference vanishes with no error; an arrow without bindings stays where it was drawn when its box is dragged, which is the one thing that makes a board feel broken. The kit makes both, every time.

## The rules that make a board work

**Bind everything that belongs together.** Every label is bound to its box, every arrow to both its ends, every note that belongs to a region is inside a frame. Then dragging any one thing moves what should move with it, and the reader trusts the board.

**One unit, said once.** A plan states its scale in the corner and its grid is that unit. A sheet states the size things are judged at and draws them at it. A flow needs neither and should not pretend to.

**Marker is commentary, and it is on the board.** Rings, notes and freehand strokes are in one marker color, and they say what the board shows. They are elements like any other, so a reader can move them or delete them, and an export carries them. Anything the reader must be able to take away is a shape or a note, not a stroke.

**Fit on open.** The page fits the whole board to the window once the scene has landed, so nothing is off-screen at any window size. The reader zooms from there.

**Follow the page's theme.** The editor is told which theme the page settled on, measured from a resolved color rather than asked of the media query, since a viewer may pin the page light on a dark desktop. The fallback drawing takes Excalidraw's own dark filter.

## What varies here

Free, and expected to differ between two pages made a day apart: which of the four shapes it is; how much of the board is marker; whether there is a grid; the faces used (hand-drawn for the drawing, plain for measurements and provenance); whether things are grouped in frames; the density; and whether any image is on it at all.

Fixed: the page is the board, the scene is in the page as JSON, everything bound is bound both ways, and the provenance is on the board.

## What it may load, and what has to survive without it

Excalidraw, from esm.sh, the way `references/loading.md` describes: React and ReactDOM pinned, the editor with `?deps=` naming the same pins, its stylesheet by path, and its fonts through the asset path the page sets before importing. About 1.2 MB, which no other template spends and which this one earns because the editor **is** the page.

What survives without it is decided at three levels. Before the editor arrives, and for good if it never does, the page draws the same scene itself as plain SVG, in the page's own type: every shape, arrow, label, image and note, fitted to the window, not hand-drawn. Under that, the scene is in the file as text a reader can open. And a page whose facts are only in an image on the board has broken the rule everything else here obeys: anything a reader needs is written as text on the board too.

## Refusals

A board the reader would never move anything on, which is an explainer's diagram at a thousand times the cost. **A title bar, a header, a footer, or any prose outside the board.** A label written by hand without its back-reference, or an arrow without bindings. A plan with no scale on it, or whose furniture is sized for the layout rather than the room. A sheet whose things are judged at a size they are not drawn at. A finding in a section under the board rather than in marker beside the thing. A board whose facts live only in an image on it. A scene fetched from anywhere, or written to the page by script, rather than carried in it. More than about a hundred and fifty elements, past which nobody is reading a board.

## Honesty about the arrangement

Say on the board what the placement is drawn from, because a board's authority is entirely in its coordinates. A plan traced from a measured drawing is a claim about a building; one laid out by eye is a sketch, and the two look the same on screen. Where a position is a judgment, say so. Where a figure appears in a note, the same rule holds as everywhere else: it came from the prompt, a source, or arithmetic over what is shown, or it does not appear. And say, in the same corner note, that what the reader changes stays in their copy: the file they were sent is unchanged, and the way to send a changed board on is to export it.
