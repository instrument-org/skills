---
name: how-to
description: A how-to guide as one HTML page, with the goal, time, and cost, what to have ready, steps with pitfalls where they bite, variations, and a done checklist. Use when the user asks how to do, set up, or fix something.
---

# How-to guide

One self-contained HTML page that gets the reader from where they are to a finished thing, in order. It reads like a good tutorial or a playbook: the goal and what it costs up top, what to have ready before starting, the steps with the traps marked where they happen, and a checklist that says when to stop. It is not an explainer of how something works, and it is not a list of routes; it commits to one route and walks it.

## When to reach for it

Reach for it when the user asks how to do, set up, install, fix, move, or run something and the answer is a procedure with more than three steps: how to put smart devices on their own network, how to replace a faucet, how to run a team's first retro. Reach for it unprompted when research you have done ends in a sequence someone will follow with their hands; a numbered list in the conversation is the weaker answer because it cannot carry the warnings at the right step or be ticked off.

Do not reach for it when the user wants to understand rather than do, when the real question is which of several routes to take, when the whole answer fits in three lines, or when the procedure is one a page should not stand in for a professional on: say so instead.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who follows this and what they are holding while they do, the first thing they must know before they start, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the goal with its time and cost must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for a reader with one hand busy. Each step opens with the action in a short bold line so the eye can find its place after looking away; the paragraph under it is for the first read, the line is for every read after.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Goal.** What the reader will have at the end, how long it takes, what it costs, and how hard it is, in a form the eye lands on first.
- **Before you start.** Tools, materials, access, and facts to have in hand, grouped so the reader can gather them in one trip, with the check that says whether this guide fits their situation. A stop-and-get-help condition belongs here, before the first step.
- **Steps.** Numbered, each with an action line, a paragraph, a time, and the console, settings, or script it needs. As many as the procedure has; a step that holds two actions is two steps.
- **Pitfalls.** Where people go wrong, placed at the step where it happens rather than collected at the end. Only a pitfall that spans steps gets its own section.
- **Variations.** What changes when the reader's situation differs: another version, another room, a remote team. Short, and keyed to the step each one alters.
- **You are done when.** Observable results, as real checkboxes the reader ticks to know they can stop. Results, never the steps repeated.
- **Sources.** What was read, which version or model the steps were written against, whether the procedure was run, and what is inferred.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, whether the step numbers sit in a rail beside the steps or inside the cards, whether the steps are cards or a timeline, the density, the register (a warm serif for a job done with tools, a tight sans for a console), the surface tone (light or dark within the palette), the components, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: step cards, prerequisites lists, inline pitfall callouts, time chips, code blocks, say blocks, done checklists. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a dark surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Numbers and code

A step carries a time because the procedure has one, and the total in the goal is the sum of the steps. A cost is a range with what it covers. Console commands, settings paths, and scripts are quoted exactly, in a code block, against a named version; a command the reader cannot paste is prose, not code. Never invent a flag, a menu path, or a part number to make a step look precise; when the exact spelling is not known, say what to look for and where.

## Refusals

A page that could be any of the examples with the words swapped. Steps with no times. A goal with no cost. A step that hides two actions. Pitfalls collected at the bottom, where the reader finds them after the mistake. A done checklist that repeats the steps instead of naming results. A code block around something that is not code. A guide for a procedure that should have said "call someone" and did not. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB.

## Honesty about research

Say on the page what was read, which version or model the steps assume, and whether the procedure was run. Menus move, parts change, and a step written against last year's firmware says so. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest guide is useful, a confident invented one can break something.
