# Data explorer

One self-contained HTML page whose subject is a dataset. It carries the rows themselves, not a description of them: the shape of the whole set in a few figures, the two or three things the data says, a way to regroup and re-measure it without typing, and a grid the reader can sort, filter, narrow and take away as a spreadsheet. It reads like the data pages newsrooms and public agencies publish, where the argument and the evidence are the same object.

Every other template hands the reader a conclusion and shows enough evidence to trust it. This one hands over the evidence and shows enough conclusion to make it worth opening. Reach for it when the honest answer is "here is the whole thing, and here is what I noticed in it".

## When to reach for it

Reach for it when there are more rows than anyone will read and the rows are the point: a month of readings, an export, a scrape, a survey, a public feed, a list of everything in a category. "What's in this data", "show me all of them", "let me poke at it myself", "which of these are the biggest", and "can I filter this" are the phrases. Reach for it unprompted when research you have already done produced a table long enough that quoting five rows of it would misrepresent the rest.

Do not reach for it when a shortlist would serve better (that is a comparison matrix), when the answer is a single number or a recommendation, when the rows are fewer than about thirty and a plain table in another template says it all, or when the data is too sensitive to travel — the page is the data, so sending the page sends every row.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **What this is.** The dataset in two or three sentences: what it counts, where it came from, when it was read, how many rows survived, and what question it was gathered to answer. The reader decides here whether to keep going.
- **The whole set at a glance.** Four or five figures that size the thing — how many, the extremes, the one that is surprising. Each is a fact from the data rather than a rounded impression.
- **What the data says.** Two to four findings, each a sentence a reader could check against the grid below. At least one of them should be about the dataset rather than about its subject: a gathered set always has a shape of its own, and saying so is the difference between a page that reports and one that understands.
- **Break it down.** A way to regroup and re-measure without writing anything: the reader picks a dimension and a measure and the page answers. Show the query it built if there is one; never ask for it.
- **Every row.** The grid. Sortable, with a filter under each heading, columns that can be hidden, a live count of what is showing, and a way to take the result away.
- **Where and when, if the data has them.** Place gets a map, time gets a chart on a shared axis. Neither is decoration: a map earns its place when position is a finding, not when the rows merely have coordinates.
- **Method.** Where the rows came from and how to get them again, what was excluded and why, what is measurement and what is metadata, and what the data cannot answer.

## What varies here

Free, and expected to differ between two pages made a day apart: whether there is a map, a globe, a time axis or none of them; which of the figures lead; how many charts and of what kind; whether the breakdown is two selects, a set of chips, or a row of tabs; the grid's columns and which are hidden by default; the density; and the order of the sections, since a set whose finding is geographic should open on the map while a set whose finding is a distribution should open on the chart.

## What it may load, and what has to survive without it

This template is the reason `SKILL.md`'s load rule exists. It may load, pinned to an exact version, any of Chart.js, Leaflet, sql.js and Tabulator. Each one has to pass the offline test on its own:

- **The grid** renders a plain HTML table of the most interesting rows first, and replaces it when the library arrives. A reader with no grid still gets rows.
- **A chart** has the same numbers as a table or a list directly beneath it, always rendered. Not in a `details`, not in a tooltip.
- **A map's container** holds the list of places, with coordinates and what each one is, as its own initial content. The map replaces it. A blank grey box is the failure.
- **The database** answers the breakdown, and the breakdown says plainly when the engine did not arrive. Every number it would have produced is still reachable in the grid.
- **The data itself is never fetched.** It is inline in the file, always. A page that goes empty offline is not this template, it is a website.

Keep the payload under about 5,000 rows and 300 KB of inline data. Past that, aggregate before you write the page and say in the method what you aggregated.

## Refusals

A page that could be any of the examples with the words swapped. A grid over data the page does not carry. A query box: the reader picks a dimension and a measure, and never types a language to get an answer. Findings that only restate the largest row, or that repeat what the glance tiles already said. A chart with no numbers under it, or a map with no list in its container. Every column shown because it existed in the source. A map because the rows have coordinates rather than because position says something. Precision the source does not have, including a decimal place the feed did not publish. A dataset presented without saying what is missing from it.

## Honesty about research

Say where the rows came from, precisely enough to fetch them again, and when they were read. Say what was excluded and why, because an exclusion is an argument. Distinguish measurement from metadata: a file's size is measured, its modification date is a claim about a filesystem. Where the set is a sample or a feed with a threshold, say so beside the count, since a reader will otherwise read it as a census. And prefer a finding about the collection over a fourth finding about the subject: the most useful thing a data page can say is often why the data looks the way it does.
