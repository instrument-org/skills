# Discover ideas

Status: In progress. The framework and the first eight ideas exist with three examples each; the next wave is unscheduled.

## What this is

Ideas are skills that make a kind of document. The website's Discover section (`apps/web` in the internal repo) is built from this repo at build time: it reads every skill carrying an `idea.json`, shows the captures on tiles and idea pages, serves the skill's files and a well-known skills index, and offers a button that opens the idea in the app. The app ships the same skills through its registry submodule, so the agent can reach for an idea unprompted. See the `Ideas` section of `AGENTS.md` for the rules and the harness.

## The first eight

Each is a page shape from the research catalog. Sections are intents to answer, not a layout; every idea needs three examples that differ on purpose.

1. `recommendation-guide`: the best option for most people, with how it was chosen. Verdict; who this is for; picks (top, runner-up, budget, upgrade); flaws but not dealbreakers; criteria; how we chose; what we skipped; sources.
2. `comparison-matrix`: many options across the same attributes at a glance, for multi-dimensional trade-offs with no single winner. Intro; criteria legend; the matrix; per-option footnotes; how to read this; sources.
3. `should-i`: a yes, a no, or an it-depends for a binary or small-branch decision. Question restated; short answer; the three to five factors it depends on; recommendation by situation; risks; next step; questions people ask.
4. `criteria-recommendation`: explicit weighted criteria, scored options, a transparent winner. Goal; criteria and weights; score table; winner; sensitivity (what changes if a weight moves); sources.
5. `tldr-brief`: research compressed into one skimmable page for a busy reader. Headline verdict; five to seven bullets; do and do not; at most one chart or table; links deeper; sources.
6. `briefing-memo`: situation, stakes, options, recommendation, for a decision maker. Bottom line up front; context; key facts; options; recommendation; open questions; sources.
7. `scorecard`: one entity graded across dimensions with a glanceable summary. Overall grade; dimension scores; evidence per dimension; strengths and weaknesses; comparables; sources.
8. `pro-con`: a balanced two-sided view of one option or two alternatives. Context; pros; cons; who it is good and bad for; bottom line; sources.

Next wave, unscheduled: `buyers-guide`, `faq`, `explainer`, `choice-advisor`, `how-to`, `checklist`, and `visual-answer`, which becomes an idea by gaining examples and a sidecar.

## Making one

1. Copy `skills/recommendation-guide/` as the template: `SKILL.md` (keep the process and the fixed-versus-free rules, rewrite the shape and the refusals for the new intents), `idea.json`, `starter.html` (one empty section per intent), `references/patterns.md` (only the pieces this shape reaches for).
2. Write three examples from three different prompts, each with a design brief that names what it does differently from the other two, and a `.json` note saying so. Keep them under about 320 lines and honest in their footers.
3. `pnpm preview` while iterating; `pnpm capture <name>` when done; `pnpm check:ideas` before committing.

## Open

- Inlining images is guidance plus a recipe today (`references/images.md`). If real runs show agents fumbling it, a shared script that fetches, resizes, and inlines a list of image URLs is the next step; it would live outside the idea skills so they stay free of a `package.json` and an install step.

- The app treats ideas like every other skill in its index today. A compact listing for ideas as a group, or a separate budget for them, is app-side work and lives in the instrument repo's plans.
- The description eval (prompts that should and should not trigger each idea) is app-side too, since it needs the worker; the skills repo records the trigger phrases in each `SKILL.md` for it.
