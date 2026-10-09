# Map kit

A page that is a map. The map fills the window and the places float over its left edge in a card (a sheet across the bottom on a phone): a handful of named places, each with what it is and why it made the page; a drive with its stops in order and the line the road actually takes; or parts of a city shaded with a judgment. The reader pans and zooms the map and reads the card, and leaves knowing which is near which, how far the drive is, or which part of town to look at first.

## When to reach for it

When the reader will go somewhere or judge a distance: where to eat near the hotel, how the stops of a drive fall along the road, which neighborhoods to look at for a flat, where the sites are. "How far apart", "which part of town", "show me on a map". Reach for it unprompted when a list of places is the answer and the reader's next question would be where they are.

Not for a dataset of thousands of rows (that is a table with a filter, perhaps with a map beside it), not for a trip planned by the day (a timeline or day grid from `cookbook.md`, which answers when rather than where), not for turn-by-turn directions, and not because things happen to have addresses. If nobody would look at where the pins fall relative to each other, write a list.

## Files

- `skeleton.html`: a working map page on the foundation. Copy it, keep its style and script, and replace the direction comment, title, description, card header, places and sources. It frames the map on the places, links each entry to its pin and back, switches the streets with the page's theme, turns the card into a phone sheet, and draws the pins to scale on plain ground when MapLibre or WebGL is missing.
- `patterns.md`: the recipes to run at writing time: geocoding with Nominatim, Google Maps links, Commons photos and inlining them, resolving tokens for MapLibre (`tone`), a drive drawn from a router's polyline, shaded areas, an anchor pin, framing, a map inside a longer scrolling page, units.

## How it sits on the foundation

A map page is an ordinary page: it has the direction comment, `<html data-shape="card" data-feel="...">`, a `<title>` and description, one `h1` (in the card), and the map element marked `class="hero"`. It is built and checked like any other:

```
node <skill>/page.mjs page.html --inputs request.md <input files>
```

`main.map-page` is fixed to the window, so the page does not scroll; the card does. Colors come only from foundation tokens (`--accent`, `--paper`, `--line`, `--muted`, `--ink`, `--gray-N`), so dark mode and the share widget's theme switch work, and the streets follow via the `instrument:theme` event.

## Worked example

Five cheap eats in Manhattan, measured from a hotel at Union Square.

1. Save the request as `request.md`. Geocode every place with the `geocode` recipe in `patterns.md` and read each `matched` address. Compute every distance with a script (straight-line km, minutes at 80 m a minute), never by eye.
2. Copy `skeleton.html` to `page.html`. Write the point as the `h1`: "Three walkable, two need the subway". The kicker says what and from where: `Map · 5 places · from Union Square`.
3. Write one `li` per place, in the order the map numbers them:

```html
<li data-lat="40.7305" data-lon="-74.0021">
  <span class="num">1</span>
  <div>
    <h3>Joe's Pizza</h3>
    <p class="what">West Village · slices · about 15 min walk</p>
    <p class="why">
      A plain cheese slice at the counter; the cheapest stop here.
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

4. When pins mean two things (walkable or not), give the others `data-kind="far"`, keep the legend, and add `.pin.far span, #places .num.far { background: var(--gray-500); color: var(--paper); }` with the pin's class set from `p.el.dataset.kind`. When all pins are one kind, delete the legend.
5. Write the sources as a short list: geocoder and date, how minutes were computed, what is not stated (hours, prices), the map credit.
6. Build and check it as SKILL.md step 5 says (`page.mjs`, then `lib/probe.js` in your browser), fix every FAIL, and look at the page. To see the offline drawing, copy the page with the MapLibre script URL broken and check that copy too.

## Rules that make it work

- **The list is the data.** Every pin is an entry with `data-lat` and `data-lon`; the script reads the list, numbers it in document order, and builds popups from it. No second array.
- **A position comes from a geocoder**, four decimals, never from memory. A place the geocoder cannot find is placed on its street and the entry says so.
- **A road is a line a router drew** (OSRM in `patterns.md`), simplified and pasted in, with each leg's distance and time from the router. Never a straight line called a route.
- **Shading is a judgment and says so**; a circle is arithmetic with its rule in the legend; a real boundary is fetched from its publisher and credited, or left off.
- **It opens framed** on the places, in the part of the window the card leaves free. Not the world, not one rooftop.
- **One color means one thing.** Accent for the pick or the route, gray for the rest, at most one more restrained tone. A legend over four entries means the page has not decided.
- **Going to a pin and leaving the page are different clicks.** The entry's name is plain text; the site and a Google Maps search are small links under it.
- **A picture only where the reader has to recognize the place**, 480 by 320 at quality 72, inline, reused by the popup.
- **Loads**: MapLibre GL JS 5.24.0 and its stylesheet from jsDelivr, pinned, and OpenFreeMap's `liberty` and `fiord` styles (no key, no limit, attribution kept behind the (i)). OpenStreetMap's own tile servers forbid this use; keyed hosts would put a token in every page.
- **Offline**, the card, legend and figures are all in the HTML, and the map draws the same pins to scale with a line saying the streets need the network.

## Refusals and honesty

A map with no list; a pin from memory; a straight line called a route; a hand-drawn shape presented as a boundary; a place whose name is the link to its website; a rainbow of categories; turn-by-turn directions; a price, opening time, rating or rent no source gave. Say which geocoder placed the pins and when, which router drew the road and when, which journey planner gave minutes and for what departure, and what was drawn by hand.
