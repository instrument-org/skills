# Map kit

This kit makes a page that is a map. The map fills the window, and the places float over its left edge in a card, which becomes a sheet across the bottom on a phone. The map can show a handful of named places, each with what it is and why it's on the page; a drive, with its stops in order and the line the road actually takes; or parts of a city shaded to show a judgment. The reader pans and zooms the map, reads the card, and comes away knowing which places are near each other, how far the drive is, or which part of town to look at first.

## When to use it

Use it when the reader will go somewhere or needs to judge a distance: where to eat near the hotel, how the stops of a drive fall along the road, which neighborhoods to look at for a flat, or where the sites are. Requests like "how far apart", "which part of town" and "show me on a map" call for it. Use it without being asked when the answer is a list of places and the reader's next question would be where they are.

Don't use it for a dataset of thousands of rows (that's a table with a filter, perhaps with a map beside it), for a trip planned day by day (use a timeline or a day grid from `cookbook.md`, which answer when rather than where), for turn-by-turn directions, or just because the things happen to have addresses. If nobody would look at where the pins fall relative to each other, write a list.

## Files

- `skeleton.html` is a working map page on the foundation. Copy it, keep its style and script, and replace the direction comment, title, description, card header, places and sources. It frames the map on the places, links each entry to its pin and back, switches the streets with the page's theme, turns the card into a sheet on a phone, and draws the pins to scale on plain ground when MapLibre or WebGL is missing.
- `patterns.md` holds the recipes to run while you write: geocoding with Nominatim, Google Maps links, Commons photos and how to inline them, resolving tokens for MapLibre (`tone`), a drive drawn from a router's polyline, shaded areas, an anchor pin, framing, a map inside a longer scrolling page, and units.

## How it sits on the foundation

A map page is an ordinary page. It has the direction comment, `<html data-layout="column" data-feel="...">`, a `<title>` and description, one `h1` (in the card), and the map element marked `class="hero"`. You build and check it like any other page:

```
node <skill>/page.mjs page.html --inputs request.md <input files>
```

`main.map-page` is fixed to the window, so the page doesn't scroll, but the card does. Colors come only from foundation tokens (`--accent`, `--paper`, `--line`, `--muted`, `--ink`, `--gray-N`), so dark mode and the share widget's theme switch work, and the streets follow along through the `instrument:theme` event.

## Worked example

This example maps five cheap places to eat in Manhattan, measured from a hotel at Union Square.

1. Save the request as `request.md`. Geocode every place with the `geocode` recipe in `patterns.md`, and read each `matched` address. Work out every distance with a script (straight-line km, and minutes at 80 m a minute), never by eye.
2. Copy `skeleton.html` to `page.html`. Write the point as the `h1`: "Three are walkable, two need the subway". The kicker says what the map shows and from where: `Map · 5 places · from Union Square`.
3. Write one `li` for each place, in the order the map numbers them:

```html
<li data-lat="40.7305" data-lon="-74.0021">
  <span class="num">1</span>
  <div>
    <h3>Joe's Pizza</h3>
    <p class="what">West Village · slices · about 15 min walk</p>
    <p class="why">
      A plain cheese slice at the counter, and the cheapest stop on the list.
    </p>
    <p class="out">
      <a
        href="https://www.google.com/maps/search/?api=1&amp;query=Joe%27s%20Pizza%2C%207%20Carmine%20St%2C%20New%20York"
        >Google Maps</a
      >
    </p>
  </div>
</li>
```

4. When the pins mean two things (walkable or not), give the others `data-kind="far"`, keep the legend, and add `.pin.far span, #places .num.far { background: var(--gray-500); color: var(--paper); }`, with the pin's class set from `p.el.dataset.kind`. When all the pins mean the same thing, delete the legend.
5. Write the sources as a short list: the geocoder and the date, how you worked out the minutes, what the sources don't state (hours, prices), and the map credit.
6. Build and check the page as SKILL.md step 5 describes (`page.mjs`, then `lib/probe.js` in your browser), fix every FAIL, and look at the page. To see the offline drawing, make a copy of the page with the MapLibre script URL broken, and check that copy too.

## Rules that make it work

- **The list is the data.** Every pin is an entry with `data-lat` and `data-lon`. The script reads the list, numbers it in document order and builds the popups from it, so there's no second array to keep in step.
- **Positions come from a geocoder**, to four decimals, never from memory. When the geocoder can't find a place, place it on its street and say so in the entry.
- **A road is a line a router drew** (OSRM in `patterns.md`), simplified and pasted in, with each leg's distance and time taken from the router. Never draw a straight line and call it a route.
- **Shading is a judgment, so label it as one.** A circle is arithmetic, so give its rule in the legend. Fetch a real boundary from whoever publishes it and credit them, or leave it off.
- **The map opens framed on the places**, in the part of the window the card leaves free. Don't open on the whole world or on a single rooftop.
- **Each color means one thing.** Use the accent for the pick or the route, gray for the rest, and at most one more restrained tone. If the legend needs more than four entries, the page hasn't decided what matters.
- **Going to a pin and leaving the page are separate clicks.** The entry's name is plain text, and the place's site and a Google Maps search are small links under it.
- **Show a picture only where the reader has to recognize the place**, at 480 by 320 and quality 72, inlined, and reused by the popup.
- **What it loads:** MapLibre GL JS 5.24.0 and its stylesheet from jsDelivr, pinned, and OpenFreeMap's `liberty` and `fiord` styles, which need no key and have no limit, with the attribution kept behind the (i). OpenStreetMap's own tile servers forbid this use, and hosts that need a key would put a token in every page.
- **Offline,** the card, the legend and the figures are all in the HTML, and the map draws the same pins to scale with a line saying the streets need the network.

## What not to draw, and what to say

Don't make a map with no list, a pin placed from memory, a straight line called a route, a hand-drawn shape presented as a boundary, a place whose name links to its website, a rainbow of categories, turn-by-turn directions, or a price, opening time, rating or rent that no source gave. Say which geocoder placed the pins and when, which router drew the road and when, which journey planner gave the minutes and for what departure, and what you drew by hand.
