# Map

One self-contained HTML page that is a map. It fills the window, and the things on it float over its left edge in a card: a handful of named places, each with what it is and why it made the page; a drive with its stops in order and the line the road actually takes; parts of a city shaded with an opinion. The reader pans and zooms the map as the main thing, reads the card beside it, and closes the page knowing which is near which, how far the drive is, or which part of town to look at first.

The map is the picture and the card is the page. Every fact is in the HTML: the name, the position, the line about it, the figure beside it. The map draws those facts and adds nothing the card does not say.

## When to reach for it

Reach for it when the reader will go somewhere or judge a distance: where to eat in a city they are visiting, what is near the hotel, how the stops of a drive fall along the road, which neighborhoods to look at for a flat, where the branches or the sites or the customers are. "Where is that relative to", "how far apart", "which part of town", "show me on a map" are the phrases. Reach for it unprompted when a list of places is the answer and the reader's next question would be where they are: a list of eight restaurants in chat makes the reader open a map app eight times.

Three shapes come up over and over. **Places**: a curated set, a dozen at most, each with what it is and why it is here, numbered so the pin and the entry find each other. **A drive**: stops in order, a line through them that a routing service drew along real roads, and the legs between them with the distance and time the router gave. **Areas**: parts of a city shaded with a judgment, where to look, what is within reach, which side of a line, with the places that make the argument pinned inside them.

Do not reach for it for a dataset. Thousands of rows with coordinates is an [explorer](../explorer/template.md), where the map is one view among the filters and the grid; a map page is places a person chose. Not for a trip planned by the day, which is an [itinerary](../itinerary/template.md): that page answers when, this one answers where. Not for a plan of a room or a site the reader will move things on, which is a [whiteboard](../whiteboard/template.md). Not for turn-by-turn directions, which nobody reads off a page: the drive shows the road and the stops, links the day to a directions app, and the reader's phone does the turns. And not because the things happen to have addresses. **If nobody would look at where the pins fall in relation to each other, there is no map here**, only a list wearing a picture.

## The shape

**The page is the map.** `<main>` is fixed to the window, the map fills it, and one card floats over it and scrolls on its own: at the left edge from a tablet up, and as a sheet across the bottom on a phone. No prose column, no opening paragraph, no closing section; the card's header carries the name and the one line, and the sources fold away at its foot.

- **A name and one line.** At the top of the card: what is on the map and what the reader does with it. Not a thesis; the map is the thesis. A drive puts its totals here too, as a short row of figures.
- **The map.** Framed on the places and nothing more, in the part of the window the card leaves free, with the road or the shading on it where the shape calls for one. Streets in the reader's theme, light or dark.
- **The legend.** In the card's header, only when the page uses more than one color, size or shape. A page whose pins are all one thing has no legend.
- **The places.** The card's list: every pin, once, in the order and with the number the map gives it, with what it is, why it is on this page, what to do there, and a picture only where the reader has to recognize it. On a drive, the stops with the leg to the next one, its distance and time. On areas, each area with the verdict its shading carries and the one thing that earned it. Under each entry, small: the place's own site, and a Google Maps link for it.
- **Sources, folded.** A `details` at the card's foot whose summary is one short line. Inside: where the positions came from and when, which service drew the route or gave the minutes, what was drawn by hand, the photo credits, and the map credit.

## The rules that make a map work

**The list is the data.** Every pin is an entry in the card and every entry finds its pin: a click on an entry frames the pin and opens its popup, a click on the pin lights the entry. Their numbers agree. The script reads the places out of the list rather than out of an array of its own, so there is one copy of each fact and the two cannot disagree. `patterns.md` has the shape.

**Going to a pin and leaving the page are different clicks.** The whole entry is the click that goes to the pin, so its name is plain text. The place's own site and its Google Maps link are small links under the entry, decorated with their site's icon by the shell, so nothing about them looks like the entry's click. A Google Maps link is a search for the name and street, which lands on the place's card there rather than a dropped pin; a drive links each day to directions through its stops.

**It opens framed.** The first view is the bounds of the places with a margin, in the part of the window the card does not cover, which is what tells a reader how far apart things are before they touch anything. Not the world with a cluster in it, and not one pin at street zoom. A drive frames the whole line; areas frame the shapes and the anchor together. The frame waits for the compiled stylesheet, since until then the card has no size to measure.

**On a phone the card is a sheet, and the whole sheet scrolls.** It sits across the bottom edge at just under half the screen, one height and no controls, and its header, list and sources move as one unit; a list scrolling inside a header inside a sheet would leave a reader a few lines at a time, and a sheet that grows and shrinks is a second thing to learn for no gain. The map above it is framed on the places. Its foot is a band the share pill sits in.

**A position comes from a source.** Geocode every place, from its name and street, and write the coordinates to four decimals, which is about ten meters. Never place a pin from memory: a restaurant remembered a block off sends a reader to the wrong door. A place the geocoder cannot find is placed on its street and the entry says so. Where a service gave the coordinates, the sources name it and the date.

**A road is a line a router drew.** For a drive, ask a routing service for the route through the stops in order, at writing time, and paste what it returned: the geometry, simplified to about twenty meters, and each leg's distance and time. Never a straight line between two stops pretending to be a road, and never a road traced by hand. The times are driving without stops or traffic, and the card says so; a road that closes in weather names where to check.

**Shading is a judgment and says so.** An area drawn by hand is the page's opinion of where something is, not a boundary anyone maintains, and the sources say it was drawn by hand. A circle is arithmetic: a fifteen-minute walk is about 1.2 km at eighty meters a minute, and the legend gives the rule. A boundary that matters, a flood zone, a school catchment, a council line, is fetched from whoever publishes it and credited, or left off.

**One color means one thing.** The pick, the route, the office, the thing the page is about, is brand. Everything else is gray, or a second restrained tone at most. The warning and error steps are for a scale that needs them, a distance that grows, a verdict that worsens, and never for a rainbow of categories. A legend with more than four entries is a page that has not decided what it is showing.

**A picture only where the reader has to recognize the place.** A storefront, a viewpoint, a dish that is the reason to go: worth the kilobytes, sized to the card it sits in, and reused in the popup rather than carried twice. A photo of the skyline at the top is decoration. [`references/images.md`](../../references/images.md) has the recipe; a map's cards are small, so 480 pixels wide at quality 72 is the right weight.

**The map is the thing to use.** The page does not scroll, so the wheel zooms, a drag pans, and a pinch zooms on a phone; rotation is off, since north-up is what a reader expects of a page. A popup repeats what the entry says. Nothing is hidden behind a click.

## What varies here

Free, and expected to differ between two pages made a day apart: whether pins are numbered circles, dots, or icons; whether there are photos, and on which entries; how the entries are grouped and whether the groups are the legend; what an entry carries beside its line, a leg, a figure, a verdict; whether the card header carries figures; the register and the density.

Fixed: the page is the map, with the card at its left edge where the window is wide and across its foot where it is not, the list in the HTML with the places in it, the map framed on them, positions from a source, a route from a router, hand-drawn shading named as such, and MapLibre over OpenFreeMap's styles.

## What it may load, and what has to survive without it

MapLibre GL JS, pinned, as a classic script and its stylesheet by path from jsDelivr: about 1.1 MB together, which the page earns because the map is the whole of it. And OpenFreeMap's styles, `liberty` by day and `fiord` by night, which are the one address a page's script may build at runtime beyond the package hosts; `allowed-sources.json` names the host, and MapLibre fetches the style's tiles, glyphs and sprites from it. This pair and no other because OpenFreeMap hosts its maps for anyone's site with no key, no account and no limit on views, commercial use included, which is what a page that is copied and opened anywhere needs: there is no token in the file to expire or to leak, and no policy it breaks by being popular. OpenStreetMap's own tile servers are the obvious alternative and the wrong one: their usage policy forbids distributing an app that draws from them, and they block what looks like one. A keyed host, MapTiler, Stadia, Mapbox, would put a token in every page. Attribution is a condition of the styles; MapLibre keeps it behind a faint (i) in the corner that opens to the credit, which is what the data's own guidance allows, and the page leaves it there. OpenFreeMap runs on donations without a promise of uptime, and a style takes a moment longer to arrive than a raster tile would; the page shows its pins on the plain ground while it does.

What survives without any of it: the card with every place, the legend, the figures, and the map panel drawing the same pins on plain ground from the list's own coordinates, with a line saying the streets need the network. A reader with the network off has everything but the streets.

## Refusals

A map with no list. A map inside a page that scrolls. A pin placed from memory. A straight line called a route, or a road traced by hand. A hand-drawn shape presented as a boundary. A first view of the whole world, or of one pin at street zoom. A place whose name is the link to its website. A photo hotlinked or carried twice. A rainbow of categories. Turn-by-turn directions on the page. A price, an opening time, a rating or a rent that no source gave. A place named only in a popup. A dataset wearing pins. A sources block that reads before the places do. A map whose panel is blank with the network off.

## Honesty about the positions and the figures

A position is the easiest thing to invent and the one that sends a reader to the wrong street. Say which geocoder placed the pins and when. Say which router drew the road and when, since roads close and reopen and a route computed today is a route as of today. Where minutes came from a journey planner, say which one and what departure it was asked for, since a commute at half past eight is not a commute at noon. Say what was drawn by hand. Do not state hours, prices or whether a place is open; say what to check and where. Where the list of places is one person's shorthand rather than research, say that too.
