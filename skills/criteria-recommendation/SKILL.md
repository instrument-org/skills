---
name: criteria-recommendation
description: A weighted decision matrix as one HTML page: criteria with stated weights, scored options, totals that add up, the winner, and what would flip it. Use when the user wants to see why an option wins, not only which.
---

# Recommendation with criteria

One self-contained HTML page that picks an option by arithmetic the reader can check: the goal, the criteria and their weights with a reason for each weight, every option scored on every criterion, totals computed from the shown numbers, the winner called out, and a sensitivity pass that says which weights would change the answer. It reads like the "how we scored" methodology page a serious review site publishes, or the scorecard a procurement team attaches to a purchase. It is not a buying guide with a verdict up top and the reasoning below; here the reasoning is the page.

## When to reach for it

Reach for it when the user cares about why as much as what: three to eight options, several criteria that pull in different directions, and a reader who will want to argue with a weight or defend the pick to someone else. Vendor and tool selections, choosing a city or a venue, picking a stack, hiring a firm. Reach for it unprompted when research you have done ends in a close call among options that trade off differently; a paragraph that says "it depends" is the weaker answer, and a matrix shows what it depends on.

Do not reach for it when one option plainly dominates and the reader only needs the pick (make a recommendation guide), when the options do not share criteria, when the question is a yes or a no, or when there are two criteria and the answer is a sentence.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write the criteria before the scores. Name three to eight criteria the goal implies, give each a weight so the weights sum to 100, and write one clause per weight saying why it is that size. Weights come from the goal, not from the options; a weight chosen after looking at the scores is a thumb on the scale.
3. Score every option on every criterion on one stated scale, 1 to 5 or 1 to 10, with a reason wherever the score is not obvious. Compute the totals as the sum of weight times score, divided by the scale's maximum, so 100 is a perfect score on every criterion. Check the arithmetic by hand; one total that does not add up from the shown numbers discredits the page.
4. Run the sensitivity. Change the weights the reader is most likely to dispute, recompute every total, and report which option wins under which weighting. An option that wins under no weighting is dominated; say so, because that is the most reassuring sentence on the page.
5. Write a three-line brief before any HTML: who reads this and what they will do next, the first thing they must see, and the one distinctive move this page makes that the two examples did not.
6. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
7. Fill the slots. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the winner's name and total must be visible without scrolling.
8. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page so the reader can redo the math on paper. Every number that feeds a total is on the page; nothing is hidden in a script.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Goal.** What is being chosen, for whom, and the constraints that shaped the criteria.
- **Criteria and weights.** Each criterion, its weight, and why that weight and not another. Weights sum to 100.
- **Scores.** Every option on every criterion on the stated scale, with the totals computed and shown, and a reason for any score a reader would question.
- **Winner.** The option with the highest total, its total, and the criteria it won and lost on, called out so it can be found from the first screen.
- **Sensitivity.** Which weights would change the answer, to what, with the recomputed totals; and which options can never win on these criteria.
- **Sources.** What was read, whose scores these are, what is inferred rather than sourced, and when.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color (so heatmap tones come from the brand ramp, never from a red-to-green scale), the spacing scale, a single self-contained file, and a provenance footer. Fixed too, because it is the point of the shape: weights that sum to 100, one scale for every criterion, and totals that reproduce from the shown numbers.

Free, and expected to differ between two pages made a day apart: the layout and measure, the section order, the device that carries the weights (bars, a numeric column, a ranked list), the score grid's orientation and cell encoding (numbers with a heatmap tone, dot ratings, or both), the device that carries the winner (a card, a band, a result line, the top of a ranked bar chart), whether sensitivity is prose or interactive, the density, and the surface tone within the palette. Interaction is progressive: the default weighting renders statically, and buttons only re-total what is already on the page.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: weight bars, score grids, heatmap tones, dot ratings, winner callouts, sensitivity presets. It is vocabulary, not a layout.

No photos. A matrix is about numbers and reasons, and a picture of the winner adds weight to the file without adding to the argument.

## Refusals

Weights that do not sum to 100, or a scale that changes between criteria. A total that does not reproduce from the shown weights and scores. A weight chosen after the scores. A score with no reason where the reason is not obvious. A winner not called out, or called out without its total. A sensitivity section that guesses instead of recomputing. A heatmap in red and green. A tie broken silently. A fourth option padded in when three exist. A page that could be any of the examples with the numbers swapped. Any `<link>` or `<script>` beyond the ones the starter carries, and any interaction the page needs in order to be read.

## Honesty about research

Scores are judgments, so the page says whose they are and what they rest on: spec pages, reviews, a trial, or a guess. Label prices and figures with when they were seen. When the research is thin, the footer says so rather than performing precision; a decimal point on a guessed score is a lie with a serif. A thin honest matrix is useful, a confident invented one is worse than nothing.
