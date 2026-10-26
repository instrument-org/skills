# Map patterns

These are the techniques only a map needs. The panel, the card, the pins, the link from list to pin, the phone sheet and the offline drawing are all in `skeleton.html`, and they stay the same from map to map. What changes is the places, which you research before you write the page. The recipes below are what to run while you write, and what to add to the script for a drive or for areas.

## The list is the data

Every entry in `#places` carries `data-lat` and `data-lon`. The script numbers the entries in document order, draws a pin for each, and builds each popup from the entry's own heading, first paragraph and picture. So you write all of a map's content once, in the HTML, and the map can't show a place the list doesn't name. An entry's number is its position in the list, which is why the visible number in the entry has to be written in the same order.

## Geocoding a pin

Take every position from a geocoder, never from memory. Nominatim, which runs over OpenStreetMap, answers a name and a street with coordinates and the address it matched, and that address is how you check it found the right door. It asks for a real user agent and at most one request a second.

```python
import json, time, urllib.parse, urllib.request

def geocode(query: str, viewbox: str | None = None) -> dict:
    """Coordinates to four decimals and the address matched. viewbox is
    'west,north,east,south' to keep a chain's branch inside one city."""
    params = {"q": query, "format": "json", "limit": 1}
    if viewbox:
        params |= {"viewbox": viewbox, "bounded": 1}
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "instrument-page/1.0"})
    hit = json.load(urllib.request.urlopen(request))[0]
    time.sleep(1.1)
    return {"lat": round(float(hit["lat"]), 4), "lon": round(float(hit["lon"]), 4), "matched": hit["display_name"]}

print(geocode("Katz's Delicatessen, East Houston Street, New York"))
# {'lat': 40.7223, 'lon': -73.9874, 'matched': "Katz's Delicatessen, 205, East Houston Street, ..."}
```

Read `matched` for every place. A chain returns whichever branch ranks first, so pass a `viewbox` around the city or name the street. A place Nominatim does not know is placed on its street (geocode the street and number) and the entry says "on Orchard Street" rather than pretending to the door. Keep the matched street: the Google Maps link below wants it.

## Links out

Put two small links under an entry, never on its name, since clicking the entry itself goes to the pin. One is the place's own site, with its domain as the link text. The other is Google Maps, through its documented URL scheme, which needs no key. A search for the name and street lands on the place's card there, while coordinates alone would drop a bare pin.

```python
import urllib.parse

def google_maps(name: str, street: str) -> str:
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(f"{name}, {street}")

def google_directions(stops: list[tuple[float, float]]) -> str:
    """Driving directions through the stops in order. The scheme takes up to
    nine waypoints between origin and destination, so split a longer drive by day."""
    at = lambda s: f"{s[0]:.4f},{s[1]:.4f}"
    q = {"api": "1", "travelmode": "driving", "origin": at(stops[0]), "destination": at(stops[-1])}
    if len(stops) > 2:
        q["waypoints"] = "|".join(at(s) for s in stops[1:-1])
    return "https://www.google.com/maps/dir/?" + urllib.parse.urlencode(q)
```

Write `&` as `&amp;` in the HTML. Apple Maps takes the same idea as `https://maps.apple.com/?q=<name>&ll=<lat>,<lon>`; one map app link per entry is enough, and Google's is the one most readers have.

## A picture for a place

Wikimedia Commons has a photo of most places worth a pin, with a license that allows it. Search the file namespace, read the license and the author from `extmetadata`, and take the thumbnail rather than the original:

```python
def commons(query: str) -> dict:
    api = "https://commons.wikimedia.org/w/api.php?"
    search = json.load(urllib.request.urlopen(api + urllib.parse.urlencode(
        {"action": "query", "list": "search", "srsearch": query, "srnamespace": 6, "srlimit": 5, "format": "json"})))
    title = search["query"]["search"][0]["title"]
    info = json.load(urllib.request.urlopen(api + urllib.parse.urlencode(
        {"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 800, "format": "json"})))
    image = next(iter(info["query"]["pages"].values()))["imageinfo"][0]
    meta = image["extmetadata"]
    return {"thumb": image["thumburl"], "page": image["descriptionurl"], "license": meta["LicenseShortName"]["value"], "artist": meta["Artist"]["value"]}
```

Look at the picture before using it: the first hit for a restaurant is as often a plate as a storefront, and either is fine so long as it is the place. Then crop it to 3:2 and encode it at 480 by 320, quality 72, with the recipe below; a map's cards are small, and the popup reuses the card's image element rather than carrying a second copy. Credit every photo in the sources: author, license, and a link to its Commons page. `CC0`, `CC BY` and `CC BY-SA` are fine; leave a photo with any other license alone.

```python
import base64, io, urllib.request
from PIL import Image  # pip install pillow

def inline_photo(url: str, w: int = 480, h: int = 320, quality: int = 72) -> str:
    """Center-crops to w:h, resizes, and returns a data: URI to paste as the img src."""
    req = urllib.request.Request(url, headers={"User-Agent": "instrument-page/1.0"})
    img = Image.open(io.BytesIO(urllib.request.urlopen(req).read())).convert("RGB")
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    out = io.BytesIO()
    img.crop((left, top, left + w, top + h)).save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode()
```

Write the `img` with `width="480" height="320"` and real `alt` text.

## Colors the map can paint

MapLibre's paint properties take color strings, and most foundation tokens are `light-dark()` pairs as text, so a token is resolved through a real property before it is handed over. Add this probe to the page's script as `tone`:

```js
const probe = document.createElement("span");
probe.style.display = "none";
document.body.append(probe);
const tone = (name) => {
  probe.style.color = `var(${name})`;
  return getComputedStyle(probe).color; // "rgb(14, 120, 105)"
};
```

Add anything you draw on the map itself inside `map.on("style.load", …)`. A change of theme is a change of style, and a new style starts without any of the page's layers. The pins are DOM elements, so they stay. Read `tone` inside that handler so the color is the current theme's. Put drawn layers under the style's labels by passing the first symbol layer's id as `beforeId`, so a road or a shape never covers a street name.

## A drive along real roads

Draw a road as the line a routing service gives you. OSRM's public demo server routes over OpenStreetMap with no key. Give it the stops in order as `lon,lat` pairs, and ask for the full geometry as an encoded polyline, which is a tenth the size of plain coordinates:

```python
stops = [("Golden Gate Bridge Welcome Center", 37.8078, -122.4749), ("Pigeon Point Lighthouse", 37.1821, -122.3941), ...]
coords = ";".join(f"{lon},{lat}" for _, lat, lon in stops)
url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=polyline"
route = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "instrument-page/1.0"})))["routes"][0]
for (name, *_), leg in zip(stops, route["legs"]):
    print(name, round(leg["distance"] / 1000, 1), "km", round(leg["duration"] / 60), "min")
print(len(route["geometry"]), "characters of polyline")
```

Each leg is the drive from one stop to the next; `distance` is meters and `duration` seconds of driving without stops or traffic, and the card says that. A full-overview polyline for a long drive is 50 KB, most of it detail no zoom on the page will show: decode it, simplify with Douglas-Peucker at about 0.0002 degrees (twenty meters), and re-encode, which brings 17,000 points to 1,500 and 6 KB. Check one thing before trusting the line: a leg whose time is far longer than its distance suggests is a road the router found closed and detoured round, and the card should say which.

In the page, the route is one string and a decoder, and the line is a GeoJSON source drawn under the labels, in brand:

```js
// Google's polyline encoding, precision 5: each coordinate is a delta from the last, five bits a character.
const decode = (s) => {
  const out = [];
  let i = 0,
    lat = 0,
    lon = 0;
  while (i < s.length) {
    for (const which of [0, 1]) {
      let shift = 0,
        result = 0,
        b;
      do {
        b = s.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d;
      else lon += d;
    }
    out.push([lat / 1e5, lon / 1e5]);
  }
  return out;
};
const line = decode(ROUTE);
map.on("style.load", () => {
  const labels = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: line.map(([lat, lon]) => [lon, lat]),
      },
    },
  });
  map.addLayer(
    {
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": tone("--accent"),
        "line-width": 4,
        "line-opacity": 0.9,
      },
    },
    labels,
  );
});
frame(line);
```

GeoJSON uses `[lon, lat]`, while the list and the polyline use `[lat, lon]`, so swap them once, here. The stops are the list's entries as usual, each with its leg to the next one written in: the distance in the reader's units, the time as hours and minutes, and the day it falls on, with a directions link on each day's heading. The offline drawing gets the same line, projected with the pins' `x` and `y`, as a `<polyline class="outline" data-tone="accent">`, and its extent is the line's rather than the stops'.

## Shaded areas

An area is an entry with a ring of points instead of a single point. Write the ring on the entry as `data-ring="lat,lon lat,lon …"` and a `data-verdict` the legend explains, then draw the rings as one GeoJSON source with the color chosen per feature, and frame the map on all of them:

```js
const verdictColor = () => [
  "match",
  ["get", "verdict"],
  "near",
  tone("--accent"),
  "change",
  tone("--warning-500"),
  tone("--gray-400"),
];
map.on("style.load", () => {
  const labels = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
  map.addSource("areas", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: places.map((p) => ({
        type: "Feature",
        properties: { n: p.n, verdict: p.verdict },
        geometry: {
          type: "Polygon",
          coordinates: [[...p.ring, p.ring[0]].map(([lat, lon]) => [lon, lat])],
        },
      })),
    },
  });
  map.addLayer(
    {
      id: "areas",
      type: "fill",
      source: "areas",
      paint: { "fill-color": verdictColor(), "fill-opacity": 0.22 },
    },
    labels,
  );
  map.addLayer(
    {
      id: "areas-line",
      type: "line",
      source: "areas",
      paint: { "line-color": verdictColor(), "line-width": 1.5 },
    },
    labels,
  );
});
// A click on a shape is a click on its entry. Registered once; the listener is the map's and survives a change of style.
map.on("click", "areas", (event) =>
  light(places[event.features[0].properties.n - 1]),
);
map.on("mouseenter", "areas", () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "areas", () => {
  map.getCanvas().style.cursor = "";
});
```

Each entry carries a small square of its verdict's color before its line, so the list and the shading agree without a trip to the legend; the same move ties any entry to a color the map gives it. A polygon's ring closes on itself, so the first corner is repeated at the end. A ring drawn by hand is five to eight corners placed on streets and landmarks the geocoder returned, and the sources say it was drawn by hand. Geocode the corners rather than guessing them: a neighborhood remembered a kilometer east is an opinion about the wrong streets. The offline drawing gets the same rings as `<polygon>`s with the verdict's `data-tone` (`accent`, `warn`, `muted`) and `class="wash"` plus an `outline` copy, so both themes hold.

A circle is arithmetic, so it's honest as long as its rule is on the page. MapLibre can't draw a circle in meters, so draw one as a polygon of 64 points around the center, 1,200 m out for a fifteen-minute walk at eighty meters a minute, and say exactly that in the legend.

Minutes for a commute come from the transport authority's own planner where one answers, asked for a real departure, and the sources name it and the time asked. Transport for London's journey planner answers without a key: `https://api.tfl.gov.uk/Journey/JourneyResults/<from>/to/<to>?time=0830&timeIs=Departing&date=<yyyymmdd>&mode=tube,overground,national-rail,walking`, where a station is its `icsCode` from `https://api.tfl.gov.uk/StopPoint/Search/<name>`. Take the shortest journey's `duration` and its legs' line names.

## The anchor pin

When a page has an anchor, such as the office a commute runs to or the hotel the restaurants are near, give the anchor a star in the page's ink instead of a number. The numbered pins then read as the choices, and the star as the fixed point. It is a DOM marker like the others, `<div class="pin pin-anchor"><span><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="m8 1.5 1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.2l-3.9 2.3 1-4.4-3.4-3 4.5-.5z"/></svg></span></div>`, with `.pin-anchor span { background: var(--ink); color: var(--paper); }` (and the current pin then takes a ring instead of ink), and it is in the frame with the shapes.

## Framing

`frame(points)` in `skeleton.html` fits a set of `[lat, lon]` points into the part of the panel the card leaves free, with a margin wide enough that a pin at the edge is whole, and caps the zoom at 16 so a page with one place, or two a block apart, opens on a neighborhood rather than a rooftop. An entry's click frames its own point at street zoom, or its ring on an areas page. On a drive, frame the line rather than the stops, since the road bows away from the straight line between them.

## A map inside a longer page

A site-visit plan, a day sheet, a house manual or a neighborhood guide is a document with a map in it, rather than a map with a card on it. Nearly all of the script in `skeleton.html` carries over. The places are still read from the list, the pins are still DOM elements, and the plain drawing to scale still stands in when the library or the streets never arrive. Four things change.

- **The page scrolls, so the map must not eat the scroll.** Pass `cooperativeGestures: true` to the `Map`, on a touch screen at least: one finger, or a wheel where it is on, scrolls the page, and a modifier key or two fingers moves the map, with MapLibre's own hint saying so. Without it a reader on a phone who lands on the map cannot get past it.
- **The container is a box, not the window.** Give it a height in the page's own style (`height: 60vh` on a phone; `position: sticky; top: 1rem; height: calc(100vh - 2rem)` beside the list in a `.split` on a laptop), drop the `fixed` main, and let the list be ordinary page content, and frame with an even padding, since there is no card to keep clear of.
- **Several maps on one page each get their own call.** Tonight's venue and tomorrow's drive are two containers and two lists; wrap the kit in a function of the container and its list rather than copying it, and let each draw its own fallback.
- **Clustered places with one far away need named frames.** Six stops within a mile and a hotel forty minutes out frame as a view of the whole county with the six in a smear. Offer two or three frames as buttons ("The venue", "In town", "Everything"), open on the one the reader needs first, and put the outlier in the list with its distance.

A place the page invented on a real street has no card on Google Maps, so its link searches the pin's coordinates, `query=<lat>,<lon>`, rather than a name and street that would land on the whole road.

## Units

A drive in the reader's units: miles for a US road, kilometers elsewhere, and both only when the readers are split. Hours and minutes rather than decimal hours. A leg's figure is rounded to the ten minutes and the whole mile, since the router's second is not a claim the page can stand behind.
