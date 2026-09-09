---
name: checklist
description: A checklist as one HTML page, with grouped tickable items, priority marks, tips on the items that go wrong, and a clean print. Use when the user wants nothing forgotten in a recurring or high-stakes process.
---

# Checklist

One self-contained HTML page that makes sure nothing important is forgotten. It reads like the printable checklists the web is full of: the pre-flight list, the packing list, the launch list. Items are grouped under headings the reader recognizes, each one is a line with a real box to tick, the few that cost money or cannot be undone carry a mark, and the items that usually go wrong carry a tip. It ticks on screen, prints on a sheet or two, and reads fine with scripts off. It is not a how-to and not a plan: it does not explain how to do each item, it makes sure each one gets done.

## When to reach for it

Reach for it when the user is about to run a process where forgetting one step is expensive: moving house, shipping a feature, a trip, an audit, closing the books, opening a venue for the day. Reach for it unprompted when a conversation has produced a list of things to do and the user will do them over days rather than minutes; a list in chat scrolls away, a page with boxes does not.

Do not reach for it when the steps have an order that must be explained, when there are fewer than about eight items, when the user wants the reasoning rather than the list, or when the items are decisions rather than tasks. A checklist with one group is a to-do list; give it groups or give it up.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who runs this and when, the grouping the reader already thinks in (time, area, category), and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots. Group first, then write items as one line each, then mark priority on the few that earn it, then add a tip only where an item usually goes wrong. Cut any item the reader would never forget.
5. Check it against the refusals below, open it, tick three boxes, print-preview it, and look at it once at a laptop width. Fix what you see, then stop.

Write each item as the thing done, not the topic: "Give the landlord written notice", not "Landlord". A reader should be able to tick it without wondering what counts.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Context.** What this is for, when to run it, how long it takes, and who runs it. Two or three sentences under the title, plus a legend for the priority mark.
- **Grouped items.** The items under headings in the order the reader will meet them: by time before the event, by area of responsibility, by category of thing. Each item is one line with a real checkbox. Six to twelve items per group; a group of two is folded into its neighbor.
- **Priority marks.** A mark on the items that cost money, cannot be undone, or block everything after them. A few per page, never most; a list where everything is priority has no priorities.
- **Tips.** A line under an item that usually goes wrong, saying what goes wrong and what to check. Only where earned; a tip on every item is a manual.
- **Counter.** How many items are ticked, in one line, kept current by a few lines of script. With scripts off it reads as a count of items.
- **Print footer.** What the list was based on, what it assumes, and how it prints. Every example says its items are illustrative.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer. Fixed for this shape in particular: real checkboxes that tick with scripts off, group headings, one priority mark with a legend, and a print stylesheet so the page lands on one or two sheets with no chrome.

Free, and expected to differ between two pages made a day apart: the grouping axis, the column count, whether groups are cards or bare headings, what the priority mark looks like (a pill, a flag, a word), where tips live (under the item or in a column of their own), whether the counter is a line, a fraction, or a bar, whether ticks persist across visits, the density, and the type (a sans list or a serif magazine sidebar).

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the checkbox row, the group heading, the priority pill, the tip line, the counter script, the print stylesheet. It is vocabulary, not a layout.

The look is one light theme, on purpose; a page never switches with the reader's system theme. A checklist carries no photographs: it is text, boxes, and one icon per group at most, so the file stays small and prints clean.

## Refusals

A page that could be any of the examples with the words swapped. Items that are topics rather than things done. A list with no groups, or a group with two items. Priority on more than about a fifth of the items, or a priority mark with no legend. A tip on every item. A counter that needs script to read at all. Checkboxes drawn with icons or spans rather than real inputs. A layout that prints the counter, a sticky bar, or a shadow. Numbers in items that the prompt or a source did not give: an amount, a count, a date. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries plus one inline script for the counter, and any image that is not inline data.

## Honesty about research

Say on the page what the list was drawn from: the user's situation, a document, general practice. Where an item depends on a rule that varies by place, plan, or lease, say so in its tip rather than asserting one version. When the research is thin, the footer says the items are representative and the reader should check the ones with money on them; a short honest list is useful, a long invented one is worse than nothing.
