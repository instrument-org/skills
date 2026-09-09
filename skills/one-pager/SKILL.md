---
name: one-pager
description: A one-page pitch as one HTML page, with the problem, the proposal, why now, costs and returns, the ask, and the risks. Use when the user is proposing a project, a program, or a change to someone who decides.
---

# One-pager

One self-contained HTML page that pitches a proposal, a project, or an initiative to a reader who decides whether to hear more. It reads like the one-pager a founder hands an investor or the one-sheet that opens an internal proposal: a headline that says what it is, the problem and the proposal side by side, what it costs and what it returns, a boxed ask, and the risks with how each is handled. It is not the plan, the deck, or the business case; it earns the meeting where those get read.

## When to reach for it

Reach for it when the user wants to propose something and needs a page that fits on one screen: a new team, a tool rebuild, a program, a pilot, a partnership, a community project. Reach for it unprompted when a conversation has produced a proposal with a problem, a shape, and a cost; a paragraph in the chat is the weaker handoff.

Do not reach for it when the reader has already said yes and wants the plan, when the question is which of several options to pick (that is a briefing memo or a recommendation), or when the material is a status update rather than a pitch.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who decides and what a yes lets them do, the one sentence they must be able to repeat afterward, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the material. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the whole page should fit one screen at laptop width; it may run a little longer on a phone.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the reader's next action. The ask names the decision, who makes it, and by when, so the reader can say yes from the first screen.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **What it is.** One sentence a reader can repeat to a colleague, carried by the headline and its subhead.
- **The problem.** What is wrong or missing today, in the reader's terms, with the evidence the prompt gave.
- **The proposal.** What would exist or happen, concretely: who, what, how often, where.
- **Why now.** The window, the forcing event, or the cost of waiting.
- **Costs and returns.** What it takes and what it gives back, in the units the prompt used: dollars, weeks, hours, people, rooms. Nothing the prompt did not give or arithmetic over shown inputs cannot derive.
- **The ask.** The decision needed, from whom, by when, boxed so it cannot be missed.
- **Risks.** The two to five things most likely to go wrong, each with how it is handled.
- **Next step.** One line: what happens the week after a yes.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the register (an internal proposal, a community handout, a technical pitch), the headline's type (sans or serif), whether the problem and the proposal sit in a three-column band, a before-and-after pair, or two paragraphs, the density, whether the ask is a box, a card, or a list of things the reader can say yes to, how the risks are laid out (a strip, a list, a table), and any illustration, which is inline SVG or nothing.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the headline pair, the three-column band, the costs-and-returns pair, the ask box, the risks strip. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a warmer or darker surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Refusals

A page that could be any of the examples with the words swapped. A headline that names the category rather than the thing ("A proposal for a customer program"). A problem with no evidence. A proposal that is a list of benefits rather than a description of what would exist. Costs in units the prompt never gave, or a figure the page cannot show the arithmetic for. A percentage or a decimal that implies precision the material does not have. An ask with no date and no decider. Risks with no handling, or a risks section that says there are none. A page that takes two screens at laptop width when one would do. Every section a bordered card. Any `<link>` or `<script>` beyond the ones the starter carries, and any image that is a link or a relative path rather than inline SVG or inline data: the file has to open from a USB stick.

## Honesty about the numbers

Say on the page where each figure came from: the prompt, a source, or arithmetic over inputs the page shows. When the user gave no numbers, the page carries none and says what would have to be measured; "about a day a week of one product manager's time" is better than an invented dollar figure. Label estimates as estimates, and when the material is thin, the footer says so rather than performing certainty; a thin honest pitch can still earn the meeting, and a confident invented one loses it the moment a reader checks.
