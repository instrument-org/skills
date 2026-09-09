---
name: comparison-matrix
description: A comparison matrix as one HTML page, with many options across the same attributes in a color-coded table, a legend, and footnotes, no winner named. Use when the user wants trade-offs side by side rather than a pick.
---

# Comparison matrix

One self-contained HTML page that lays many options across the same attributes so a reader can scan them at a glance. It reads like the big compare table on a hardware review site: an intro that says what is compared and for whom, a legend for the columns and the colors, the matrix itself with a sticky header and a sticky first column, footnotes for the catches, and a note on how to read it. It does not name a winner; it shows where each option is strong and where it is weak so the reader can do the weighing.

## When to reach for it

Reach for it when there are four or more options and the decision turns on several attributes at once with no agreed weighting: which project tool, which camera, which payroll provider, which region to deploy in. Reach for it unprompted when research you have already done produces a grid of facts that a paragraph would flatten.

Do not reach for it when the user wants to be told what to buy (that is `recommendation-guide`), when the options differ on one attribute only, when there are two options and a two-sided page reads better, or when the user has weights and wants a score and a winner.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, whether options run as columns or as rows and why, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Every option gets every attribute; a cell that reads "none" is a fact, and a blank cell is a gap. Keep cell values short and move each catch into a footnote keyed by a superscript. Give every cell one of three tones, and let the legend make the tones checkable.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for scanning. A reader should be able to find the row they care about, run their eye across it, and count the tones before reading a word of prose.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Intro.** What is compared, how many options, for whom, and the one sentence that says what the table shows, without naming a winner.
- **Legend.** What each column or row means and why it is here, what the three tones mean for this brief, any weight, the best-in-line mark, and the footnote superscripts. Prices carry the date they were seen.
- **Matrix.** The options across the same attributes, grouped into bands, with a sticky header row and a sticky first column so the labels never scroll away. Three tones within the palette. A mark on the best cell in each line where one exists, and none where it is a tie.
- **Footnotes.** Keyed by superscript and grouped per option: the tier boundary, the seat pack, the add-on, the crop, the quote that is not a list price.
- **How to read this.** Which rows to read first for which reader, what a tone does and does not mean, where the ties are, and what a footnote number is pointing at.
- **Sources.** What was read, when prices were seen, and what on the page is inferred rather than sourced.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer. Fixed for this shape in particular: exactly three cell tones, a brand tint for strong, plain for fine, and the warning tint for a real weakness; never a red cell, because a weakness for this brief is not an error.

Free, and expected to differ between two pages made a day apart: the orientation (options as columns for a wide scan, options as rows for a scan-down list with a summary column), the density, how many attribute bands there are and which open by default, whether the header carries a picture of each option, whether a best-in-line mark is used, a serif or a sans title, and any interaction such as collapsible bands, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the matrix plumbing, the cell tone key, band rows, collapsible bands, the best mark, legend chips, keyed footnotes, and the source footer. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a darker surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme.

## Pictures

A matrix about things people buy may carry a small photo of each option in its header, one per column, all at one aspect ratio, each embedded as a data URI so the file opens anywhere: 480 pixels wide at JPEG quality 72 is plenty at header size and lands under about 30 KB each. A matrix about software leaves pictures out. Read the "Header photos" section of [`references/patterns.md`](references/patterns.md) for the recipe and for what to do when no picture of the actual product can be had.

## Refusals

A matrix where every cell is a check mark or an X. Cells of prose. More than three tones, or red for a weakness. A best mark in a line that is a tie. A cell that hides the catch a footnote should carry. Attributes only one option has. An option with blank cells. An intro that names a winner and then pretends the table is neutral. A header that scrolls away on a table taller than a screen. Any `<link>` or `<script>` beyond the ones the starter carries, and any image that is a link or a relative path rather than inline data: the file has to open from a USB stick. A file over about 1.5 MB.

## Honesty about research

Say on the page what was actually read and tested and what was not. Label prices with when they were seen and say which are quotes rather than list prices. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest matrix is useful, a confident invented one is worse than nothing.
