# Review instructions

How to calibrate a review of this repo, whether of a pull request, a branch, or the last few days of commits.

## What counts as Important

A concrete defect that should be fixed before it ships: a skill that misleads the agent running it, a script that fails or writes where it should not, a check that passes what it exists to catch, a regression in what the app installs. Naming, structure, refactors, prose, and test layout are Nits at most.

## Do not report

- What the repo's checks already enforce: formatting, lint, types, spelling, unused code.
- A tradeoff a record in `docs/decisions/` already accepts.
- A what-if with no concrete trigger, and speculative performance worries with no measured cost. Report what breaks on given inputs, or a design flaw that will cost a migration later.
- General requests for more tests.

## Evidence and shape

- Cite `file:line` for each claim and give the concrete scenario where it goes wrong. Trace the code, not the doc comment.
- Report the root cause once, not once per call site.
- Past reviews and what came of each finding are in [`docs/reviews/`](docs/reviews/README.md). A finding that reverses a declined one there, a `Rejected:` or `Commits-to:` trailer on the lines it cites, or a record in `docs/decisions/` names that record and says why its reason no longer holds.
