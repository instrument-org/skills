# Scorecard

One self-contained HTML page that grades a single entity across the dimensions that matter and sums it up in one glance. It reads like the rating page on a review site or a report card: an overall grade the eye lands on first, a score per dimension with the evidence that earned it, what it does well and badly, and how it stacks against two or three peers. It is not a comparison of many options and it is not a recommendation; it grades the one thing in front of the reader so they can decide what to do with it.

Pick one scale and use it everywhere on the page: letters, a number out of 10, or a number out of 100. The overall grade is on that scale, every dimension is on it, and every comparable is on it. Say how the overall was formed (a plain mean, a weighted mean, or a judgment) in one line next to it.

## When to reach for it

Reach for it when the user has one thing and wants to know how good it is: a vendor in a procurement, a policy under review, a hire packet, an apartment, a school, a tool the team already uses, a used car with a listing. Phrasings that mean this: "how good is", "grade this", "rate this", "score the", "is this any good", "audit this against". Reach for it unprompted when research you have already done ends in a judgment about one thing with several parts; a paragraph of prose loses the per-dimension picture.

Do not reach for it when the user is choosing among options (that is a recommendation guide or a comparison matrix), when the question is a yes or a no, or when there is one dimension and the answer is a sentence.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Overall grade.** The biggest thing on the page: a letter, a number, or a score out of N, with the scale named and one line on what the grade means for the reader's decision.
- **Dimension scores.** One score per dimension, on the same scale as the overall, ordered by what matters most to the reader. Four to eight dimensions; fewer when fewer matter.
- **Evidence per dimension.** The specific, checkable fact that earned each score: a measurement, a count, a quote, a price, a finding from the inspection. One or two sentences, never a restatement of the score.
- **Strengths and weaknesses.** Side by side, three to five each, specific enough to argue with. A weakness that is a dealbreaker says so.
- **Comparables.** Two or three peers on the same scale, so the reader knows whether a 7 is good for this class of thing. The subject comes first; each peer gets one line on where it wins or loses.
- **Sources.** What was read, tested, measured, or inspected, when figures were seen, and what on the page is inferred rather than sourced.

## What varies here

Free, and expected to differ between two pages made a day apart: the scale (letters, out of 10, out of 100), the device that carries the scores (rows with bars, dot ratings, inline SVG dials, a segmented heat strip), where the evidence sits (under each score or in a ledger of its own), the layout and column count, the section order, the density, the surface tone (white or a brand-tinted paper within the palette), and any interaction, which must be progressive so the page reads with scripts off.

## Pictures

A scorecard of a physical thing (a car, an apartment, a building) may open with one photo of it, embedded as a data URI so the file opens anywhere, sized to about 960 pixels wide as JPEG quality 70 and under about 150 KB. It is the thing being graded or a labeled representative of its category, never decorative stock, and the footer says where it came from. A scorecard of software, a policy, or a person carries no picture; the grade is the picture.

## Refusals

A page with no overall grade, or one that hides it below the fold. Two scales on one page. A dimension with a score and no evidence, or evidence that only restates the score. Every dimension scored the same. Strengths padded to match the length of the weaknesses. Comparables on a different scale than the subject, or comparables that are not peers. A page that could be any of the examples with the words swapped. Every section a bordered card.

## Honesty about research

Say on the page what was actually read, tested, measured, or inspected and what was not. A score is a judgment; the evidence line is what makes it checkable, so when the evidence is thin the score says so ("provisional") rather than performing precision. Label prices, counts, and measurements with when they were seen. When the research is thin, the footer says so; a thin honest scorecard is useful, a confident invented one is worse than nothing.
