---
name: itinerary
description: A trip as one HTML page, day by day: the plan at a glance, each day in morning, afternoon, and evening, logistics, backups, and the places. Use when the user has a destination and a span of days to plan.
---

# Itinerary

One self-contained HTML page that lays a trip out day by day, for the traveler to carry and follow. It reads like the "four days in Lisbon" plan a good travel site publishes: the trip at a glance, each day in morning, afternoon, and evening, what to book ahead, what to carry, and what to do when it rains. It is not a list of everything worth seeing and it is not a guidebook; it commits to a sequence a person can walk.

## When to reach for it

Reach for it when the user has a destination and a span of days and wants them planned: a long weekend somewhere, ten days by rail, four days with a toddler, a work trip with two free afternoons. Reach for it unprompted when research about a place ends in "so here is what I would do each day"; a paragraph of suggestions in the conversation is the weaker answer.

Do not reach for it when the user is still choosing where to go (that is a recommendation guide or a should-i), when the trip is one afternoon, or when the ask is only a packing list or only a budget.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose trip is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who carries this and where they will read it, the first thing they must see, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the plan. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the trip at a glance must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width and once at a phone width, because this page is carried. Fix what you see, then stop.

Write the page for a traveler standing on a corner with a phone. Every block says where to be, what to do there, and how to get to the next one.

## The shape

Each slot is an intent. Answer it in whatever form suits the trip.

- **At a glance.** The dates or day count, the base (where they sleep), the pace, and who the plan is for, in a form the eye lands on first.
- **Days.** One per day, each with morning, afternoon, and evening. A block names the place, what to do there, and roughly how long. Naps, rests, and free hours are blocks too, and travel between cities is its own row.
- **Logistics.** Getting around, what to book ahead and how far ahead, and what to carry. Anything that must happen before leaving home is marked so it cannot be missed.
- **Budget.** A rough figure per day or per trip, only where the prompt gave a budget or a price level to answer to; otherwise what drives the cost, in words.
- **Backups.** What to do when it rains, when the group is tired, or when a place is closed: one swap per day at most, or one rain plan for the whole trip.
- **Places.** Every place on the page, listed once, with what it is and which day it belongs to.
- **Sources.** What was read, when hours and prices were seen, and what is inferred.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, the device that carries the days (a grid of cards, a timeline spine, a numbered rail beside a narrative), how time of day is marked (a label column, a tint, a clock), the density, the surface tone (light or dark within the palette), whether the places list leads or closes, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: day cards, time-of-day blocks, book-ahead tags, the places list, the logistics strip, the rain-plan callout. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a dark surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Pictures

A trip page may open with one photo of the place, embedded as a data URI so the file opens anywhere, cropped wide (about 16:7) so it reads as a banner rather than a postcard, resized to about 960 pixels wide as a JPEG at quality 70 so it stays under about 150 KB, and credited in the footer with title, creator, license, and a link. One is enough: the plan is the content, and a page of photos is a brochure. Use a rights-clear source (Openverse, Wikimedia Commons, the traveler's own), and when none can be had, leave the slot empty. Never a photo of a different city than the one named.

## Refusals

A page that could be any of the examples with the cities swapped. A day that is a list of attractions with no order and no travel between them. Three sights in a morning that are an hour apart. A time to the minute when the prompt fixed no times. An exact price for a ticket that was not looked up. A budget figure where the prompt gave none. Every section a bordered card. A places list that repeats what the day blocks already said. A rain plan that is "visit a museum" with no museum named. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a phone with no signal, which a hyperlink does nothing to prevent. A file over about 1.5 MB.

## Honesty about research

Hours, prices, and whether a place needs a booking change, and the page is carried weeks after it is made. Say when they were seen. Times on the page are rough unless the prompt fixed them, and the page says so. When a place was not checked, the page says "confirm hours" beside it rather than performing certainty; a plan with three "confirm" tags is useful, and a confident plan that sends a family to a closed museum is worse than nothing.
