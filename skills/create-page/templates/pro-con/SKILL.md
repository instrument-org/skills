---
name: pro-con
description: A pros and cons page as one HTML file: the strongest case for each side of one option or two alternatives, each point weighted, with who it suits and a bottom line. Use when the user is torn and wants both sides.
---

# Pros and cons

One self-contained HTML page that gives a torn reader the strongest case for each side. It reads like the two-sided explainer the web is full of, done properly: what is being weighed and by whom, the pros and the cons with a mark on each saying how much it matters, who the option suits and who it does not, and a bottom line that takes a position without pretending the other side had nothing. It is not a matrix of many options, and it is not a recommendation guide with a runner-up; it is two sides and a verdict.

## When to reach for it

Reach for it when the user is weighing one option (take the job, do the conversion, adopt the tool) or two alternatives against each other (Austin or Chicago, Shopify or WooCommerce) and wants both sides laid out before deciding. Reach for it unprompted when research ends in a genuine trade-off rather than a winner; a page that shows the tension is more useful than a paragraph that hides it.

Do not reach for it when there are three or more options (that is a comparison matrix or a recommendation guide), when one side has nothing real to say (that is a short answer, not a page), or when the reader wants scored criteria and a transparent winner.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, which side they lean toward before they read, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the reader must be able to tell which way the page leans from the first screen or from the bottom line without reading everything between.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write each point so it could be checked: a number, a date, a named consequence. "More expensive" is a con nobody can weigh; "about $35,000 due in April, from savings" is.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Context.** What is being weighed, by whom, and the facts of their situation that move the weights: income, city, team size, timing. Three sentences or a short fact row, with the assumptions marked as such.
- **Pros.** The strongest case for, each point with a weight mark saying how much it matters to this reader. Strongest first. Four to seven; never pad to match the other side.
- **Cons.** The strongest case against, weighted the same way, and written by someone trying to win, not by someone listing objections in order to knock them down.
- **Good for, bad for.** The reader for whom the pros win and the reader for whom the cons do, as a pair, so the user can find themselves on the page.
- **Bottom line.** The position the page takes, the condition it depends on, and what to do next. One strip; no hedging paragraph after it.
- **Sources.** What was read, when figures were seen, what was assumed about the reader, and what is inferred.

Weights are the shape's signature. Every point carries one on a three-step scale (decides it, matters, minor), set for this reader rather than in general, and the scale is explained once. A page whose points all weigh the same has not done the work.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color spent on emphasis, the spacing scale, a single self-contained file, and a provenance footer. Success and error tones mark the two sides lightly, on icons and kickers; they never fill a panel, because a page of green and red boxes reads as a scorecard rather than an argument.

Free, and expected to differ between two pages made a day apart: whether the sides sit side by side or stacked, the form of the weight mark (dots, a short bar, a phrase), the device that carries the bottom line (a dark strip, a bordered box, a serif sentence), whether a balance visual opens the page, the density, the heading face (sans or serif), and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the two-column split, the weighted point row, the good-for and bad-for pair, the bottom-line strip, a balance bar, and an inline SVG scale. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a dark surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Refusals

A page that could be any of the examples with the words swapped. Pros and cons in equal number because symmetry looked tidy. Points without weights, or every point at the same weight. A con written to be dismissed in its own sentence. Green and red filled panels. A bottom line that says it depends and stops. A balance visual showing a lean the weights on the page do not add up to. Good for and bad for that restate the pros and cons instead of describing readers. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` that fetches from the network beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB. A small inline script is fine where the page reads without it, and a refusal where the page does not.

## Honesty about research

Say on the page what was actually read and what was assumed about the reader's situation; the weights depend on those assumptions and the reader should be able to move them. Label figures with when they were seen. When one side's case rests on something the research could not check, say so on that point rather than only in the footer. When the research is thin, the page says so rather than performing balance; a thin honest page is useful, a confident invented one is worse than nothing.
