# Comparison matrix

One self-contained HTML page that lays many options across the same attributes so a reader can scan them at a glance. It reads like the big compare table on a hardware review site: an intro that says what is compared and for whom, a legend for the columns and the colors, the matrix itself with a sticky header and a sticky first column, footnotes for the catches, and a note on how to read it. It does not name a winner; it shows where each option is strong and where it is weak so the reader can do the weighing.

Write the page for scanning. A reader should be able to find the row they care about, run their eye across it, and count the tones before reading a word of prose.

## When to reach for it

Reach for it when there are four or more options and the decision turns on several attributes at once with no agreed weighting: which project tool, which camera, which payroll provider, which region to deploy in. Reach for it unprompted when research you have already done produces a grid of facts that a paragraph would flatten.

Do not reach for it when the user wants to be told what to buy (that is `recommendation-guide`), when the options differ on one attribute only, when there are two options and a two-sided page reads better, or when the user has weights and wants a score and a winner.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Intro.** What is compared, how many options, for whom, and the one sentence that says what the table shows, without naming a winner.
- **Legend.** What each column or row means and why it is here, what the three tones mean for this brief, any weight, the best-in-line mark, and the footnote superscripts. Prices carry the date they were seen.
- **Matrix.** The options across the same attributes, grouped into bands, with a sticky header row and a sticky first column so the labels never scroll away. Three tones within the palette. A mark on the best cell in each line where one exists, and none where it is a tie.
- **Footnotes.** Keyed by superscript and grouped per option: the tier boundary, the seat pack, the add-on, the crop, the quote that is not a list price.
- **How to read this.** Which rows to read first for which reader, what a tone does and does not mean, where the ties are, and what a footnote number is pointing at.
- **Sources.** What was read, when prices were seen, and what on the page is inferred rather than sourced.

## What varies here

Free, and expected to differ between two pages made a day apart: the orientation (options as columns for a wide scan, options as rows for a scan-down list with a summary column), the density, how many attribute bands there are and which open by default, whether the header carries a picture of each option, whether a best-in-line mark is used, a serif or a sans title, and any interaction such as collapsible bands, which must be progressive so the page reads with scripts off.

## Pictures

A matrix about things people buy may carry a small photo of each option in its header, one per column, all at one aspect ratio, each embedded as a data URI so the file opens anywhere: 480 pixels wide at JPEG quality 72 is plenty at header size and lands under about 30 KB each. A matrix about software leaves pictures out. Read the "Header photos" section of [`references/patterns.md`](references/patterns.md) for the recipe and for what to do when no picture of the actual product can be had.

## Refusals

A matrix where every cell is a check mark or an X. Cells of prose. More than three tones, or red for a weakness. A best mark in a line that is a tie. A cell that hides the catch a footnote should carry. Attributes only one option has. An option with blank cells. An intro that names a winner and then pretends the table is neutral. A header that scrolls away on a table taller than a screen.

## Honesty about research

Say on the page what was actually read and tested and what was not. Label prices with when they were seen and say which are quotes rather than list prices. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest matrix is useful, a confident invented one is worse than nothing.
