# Page families

Status: proposed, 2026-09-11. Two of the moves below have landed (the whiteboard rebuilt on Excalidraw, the storyboard added); the rest are a proposal for the next round. Follows [`discover-ideas.md`](discover-ideas.md), which lists what exists.

## What this is

A regrouping of the `create-page` templates from the reader's side, and a set of new page kinds that each own one capability rather than sharing a kitchen sink. The trigger was two findings. First, that one host can serve any library as a module with its React deduplicated ([`2026-09-11-esm-sh-serves-every-library.md`](../../decisions/2026-09-11-esm-sh-serves-every-library.md)), which makes a page built on a real editor, a real map or a real grid an ordinary page rather than a special case. Second, that the three `explorer` examples each load four libraries, so an agent that wants a map learns it from a page that is mostly a database, and an agent that wants a grid learns it from a page that is mostly a map.

The rule that bounds all of it is unchanged: a library adds motion, precision or scale to something already on the page, and is never the only copy of a fact.

## The families

Six today, named by what the reader arrives with. Two changes proposed: rename `layout` to **draw**, since what the reader arrives with there is a thing to draw rather than a layout to make, and split `data` into what is drawn from data and what is worked in it.

| Family       | The reader arrives with | Templates today                                                                              | Proposed                                     |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **decide**   | a decision to make      | comparison matrix, decision matrix, pros and cons, recommendation guide, scorecard, should I | unchanged                                    |
| **explain**  | a topic to explain      | explainer, FAQ, timeline, TLDR brief                                                         | + diagram                                    |
| **persuade** | a case to make          | briefing memo, case study, one-pager                                                         | + storyboard (second tag)                    |
| **steps**    | steps to follow         | checklist, how-to, itinerary                                                                 | unchanged                                    |
| **draw**     | a thing to draw         | wireframe, whiteboard, storyboard                                                            | + diagram, + map                             |
| **data**     | numbers to work with    | dashboard, data explorer, tool                                                               | explorer splits into grid, query, chart, map |

## The new kinds

Each owns one library, says what it costs, and says what the page shows when it never arrives. Costs are gzipped, from esm.sh, against a starter that spends about 85 KB.

**Diagram** (draw, explain). Boxes and arrows that are finished: an architecture, a sequence, a state machine, an org. Two routes worth trying against each other. Mermaid, about 400 KB, renders from text the agent writes, and the text is the offline copy, shown as a code block if the render never comes; that is the cleanest offline story of anything here, and the text is the form an agent is best at. Or the whiteboard's own kit, rendered once to SVG and inlined, which costs nothing at open and prints, but needs a build step. Try Mermaid first.

**Map** (draw, data). Places on a real map, with the places as a list under it. Leaflet with OpenStreetMap raster tiles, about 45 KB, already proven in the explorer; the list is the offline copy and the map is the upgrade. MapLibre GL is the better map (vector, rotates, 3D) at about 250 KB, but vector tiles need a tile host with a key, which is a dependency on an account rather than on a CDN, so Leaflet until that changes.

**Grid** (data). One dataset the reader sorts, filters, groups and takes away as CSV. Tabulator, about 90 KB with its stylesheet, proven in the explorer; the offline copy is the same rows as a plain table under it, capped at what a reader would scroll.

**Query** (data). A dataset the reader can ask questions of in SQL, with a few questions already asked and answered on the page. sql.js, about 400 KB with its wasm, proven in the explorer; the questions and their answers are the offline copy. This is the one that most needs its own page, because the interesting part is the questions, and in a kitchen sink they are one panel among six.

**Chart** (data). Small multiples, distributions, regressions: the statistical page the dashboard is not. Observable Plot, about 140 KB with d3 inside it, proven in the dashboard; every chart carries its table. Vega-Lite would render from a spec the agent writes, which is attractive for the same reason Mermaid is, at about 500 KB; worth one example to compare.

**Canvas-backed diagrams and pages that are a small app** are capabilities rather than kinds. The whiteboard shows an editor on a page; a tool that wants React for its state can import it the way `references/loading.md` describes without a new template. If a real run asks for a page that is an app, that is the moment to decide whether it is a kind.

## What this does to the explorer

It becomes the page for when the reader wants all of it: the rows, a question, a picture and a map of one dataset, which is a real request and stays. Its examples stop being the only place an agent sees a grid or a map.

## Order

1. `query`, because the questions are the most useful thing the explorer buries.
2. `map`, because places are the most common dataset with a shape.
3. `diagram` with Mermaid, one example, to see whether text-to-picture holds up in the house style.
4. `grid` and `chart`, which are largely the explorer and the dashboard examples cut down to one thing each.
5. The family rename, which touches the website's grouping list and so lands with it.

## Open

- The website's tile marks. `storyboard` uses `frames`, which is the wireframe's; a `panels` mark that draws a person in a panel would tell them apart. `map`, `grid` and `query` would want marks of their own, or reuse `board`, `table` and `compute`.
- Whether a diagram rendered from Mermaid text can be held to the house palette, or whether it always looks like Mermaid.
- Whether any of these is worth a fourth example that exists only to show the offline state.
