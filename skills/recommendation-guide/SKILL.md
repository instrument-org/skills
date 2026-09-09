---
name: recommendation-guide
description: A recommendation guide as one HTML page, with the pick for most people, runners-up, flaws, criteria, and how it was chosen. Use when the user is choosing among products, tools, vendors, or approaches.
---

# Recommendation guide

One self-contained HTML page that names the best option for most people and shows how it was chosen. It reads like a good buying guide: a verdict up top, the picks with their trade-offs, the criteria that decided it, and what was set aside. It is not a comparison table of everything, and it is not a summary of reviews; it takes a position.

## When to reach for it

Reach for it when the user is choosing among a handful of options and would benefit from a written recommendation: which headphones, which CRM, which contractor, which approach to a migration. Reach for it unprompted when research you have already done ends in a choice; a paragraph in the conversation is the weaker answer.

Do not reach for it when the user wants a raw comparison of many options on the same attributes, when there is no real choice to make, or when the answer is a single sentence.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, the first thing they must see, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the verdict must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the reader's next action. Say the pick's name and price in the verdict so it can be acted on from the first screen.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Verdict.** The pick, its price, and the one reason, in a form the eye lands on first.
- **Who this is for.** The reader it serves, and who should stop reading and look elsewhere.
- **Picks.** Top pick, runner-up, budget, and upgrade, with a line each on when that one wins. Fewer when fewer exist; never pad.
- **Flaws, not dealbreakers.** The pick's real shortcomings, specific enough to be checked.
- **Criteria.** What mattered, in order, and why the order.
- **How we chose.** What was compared, tested, or read. Honest about what was not.
- **What we skipped.** Options considered and set aside, one line each with the reason.
- **Sources.** What was read, when, and what on the page is inferred rather than sourced.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, the section order, the device that carries the verdict (a strip, a card, a ranked ledger, a pull quote), the density, the surface tone (light or dark within the palette), the components, the illustration, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: verdict strips, pick cards, criteria tables, flaw callouts, source footers. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a dark surface within the palette, as one example does, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Pictures of the picks

A guide about things people buy carries a photo of each pick, embedded in the file as a data URI so it opens anywhere, sourced from the maker's product page, and sized so the file stays small: one picture per pick, each under about 80 KB, and the whole file under about 1.5 MB, because a file that will not open in a mail client or a chat is not shareable. Read [`references/images.md`](references/images.md) for where a picture goes, how to fetch and inline one, and what to do when no picture of the actual product can be had. A software guide may leave pictures out.

## Refusals

A page that could be any of the examples with the words swapped. A hero image and three feature cards. Every section a bordered card. A verdict that names no price. A criteria list with no order. Runners-up padded to four when two exist. Sources that are not sources. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A photo of a different product than the one named. A file over about 1.5 MB, or an image left at its original size.

## Honesty about research

Say on the page what was actually read and tested and what was not. Label prices and availability with when they were seen. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest guide is useful, a confident invented one is worse than nothing.
