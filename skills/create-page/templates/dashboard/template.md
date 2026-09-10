# Dashboard

One self-contained HTML page that says how something went over a period, in four or five figures and two or three pictures, and then says the one thing underneath the headline that the headline hides. A snapshot with a date on it, not a live view and not a database.

This is the [data explorer](../explorer/template.md)'s smaller sibling and the split is worth stating plainly. An explorer hands the reader the whole dataset and a grid to interrogate it with; a dashboard hands them an interpretation and enough numbers to check it. If the reader will want to sort, filter and take the rows away, they need the explorer. If they want to know how it is going, they need this, and giving them the explorer instead is how a simple question turns into an afternoon.

## When to reach for it

Reach for it when a period has ended and someone has to know what happened in it: a quarter, a month, a year, a launch, a season, a first year with something new. "How did we do", "what does the quarter look like", "is it working", "give me the numbers", "how are we tracking", "was it worth it" are the phrases.

Reach for it unprompted when a question about a single number keeps coming back, because a number that gets asked about repeatedly is a number that arrived without its comparison.

Do not reach for it when there are more rows than anyone will read and the rows are the point, which is the explorer. Do not reach for it when the answer is a decision, which is a brief or a recommendation. Do not reach for it for one figure, which is a sentence. And do not reach for it to build something that looks live: this page is dated, static, and honest about being both.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **How it went.** Two or three sentences: the headline in the reader's own terms, and the thing under it the headline hides. A dashboard whose opening paragraph could have been written before the numbers arrived has not read its own numbers.
- **The figures that matter.** Four or five, each with the thing it should be compared against. Tint the one that is a problem and leave the rest plain: when every tile is loud, none of them is.
- **What moved, and what it looks like.** Two or three views, each answering a question the tiles raised, each with the same numbers as a table beneath it.
- **What is actually going wrong.** Two to four findings, each checkable against the charts above, each naming the thing to do or the question to ask. At least one should be about the measurement rather than the subject.
- **How this was counted.** The basis: what is netted off, what a category means, which period the comparison is against and why, what is excluded, and the date it stopped being true.

## The rules that make it worth reading

**Every number arrives with its comparison.** Against last period, against the same period a year ago, against the plan, or as a share of something. A figure on its own is decoration, and a wall of decorated figures is why nobody reads these. Say which comparison you chose and why: a bookshop compared quarter on quarter is mostly measuring the summer.

**Name the confounder before the reader finds it.** The bill fell and the winter was mild. Traffic rose and the campaign ran. Both numbers go on the page at the same size, because the first is the one that arrives on the statement and the second is the one to plan with. A readout that reports only the flattering one has picked a side.

**Prefer the distribution to the average, and say when the average lies.** A long tail defeats the mean, and most operational numbers have one. Where they do, report the median and a percentile, show the shape, and put the sentence "nobody experiences twenty-one minutes" somewhere on the page.

**No filters, no grid, no query.** Every control is a control the reader has to learn and a state the page can be in when it is screenshotted. A dashboard is read, not driven. If it needs driving, it is an explorer.

**It has a date and it will not update.** Say so. Half of what is wrong with dashboards is that nobody can tell how old the number is.

## What varies here

Free, and expected to differ between two pages made a day apart: how many tiles and in what order; whether the charts are small multiples, a distribution, a scatter, a comparison of two periods, or one line; whether there is a table under every chart or one table for all of them; whether the findings come before or after the pictures; and the density, which should be higher than the rest of this family's since a readout is scanned.

## What it may load, and what has to survive without it

Chart.js or Observable Plot, pinned to an exact version, and the offline test is the same as always: **the numbers the chart draws are on the page as a table too, always rendered.** Pull the network and the reader loses a picture and no facts.

Between the two, Plot is usually the better reach here and it is not free. It draws SVG rather than canvas, so a mark can take a theme token straight from CSS, both palettes come out right with no probe and no redraw, and the chart prints and scales. It gives small multiples in one option, which is the single most useful chart a readout has. Against that: its UMD bundle does not carry d3, so it is two script tags and about 490 KB against Chart.js's self-contained 210 KB. Reach for Plot when there are facets, distributions or regressions in play, and for Chart.js when there are one or two ordinary charts and nothing clever.

## Refusals

A tile with no comparison. A page of tiles and no argument. A chart with no table under it. Filters, date pickers, a search box, or anything that implies the data is live. A sparkline with no scale. A percentage with no denominator. An average over a distribution with a long tail, presented as though it described anyone. A confounder discovered by the reader rather than named by the page. Green because the number went up, when up is bad. A quarter compared against the previous quarter for something seasonal. More than about six tiles or four charts, past which nobody is reading a readout and should have been given an explorer.

## Honesty about the numbers

Every figure on the page comes from the prompt, a source, or arithmetic over what is shown. Where a number is the result of a correction, say which correction and on what basis, because a corrected number looks exactly like a measured one. Where a figure is illustrative, say so in the footer before somebody quotes it.

Keep the tiles and the tables reading from the same array. A tile typed by hand beside a table computed from data will disagree eventually, usually after the data is revised and the tile is not, and the reader has no way to tell which is right.

And be careful with the direction of good. A rising number is not a rising fortune, and a chart that colors every increase green teaches the reader to stop reading the labels.
