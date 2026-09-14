# Playground

One self-contained HTML page that renders one thing and puts the dials for it beside it. The reader turns them until the thing looks or feels right, and takes the settings away as something they can paste: CSS, a config object, an SVG, a palette. A motion, a shadow, a type scale, a grid, a pattern, a color ramp. The page is a thing to arrive at, not a thing to read.

Every other template hands the reader an answer or the function that produces one. This one hands them a stage and the knobs, because the question is a matter of taste: nobody can say in words how much bounce a sheet should have, but anyone can say it when they see it.

## When to reach for it

Reach for it when the answer is judged by eye rather than checked by arithmetic, and the thing being judged has parameters. "Make it feel snappier", "I am not sure about the radius", "let me play with it", "which shadow", "what if the columns were wider", "can I tweak this" are the phrases. Reach for it unprompted when you notice you are about to make three variants of something and ask the reader to pick, or when a page you are writing describes a look in adjectives: put the dials on it instead and let them find the word.

Two shapes come up over and over. **A motion**: something enters, opens, or settles, and how it moves is the whole question. **A look**: a shadow, a corner, a ramp of color, a scale of type, a spacing rhythm, where a designer would otherwise round-trip through a tool that the reader does not have open. A third is rarer and worth knowing: **a generator**, a pattern or a mark drawn from a seed and a few numbers, where the takeaway is the drawing itself.

Do not reach for it when the answer is a number, which is a [tool](../tool/template.md): a calculator wearing a control panel is still a calculator. Not when there is one right setting and you know it; write it down. Not when the choices are discrete and few, which is a [comparison](../comparison-matrix/template.md) or a [wireframe](../wireframe/template.md) with a frame per option. Not for a drawing the reader will move things on, which is a [whiteboard](../whiteboard/template.md). And not because a panel of sliders looks impressive: **if the reader would never turn a dial, there is no playground here**, only a picture that took 200 KB to load.

## The shape

**The page is the stage.** A title bar, the stage with the dials beside it, what the reader takes away, and one line of where it came from. No prose column, no opening paragraph, no closing section.

- **A name and one line.** What is on the stage, and what the reader is meant to do with the dials. Not a thesis: whatever you were about to explain, the first drag will show.
- **The stage.** The thing, rendered at the opening settings, big enough to judge and at the size it will really be seen. Anything that moves replays on a tap and on a loop the reader can switch off. The figures the dials work out to, where there are any, sit beside the thing rather than under the page.
- **The dials.** dialkit's panel, in a column beside the stage rather than floating over it, with the controls grouped the way the reader thinks about the thing. Every dial does something visible.
- **The takeaway.** What the reader carries out: the CSS, the config, the SVG, the values. Written for the opening settings, rewritten as the dials move, and copyable in one click with a visible fallback when the clipboard is refused.
- **One line underneath.** What the defaults rest on, what the takeaway was checked against, and where what the reader sets is kept, which is their browser and nowhere else.

## The rules that make a playground work

**One object is the whole page.** The dials are declared as one config in dialkit's notation, and that object is at once the panel, the page's opening values, and the list a reader with no network sees. `patterns.md` has the helper that reads the defaults back out of it. Nothing about the controls is written twice.

**It opens on a real setting, already rendered.** The stage shows the opening values before any script runs, the takeaway is written into the HTML for those same values, and the figures beside the stage are too. A page that opens blank has to be learned before it helps; one that opens on a worked setting teaches itself in the first drag. Choose the opening setting to be a good one rather than a neutral one, and say in the last line where it came from.

**Every dial does something you can see.** A control whose effect is invisible at the size the stage is drawn is a control the reader will distrust the rest of the panel for. Fewer dials, each of them consequential, beats a panel that exposes every property the thing has.

**The dials are in the reader's words.** dialkit labels a control from its key, so the keys are the labels: `travel`, `cornerRadius`, `dim`, never `dy` or `opacityBackdrop`. Group with folders the way the reader thinks about the thing, not the way the CSS is organized.

**The takeaway is what they came for.** It has to be pasteable where the reader will use it, which means real CSS with real units, a config in the library's own shape, an SVG that opens. Where two formats describe the same thing, show both and say they agree. Where the takeaway is a drawing, the copy is the SVG source and the picture is on the page.

**Compute what the dials imply, and only that.** A figure beside the stage is arithmetic over the settings shown: how long the motion takes to settle, how far it overshoots, the contrast ratio the two colors make, the size the type comes out at on a phone. Never a score, never an opinion in a number, never a figure the dials did not produce.

**What the reader sets is theirs.** The panel keeps their last position in their browser and lets them save more than one version; the page carries a Reset that puts the dials back to its opening values, since the panel has none of its own. The file they were sent is unchanged, and the way to send a setting on is the takeaway.

## What varies here

Free, and expected to differ between two pages made a day apart: what is on the stage and how it is drawn; which controls and how they are grouped; whether the panel is a column or a floating popover; what the takeaway is and how many formats it comes in; whether any figures sit beside the stage; whether the stage loops, replays on tap, or holds still; and the density.

Fixed: the page is the stage, the config is the one source of the dials, the opening setting is rendered and its takeaway written before any script runs, and the takeaway is copyable.

## What it may load, and what has to survive without it

dialkit's vanilla adapter, from jsDelivr, pinned and built as a module with `/+esm`, with its stylesheet by path: about 130 KB of script and 70 KB of style, which the page earns because the panel is half of it. The stage itself loads nothing: it is HTML and CSS, animated with the browser's own animation API where it moves, drawn as inline SVG where it is a drawing. A stage that needs a library to draw, a chart or a map, follows the rules that template already wrote.

What survives without dialkit: the stage at its opening values, still moving if it moves; the settings in words, in the column where the panel would be, with a line saying the dials need the network; the takeaway, written for those values; and the figures. A reader with the network off has everything but the turning.

## Refusals

A stage that opens blank, or whose opening state exists only in the script. A dial that changes nothing visible. A takeaway that lives only in the panel's own copy button. A figure beside the stage that the dials did not produce. A recommendation wearing a slider: the page does not know which setting is right, and a default that is secretly the answer belongs in a [recommendation](../recommendation-guide/template.md). **Prose sections around the stage.** More than about a dozen dials. A control labeled with a variable name. A submit or generate button; the stage follows the dials. Anything that reaches the network for the stage itself. A library loaded to draw what CSS draws.

## Honesty about the defaults

The opening values are the page's most dangerous content, because a reader takes them for a recommendation. Say in the last line what they are: a platform's published guideline, a value measured off something real, or a starting point chosen to make the dials worth turning. Where a takeaway claims to match a library, name the library and the version and say what was checked, since a spring that "feels like Motion's" and one computed by Motion's formula are different claims. And where a figure beside the stage comes from a rule, name the rule.
